import React from "react";
import { createPortal } from "react-dom";
import { FiAlertCircle } from "react-icons/fi";

interface DeleteContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contactName?: string;
  isLoading?: boolean;
}

export const DeleteContactModal: React.FC<DeleteContactModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contactName,
  isLoading = false,
}) => {
  if (!isOpen || typeof window === "undefined") return null;

  return (
    createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-black/50"
        style={{ animation: "fadeInBg 0.2s ease-out forwards" }}
      >
        <style>{`
          @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleInPopup { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        `}</style>
        <div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            width: "296px",
            minHeight: "148px",
            animation: "scaleInPopup 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          <div className="flex items-center gap-4 px-6 pt-5 pb-3">
            <div className="w-10 h-10 rounded-full bg-pink-500 text-white font-medium flex items-center justify-center text-[15px] flex-shrink-0">
              {contactName?.substring(0, 2).toUpperCase() || "U"}
            </div>
            <h2 className="text-[19px] font-medium text-gray-900 dark:text-white leading-tight">
              Delete contact
            </h2>
          </div>

          <div className="px-6 py-1 text-[15px] text-gray-600 dark:text-gray-300 leading-snug">
            Are you sure you want to delete this contact?
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
              className="px-3 py-2 text-[14px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors uppercase tracking-wide flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? "DELETING..." : "DELETE"}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
  );
};
