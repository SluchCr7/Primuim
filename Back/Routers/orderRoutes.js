const express = require("express");
const router = express.Router();

const {
  getMyOrders,
  createOrder,
  getOrderById,
  cancelOrder,
  downloadInvoice
} = require("../Controllers/OrderController");
const { verifyToken } = require("../Middelwares/verifyToken");

router.get("/mine", verifyToken, getMyOrders);
router.post("/", verifyToken, createOrder);
router.get("/:id", verifyToken, getOrderById);
router.patch("/:id/cancel", verifyToken, cancelOrder);
router.get("/:id/invoice", verifyToken, downloadInvoice);

module.exports = router;