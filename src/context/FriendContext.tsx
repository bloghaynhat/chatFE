import { createContext, useContext, useState, useEffect, useRef } from "react";
import { getReceivedFriendRequests } from "../services";
import { socketService } from "../services";

/**
 * Shared context cho friend requests data
 * Giải quyết vấn đề state mismatch giữa components
 * Setup global socket listeners để listening bất kể user ở view nào
 */
const FriendContext = createContext<any>(null);

export const FriendProvider = ({ children }: any) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const unsubscribeRef = useRef([]);

  const fetchFriendRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getReceivedFriendRequests();
      // Với axios, dữ liệu trả về nằm trong response.data sau khi refactor api.ts
      // format response common: { status, msg, data: { items, nextCursor, hasMore } }
      const items = response?.items || response?.data?.items || [];
      setFriendRequests(items);
    } catch (err) {
      setError(err.message || "Failed to load friend requests");
      console.error("[FriendContext] Failed to fetch friend requests:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchFriendRequests();
  }, []);

  // Setup global socket listeners (always active, regardless of current view)
  useEffect(() => {
    const setupGlobalSocketListeners = async () => {
      try {
        // Ensure socket is initialized
        await socketService.initFriendsSocket();

        // Listen for friend request events and update context
        const unsubscribe1 = socketService.on("friend_request:received", () => {
          fetchFriendRequests();
        });

        const unsubscribe2 = socketService.on("friend_request:accepted", () => {
          fetchFriendRequests();
        });

        const unsubscribe3 = socketService.on("friend_request:rejected", () => {
          fetchFriendRequests();
        });

        const unsubscribe4 = socketService.on("friend_request:canceled", () => {
          fetchFriendRequests();
        });

        unsubscribeRef.current = [
          unsubscribe1,
          unsubscribe2,
          unsubscribe3,
          unsubscribe4,
        ];
      } catch (err) {
        console.error("[FriendContext] Socket setup error:", err);
      }
    };

    setupGlobalSocketListeners();

    return () => {
      // Cleanup listeners on unmount
      unsubscribeRef.current.forEach((unsub) => unsub?.());
      unsubscribeRef.current = [];
    };
  }, []);

  const value = {
    friendRequests,
    loading,
    error,
    fetchFriendRequests,
    setFriendRequests,
  };

  return (
    <FriendContext.Provider value={value}>{children}</FriendContext.Provider>
  );
};

export const useFriendRequestsContext = () => {
  const context = useContext(FriendContext);
  if (!context) {
    throw new Error(
      "useFriendRequestsContext must be used within FriendProvider",
    );
  }
  return context;
};
