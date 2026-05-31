import React from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteForAll: boolean) => Promise<void>;
  groupName?: string;
  isLoading?: boolean;
  isAdmin?: boolean; // If true, user can delete the group; if false, user can only leave
}

export const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  groupName = "this group",
  isLoading = false,
  isAdmin = false,
}) => {
  const [deleteForAll, setDeleteForAll] = React.useState(false);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setDeleteForAll(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const confirmLabel = isAdmin && deleteForAll ? "Delete Group" : "Leave Group";
  const loadingLabel = isAdmin && deleteForAll ? "Deleting..." : "Leaving...";

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm(deleteForAll);
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-0 sm:p-4 transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full sm:max-w-[400px] sm:rounded-xl shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <FiAlertTriangle className="text-[18px] text-red-500" />
            </div>
            <h2 className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
              {isAdmin ? "Delete Group" : "Leave Group"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <FiX className="text-[18px]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FiAlertTriangle className="text-[14px] text-red-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {isAdmin ? (
                <>
                  <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                    Are you sure you want to delete &quot;{groupName}&quot;?
                  </p>
                  <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    This will permanently remove the group and all its messages for every member. This action cannot be undone.
                  </p>

                  {/* Checkbox: Delete for all members */}
                  <div className="flex items-start gap-2.5 cursor-pointer" onClick={() => setDeleteForAll(!deleteForAll)}>
                    <div
                      className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 mt-0.5 ${
                        deleteForAll
                          ? 'bg-red-500 border-red-500'
                          : 'bg-white border-gray-300 dark:border-gray-600 hover:border-red-400'
                      }`}
                    >
                      {deleteForAll && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">
                        Delete for all members
                      </p>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Remove this group for everyone and delete all messages
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                    Are you sure you want to leave this group?
                  </p>
                  <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    You will lose access to messages and media. This action cannot be undone.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-[14px] font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-[14px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{loadingLabel}</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGroupModal;
