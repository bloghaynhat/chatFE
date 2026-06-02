import { useLayoutEffect, useRef, useState } from "react";
import { Message } from "../../../types/conversation";
import { createPortal } from "react-dom";
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
import { useLanguage } from "../../../context";

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
  const { t } = useLanguage();
  const isMyMessage =
    contextMenu.message.senderId === currentUserId ||
    contextMenu.message.sender?.id === currentUserId ||
    contextMenu.message.id_sender === currentUserId;

  const msgId = contextMenu.message.id || contextMenu.message._id;
  const message = messages.find((m) => (m.id || m._id) === msgId);
  const isPinned = !!message?.pinnedAt;
  const viewportPadding = 8;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({
    left: Math.max(contextMenu.x, viewportPadding),
    top: Math.max(contextMenu.y, viewportPadding),
    maxHeight: window.innerHeight - viewportPadding * 2,
    opacity: 0,
  });

  useLayoutEffect(() => {
    const menuElement = menuRef.current;
    if (!menuElement) return;

    const rect = menuElement.getBoundingClientRect();
    const inputTop =
      document
        .querySelector<HTMLElement>("[data-chat-input-root]")
        ?.getBoundingClientRect().top ?? window.innerHeight;
    const usableBottom = Math.min(window.innerHeight, inputTop) - viewportPadding;
    const availableHeight = Math.max(220, usableBottom - viewportPadding);

    let left = contextMenu.x;
    if (left + rect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - rect.width - viewportPadding;
    }
    left = Math.max(viewportPadding, left);

    let top = contextMenu.y;
    if (top + rect.height > usableBottom) {
      top = contextMenu.y - rect.height - 8;
    }
    if (top < viewportPadding) {
      top = Math.max(
        viewportPadding,
        Math.min(contextMenu.y, usableBottom - Math.min(rect.height, availableHeight)),
      );
    }

    setMenuPosition({
      left,
      top,
      maxHeight: availableHeight,
      opacity: 1,
    });
  }, [contextMenu.x, contextMenu.y, isMyMessage, onTranslateMessage]);

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

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-[9999] flex w-[252px] flex-col items-start gap-2"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        maxHeight: menuPosition.maxHeight,
        opacity: menuPosition.opacity,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes reactionBarIn {
          from { opacity: 0; transform: translateY(8px) scale(0.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes reactionEmojiPop {
          0% { opacity: 0; transform: translateY(8px) scale(0.45); }
          70% { opacity: 1; transform: translateY(-2px) scale(1.12); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {/* Reaction Picker above menu */}
      <div
        className="flex w-max flex-row items-center gap-0.5 rounded-full border border-white/80 bg-white/95 px-1.5 py-1 shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-800/95 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        style={{ animation: "reactionBarIn 160ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
      >
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
              className={`cursor-pointer rounded-full w-9 h-9 flex items-center justify-center text-[22px] transition-all duration-150 hover:-translate-y-1.5 hover:scale-125 active:scale-95 origin-bottom animate-[reactionEmojiPop_240ms_cubic-bezier(0.16,1,0.3,1)_both] ${hasMyReaction ? "bg-blue-100 shadow-inner ring-1 ring-blue-200 dark:bg-blue-900/40 dark:ring-blue-700/60" : "hover:bg-gray-100 dark:hover:bg-slate-700"}`}
            >
              {emoji}
            </div>
          );
        })}
      </div>

      <div className="w-[200px] max-h-[calc(100vh-120px)] overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] py-1.5 flex flex-col text-[#0f1419] dark:text-gray-100 border border-gray-100/50 dark:border-slate-700/50 text-[15px]">
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
          <span className="font-medium">{t("chat.reply")}</span>
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
            <span className="font-medium">{t("app.edit")}</span>
          </button>
        )}
        <button
          className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
          onClick={handleCopy}
        >
          <FiCopy className="text-[18px]" strokeWidth={2} />{" "}
          <span className="font-medium">{t("chat.copy")}</span>
        </button>
        <button
          className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
          onClick={handlePinToggle}
        >
          <FiMapPin className="text-[18px]" strokeWidth={2} />
          <span className="font-medium">{isPinned ? t("chat.unpin") : t("chat.pin")}</span>
        </button>
        <button
          className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
          onClick={() => {
            onOpenForwardModal(contextMenu.message);
            onClose();
          }}
        >
          <FiCornerUpRight className="text-[18px]" strokeWidth={2} />{" "}
          <span className="font-medium">{t("chat.forward")}</span>
        </button>
        <button
          className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
          onClick={onClose}
        >
          <FiCheckCircle className="text-[18px]" strokeWidth={2} />{" "}
          <span className="font-medium">{t("chat.select")}</span>
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
            <span className="font-medium">{t("chat.recall")}</span>
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
          <span className="font-medium">{t("chat.deleteForMe")}</span>
        </button>
      </div>
    </div>
  );

  return createPortal(menu, document.body);
};
