import React from "react";
import { FiEdit2 } from "react-icons/fi";

interface RightSidebarAvatarProps {
  avatarUrl?: string;
  name: string;
  canEdit?: boolean;
  onEditClick?: () => void;
}

export const RightSidebarAvatar: React.FC<RightSidebarAvatarProps> = ({
  avatarUrl,
  name,
  canEdit,
  onEditClick,
}) => {
  return (
    <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-gray-100 dark:border-slate-800">
      <div className="w-28 h-28 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-semibold mb-4 shadow-md overflow-hidden relative group">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span>{name.charAt(0).toUpperCase()}</span>
        )}
        {canEdit && (
          <div
            onClick={onEditClick}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <FiEdit2 className="text-white text-2xl" />
          </div>
        )}
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center break-words w-full">
        {name}
      </h2>
    </div>
  );
};
