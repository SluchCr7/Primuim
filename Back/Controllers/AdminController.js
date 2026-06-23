const asyncHandler = require("express-async-handler");
const { User } = require("../models/User");
const { Product } = require("../models/Product");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const SellerRequest = require("../models/SellerRequest");
const Notification = require("../models/Notification");

const getAllUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const totalUsers = await User.countDocuments();
  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    page,
    limit,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    users
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  res.status(200).json({
    success: true,
    user
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const allowedRoles = ["customer", "seller", "moderator", "admin"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role"
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    user: {
      id: user._id,
      username: user.username,
      role: user.role
    }
  });
});

const toggleBlockUser = asyncHandler(async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({
      success: false,
      message: "You cannot block yourself"
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.status(200).json({
    success: true,
    message: user.isBlocked ? "User blocked successfully" : "User unblocked successfully",
    isBlocked: user.isBlocked
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete yourself"
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});

const getUsersStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const blockedUsers = await User.countDocuments({ isBlocked: true });
  const sellers = await User.countDocuments({ role: "seller" });
  const admins = await User.countDocuments({ role: "admin" });
  const customers = await User.countDocuments({ role: "customer" });

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      blockedUsers,
      sellers,
      admins,
      customers
    }
  });
});

const getRecentUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    users
  });
});

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const [totalUsers, totalOrders, totalProducts, outOfStockCount, lowStockAgg, paidPaymentAgg] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments({ isDeleted: false }),
    Product.countDocuments({ isDeleted: false, stock: 0 }),
    Product.aggregate([
      {
        $match: {
          isDeleted: false,
          $expr: { $lte: ["$stock", "$lowStockThreshold"] }
        }
      },
      { $count: "count" }
    ]),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, revenue: { $sum: "$amount" } } }
    ])
  ]);

  const revenue = paidPaymentAgg[0]?.revenue || 0;
  const lowStockCount = lowStockAgg[0]?.count || 0;

  res.status(200).json({
    success: true,
    analytics: {
      totalUsers,
      totalOrders,
      totalProducts,
      outOfStockCount,
      lowStockCount,
      revenue
    }
  });
});

const getSalesAnalytics = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const sales = await Payment.aggregate([
    {
      $match: {
        status: "paid",
        paidAt: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
        revenue: { $sum: "$amount" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    days,
    sales
  });
});

const getInventoryAnalytics = asyncHandler(async (req, res) => {
  const lowStockProducts = await Product.find({
    isDeleted: false,
    $expr: { $lte: ["$stock", "$lowStockThreshold"] }
  })
    .select("title stock lowStockThreshold sku price sold")
    .sort({ stock: 1 })
    .limit(50);

  const outOfStockProducts = await Product.find({ isDeleted: false, stock: 0 })
    .select("title stock sku price sold")
    .sort({ sold: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    lowStockProducts,
    outOfStockProducts
  });
});

const adjustProductInventory = asyncHandler(async (req, res) => {
  const { quantity, action, note } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product || product.isDeleted) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ success: false, message: "Quantity must be a positive integer" });
  }

  if (!["restock", "adjustment", "sale"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid inventory action" });
  }

  if (action === "sale") {
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock" });
    }
    product.stock -= quantity;
    product.sold += quantity;
  } else {
    product.stock += quantity;
  }

  product.inventoryLogs.push({
    action,
    quantity,
    note: note || "Inventory update",
    createdBy: req.user.id
  });

  await product.save();

  res.status(200).json({
    success: true,
    message: "Inventory updated successfully",
    product
  });
});

// ========================================
// GET ALL SELLER REQUESTS (Admin only)
// ========================================
const getSellerRequests = asyncHandler(async (req, res) => {
  const requests = await SellerRequest.find()
    .populate("user", "username email role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    requests
  });
});

// ========================================
// MODERATE SELLER REQUEST (Admin only)
// ========================================
const moderateSellerRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be 'approved' or 'rejected'"
    });
  }

  const sellerReq = await SellerRequest.findById(id);

  if (!sellerReq) {
    return res.status(404).json({
      success: false,
      message: "Seller application not found"
    });
  }

  sellerReq.status = status;
  sellerReq.adminNotes = adminNotes || "";
  await sellerReq.save();

  const user = await User.findById(sellerReq.user);

  if (user) {
    if (status === "approved") {
      // Generate a unique URL-safe slug from the store name
      const baseSlug = sellerReq.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      // Ensure slug uniqueness by appending last 4 chars of user ID if needed
      const slug = `${baseSlug}-${user._id.toString().slice(-4)}`;

      user.role = "seller";
      user.sellerStatus = "approved";
      user.storeName = sellerReq.storeName;
      user.storeDescription = sellerReq.storeDescription;
      user.storeSlug = slug;
      user.phone = user.phone || sellerReq.storePhone;
      // Preserve any logo/cover uploaded at registration; don't overwrite them
      if (!user.storeLogo) user.storeLogo = "";
      if (!user.storeCover) user.storeCover = "";
      await user.save();

      // Notify User
      await Notification.create({
        user: user._id,
        title: "Seller Application Approved",
        message: `Congratulations! Your store "${sellerReq.storeName}" has been approved. You now have access to the Seller Portal.`
      });
    } else {
      // Update the user's sellerStatus to "rejected" so they can see the rejection
      user.sellerStatus = "rejected";
      await user.save();

      // Notify User
      await Notification.create({
        user: user._id,
        title: "Seller Application Rejected",
        message: `Unfortunately, your seller request was rejected. Note: ${adminNotes || "None provided"}`
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Seller application was ${status} successfully.`,
    request: sellerReq
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleBlockUser,
  deleteUser,
  getUsersStats,
  getRecentUsers,
  getDashboardAnalytics,
  getSalesAnalytics,
  getInventoryAnalytics,
  adjustProductInventory,
  getSellerRequests,
  moderateSellerRequest
};