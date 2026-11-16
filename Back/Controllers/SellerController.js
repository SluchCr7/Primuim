const mongoose = require("mongoose");
const SellerRequest = require("../models/SellerRequest");
const { Product } = require("../models/Product");
const Order = require("../models/Order");
const { User, validateUpdateStoreProfile } = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");
const { cloudUpload } = require("../config/cloudUplaod");
const { awardLoyaltyPoints } = require("../utils/loyaltyService");

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
    if (existingRequest.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Your application is already pending admin review. Please wait for a decision."
      });
    }
    if (existingRequest.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Your seller application has already been approved."
      });
    }
    // If rejected, delete old request and allow resubmission
    if (existingRequest.status === "rejected") {
      await SellerRequest.deleteOne({ _id: existingRequest._id });
    }
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
    $or: [
      { seller: sellerId },
      { "orderItems.product": { $in: productIds } }
    ]
  });

  let totalEarnings = 0;
  let activeOrdersCount = 0;
  let totalSoldUnits = 0;

  // Track sales daily
  const salesMap = {};

  orders.forEach(order => {
    // Filter items in order that belong to this seller
    const sellerItems = order.orderItems.filter(item =>
      item.seller
        ? item.seller.toString() === sellerId
        : productIds.some(pid => pid.toString() === item.product.toString())
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
  const orders = await Order.find({
    $or: [
      { seller: sellerId },
      { "orderItems.product": { $in: productIds } }
    ]
  })
    .populate("user", "username email")
    .sort({ createdAt: -1 });

  // Filter the items and calculate subtotal for this seller
  const sellerOrders = orders.map(order => {
    const orderObj = order.toObject();
    
    // Keep only this seller's products
    orderObj.orderItems = orderObj.orderItems.filter(item =>
      item.seller
        ? item.seller.toString() === sellerId
        : productIds.some(pid => pid.toString() === item.product.toString())
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

  const allowedStatuses = ["processing", "shipped", "delivered"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value"
    });
  }

  const allowedTransitions = {
    pending: ["processing"],
    processing: ["shipped", "delivered"],
    shipped: ["delivered"],
    partially_cancelled: ["shipped", "delivered"]
  };
  const session = await mongoose.startSession();
  let order;
  const earnings = [];

  try {
    session.startTransaction();
    order = await Order.findById(orderId).session(session);
    if (!order) {
      throw Object.assign(new Error("Order not found"), { statusCode: 404 });
    }

    if (!allowedTransitions[order.orderStatus]?.includes(status)) {
      throw Object.assign(new Error("This order status transition is not allowed."), { statusCode: 409 });
    }

    const sellerId = req.user.id;
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      const products = await Product.find({ seller: sellerId }).select("_id").session(session);
      const productIds = new Set(products.map(product => product._id.toString()));
      const hasItemInOrder = order.orderItems.some(item =>
        item.seller ? item.seller.toString() === sellerId : productIds.has(item.product.toString())
      );
      const allItemsBelongToSeller = order.seller
        ? order.seller.toString() === sellerId
        : order.orderItems.every(item =>
            item.seller
              ? item.seller.toString() === sellerId
              : productIds.has(item.product.toString())
          );

      if (!hasItemInOrder) {
        throw Object.assign(new Error("Not authorized to update status for this order"), { statusCode: 403 });
      }
      if (!allItemsBelongToSeller) {
        throw Object.assign(new Error("Multi-seller fulfillment is not supported for this order."), { statusCode: 403 });
      }
    }

    if (status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();

      for (const item of order.orderItems) {
        const fulfilledQuantity = item.quantity -
          Number(item.cancelledQuantity || 0) -
          Number(item.returnedQuantity || 0);
        if (fulfilledQuantity <= 0) continue;

        const product = await Product.findById(item.product).session(session);
        if (!product || !product.seller) {
          throw Object.assign(new Error(`Seller information is missing for ${item.title}.`), { statusCode: 409 });
        }

        product.salesCount = (product.salesCount || 0) + fulfilledQuantity;
        if (product.salesCount >= 50) {
          product.isBestSeller = true;
        }
        await product.save({ session });

        const orderSellerId = order.seller || item.seller || product.seller;
        if (!orderSellerId || (order.seller && order.seller.toString() !== orderSellerId.toString())) {
          throw Object.assign(new Error(`Seller information is missing for ${item.title}.`), { statusCode: 409 });
        }

        const sellerUser = await User.findById(orderSellerId).session(session);
        if (!sellerUser) {
          throw Object.assign(new Error(`Seller account was not found for ${item.title}.`), { statusCode: 409 });
        }

        const creditAmount = item.price * fulfilledQuantity;
        sellerUser.walletBalance += creditAmount;
        sellerUser.loyaltyPoints += Math.floor(creditAmount * 0.05);
        sellerUser.activityLogs.push({
          action: "seller_earnings",
          details: `Earned ${creditAmount} EGP from order #${order._id.toString().substring(18).toUpperCase()} for product "${item.title}"`
        });
        await sellerUser.save({ session });
        earnings.push({ sellerId: sellerUser._id, title: item.title, amount: creditAmount });
      }

      await awardLoyaltyPoints(order.user, order._id, order.totalPrice, session);
    }

    order.orderStatus = status;
    const customerId = order.user?._id || order.user;
    const customer = await User.findById(customerId)
      .select("username email")
      .session(session);
    if (customer) {
      order.user = customer;
    }

    await order.save({ session });
    await session.commitTransaction();
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    throw error;
  } finally {
    await session.endSession();
  }

  try {
    for (const earning of earnings) {
      const { createNotification } = require("../utils/notifications");
      await createNotification({
        user: earning.sellerId,
        title: "Fulfillment Earning Credited",
        message: `Order #${order._id.toString().substring(18).toUpperCase()} containing "${earning.title}" was marked as delivered. ${earning.amount} EGP credited to your store balance.`,
        type: "order"
      });
    }
  } catch (notificationError) {
    console.error("Seller earnings notifications failed:", notificationError.message);
  }

  // Create real-time notification for the customer
  try {
    const { createNotification } = require("../utils/notifications");
    await createNotification({
      user: order.user._id || order.user,
      title: "Order Status Updated",
      message: `Your order #${order._id.toString().substring(18).toUpperCase()} status has been updated to ${status.toUpperCase()}.`,
      type: "order"
    });
  } catch (notifErr) {
    console.error("Order update notification failed:", notifErr.message);
  }

  // Send status update email asynchronously
  try {
    if (order.user && order.user.email) {
      const sendEmail = require("../utils/sendEmail");
      await sendEmail({
        email: order.user.email,
        subject: `Order Update: #${order._id.toString().substring(18).toUpperCase()} is now ${status.toUpperCase()} - Shop Premium`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="font-family: serif; color: #c5a880;">Your Order Status Has Been Updated</h2>
            <p>Hi ${order.user.username},</p>
            <p>Your order <strong>#${order._id.toString().substring(18).toUpperCase()}</strong> has been updated to <strong>${status.toUpperCase()}</strong>.</p>
            <p>You can track your order history and details by logging into your account cabinet.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 12px; color: #718096; text-align: center;">Shop Premium - 123 Luxury Avenue, Cairo, Egypt</p>
          </div>
        `
      });
    }
  } catch (emailErr) {
    console.error("Order status update email failed:", emailErr.message);
  }

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

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Please specify a valid positive payout amount"
    });
  }

  const seller = await User.findOneAndUpdate(
    { _id: req.user.id, walletBalance: { $gte: amount } },
    {
      $inc: { walletBalance: -amount },
      $push: {
        activityLogs: {
          action: "payout_request",
          details: `Requested payout of ${amount} EGP`
        }
      }
    },
    { new: true, runValidators: true }
  );

  if (!seller) {
    return res.status(400).json({
      success: false,
      message: "Insufficient store balance or seller account not found"
    });
  }

  try {
    await Notification.create({
      user: seller._id,
      title: "Payout Request Received",
      message: `Your payout request for ${amount} EGP has been recorded. We will contact you with its status.`
    });
  } catch (notificationError) {
    console.error("Could not notify seller about payout request:", notificationError.message);
  }

  res.status(200).json({
    success: true,
    message: `Payout request for ${amount} EGP recorded successfully.`,
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

  if (req.query.category) {
    const sellerIds = await Product.find({
      category: req.query.category,
      isDeleted: false,
      isPublished: true
    }).distinct("seller");
    filter._id = { $in: sellerIds };
  }

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

// ========================================
// UPDATE SELLER STORE PROFILE (Seller only)
// ========================================
const updateSellerStoreProfile = asyncHandler(async (req, res) => {
  const { error } = validateUpdateStoreProfile(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  const seller = await User.findById(req.user.id);
  if (!seller || seller.role !== "seller") {
    return res.status(404).json({
      success: false,
      message: "Seller profile not found"
    });
  }

  const fieldsToUpdate = [
    "storeName",
    "brandName",
    "storeDescription",
    "storeLogo",
    "storeCover",
    "country",
    "storePhone",
    "storeAddress",
    "responseTime"
  ];

  fieldsToUpdate.forEach(field => {
    if (req.body[field] !== undefined) {
      seller[field] = req.body[field];
    }
  });

  await seller.save();

  res.status(200).json({
    success: true,
    message: "Store settings updated successfully",
    seller: {
      id: seller._id,
      storeName: seller.storeName,
      brandName: seller.brandName,
      storeSlug: seller.storeSlug,
      storeLogo: seller.storeLogo,
      storeCover: seller.storeCover,
      storeDescription: seller.storeDescription,
      country: seller.country,
      storePhone: seller.storePhone,
      storeAddress: seller.storeAddress,
      responseTime: seller.responseTime,
      storeRating: seller.storeRating,
      totalSales: seller.totalSales
    }
  });
});

// ========================================
// UPLOAD STORE LOGO (Seller only)
// ========================================
const uploadStoreLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided"
    });
  }

  const seller = await User.findById(req.user.id);
  if (!seller || seller.role !== "seller") {
    return res.status(404).json({
      success: false,
      message: "Seller not found"
    });
  }

  const uploadedImage = await cloudUpload(req.file);
  seller.storeLogo = uploadedImage.secure_url;
  await seller.save();

  res.status(200).json({
    success: true,
    message: "Store logo uploaded successfully",
    storeLogo: seller.storeLogo
  });
});

// ========================================
// UPLOAD STORE COVER (Seller only)
// ========================================
const uploadStoreCover = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided"
    });
  }

  const seller = await User.findById(req.user.id);
  if (!seller || seller.role !== "seller") {
    return res.status(404).json({
      success: false,
      message: "Seller not found"
    });
  }

  const uploadedImage = await cloudUpload(req.file);
  seller.storeCover = uploadedImage.secure_url;
  await seller.save();

  res.status(200).json({
    success: true,
    message: "Store cover uploaded successfully",
    storeCover: seller.storeCover
  });
});

// ========================================
// GET PUBLIC STORE PROFILE BY ID (Public)
// ========================================
const getPublicStoreById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid store ID format"
    });
  }

  const seller = await User.findOne({ _id: id, role: "seller" })
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

module.exports = {
  applyAsSeller,
  getMyApplicationStatus,
  getSellerStats,
  getSellerOrders,
  updateSellerOrderStatus,
  requestPayout,
  getPublicStoreBySlug,
  getApprovedSellers,
  updateSellerStoreProfile,
  uploadStoreLogo,
  uploadStoreCover,
  getPublicStoreById
};

