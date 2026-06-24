const express = require("express");
const router  = express.Router();

const {
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  incrementCouponUsage,
} = require("../Controllers/DiscountController");
const { verifyAdmin, verifyToken } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Discounts
 *   description: Coupon & discount code management — create, validate, apply
 */

/**
 * @swagger
 * /api/discounts:
 *   get:
 *     summary: Get all coupons (admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Coupon list returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 coupons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *       403:
 *         description: Admin role required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create a new coupon/discount code (admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CouponInput'
 *     responses:
 *       201:
 *         description: Coupon created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 coupon:  { $ref: '#/components/schemas/Coupon' }
 *       400:
 *         description: Coupon code already exists or validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", verifyAdmin, getAllCoupons);
router.post("/", verifyAdmin, createCoupon);

/**
 * @swagger
 * /api/discounts/{id}:
 *   delete:
 *     summary: Delete a coupon by ObjectId (admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Coupon deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Coupon not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", verifyAdmin, deleteCoupon);

/**
 * @swagger
 * /api/discounts/validate:
 *   post:
 *     summary: Validate a coupon code and preview the discount (does not apply it)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateCouponInput'
 *     responses:
 *       200:
 *         description: Coupon is valid. Returns discount amount.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:        { type: boolean, example: true }
 *                 discountAmount: { type: number, example: 400 }
 *                 coupon:         { $ref: '#/components/schemas/Coupon' }
 *       400:
 *         description: Coupon expired, used up, or minimum order not met.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/validate", verifyToken, validateCoupon);

/**
 * @swagger
 * /api/discounts/apply:
 *   post:
 *     summary: Apply a validated coupon to the current checkout session
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateCouponInput'
 *     responses:
 *       200:
 *         description: Coupon applied. Returns updated total.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:        { type: boolean, example: true }
 *                 discountAmount: { type: number, example: 400 }
 *                 newTotal:       { type: number, example: 1600 }
 *       400:
 *         description: Invalid or already applied coupon.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/apply", verifyToken, applyCoupon);

/**
 * @swagger
 * /api/discounts/usage:
 *   patch:
 *     summary: Increment a coupon's usage count after a successful order (admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: SUMMER20
 *     responses:
 *       200:
 *         description: Usage count incremented.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/usage", verifyAdmin, incrementCouponUsage);

module.exports = router;