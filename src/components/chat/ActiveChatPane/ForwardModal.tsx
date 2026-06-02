import { useMemo, useState } from "react";
import { FiX, FiBookmark, FiSearch, FiCheck, FiSend } from "react-icons/fi";
import { toast } from "sonner";
import { useLanguage } from "../../../context";

const SAVED_MESSAGES_TARGET = {
  id: "__saved_messages__",
  conversationId: null,
  type: "saved_messages",
  isSavedMessages: true,
  isSelfChat: true,
  name: "Saved Messages",
};

export const ForwardModal = ({
  forwardModalVisible,
  setForwardModalVisible,
  friends,
  messageToForward,
  currentUserId,
  selectedChat,
  onForwardToTarget,
  onForwardMessages = null,
}) => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState("");
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const savedMessagesMatchesSearch = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return true;
    return "saved messages forward here to save tin nhan da luu".includes(query);
  }, [searchValue]);

  const filteredFriends = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return friends || [];
    return (friends || []).filter((friend) => {
      const label = [
        friend.displayName,
        friend.name,
        friend.phone,
        friend.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return label.includes(query);
    });
  }, [friends, searchValue]);

  const getTargetKey = (target) => {
    if (target?.isSavedMessages || target?.type === "saved_messages") {
      return SAVED_MESSAGES_TARGET.id;
    }
    return target?.friendUserId || target?.userId || target?.id || target?._id;
  };

  const getTargetUserId = (friend) => getTargetKey(friend);

  const buildTargetChat = (friend) => {
    if (friend?.isSavedMessages || friend?.type === "saved_messages") {
      return SAVED_MESSAGES_TARGET;
    }

    const targetUserId = getTargetUserId(friend);
    return {
      id: friend.conversationId || `temp-${targetUserId}`,
      conversationId: friend.conversationId,
      targetUserId,
      friendUserId: friend.friendUserId,
      userId: friend.userId,
      isGroup: false,
      participants: [friend],
      type: "private",
      name: friend.displayName || friend.name || friend.phone || "Unknown",
      avatarUrl: friend.avatarUrl,
    };
  };

  const toggleTarget = (friend) => {
    const targetKey = getTargetKey(friend);
    setSelectedTargets((prev) =>
      prev.some((item) => getTargetKey(item) === targetKey)
        ? prev.filter((item) => getTargetKey(item) !== targetKey)
        : [...prev, friend],
    );
  };

  const augmentForwardMessage = (message) => {
    const augmentedMsg = { ...message };
    if (!augmentedMsg.sender) augmentedMsg.sender = {};

    const isMyMsg = Boolean(
      augmentedMsg.isMine ||
        augmentedMsg.sender?.isMe ||
        (currentUserId && augmentedMsg.senderId === currentUserId),
    );

    if (isMyMsg) {
      augmentedMsg.isMine = true;
    } else if (!augmentedMsg.sender.name && !augmentedMsg.sender.displayName) {
      const participant = selectedChat?.participants?.find(
        (p) =>
          p.userId === augmentedMsg.senderId ||
          p.id === augmentedMsg.senderId ||
          p._id === augmentedMsg.senderId,
      );
      if (participant) {
        augmentedMsg.sender.name =
          participant.displayName || participant.name || participant.username;
      } else if (selectedChat?.targetUserId === augmentedMsg.senderId) {
        augmentedMsg.sender.name = selectedChat?.displayName || selectedChat?.name;
      }
    }

    return augmentedMsg;
  };

  const handleSend = async () => {
    if (!messageToForward || selectedTargets.length === 0) return;
    setIsSending(true);
    try {
      if (onForwardMessages) {
        await onForwardMessages(selectedTargets.map(buildTargetChat), messageToForward);
      } else if (onForwardToTarget) {
        onForwardToTarget(buildTargetChat(selectedTargets[0]), augmentForwardMessage(messageToForward));
      }
      setForwardModalVisible(false);
      setSelectedTargets([]);
      setSearchValue("");
    } catch (error) {
      toast.error(error?.message || "Không thể chuyển tiếp tin nhắn");
    } finally {
      setIsSending(false);
    }
  };

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
            {t("chat.forwardTo")}
          </span>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-slate-700/60 px-3 py-2">
            <FiSearch className="text-gray-400" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full bg-transparent text-[14px] text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {savedMessagesMatchesSearch && (
            <div
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              onClick={() => {
                toggleTarget(SAVED_MESSAGES_TARGET);
                if (messageToForward && !onForwardMessages && onForwardToTarget) {
                  onForwardToTarget(
                    buildTargetChat(SAVED_MESSAGES_TARGET),
                    augmentForwardMessage(messageToForward),
                  );
                  setForwardModalVisible(false);
                }
              }}
            >
              <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                <FiBookmark className="text-xl" />
              </div>
              <div className="flex flex-col max-w-full overflow-hidden">
                <span className="font-medium text-[15px] truncate text-gray-900 dark:text-gray-100">
                  {t("nav.savedMessages")}
                </span>
                <span className="text-[13px] text-blue-500 dark:text-blue-400 font-medium truncate">
                  {t("chat.forwardHereToSave")}
                </span>
              </div>
              <div
                className={`ml-auto h-5 w-5 rounded-full border flex items-center justify-center ${
                  selectedTargets.some((item) => getTargetKey(item) === SAVED_MESSAGES_TARGET.id)
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-300 dark:border-slate-600"
                }`}
              >
                {selectedTargets.some((item) => getTargetKey(item) === SAVED_MESSAGES_TARGET.id) && (
                  <FiCheck className="text-[13px]" />
                )}
              </div>
            </div>
          )}

          {filteredFriends?.map((friend) => {
            const targetKey = getTargetKey(friend);
            const isSelected = selectedTargets.some(
              (item) => getTargetKey(item) === targetKey,
            );

            return (
            <div
              key={friend.id || friend._id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              onClick={() => {
                toggleTarget(friend);
                if (messageToForward && !onForwardMessages) {
                  // Create a target chat object compatible with openChatByRow
                  if (onForwardToTarget) {
                    onForwardToTarget(buildTargetChat(friend), augmentForwardMessage(messageToForward));
                  }
                  setForwardModalVisible(false);
                }
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
                  {t("app.online")}
                </span>
              </div>
              <div
                className={`ml-auto h-5 w-5 rounded-full border flex items-center justify-center ${
                  isSelected
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-300 dark:border-slate-600"
                }`}
              >
                {isSelected && <FiCheck className="text-[13px]" />}
              </div>
            </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-700/50 px-4 py-3">
          <span className="text-[13px] text-gray-500 dark:text-gray-400">
            {selectedTargets.length} {t("chat.selected")}
          </span>
          <button
            onClick={handleSend}
            disabled={isSending || selectedTargets.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-[14px] font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <FiSend />
            )}
            {t("app.send")}
          </button>
        </div>
      </div>
    </div>
  );
};
