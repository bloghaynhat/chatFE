import { useState } from "react";
import { getFriends, searchUserById } from "../services";

export const useFriendManagement = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getUserId = (user) => {
    return user?.userId || user?.targetUserId || user?.friendUserId || user?.id || user?._id;
  };

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

  const resolveFriendUserId = (friendship, currentUserId) => {
    if (!friendship) return null;
    if (friendship.userId) return friendship.userId;
    if (friendship.friendUserId) return friendship.friendUserId;
    if (friendship.targetUserId) return friendship.targetUserId;
    if (friendship.friend?.id || friendship.friend?._id) return friendship.friend.id || friendship.friend._id;
    if (friendship.user?.id || friendship.user?._id) return friendship.user.id || friendship.user._id;
    if (friendship.userA && friendship.userB) {
      return friendship.userA === currentUserId ? friendship.userB : friendship.userA;
    }
    return null;
  };

  const extractEmbeddedUserInfo = (friendship) => {
    const embedded = friendship?.friend || friendship?.user || friendship?.profile || null;
    return {
      displayName: friendship?.displayName || embedded?.displayName,
      name: friendship?.name || embedded?.name,
      username: friendship?.username || embedded?.username,
      phone: friendship?.phone || embedded?.phone,
      avatarUrl: friendship?.avatarUrl || embedded?.avatarUrl || embedded?.avatar,
    };
  };

  const unwrapUser = (response) => response?.data?.data || response?.data || response;

  const fetchFriends = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getFriends();
      const friendships = response?.items || response?.data?.items || response?.data?.data?.items || [];
      const currentUserId = getCurrentUserId();

      if (!currentUserId) {
        setFriends(friendships);
        return;
      }

      const enrichedFriends = await Promise.all(
        friendships.map(async (friendship) => {
          const friendUserId = resolveFriendUserId(friendship, currentUserId);
          const embeddedInfo = extractEmbeddedUserInfo(friendship);

          if (!friendUserId) {
            console.warn("[useFriendManagement] Could not resolve friend user id:", friendship);
            return {
              ...friendship,
              friendUserId: null,
              displayName: embeddedInfo.displayName || "Unknown",
              name: embeddedInfo.name,
              username: embeddedInfo.username,
              phone: embeddedInfo.phone,
              avatarUrl: embeddedInfo.avatarUrl,
            };
          }

          if (embeddedInfo.displayName || embeddedInfo.name || embeddedInfo.username || embeddedInfo.avatarUrl) {
            return {
              ...friendship,
              friendUserId,
              displayName: embeddedInfo.displayName,
              name: embeddedInfo.name,
              username: embeddedInfo.username,
              phone: embeddedInfo.phone,
              avatarUrl: embeddedInfo.avatarUrl,
            };
          }

          try {
            const userResponse = await searchUserById(friendUserId);
            const userInfo = unwrapUser(userResponse);
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
            console.error(
              "[useFriendManagement] Failed to fetch user info for friendship:",
              friendship.id,
              err,
            );
            return {
              ...friendship,
              friendUserId,
              displayName: "Unknown",
            };
          }
        }),
      );

      setFriends(enrichedFriends);
    } catch (err) {
      const errorMsg = err?.message || "Failed to load friends";
      setError(errorMsg);
      console.error("[useFriendManagement] Failed to load friends:", {
        message: errorMsg,
        code: err?.code,
        status: err?.status,
        payload: err?.payload,
        fullError: err,
      });

      if (err?.payload?.msg?.includes("findFriendshipsWithCursor")) {
        console.warn("[useFriendManagement] Backend method not implemented: findFriendshipsWithCursor");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    friends,
    loading,
    error,
    fetchFriends,
    getUserId,
    setFriends,
    setError,
  };
};
