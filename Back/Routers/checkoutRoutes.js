const express = require("express");
const router  = express.Router();

const {
  startCheckout,
  validateAddress,
  saveShipping,
  savePayment,
  getCheckoutState,
} = require("../Controllers/CheckoutController");
const { verifyToken } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: Multi-step checkout session — address validation, shipping, payment state
 */

/**
 * @swagger
 * /api/checkout/start:
 *   post:
 *     summary: Initialize a new checkout session from the current cart
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checkout session started. Returns initial checkout state.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 checkout: { $ref: '#/components/schemas/CheckoutState' }
 *       400:
 *         description: Cart is empty.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/start", verifyToken, startCheckout);

/**
 * @swagger
 * /api/checkout/validate-address:
 *   post:
 *     summary: Validate a shipping address before saving it to the checkout session
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address is valid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Address validation failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/validate-address", verifyToken, validateAddress);

/**
 * @swagger
 * /api/checkout/shipping:
 *   post:
 *     summary: Save selected shipping address to the active checkout session
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressId]
 *             properties:
 *               addressId:
 *                 type: string
 *                 example: '64b9aaaaaaaaaaaaaaaaaa99'
 *     responses:
 *       200:
 *         description: Shipping address saved. Returns updated checkout state.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 checkout: { $ref: '#/components/schemas/CheckoutState' }
 */
router.post("/shipping", verifyToken, saveShipping);

/**
 * @swagger
 * /api/checkout/payment:
 *   post:
 *     summary: Save selected payment method to the active checkout session
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod]
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [stripe, cod]
 *                 example: stripe
 *               couponCode:
 *                 type: string
 *                 example: SUMMER20
 *     responses:
 *       200:
 *         description: Payment method saved. Returns final checkout state with totals.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 checkout: { $ref: '#/components/schemas/CheckoutState' }
 */
router.post("/payment", verifyToken, savePayment);

/**
 * @swagger
 * /api/checkout/state:
 *   get:
 *     summary: Retrieve the current active checkout session state
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current checkout state returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 checkout: { $ref: '#/components/schemas/CheckoutState' }
 *       404:
 *         description: No active checkout session found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/state", verifyToken, getCheckoutState);

module.exports = router;
