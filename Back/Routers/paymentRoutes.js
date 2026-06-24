const express = require("express");
const router  = express.Router();

const {
  getPaymentMethods,
  getMyPayments,
  createPayment,
  updatePaymentStatus,
  refundPayment,
  handlePaymentWebhook,
} = require("../Controllers/PaymentController");
const { verifyToken, verifyAdmin } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing, status updates, refunds, and provider webhooks
 */

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     summary: Get all available payment methods (Stripe, COD, etc.)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Payment methods returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 methods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:    { type: string, example: stripe }
 *                       label: { type: string, example: 'Credit / Debit Card (Stripe)' }
 *                       icon:  { type: string, example: 'https://...' }
 */
router.get("/methods", getPaymentMethods);

/**
 * @swagger
 * /api/payments/mine:
 *   get:
 *     summary: Get all payment transactions belonging to the authenticated user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Payment history returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 */
router.get("/mine", verifyToken, getMyPayments);

/**
 * @swagger
 * /api/payments/orders/{orderId}:
 *   post:
 *     summary: Initiate payment for a specific order (returns Stripe PaymentIntent or COD confirmation)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         description: Order ObjectId to pay for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentInput'
 *     responses:
 *       201:
 *         description: Payment created. For Stripe, returns clientSecret for front-end confirmation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:      { type: boolean, example: true }
 *                 clientSecret: { type: string, example: 'pi_3Nz_secret_...' }
 *                 payment:      { $ref: '#/components/schemas/Payment' }
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/orders/:orderId", verifyToken, createPayment);

/**
 * @swagger
 * /api/payments/{id}/status:
 *   patch:
 *     summary: Update payment status (user self-reports Stripe result after front-end confirmation)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Payment ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentStatusInput'
 *     responses:
 *       200:
 *         description: Payment status updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/:id/status", verifyToken, updatePaymentStatus);

/**
 * @swagger
 * /api/payments/admin/{id}/status:
 *   patch:
 *     summary: Admin override — forcefully update a payment's status
 *     tags: [Payments]
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
 *             $ref: '#/components/schemas/UpdatePaymentStatusInput'
 *     responses:
 *       200:
 *         description: Payment status updated by admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Admin role required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/admin/:id/status", verifyAdmin, updatePaymentStatus);

/**
 * @swagger
 * /api/payments/admin/{id}/refund:
 *   post:
 *     summary: Issue a full or partial refund for a payment (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to refund (omit for full refund)
 *                 example: 1500
 *               reason:
 *                 type: string
 *                 example: Customer request
 *     responses:
 *       200:
 *         description: Refund issued successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Payment not eligible for refund.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/admin/:id/refund", verifyAdmin, refundPayment);

/**
 * @swagger
 * /api/payments/webhook/{provider}:
 *   post:
 *     summary: Receive payment provider webhooks (Stripe, etc.) — do NOT call manually
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema: { type: string, enum: [stripe] }
 *         description: Payment provider identifier
 *     requestBody:
 *       description: Raw webhook payload (verified via provider signature header)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid webhook signature.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/webhook/:provider", handlePaymentWebhook);

module.exports = router;