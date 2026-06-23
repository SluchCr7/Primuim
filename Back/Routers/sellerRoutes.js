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

// ── Authenticated seller actions (must come BEFORE /:id to avoid route collision) ──
router.post("/apply", verifyToken, applyAsSeller);
router.get("/application-status", verifyToken, getMyApplicationStatus);

// ── Seller dashboard (approved sellers only) ──
router.get("/stats", verifySeller, getSellerStats);
router.get("/orders", verifySeller, getSellerOrders);
router.patch("/orders/:orderId", verifySeller, updateSellerOrderStatus);
router.post("/payout", verifySeller, requestPayout);
router.put("/profile", verifySeller, updateSellerStoreProfile);
router.patch("/store-logo", verifySeller, photoUpload.single("image"), uploadStoreLogo);
router.patch("/store-cover", verifySeller, photoUpload.single("image"), uploadStoreCover);

// ── Public store routes (must come AFTER specific paths to avoid /:id swallowing them) ──
router.get("/store/slug/:slug", getPublicStoreBySlug);
router.get("/", getApprovedSellers);
router.get("/:id", getPublicStoreById);

module.exports = router;
