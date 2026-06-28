const Notification = require("../models/Notification");
const { getIO } = require("./socket");

/**
 * Create a notification in the database and emit it via Socket.io in real-time.
 * @param {Object} param0
 * @param {string} param0.user - User ID to notify
 * @param {string} param0.title - Notification title
 * @param {string} param0.message - Notification description/body
 * @returns {Promise<Object>} The created notification document
 */
const createNotification = async ({ user, title, message, type = "system" }) => {
  const notification = await Notification.create({
    user,
    title,
    message,
    isread: false,
    type
  });

  try {
    const io = getIO();
    // Emit to user's personal socket room
    io.to(user.toString()).emit("notification", notification);
    console.log(`Socket notification emitted to user room ${user}: "${title}"`);
  } catch (err) {
    // If socket.io is not initialized or fails, log it but don't crash
    console.warn(`Could not emit notification via socket: ${err.message}`);
  }

  return notification;
};

module.exports = {
  createNotification
};
