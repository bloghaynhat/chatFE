import React from "react";
import { FiUser, FiCheck, FiShield } from "react-icons/fi";

interface Member {
  userId?: string;
  id?: string;
  user?: {
    id: string;
    displayName?: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
  };
  role: string;
}

interface SelectAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (memberId: string) => Promise<void>;
  members: Member[];
  isLoading?: boolean;
  currentUserId: string;
}

export const SelectAdminModal: React.FC<SelectAdminModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  members,
  isLoading = false,
  currentUserId,
}) => {
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null);

  // Reset selection when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedMemberId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const availableMembers = members.filter((m) => {
    const memberId = m.userId || m.user?.id || m.id;
    return memberId && String(memberId) !== String(currentUserId);
  });

  const displayMembers = availableMembers
    .map((m) => ({
      id: m.userId || m.user?.id || m.id,
      displayName:
        m.user?.displayName || m.user?.name || m.user?.username || `User ${m.userId || m.id}`,
      avatarUrl: m.user?.avatarUrl,
      role: m.role,
    }))
    .sort((a, b) => {
      const aIsAdmin = String(a.role || "").toLowerCase() === "admin";
      const bIsAdmin = String(b.role || "").toLowerCase() === "admin";
      if (aIsAdmin === bIsAdmin) return a.displayName.localeCompare(b.displayName);
      return aIsAdmin ? -1 : 1;
    });

  const handleConfirm = async () => {
    if (!selectedMemberId) return;
    try {
      await onConfirm(selectedMemberId);
    } catch (error) {
      console.error("Failed to transfer admin:", error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
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
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <FiShield className="text-[18px] text-blue-500" />
            </div>
            <h2 className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
              Transfer Ownership
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FiShield className="text-[14px] text-blue-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                Select a new owner
              </p>
              <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Choose a member to become owner before you leave the group. Admins are shown first.
              </p>
            </div>
          </div>

          {displayMembers.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <p>No available members to transfer ownership.</p>
              <p className="text-sm mt-1">Add more members first or keep current admin.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayMembers.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMemberId === member.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <div className="relative">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                        <FiUser className="text-gray-400 text-lg" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100 truncate">
                      {member.displayName}
                    </p>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">
                      {String(member.role).toLowerCase() === "admin" ? "Admin" : "Member"}
                    </p>
                  </div>
                  {selectedMemberId === member.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <FiCheck className="text-white text-sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
            disabled={isLoading || !selectedMemberId}
            className="px-4 py-2 text-[14px] font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Transferring...</span>
              </>
            ) : (
              "Transfer & Leave"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectAdminModal;
