import React from "react";
import {
  FiArrowLeft,
  FiCamera,
  FiSettings,
  FiShield,
  FiUsers,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import { useLanguage } from "../../../context";

export const RightSidebarEdit = ({
  groupName,
  groupAvatar,
  editName,
  setEditName,
  editAvatarUrl,
  isUploadingAvatar,
  onAvatarChange,
  membersCount,
  adminCount,
  currentUserRole,
  onClose,
  onSave,
  onMembersClick,
  onAdminsClick,
  onGroupSettingsClick,
  onDeleteGroupClick,
  isLoading,
}: any) => {
  const { t } = useLanguage();

  return (
    <div className="w-1/4 flex flex-col h-full shrink-0 relative bg-gray-50 dark:bg-slate-950">
      {/* Edit Group Header */}
      <div className="flex items-center px-4 h-[60px] border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <span className="font-semibold text-[18px] text-gray-800 dark:text-gray-100 ml-4">
          {t("group.edit")}
        </span>
        {currentUserRole === "admin" && (
          <button
            onClick={onSave}
            className="p-2 -mr-2 ml-auto rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-500 transition-colors"
          >
            <FiCheck className="text-xl" />
          </button>
        )}
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
                disabled={currentUserRole === "member" ? true : false}
              />
              {currentUserRole === "admin" && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-100 transition-opacity">
                {isUploadingAvatar ? (
                  <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
                ) : (
                  <FiCamera className="text-white text-3xl" />
                )}
              </div>)}

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
                {t("group.name")}
              </div>
              <input
                type="text"
                className="w-full px-3 py-3 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 bg-transparent text-gray-900 dark:text-gray-100"
                placeholder={t("group.name")}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                readOnly={currentUserRole === "member" ? true : false}
                disabled={currentUserRole === "member" ? true : false}
              />
            </div>
          </div>
        </div>
        <div className="py-2 bg-white dark:bg-slate-900 border-t border-b border-gray-200 dark:border-slate-800 mb-2 shadow-sm">
          <button
            type="button"
            className="w-full flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group text-left"
            onClick={onGroupSettingsClick}
          >
            <FiSettings className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                {t("group.settings")}
              </div>
              <div className="text-[13px] text-gray-500">
                {t("group.settingsDescription")}
              </div>
            </div>
          </button>
        </div>

        <div className="px-5 py-1 text-[13px] text-gray-500 mb-3">
          {t("group.addCommentsChat")}
        </div>

        <div className="py-2 bg-white dark:bg-slate-900 border-t border-b border-gray-200 dark:border-slate-800 mb-2 shadow-sm">
          <div
            className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group border-b border-gray-100 dark:border-slate-800"
            onClick={onAdminsClick}
          >
            <FiShield className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                {t("group.administrators")}
              </div>
              <div className="text-[13px] text-gray-500">{adminCount || 1}</div>
            </div>
          </div>
          <div
            className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group border-b border-gray-100 dark:border-slate-800"
            onClick={onMembersClick}
          >
            <FiUsers className="text-gray-400 group-hover:text-blue-500 text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                {t("chat.members")}
              </div>
              <div className="text-[13px] text-gray-500">{membersCount}</div>
            </div>
          </div>
        </div>

        <div className="py-2 bg-white dark:bg-slate-900 border-t border-b border-gray-200 dark:border-slate-800 mb-12 shadow-sm">
          <div
            className="flex items-center px-5 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors group border-b border-gray-100 dark:border-slate-800"
            onClick={() => {
              if (onDeleteGroupClick) {
                onDeleteGroupClick();
              }
            }}
          >
            <FiTrash2 className="text-[#ff4b4b] text-2xl mr-4 shrink-0" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-[#ff4b4b]">
                {currentUserRole === "admin" ? t("group.deleteAndLeave") : t("group.leave")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
