import { api } from "./api";

const normalizeConversation = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const conversationId =
    payload.conversationId || payload.id || payload._id || payload.conversation?.id || payload.conversation?._id;

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
  async getConversations(params: any = {}) {
    const response: any = await api.get("/conversations", { params });
    return response.data || response;
  },

  async createPrivateConversation(targetUserId) {
    const response: any = await api.post("/conversations/private", { targetUserId });
    return normalizeConversation(response.data || response);
  },

  async createGroupConversation(memberIds: string[], groupName?: string, avatarUrl?: string) {
    const response: any = await api.post("/groups", {
      memberIds,
      name: groupName,
      avatarUrl,
    });
    return normalizeConversation(response.data || response);
  },

  async getConversationMessages(conversationId, params: { limit?: number; [key: string]: any } = {}) {
    // Limit tối đa backend cho phép là 100
    const limit = Math.min(params.limit || 100, 100);

    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params: {
        limit,
        ...params,
      },
    });

    return {
      raw: response,
      messages: normalizeMessages((response as any).data || response),
    };
  },

  async sendMessage(conversationId, data) {
    return api.post(`/conversations/${conversationId}/messages`, data);
  },

  /**
   * Send message with media attachments
   * @param {string} conversationId - The conversation ID
   * @param {string} content - Optional text content
   * @param {Array} attachments - Array of media objects with {filename, url, size, mimetype}
   * @param {string} type - Message type: 'text', 'media', 'mixed'
   * @returns {Promise<Object>} Message response
   */
  async sendMediaMessage(conversationId, { content, attachments, type = "media" }) {
    return api.post(`/conversations/${conversationId}/messages`, {
      content,
      attachments,
      type,
    });
  },

  async revokeMessage(messageId) {
    return api.post(`/messages/${messageId}/revoke`, {});
  },

  async reactMessage(messageId, reaction) {
    return api.post(`/messages/${messageId}/react`, { reaction });
  },

  async markDelivered(conversationId, lastDeliveredMessageId: string) {
    return api.post(`/conversations/${conversationId}/delivered`, { lastDeliveredMessageId });
  },

  async markSeen(conversationId, lastSeenMessageId: string) {
    return api.post(`/conversations/${conversationId}/seen`, { lastSeenMessageId });
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

  async forwardMessages(data: any) {
    const response: any = await api.post(`/messages/forward`, data);
    return response.data || response;
  },
};
