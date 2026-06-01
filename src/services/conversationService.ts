import { api } from "./api";
import type { Message, Conversation } from "../types/conversation";

const normalizeConversation = (payload: any): Conversation | null => {
  if (!payload || typeof payload !== "object") return null;

  const conversationId =
    payload.conversationId || payload.id || payload.conversation?.id;

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
  if (Array.isArray(payload?.data?.messages)) return payload.data.messages;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
};

const normalizeMessagePage = (payload: any) => {
  const data = payload?.data || payload || {};
  const page = Array.isArray(data) ? payload : data;

  return {
    nextCursor:
      page?.nextCursor ??
      data?.nextCursor ??
      payload?.nextCursor ??
      payload?.meta?.nextCursor ??
      null,
    hasMore: Boolean(
      page?.hasMore ??
      data?.hasMore ??
      payload?.hasMore ??
      payload?.meta?.hasMore ??
      false,
    ),
    memberSeenMap:
      page?.memberSeenMap ??
      data?.memberSeenMap ??
      payload?.memberSeenMap ??
      {},
  };
};

const normalizeConversationPage = (payload: any) => {
  const data = payload?.data || payload || {};
  const conversations = Array.isArray(payload)
    ? payload
    : Array.isArray(data)
      ? data
      : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.conversations)
          ? data.conversations
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.conversations)
              ? payload.conversations
              : [];

  return {
    conversations,
    nextCursor:
      data?.nextCursor ??
      payload?.nextCursor ??
      data?.meta?.nextCursor ??
      payload?.meta?.nextCursor ??
      null,
    hasMore: Boolean(
      data?.hasMore ??
      payload?.hasMore ??
      data?.meta?.hasMore ??
      payload?.meta?.hasMore ??
      false,
    ),
  };
};

export const conversationService = {
  async getConversations(params: Record<string, any> = {}): Promise<any> {
    const response: any = await api.get("/conversations", { params });
    const payload = response || {};
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.data?.items)) return payload.data.items;
    if (Array.isArray(payload.conversations)) return payload.conversations;
    // Last resort: return empty array
    return [];
  },

  async getConversationsPage(params: Record<string, any> = {}) {
    const response: any = await api.get("/conversations", { params });
    return normalizeConversationPage(response);
  },

  async getConversationById(conversationId: string): Promise<Conversation | null> {
    const response: any = await api.get(`/conversations/${conversationId}`);
    const detail = response?.data || response || {};
    const conversation = detail?.conversation || detail;
    return normalizeConversation({
      ...conversation,
      members: detail?.members || conversation?.members,
      participants: detail?.members || conversation?.participants,
      currentUserRole: detail?.currentUserRole || conversation?.currentUserRole,
    });
  },

  async createPrivateConversation(targetUserId: string): Promise<Conversation> {
    const response: any = await api.post("/conversations/private", {
      targetUserId,
    });
    return normalizeConversation(response.data || response);
  },

  async createGroupConversation(
    memberIds: string[],
    groupName?: string,
    avatarUrl?: string,
  ): Promise<Conversation> {
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
    const response: any = await api.post(`/groups/${groupId}/members`, {
      memberIds,
    });
    return response.data || response;
  },

  async removeGroupMember(groupId: string, userId: string): Promise<any> {
    const response: any = await api.delete(
      `/groups/${groupId}/members/${userId}`,
    );
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

  async deleteConversationForMe(conversationId: string): Promise<any> {
    const response: any = await api.delete(`/conversations/${conversationId}`);
    return response.data || response;
  },

  async pinConversation(conversationId: string): Promise<any> {
    const response: any = await api.post(
      `/conversations/${conversationId}/pin-conversation`,
      {},
    );
    return response.data || response;
  },

  async unpinConversation(conversationId: string): Promise<any> {
    const response: any = await api.delete(
      `/conversations/${conversationId}/pin-conversation`,
    );
    return response.data || response;
  },

  async archiveConversation(conversationId: string): Promise<any> {
    const response: any = await api.post(
      `/conversations/${conversationId}/archive`,
      {},
    );
    return response.data || response;
  },

  async unarchiveConversation(conversationId: string): Promise<any> {
    const response: any = await api.delete(
      `/conversations/${conversationId}/archive`,
    );
    return response.data || response;
  },

  async setGroupAdmin(
    groupId: string,
    targetUserId: string,
    isAdmin: boolean,
  ): Promise<any> {
    const response: any = await api.post(`/groups/${groupId}/set-admin`, {
      targetUserId,
      isAdmin,
    });
    return response.data || response;
  },

  async transferGroupOwnership(
    groupId: string,
    newOwnerId: string,
  ): Promise<any> {
    const response: any = await api.post(`/groups/${groupId}/transfer-owner`, {
      newOwnerId,
    });
    return response.data || response;
  },

  async getGroupInfo(groupId: string): Promise<any> {
    const response: any = await api.get(`/groups/${groupId}/info`);
    return response.data || response;
  },

  async updateGroupInfo(
    groupId: string,
    data: { name?: string; avatarUrl?: string },
  ): Promise<any> {
    const response: any = await api.put(`/groups/${groupId}`, data);
    return response.data || response;
  },

  async getConversationMessages(
    conversationId: string,
    params: { limit?: number; cursor?: string | null; [key: string]: any } = {},
  ): Promise<{
    raw: any;
    messages: Message[];
    nextCursor: string | null;
    hasMore: boolean;
    memberSeenMap: Record<string, string>;
  }> {
    const { cursor, ...restParams } = params;
    // Limit tối đa backend cho phép là 100
    const limit = Math.min(params.limit || 30, 100);

    const response = await api.get(
      `/conversations/${conversationId}/messages`,
      {
        params: {
          limit,
          ...(cursor ? { cursor } : {}),
          ...restParams,
        },
      },
    );
    const payload = (response as any).data || response;
    const page = normalizeMessagePage(payload);

    return {
      raw: response,
      messages: normalizeMessages(payload),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
      memberSeenMap: page.memberSeenMap,
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
  async sendMediaMessage(
    conversationId: string,
    params: { content?: string; attachments: any[]; type?: string },
  ): Promise<any> {
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
    return api.delete(`/messages/${messageId}/react`, { emoji });
  },

  async markDelivered(
    conversationId: string,
    lastDeliveredMessageId: string,
  ): Promise<any> {
    return api.post(`/conversations/${conversationId}/delivered`, {
      lastDeliveredMessageId,
    });
  },

  async markSeen(
    conversationId: string,
    lastSeenMessageId: string,
  ): Promise<any> {
    return api.post(`/conversations/${conversationId}/seen`, {
      lastSeenMessageId,
    });
  },

  async getPinnedMessages(conversationId: string): Promise<Message[]> {
    const response: any = await api.get(
      `/conversations/${conversationId}/pinned-messages`,
    );
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

  async forwardMessages(data: any): Promise<Message[]> {
    const response: any = await api.post(`/messages/forward`, data);
    return response.data || response;
  },

  async getConversationMedia(
    conversationId: string,
    params: { limit?: number; cursor?: string } = {},
  ) {
    const response: any = await api.get(
      `/conversations/${conversationId}/media`,
      {
        params: {
          limit: params.limit || 50,
          ...(params.cursor && { cursor: params.cursor }),
        },
      },
    );
    return response.data || response;
  },
};
