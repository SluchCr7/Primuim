const express = require("express");
const router = express.Router();

const {
  applyAsSeller,
  getMyApplicationStatus,
  getSellerStats,
  getSellerOrders,
  updateSellerOrderStatus,
  requestPayout,
  getPublicStoreBySlug,
  getApprovedSellers,
  updateSellerStoreProfile
} = require("../Controllers/SellerController");

const { verifyToken, verifySeller } = require("../Middelwares/verifyToken");

// Public store profile route
router.get("/store/slug/:slug", getPublicStoreBySlug);
router.get("/", getApprovedSellers);


// Onboarding routes
router.post("/apply", verifyToken, applyAsSeller);
router.get("/application-status", verifyToken, getMyApplicationStatus);

// Seller dashboard routes
router.get("/stats", verifySeller, getSellerStats);
router.get("/orders", verifySeller, getSellerOrders);
router.patch("/orders/:orderId", verifySeller, updateSellerOrderStatus);
router.post("/payout", verifySeller, requestPayout);
router.put("/profile", verifySeller, updateSellerStoreProfile);

module.exports = router;
