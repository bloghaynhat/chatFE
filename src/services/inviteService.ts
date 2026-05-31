import { api } from "./api";

export interface InviteLinkResponse {
  joinUrl?: string;
  token?: string;
  qrPayload?: string;
  status?: string;
}

export interface InvitePreviewResponse {
  groupName?: string;
  name?: string;
  groupAvatar?: string;
  avatarUrl?: string;
  avatar?: string;
  membersCount?: number;
  memberCount?: number;
  createdBy?: string;
  groupId?: string;
}

export const inviteService = {
  getInviteLink: async (groupId: string): Promise<InviteLinkResponse> => {
    const response: any = await api.get(`/groups/${groupId}/invite-link`);
    console.log("[inviteService] getInviteLink response:", response);
    // Handle both wrapped and unwrapped data forms just in case
    return response?.data || response;
  },

  revokeInviteLink: async (groupId: string): Promise<any> => {
    const response: any = await api.delete(`/groups/${groupId}/invite-link`);
    console.log("[inviteService] revokeInviteLink response:", response);
    return response?.data || response;
  },

  regenerateInviteLink: async (groupId: string): Promise<InviteLinkResponse> => {
    const response: any = await api.post(`/groups/${groupId}/invite-link/regenerate`);
    console.log("[inviteService] regenerateInviteLink response:", response);
    return response?.data || response;
  },

  // Dành cho Public/Người được mời tham gia
  previewInviteLink: async (token: string): Promise<InvitePreviewResponse> => {
    const response: any = await api.get(`/invites/${token}/preview`);
    console.log("[inviteService] previewInviteLink response:", response);
    return response?.data || response;
  },

  joinGroupByInvite: async (token: string): Promise<any> => {
    const response: any = await api.post(`/invites/${token}/join`);
    return response.data || response;
  },
};
