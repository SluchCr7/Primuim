const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  mergeCart,
  updateCartItemQuantity
} = require("../Controllers/CartController");
const { verifyToken } = require("../Middelwares/verifyToken");

router.get("/", verifyToken, getCart);
router.post("/items", verifyToken, addToCart);
router.put("/items", verifyToken, updateCartItemQuantity);
router.delete("/items/:productId", verifyToken, removeFromCart);
router.delete("/", verifyToken, clearCart);
router.post("/merge", verifyToken, mergeCart);

module.exports = router;