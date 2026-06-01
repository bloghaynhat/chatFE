import { Message } from "../../../types/conversation";
import { conversationService } from "../../../services/conversationService";
import { socketService } from "../../../services/socketService";
import {
  FiCheckCircle,
  FiCornerUpLeft,
  FiEdit2,
  FiCopy,
  FiMapPin,
  FiCornerUpRight,
  FiRotateCcw,
  FiTrash2,
} from "react-icons/fi";
import {
  getDateLabel,
  getMessageTime,
  getMessageText,
} from "../../../utils/chatUtils";

interface MessageContextMenuProps {
  contextMenu: {
    x: number;
    y: number;
    message: Message;
  };
  messages: Message[];
  currentUserId: string;
  onClose: () => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onPinMessage: (messageId: string) => Promise<void>;
  onUnpinMessage: (messageId: string) => Promise<void>;
  onOpenForwardModal: (message: Message) => void;
  onTranslateMessage?: (message: Message) => void;
  onRevokeMessage?: (message: Message) => void;
  onDeleteMessageForMe?: (message: Message) => void;
  onDeleteMessageForEveryone?: (message: Message) => void;
}

export const MessageContextMenu = ({
  contextMenu,
  messages,
  currentUserId,
  onClose,
  onReply,
  onEdit,
  onPinMessage,
  onUnpinMessage,
  onOpenForwardModal,
  onTranslateMessage,
  onRevokeMessage,
  onDeleteMessageForMe,
  onDeleteMessageForEveryone,
}: MessageContextMenuProps) => {
  const isMyMessage =
    contextMenu.message.senderId === currentUserId ||
    contextMenu.message.sender?.id === currentUserId ||
    contextMenu.message.id_sender === currentUserId;

  const msgId = contextMenu.message.id || contextMenu.message._id;
  const message = messages.find((m) => (m.id || m._id) === msgId);
  const isPinned = !!message?.pinnedAt;

  const handlePinToggle = async () => {
    if (!msgId) return;
    try {
      if (isPinned) {
        await onUnpinMessage(msgId);
      } else {
        await onPinMessage(msgId);
      }
      onClose();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!msgId) return;
    try {
      const hasMyReaction = contextMenu.message?.reactions
        ?.find((r) => r.emoji === emoji)
        ?.users?.some((u) => String(u._id || u.id) === String(currentUserId));

      if (hasMyReaction) {
        await socketService.removeReaction(msgId, emoji);
      } else {
        await socketService.addReaction(msgId, emoji);
      }
      onClose();
    } catch (error) {
      console.error("Failed to react:", error);
    }
  };

  const handleCopy = async () => {
    const textToCopy = getMessageText(contextMenu.message);
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
    onClose();
  };

  return (
    <div
      className="fixed z-[9999] flex flex-col gap-2"
      style={{ top: Math.max(contextMenu.y - 50, 10), left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Reaction Picker above menu */}
      <div className="bg-white dark:bg-slate-800 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center px-1.5 py-1 gap-0.5 border border-gray-100 dark:border-slate-700 w-max">
        {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => {
          const hasMyReaction = contextMenu.message?.reactions
            ?.find((r: any) => r.emoji === emoji)
            ?.users?.some(
              (u: any) => String(u._id || u.id) === String(currentUserId),
            );

          return (
            <div
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full w-9 h-9 flex items-center justify-center text-[22px] transition-transform hover:scale-125 origin-bottom ${hasMyReaction ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
            >
              {emoji}
            </div>
          );
        })}
      </div>

      <div className="w-[200px] bg-white dark:bg-slate-800 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] py-1.5 flex flex-col text-[#0f1419] dark:text-gray-100 border border-gray-100/50 dark:border-slate-700/50 text-[15px]">
        {isMyMessage && (
          <div className="px-3.5 py-1.5 mb-1 flex items-center gap-2 text-[13px] text-gray-500 font-medium">
            <div className="flex -space-x-[4px] text-blue-500">
              <FiCheckCircle className="text-sm" />
              <FiCheckCircle className="text-sm" />
            </div>
            <span>
              {getDateLabel(
                contextMenu.message?.createdAt ||
                contextMenu.message?.updatedAt,
              )}{" "}
              at {getMessageTime(contextMenu.message)}
            </span>
          </div>
        )}

        {onTranslateMessage && (
          <button
            className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
            onClick={() => {
              onTranslateMessage(contextMenu.message);
              onClose();
            }}
          >
            <div className="w-4 flex justify-center text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-languages"
              >
                <path d="m5 8 6 6" />
                <path d="m4 14 6-6 2-3" />
                <path d="M2 5h12" />
                <path d="M7 2h1" />
                <path d="m22 22-5-10-5 10" />
                <path d="M14 18h6" />
              </svg>
            </div>
            Dịch tin nhắn
          </button>
        )}

        <button
          className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
          onClick={() => {
            onReply(contextMenu.message);
            onClose();
          }}
        >
          <FiCornerUpLeft className="text-[18px]" strokeWidth={2} />{" "}
          <span className="font-medium">Reply</span>
        </button>
        {isMyMessage && (
          <button
            className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
            onClick={() => {
              onEdit(contextMenu.message);
              onClose();
            }}
          >
            <FiEdit2 className="text-[18px]" strokeWidth={2} />{" "}
            <span className="font-medium">Edit</span>
          </button>
        )}
        <button
          className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
          onClick={handleCopy}
        >
          <FiCopy className="text-[18px]" strokeWidth={2} />{" "}
          <span className="font-medium">Copy</span>
        </button>
        <button
          className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
          onClick={handlePinToggle}
        >
          <FiMapPin className="text-[18px]" strokeWidth={2} />
          <span className="font-medium">{isPinned ? "Unpin" : "Pin"}</span>
        </button>
        <button
          className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
          onClick={() => {
            onOpenForwardModal(contextMenu.message);
            onClose();
          }}
        >
          <FiCornerUpRight className="text-[18px]" strokeWidth={2} />{" "}
          <span className="font-medium">Forward</span>
        </button>
        <button
          className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
          onClick={onClose}
        >
          <FiCheckCircle className="text-[18px]" strokeWidth={2} />{" "}
          <span className="font-medium">Select</span>
        </button>

        {isMyMessage && (
          <button
            className="w-full text-left px-4 py-[9px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[#ff4b4b] flex items-center gap-3.5 transition-colors"
            onClick={() => {
              if (onRevokeMessage) {
                onRevokeMessage(contextMenu.message);
              }
              onClose();
            }}
          >
            <FiRotateCcw className="text-[18px]" strokeWidth={2} />{" "}
            <span className="font-medium">Recall</span>
          </button>
        )}
        {/* 
        {isMyMessage && (
          <button
            className="w-full text-left px-4 py-[9px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[#ff4b4b] flex items-center gap-3.5 transition-colors"
            onClick={() => {
              if (onDeleteMessageForEveryone) {
                onDeleteMessageForEveryone(contextMenu.message);
              }
              onClose();
            }}
          >
            <FiTrash2 className="text-[18px]" strokeWidth={2} />{" "}
            <span className="font-medium">Delete for everyone</span>
          </button>
        )} */}

        <button
          className="w-full text-left px-4 py-[9px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[#ff4b4b] flex items-center gap-3.5 transition-colors"
          onClick={() => {
            if (onDeleteMessageForMe) {
              onDeleteMessageForMe(contextMenu.message);
            }
            onClose();
          }}
        >
          <FiTrash2 className="text-[18px]" strokeWidth={2} />{" "}
          <span className="font-medium">Delete for me only</span>
        </button>
      </div>
    </div>
  );
};
