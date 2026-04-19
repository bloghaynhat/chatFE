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
 * - onClick: Callback click vào item (để mở chat)
 */
export const FriendCard = ({ friend, onRemove, onClick, style }: any) => {
  const displayName = friend?.displayName || friend?.name || "Unknown";
  const phone = friend?.phone || "";
  const avatarUrl = friend?.avatarUrl || null;

  return (
    <div
      onClick={onClick}
      style={style}
      className="group flex items-center gap-3 px-3 py-2 mx-2 mb-1 rounded-xl hover:bg-gray-100/80 dark:hover:bg-slate-700/50 transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer animate-fade-in-up"
    >
      {/* Avatar */}
      <Avatar name={displayName} src={avatarUrl} size="lg" />

      {/* User Info */}
      <UserInfo name={displayName} phone={phone} />
    </div>
  );
};
