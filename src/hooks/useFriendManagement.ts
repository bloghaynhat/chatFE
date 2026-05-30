import { useState } from "react";
import { getFriends, searchUserById } from "../services";

/**
 * Custom hook để quản lý dữ liệu bạn bè
 */
export const useFriendManagement = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Helper để lấy user ID từ các định dạng dữ liệu khác nhau
   */
  const getUserId = (user) => {
    return user?.id;
  };

  /**
   * Helper để lấy current user ID từ localStorage
   */
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user?.id;
    } catch (err) {
      console.error("[useFriendManagement] Failed to get currentUserId:", err);
      return null;
    }
  };

  /**
   * Lấy danh sách bạn bè từ API
   * Resolve user info cho mỗi friendship
   */
  const fetchFriends = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getFriends();

      const friendships =
        response?.items ||
        response?.data?.items ||
        response?.data?.data?.items ||
        [];

      // Resolve user info cho mỗi friendship
      const currentUserId = getCurrentUserId();

      const enrichedFriends = await Promise.all(
        friendships.map(async (friendship) => {
          // Normalize different backend shapes so UI can always rely on these fields
          const raw = friendship || {};

          // Prefer explicit userId (newer API), then nested user object, then legacy userA/userB
          const possibleUserId =
            raw.userId ||
            raw.user?.id ||
            raw.user?.userId ||
            raw.userId ||
            raw.id;

          // Determine friendUserId deterministically
          let friendUserId = possibleUserId;

          if (!friendUserId && currentUserId && (raw.userA || raw.userB)) {
            friendUserId = raw.userA === currentUserId ? raw.userB : raw.userA;
          }

          // Determine displayName/avatar from available places
          const displayName =
            raw.displayName ||
            raw.user?.displayName ||
            raw.user?.name ||
            raw.name;
          const avatarUrl = raw.avatarUrl || raw.user?.avatarUrl;

          // If we already have enough info, return quickly
          if (friendUserId && displayName) {
            return {
              ...raw,
              friendUserId,
              displayName,
              avatarUrl,
            };
          }

          // Fallback: try to fetch user info when we have an id and no displayName
          if (friendUserId) {
            try {
              const userResponse = await searchUserById(friendUserId);
              const userInfo = userResponse?.data || userResponse || {};
              return {
                ...raw,
                friendUserId,
                displayName:
                  userInfo.displayName ||
                  userInfo.name ||
                  displayName ||
                  "Unknown",
                name: userInfo.name || raw.name,
                username: userInfo.username || raw.username,
                phone: userInfo.phone || raw.phone,
                avatarUrl: userInfo.avatarUrl || avatarUrl,
              };
            } catch (err) {
              console.error(
                "[useFriendManagement] Failed to fetch user info for friendship:",
                raw.id,
                err,
              );
              return {
                ...raw,
                friendUserId,
                displayName: displayName || "Unknown",
                avatarUrl,
              };
            }
          }

          // Last resort: return a minimal normalized object
          return {
            ...raw,
            friendUserId: friendUserId || raw.id,
            displayName: displayName || "Unknown",
            avatarUrl,
          };
        }),
      );

      setFriends(enrichedFriends);
    } catch (err) {
      const errorMsg = err?.message || "Failed to load friends";
      setError(errorMsg);

      // Log chi tiết error để debug
      console.error("[useFriendManagement] Failed to load friends:", {
        message: errorMsg,
        code: err?.code,
        status: err?.status,
        payload: err?.payload,
        fullError: err,
      });

      // Xử lý các error cụ thể từ backend
      if (err?.payload?.msg?.includes("findFriendshipsWithCursor")) {
        console.warn(
          "[useFriendManagement] Backend method not implemented: findFriendshipsWithCursor",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    friends,
    loading,
    error,

    // Fetch functions
    fetchFriends,

    // Helpers
    getUserId,

    // Setters để cập nhật state thủ công nếu cần
    setFriends,
    setError,
  };
};
