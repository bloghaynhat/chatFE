import { api } from "./api";

export type WhoCanSendMessages = "all" | "admins";
export type PermissionScope = "all" | "admins";

export interface GroupSettingsPayload {
  whoCanSendMessages?: WhoCanSendMessages;
  requireApproval?: boolean;
  allowMemberInvite?: boolean;
  allowSendLink?: boolean;
  whoCanAddMembers?: PermissionScope;
  utilityPermissions?: {
    poll?: PermissionScope;
    reminder?: PermissionScope;
    note?: PermissionScope;
  };
  groupType?: "private" | "public";
}

export type UpdateGroupSettingsPayload = Omit<GroupSettingsPayload, "groupType">;

const unwrapData = (payload: any) => payload?.data || payload;

export const groupSettingsService = {
  async updateSettings(
    groupId: string,
    settings: GroupSettingsPayload,
  ): Promise<any> {
    const response: any = await api.patch(`/groups/${groupId}/settings`, settings);
    return unwrapData(response);
  },

  async getBlockedUsers(groupId: string): Promise<any[]> {
    const response: any = await api.get(`/groups/${groupId}/blocks`);
    const payload = unwrapData(response);
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.blocks)) return payload.blocks;
    if (Array.isArray(payload?.users)) return payload.users;
    return [];
  },

  async blockUser(groupId: string, userId: string): Promise<any> {
    const response: any = await api.post(`/groups/${groupId}/blocks`, { userId });
    return unwrapData(response);
  },

  async unblockUser(groupId: string, userId: string): Promise<any> {
    const response: any = await api.delete(`/groups/${groupId}/blocks/${userId}`);
    return unwrapData(response);
  },

  async getPendingMembers(groupId: string): Promise<any[]> {
    const response: any = await api.get(`/groups/${groupId}/members/pending`);
    const payload = unwrapData(response);
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.members)) return payload.members;
    if (Array.isArray(payload?.users)) return payload.users;
    return [];
  },

  async approveMember(groupId: string, userId: string): Promise<any> {
    const response: any = await api.patch(
      `/groups/${groupId}/members/${userId}/approve`,
      {},
    );
    return unwrapData(response);
  },

  async rejectMember(groupId: string, userId: string): Promise<any> {
    const response: any = await api.patch(
      `/groups/${groupId}/members/${userId}/reject`,
      {},
    );
    return unwrapData(response);
  },
};
