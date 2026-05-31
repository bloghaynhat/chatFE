import React from "react";
import {
  FiAtSign,
  FiBell,
  FiInfo as FiInfoIcon,
  FiPhone,
} from "react-icons/fi";

interface RightSidebarSettingsProps {
  isGroup: boolean;
  targetUserDetails?: any;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const formatProfileValue = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return "Not available";
  }
  return String(value);
};

export const RightSidebarSettings: React.FC<RightSidebarSettingsProps> = ({
  isGroup,
  targetUserDetails,
  notificationsEnabled,
  setNotificationsEnabled,
}) => {
  const profileRows = targetUserDetails
    ? [
        {
          icon: FiPhone,
          label: "Phone",
          value: formatProfileValue(targetUserDetails.phone),
        },
        {
          icon: FiAtSign,
          label: "Email",
          value: formatProfileValue(targetUserDetails.email),
        },
        {
          icon: FiInfoIcon,
          label: "Bio",
          value: formatProfileValue(targetUserDetails.bio),
        },
      ]
    : [];

  return (
    <div className="py-2 border-b border-gray-100 dark:border-slate-800">
      {!isGroup &&
        profileRows.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <Icon className="text-[#aab8c2] group-hover:text-blue-500 text-xl flex-shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200 truncate">
                {value}
              </span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                {label}
              </span>
            </div>
          </div>
        ))}

      {isGroup && (
        <div className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
          <FiInfoIcon className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
          <div className="flex-1">
            <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">ChatChit.me/+xyz123 link</div>
            <div className="text-[13px] text-gray-500">Link</div>
          </div>
        </div>
      )}

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
    </div>
  );
};
