const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const { User } = require("../models/User");
const { getIO } = require("../utils/socket");

// ========================================
// @desc    Get current user's notifications (sorted by newest, paginated)
// @route   GET /api/notifications
// @access  Private
// ========================================
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const count = await Notification.countDocuments({ user: req.user.id });
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Also get the unread count for convenience
  const unreadCount = await Notification.countDocuments({ user: req.user.id, isread: false });

  res.status(200).json({
    success: true,
    count,
    unreadCount,
    pages: Math.ceil(count / limit),
    currentPage: page,
    notifications
  });
});

// ========================================
// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// ========================================
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });

  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }

  notification.isread = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    notification
  });
});

// ========================================
// @desc    Mark all user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
// ========================================
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, isread: false },
    { $set: { isread: true } }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read"
  });
});

// ========================================
// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
// ========================================
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted"
  });
});

// ========================================
// @desc    Clear all notifications for the user
// @route   DELETE /api/notifications
// @access  Private
// ========================================
const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user.id });

  res.status(200).json({
    success: true,
    message: "All notifications cleared"
  });
});

// ========================================
// @desc    Broadcast a notification to all users or a specific group
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
// ========================================
const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type = "system", targetGroup = "all" } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: "Title and message are required" });
  }

  // Determine target users query
  let query = {};
  if (targetGroup === "sellers") {
    query = { role: "seller" };
  } else if (targetGroup === "buyers" || targetGroup === "customers" || targetGroup === "users") {
    query = { role: "user" };
  } else if (targetGroup === "admins") {
    query = { role: { $in: ["admin", "superadmin"] } };
  }

  const users = await User.find(query, "_id");

  if (users.length === 0) {
    return res.status(200).json({ success: true, message: "No target users found for this group" });
  }

  // Create notifications in bulk
  const notificationDocs = users.map(u => ({
    user: u._id,
    title,
    message,
    isread: false,
    type
  }));

  const createdNotifications = await Notification.insertMany(notificationDocs);

  // Emit to user rooms via Socket.io
  try {
    const io = getIO();
    createdNotifications.forEach((notification) => {
      io.to(notification.user.toString()).emit("notification", notification);
    });
    console.log(`[Socket] Broadcast notification "${title}" emitted to ${createdNotifications.length} users (Group: ${targetGroup})`);
  } catch (err) {
    console.warn(`[Socket] Broadcast real-time emit failed: ${err.message}`);
  }

  res.status(201).json({
    success: true,
    message: `Broadcast notification successfully sent to ${users.length} users.`,
    count: users.length
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  broadcastNotification
};

