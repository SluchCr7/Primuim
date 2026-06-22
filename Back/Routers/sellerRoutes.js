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
  updateSellerStoreProfile,
  uploadStoreLogo,
  uploadStoreCover,
  getPublicStoreById
} = require("../Controllers/SellerController");

const { verifyToken, verifySeller } = require("../Middelwares/verifyToken");
const photoUpload = require("../Middelwares/UploadPhoto");

// Public store profile route
router.get("/store/slug/:slug", getPublicStoreBySlug);
router.get("/", getApprovedSellers);
router.get("/:id", getPublicStoreById);


// Onboarding routes
router.post("/apply", verifyToken, applyAsSeller);
router.get("/application-status", verifyToken, getMyApplicationStatus);

// Seller dashboard routes
router.get("/stats", verifySeller, getSellerStats);
router.get("/orders", verifySeller, getSellerOrders);
router.patch("/orders/:orderId", verifySeller, updateSellerOrderStatus);
router.post("/payout", verifySeller, requestPayout);
router.put("/profile", verifySeller, updateSellerStoreProfile);
router.patch("/store-logo", verifySeller, photoUpload.single("image"), uploadStoreLogo);
router.patch("/store-cover", verifySeller, photoUpload.single("image"), uploadStoreCover);

module.exports = router;
