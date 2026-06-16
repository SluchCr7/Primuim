const express = require("express");
const router = express.Router();

const {
  getProductReviews,
  createReview,
  voteHelpful,
  getPendingReviews,
  moderateReview,
  replyToReview
} = require("../Controllers/ReviewController");
const { verifyToken, verifyAdmin, verifySeller } = require("../Middelwares/verifyToken");

router.get("/product/:productId", getProductReviews);
router.post("/", verifyToken, createReview);
router.patch("/:id/helpful", verifyToken, voteHelpful);
router.post("/:id/reply", verifySeller, replyToReview);

// Admin Moderation routes
router.get("/admin/pending", verifyAdmin, getPendingReviews);
router.patch("/admin/:id/moderate", verifyAdmin, moderateReview);

module.exports = router;
