import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiArrowLeft, FiUserPlus, FiSearch, FiMessageSquare, FiShield, FiKey, FiTrash2, FiLogOut } from "react-icons/fi";

export const RightSidebarMembers = ({
  type, // "members" | "admins"
  members,
  onClose,
  onAddMemberClick,
  currentUserRole,
  currentUserId,
  onRemoveMember,
  onPromoteAdmin,
  onSendMessage,
  onLeaveGroup
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

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
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
          const displayName = participant.displayName || participant.name || participant.username || "Unknown";
          const isOwner = member.role === "owner" || member.role === "OWNER";
          const displayRole = (member.role === "owner" || member.role === "OWNER") ? "Owner" : (member.role === "admin" || member.role === "ADMIN" ? "Admin" : "");
          const isMe = participant._id === currentUserId || participant.id === currentUserId || member.userId === currentUserId;

          return (
            <div
              key={member._id || member.id || participant._id || participant.id}
              onContextMenu={(e) => handleContextMenu(e, member)}
              className={`flex items-center px-5 py-3 cursor-pointer transition-colors relative ${
                contextMenu?.member === member 
                  ? 'bg-gray-100 dark:bg-slate-800' 
                  : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-[#ff7a7c] font-semibold text-white flex items-center justify-center mr-4 overflow-hidden shrink-0">
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
                <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate flex items-center justify-between">
                  <span>{displayName} {isMe ? "(You)" : ""} {displayRole && "👑"}</span>
                </div>
                <div className="text-[13px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {displayRole ? (
                     <span className={`${isOwner ? "text-gray-500" : "text-blue-500"}`}>{displayRole}</span>
                  ) : "last seen recently"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Button - Only for Admin/Owner */}
      {(currentUserRole === "admin" || currentUserRole === "ADMIN" || currentUserRole === "owner" || currentUserRole === "OWNER") && (
        <button 
          className="absolute bottom-6 right-6 w-14 h-14 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-30"
          onClick={onAddMemberClick}
        >
          <FiUserPlus className="text-[26px]" />
        </button>
      )}

      {/* Context Menu Dropdown */}
      {contextMenu && createPortal(
        <div 
          className="fixed z-[9999] bg-white dark:bg-slate-900 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-slate-800 py-2 w-[220px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button 
            onClick={(e) => handleAction(e, "sendMessage")}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors"
          >
            <FiMessageSquare className="mr-3 text-[18px] text-gray-900 dark:text-gray-300" strokeWidth={2} />
            Send Message
          </button>
          
          {(currentUserRole === "admin" || currentUserRole === "ADMIN" || currentUserRole === "owner" || currentUserRole === "OWNER") ? (
           (contextMenu.member.role !== "owner" && contextMenu.member.role !== "OWNER" &&
            (contextMenu.member.user?._id !== currentUserId && contextMenu.member.userId !== currentUserId)) && (
            <>
              {contextMenu.member.role !== "admin" && contextMenu.member.role !== "ADMIN" && (
                <button 
                  onClick={(e) => handleAction(e, "promote")}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors"
                >
                  <FiShield className="mr-3 text-[18px] text-gray-900 dark:text-gray-300" strokeWidth={2} />
                  Promote to admin
                </button>
              )}
              
              <button 
                onClick={(e) => handleAction(e, "restrict")}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors"
              >
                <FiKey className="mr-3 text-[18px] text-gray-900 dark:text-gray-300" strokeWidth={2} />
                Restrict user
              </button>

              <button 
                onClick={(e) => handleAction(e, "remove")}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors"
              >
                <FiTrash2 className="mr-3 text-[18px] text-gray-900 dark:text-gray-300" strokeWidth={2} />
                Remove from group
              </button>
            </>
           )
          ) : (
            (contextMenu.member.role !== "admin" && contextMenu.member.role !== "ADMIN" && contextMenu.member.role !== "owner" && contextMenu.member.role !== "OWNER") && (
              <button 
                onClick={(e) => handleAction(e, "leave")}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors"
              >
                <FiLogOut className="mr-3 text-[18px] text-gray-900 dark:text-gray-300" strokeWidth={2} />
                Leave group
              </button>
            )
          )}
        </div>,
        document.body
      )}


    </div>
  );
};
