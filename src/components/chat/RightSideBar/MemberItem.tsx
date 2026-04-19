import React from "react";

interface MemberItemProps {
  member: any;
  isSelected: boolean;
  onContextMenu: (e: React.MouseEvent, member: any) => void;
  variant?: "info" | "members";
  isMe?: boolean;
  displayRole?: string;
  showLastSeen?: boolean;
}

export const MemberItem: React.FC<MemberItemProps> = ({
  member,
  isSelected,
  onContextMenu,
  variant = "info",
  isMe = false,
  displayRole = "",
  showLastSeen = true
}) => {
  const participant = member.user || member;
  const displayName =
    participant.displayName || participant.name || participant.username || "Unknown";
  const isOwner = member.role === "admin" || member.role === "owner";

  // Variant-specific styles
  const containerClass = variant === "members"
    ? "px-5 py-3"
    : "px-4 py-2.5";

  const avatarClass = variant === "members"
    ? "w-11 h-11 bg-[#ff7a7c] mr-4"
    : "w-10 h-10 bg-orange-400 mr-3";

  const nameClass = variant === "members"
    ? "text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate flex items-center justify-between"
    : "text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate";

  const roleColor = isOwner ? "text-gray-500" : "text-blue-500";

  return (
    <div
      key={member._id || member.id || participant._id || participant.id}
      onContextMenu={(e) => onContextMenu(e, member)}
      className={`flex items-center ${containerClass} cursor-pointer transition-colors relative ${
        isSelected
          ? "bg-gray-100 dark:bg-slate-800"
          : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
      }`}
    >
      <div className={`${avatarClass} rounded-full font-semibold text-white flex items-center justify-center overflow-hidden shrink-0`}>
        {participant.avatarUrl || participant.avatar ? (
          <img
            src={participant.avatarUrl || participant.avatar}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{displayName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={nameClass}>
          <span>
            {displayName}
            {isMe && " (You)"}
            {displayRole && " 👑"}
          </span>
        </div>
        <div className="text-[13px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {displayRole ? (
            <span className={roleColor}>{displayRole}</span>
          ) : showLastSeen ? (
            "last seen recently"
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MemberItem;
