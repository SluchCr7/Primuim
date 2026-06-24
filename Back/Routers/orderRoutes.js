const express = require("express");
const router  = express.Router();

const {
  getMyOrders,
  createOrder,
  getOrderById,
  cancelOrder,
  downloadInvoice,
} = require("../Controllers/OrderController");
const { verifyToken } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order lifecycle — create, view, cancel, and download invoice
 */

/**
 * @swagger
 * /api/orders/mine:
 *   get:
 *     summary: Get all orders placed by the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, processing, shipped, delivered, cancelled] }
 *     responses:
 *       200:
 *         description: Order list returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
router.get("/mine", verifyToken, getMyOrders);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a new order from the current cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Order placed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 order:   { $ref: '#/components/schemas/Order' }
 *       400:
 *         description: Cart empty or stock issue.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", verifyToken, createOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get full details of a specific order (owner or admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Order ObjectId
 *     responses:
 *       200:
 *         description: Order details returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 order:   { $ref: '#/components/schemas/Order' }
 *       403:
 *         description: Access denied — not the order owner.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", verifyToken, getOrderById);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel an order (only if status is pending or processing)
 *     tags: [Orders]
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
 *               reason:
 *                 type: string
 *                 example: Changed my mind
 *     responses:
 *       200:
 *         description: Order cancelled. Stock restored.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Order cannot be cancelled in its current status.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/cancel", verifyToken, cancelOrder);

/**
 * @swagger
 * /api/orders/{id}/invoice:
 *   get:
 *     summary: Download a PDF invoice for a specific order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF invoice stream returned.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id/invoice", verifyToken, downloadInvoice);

module.exports = router;