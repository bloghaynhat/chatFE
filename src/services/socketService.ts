import { io, Socket } from "socket.io-client";
import { authStorage } from "../runtime/storage";

class SocketService {
  messagesSocket: Socket | null = null;
  friendsSocket: Socket | null = null;
  blocksSocket: Socket | null = null;
  listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.messagesSocket = null;
    this.friendsSocket = null;
    this.blocksSocket = null;
    this.listeners = new Map();
  }

  // ================= INIT =================
  async initMessagesSocket() {
    if (this.messagesSocket?.connected) {
      return this.messagesSocket;
    }

    const token = await authStorage.getItem("token");
    if (!token) return null;

    const serverUrl =
      import.meta.env.VITE_API_URL?.replace("/v1", "") ||
      "http://localhost:3000";

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

    const serverUrl =
      import.meta.env.VITE_API_URL?.replace("/v1", "") ||
      "http://localhost:3000";

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

  async initBlocksSocket() {
    if (this.blocksSocket?.connected) {
      return this.blocksSocket;
    }

    const token = await authStorage.getItem("token");
    if (!token) return null;

    const serverUrl =
      import.meta.env.VITE_API_URL?.replace("/v1", "") ||
      "http://localhost:3000";

    this.blocksSocket = io(`${serverUrl}/blocks`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.blocksSocket.on("connect", () => {
      console.log("[Blocks] connected:", this.blocksSocket.id);
    });

    this.blocksSocket.on("disconnect", (reason) => {
      console.log("[Blocks] disconnected:", reason);
    });

    this.blocksSocket.on("connect_error", (err) => {
      console.error("[Blocks] error:", err.message);
    });

    this.setupBlockListeners();

    return this.blocksSocket;
  }

  // ================= LISTENERS =================
  setupMessageListeners() {
    if (!this.messagesSocket) return;

    // Existing events
    this.messagesSocket.on("receiveMessage", (data) => {
      this.emit("receiveMessage", data);
    });

    this.messagesSocket.on("message:edited", (data) => {
      this.emit("message:edited", data);
    });

    this.messagesSocket.on("message:revoked", (data) => {
      this.emit("message:revoked", data);
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

    this.messagesSocket.on("conversation:updated", (data) => {
      this.emit("conversation:updated", data);
    });

    this.messagesSocket.on("conversation:members_added", (data) => {
      this.emit("conversation:members_added", data);
    });

    this.messagesSocket.on("conversation:member_removed", (data) => {
      this.emit("conversation:member_removed", data);
    });

    this.messagesSocket.on("message:reaction", (data) => {
      this.emit("message:reaction", data);
    });

    this.messagesSocket.on("message:reaction:remove", (data) => {
      this.emit("message:reaction:remove", data);
    });

    // New events to add - Message events
    this.messagesSocket.on("message:deleted", (data) => {
      this.emit("message:deleted", data);
    });

    this.messagesSocket.on("message:deleted_for_everyone", (data) => {
      this.emit("message:deleted_for_everyone", data);
    });

    this.messagesSocket.on("message:reactions:clear", (data) => {
      this.emit("message:reactions:clear", data);
    });

    this.messagesSocket.on("message:pinned", (data) => {
      this.emit("message:pinned", data);
    });

    this.messagesSocket.on("message:unpinned", (data) => {
      this.emit("message:unpinned", data);
    });

    this.messagesSocket.on("message:quoted", (data) => {
      this.emit("message:quoted", data);
    });

    // Conversation events
    this.messagesSocket.on("conversation:created", (data) => {
      this.emit("conversation:created", data);
    });

    this.messagesSocket.on("conversation:pin_toggled", (data) => {
      this.emit("conversation:pin_toggled", data);
    });

    this.messagesSocket.on("conversation:archived_toggled", (data) => {
      this.emit("conversation:archived_toggled", data);
    });

    this.messagesSocket.on("conversation:mute_changed", (data) => {
      this.emit("conversation:mute_changed", data);
    });

    // Group events
    this.messagesSocket.on("group:member_left", (data) => {
      this.emit("group:member_left", data);
    });

    this.messagesSocket.on("group:dissolved", (data) => {
      this.emit("group:dissolved", data);
    });

    this.messagesSocket.on("group:renamed", (data) => {
      this.emit("group:renamed", data);
    });

    this.messagesSocket.on("group:avatar_changed", (data) => {
      this.emit("group:avatar_changed", data);
    });

    this.messagesSocket.on("group:admin_changed", (data) => {
      this.emit("group:admin_changed", data);
    });

    this.messagesSocket.on("group:owner_transferred", (data) => {
      this.emit("group:owner_transferred", data);
    });

    this.messagesSocket.on("group:member_approved", (data) => {
      this.emit("group:member_approved", data);
    });

    this.messagesSocket.on("group:member_rejected", (data) => {
      this.emit("group:member_rejected", data);
    });

    this.messagesSocket.on("group:settings_updated", (data) => {
      this.emit("group:settings_updated", data);
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

  setupBlockListeners() {
    if (!this.blocksSocket) return;

    this.blocksSocket.on("block:blocked", (payload) => {
      const blockerId = payload?.data?.blockedBy || payload?.blockedBy || payload?.userId;
      this.emit("block:blocked", payload);
      this.emit("blockStatus:changed", {
        ...payload,
        isBlockedByOther: true,
        userId: blockerId,
      });
    });

    this.blocksSocket.on("block:unblocked", (payload) => {
      const unblockerId = payload?.data?.unblockedBy || payload?.unblockedBy || payload?.userId;
      this.emit("block:unblocked", payload);
      this.emit("blockStatus:changed", {
        ...payload,
        isBlockedByOther: false,
        userId: unblockerId,
      });
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
      if (arr) {
        const index = arr.indexOf(callback);
        if (index !== -1) arr.splice(index, 1);
      }
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
    await this.initBlocksSocket();
    return this.messagesSocket;
  }

  onNewMessage(callback) {
    return this.on("receiveMessage", callback);
  }

  offNewMessage() {
    this.off("receiveMessage");
  }

  onMessageEdited(callback) {
    return this.on("message:edited", callback);
  }

  offMessageEdited() {
    this.off("message:edited");
  }

  onMessageStatusUpdate(callback) {
    return this.on("messageSeen", callback);
  }

  onMessageDelivered(callback) {
    return this.on("messageDelivered", callback);
  }

  onTypingStart(callback) {
    return this.on("typing:start", callback);
  }

  onTypingStop(callback) {
    return this.on("typing:stop", callback);
  }

  onMessageRevoked(callback) {
    return this.on("message:revoked", callback);
  }

  offMessageRevoked() {
    this.off("message:revoked");
  }

  onMessageReaction(callback) {
    return this.on("message:reaction", callback);
  }

  offMessageReaction() {
    this.off("message:reaction");
  }

  onMessageReactionRemove(callback) {
    return this.on("message:reaction:remove", callback);
  }

  offMessageReactionRemove() {
    this.off("message:reaction:remove");
  }

  // ================= MESSAGE CONVENIENCE LISTENERS =================
  onMessageDeleted(callback) {
    return this.on("message:deleted", callback);
  }

  offMessageDeleted() {
    this.off("message:deleted");
  }

  onMessageDeletedForEveryone(callback) {
    return this.on("message:deleted_for_everyone", callback);
  }

  offMessageDeletedForEveryone() {
    this.off("message:deleted_for_everyone");
  }

  onMessageReactionsCleared(callback) {
    return this.on("message:reactions:clear", callback);
  }

  offMessageReactionsCleared() {
    this.off("message:reactions:clear");
  }

  onMessagePinned(callback) {
    return this.on("message:pinned", callback);
  }

  offMessagePinned() {
    this.off("message:pinned");
  }

  onMessageUnpinned(callback) {
    return this.on("message:unpinned", callback);
  }

  offMessageUnpinned() {
    this.off("message:unpinned");
  }

  onMessageQuoted(callback) {
    return this.on("message:quoted", callback);
  }

  offMessageQuoted() {
    this.off("message:quoted");
  }

  // ================= CONVERSATION CONVENIENCE LISTENERS =================
  onConversationCreated(callback) {
    return this.on("conversation:created", callback);
  }

  offConversationCreated() {
    this.off("conversation:created");
  }

  onConversationPinToggled(callback) {
    return this.on("conversation:pin_toggled", callback);
  }

  offConversationPinToggled() {
    this.off("conversation:pin_toggled");
  }

  onConversationArchivedToggled(callback) {
    return this.on("conversation:archived_toggled", callback);
  }

  offConversationArchivedToggled() {
    this.off("conversation:archived_toggled");
  }

  onConversationMuteChanged(callback) {
    return this.on("conversation:mute_changed", callback);
  }

  offConversationMuteChanged() {
    this.off("conversation:mute_changed");
  }

  // ================= GROUP CONVENIENCE LISTENERS =================
  onGroupMemberLeft(callback) {
    return this.on("group:member_left", callback);
  }

  offGroupMemberLeft() {
    this.off("group:member_left");
  }

  onGroupDissolved(callback) {
    return this.on("group:dissolved", callback);
  }

  offGroupDissolved() {
    this.off("group:dissolved");
  }

  onGroupRenamed(callback) {
    return this.on("group:renamed", callback);
  }

  offGroupRenamed() {
    this.off("group:renamed");
  }

  onGroupAvatarChanged(callback) {
    return this.on("group:avatar_changed", callback);
  }

  offGroupAvatarChanged() {
    this.off("group:avatar_changed");
  }

  onGroupAdminChanged(callback) {
    return this.on("group:admin_changed", callback);
  }

  offGroupAdminChanged() {
    this.off("group:admin_changed");
  }

  onGroupOwnerTransferred(callback) {
    return this.on("group:owner_transferred", callback);
  }

  offGroupOwnerTransferred() {
    this.off("group:owner_transferred");
  }

  onGroupMemberApproved(callback) {
    return this.on("group:member_approved", callback);
  }

  offGroupMemberApproved() {
    this.off("group:member_approved");
  }

  onGroupMemberRejected(callback) {
    return this.on("group:member_rejected", callback);
  }

  offGroupMemberRejected() {
    this.off("group:member_rejected");
  }

  onGroupSettingsUpdated(callback) {
    return this.on("group:settings_updated", callback);
  }

  offGroupSettingsUpdated() {
    this.off("group:settings_updated");
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
      const payload: any = { conversationId };
      if (text) payload.text = text;
      if (media && media.length > 0) payload.media = media;

      this.messagesSocket.emit("sendMessage", payload, (res: any) => {
        if (res?.success || res?.status === "success") {
          resolve(res.message || res.data || res);
        } else {
          reject(new Error(res?.error || res?.msg || "Send failed"));
        }
      });
    });
  }

  addReaction(messageId, emoji) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("addReaction", { messageId, emoji }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Reaction failed"));
      });
    });
  }

  removeReaction(messageId, emoji = undefined) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "removeReaction",
        { messageId, emoji },
        (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.error || "Remove reaction failed"));
        },
      );
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

  notifyAddMembers(conversationId: string, memberIds: string[]) {
    if (!this.messagesSocket?.connected) return;
    this.messagesSocket.emit("addMember", { conversationId, memberIds });
  }

  notifyRemoveMember(conversationId: string, userId: string) {
    if (!this.messagesSocket?.connected) return;
    this.messagesSocket.emit("removeMember", { conversationId, userId });
  }

  startTyping(conversationId, isGroup = false) {
    if (!this.messagesSocket?.connected) return;

    const payload = isGroup
      ? { groupId: conversationId }
      : { toUserId: conversationId };

    this.messagesSocket.emit("typing:start", payload);
  }

  stopTyping(conversationId, isGroup = false) {
    if (!this.messagesSocket?.connected) return;

    const payload = isGroup
      ? { groupId: conversationId }
      : { toUserId: conversationId };

    this.messagesSocket.emit("typing:stop", payload);
  }

  revokeMessage(messageId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("revokeMessage", { messageId }, (res) => {
        if (res && res.success) {
          resolve(res);
        } else {
          reject(new Error(res?.error || res?.message || "Revoke failed"));
        }
      });
    });
  }

  // ================= MESSAGE ACTIONS =================
  editMessage(messageId, text) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("editMessage", { messageId, text }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Edit failed"));
      });
    });
  }

  deleteMessage(messageId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("deleteMessage", { messageId }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Delete failed"));
      });
    });
  }

  deleteMessageForEveryone(messageId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "deleteMessageForEveryone",
        { messageId },
        (res) => {
          if (res?.success || res?.status === "success") resolve(res);
          else reject(new Error(res?.error || "Delete for everyone failed"));
        },
      );
    });
  }

  pinMessage(messageId: string) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("pinMessage", { messageId }, (res) => {
        if (res?.success || res?.status === "success") resolve(res);
        else reject(new Error(res?.error || res?.msg || "Pin failed"));
      });
    });
  }

  unpinMessage(messageId: string) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("unpinMessage", { messageId }, (res) => {
        if (res?.success || res?.status === "success") resolve(res);
        else reject(new Error(res?.error || res?.msg || "Unpin failed"));
      });
    });
  }

  markSeen(conversationId, messageId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "markSeen",
        { conversationId, messageId },
        (res) => {
          if (res?.success || res?.status === "success") resolve(res);
          else reject(new Error(res?.error || "Mark seen failed"));
        },
      );
    });
  }

  markDelivered(conversationId, messageId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "markDelivered",
        { conversationId, messageId },
        (res) => {
          if (res?.success || res?.status === "success") resolve(res);
          else reject(new Error(res?.error || "Mark delivered failed"));
        },
      );
    });
  }

  markAllSeen(conversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("markAllSeen", { conversationId }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Mark seen failed"));
      });
    });
  }

  forwardMessages(messageIds, toConversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "forwardMessages",
        { messageIds, toConversationId },
        (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.error || "Forward failed"));
        },
      );
    });
  }

  quoteMessage(messageId, text, conversationId, media = []) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      const payload: any = {
        quotedMessageId: messageId,
        text,
        conversationId,
      };
      if (media && media.length > 0) payload.media = media;

      this.messagesSocket.emit("quoteMessage", payload, (res: any) => {
        if (res?.success || res?.status === "success") {
          resolve(res.message || res.data || res);
        } else {
          reject(new Error(res?.error || res?.msg || "Quote failed"));
        }
      });
    });
  }

  // ================= CONVERSATION ACTIONS =================
  pinConversation(conversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit("pinConversation", { conversationId }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Pin conversation failed"));
      });
    });
  }

  unpinConversation(conversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "unpinConversation",
        { conversationId },
        (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.error || "Unpin conversation failed"));
        },
      );
    });
  }

  archiveConversation(conversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "archiveConversation",
        { conversationId },
        (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.error || "Archive conversation failed"));
        },
      );
    });
  }

  unarchiveConversation(conversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "unarchiveConversation",
        { conversationId },
        (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.error || "Unarchive conversation failed"));
        },
      );
    });
  }

  muteConversation(conversationId, duration) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      const payload =
        duration !== undefined
          ? { conversationId, duration }
          : { conversationId };
      this.messagesSocket.emit("muteConversation", payload, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Mute conversation failed"));
      });
    });
  }

  unmuteConversation(conversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "unmuteConversation",
        { conversationId },
        (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.error || "Unmute conversation failed"));
        },
      );
    });
  }

  // ================= GROUP ACTIONS =================
  dissolveGroup(conversationId) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "dissolveGroup",
        { groupId: conversationId },
        (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.error || "Dissolve group failed"));
        },
      );
    });
  }

  updateGroupSettings(conversationId, settings) {
    if (!this.messagesSocket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.messagesSocket.emit(
        "updateGroupSettings",
        { conversationId, settings },
        (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.error || "Update group settings failed"));
        },
      );
    });
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

    if (this.blocksSocket) {
      this.blocksSocket.disconnect();
      this.blocksSocket = null;
    }

    this.listeners.clear();
  }
}

// ================= EXPORT =================
export const socketService = new SocketService();

export const initSocket = async () => {
  await socketService.initMessagesSocket();
  await socketService.initFriendsSocket();
  await socketService.initBlocksSocket();
};

// Message
export const onReceiveMessage = (cb) => socketService.on("receiveMessage", cb);

export const onMessageSeen = (cb) => socketService.on("messageSeen", cb);

export const onTypingStart = (cb) => socketService.on("typing:start", cb);

export const onTypingStop = (cb) => socketService.on("typing:stop", cb);

export const onConversationUpdated = (cb) =>
  socketService.on("conversation:updated", cb);

export const onMembersAdded = (cb) =>
  socketService.on("conversation:members_added", cb);

export const onMemberRemoved = (cb) =>
  socketService.on("conversation:member_removed", cb);
export const onMessageReaction = (cb) =>
  socketService.on("message:reaction", cb);

export const onMessageReactionRemove = (cb) =>
  socketService.on("message:reaction:remove", cb);

// Message - additional
export const onMessageDeleted = (cb) => socketService.on("message:deleted", cb);

export const onMessageDeletedForEveryone = (cb) =>
  socketService.on("message:deleted_for_everyone", cb);

export const onMessageReactionsCleared = (cb) =>
  socketService.on("message:reactions:clear", cb);

export const onMessagePinned = (cb) => socketService.on("message:pinned", cb);

export const onMessageUnpinned = (cb) =>
  socketService.on("message:unpinned", cb);

export const onMessageQuoted = (cb) => socketService.on("message:quoted", cb);

// Conversation - additional
export const onConversationCreated = (cb) =>
  socketService.on("conversation:created", cb);

export const onConversationPinToggled = (cb) =>
  socketService.on("conversation:pin_toggled", cb);

export const onConversationArchivedToggled = (cb) =>
  socketService.on("conversation:archived_toggled", cb);

export const onConversationMuteChanged = (cb) =>
  socketService.on("conversation:mute_changed", cb);

// Group
export const onGroupMemberLeft = (cb) =>
  socketService.on("group:member_left", cb);

export const onGroupDissolved = (cb) => socketService.on("group:dissolved", cb);

export const onGroupRenamed = (cb) => socketService.on("group:renamed", cb);

export const onGroupAvatarChanged = (cb) =>
  socketService.on("group:avatar_changed", cb);

export const onGroupAdminChanged = (cb) =>
  socketService.on("group:admin_changed", cb);

export const onGroupOwnerTransferred = (cb) =>
  socketService.on("group:owner_transferred", cb);

export const onGroupMemberApproved = (cb) =>
  socketService.on("group:member_approved", cb);

export const onGroupMemberRejected = (cb) =>
  socketService.on("group:member_rejected", cb);

export const onGroupSettingsUpdated = (cb) =>
  socketService.on("group:settings_updated", cb);

// Friend
export const onFriendRequest = (cb) =>
  socketService.on("friend_request:received", cb);

export const onFriendRequestAccepted = (cb) =>
  socketService.on("friend_request:accepted", cb);

export const onFriendRequestRejected = (cb) =>
  socketService.on("friend_request:rejected", cb);

export const onUnfriend = (cb) => socketService.on("friendship:unfriended", cb);

// Block
export const onBlockStatusChanged = (cb) =>
  socketService.on("blockStatus:changed", cb);
