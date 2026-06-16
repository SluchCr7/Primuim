const { User } = require("../models/User");
const AuditLog = require("../models/AuditLog");
const SystemSettings = require("../models/SystemSettings");
const asyncHandler = require("express-async-handler");

// Helper to log audit events
const logAuditEvent = async ({ actor, action, targetType, targetId, details, ip }) => {
  try {
    await AuditLog.create({
      actor,
      action,
      targetType,
      targetId,
      details,
      ip
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

// ========================================
// @desc    Change User Role (Superadmin only)
// @route   PATCH /api/superadmin/users/:id/role
// @access  Private (Superadmin only)
// ========================================
const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const allowedRoles = ["customer", "seller", "moderator", "admin", "superadmin"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role specified" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const oldRole = user.role;
  user.role = role;
  await user.save();

  await logAuditEvent({
    actor: req.user.id,
    action: "ROLE_CHANGE",
    targetType: "User",
    targetId: user._id.toString(),
    details: { oldRole, newRole: role, username: user.username },
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `User role updated from "${oldRole}" to "${role}" successfully.`,
    user: { id: user._id, username: user.username, role: user.role }
  });
});

// ========================================
// @desc    Create a new admin directly
// @route   POST /api/superadmin/admins
// @access  Private (Superadmin only)
// ========================================
const createAdmin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "Username, email and password are required" });
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return res.status(400).json({ success: false, message: "Email already registered" });
  }

  const admin = await User.create({
    username,
    email,
    password,
    role: "admin",
    isVerify: true,
    verifyAt: new Date()
  });

  await logAuditEvent({
    actor: req.user.id,
    action: "CREATE_ADMIN",
    targetType: "User",
    targetId: admin._id.toString(),
    details: { username: admin.username, email: admin.email },
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: "Admin created successfully",
    admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role }
  });
});

// ========================================
// @desc    Delete an admin user
// @route   DELETE /api/superadmin/admins/:id
// @access  Private (Superadmin only)
// ========================================
const deleteAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: "You cannot delete yourself" });
  }

  const admin = await User.findById(id);
  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }

  if (admin.role !== "admin") {
    return res.status(400).json({ success: false, message: "Target user is not an admin" });
  }

  await User.findByIdAndDelete(id);

  await logAuditEvent({
    actor: req.user.id,
    action: "DELETE_ADMIN",
    targetType: "User",
    targetId: id,
    details: { username: admin.username, email: admin.email },
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `Admin user "${admin.username}" deleted successfully.`
  });
});

// ========================================
// @desc    Get system settings
// @route   GET /api/superadmin/settings
// @access  Private (Superadmin / Admin)
// ========================================
const getSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({});
  }

  res.status(200).json({
    success: true,
    settings
  });
});

// ========================================
// @desc    Update system settings
// @route   PUT /api/superadmin/settings
// @access  Private (Superadmin only)
// ========================================
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = new SystemSettings({});
  }

  const oldSettings = settings.toObject();

  Object.assign(settings, req.body);
  const updated = await settings.save();

  await logAuditEvent({
    actor: req.user.id,
    action: "UPDATE_SETTINGS",
    targetType: "SystemSettings",
    targetId: updated._id.toString(),
    details: { oldSettings, newSettings: updated.toObject() },
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: "System settings updated successfully",
    settings: updated
  });
});

// ========================================
// @desc    Get audit logs
// @route   GET /api/superadmin/audit-logs
// @access  Private (Superadmin only)
// ========================================
const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const totalLogs = await AuditLog.countDocuments();
  const logs = await AuditLog.find()
    .populate("actor", "username email role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    page,
    limit,
    totalLogs,
    totalPages: Math.ceil(totalLogs / limit),
    logs
  });
});

module.exports = {
  changeUserRole,
  createAdmin,
  deleteAdmin,
  getSettings,
  updateSettings,
  getAuditLogs
};
