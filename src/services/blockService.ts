import { api } from "./api";

// Chặn một người dùng
export const blockUser = (blockedUserId: string) => {
  return api.post(`/blocks/${blockedUserId}`);
};

// Gỡ chặn một người dùng
export const unblockUser = (blockedUserId: string) => {
  return api.delete(`/blocks/${blockedUserId}`);
};

// Lấy danh sách người dùng đã chặn (Hỗ trợ Pagination bằng Cursor)
export const getBlockedUsersCursor = (params: {
  cursor?: string;
  limit?: number;
}) => {
  return api.get(`/blocks/cursor`, { params });
};

// Lấy danh sách người dùng đã chặn không phân trang
export const getBlockedUsers = () => {
  return api.get(`/blocks`);
};

// Kiểm tra xem một người có đang bị mình chặn không (Dùng để hiển thị UI trong Profile)
export const checkBlockStatus = (blockedUserId: string) => {
  return api.get<{ data: { isBlocked: boolean } }>(
    `/blocks/${blockedUserId}/check`,
  );
};
