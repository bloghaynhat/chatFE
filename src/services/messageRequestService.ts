import { api } from "./api";
import type { Conversation } from "../types/conversation";

const normalizeList = (payload: any): Conversation[] => {
  const data = payload?.data || payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.conversations)) return data.conversations;
  if (Array.isArray(data?.messageRequests)) return data.messageRequests;
  return [];
};

export const messageRequestService = {
  async getStrangerConversations(
    params: { limit?: number } = {},
  ): Promise<Conversation[]> {
    const response = await api.get("/conversations/strangers", { params });
    return normalizeList(response);
  },

  async getPendingMessageRequests(
    params: { limit?: number } = {},
  ): Promise<Conversation[]> {
    const response = await api.get("/message-requests", { params });
    return normalizeList(response).map((conversation: any) => ({
      ...conversation,
      isMessageRequest: true,
      messageRequestStatus:
        conversation.messageRequestStatus ||
        conversation.memberStatus ||
        conversation.status ||
        "PENDING",
    }));
  },

  async acceptMessageRequest(conversationId: string): Promise<any> {
    return api.post(`/message-requests/${conversationId}/accept`, {});
  },

  async rejectMessageRequest(conversationId: string): Promise<any> {
    return api.post(`/message-requests/${conversationId}/reject`, {});
  },
};

export const getStrangerConversations =
  messageRequestService.getStrangerConversations;
export const getPendingMessageRequests =
  messageRequestService.getPendingMessageRequests;
export const acceptMessageRequest =
  messageRequestService.acceptMessageRequest;
export const rejectMessageRequest =
  messageRequestService.rejectMessageRequest;
