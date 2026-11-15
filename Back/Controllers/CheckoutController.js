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

const getCartSubtotal = (cart) => cart.items.reduce(
  (total, item) => total + item.product.price * item.quantity,
  0
);

const isValidAddress = (address) => {
  const requiredFields = ["fullName", "phone", "city", "street"];
  return Boolean(address) &&
    requiredFields.every(field =>
      typeof address[field] === "string" &&
      address[field].trim().length > 0 &&
      address[field].length <= 200
    ) &&
    (address.postalCode === undefined || typeof address.postalCode === "string");
};

const validatePurchasableCart = (cart) => {
  for (const item of cart.items) {
    if (!item.product || item.product.isDeleted || !item.product.isPublished) {
      return "A product in your cart is no longer available.";
    }
    if (item.product.variants?.length > 0) {
      return "Variant products are currently unavailable for purchase.";
    }
    if (item.product.stock < item.quantity) {
      return `Insufficient stock for product: ${item.product.title}`;
    }
  }
  return null;
};

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

  const cartError = validatePurchasableCart(cart);
  if (cartError) {
    return res.status(409).json({ success: false, message: cartError });
  }
  const subtotal = getCartSubtotal(cart);

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
    subtotal,
    shippingAddress: null,
    shippingMethod: null,
    shippingCost: 0,
    taxCost: 0,
    paymentMethod: null,
    couponCode: null,
    discountAmount: 0,
    total: subtotal,
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

  if (
    ![fullName, phone, city, street].every(value => typeof value === "string" && value.trim()) ||
    [fullName, phone, city, street].some(value => value.length > 200) ||
    (postalCode !== undefined && typeof postalCode !== "string")
  ) {
    return res.status(400).json({ success: false, message: "Missing required address fields" });
  }

  res.status(200).json({
    success: true,
    message: "Required address details are complete.",
    validatedAddress: {
      fullName: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      street: street.trim(),
      postalCode: postalCode?.trim() || "",
      country: "Egypt"
    }
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

  if (!session.expiresAt || session.expiresAt <= new Date()) {
    return res.status(400).json({ success: false, message: "Checkout session has expired. Please start checkout again." });
  }
  if (!isValidAddress(shippingAddress)) {
    return res.status(400).json({ success: false, message: "Shipping address is required" });
  }

  const selectedOption = shippingOptions.find(opt => opt.id === shippingMethodId);
  if (!selectedOption) {
    return res.status(400).json({ success: false, message: "Unsupported shipping method." });
  }

  const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: "Your cart is empty." });
  }
  const cartError = validatePurchasableCart(cart);
  if (cartError) {
    return res.status(409).json({ success: false, message: cartError });
  }
  const subtotal = getCartSubtotal(cart);
  
  // Calculate cost
  let shippingCost = selectedOption.cost;
  if (selectedOption.id === "free" && subtotal < selectedOption.minAmount) {
    shippingCost = shippingOptions[0].cost; // fallback to standard if threshold not met
  }

  session.items = cart.items.map(item => ({
    product: item.product._id,
    title: item.product.title,
    price: item.product.price,
    quantity: item.quantity
  }));
  session.subtotal = subtotal;
  session.shippingAddress = {
    fullName: shippingAddress.fullName.trim(),
    phone: shippingAddress.phone.trim(),
    city: shippingAddress.city.trim(),
    street: shippingAddress.street.trim(),
    postalCode: typeof shippingAddress.postalCode === "string" ? shippingAddress.postalCode.trim() : "",
    country: "Egypt"
  };
  session.shippingMethod = selectedOption.name;
  session.shippingCost = shippingCost;
  session.taxCost = Math.round(subtotal * 0.14 * 100) / 100; // 14% Egyptian VAT
  session.total = subtotal + shippingCost + session.taxCost - session.discountAmount;
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

  if (paymentMethod !== "cod") {
    return res.status(503).json({
      success: false,
      message: "Online payment processing is unavailable until a payment provider is configured."
    });
  }
  const session = await CheckoutSession.findOne({ userId: req.user.id });

  if (!session) {
    return res.status(400).json({ success: false, message: "No active checkout session found" });
  }
  if (!session.expiresAt || session.expiresAt <= new Date()) {
    return res.status(400).json({ success: false, message: "Checkout session has expired. Please start checkout again." });
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
  if (!session.expiresAt || session.expiresAt <= new Date()) {
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
