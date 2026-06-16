const express = require("express");
const router = express.Router();

const {
  logEvent,
  getFunnelAnalytics,
  getCohortAnalytics,
  getRevenueAnalytics,
  getCustomerAnalytics,
  getProductAnalytics
} = require("../Controllers/AnalyticsController");
const { verifyToken, verifyAdmin } = require("../Middelwares/verifyToken");

router.post("/event", (req, res, next) => {
  // Allow optional token verification (for guest events)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    verifyToken(req, res, next);
  } else {
    next();
  }
}, logEvent);

// Admin-only reports endpoints
router.get("/funnel", verifyAdmin, getFunnelAnalytics);
router.get("/cohort", verifyAdmin, getCohortAnalytics);
router.get("/revenue", verifyAdmin, getRevenueAnalytics);
router.get("/customers", verifyAdmin, getCustomerAnalytics);
router.get("/products", verifyAdmin, getProductAnalytics);

module.exports = router;
