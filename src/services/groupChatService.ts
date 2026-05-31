import { api } from "./api";

export interface ConversationMember {
  id?: string;
  _id?: string;
  conversationId?: string;
  userId: string;
  role?: string;
  status?: string;
  joinedAt?: string;
  user?: any;
  [key: string]: any;
}

const unwrapData = (payload: any) => payload?.data || payload;

export const groupChatService = {
  async addMembers(
    groupId: string,
    memberIds: string[],
  ): Promise<ConversationMember[]> {
    const response: any = await api.post(`/groups/${groupId}/members`, {
      memberIds,
    });
    return unwrapData(response);
  },

  async removeMember(groupId: string, targetUserId: string): Promise<any> {
    const response: any = await api.delete(
      `/groups/${groupId}/members/${targetUserId}`,
    );
    return unwrapData(response);
  },

  async leaveGroup(groupId: string): Promise<any> {
    const response: any = await api.post(`/groups/${groupId}/leave`);
    return unwrapData(response);
  },
};
