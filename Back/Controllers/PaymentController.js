const asyncHandler = require("express-async-handler");
const Payment = require("../models/Payment");
const Order = require("../models/Order");

const paymentMethods = [
  { key: "cod", label: "Cash on Delivery", provider: "manual" },
];

const getPaymentMethods = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    paymentMethods
  });
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user.id })
    .populate("order", "totalPrice orderStatus paymentStatus")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    payments
  });
});

const createPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod, transactionId, providerReference } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  const existingPayment = await Payment.findOne({ order: order._id });
  if (existingPayment && existingPayment.status === "paid") {
    return res.status(400).json({ success: false, message: "Order already paid" });
  }

  const normalizedMethod = paymentMethod || order.paymentMethod || "cod";
  const allowedMethods = ["cod", "card", "paypal", "fawry", "vodafone_cash", "paymob"];
  if (!allowedMethods.includes(normalizedMethod)) {
    return res.status(400).json({ success: false, message: "Unsupported payment method" });
  }

  if (normalizedMethod !== "cod") {
    return res.status(503).json({
      success: false,
      message: "Online payment processing is unavailable until a payment provider is configured."
    });
  }

  if (transactionId || providerReference) {
    return res.status(400).json({
      success: false,
      message: "Client-supplied transaction references cannot verify payment."
    });
  }

  const nextStatus = "pending";

  const payment = await Payment.findOneAndUpdate(
    { order: order._id },
    {
      user: req.user.id,
      order: order._id,
      amount: order.totalPrice,
      currency: "EGP",
      paymentMethod: normalizedMethod,
      provider: "manual",
      providerReference: null,
      transactionId: null,
      status: nextStatus,
      paymentResult: undefined,
      paidAt: undefined,
      failedAt: undefined
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  order.paymentMethod = normalizedMethod;
  order.paymentStatus = payment.status;
  order.isPaid = payment.status === "paid";
  order.paidAt = payment.status === "paid" ? new Date() : order.paidAt;
  order.paymentResult = payment.paymentResult || order.paymentResult;
  if (payment.status === "paid" && order.orderStatus === "pending") {
    order.orderStatus = "processing";
  }
  await order.save();

  res.status(201).json({
    success: true,
    payment,
    order
  });
});

const refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("order");

  if (!payment) {
    return res.status(404).json({ success: false, message: "Payment not found" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only admin can refund payments" });
  }

  if (payment.status !== "paid") {
    return res.status(400).json({ success: false, message: "Only paid payments can be refunded" });
  }

  const { reason } = req.body;

  payment.status = "refunded";
  payment.refundedAt = new Date();
  payment.refundReason = reason || "Refund processed by admin";
  payment.failedAt = undefined;

  if (payment.order) {
    payment.order.paymentStatus = "refunded";
    payment.order.isPaid = false;
    payment.order.orderStatus = payment.order.orderStatus === "delivered" ? "delivered" : "cancelled";

    await payment.order.save();
  }

  await payment.save();

  res.status(200).json({
    success: true,
    message: "Refund status recorded. This endpoint does not transfer funds; complete any external refund separately.",
    payment
  });
});

const handlePaymentWebhook = asyncHandler(async (req, res) => {
  const provider = req.params.provider;
  const webhookToken = req.headers["x-webhook-token"];

  if (!process.env.PAYMENT_WEBHOOK_SECRET || webhookToken !== process.env.PAYMENT_WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: "Invalid webhook signature" });
  }

  const { eventId, eventType, orderId, transactionId, status, amount, email } = req.body;

  if (!orderId || !status) {
    return res.status(400).json({ success: false, message: "Missing webhook payload" });
  }

  const payment = await Payment.findOne({ order: orderId });
  if (!payment) {
    return res.status(404).json({ success: false, message: "Payment not found" });
  }

  const alreadyProcessed = payment.webhookEvents.some((event) => event.eventId === eventId && event.eventId);
  if (eventId && alreadyProcessed) {
    return res.status(200).json({ success: true, message: "Event already processed" });
  }

  payment.webhookEvents.push({
    eventId: eventId || `${provider}-${Date.now()}`,
    eventType: eventType || "payment.updated",
    receivedAt: new Date()
  });

  payment.provider = provider;
  payment.providerReference = transactionId || payment.providerReference;

  if (amount && Number(amount) !== payment.amount) {
    return res.status(400).json({ success: false, message: "Amount mismatch" });
  }

  if (status === "paid") {
    payment.status = "paid";
    payment.paidAt = new Date();
    payment.failedAt = undefined;
    payment.paymentResult = {
      ...(payment.paymentResult || {}),
      id: transactionId || payment.transactionId || eventId || "",
      status: "paid",
      email: email || payment.paymentResult?.email || ""
    };
    payment.transactionId = transactionId || payment.transactionId;

    payment.order.paymentStatus = "paid";
    payment.order.isPaid = true;
    payment.order.paidAt = new Date();
    if (payment.order.orderStatus === "pending") {
      payment.order.orderStatus = "processing";
    }
  }

  if (status === "failed") {
    payment.status = "failed";
    payment.failedAt = new Date();
    payment.paymentResult = {
      ...(payment.paymentResult || {}),
      id: transactionId || payment.transactionId || eventId || "",
      status: "failed",
      email: email || payment.paymentResult?.email || ""
    };

    payment.order.paymentStatus = "failed";
    payment.order.isPaid = false;
  }

  await payment.save();
  await payment.order.save();

  res.status(200).json({
    success: true,
    message: "Webhook processed",
    payment
  });
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("order");
  if (!payment) {
    return res.status(404).json({ success: false, message: "Payment not found" });
  }

  const ownerId = payment.user.toString();
  if (ownerId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  const { status, transactionId, provider, email } = req.body;

  if (!["pending", "processing", "paid", "failed", "refunded"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid payment status" });
  }

  if (status === "refunded" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only admin can refund payments" });
  }

  payment.status = status;
  if (transactionId) payment.transactionId = transactionId;
  if (provider) payment.provider = provider;
  if (email) payment.paymentResult = { ...(payment.paymentResult || {}), email };

  if (status === "paid") {
    payment.paidAt = new Date();
    payment.failedAt = undefined;
    payment.order.isPaid = true;
    payment.order.paidAt = new Date();
    payment.order.paymentStatus = "paid";
    payment.order.orderStatus = payment.order.orderStatus === "pending" ? "processing" : payment.order.orderStatus;
  }

  if (status === "failed") {
    payment.failedAt = new Date();
    payment.order.paymentStatus = "failed";
    payment.order.isPaid = false;
  }

  if (status === "refunded") {
    payment.order.paymentStatus = "refunded";
    payment.order.isPaid = false;
  }

  await payment.save();
  await payment.order.save();

  res.status(200).json({
    success: true,
    payment
  });
});

module.exports = {
  getPaymentMethods,
  getMyPayments,
  createPayment,
  updatePaymentStatus,
  refundPayment,
  handlePaymentWebhook
};