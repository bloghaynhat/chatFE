import React from "react";
import {
  FiArrowLeft,
  FiCamera,
  FiLock,
  FiLink,
  FiHeart,
  FiShield,
  FiList,
  FiUsers,
  FiCheck,
  FiUserX,
  FiMessageSquare,
  FiTrash2,
} from "react-icons/fi";

export const RightSidebarEdit = ({
  groupName,
  groupAvatar,
  editName,
  setEditName,
  editAvatarUrl,
  isUploadingAvatar,
  onAvatarChange,
  membersCount,
  currentUserRole,
  onClose,
  onSave,
}: any) => {
  return (
    <div className="w-1/2 flex flex-col h-full shrink-0 relative bg-gray-50 dark:bg-slate-950">
      {/* Edit Group Header */}
      <div className="flex items-center px-4 h-[60px] border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <span className="font-semibold text-[18px] text-gray-800 dark:text-gray-100 ml-4">
          Edit
        </span>
        <button
          onClick={onSave}
          className="p-2 -mr-2 ml-auto rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-500 transition-colors"
        >
          <FiCheck className="text-xl" />
        </button>
      </div>

      {/* Edit Group Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-slate-950">
        {/* Avatar area */}
        <div className="flex flex-col items-center pt-8 pb-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm mt-0">
          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-semibold mb-6 shadow-md overflow-hidden relative cursor-pointer group">
            <label className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center bg-transparent">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0] && onAvatarChange) {
                    onAvatarChange(e.target.files[0]);
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-100 transition-opacity">
                {isUploadingAvatar ? (
                  <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
                ) : (
                  <FiCamera className="text-white text-3xl" />
                )}
              </div>
            </label>
            {editAvatarUrl || groupAvatar ? (
              <img src={editAvatarUrl || groupAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{groupName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="w-full px-4 mb-4">
            <div className="relative">
              <div className="absolute -top-2 left-3 bg-white dark:bg-slate-900 px-1 text-[11px] text-gray-500 z-10">
                Group Name
              </div>
              <input
                type="text"
                className="w-full px-3 py-3 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 bg-transparent text-gray-900 dark:text-gray-100"
                placeholder="Group Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="py-2 bg-white dark:bg-slate-900 border-t border-b border-gray-200 dark:border-slate-800 mb-2 shadow-sm">
          <div className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group border-b border-gray-100 dark:border-slate-800">
            <FiLock className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                Group Type
              </div>
              <div className="text-[13px] text-blue-500">Private</div>
            </div>
          </div>
          <div className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group border-b border-gray-100 dark:border-slate-800">
            <FiLink className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                Invite Links
              </div>
              <div className="text-[13px] text-gray-500">1</div>
            </div>
          </div>
          <div className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group border-b border-gray-100 dark:border-slate-800">
            <FiHeart className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                Reactions
              </div>
              <div className="text-[13px] text-gray-500">All</div>
            </div>
          </div>
          <div className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group border-b border-gray-100 dark:border-slate-800">
            <FiShield className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                Permissions
              </div>
              <div className="text-[13px] text-gray-500">13/13</div>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
            <div className="flex items-center shrink-0">
              <FiList className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4" />
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                Topics
              </div>
            </div>
            <div className="w-10 h-5 flex items-center bg-gray-300 dark:bg-slate-600 rounded-full p-1 cursor-pointer transition-colors duration-300">
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300"></div>
            </div>
          </div>
        </div>
        <div className="px-5 py-1 text-[13px] text-gray-500 mb-3">
          Add a group chat for comments
        </div>

        <div className="py-2 bg-white dark:bg-slate-900 border-t border-b border-gray-200 dark:border-slate-800 mb-2 shadow-sm">
          <div className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group border-b border-gray-100 dark:border-slate-800">
            <FiShield className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                Administrators
              </div>
              <div className="text-[13px] text-gray-500">1</div>
            </div>
          </div>
          <div className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group border-b border-gray-100 dark:border-slate-800">
            <FiUsers className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                Members
              </div>
              <div className="text-[13px] text-gray-500">{membersCount}</div>
            </div>
          </div>
          <div className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
            <FiUserX className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                Removed users
              </div>
              <div className="text-[13px] text-gray-500">No removed users</div>
            </div>
          </div>
        </div>

        <div className="py-2 bg-white dark:bg-slate-900 border-t border-b border-gray-200 dark:border-slate-800 mb-2 shadow-sm">
          <div className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
            <FiMessageSquare className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                Chat history for new members
              </div>
            </div>
          </div>
        </div>

        <div className="py-2 bg-white dark:bg-slate-900 border-t border-b border-gray-200 dark:border-slate-800 mb-12 shadow-sm">
          <div
            className="flex items-center px-5 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors group"
            onClick={async () => {
              // Future function: Delete and Leave Group
            }}
          >
            <FiTrash2 className="text-[#ff4b4b] text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-[#ff4b4b]">
                {currentUserRole === "member" ? "Leave Group" : "Delete and Leave Group"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
