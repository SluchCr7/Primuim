const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  broadcastNotification
} = require("../Controllers/NotificationController");
const { verifyToken, verifyAdmin } = require("../Middelwares/verifyToken");

// Require authentication for all notification routes
router.use(verifyToken);

router.route("/")
  .get(getNotifications)
  .delete(clearAllNotifications);

router.post("/broadcast", verifyAdmin, broadcastNotification);

router.put("/read-all", markAllAsRead);

router.route("/:id")
  .delete(deleteNotification);

router.put("/:id/read", markAsRead);

module.exports = router;

