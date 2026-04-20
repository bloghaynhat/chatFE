import React from "react";
import { FiPhone, FiInfo as FiInfoIcon, FiBell, FiUserPlus, FiCheck } from "react-icons/fi";

interface RightSidebarSettingsProps {
  isGroup: boolean;
  targetUserDetails?: any;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  friendStatus?: "LOADING" | "PENDING" | "ACCEPTED" | "NONE";
  friendDirection?: "INCOMING" | "OUTGOING" | null;
  isProcessingFriend: boolean;
  onAddFriend: () => void;
  onAcceptRequest: () => void;
}

export const RightSidebarSettings: React.FC<RightSidebarSettingsProps> = ({
  isGroup,
  targetUserDetails,
  notificationsEnabled,
  setNotificationsEnabled,
  friendStatus,
  friendDirection,
  isProcessingFriend,
  onAddFriend,
  onAcceptRequest,
}) => {
  return (
    <div className="py-2 border-b border-gray-100 dark:border-slate-800">
      {/* User contact info */}
      {!isGroup && targetUserDetails && (
        <>
          <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
            <FiPhone className="text-[#aab8c2] group-hover:text-blue-500 text-xl" />
            <div className="flex flex-col flex-1">
              <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                {targetUserDetails.phone || "+84 971484472"}
              </span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Phone</span>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
            <span className="text-[#aab8c2] group-hover:text-blue-500 text-xl font-bold">@</span>
            <div className="flex flex-col flex-1">
              <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                {targetUserDetails.email || "No email provided"}
              </span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Email</span>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
            <FiInfoIcon className="text-[#aab8c2] group-hover:text-blue-500 text-xl" />
            <div className="flex flex-col flex-1">
              <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200 min-h-[22px]">
                {targetUserDetails.bio || ""}
              </span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Bio</span>
            </div>
          </div>
        </>
      )}

      {/* Group link */}
      {isGroup && (
        <div className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
          <FiInfoIcon className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
          <div className="flex-1">
            <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">t.me/+xyz123 link</div>
            <div className="text-[13px] text-gray-500">Link</div>
          </div>
        </div>
      )}

      {/* Notifications toggle */}
      <div
        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
      >
        <div className="flex items-center">
          <FiBell className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
          <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">Notifications</div>
        </div>
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

      {/* Friend request actions */}
      {!isGroup && friendStatus === "NONE" && (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800">
          <button
            disabled={isProcessingFriend}
            onClick={onAddFriend}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-medium rounded-lg transition-all disabled:opacity-50"
          >
            <FiUserPlus className="text-lg" />
            <span>{isProcessingFriend ? "Sending..." : "Add Contact"}</span>
          </button>
        </div>
      )}

      {!isGroup && friendStatus === "PENDING" && friendDirection === "INCOMING" && (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800">
          <button
            disabled={isProcessingFriend}
            onClick={onAcceptRequest}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-medium rounded-lg transition-all disabled:opacity-50"
          >
            <FiCheck className="text-lg" />
            <span>{isProcessingFriend ? "Accepting..." : "Accept Request"}</span>
          </button>
        </div>
      )}

      {!isGroup && friendStatus === "PENDING" && friendDirection === "OUTGOING" && (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800">
          <button
            disabled
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-medium rounded-lg"
          >
            <FiInfoIcon className="text-lg" />
            <span>Request Sent</span>
          </button>
        </div>
      )}
    </div>
  );
};
