let io;
const jwt = require("jsonwebtoken");

module.exports = {
  init: (server) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(",") : true,
        credentials: true,
      },
    });

    // Authentication middleware
    io.use((socket, next) => {
      let token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      // Also check headers as fallback
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
        } else {
          token = parts[0];
        }
      }

      if (!token) {
        console.warn(`[Socket] Connection rejected: No token provided for socket ${socket.id}`);
        return next(new Error("Authentication error: No token provided"));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        console.warn(`[Socket] Connection rejected: Invalid token for socket ${socket.id} - ${err.message}`);
        return next(new Error("Authentication error: Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      const userId = socket.user?.id;
      const userRole = socket.user?.role;
      
      console.log(`[Socket] Client connected: ${socket.id} (User: ${userId}, Role: ${userRole})`);

      if (userId) {
        // Automatically join the user to their personal room
        socket.join(userId.toString());
        console.log(`[Socket] Client ${socket.id} joined personal room: ${userId}`);

        // If user is admin/superadmin, join admin channel
        if (userRole === "admin" || userRole === "superadmin") {
          socket.join("admin_channel");
          console.log(`[Socket] Admin client ${socket.id} joined admin_channel`);
        }
      }

      // Keep custom join event as a fallback/compatibility option
      socket.on("join", (requestedId) => {
        if (requestedId && requestedId.toString() === userId?.toString()) {
          socket.join(requestedId.toString());
          console.log(`[Socket] Client ${socket.id} joined user room (via join event): ${requestedId}`);
        } else {
          console.warn(`[Socket] Blocked spoofed room join attempt. Client ${userId} tried to join ${requestedId}`);
        }
      });

      socket.on("disconnect", () => {
        console.log(`[Socket] Client disconnected: ${socket.id} (User: ${userId})`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io is not initialized!");
    }
    return io;
  },
};

