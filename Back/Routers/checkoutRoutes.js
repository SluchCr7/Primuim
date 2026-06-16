const express = require("express");
const router = express.Router();

const {
  startCheckout,
  validateAddress,
  saveShipping,
  savePayment,
  getCheckoutState
} = require("../Controllers/CheckoutController");
const { verifyToken } = require("../Middelwares/verifyToken");

router.post("/start", verifyToken, startCheckout);
router.post("/validate-address", verifyToken, validateAddress);
router.post("/shipping", verifyToken, saveShipping);
router.post("/payment", verifyToken, savePayment);
router.get("/state", verifyToken, getCheckoutState);

module.exports = router;
