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
import { ContactsHeader, FriendRequestCard, SearchResultCard, FriendCard } from "../contacts";

/**
 * ContactsPanel Component
 * Component chính để quản lý contacts và friend requests
 * - Hiển thị danh sách bạn bè
 * - Xử lý friend requests (received/sent)
 * - Cung cấp search functionality để tìm người dùng mới
 * - Quản lý add/cancel friend request actions
 */
export const ContactsPanel = ({ isCollapsed, onBackToChats, onSelectChat }) => {
  const { user: currentUser } = useAuth();
  const { friends, loading, error, fetchFriends, getUserId } = useFriendManagement();

  // Sync badge state with context
  const { friendRequests, fetchFriendRequests } = useFriendRequestsContext();

  // Local state for UI
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchResultRequestStatus, setSearchResultRequestStatus] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  /**
   * Helper function reresh trạng thái của kết quả tìm kiếm sau mỗi action liên quan đến Socket hoặc API
   */
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

  // Initialize data on mount
  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  // Setup socket listeners (badge updates handled by FriendContext globally)
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
      // Refetch friend requests để xóa request bị cancel
      fetchFriendRequests();
      // Cập nhật lại status khi request bị hủy từ người khác
      if (searchResult) {
        setSearchResultRequestStatus({ status: "NONE" });
      }
    },
    onFriendshipRemoved: () => {
      // Refetch friends khi bạn bị xóa từ phía khác
      fetchFriends();
      refreshSearchResultStatus();
    },
  });

  // Handle search filtering
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

    // Tìm kiếm bằng phone nếu định dạng hợp lệ
    if (/^0\d{9}$/.test(searchQuery)) {
      const timer = setTimeout(() => searchNewFriend(), 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResult(null);
    }
  }, [searchQuery, friends]);

  /**
   * Tìm kiếm friend mới bằng số điện thoại
   */
  const searchNewFriend = async () => {
    if (!searchQuery.trim()) return;

    try {
      const result = await searchUserByPhone(searchQuery);
      const userData = result?.data || result;

      if (!userData) {
        setSearchResult(null);
        setSearchResultRequestStatus(null);
        return;
      }

      // Ngăn chặn việc thêm chính mình
      if (userData.phone === currentUser?.phone) {
        setSearchResult(null);
        setSearchResultRequestStatus(null);
        return;
      }

      // Check if already a friend
      const isFriend = friends.some((f) => f.id === userData.id || f.id === userData._id || f.phone === userData.phone);

      if (isFriend) {
        setSearchResult(null);
        setSearchResultRequestStatus(null);
        return;
      }

      // Check friend request status
      const statusResponse = await checkFriendRequestStatus(userData.id || userData._id);
      const { status, direction, requestId } = statusResponse?.data || statusResponse || {};

      // Xử lý các case không thể hiển thị
      if (status === "SELF" || status === "ACCEPTED") {
        setSearchResult(null);
        setSearchResultRequestStatus(null);
        return;
      }

      // Cho phép show INCOMING (nhận được request)
      // Lưu trữ full status info { status, direction, requestId }
      setSearchResult(userData);
      setSearchResultRequestStatus({ status, direction, requestId });
    } catch (err) {
      console.error("Search error:", err);
      setSearchResult(null);
      setSearchResultRequestStatus(null);
    }
  };

  /**
   * Xử lý gửi hoặc hủy friend request
   */
  const handleSendOrCancelRequest = async () => {
    if (!searchResult) return;

    try {
      const userId = getUserId(searchResult);
      if (!userId) {
        alert("User ID not found");
        return;
      }

      setProcessingRequestId(userId);

      // Xử lý hủy request (PENDING + OUTGOING)
      if (searchResultRequestStatus?.status === "PENDING" && searchResultRequestStatus?.direction === "OUTGOING") {
        if (searchResultRequestStatus?.requestId) {
          await cancelFriendRequest(searchResultRequestStatus.requestId);
        }
      }
      // Xử lý gửi request (REJECTED hoặc NONE)
      else {
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

  /**
   * Xử lý accept search result request (INCOMING)
   */
  const handleAcceptSearchRequest = async () => {
    if (!searchResult || !searchResultRequestStatus?.requestId) return;

    try {
      setProcessingRequestId(searchResultRequestStatus.requestId);
      await acceptFriendRequest(searchResultRequestStatus.requestId);
      await fetchFriendRequests();
      await fetchFriends();
      // Cập nhật status về ACCEPTED thay vì xóa search result, để user vẫn thấy tìm kiếm
      setSearchResultRequestStatus({ status: "ACCEPTED" });
    } catch (err) {
      console.error("[ContactsPanel] Failed to accept search result request:", err);
      alert(err.message || "Failed to accept friend request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  /**
   * Xử lý reject search result request (INCOMING)
   */
  const handleRejectSearchRequest = async () => {
    if (!searchResult || !searchResultRequestStatus?.requestId) return;

    try {
      setProcessingRequestId(searchResultRequestStatus.requestId);
      await rejectFriendRequest(searchResultRequestStatus.requestId);
      await fetchFriendRequests();
      // Cập nhật status về NONE thay vì xóa search result, để user vẫn thấy tìm kiếm
      setSearchResultRequestStatus({ status: "NONE" });
    } catch (err) {
      console.error("[ContactsPanel] Failed to reject search result request:", err);
      alert(err.message || "Failed to reject friend request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  /**
   * Xử lý accept friend request
   */
  const handleAcceptRequest = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      await acceptFriendRequest(requestId);
      await fetchFriendRequests();
      await fetchFriends();

      await refreshSearchResultStatus();
    } catch (err) {
      console.error("[ContactsPanel] Failed to accept friend request:", requestId, err);
      alert(err.message || "Failed to accept friend request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  /**
   * Xử lý reject friend request
   */
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

  /**
   * Xử lý xóa friend bằng friend user ID
   */
  const handleUnfriend = async (friendUserId) => {
    if (!window.confirm("Are you sure you want to unfriend this person?")) {
      return;
    }

    try {
      await removeFriend(friendUserId);

      // Refetch immediately sau khi unfriend
      await fetchFriends();

      // Fallback: nếu socket event không emit từ backend, refetch sau 2 giây
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

  /**
   * Xử lý unfriend từ search result
   */
  const handleUnfriendSearchResult = async () => {
    if (!searchResult) return;
    const userId = getUserId(searchResult);
    if (userId) {
      await handleUnfriend(userId);
    }
  };

  /**
   * Mở chat khi click vào user
   */
  const handleOpenChat = (user) => {
    if (!onSelectChat) return;

    // Nếu là friend item thì target là friendUserId, nếu là searchResult thì là id/_id
    const targetId = user.friendUserId || user.id || user._id;

    // Map data sang format giống ChatList/openChatByRow mong đợi
    onSelectChat({
      id: targetId,
      targetUserId: targetId,
      name: user.displayName || user.username || user.name || "Unknown",
      avatarUrl: user.avatarUrl,
    });
  };

  // Collapsed state
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
      {/* Header */}
      <ContactsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onBack={onBackToChats} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <div>
            <div className="px-3 pt-3 pb-2">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Friend Requests ({friendRequests.length})
              </h3>
            </div>
            {friendRequests.map((request, index) => (
              <FriendRequestCard
                key={request._id || request.id}
                request={request}
                isProcessing={processingRequestId === (request._id || request.id)}
                onAccept={() => handleAcceptRequest(request._id || request.id)}
                onReject={() => handleRejectRequest(request._id || request.id)}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleOpenChat(request)}
              />
            ))}
            <div className="h-px bg-gray-200 dark:bg-slate-700 mt-2" />
          </div>
        )}

        {/* Search Result */}
        {searchResult && (
          <SearchResultCard
            user={searchResult}
            requestStatus={searchResultRequestStatus}
            isProcessing={processingRequestId === getUserId(searchResult)}
            onSendRequest={handleSendOrCancelRequest}
            onAcceptRequest={handleAcceptSearchRequest}
            onRejectRequest={handleRejectSearchRequest}
            onUnfriend={handleUnfriendSearchResult}
            onClick={() => handleOpenChat(searchResult)}
            style={{ animationDelay: "0s" }}
          />
        )}

        {/* Friends List */}
        <div className="px-3 pt-3">
          {error && <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div>}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin inline-block w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchQuery ? "No contacts found" : "No contacts yet"}
              </p>
              {!searchQuery && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Search to add friends</p>}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Contacts
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({filteredFriends.length})</span>
              </div>
              <div className="space-y-0 pb-3">
                {filteredFriends.map((friend, index) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onRemove={() => handleUnfriend(friend.friendUserId)}
                    onClick={() => handleOpenChat(friend)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
