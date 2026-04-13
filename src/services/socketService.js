import { io } from "socket.io-client";
import { authStorage } from "../runtime/storage";

class SocketService {
  constructor() {
    this.messagesSocket = null;
    this.friendsSocket = null;
    this.listeners = new Map();
  }

  // ================= INIT =================
  async initMessagesSocket() {
    if (this.messagesSocket?.connected) {
      return this.messagesSocket;
    }

    const token = await authStorage.getItem("token");
    if (!token) return null;

    const serverUrl = import.meta.env.VITE_API_URL?.replace("/v1", "") || "http://localhost:3000";

    this.messagesSocket = io(`${serverUrl}/messages`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.messagesSocket.on("connect", () => {
      console.log("[Messages] connected:", this.messagesSocket.id);
    });

    this.messagesSocket.on("disconnect", (reason) => {
      console.log("[Messages] disconnected:", reason);
    });

    this.messagesSocket.on("connect_error", (err) => {
      console.error("[Messages] error:", err.message);
    });

    this.setupMessageListeners();

    return this.messagesSocket;
  }

  async initFriendsSocket() {
    if (this.friendsSocket?.connected) {
      return this.friendsSocket;
    }

    const token = await authStorage.getItem("token");
    if (!token) return null;

    const serverUrl = import.meta.env.VITE_API_URL?.replace("/v1", "") || "http://localhost:3000";

    this.friendsSocket = io(`${serverUrl}/friends`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.friendsSocket.on("connect", () => {
      console.log("[Friends] connected:", this.friendsSocket.id);
    });

    this.friendsSocket.on("disconnect", (reason) => {
      console.log("[Friends] disconnected:", reason);
    });

    this.setupFriendListeners();

    return this.friendsSocket;
  }

  // ================= LISTENERS =================
  setupMessageListeners() {
    if (!this.messagesSocket) return;

    this.messagesSocket.on("receiveMessage", (data) => {
      this.emit("receiveMessage", data);
    });

    this.messagesSocket.on("messageSeen", (data) => {
      this.emit("messageSeen", data);
    });

    this.messagesSocket.on("messageDelivered", (data) => {
      this.emit("messageDelivered", data);
    });

    this.messagesSocket.on("typing:start", (data) => {
      this.emit("typing:start", data);
    });

    this.messagesSocket.on("typing:stop", (data) => {
      this.emit("typing:stop", data);
    });
  }

  setupFriendListeners() {
    if (!this.friendsSocket) return;

    this.friendsSocket.on("friend_request:received", (payload) => {
      this.emit("friend_request:received", payload);
    });

    this.friendsSocket.on("friend_request:accepted", (payload) => {
      this.emit("friend_request:accepted", payload);
    });

    this.friendsSocket.on("friend_request:rejected", (payload) => {
      this.emit("friend_request:rejected", payload);
    });

    this.friendsSocket.on("friend_request:canceled", (payload) => {
      this.emit("friend_request:canceled", payload);
    });

    this.friendsSocket.on("friendship:unfriended", (payload) => {
      this.emit("friendship:unfriended", payload);
    });
  }

  // ================= EVENT BUS =================
  emit(eventName, data) {
    if (!this.listeners.has(eventName)) return;

    this.listeners.get(eventName).forEach((cb) => cb(data));
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    this.listeners.get(eventName).push(callback);

    // unsubscribe
    return () => {
      const arr = this.listeners.get(eventName);
      const index = arr.indexOf(callback);
      if (index !== -1) arr.splice(index, 1);
    };
  }

  off(eventName) {
    if (this.listeners.has(eventName)) {
      this.listeners.delete(eventName);
    }
  }

  // ================= CONVENIENCE METHODS =================
  async connect() {
    await this.initMessagesSocket();
    await this.initFriendsSocket();
    return this.messagesSocket;
  }

  onNewMessage(callback) {
    return this.on("receiveMessage", callback);
  }

  offNewMessage() {
    this.off("receiveMessage");
  }

  onMessageStatusUpdate(callback) {
    return this.on("messageSeen", callback);
  }

  onTypingStart(callback) {
    return this.on("typing:start", callback);
  }

  onTypingStop(callback) {
    return this.on("typing:stop", callback);
  }

  joinRoom(conversationId) {
    return this.joinGroup(conversationId);
  }

  leaveRoom(conversationId) {
    return this.leaveGroup(conversationId);
  }

  // ================= MESSAGE ACTIONS =================
  sendMessage(conversationId, text, media = []) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("sendMessage", { conversationId, text, media }, (res) => {
        if (res?.success) resolve(res.messages?.[0] || res.message);
        else reject(new Error(res?.error || "Send failed"));
      });
    });
  }

  joinGroup(conversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("joinGroup", { conversationId }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Join failed"));
      });
    });
  }

  leaveGroup(conversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("leaveGroup", { conversationId }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Leave failed"));
      });
    });
  }

  startTyping(conversationId, isGroup = false) {
    if (!this.messagesSocket?.connected) return;

    const payload = isGroup ? { groupId: conversationId } : { toUserId: conversationId };

    this.messagesSocket.emit("typing:start", payload);
  }

  stopTyping(conversationId, isGroup = false) {
    if (!this.messagesSocket?.connected) return;

    const payload = isGroup ? { groupId: conversationId } : { toUserId: conversationId };

    this.messagesSocket.emit("typing:stop", payload);
  }

  // ================= CLEANUP =================
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

// ================= EXPORT =================
export const socketService = new SocketService();

export const initSocket = async () => {
  await socketService.initMessagesSocket();
  await socketService.initFriendsSocket();
};

// Message
export const onReceiveMessage = (cb) => socketService.on("receiveMessage", cb);

export const onMessageSeen = (cb) => socketService.on("messageSeen", cb);

export const onTypingStart = (cb) => socketService.on("typing:start", cb);

export const onTypingStop = (cb) => socketService.on("typing:stop", cb);

// Friend
export const onFriendRequest = (cb) => socketService.on("friend_request:received", cb);

export const onFriendRequestAccepted = (cb) => socketService.on("friend_request:accepted", cb);

export const onFriendRequestRejected = (cb) => socketService.on("friend_request:rejected", cb);

export const onUnfriend = (cb) => socketService.on("friendship:unfriended", cb);
