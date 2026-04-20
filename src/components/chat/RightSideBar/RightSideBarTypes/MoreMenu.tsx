import React, { useRef } from "react";
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";

interface MoreMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onDeleteClick: () => void;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({
  isOpen,
  onToggle,
  onDeleteClick,
}) => {
  const moreMenuRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={moreMenuRef} className="relative">
      <button
        onClick={onToggle}
        className={`p-2 rounded-full transition-colors ${
          isOpen
            ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
            : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
        }`}
      >
        <FiMoreVertical className="text-xl" />
      </button>

      <div
        className={`absolute right-0 top-10 w-48 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-slate-700 z-50 origin-top-right transition-all duration-200 ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="p-1.5">
          <button
            onClick={() => {
              onToggle();
              onDeleteClick();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[14px] font-medium text-red-500 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-colors"
          >
            <FiTrash2 className="text-[17px]" />
            <span>Delete Contact</span>
          </button>
        </div>
      </div>
    </div>
  );
};
