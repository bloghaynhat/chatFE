import { api } from "./api";

const unwrapApiData = (payload: any) => {
  if (!payload || typeof payload !== "object") return payload;
  if ("status" in payload && "data" in payload) return payload.data;
  return payload.data || payload;
};

export const blockUser = async (userId: string) => {
  const response = await api.post(`/blocks/${userId}`, {});
  return unwrapApiData(response);
};

export const unblockUser = async (userId: string) => {
  return api.delete(`/blocks/${userId}`);
};

export const checkBlockStatus = async (userId: string): Promise<{ isBlocked: boolean }> => {
  const response = await api.get(`/blocks/${userId}/check`);
  return unwrapApiData(response) || { isBlocked: false };
};

export const getBlockedUsers = async (params: Record<string, any> = {}) => {
  const response = await api.get("/blocks", { params });
  return unwrapApiData(response);
};

export const blockService = {
  blockUser,
  unblockUser,
  checkBlockStatus,
  getBlockedUsers,
};

export default blockService;
