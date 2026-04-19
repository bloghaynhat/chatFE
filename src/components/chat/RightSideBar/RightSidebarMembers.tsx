import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiUserPlus, FiSearch } from "react-icons/fi";
import { MemberItem } from "./MemberItem";
import { ContextMenuDropdown } from "./ContextMenuDropdown";

export const RightSidebarMembers = ({
  type, // "members" | "admins"
  members,
  onClose,
  onAddMemberClick,
  currentUserRole,
  currentUserId,
  onRemoveMember,
  onPromoteAdmin,
  onSendMessage
}: any) => {
  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; member: any } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const title = type === "admins" ? "Administrators" : "Members";

  const displayMembers = members.filter((m: any) => {
    if (type === "admins") {
       return m.role === "admin" || m.role === "owner" || m.role === "ADMIN" || m.role === "OWNER";
    }
    return true;
  }).filter((m: any) => {
    const participant = m.user || m;
    const name = participant.displayName || participant.name || participant.username || "Unknown";
    return name.toLowerCase().includes(search.toLowerCase());
  });

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
    }
    setContextMenu(null);
  };

  return (
    <div className="w-1/4 flex flex-col h-full shrink-0 relative bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center px-4 h-[60px] border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <span className="font-semibold text-[18px] text-gray-800 dark:text-gray-100 ml-4">
          {title}
        </span>
      </div>

      <div className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-[15px] placeholder-gray-400 text-gray-800 dark:text-gray-200"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {displayMembers.map((member: any) => {
          const participant = member.user || member;
          const displayRole = (member.role === "owner" || member.role === "OWNER") ? "Owner" : (member.role === "admin" || member.role === "ADMIN" ? "Admin" : "");
          const isMe = participant._id === currentUserId || participant.id === currentUserId || member.userId === currentUserId;

          return (
            <MemberItem
              key={member._id || member.id || participant._id || participant.id}
              member={member}
              isSelected={contextMenu?.member === member}
              onContextMenu={handleContextMenu}
              variant="members"
              isMe={isMe}
              displayRole={displayRole}
              showLastSeen={false}
            />
          );
        })}
      </div>

      {/* Add Member Button - Only for Admin/Owner */}
      <button 
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-30"
        onClick={onAddMemberClick}
      >
        <FiUserPlus className="text-[26px]" />
      </button>
      

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
