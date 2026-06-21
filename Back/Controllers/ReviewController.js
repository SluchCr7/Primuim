const asyncHandler = require("express-async-handler");
const { Review, validateCreateReview, validateUpdateReview } = require("../models/Review");
const Order  = require("../models/Order");
const { Product } = require("../models/Product");
const {User} = require("../models/User");


// ========================================
// @desc    Get Product Reviews (Approved only)
// @route   GET /api/reviews/product/:productId
// @access  Public
// ========================================
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ product: productId, isApproved: true })
    .populate("user", "username profilePhoto")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    reviews
  });
});

// ========================================
// @desc    Create Product Review (Checks if purchase was verified)
// @route   POST /api/reviews
// @access  Private
// ========================================
const createReview = asyncHandler(async (req, res) => {
  req.body.user = req.user.id;
  const { error } = validateCreateReview(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  const { product, rating, comment, images, videos } = req.body;
  const userId = req.user.id;

  // Check if user has already reviewed this product
  const alreadyReviewed = await Review.findOne({ user: userId, product });
  if (alreadyReviewed) {
    return res.status(400).json({ success: false, message: "You have already reviewed this product" });
  }

  // Check if purchase is verified (User ordered it and it was delivered)
  const deliveredOrder = await Order.findOne({
    user: userId,
    "orderItems.product": product,
    orderStatus: "delivered"
  });

  const isVerifiedPurchase = !!deliveredOrder;

  if (!isVerifiedPurchase) {
    return res.status(400).json({
      success: false,
      message: "Verified purchase reviews only. You can only review products you have purchased and had delivered."
    });
  }

  const review = await Review.create({
    user: userId,
    product,
    rating,
    comment,
    images: images || [],
    videos: videos || [],
    isVerifiedPurchase: true,
    isApproved: true // approved by default, moderation can reject
  });

  // Notify seller of the product
  try {
    const { Product } = require("../models/Product");
    const prodDoc = await Product.findById(product);
    if (prodDoc && prodDoc.seller) {
      const { createNotification } = require("../utils/notifications");
      await createNotification({
        user: prodDoc.seller,
        title: "New Product Review",
        message: `A client left a ${rating}-star review on "${prodDoc.title}".`
      });
    }
  } catch (err) {
    console.error("Error sending review notification:", err.message);
  }

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    review
  });
});

// ========================================
// @desc    Vote Helpful on Review
// @route   PATCH /api/reviews/:id/helpful
// @access  Private
// ========================================
const voteHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }

  review.helpfulVotes += 1;
  await review.save();

  res.status(200).json({
    success: true,
    message: "Helpful vote recorded",
    helpfulVotes: review.helpfulVotes
  });
});

// ========================================
// @desc    Get Pending Reviews for Moderation
// @route   GET /api/reviews/admin/pending
// @access  Private/Admin
// ========================================
const getPendingReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ isApproved: false })
    .populate("user", "username email")
    .populate("product", "title");

  res.status(200).json({
    success: true,
    count: reviews.length,
    reviews
  });
});

// ========================================
// @desc    Moderate Review (Approve/Reject)
// @route   PATCH /api/reviews/admin/:id/moderate
// @access  Private/Admin
// ========================================
const moderateReview = asyncHandler(async (req, res) => {
  const { isApproved } = req.body; // boolean
  
  if (isApproved === undefined) {
    return res.status(400).json({ success: false, message: "isApproved parameter is required" });
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }

  review.isApproved = isApproved;
  await review.save();

  res.status(200).json({
    success: true,
    message: isApproved ? "Review approved and published" : "Review hidden/disapproved",
    review
  });
});

// ========================================
// @desc    Reply to a Review (Sellers only)
// @route   POST /api/reviews/:id/reply
// @access  Private (Seller only)
// ========================================
const replyToReview = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  if (!comment || comment.trim() === "") {
    return res.status(400).json({ success: false, message: "Reply comment cannot be empty" });
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }

  const { Product } = require("../models/Product");
  const product = await Product.findById(review.product);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if (product.seller.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Not authorized. Only the seller of this product can reply." });
  }

  review.reply = {
    comment,
    createdAt: new Date()
  };

  await review.save();

  // Notify reviewer
  try {
    const { createNotification } = require("../utils/notifications");
    await createNotification({
      user: review.user,
      title: "Store Response to Your Review",
      message: `The seller of "${product.title}" left a response on your review.`
    });
  } catch (err) {
    console.error("Error sending reply notification:", err.message);
  }

  res.status(200).json({
    success: true,
    message: "Reply saved successfully",
    review
  });
});

module.exports = {
  getProductReviews,
  createReview,
  voteHelpful,
  getPendingReviews,
  moderateReview,
  replyToReview
};
