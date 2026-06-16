const asyncHandler = require("express-async-handler");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const { Product } = require("../models/Product");

const paymentMethods = [
  { key: "cod", label: "Cash on Delivery", provider: "manual" },
  { key: "card", label: "Card Payment", provider: "stripe" },
  { key: "paypal", label: "PayPal", provider: "paypal" },
  { key: "fawry", label: "Fawry Pay", provider: "fawry" },
  { key: "vodafone_cash", label: "Vodafone Cash Wallet", provider: "vodafone_cash" },
  { key: "paymob", label: "Paymob Gate", provider: "paymob" }
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
  const { paymentMethod, provider, transactionId, providerReference } = req.body;

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

  // Gateway Integrations / Ref generations
  let clientSecret = "";
  let fawryRef = "";
  let vodafoneRef = "";
  let paymobOrderId = "";
  let redirectUrl = "";

  const finalProvider = provider || (
    normalizedMethod === "card" ? "stripe" : 
    normalizedMethod === "paypal" ? "paypal" :
    normalizedMethod === "fawry" ? "fawry" :
    normalizedMethod === "vodafone_cash" ? "vodafone_cash" :
    normalizedMethod === "paymob" ? "paymob" : "manual"
  );

  if (normalizedMethod === "card" && finalProvider === "stripe") {
    if (process.env.STRIPE_SECRET_KEY) {
      const stripeSdk = require("stripe")(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripeSdk.paymentIntents.create({
        amount: Math.round(order.totalPrice * 100), // cents
        currency: "egp",
        metadata: { orderId: order._id.toString(), userId: req.user.id }
      });
      clientSecret = paymentIntent.client_secret;
    } else {
      clientSecret = `mock_stripe_secret_key_${Date.now()}`;
    }
  } else if (normalizedMethod === "fawry") {
    fawryRef = Math.floor(100000000 + Math.random() * 900000000).toString();
  } else if (normalizedMethod === "vodafone_cash") {
    vodafoneRef = `VDF-${Math.floor(100000 + Math.random() * 900000)}`;
    redirectUrl = `https://eg-vodafone.com/vodafonecash/pay?ref=${vodafoneRef}&amount=${order.totalPrice}`;
  } else if (normalizedMethod === "paymob" || (normalizedMethod === "card" && finalProvider === "paymob")) {
    paymobOrderId = Math.floor(1000000 + Math.random() * 9000000);
    redirectUrl = `https://accept.paymob.com/api/acceptance/iframes/12345?payment_token=mock_token_${paymobOrderId}`;
  }

  const nextStatus = transactionId ? "paid" : normalizedMethod === "cod" ? "pending" : "processing";

  const payment = await Payment.findOneAndUpdate(
    { order: order._id },
    {
      user: req.user.id,
      order: order._id,
      amount: order.totalPrice,
      currency: "EGP",
      paymentMethod: normalizedMethod,
      provider: finalProvider,
      providerReference: providerReference || fawryRef || vodafoneRef || paymobOrderId || null,
      transactionId: transactionId || null,
      status: nextStatus,
      paymentResult: transactionId
        ? {
            id: transactionId,
            status: "completed",
            email: req.user.email || ""
          }
        : undefined,
      paidAt: nextStatus === "paid" ? new Date() : undefined,
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
    order,
    clientSecret,
    fawryRef,
    vodafoneRef,
    paymobOrderId,
    redirectUrl
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

    for (const item of payment.order.orderItems) {
      const product = await Product.findById(item.product);

      if (product) {
        product.stock += item.quantity;
        product.sold = Math.max(0, product.sold - item.quantity);
        product.inventoryLogs.push({
          action: "refund",
          quantity: item.quantity,
          note: `Refund for payment ${payment._id}`,
          createdBy: req.user.id
        });
        await product.save();
      }
    }

    await payment.order.save();
  }

  await payment.save();

  res.status(200).json({
    success: true,
    message: "Payment refunded successfully",
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