import React from "react";
import { createPortal } from "react-dom";
import { FiMessageSquare, FiShield, FiKey, FiTrash2 } from "react-icons/fi";

interface ContextMenuDropdownProps {
  contextMenu: { x: number; y: number; member: any } | null;
  onAction: (action: string) => void;
  currentUserRole: string;
  currentUserId: string;
}

export const ContextMenuDropdown: React.FC<ContextMenuDropdownProps> = ({
  contextMenu,
  onAction,
  currentUserRole,
  currentUserId
}) => {
  if (!contextMenu) return null;

  const isAdminOrOwner =
    currentUserRole === "admin" ||
    currentUserRole === "ADMIN" ||
    currentUserRole === "owner" ||
    currentUserRole === "OWNER";

  const isTargetOwner =
    contextMenu.member.role === "owner" ||
    contextMenu.member.role === "OWNER";

  const isCurrentUser =
    contextMenu.member.user?._id === currentUserId ||
    contextMenu.member.userId === currentUserId;

  const canShowAdminActions =
    isAdminOrOwner && !isTargetOwner && !isCurrentUser;

  return createPortal(
    <div
      className="fixed z-[9999] bg-white dark:bg-slate-900 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-slate-800 py-2 w-[220px]"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction("sendMessage");
        }}
        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors"
      >
        <FiMessageSquare className="mr-3 text-[18px] text-gray-900 dark:text-gray-300" strokeWidth={2} />
        Send Message
      </button>

      {canShowAdminActions && (
        <>
          {contextMenu.member.role !== "admin" &&
            contextMenu.member.role !== "ADMIN" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("promote");
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors"
              >
                <FiShield className="mr-3 text-[18px] text-gray-900 dark:text-gray-300" strokeWidth={2} />
                Promote to admin
              </button>
            )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction("restrict");
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors"
          >
            <FiKey className="mr-3 text-[18px] text-gray-900 dark:text-gray-300" strokeWidth={2} />
            Restrict user
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction("remove");
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center text-[15px] font-medium text-gray-900 dark:text-gray-100 transition-colors"
          >
            <FiTrash2 className="mr-3 text-[18px] text-gray-900 dark:text-gray-300" strokeWidth={2} />
            Remove from group
          </button>
        </>
      )}
    </div>,
    document.body
  );
};

export default ContextMenuDropdown;
