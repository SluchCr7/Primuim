const asyncHandler = require("express-async-handler");
const Cart = require("../models/Cart");
const { Product } = require("../models/Product");
const CheckoutSession = require("../models/CheckoutSession");

// Local shipping options definition
const shippingOptions = [
  { id: "std", name: "Standard Shipping", cost: 50, days: "3-5 business days" },
  { id: "exp", name: "Express Shipping", cost: 150, days: "1-2 business days" },
  { id: "free", name: "Free Shipping", cost: 0, days: "5-7 business days", minAmount: 1000 }
];

// ========================================
// @desc    Start Checkout Session
// @route   POST /api/checkout/start
// @access  Private
// ========================================
const startCheckout = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
  
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: "Your cart is empty" });
  }

  // Double check actual stock levels
  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for product: ${item.product.title}`
      });
    }
  }

  const sessionId = `chk_${req.user.id}_${Date.now()}`;
  const sessionData = {
    sessionId,
    userId: req.user.id,
    items: cart.items.map(item => ({
      product: item.product._id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity
    })),
    subtotal: cart.totalPrice,
    shippingAddress: null,
    shippingMethod: null,
    shippingCost: 0,
    taxCost: 0,
    paymentMethod: null,
    couponCode: null,
    discountAmount: 0,
    total: cart.totalPrice,
    step: "shipping",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
  };

  const session = await CheckoutSession.findOneAndUpdate(
    { userId: req.user.id },
    sessionData,
    { upsert: true, new: true }
  );

  res.status(200).json({
    success: true,
    message: "Checkout started successfully",
    checkoutSession: session
  });
});

// ========================================
// @desc    Validate Shipping Address
// @route   POST /api/checkout/validate-address
// @access  Private
// ========================================
const validateAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, city, street, postalCode } = req.body;

  if (!fullName || !phone || !city || !street) {
    return res.status(400).json({ success: false, message: "Missing required address fields" });
  }

  // Simulating external address verification service (e.g. DHL/Aramex API)
  const cityLower = city.toLowerCase().trim();
  const allowedCities = ["cairo", "giza", "alexandria", "dakahlia", "qalyubia", "gharbia", "port said", "suez"];
  
  const isValidCity = allowedCities.some(c => cityLower.includes(c));

  if (!isValidCity) {
    return res.status(400).json({
      success: false,
      message: `Address warning: Delivery to '${city}' might experience delays. Please verify.`,
      suggestedCity: "Cairo"
    });
  }

  res.status(200).json({
    success: true,
    message: "Address validated successfully",
    verifiedAddress: { fullName, phone, city, street, postalCode, country: "Egypt" }
  });
});

// ========================================
// @desc    Save Shipping Step & Shipping Method
// @route   POST /api/checkout/shipping
// @access  Private
// ========================================
const saveShipping = asyncHandler(async (req, res) => {
  const { shippingAddress, shippingMethodId } = req.body;
  const session = await CheckoutSession.findOne({ userId: req.user.id });

  if (!session) {
    return res.status(400).json({ success: false, message: "No active checkout session found" });
  }

  if (!shippingAddress) {
    return res.status(400).json({ success: false, message: "Shipping address is required" });
  }

  const selectedOption = shippingOptions.find(opt => opt.id === shippingMethodId) || shippingOptions[0];
  
  // Calculate cost
  let shippingCost = selectedOption.cost;
  if (selectedOption.id === "free" && session.subtotal < selectedOption.minAmount) {
    shippingCost = shippingOptions[0].cost; // fallback to standard if threshold not met
  }

  session.shippingAddress = shippingAddress;
  session.shippingMethod = selectedOption.name;
  session.shippingCost = shippingCost;
  session.taxCost = Math.round(session.subtotal * 0.14 * 100) / 100; // 14% Egyptian VAT
  session.total = session.subtotal + shippingCost + session.taxCost - session.discountAmount;
  session.step = "payment";

  await session.save();

  res.status(200).json({
    success: true,
    message: "Shipping information saved",
    checkoutSession: session,
    availableShippingMethods: shippingOptions
  });
});

// ========================================
// @desc    Save Payment Method Step
// @route   POST /api/checkout/payment
// @access  Private
// ========================================
const savePayment = asyncHandler(async (req, res) => {
  const { paymentMethod } = req.body;
  const session = await CheckoutSession.findOne({ userId: req.user.id });

  if (!session) {
    return res.status(400).json({ success: false, message: "No active checkout session found" });
  }

  const allowedPaymentMethods = ["cod", "card", "paypal", "fawry", "vodafone_cash"];
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: "Unsupported payment method" });
  }

  session.paymentMethod = paymentMethod;
  session.step = "confirm";

  await session.save();

  res.status(200).json({
    success: true,
    message: "Payment method saved",
    checkoutSession: session
  });
});

// ========================================
// @desc    Get Current Checkout Session State
// @route   GET /api/checkout/state
// @access  Private
// ========================================
const getCheckoutState = asyncHandler(async (req, res) => {
  const session = await CheckoutSession.findOne({ userId: req.user.id });
  
  if (!session) {
    return res.status(404).json({ success: false, message: "No active checkout session found" });
  }

  res.status(200).json({ success: true, checkoutSession: session });
});

module.exports = {
  startCheckout,
  validateAddress,
  saveShipping,
  savePayment,
  getCheckoutState,
  shippingOptions
};
