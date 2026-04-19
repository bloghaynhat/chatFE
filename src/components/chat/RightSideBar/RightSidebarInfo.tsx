import React, { useState, useEffect } from "react";
import { FiX, FiEdit2, FiBell, FiLink2, FiUserPlus } from "react-icons/fi";
import { MemberItem } from "./MemberItem";
import { ContextMenuDropdown } from "./ContextMenuDropdown";

export const RightSidebarInfo = ({
  isGroup,
  groupName,
  groupAvatar,
  membersCount,
  members,
  isLoading,
  notificationsEnabled,
  setNotificationsEnabled,
  onClose,
  onEditClick,
  canEdit,
  currentUserRole,
  currentUserId,
  onRemoveMember,
  onPromoteAdmin,
  onSendMessage,
  onLeaveGroup
}: any) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; member: any } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, member: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Position menu to avoid clipping
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    
    setContextMenu({ x, y, member });
  };

  const handleAction = (action: string) => {
    if (!contextMenu) return;

    const { member } = contextMenu;
    const memberId = member.userId || member.user?.id || member.user?._id;

    switch (action) {
      case "sendMessage":
        if (onSendMessage) onSendMessage(member);
        break;
      case "promote":
        if (onPromoteAdmin) onPromoteAdmin(memberId);
        break;
      case "restrict":
        console.log("Restrict user functionality coming soon");
        break;
      case "remove":
        if (onRemoveMember) onRemoveMember(memberId);
        break;
      case "leave":
        if (onLeaveGroup) onLeaveGroup();
        break;
    }
    setContextMenu(null);
  };

  return (
    <div className="w-1/4 flex flex-col h-full shrink-0 relative bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[60px] border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
          <span className="font-semibold text-[16px] text-gray-800 dark:text-gray-100">
            {isGroup ? "Group Info" : "User Info"}
          </span>
        </div>
        {isGroup && (
          <button
            onClick={onEditClick}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
          >
            <FiEdit2 className="text-[18px]" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Info Section */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-gray-100 dark:border-slate-800">
          <div className="w-28 h-28 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-semibold mb-4 shadow-md overflow-hidden relative group">
            {groupAvatar ? (
              <img src={groupAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{groupName.charAt(0).toUpperCase()}</span>
            )}
            {canEdit && (
              <div
                onClick={onEditClick}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <FiEdit2 className="text-white text-2xl" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center break-words w-full">
            {groupName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isGroup ? `${membersCount} members` : "online"}
          </p>
        </div>

        {/* Settings Section */}
        <div className="py-2 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
            <FiLink2 className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                t.me/+xyz123 link
              </div>
              <div className="text-[13px] text-gray-500">Link</div>
            </div>
          </div>

          <div
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            <div className="flex items-center">
              <FiBell className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
              <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                Notifications
              </div>
            </div>
            {/* Toggle switch */}
            <div
              className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                notificationsEnabled ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  notificationsEnabled ? "translate-x-4" : ""
                }`}
              ></div>
            </div>
          </div>
        </div>

        {/* Members Section (Group Only) */}
        {isGroup && (
          <div className="pb-24">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              members.map((member: any) => (
                <MemberItem
                  key={member._id || member.id || member.user?._id || member.user?.id}
                  member={member}
                  isSelected={contextMenu?.member === member}
                  onContextMenu={handleContextMenu}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Context Menu Dropdown */}
      <ContextMenuDropdown
        contextMenu={contextMenu}
        onAction={handleAction}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
      />
    </div>
  );
};
