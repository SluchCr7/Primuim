const express = require("express");
const router  = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleBlockUser,
  deleteUser,
  getUsersStats,
  getRecentUsers,
  getDashboardAnalytics,
  getSalesAnalytics,
  getInventoryAnalytics,
  adjustProductInventory,
  getSellerRequests,
  moderateSellerRequest,
} = require("../Controllers/AdminController");
const { verifyAdmin } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard — users, analytics, inventory, seller application review
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all registered users with search & filter
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, seller, admin] }
 *       - in: query
 *         name: isBlocked
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: User list returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPublic'
 *                 totalUsers: { type: integer, example: 1204 }
 */
router.get("/users", verifyAdmin, getAllUsers);

/**
 * @swagger
 * /api/admin/users/stats:
 *   get:
 *     summary: Get aggregated user statistics (total, new this month, verified rate…)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User stats returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:      { type: boolean, example: true }
 *                 total:        { type: integer, example: 1204 }
 *                 newThisMonth: { type: integer, example: 87 }
 *                 verified:     { type: integer, example: 1102 }
 *                 sellers:      { type: integer, example: 34 }
 */
router.get("/users/stats", verifyAdmin, getUsersStats);

/**
 * @swagger
 * /api/admin/users/recent:
 *   get:
 *     summary: Get the most recently registered users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Recent users list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPublic'
 */
router.get("/users/recent", verifyAdmin, getRecentUsers);

/**
 * @swagger
 * /api/admin/analytics/dashboard:
 *   get:
 *     summary: Get high-level KPIs for the admin dashboard (revenue, orders, users, products)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard KPIs returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:        { type: boolean, example: true }
 *                 totalRevenue:   { type: number, example: 1250000 }
 *                 totalOrders:    { type: integer, example: 3420 }
 *                 totalUsers:     { type: integer, example: 1204 }
 *                 totalProducts:  { type: integer, example: 892 }
 *                 revenueGrowth:  { type: number, example: 12.5 }
 */
router.get("/analytics/dashboard", verifyAdmin, getDashboardAnalytics);

/**
 * @swagger
 * /api/admin/analytics/sales:
 *   get:
 *     summary: Get time-series sales analytics data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [7d, 30d, 90d, 1y], default: 30d }
 *     responses:
 *       200:
 *         description: Sales chart data returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:    { type: string, example: '2026-06-01' }
 *                       revenue: { type: number, example: 42000 }
 *                       orders:  { type: integer, example: 120 }
 */
router.get("/analytics/sales", verifyAdmin, getSalesAnalytics);

/**
 * @swagger
 * /api/admin/analytics/inventory:
 *   get:
 *     summary: Get inventory health analytics (low stock, out of stock, overstock)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory analytics returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 lowStock:   { type: integer, example: 14 }
 *                 outOfStock: { type: integer, example: 3 }
 *                 healthy:    { type: integer, example: 875 }
 */
router.get("/analytics/inventory", verifyAdmin, getInventoryAnalytics);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get full details of a specific user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 user:    { $ref: '#/components/schemas/UserPublic' }
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/users/:id", verifyAdmin, getUserById);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Update a user's role (admin only)
 *     tags: [Admin]
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
 *             $ref: '#/components/schemas/UpdateRoleInput'
 *     responses:
 *       200:
 *         description: Role updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/users/:id/role", verifyAdmin, updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}/block:
 *   patch:
 *     summary: Block or unblock a user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Block status toggled.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/users/:id/block", verifyAdmin, toggleBlockUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Permanently delete a user account (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete("/users/:id", verifyAdmin, deleteUser);

/**
 * @swagger
 * /api/admin/products/{id}/inventory:
 *   patch:
 *     summary: Manually adjust a product's stock level (admin override)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Product ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdjustInventoryInput'
 *     responses:
 *       200:
 *         description: Inventory adjusted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/products/:id/inventory", verifyAdmin, adjustProductInventory);

/**
 * @swagger
 * /api/admin/seller-requests:
 *   get:
 *     summary: Get all pending seller applications awaiting admin review
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected], default: pending }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Seller requests returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 requests: { type: array }
 */
router.get("/seller-requests", verifyAdmin, getSellerRequests);

/**
 * @swagger
 * /api/admin/seller-requests/{id}:
 *   patch:
 *     summary: Approve or reject a seller application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Seller application ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModerateSellerInput'
 *     responses:
 *       200:
 *         description: Application moderated. Notification sent to applicant.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/seller-requests/:id", verifyAdmin, moderateSellerRequest);

module.exports = router;