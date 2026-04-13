import { api } from "./api";

const normalizeConversation = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const conversationId =
    payload.conversationId ||
    payload.id ||
    payload._id ||
    payload.conversation?.id ||
    payload.conversation?._id;

  return {
    ...payload,
    conversationId,
  };
};

const normalizeMessages = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const conversationService = {
  async openPrivateConversation(targetUserId) {
    const payload = await api.get("/conversations/private", {
      params: { targetUserId },
    });
    return normalizeConversation(payload);
  },

  async createPrivateConversation(targetUserId) {
    const payload = await api.post("/conversations/private", { targetUserId });
    return normalizeConversation(payload);
  },

  async getConversationMessages(conversationId, params = {}) {
    // Limit tối đa backend cho phép là 100
    const limit = Math.min(params.limit || 100, 100);

    const payload = await api.get(`/conversations/${conversationId}/messages`, {
      params: {
        limit,
        ...params,
      },
    });

    return {
      raw: payload,
      messages: normalizeMessages(payload),
    };
  },

  async sendMessage(conversationId, data) {
    return api.post(`/conversations/${conversationId}/messages`, data);
  },

  async revokeMessage(messageId) {
    return api.post(`/messages/${messageId}/revoke`);
  },

  async reactMessage(messageId, reaction) {
    return api.post(`/messages/${messageId}/react`, { reaction });
  },

  async markDelivered(conversationId) {
    return api.post(`/conversations/${conversationId}/delivered`);
  },

  async markSeen(conversationId) {
    return api.post(`/conversations/${conversationId}/seen`);
  },

  async getPinnedMessages(conversationId) {
    return api.get(`/conversations/${conversationId}/pinned-messages`);
  },

  async editMessage(messageId, data) {
    return api.put(`/messages/${messageId}`, data);
  },

  async deleteMessageForMe(messageId) {
    return api.post(`/messages/${messageId}/delete`);
  },

  async deleteMessageForEveryone(messageId) {
    return api.post(`/messages/${messageId}/delete-for-everyone`);
  },

  async pinMessage(messageId) {
    return api.post(`/messages/${messageId}/pin`);
  },

  async unpinMessage(messageId) {
    return api.delete(`/messages/${messageId}/pin`);
  },

  async quoteMessage(messageId, data) {
    return api.post(`/messages/${messageId}/quote`, data);
  },

  async forwardMessages(data) {
    return api.post(`/messages/forward`, data);
  },
};
