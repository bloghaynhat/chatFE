import { useEffect, useState } from "react";
import userService from "../../../services/userService";
import {
  FiMessageCircle,
  FiClock,
  FiSmile,
  FiPaperclip,
  FiMic,
  FiSend,
  FiHeart,
  FiThumbsUp,
  FiThumbsDown,
  FiZap,
  FiFilm,
  FiDelete,
  FiCornerUpRight,
  FiCornerUpLeft,
  FiEdit2,
  FiX,
  FiSearch,
} from "react-icons/fi";
import EmojiPicker, { Theme } from "emoji-picker-react";

// frequentEmojis removed

export const ChatInput = ({
  draftMessage,
  setDraftMessage,
  handleInputChange,
  handleSendMessage,
  isAttachMenuOpen,
  setIsAttachMenuOpen,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  isMoreMenuOpen,
  setIsMoreMenuOpen,
  attachMenuRef,
  emojiMenuRef,
  attachActions,
  editingMessage,
  setEditingMessage,
  replyingMessage,
  setReplyingMessage,
  forwardingMessage,
  onClearForwarding,
  currentUserId,
}) => {
  const [fetchedReplyingSender, setFetchedReplyingSender] = useState<any>(null);

  useEffect(() => {
    if (replyingMessage) {
      if (!replyingMessage.sender?.name && !replyingMessage.senderName && !replyingMessage.sender?.displayName) {
        const senderId = replyingMessage.senderId || replyingMessage.id_sender;
        if (senderId && senderId !== currentUserId) {
          userService
            .getUserById(senderId)
            .then((res) => {
              if (res) {
                setFetchedReplyingSender(res);
              }
            })
            .catch((err) => console.error("Error fetching sender info:", err));
        }
      }
    } else {
      setFetchedReplyingSender(null);
    }
  }, [replyingMessage, currentUserId]);

  return (
    <div className="absolute left-0 right-0 bottom-3 px-4 lg:px-5 bg-transparent">
      {(forwardingMessage || editingMessage || replyingMessage) && (
        <div className="max-w-4xl mx-auto mb-2 flex bg-[#edf4f1] dark:bg-slate-800/95 rounded-t-[10px] overflow-hidden relative z-40 p-[8px] pl-[14px] items-center">
          <div className="flex-1 flex flex-col justify-center min-w-0 pr-6 gap-[5px]">
            <span className="text-[14px] font-medium text-[#2ea6f3] flex items-center gap-1.5 leading-none">
              {editingMessage ? (
                <FiEdit2 className="text-[17px]" strokeWidth={2} />
              ) : replyingMessage ? (
                <FiCornerUpLeft className="text-[16px]" strokeWidth={2.5} />
              ) : (
                <FiCornerUpRight className="text-[14px]" strokeWidth={2.5} />
              )}
              <span className="text-[14.5px] tracking-tight">
                {editingMessage
                  ? "Editing"
                  : replyingMessage
                    ? `Reply to ${replyingMessage?.senderId === currentUserId ? "You" : fetchedReplyingSender?.displayName || fetchedReplyingSender?.fullName || fetchedReplyingSender?.lastName || replyingMessage?.sender?.name || replyingMessage?.senderName || replyingMessage?.sender?.displayName || "Unknown"}`
                    : "Forward Message"}
              </span>
            </span>
            <p className="text-[13.5px] text-gray-500/90 dark:text-gray-400 truncate leading-none flex gap-1 items-center pb-0.5">
              {editingMessage || replyingMessage ? null : (
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {forwardingMessage?.senderId === currentUserId ? "You" : forwardingMessage?.sender?.name || "Someone"}
                  :
                </span>
              )}
              {editingMessage
                ? editingMessage.media?.length
                  ? `Photo${editingMessage.text ? `, ${editingMessage.text}` : ""}`
                  : editingMessage.text
                : replyingMessage
                  ? replyingMessage.media?.length || replyingMessage.mediaItems?.length
                    ? `Photo${replyingMessage.text ? `, ${replyingMessage.text}` : ""}`
                    : replyingMessage.text
                  : forwardingMessage?.media?.length
                    ? `Photo${forwardingMessage.text ? `, ${forwardingMessage.text}` : ""}`
                    : forwardingMessage?.text}
            </p>
          </div>
          <button
            onClick={() => {
              if (editingMessage) {
                setEditingMessage(null);
                setDraftMessage("");
              }
              if (replyingMessage) {
                setReplyingMessage(null);
              }
              if (forwardingMessage && onClearForwarding) {
                onClearForwarding();
              }
            }}
            className="absolute right-3 text-gray-400 hover:text-[#2ea6f3] transition-colors p-[8px]"
          >
            <FiX className="text-[#3e3e3e]" strokeWidth={1} style={{ fontSize: "22px" }} />
          </button>
          <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-[#2ea6f3] rounded-[5px]"></div>
        </div>
      )}
      <div
        className={`flex items-center gap-2 max-w-4xl mx-auto ${forwardingMessage || editingMessage || replyingMessage ? "-mt-4 z-40 relative" : ""}`}
      >
        <div
          ref={attachMenuRef}
          className="relative flex-1 h-11 lg:h-12 rounded-full bg-white/95 dark:bg-slate-800/95 shadow-lg border border-white/90 dark:border-slate-700/90"
        >
          <div
            className={`absolute right-0 bottom-14 w-[260px] max-w-[78vw] rounded-2xl bg-[#edf4f1] dark:bg-slate-800 shadow-xl p-2 border border-white/70 dark:border-slate-700 z-50 origin-bottom-right will-change-transform transition-all duration-200 ease-out ${isAttachMenuOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}
            aria-hidden={!isAttachMenuOpen}
          >
            {attachActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    setIsAttachMenuOpen(false);
                    if (action.onClick) action.onClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[14px] leading-none text-gray-900 dark:text-gray-100 hover:bg-white/75 dark:hover:bg-slate-700/80 transition"
                >
                  <ActionIcon className="text-[18px] shrink-0" />
                  <span className="font-semibold tracking-tight">{action.label}</span>
                </button>
              );
            })}
          </div>

          <div
            ref={emojiMenuRef}
            className={`absolute left-0 bottom-14 z-50 origin-bottom-left will-change-transform transition-all duration-200 ease-out ${isEmojiPickerOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}
            aria-hidden={!isEmojiPickerOpen}
          >
            <EmojiPicker
              onEmojiClick={(emojiData) => setDraftMessage((prev) => `${prev}${emojiData.emoji}`)}
              theme={Theme.AUTO}
              width={350}
              height={400}
            />
          </div>

          <button
            onClick={() => {
              setIsEmojiPickerOpen((prev) => !prev);
              setIsAttachMenuOpen(false);
              setIsMoreMenuOpen(false);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            title="Open emoji picker"
          >
            <FiSmile className="text-[20px] lg:text-[22px]" />
          </button>

          <input
            type="text"
            value={draftMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            placeholder="Message"
            className="absolute left-11 right-11 top-1/2 -translate-y-1/2 h-8 bg-transparent text-[14px] lg:text-[15px] text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
          />

          <button
            onClick={() => {
              setIsAttachMenuOpen((prev) => !prev);
              setIsMoreMenuOpen(false);
              setIsEmojiPickerOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            title="Open attachment actions"
          >
            <FiPaperclip className="text-[20px] lg:text-[22px]" />
          </button>
        </div>

        <button
          className="h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-[#2ea6f3] text-white inline-flex items-center justify-center shadow-md hover:bg-[#1f97e5] transition cursor-pointer z-50 relative"
          onClick={
            editingMessage || draftMessage.trim() || forwardingMessage || replyingMessage
              ? handleSendMessage
              : undefined
          }
        >
          {editingMessage || draftMessage.trim() || forwardingMessage || replyingMessage ? (
            <FiSend className="text-[20px] lg:text-[22px]" />
          ) : (
            <FiMic className="text-[20px] lg:text-[22px]" />
          )}
        </button>
      </div>
    </div>
  );
};
