import { useState, useEffect } from "react";
import { FiX, FiCheck } from "react-icons/fi";
import { Avatar, UserInfo } from "./shared";
import { searchUserById } from "../../services";

/**
 * FriendRequestCard Component
 * Hiển thị friend request nhận được với accept/reject buttons
 * Fetch user info từ API bằng fromUserId
 *
 * Props:
 * - request: Friend request object với fromUserId
 * - isProcessing: Có đang xử lý action hay không
 * - onAccept: Callback khi accept button được click
 * - onReject: Callback khi reject button được click
 * - onClick: Callback click vào item
 */
export const FriendRequestCard = ({ request, isProcessing = false, onAccept, onReject, onClick, style }) => {
  const [senderInfo, setSenderInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    // Fetch user info từ fromUserId
    if (!request?.fromUserId) {
      console.log("[FriendRequestCard] No fromUserId in request");
      return;
    }

    const fetchSenderInfo = async () => {
      try {
        setLoadingInfo(true);
        console.log("[FriendRequestCard] Fetching sender info for userId:", request.fromUserId);

        const response = await searchUserById(request.fromUserId);
        console.log("[FriendRequestCard] Sender info fetched:", response);

        // Extract user data từ response
        const userData = response?.data || response;
        setSenderInfo(userData);
      } catch (err) {
        console.error("[FriendRequestCard] Failed to fetch sender info:", err);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchSenderInfo();
  }, [request?.fromUserId]);

  const senderName = senderInfo?.displayName || senderInfo?.name || senderInfo?.username || "Unknown";
  const senderPhone = senderInfo?.phone || "";
  const senderAvatar = senderInfo?.avatarUrl || null;

  return (
    <div
      onClick={onClick}
      style={style}
      className="flex items-center gap-3 px-3 py-2 mx-2 mb-1 rounded-xl hover:bg-gray-100/80 dark:hover:bg-slate-700/50 transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer animate-fade-in-up"
    >
      {/* Avatar */}
      <Avatar name={senderName} src={senderAvatar} size="md" />

      {/* User Info */}
      <UserInfo name={senderName} phone={senderPhone} />

      {/* Accept/Reject Buttons */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAccept?.();
          }}
          disabled={isProcessing}
          className="p-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          title="Accept"
        >
          <FiCheck className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReject?.();
          }}
          disabled={isProcessing}
          className="p-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          title="Reject"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
