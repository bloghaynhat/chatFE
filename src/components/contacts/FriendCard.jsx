import { FiX } from "react-icons/fi";
import { Avatar, UserInfo } from "./shared";

/**
 * FriendCard Component
 * Hiển thị friend item với remove button
 * Dữ liệu từ useFriendManagement đã resolve user info rồi
 *
 * Props:
 * - friend: Enriched friendship object {userA, userB, displayName, name, phone, avatarUrl}
 * - onRemove: Callback khi remove button được click
 */
export const FriendCard = ({ friend, onRemove }) => {
  const displayName = friend?.displayName || friend?.name || "Unknown";
  const phone = friend?.phone || "";
  const avatarUrl = friend?.avatarUrl || null;

  return (
    <div className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer">
      {/* Avatar */}
      <Avatar name={displayName} src={avatarUrl} size="lg" />

      {/* User Info */}
      <UserInfo name={displayName} phone={phone} />

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition flex-shrink-0"
        title="Remove friend"
      >
        <FiX className="w-5 h-5" />
      </button>
    </div>
  );
};
