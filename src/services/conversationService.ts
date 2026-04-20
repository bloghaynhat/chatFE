import { api } from "./api";
import type { Message, Conversation } from "../types/conversation";

const normalizeConversation = (payload: any): Conversation | null => {
  if (!payload || typeof payload !== "object") return null;

  const conversationId =
    payload.conversationId || payload.id || payload._id || payload.conversation?.id || payload.conversation?._id;

  return {
    ...payload,
    conversationId,
  } as Conversation;
};

const normalizeMessages = (payload: any): Message[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const conversationService = {
  async getConversations(params: Record<string, any> = {}): Promise<any> {
    const response: any = await api.get("/conversations", { params });
    return response.data || response;
  },

  async createPrivateConversation(targetUserId: string): Promise<Conversation> {
    const response: any = await api.post("/conversations/private", { targetUserId });
    return normalizeConversation(response.data || response);
  },

  async createGroupConversation(memberIds: string[], groupName?: string, avatarUrl?: string): Promise<Conversation> {
    const response: any = await api.post("/groups", {
      memberIds,
      name: groupName,
      avatarUrl,
    });
    return normalizeConversation(response.data || response);
  },

  async getGroupMembers(groupId: string): Promise<any> {
    const response: any = await api.get(`/groups/${groupId}/members`);
    return response.data || response;
  },

  async addGroupMembers(groupId: string, memberIds: string[]): Promise<any> {
    const response: any = await api.post(`/groups/${groupId}/members`, { memberIds });
    return response.data || response;
  },

  async removeGroupMember(groupId: string, userId: string): Promise<any> {
    const response: any = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data || response;
  },

  async leaveGroupConversation(groupId: string): Promise<any> {
    try {
      const response: any = await api.post(`/groups/${groupId}/leave`, {});
      return response.data || response;
    } catch (error: any) {
      console.error("[leaveGroupConversation] Error details:", {
        groupId,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      throw error;
    }
  },

  async deleteGroupConversation(groupId: string): Promise<any> {
    const response: any = await api.delete(`/groups/${groupId}`);
    return response.data || response;
  },

  async setGroupAdmin(groupId: string, targetUserId: string, isAdmin: boolean): Promise<any> {
    const response: any = await api.post(`/groups/${groupId}/set-admin`, { targetUserId, isAdmin });
    return response.data || response;
  },

  async transferGroupOwnership(groupId: string, newOwnerId: string): Promise<any> {
    const response: any = await api.post(`/groups/${groupId}/transfer-owner`, { newOwnerId });
    return response.data || response;
  },

  async getGroupInfo(groupId: string): Promise<any> {
    const response: any = await api.get(`/groups/${groupId}/info`);
    return response.data || response;
  },

  async updateGroupInfo(groupId: string, data: { name?: string; avatarUrl?: string }): Promise<any> {
    const response: any = await api.put(`/groups/${groupId}`, data);
    return response.data || response;
  },

  async getConversationMessages(conversationId: string, params: { limit?: number; [key: string]: any } = {}): Promise<{ raw: any; messages: Message[] }> {
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

  async sendMessage(conversationId: string, data: any): Promise<any> {
    return api.post(`/conversations/${conversationId}/messages`, data);
  },

  /**
   * Send message with media attachments
   * @param conversationId - The conversation ID
   * @param content - Optional text content
   * @param attachments - Array of media objects with {filename, url, size, mimetype}
   * @param type - Message type: 'text', 'media', 'mixed'
   * @returns Message response
   */
  async sendMediaMessage(conversationId: string, params: { content?: string; attachments: any[]; type?: string }): Promise<any> {
    return api.post(`/conversations/${conversationId}/messages`, {
      content: params.content,
      attachments: params.attachments,
      type: params.type || "media",
    });
  },

  async revokeMessage(messageId: string): Promise<any> {
    return api.post(`/messages/${messageId}/revoke`, {});
  },

  async reactMessage(messageId: string, emoji: string): Promise<any> {
    return api.post(`/messages/${messageId}/react`, { emoji });
  },

  async removeReactionMessage(messageId: string, emoji: string): Promise<any> {
    return api.delete(`/messages/${messageId}/react`, { data: { emoji } });
  },

  async markDelivered(conversationId: string, lastDeliveredMessageId: string): Promise<any> {
    return api.post(`/conversations/${conversationId}/delivered`, { lastDeliveredMessageId });
  },

  async markSeen(conversationId: string, lastSeenMessageId: string): Promise<any> {
    return api.post(`/conversations/${conversationId}/seen`, { lastSeenMessageId });
  },

  async getPinnedMessages(conversationId: string): Promise<Message[]> {
    const response: any = await api.get(`/conversations/${conversationId}/pinned-messages`);
    return normalizeMessages(response.data || response);
  },

  async editMessage(messageId: string, data: { text: string }): Promise<any> {
    return api.put(`/messages/${messageId}`, data);
  },

  async deleteMessageForMe(messageId: string): Promise<any> {
    return api.post(`/messages/${messageId}/delete`, {});
  },

  async deleteMessageForEveryone(messageId: string): Promise<any> {
    return api.post(`/messages/${messageId}/delete-for-everyone`, {});
  },

  async pinMessage(messageId: string): Promise<any> {
    return api.post(`/messages/${messageId}/pin`, {});
  },

  async unpinMessage(messageId: string): Promise<any> {
    return api.delete(`/messages/${messageId}/pin`, {});
  },

  async quoteMessage(messageId: string, data: any): Promise<any> {
    return api.post(`/messages/${messageId}/quote`, data);
  },

  async forwardMessages(data: any): Promise<Message[]> {
    const response: any = await api.post(`/messages/forward`, data);
    return response.data || response;
  },
};
