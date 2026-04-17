import { FiUser } from "react-icons/fi";

export const GlobalUserItem = ({ user, isCollapsed, onSelectChat }) => {
  return (
    <div
      onClick={() => {
        const mappedChat = {
          id: `temp-${user.id || user._id}`,
          targetUserId: user.id || user._id,
          name: user.displayName || user.username || "User",
          avatarUrl: user.avatarUrl,
          avatar: <FiUser className="text-2xl" />,
        };
        onSelectChat?.(mappedChat);
      }}
      className={`flex items-center transition relative ${
        isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-3"
      } cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700`}
    >
      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0 flex-none relative">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-500 text-lg dark:text-gray-300 font-bold uppercase">
            {(user.displayName || user.username || "U").charAt(0)}
          </span>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {user.displayName || user.username}
          </h3>
          {user.phone && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.phone}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
