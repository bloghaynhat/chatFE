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
   * Xử lý: id, _id fields
   */
  const getUserId = (user) => {
    return user?.id || user?._id;
  };

  /**
   * Helper để lấy current user ID từ localStorage
   */
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user?.id || user?._id;
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

      const friendships = response?.items || response?.data?.items || response?.data?.data?.items || [];

      // Resolve user info cho mỗi friendship
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        setFriends(friendships);
        return;
      }

      const enrichedFriends = await Promise.all(
        friendships.map(async (friendship) => {
          try {
            // Xác định friendUserId (là user còn lại không phải current user)
            const friendUserId = friendship.userA === currentUserId ? friendship.userB : friendship.userA;
            const userResponse = await searchUserById(friendUserId);
            const userInfo = userResponse?.data || userResponse;

            // Return enriched friendship object với user info
            return {
              ...friendship,
              friendUserId,
              displayName: userInfo?.displayName,
              name: userInfo?.name,
              username: userInfo?.username,
              phone: userInfo?.phone,
              avatarUrl: userInfo?.avatarUrl,
            };
          } catch (err) {
            console.error("[useFriendManagement] Failed to fetch user info for friendship:", friendship.id, err);
            // Fallback: return friendship with raw IDs
            return {
              ...friendship,
              friendUserId: friendship.userA === currentUserId ? friendship.userB : friendship.userA,
              displayName: "Unknown",
            };
          }
        }),
      );

      setFriends(enrichedFriends);
    } catch (err) {
      setError(err.message || "Failed to load friends");
      console.error("[useFriendManagement] Failed to load friends:", err);
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
