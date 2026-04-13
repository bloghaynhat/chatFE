import { io } from "socket.io-client";
import { authStorage } from "../runtime/storage";

class SocketService {
  constructor() {
    this.messagesSocket = null;
    this.friendsSocket = null;
    this.listeners = new Map();
  }

  async initMessagesSocket() {
    if (this.messagesSocket?.connected) {
      return this.messagesSocket;
    }

    const token = await authStorage.getItem("token");
    const serverUrl = import.meta.env.VITE_API_URL?.replace("/v1", "") || "http://localhost:3000";

    this.messagesSocket = io(`${serverUrl}/messages`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.messagesSocket.on("connect", () => {});

    this.messagesSocket.on("disconnect", () => {});

    return this.messagesSocket;
  }

  async initFriendsSocket() {
    if (this.friendsSocket?.connected) {
      return this.friendsSocket;
    }

    const token = await authStorage.getItem("token");
    const serverUrl = import.meta.env.VITE_API_URL?.replace("/v1", "") || "http://localhost:3000";

    this.friendsSocket = io(`${serverUrl}/friends`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.friendsSocket.on("connect", () => {});

    this.friendsSocket.on("disconnect", () => {});

    // Setup friend request event listeners
    this.setupFriendRequestListeners();

    return this.friendsSocket;
  }

  /**
   * Setup listeners for friend request events
   */
  setupFriendRequestListeners() {
    if (!this.friendsSocket) return;

    // Listen for friend request received
    this.friendsSocket.on("friend_request:received", (payload) => {
      this.emit("friend_request:received", payload);
    });

    // Listen for friend request accepted
    this.friendsSocket.on("friend_request:accepted", (payload) => {
      this.emit("friend_request:accepted", payload);
    });

    // Listen for friend request rejected
    this.friendsSocket.on("friend_request:rejected", (payload) => {
      this.emit("friend_request:rejected", payload);
    });

    // Listen for friend request canceled
    this.friendsSocket.on("friend_request:canceled", (payload) => {
      this.emit("friend_request:canceled", payload);
    });

    // Listen for unfriended event
    this.friendsSocket.on("friendship:unfriended", (payload) => {
      this.emit("friendship:unfriended", payload);
    });
  }

  /**
   * Listen for message events
   */
  setupMessageListeners() {
    if (!this.messagesSocket) return;

    this.messagesSocket.on("receiveMessage", (data) => {
      this.emit("receiveMessage", data);
    });

    this.messagesSocket.on("typing:start", (data) => {
      this.emit("typing:start", data);
    });

    this.messagesSocket.on("typing:stop", (data) => {
      this.emit("typing:stop", data);
    });
  }

  /**
   * Emit socket event to custom listeners
   */
  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      const callbacks = this.listeners.get(eventName);
      callbacks.forEach((cb) => cb(data));
    }
  }

  /**
   * Register custom listener
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Send message via socket
   */
  sendMessage(conversationId, text, media = []) {
    if (!this.messagesSocket?.connected) {
      console.error("[Messages] Socket not connected");
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("sendMessage", { conversationId, text, media }, (res) => {
        if (res.success) {
          resolve(res.message);
        } else {
          reject(new Error(res.error || "Failed to send message"));
        }
      });
    });
  }

  /**
   * Join group chat room
   */
  joinGroup(conversationId) {
    if (!this.messagesSocket?.connected) {
      console.error("[Messages] Socket not connected");
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("joinGroup", { conversationId }, (res) => {
        if (res.success) {
          resolve(res);
        } else {
          reject(new Error(res.error || "Failed to join group"));
        }
      });
    });
  }

  /**
   * Leave group chat room
   */
  leaveGroup(conversationId) {
    if (!this.messagesSocket?.connected) {
      console.error("[Messages] Socket not connected");
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("leaveGroup", { conversationId }, (res) => {
        if (res.success) {
          resolve(res);
        } else {
          reject(new Error(res.error || "Failed to leave group"));
        }
      });
    });
  }

  /**
   * Disconnect all sockets
   */
  disconnect() {
    if (this.messagesSocket) {
      this.messagesSocket.disconnect();
      this.messagesSocket = null;
    }
    if (this.friendsSocket) {
      this.friendsSocket.disconnect();
      this.friendsSocket = null;
    }
    this.listeners.clear();
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Export for convenience in components
export const initSocket = async () => {
  await socketService.initMessagesSocket();
  await socketService.initFriendsSocket();
};

export const onFriendRequest = (callback) => {
  return socketService.on("friend_request:received", callback);
};

export const onFriendRequestAccepted = (callback) => {
  return socketService.on("friend_request:accepted", callback);
};

export const onFriendRequestRejected = (callback) => {
  return socketService.on("friend_request:rejected", callback);
};

export const onReceiveMessage = (callback) => {
  return socketService.on("receiveMessage", callback);
};
