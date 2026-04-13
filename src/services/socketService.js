import { io } from "socket.io-client";
import { authStorage } from "../runtime/storage";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

let socket = null;

export const socketService = {
  connect: async () => {
    if (socket?.connected) return socket;

    const token = await authStorage.getItem("token");
    if (!token) return null;

    // Đảm bảo URL kết nối đến namespace /messages
    const url = SOCKET_URL.endsWith("/messages")
      ? SOCKET_URL
      : `${SOCKET_URL.replace(/\/$/, "")}/messages`;

    socket = io(url, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected on /messages:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: () => socket,

  joinRoom: (conversationId) => {
    if (socket?.connected && conversationId) {
      socket.emit("joinGroup", { conversationId }, (res) => {
        if (!res?.success) console.error("Failed to join group:", res?.error);
      });
    }
  },

  leaveRoom: (conversationId) => {
    if (socket?.connected && conversationId) {
      socket.emit("leaveGroup", { conversationId }, (res) => {
        if (!res?.success) console.error("Failed to leave group:", res?.error);
      });
    }
  },

  onNewMessage: (callback) => {
    if (socket) {
      socket.off("receiveMessage");
      socket.on("receiveMessage", callback);
    }
  },

  onMessageStatusUpdate: (callback) => {
    if (socket) {
      // Ví dụ: messageSeen, messageDelivered
      socket.off("messageSeen");
      socket.on("messageSeen", callback);
      socket.off("messageDelivered");
      socket.on("messageDelivered", callback);
    }
  },

  offNewMessage: () => {
    if (socket) socket.off("receiveMessage");
  },

  sendMessage: (conversationId, text, media = []) => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) return reject(new Error("Socket not connected"));

      socket.emit("sendMessage", { conversationId, text, media }, (res) => {
        if (res?.success) {
          resolve(res.message);
        } else {
          reject(new Error(res?.error || "Send message failed via socket"));
        }
      });
    });
  },
};
