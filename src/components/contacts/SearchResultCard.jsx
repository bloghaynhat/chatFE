import { Avatar, UserInfo } from "./shared";

/**
 * SearchResultCard Component
 * Hiển thị user tìm được từ search với:
 * - Send Request button (NONE / REJECTED)
 * - Cancel Request button (PENDING OUTGOING)
 * - Accept/Reject buttons (PENDING INCOMING)
 * - Unfriend button (ACCEPTED)
 *
 * Props:
 * - user: User object từ search result
 * - requestStatus: {status: "NONE"|"PENDING"|"REJECTED"|"ACCEPTED", direction?: "OUTGOING"|"INCOMING", requestId?: string}
 * - isProcessing: Có đang xử lý action hay không
 * - onSendRequest: Callback khi click Send Request / Cancel Request button
 * - onAcceptRequest: Callback khi click Accept button
 * - onRejectRequest: Callback khi click Reject button
 * - onUnfriend: Callback khi click Unfriend button
 * - onClick: Callback click vào item (để mở chat)
 */
export const SearchResultCard = ({
  user,
  requestStatus = { status: "NONE" },
  isProcessing = false,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onUnfriend,
  onClick,
  style,
}) => {
  const displayName = user?.displayName || user?.name || "Unknown";
  const phone = user?.phone || "";
  const avatarUrl = user?.avatarUrl || null;

  // XÃ¡c Ä‘á»‹nh UI based on status
  const isRequestSent = requestStatus?.status === "PENDING" && requestStatus?.direction === "OUTGOING";
  const isIncoming = requestStatus?.status === "PENDING" && requestStatus?.direction === "INCOMING";
  const isAccepted = requestStatus?.status === "ACCEPTED";

  return (
    <div className="pt-2 animate-fade-in-up" style={style}>
      <div
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2 mx-2 mb-1 rounded-xl hover:bg-gray-100/80 dark:hover:bg-slate-700/50 transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
      >
        {/* Avatar */}
        <Avatar name={displayName} src={avatarUrl} size="lg" />

        {/* User Info */}
        <UserInfo name={displayName} phone={phone} />

        {/* Actions based on request status */}
        {isIncoming ? (
          // Accept / Reject buttons (INCOMING request)
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcceptRequest?.();
              }}
              disabled={isProcessing}
              className="px-2 py-1 text-white text-xs font-medium rounded-lg bg-green-500 hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? "..." : "Accept"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRejectRequest?.();
              }}
              disabled={isProcessing}
              className="px-2 py-1 text-white text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? "..." : "Reject"}
            </button>
          </div>
        ) : isAccepted ? (
          // Unfriend button (ACCEPTED - already friend)
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnfriend?.();
            }}
            disabled={isProcessing}
            className="px-3 py-1 text-white text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 transition flex-shrink-0 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? "..." : "Unfriend"}
          </button>
        ) : (
          // Send Request / Cancel Request button (OUTGOING or NONE/REJECTED)
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendRequest?.();
            }}
            disabled={isProcessing}
            className={`px-3 py-1 text-white text-xs font-medium rounded-lg transition flex-shrink-0 disabled:bg-gray-300 disabled:cursor-not-allowed ${
              isRequestSent ? "bg-gray-500 hover:bg-gray-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isProcessing ? "..." : isRequestSent ? "Cancel Request" : "Send Request"}
          </button>
        )}
      </div>
      <div className="h-px bg-gray-200 dark:bg-slate-700 mt-2" />
    </div>
  );
};
