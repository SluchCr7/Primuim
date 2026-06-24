const express = require("express");
const router  = express.Router();

const {
  logEvent,
  getFunnelAnalytics,
  getCohortAnalytics,
  getRevenueAnalytics,
  getCustomerAnalytics,
  getProductAnalytics,
} = require("../Controllers/AnalyticsController");
const { verifyToken, verifyAdmin } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Event tracking, funnel, cohort, revenue, customer & product analytics
 */

/**
 * @swagger
 * /api/analytics/event:
 *   post:
 *     summary: Log a user or guest analytics event (page view, product view, add to cart, etc.)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       The Authorization header is **optional**. If provided, the event is associated
 *       with the authenticated user. Otherwise it is recorded as a guest event.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalyticsEventInput'
 *           examples:
 *             product_view:
 *               summary: Product viewed
 *               value:
 *                 event: product_view
 *                 properties:
 *                   productId: '64b1f7e4c9e12a001b8d4321'
 *                   source: search
 *             add_to_cart:
 *               summary: Item added to cart
 *               value:
 *                 event: add_to_cart
 *                 properties:
 *                   productId: '64b1f7e4c9e12a001b8d4321'
 *                   quantity: 1
 *     responses:
 *       200:
 *         description: Event logged.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/event", (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    verifyToken(req, res, next);
  } else {
    next();
  }
}, logEvent);

/**
 * @swagger
 * /api/analytics/funnel:
 *   get:
 *     summary: Get conversion funnel analytics (visit → cart → checkout → purchase)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *     responses:
 *       200:
 *         description: Funnel data returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 funnel:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stage:   { type: string, example: 'product_view' }
 *                       count:   { type: integer, example: 12400 }
 *                       dropOff: { type: number, example: 34.2 }
 */
router.get("/funnel", verifyAdmin, getFunnelAnalytics);

/**
 * @swagger
 * /api/analytics/cohort:
 *   get:
 *     summary: Get cohort retention analytics by user sign-up month
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 6 }
 *         description: Number of cohort months to include
 *     responses:
 *       200:
 *         description: Cohort matrix returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 cohorts: { type: array }
 */
router.get("/cohort", verifyAdmin, getCohortAnalytics);

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get detailed revenue analytics with breakdowns by category, seller, and period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [7d, 30d, 90d, 1y], default: 30d }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, week, month], default: day }
 *     responses:
 *       200:
 *         description: Revenue analytics returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:       { type: boolean, example: true }
 *                 totalRevenue:  { type: number, example: 1250000 }
 *                 byPeriod:      { type: array }
 *                 byCategory:    { type: array }
 *                 bySeller:      { type: array }
 */
router.get("/revenue", verifyAdmin, getRevenueAnalytics);

/**
 * @swagger
 * /api/analytics/customers:
 *   get:
 *     summary: Get customer analytics — LTV, repeat rate, geographic distribution
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [30d, 90d, 1y], default: 30d }
 *     responses:
 *       200:
 *         description: Customer analytics returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:         { type: boolean, example: true }
 *                 avgLTV:          { type: number, example: 4200 }
 *                 repeatRate:      { type: number, example: 42.3 }
 *                 topCountries:    { type: array }
 *                 newVsReturning:  { type: object }
 */
router.get("/customers", verifyAdmin, getCustomerAnalytics);

/**
 * @swagger
 * /api/analytics/products:
 *   get:
 *     summary: Get product performance analytics — views, conversions, revenue per product
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Product analytics returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 products: { type: array }
 */
router.get("/products", verifyAdmin, getProductAnalytics);

module.exports = router;
