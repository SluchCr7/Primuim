const express = require("express");
const router = express.Router();

const {
  getPaymentMethods,
  getMyPayments,
  createPayment,
  updatePaymentStatus,
  refundPayment,
  handlePaymentWebhook
} = require("../Controllers/PaymentController");
const { verifyToken, verifyAdmin } = require("../Middelwares/verifyToken");

router.get("/methods", getPaymentMethods);
router.get("/mine", verifyToken, getMyPayments);
router.post("/orders/:orderId", verifyToken, createPayment);
router.patch("/:id/status", verifyToken, updatePaymentStatus);
router.patch("/admin/:id/status", verifyAdmin, updatePaymentStatus);
router.post("/admin/:id/refund", verifyAdmin, refundPayment);
router.post("/webhook/:provider", handlePaymentWebhook);

module.exports = router;