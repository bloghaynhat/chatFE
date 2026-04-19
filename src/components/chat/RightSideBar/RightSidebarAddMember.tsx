import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useFriendManagement } from "../../../hooks";

const getAvatarBgColor = (name: string) => {
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", 
    "bg-green-500", "bg-emerald-500", "bg-teal-500", 
    "bg-cyan-500", "bg-blue-500", "bg-indigo-500", 
    "bg-violet-500", "bg-purple-500", "bg-pink-500"
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.split(" ").filter((p: string) => p.length > 0);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const RightSidebarAddMember = ({
  members,
  onClose,
  onAddMembers
}: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { friends, loading: friendsLoading, fetchFriends } = useFriendManagement();

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleContinue = () => {
    if (selectedIds.size > 0 && onAddMembers) {
      onAddMembers(Array.from(selectedIds));
    }
  };

  const existingMemberUserIds = new Set(members.map((m: any) => m.userId || m.user?.id || m.id));
  
  const eligibleFriends = friends.filter((f: any) => !existingMemberUserIds.has(f.friendUserId));
  
  const filteredContacts = eligibleFriends.filter((c: any) => {
    const name = c.displayName || c.name || "Unknown";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-1/4 flex flex-col h-full shrink-0 relative bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800">
      <div className="flex items-center px-4 h-[60px] border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <span className="font-semibold text-[18px] text-gray-800 dark:text-gray-100 ml-4">
          Add Members
        </span>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900" style={{ minHeight: 0 }}>
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {friends.filter((c: any) => selectedIds.has(c.friendUserId)).map((contact: any) => {
                const name = contact.displayName || contact.name || "Unknown";
                const avatarBg = getAvatarBgColor(name);
                const initials = getInitials(name);

                return (
                  <div
                    key={contact.friendUserId}
                    className="flex items-center bg-[#f0f2f5] dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-full pr-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleToggleSelect(contact.friendUserId)}
                  >
                    <div className={`w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-[13px] tracking-tight ${contact.avatarUrl ? '' : avatarBg} overflow-hidden mr-2`}>
                      {contact.avatarUrl ? (
                        <img src={contact.avatarUrl} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <span className="text-[15px] font-medium truncate max-w-[120px]">
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <input
            type="text"
            placeholder="Add people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[16px] placeholder-gray-400 text-gray-800 dark:text-gray-200"
          />
        </div>

        <div style={{ minHeight: 0 }}>
          {friendsLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex justify-center items-center h-40 text-gray-500 text-[15px]">
              No contacts found
            </div>
          ) : (
            filteredContacts.map((contact: any) => {
              const name = contact.displayName || contact.name || "Unknown";
              const isSelected = selectedIds.has(contact.friendUserId);
              const avatarBg = getAvatarBgColor(name);
              const initials = getInitials(name);

              return (
                <div
                  key={contact.id}
                  className="flex items-center px-5 py-[10px] cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => handleToggleSelect(contact.friendUserId)}
                >
                  <div className="mr-5 flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-[4px] border-[1.5px] flex items-center justify-center transition-all duration-200 ${
                        isSelected
                        ? 'bg-[#3b82f6] border-[#3b82f6]'
                        : 'bg-transparent border-gray-400 dark:border-gray-500 hover:border-gray-500'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div
                    className={`w-[46px] h-[46px] rounded-full flex-shrink-0 mr-[14px] flex items-center justify-center text-white font-medium text-[17px] tracking-tight ${contact.avatarUrl ? '' : avatarBg} overflow-hidden`}
                  >
                    {contact.avatarUrl ? (
                      <img src={contact.avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 justify-center h-full">
                    <span className="text-[16px] font-medium text-gray-900 dark:text-gray-100 truncate leading-tight mb-0.5">
                      {name}
                    </span>
                    <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                      {contact.lastSeen || "last seen recently"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div
        className={`absolute bottom-[20px] right-[20px] transition-all duration-300 ease-out z-30 ${
          selectedIds.size > 0
          ? "transform scale-100 translate-y-0 opacity-100"
          : "transform scale-75 translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <button
          className="w-[56px] h-[56px] bg-[#3b82f6] hover:bg-[#2563eb] rounded-full flex items-center justify-center text-white shadow-[0_8px_16px_rgba(59,130,246,0.3)] transition-colors active:scale-95"
          onClick={handleContinue}
        >
          <FiArrowRight className="text-[26px]" />
        </button>
      </div>
    </div>
  );
};
