const express = require("express");
const router = express.Router();

const {
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
} = require("../Controllers/AdminController");
const { verifyAdmin } = require("../Middelwares/verifyToken");

router.get("/users", verifyAdmin, getAllUsers);
router.get("/users/stats", verifyAdmin, getUsersStats);
router.get("/users/recent", verifyAdmin, getRecentUsers);
router.get("/analytics/dashboard", verifyAdmin, getDashboardAnalytics);
router.get("/analytics/sales", verifyAdmin, getSalesAnalytics);
router.get("/analytics/inventory", verifyAdmin, getInventoryAnalytics);
router.get("/users/:id", verifyAdmin, getUserById);
router.patch("/users/:id/role", verifyAdmin, updateUserRole);
router.patch("/users/:id/block", verifyAdmin, toggleBlockUser);
router.delete("/users/:id", verifyAdmin, deleteUser);
router.patch("/products/:id/inventory", verifyAdmin, adjustProductInventory);

// Seller application review routes
router.get("/seller-requests", verifyAdmin, getSellerRequests);
router.patch("/seller-requests/:id", verifyAdmin, moderateSellerRequest);

module.exports = router;