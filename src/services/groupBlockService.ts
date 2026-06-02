import { api } from "./api";

const unwrapData = (payload: any) => payload?.data || payload;

const unwrapBlockedMembers = (payload: any): any[] => {
  const data = unwrapData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.blocks)) return data.blocks;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.members)) return data.members;
  return [];
};

export const getBlockedMembers = async (groupId: string): Promise<any[]> => {
  const response = await api.get(`/groups/${groupId}/blocks`);
  return unwrapBlockedMembers(response);
};

export const blockGroupMember = async (
  groupId: string,
  targetUserId: string,
): Promise<any> => {
  const response = await api.post(`/groups/${groupId}/blocks`, { targetUserId });
  return unwrapData(response);
};

export const unblockGroupMember = async (
  groupId: string,
  userId: string,
): Promise<any> => {
  const response = await api.delete(`/groups/${groupId}/blocks/${userId}`);
  return unwrapData(response);
};

export const groupBlockService = {
  getBlockedMembers,
  blockGroupMember,
  unblockGroupMember,
};
