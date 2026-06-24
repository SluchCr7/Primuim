const express = require("express");
const router  = express.Router();

const {
  getProductReviews,
  createReview,
  voteHelpful,
  getPendingReviews,
  moderateReview,
  replyToReview,
} = require("../Controllers/ReviewController");
const { verifyToken, verifyAdmin, verifySeller } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews — create, vote helpful, seller reply, admin moderation
 */

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Get approved reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *         description: Product ObjectId
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, helpful, rating-asc, rating-desc], default: newest }
 *     responses:
 *       200:
 *         description: Reviews returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 totalReviews:   { type: integer, example: 48 }
 *                 ratingAverage:  { type: number, example: 4.7 }
 */
router.get("/product/:productId", getProductReviews);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit a new product review (authenticated users who purchased the product)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review submitted and awaiting moderation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 review:  { $ref: '#/components/schemas/Review' }
 *       400:
 *         description: Already reviewed this product or validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", verifyToken, createReview);

/**
 * @swagger
 * /api/reviews/{id}/helpful:
 *   patch:
 *     summary: Toggle a "helpful" vote on a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Review ObjectId
 *     responses:
 *       200:
 *         description: Helpful vote toggled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:      { type: boolean, example: true }
 *                 helpfulVotes: { type: integer, example: 13 }
 */
router.patch("/:id/helpful", verifyToken, voteHelpful);

/**
 * @swagger
 * /api/reviews/{id}/reply:
 *   post:
 *     summary: Add or update a seller reply on a review of their product
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Review ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewReplyInput'
 *     responses:
 *       200:
 *         description: Seller reply saved.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Not the product's seller.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/reply", verifySeller, replyToReview);

/**
 * @swagger
 * /api/reviews/admin/pending:
 *   get:
 *     summary: Get all reviews pending admin moderation
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Pending reviews returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 */
router.get("/admin/pending", verifyAdmin, getPendingReviews);

/**
 * @swagger
 * /api/reviews/admin/{id}/moderate:
 *   patch:
 *     summary: Approve or reject a pending review (admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *               reason:
 *                 type: string
 *                 example: Meets community guidelines
 *     responses:
 *       200:
 *         description: Review moderated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/admin/:id/moderate", verifyAdmin, moderateReview);

module.exports = router;
