let io;

module.exports = {
  init: (server) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(",") : true,
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log(`New socket client connected: ${socket.id}`);

      // Authenticated users register their personal room
      socket.on("join", (userId) => {
        if (userId) {
          socket.join(userId.toString());
          console.log(`Socket client ${socket.id} joined user room: ${userId}`);
        }
      });

      // Admins register to admin group room
      socket.on("joinAdmin", () => {
        socket.join("admin_channel");
        console.log(`Socket client ${socket.id} joined admin room`);
      });

      socket.on("disconnect", () => {
        console.log(`Socket client disconnected: ${socket.id}`);
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
