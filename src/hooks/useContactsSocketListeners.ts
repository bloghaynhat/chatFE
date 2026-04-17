import { useEffect, useRef } from "react";
import { socketService } from "../services";

/**
 * Custom hook để quản lý friend-related socket listeners
 * Tự động setup và cleanup socket event listeners
 * cho friend request lifecycle events và friendship events
 */
export const useContactsSocketListeners = ({
  onFriendRequestReceived = () => {},
  onFriendRequestAccepted = () => {},
  onFriendRequestRejected = () => {},
  onFriendRequestCanceled = () => {},
  onFriendshipRemoved = () => {},
} = {}) => {
  const unsubscribeRef = useRef([]);
  const callbacksRef = useRef({
    onFriendRequestReceived,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    onFriendRequestCanceled,
    onFriendshipRemoved,
  });

  // Cập nhật callbacks mà không re-run setup listeners effect
  useEffect(() => {
    callbacksRef.current = {
      onFriendRequestReceived,
      onFriendRequestAccepted,
      onFriendRequestRejected,
      onFriendRequestCanceled,
      onFriendshipRemoved,
    };
  }, [
    onFriendRequestReceived,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    onFriendRequestCanceled,
    onFriendshipRemoved,
  ]);

  // Setup listeners chỉ 1 lần khi component mount
  useEffect(() => {
    let isMounted = true;

    const setupListeners = async () => {
      try {
        const socket = await socketService.initFriendsSocket();
        if (!isMounted) return;

        const unsubscribe1 = socketService.on("friend_request:received", () => {
          callbacksRef.current.onFriendRequestReceived();
        });
        const unsubscribe2 = socketService.on("friend_request:accepted", () => {
          callbacksRef.current.onFriendRequestAccepted();
        });
        const unsubscribe3 = socketService.on("friend_request:rejected", () => {
          callbacksRef.current.onFriendRequestRejected();
        });
        const unsubscribe4 = socketService.on("friend_request:canceled", () => {
          callbacksRef.current.onFriendRequestCanceled();
        });
        const unsubscribe5 = socketService.on("friendship:unfriended", () => {
          callbacksRef.current.onFriendshipRemoved();
        });

        unsubscribeRef.current = [unsubscribe1, unsubscribe2, unsubscribe3, unsubscribe4, unsubscribe5];
      } catch (err) {
        console.error("[useContactsSocketListeners] Socket setup error:", err);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      unsubscribeRef.current.forEach((unsub) => unsub?.());
      unsubscribeRef.current = [];
    };
  }, []); // Empty dependency - setup listeners chỉ khi component mount/unmount
};
