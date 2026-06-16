const express = require("express");
const router = express.Router();

const {
  changeUserRole,
  createAdmin,
  deleteAdmin,
  getSettings,
  updateSettings,
  getAuditLogs
} = require("../Controllers/SuperAdminController");

const { verifySuperAdmin, verifyAdmin } = require("../Middelwares/verifyToken");

// Settings is viewable by admin but only modifiable by superadmin
router.get("/settings", verifyAdmin, getSettings);
router.put("/settings", verifySuperAdmin, updateSettings);

// User roles, admins, and logs are superadmin-only
router.patch("/users/:id/role", verifySuperAdmin, changeUserRole);
router.post("/admins", verifySuperAdmin, createAdmin);
router.delete("/admins/:id", verifySuperAdmin, deleteAdmin);
router.get("/audit-logs", verifySuperAdmin, getAuditLogs);

module.exports = router;
