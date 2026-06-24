const express = require("express");
const router  = express.Router();

const {
  changeUserRole,
  createAdmin,
  deleteAdmin,
  getSettings,
  updateSettings,
  getAuditLogs,
} = require("../Controllers/SuperAdminController");

const { verifySuperAdmin, verifyAdmin } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: Super-admin only — role management, create/delete admins, platform settings, audit logs
 */

/**
 * @swagger
 * /api/superadmin/settings:
 *   get:
 *     summary: Get global platform settings (viewable by admin and above)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 settings: { $ref: '#/components/schemas/SettingsInput' }
 *   put:
 *     summary: Update global platform settings (super-admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettingsInput'
 *     responses:
 *       200:
 *         description: Settings updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Super-admin role required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/settings", verifyAdmin, getSettings);
router.put("/settings", verifySuperAdmin, updateSettings);

/**
 * @swagger
 * /api/superadmin/users/{id}/role:
 *   patch:
 *     summary: Change any user's role including promoting to admin (super-admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin, superadmin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Role changed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/users/:id/role", verifySuperAdmin, changeUserRole);

/**
 * @swagger
 * /api/superadmin/admins:
 *   post:
 *     summary: Create a new admin account directly (super-admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAdminInput'
 *     responses:
 *       201:
 *         description: Admin account created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email already in use.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/admins", verifySuperAdmin, createAdmin);

/**
 * @swagger
 * /api/superadmin/admins/{id}:
 *   delete:
 *     summary: Remove an admin account (super-admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Admin user ObjectId
 *     responses:
 *       200:
 *         description: Admin account deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Cannot delete your own account.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/admins/:id", verifySuperAdmin, deleteAdmin);

/**
 * @swagger
 * /api/superadmin/audit-logs:
 *   get:
 *     summary: Retrieve the platform audit log (all admin/super-admin actions)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: actor
 *         schema: { type: string }
 *         description: Filter by admin user ObjectId
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Filter by action type (e.g., DELETE_USER, UPDATE_SETTINGS)
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         example: '2026-01-01'
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         example: '2026-06-30'
 *     responses:
 *       200:
 *         description: Audit logs returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       actor:     { type: string }
 *                       action:    { type: string }
 *                       target:    { type: string }
 *                       timestamp: { type: string, format: date-time }
 */
router.get("/audit-logs", verifySuperAdmin, getAuditLogs);

module.exports = router;
