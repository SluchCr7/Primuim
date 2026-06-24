const express = require("express");
const router  = express.Router();

const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  mergeCart,
  updateCartItemQuantity,
} = require("../Controllers/CartController");
const { verifyToken } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart — add, update, remove, clear, merge guest cart
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get the authenticated user's current cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 cart:    { $ref: '#/components/schemas/Cart' }
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", verifyToken, getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add a product to the cart (or increase quantity if already present)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartInput'
 *     responses:
 *       200:
 *         description: Product added to cart.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 cart:    { $ref: '#/components/schemas/Cart' }
 *       400:
 *         description: Out of stock or invalid product.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Update the quantity of a specific cart item
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartInput'
 *     responses:
 *       200:
 *         description: Cart quantity updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 cart:    { $ref: '#/components/schemas/Cart' }
 *       404:
 *         description: Item not found in cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/items", verifyToken, addToCart);
router.put("/items", verifyToken, updateCartItemQuantity);

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   delete:
 *     summary: Remove a single product line from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *         description: Product ObjectId to remove
 *     responses:
 *       200:
 *         description: Item removed from cart.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 cart:    { $ref: '#/components/schemas/Cart' }
 */
router.delete("/items/:productId", verifyToken, removeFromCart);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear all items from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete("/", verifyToken, clearCart);

/**
 * @swagger
 * /api/cart/merge:
 *   post:
 *     summary: Merge a guest (localStorage) cart into the authenticated user's cart on login
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MergeCartInput'
 *     responses:
 *       200:
 *         description: Carts merged successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 cart:    { $ref: '#/components/schemas/Cart' }
 */
router.post("/merge", verifyToken, mergeCart);

module.exports = router;