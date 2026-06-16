const express = require("express");
const router = express.Router();

const {
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  incrementCouponUsage
} = require("../Controllers/DiscountController");
const { verifyAdmin, verifyToken } = require("../Middelwares/verifyToken");

router.get("/", verifyAdmin, getAllCoupons);
router.post("/", verifyAdmin, createCoupon);
router.delete("/:id", verifyAdmin, deleteCoupon);
router.post("/validate", verifyToken, validateCoupon);
router.post("/apply", verifyToken, applyCoupon);
router.patch("/usage", verifyAdmin, incrementCouponUsage);

module.exports = router;