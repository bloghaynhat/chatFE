import React from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";

interface DeleteConversationModalProps {
  chatName?: string;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConversationModal: React.FC<DeleteConversationModalProps> = ({
  chatName = "this chat",
  isLoading = false,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/25 px-4 dark:bg-black/50">
      <div className="w-full max-w-[320px] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-4 px-6 pt-5 pb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
            <FiTrash2 className="text-[18px]" />
          </div>
          <h2 className="text-[19px] font-medium leading-tight text-gray-900 dark:text-white">
            Delete chat
          </h2>
        </div>

        <div className="px-6 py-1 text-[15px] leading-snug text-gray-600 dark:text-gray-300">
          Delete <span className="font-semibold text-gray-900 dark:text-white">{chatName}</span> from your chat list?
          <div className="mt-2 flex items-start gap-2 text-[13px] text-gray-500 dark:text-gray-400">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-red-500" />
            <span>This only deletes the conversation for you.</span>
          </div>
        </div>

        <div className="mt-auto flex justify-end gap-1 px-3 py-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded px-3 py-2 text-[14px] font-medium uppercase tracking-wide text-blue-500 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-slate-700/50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded px-3 py-2 text-[14px] font-medium uppercase tracking-wide text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
