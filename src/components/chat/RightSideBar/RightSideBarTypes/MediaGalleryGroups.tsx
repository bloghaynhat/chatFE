import React from "react";

interface Group {
  id: string;
  name: string;
  avatarUrl?: string;
  memberCount?: number;
}

interface MediaGalleryGroupsProps {
  groups: Group[];
  isLoading: boolean;
  onGroupClick?: (group: Group) => void;
  onShowInChat?: (mediaUrl: string) => void;
  messages?: any[];
}

export const MediaGalleryGroups: React.FC<MediaGalleryGroupsProps> = ({
  groups,
  isLoading,
  onGroupClick,
  onShowInChat,
  messages,
}) => {
  return (
    <div className="flex flex-col h-full">
      {groups.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No groups</p>
        </div>
      ) : (
        <div className="p-2">
          <div className="grid grid-cols-2 gap-3">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onGroupClick?.(group)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
              >
                {/* Group Avatar */}
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-shadow">
                  {group.avatarUrl ? (
                    <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM9 12a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                  )}
                </div>

                {/* Group Info */}
                <div className="flex-1 text-center min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {group.name}
                  </p>
                  {group.memberCount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{group.memberCount} members</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
