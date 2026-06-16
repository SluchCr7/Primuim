const SellerRequest = require("../models/SellerRequest");
const { Product } = require("../models/Product");
const { Order } = require("../models/Order");
const { User } = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");

// ========================================
// APPLY TO BECOME A SELLER (Customer only)
// ========================================
const applyAsSeller = asyncHandler(async (req, res) => {
  const { storeName, storeDescription, storePhone, storeAddress } = req.body;

  if (!storeName || !storeDescription || !storePhone || !storeAddress) {
    return res.status(400).json({
      success: false,
      message: "All fields are required (Store Name, Description, Phone, Address)"
    });
  }

  // Check if request already exists
  const existingRequest = await SellerRequest.findOne({ user: req.user.id });

  if (existingRequest) {
    return res.status(400).json({
      success: false,
      message: `You already have a seller application. Status: ${existingRequest.status}`
    });
  }

  const newRequest = await SellerRequest.create({
    user: req.user.id,
    storeName,
    storeDescription,
    storePhone,
    storeAddress,
    status: "pending"
  });

  res.status(201).json({
    success: true,
    message: "Seller application submitted successfully! An administrator will review it shortly.",
    request: newRequest
  });
});

// ========================================
// GET CURRENT APPLICATION STATUS (Authenticated User)
// ========================================
const getMyApplicationStatus = asyncHandler(async (req, res) => {
  const request = await SellerRequest.findOne({ user: req.user.id });

  res.status(200).json({
    success: true,
    request
  });
});

// ========================================
// GET SELLER DASHBOARD STATS (Seller only)
// ========================================
const getSellerStats = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  // 1. Get listed products owned by this seller
  const products = await Product.find({ seller: sellerId, isDeleted: false });
  const productIds = products.map(p => p._id);

  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length;

  // 2. Fetch orders containing these products
  const orders = await Order.find({
    "orderItems.product": { $in: productIds }
  });

  let totalEarnings = 0;
  let activeOrdersCount = 0;
  let totalSoldUnits = 0;

  // Track sales daily
  const salesMap = {};

  orders.forEach(order => {
    // Filter items in order that belong to this seller
    const sellerItems = order.orderItems.filter(item =>
      productIds.some(pid => pid.toString() === item.product.toString())
    );

    const subtotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const quantity = sellerItems.reduce((sum, item) => sum + item.quantity, 0);

    totalSoldUnits += quantity;

    if (order.orderStatus === "delivered") {
      totalEarnings += subtotal;

      const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
      salesMap[dateStr] = (salesMap[dateStr] || 0) + subtotal;
    }

    if (order.orderStatus !== "delivered" && order.orderStatus !== "cancelled") {
      activeOrdersCount++;
    }
  });

  // Format daily sales for chart
  const salesOverTime = Object.keys(salesMap)
    .sort()
    .map(date => ({
      date,
      amount: salesMap[date]
    }));

  res.status(200).json({
    success: true,
    stats: {
      totalEarnings,
      totalProducts,
      activeOrdersCount,
      outOfStockCount,
      lowStockCount,
      totalSoldUnits,
      salesOverTime
    }
  });
});

// ========================================
// GET SELLER ORDERS (Seller only)
// ========================================
const getSellerOrders = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  // Find products owned by this seller
  const products = await Product.find({ seller: sellerId }).select("_id");
  const productIds = products.map(p => p._id);

  // Find orders containing any of these products
  const orders = await Order.find({ "orderItems.product": { $in: productIds } })
    .populate("user", "username email")
    .sort({ createdAt: -1 });

  // Filter the items and calculate subtotal for this seller
  const sellerOrders = orders.map(order => {
    const orderObj = order.toObject();
    
    // Keep only this seller's products
    orderObj.orderItems = orderObj.orderItems.filter(item =>
      productIds.some(pid => pid.toString() === item.product.toString())
    );

    // Calculate subtotal for seller
    orderObj.sellerSubtotal = orderObj.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return orderObj;
  });

  res.status(200).json({
    success: true,
    orders: sellerOrders
  });
});

// ========================================
// UPDATE ORDER STATUS (Seller or Admin)
// ========================================
const updateSellerOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value"
    });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  // Verify the seller has items in this order, or is admin
  const sellerId = req.user.id;
  const products = await Product.find({ seller: sellerId }).select("_id");
  const productIds = products.map(p => p._id.toString());

  const hasItemInOrder = order.orderItems.some(item =>
    productIds.includes(item.product.toString())
  );

  if (!hasItemInOrder && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update status for this order"
    });
  }

  const oldStatus = order.orderStatus;
  order.orderStatus = status;

  // If status is changed to delivered, credit sellers wallets
  if (status === "delivered" && oldStatus !== "delivered") {
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentStatus = "paid";

    // Loop through order items and credit corresponding sellers
    for (const item of order.orderItems) {
      const prod = await Product.findById(item.product);
      if (prod && prod.seller) {
        const sellerUser = await User.findById(prod.seller);
        if (sellerUser) {
          const creditAmount = item.price * item.quantity;
          sellerUser.walletBalance += creditAmount;
          sellerUser.loyaltyPoints += Math.floor(creditAmount * 0.05); // 5% loyalty bonus
          
          sellerUser.activityLogs.push({
            action: "seller_earnings",
            details: `Earned ${creditAmount} EGP from order #${order._id.toString().substring(18).toUpperCase()} for product "${item.title}"`
          });
          
          await sellerUser.save();

          // Notification
          await Notification.create({
            user: sellerUser._id,
            title: "Fulfillment Earning Credited",
            message: `Order #${order._id.toString().substring(18).toUpperCase()} containing "${item.title}" was marked as delivered. ${creditAmount} EGP credited to your store balance.`
          });
        }
      }
    }
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status} successfully.`,
    order
  });
});

// ========================================
// REQUEST PAYOUT / FUNDS WITHDRAWAL (Seller only)
// ========================================
const requestPayout = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Please specify a positive payout amount"
    });
  }

  const seller = await User.findById(req.user.id);

  if (seller.walletBalance < amount) {
    return res.status(400).json({
      success: false,
      message: `Insufficient store balance. Your balance is ${seller.walletBalance} EGP`
    });
  }

  // Subtract balance and log transaction
  seller.walletBalance -= amount;
  
  seller.activityLogs.push({
    action: "payout_request",
    details: `Requested payout of ${amount} EGP. Remaining store balance: ${seller.walletBalance} EGP`
  });

  await seller.save();

  // Notify seller
  await Notification.create({
    user: seller._id,
    title: "Payout Request Initiated",
    message: `A payout request for ${amount} EGP has been submitted. Funds will be sent to your bank account within 2-3 business days.`
  });

  res.status(200).json({
    success: true,
    message: `Payout of ${amount} EGP requested successfully!`,
    walletBalance: seller.walletBalance
  });
});

// ========================================
// GET PUBLIC STORE PROFILE BY SLUG (Public)
// ========================================
const getPublicStoreBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const seller = await User.findOne({ storeSlug: slug, role: "seller" })
    .select("-password -email -failedLoginAttempts -lockUntil -otpSecret -otpExpires -loginHistory -activityLogs");

  if (!seller) {
    return res.status(404).json({
      success: false,
      message: "Store not found"
    });
  }

  if (seller.sellerStatus !== "approved") {
    return res.status(403).json({
      success: false,
      message: "Store is currently pending review or suspended"
    });
  }

  // 1. Fetch seller's products
  const products = await Product.find({ seller: seller._id, isDeleted: false, isPublished: true })
    .populate("category", "name")
    .sort({ createdAt: -1 });

  // 2. Fetch seller's articles
  const { Article } = require("../models/Article");
  const articles = await Article.find({ author: seller._id, status: "approved" })
    .sort({ publishedAt: -1 });

  // 3. Fetch reviews for all seller's products
  const productIds = products.map(p => p._id);
  const { Review } = require("../models/Review");
  const reviews = await Review.find({ product: { $in: productIds }, isApproved: true })
    .populate("user", "username profilePhoto")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    seller: {
      id: seller._id,
      storeName: seller.storeName,
      brandName: seller.brandName,
      storeSlug: seller.storeSlug,
      storeLogo: seller.storeLogo,
      storeCover: seller.storeCover,
      storeDescription: seller.storeDescription,
      country: seller.country,
      storeRating: seller.storeRating,
      totalSales: seller.totalSales,
      responseTime: seller.responseTime,
      followersCount: seller.followers ? seller.followers.length : 0,
      followers: seller.followers || [],
      createdAt: seller.createdAt
    },
    products,
    articles,
    reviews
  });
});

// ========================================
// GET ALL APPROVED SELLERS (Public)
// ========================================
const getApprovedSellers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    role: "seller",
    sellerStatus: "approved"
  };

  if (req.query.search) {
    const searchTerm = req.query.search.trim();
    filter.$or = [
      { storeName: { $regex: searchTerm, $options: "i" } },
      { brandName: { $regex: searchTerm, $options: "i" } },
      { storeDescription: { $regex: searchTerm, $options: "i" } }
    ];
  }

  let sortObj = { storeRating: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case "rating":
        sortObj = { storeRating: -1 };
        break;
      case "sales":
        sortObj = { totalSales: -1 };
        break;
      case "newest":
        sortObj = { createdAt: -1 };
        break;
    }
  }

  const totalSellers = await User.countDocuments(filter);
  const sellers = await User.find(filter)
    .select("-password -email -failedLoginAttempts -lockUntil -otpSecret -otpExpires -loginHistory -activityLogs")
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    page,
    limit,
    totalSellers,
    totalPages: Math.ceil(totalSellers / limit),
    sellers: sellers.map(s => ({
      id: s._id,
      storeName: s.storeName,
      brandName: s.brandName,
      storeSlug: s.storeSlug,
      storeLogo: s.storeLogo,
      storeCover: s.storeCover,
      storeDescription: s.storeDescription,
      country: s.country,
      storeRating: s.storeRating,
      totalSales: s.totalSales,
      responseTime: s.responseTime,
      followersCount: s.followers ? s.followers.length : 0,
      createdAt: s.createdAt
    }))
  });
});

module.exports = {
  applyAsSeller,
  getMyApplicationStatus,
  getSellerStats,
  getSellerOrders,
  updateSellerOrderStatus,
  requestPayout,
  getPublicStoreBySlug,
  getApprovedSellers
};

