import React, { useState } from "react";
import { FiArrowLeft, FiUserPlus, FiSearch } from "react-icons/fi";

export const RightSidebarMembers = ({
  type, // "members" | "admins"
  members,
  onClose,
}: any) => {
  const [search, setSearch] = useState("");

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

  return (
    <div className="w-1/3 flex flex-col h-full shrink-0 relative bg-white dark:bg-slate-900">
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
          const isOwner = member.role === "owner" || member.role === "OWNER" || member.role === "admin" || member.role === "ADMIN";
          const displayRole = (member.role === "owner" || member.role === "OWNER") ? "Owner" : (member.role === "admin" || member.role === "ADMIN" ? "Admin" : "");

          return (
            <div
              key={member._id || member.id || participant._id || participant.id}
              className="flex items-center px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
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
                  <span>{displayName} {displayRole && "👑"}</span>
                </div>
                <div className="text-[13px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {displayRole ? (
                     <span className={`${(member.role === "owner" || member.role === "OWNER") ? "text-gray-500" : "text-blue-500"}`}>{displayRole}</span>
                  ) : "last seen recently"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="absolute bottom-6 right-6 w-14 h-14 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-30">
        <FiUserPlus className="text-[26px]" />
      </button>

    </div>
  );
};
