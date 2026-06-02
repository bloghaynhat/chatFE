import React from "react";
import { FiX, FiEdit2 } from "react-icons/fi";
import { useLanguage } from "../../../../context";

interface RightSidebarHeaderProps {
  isGroup: boolean;
  onClose: () => void;
  onEditClick?: () => void;
  children?: React.ReactNode;
}

export const RightSidebarHeader: React.FC<RightSidebarHeaderProps> = ({ isGroup, onClose, onEditClick, children }) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between px-4 h-[60px] border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
        >
          <FiX className="text-xl" />
        </button>
        <span className="font-semibold text-[16px] text-gray-800 dark:text-gray-100">
          {isGroup ? t("sidebar.groupInfo") : t("sidebar.userInfo")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isGroup && (
          <button
            onClick={onEditClick}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
          >
            <FiEdit2 className="text-[18px]" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
