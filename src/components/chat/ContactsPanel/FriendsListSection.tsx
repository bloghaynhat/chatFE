import { FriendCard } from "../../contacts";

export const FriendsListSection = ({ error, loading, filteredFriends, searchQuery, handleOpenChat }: any) => {
  return (
    <div className="px-3 pt-3">
      {error && <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin inline-block w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {searchQuery ? "No contacts found" : "No contacts yet"}
          </p>
          {!searchQuery && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Search to add friends</p>}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Contacts
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">({filteredFriends.length})</span>
          </div>
          <div className="space-y-0 pb-3">
            {filteredFriends.map((friend, index) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onClick={() => handleOpenChat(friend)}
                style={{ animationDelay: `${index * 0.05}s` }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
