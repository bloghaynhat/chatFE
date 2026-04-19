import { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import {
  searchUserByPhone,
  removeFriend,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  checkFriendRequestStatus,
} from "../../services";
import { useAuth, useFriendManagement, useContactsSocketListeners } from "../../hooks";
import { useFriendRequestsContext } from "../../context/FriendContext";
import { ContactsHeader } from "../contacts";

import { FriendRequestsSection } from "./ContactsPanel/FriendRequestsSection";
import { SearchResultSection } from "./ContactsPanel/SearchResultSection";
import { FriendsListSection } from "./ContactsPanel/FriendsListSection";

export const ContactsPanel = ({ isCollapsed, onBackToChats, onSelectChat }: any) => {
  const { user: currentUser } = useAuth();
  const { friends, loading, error, fetchFriends, getUserId } = useFriendManagement();
  const { friendRequests, fetchFriendRequests } = useFriendRequestsContext();

  const [filteredFriends, setFilteredFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchResultRequestStatus, setSearchResultRequestStatus] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  const refreshSearchResultStatus = async () => {
    if (searchResult) {
      const userId = getUserId(searchResult);
      if (userId) {
        try {
          const response = await checkFriendRequestStatus(userId);
          const status = response?.data || response || {};
          setSearchResultRequestStatus({
            status: status.status,
            direction: status.direction,
            requestId: status.requestId,
          });
        } catch (err) {
          console.error("[ContactsPanel] Failed to refresh search result status:", err);
        }
      }
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  useContactsSocketListeners({
    onFriendRequestReceived: () => {
      fetchFriendRequests();
      refreshSearchResultStatus();
    },
    onFriendRequestAccepted: () => {
      fetchFriendRequests();
      fetchFriends();
      refreshSearchResultStatus();
    },
    onFriendRequestRejected: () => {
      fetchFriendRequests();
      refreshSearchResultStatus();
    },
    onFriendRequestCanceled: () => {
      fetchFriendRequests();
      if (searchResult) {
        setSearchResultRequestStatus({ status: "NONE" });
      }
    },
    onFriendshipRemoved: () => {
      fetchFriends();
      refreshSearchResultStatus();
    },
  });

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      setSearchResult(null);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = friends.filter((friend) => {
      const matches =
        friend.displayName?.toLowerCase().includes(query) ||
        friend.name?.toLowerCase().includes(query) ||
        friend.username?.toLowerCase().includes(query) ||
        friend.phone?.includes(query);
      return matches;
    });

    setFilteredFriends(filtered);

    if (/^0\d{9}$/.test(searchQuery)) {
      const timer = setTimeout(() => searchNewFriend(), 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResult(null);
    }
  }, [searchQuery, friends]);

  const searchNewFriend = async () => {
    if (!searchQuery.trim()) return;

    try {
      const result = await searchUserByPhone(searchQuery);
      const userData = result?.data || result;

      if (!userData || userData.phone === currentUser?.phone) {
        setSearchResult(null);
        setSearchResultRequestStatus(null);
        return;
      }

      const isFriend = friends.some((f) => f.id === userData.id || f.id === userData._id || f.phone === userData.phone);

      if (isFriend) {
        setSearchResult(null);
        setSearchResultRequestStatus(null);
        return;
      }

      const statusResponse = await checkFriendRequestStatus(userData.id || userData._id);
      const { status, direction, requestId } = statusResponse?.data || statusResponse || {};

      if (status === "SELF" || status === "ACCEPTED") {
        setSearchResult(null);
        setSearchResultRequestStatus(null);
        return;
      }

      setSearchResult(userData);
      setSearchResultRequestStatus({ status, direction, requestId });
    } catch (err) {
      console.error("Search error:", err);
      setSearchResult(null);
      setSearchResultRequestStatus(null);
    }
  };

  const handleSendOrCancelRequest = async () => {
    if (!searchResult) return;

    try {
      const userId = getUserId(searchResult);
      if (!userId) {
        alert("User ID not found");
        return;
      }

      setProcessingRequestId(userId);

      if (searchResultRequestStatus?.status === "PENDING" && searchResultRequestStatus?.direction === "OUTGOING") {
        if (searchResultRequestStatus?.requestId) {
          await cancelFriendRequest(searchResultRequestStatus.requestId);
        }
      } else {
        await sendFriendRequest(userId);
      }

      await refreshSearchResultStatus();
      await fetchFriends();
    } catch (err) {
      console.error("[ContactsPanel] Error processing friend request:", err);
      alert(err.message || "Failed to process friend request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleAcceptSearchRequest = async () => {
    if (!searchResult || !searchResultRequestStatus?.requestId) return;

    try {
      setProcessingRequestId(searchResultRequestStatus.requestId);
      await acceptFriendRequest(searchResultRequestStatus.requestId);
      await fetchFriendRequests();
      await fetchFriends();
      setSearchResultRequestStatus({ status: "ACCEPTED" });
      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (err) {
      console.error("[ContactsPanel] Failed to accept search result request:", err);
      alert(err.message || "Failed to accept friend request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectSearchRequest = async () => {
    if (!searchResult || !searchResultRequestStatus?.requestId) return;

    try {
      setProcessingRequestId(searchResultRequestStatus.requestId);
      await rejectFriendRequest(searchResultRequestStatus.requestId);
      await fetchFriendRequests();
      setSearchResultRequestStatus({ status: "NONE" });
    } catch (err) {
      console.error("[ContactsPanel] Failed to reject search result request:", err);
      alert(err.message || "Failed to reject friend request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      await acceptFriendRequest(requestId);
      await fetchFriendRequests();
      await fetchFriends();
      await refreshSearchResultStatus();
      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (err) {
      console.error("[ContactsPanel] Failed to accept friend request:", requestId, err);
      alert(err.message || "Failed to accept friend request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      await rejectFriendRequest(requestId);
      await fetchFriendRequests();
      await refreshSearchResultStatus();
    } catch (err) {
      console.error("[ContactsPanel] Failed to reject friend request:", requestId, err);
      alert(err.message || "Failed to reject friend request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleUnfriend = async (friendUserId) => {
    if (!window.confirm("Are you sure you want to unfriend this person?")) {
      return;
    }

    try {
      await removeFriend(friendUserId);
      await fetchFriends();

      const fallbackTimer = setTimeout(() => {
        fetchFriends().catch((err) => console.error("Failed to refetch after unfriend:", err));
      }, 2000);

      await refreshSearchResultStatus();

      return () => clearTimeout(fallbackTimer);
    } catch (err) {
      console.error("[ContactsPanel] Failed to unfriend user:", friendUserId, err);
      alert(err.message || "Failed to unfriend");
    }
  };

  const handleUnfriendSearchResult = async () => {
    if (!searchResult) return;
    const userId = getUserId(searchResult);
    if (userId) {
      await handleUnfriend(userId);
    }
  };

  const handleOpenChat = (user) => {
    if (!onSelectChat) return;

    const targetId = user.friendUserId || user.id || user._id;

    onSelectChat({
      id: `temp-${targetId}`,
      targetUserId: targetId,
      name: user.displayName || user.username || user.name || "Unknown",
      avatarUrl: user.avatarUrl,
    });
  };

  if (isCollapsed) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={onBackToChats}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
          title="Back to chats"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ContactsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onBack={onBackToChats} />

      <div className="flex-1 overflow-y-auto">
        <FriendRequestsSection
          friendRequests={friendRequests}
          processingRequestId={processingRequestId}
          handleAcceptRequest={handleAcceptRequest}
          handleRejectRequest={handleRejectRequest}
          handleOpenChat={handleOpenChat}
        />

        <SearchResultSection
          searchResult={searchResult}
          searchResultRequestStatus={searchResultRequestStatus}
          processingRequestId={processingRequestId}
          handleSendOrCancelRequest={handleSendOrCancelRequest}
          handleAcceptSearchRequest={handleAcceptSearchRequest}
          handleRejectSearchRequest={handleRejectSearchRequest}
          handleUnfriendSearchResult={handleUnfriendSearchResult}
          handleOpenChat={handleOpenChat}
        />

        <FriendsListSection
          error={error}
          loading={loading}
          filteredFriends={filteredFriends}
          searchQuery={searchQuery}
          handleOpenChat={handleOpenChat}
        />
      </div>
    </div>
  );
};
