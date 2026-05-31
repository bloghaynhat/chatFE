import React from "react";
import { createPortal } from "react-dom";

interface BlockUserModalProps {
  isBlocked?: boolean;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
  isBlocked = false,
  isLoading = false,
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  if (!isOpen || typeof window === "undefined") return null;

  const action = isBlocked ? "Unblock" : "Block";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[296px] min-h-[148px]">
        <div className="flex items-center gap-4 px-6 pt-5 pb-3">
          <div className="w-10 h-10 rounded-full bg-red-500 text-white font-medium flex items-center justify-center text-[15px] flex-shrink-0">
            {userName?.substring(0, 2).toUpperCase() || "U"}
          </div>
          <h2 className="text-[19px] font-medium text-gray-900 dark:text-white leading-tight">
            {action} user
          </h2>
        </div>

        <div className="px-6 py-1 text-[15px] text-gray-600 dark:text-gray-300 leading-snug">
          {isBlocked
            ? "Allow this user to contact you again?"
            : "Block this user? They will be removed from your contacts and will not be able to message you."}
        </div>

        <div className="flex justify-end gap-1 mt-auto" style={{ padding: "8px 12px" }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-2 text-[14px] font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded transition-colors uppercase tracking-wide disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-3 py-2 text-[14px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors uppercase tracking-wide disabled:opacity-50"
          >
            {isLoading ? `${action.toUpperCase()}ING...` : action.toUpperCase()}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
