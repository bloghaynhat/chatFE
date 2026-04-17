import { FiX, FiBookmark } from "react-icons/fi";

export const ForwardModal = ({
  forwardModalVisible,
  setForwardModalVisible,
  friends,
  messageToForward,
  currentUserId,
  selectedChat,
  onForwardToTarget,
}) => {
  if (!forwardModalVisible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-[360px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 gap-4">
          <button
            onClick={() => setForwardModalVisible(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
          <span className="font-semibold text-[17px] text-gray-800 dark:text-gray-100">
            Forward to...
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
            <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
              <FiBookmark className="text-xl" />
            </div>
            <div className="flex flex-col max-w-full overflow-hidden">
              <span className="font-medium text-[15px] truncate text-gray-900 dark:text-gray-100">
                Saved Messages
              </span>
              <span className="text-[13px] text-blue-500 dark:text-blue-400 font-medium truncate">
                forward here to save
              </span>
            </div>
          </div>

          {friends?.map((friend) => (
            <div
              key={friend.id || friend._id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              onClick={() => {
                if (messageToForward) {
                  const targetUserId =
                    friend.friendUserId ||
                    friend.userId ||
                    friend.id ||
                    friend._id;

                  const augmentedMsg = { ...messageToForward };
                  if (!augmentedMsg.sender) augmentedMsg.sender = {};

                  const isMyMsg = Boolean(
                    augmentedMsg.isMine ||
                      augmentedMsg.sender?.isMe ||
                      (currentUserId && augmentedMsg.senderId === currentUserId),
                  );

                  if (isMyMsg) {
                    augmentedMsg.isMine = true;
                  } else if (
                    !augmentedMsg.sender.name &&
                    !augmentedMsg.sender.displayName
                  ) {
                    const participant = selectedChat?.participants?.find(
                      (p) =>
                        p.userId === augmentedMsg.senderId ||
                        p.id === augmentedMsg.senderId ||
                        p._id === augmentedMsg.senderId,
                    );
                    if (participant) {
                      augmentedMsg.sender.name =
                        participant.displayName ||
                        participant.name ||
                        participant.username;
                    } else if (
                      selectedChat?.targetUserId === augmentedMsg.senderId
                    ) {
                      augmentedMsg.sender.name =
                        selectedChat?.displayName || selectedChat?.name;
                    }
                  }

                  // Create a target chat object compatible with openChatByRow
                  const targetChat = {
                    id: `temp-${targetUserId}`,
                    targetUserId: targetUserId,
                    isGroup: false,
                    participants: [friend],
                    type: "private",
                    name:
                      friend.displayName ||
                      friend.name ||
                      friend.phone ||
                      "Unknown",
                    avatarUrl: friend.avatarUrl,
                  };

                  if (onForwardToTarget) {
                    onForwardToTarget(targetChat, augmentedMsg);
                  }
                }
                setForwardModalVisible(false);
              }}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0">
                {friend.avatarUrl ? (
                  <img
                    src={friend.avatarUrl}
                    alt={friend.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (friend.displayName || friend.name || friend.phone || "U")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              <div className="flex flex-col max-w-full overflow-hidden">
                <span className="font-medium text-[15px] truncate text-gray-900 dark:text-gray-100">
                  {friend.displayName || friend.name || friend.phone}
                </span>
                <span className="text-[13px] text-blue-500 dark:text-blue-400 font-medium truncate">
                  online
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
