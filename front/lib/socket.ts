import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (userId?: string, token?: string): Socket => {
  if (typeof window === "undefined") {
    // Return a dummy socket on the server side
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {},
      connect: () => {},
      connected: false,
    } as unknown as Socket;
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: {
        token: token || "",
      },
    });
    console.log("[Socket] Client instance created with token");
  } else if (token && (socket.auth as any)?.token !== token) {
    console.log("[Socket] Token updated, reconnecting client...");
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect().connect();
    }
  }

  if (socket && !socket.connected) {
    socket.connect();
    console.log("[Socket] Connecting client...");
  }

  // Join channel (legacy support, backend now auto-joins but we keep it safe)
  if (userId && socket) {
    socket.emit("join", userId);
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("[Socket] Client disconnected manually");
  }
};

