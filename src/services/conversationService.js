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

  async getConversationMessages(conversationId, params = {}) {
    const payload = await api.get(`/conversations/${conversationId}/messages`, {
      params,
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
};
