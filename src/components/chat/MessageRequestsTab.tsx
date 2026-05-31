import React, { useState } from "react";
import { FiCheck, FiInbox, FiTrash2, FiUserX } from "react-icons/fi";
import type { Conversation } from "../../types/conversation";

interface MessageRequestsTabProps {
  requests: Conversation[];
  isCollapsed?: boolean;
  isLoading?: boolean;
  activeChatId?: string | null;
  openingChatId?: string | null;
  onSelectChat: (chat: Conversation) => void;
  onAccept: (conversationId: string) => Promise<void>;
  onReject: (conversationId: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export const MessageRequestsTab: React.FC<MessageRequestsTabProps> = ({
  requests,
  isCollapsed,
  isLoading,
  activeChatId,
  openingChatId,
  onSelectChat,
  onAccept,
  onReject,
  onClearAll,
}) => {
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const runAction = async (
    event: React.MouseEvent,
    conversationId: string,
    action: (conversationId: string) => Promise<void>,
  ) => {
    event.stopPropagation();
    setPendingActionId(conversationId);
    try {
      await action(conversationId);
    } finally {
      setPendingActionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
          <FiInbox className="text-4xl text-slate-400" />
        </div>
        {!isCollapsed && (
          <>
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Bạn không có tin nhắn chờ nào.
            </p>
            <p className="text-sm text-slate-400 mt-1">Thật yên tĩnh!</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="px-2 py-2 space-y-1">
      {!isCollapsed && (
        <div className="px-2 pb-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tin nhắn chờ
            </p>
            <p className="text-xs text-slate-400">
              Xem trước trước khi phản hồi.
            </p>
          </div>
          <button
            onClick={async () => {
              setIsClearingAll(true);
              try {
                await onClearAll();
              } finally {
                setIsClearingAll(false);
              }
            }}
            disabled={isClearingAll}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-60"
            title="Xóa tất cả"
          >
            <FiTrash2 />
            Xóa tất cả
          </button>
        </div>
      )}

      {requests.map((chat) => {
        const conversationId = chat.id || (chat as any).conversationId;
        const isActive =
          activeChatId === conversationId || openingChatId === conversationId;
        const isPending = pendingActionId === conversationId;

        return (
          <div
            key={conversationId}
            onClick={() => onSelectChat(chat)}
            className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
              isActive
                ? "bg-amber-500 text-white shadow-md"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
            } ${isPending ? "opacity-60 scale-[0.99]" : ""}`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-100 text-amber-700 flex items-center justify-center font-semibold shrink-0">
              {chat.avatarUrl ? (
                <img
                  src={chat.avatarUrl}
                  alt={chat.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                chat.name?.charAt(0).toUpperCase() || "?"
              )}
            </div>

            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isActive ? "text-white" : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {chat.name || "Người lạ"}
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                      }`}
                    >
                      Chờ
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate mt-0.5 ${
                      isActive ? "text-white/85" : "text-slate-500"
                    }`}
                  >
                    {chat.lastMessage?.textPreview ||
                      (chat.lastMessage?.type === "media"
                        ? "Đã gửi media"
                        : "Tin nhắn mới từ người lạ")}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(event) =>
                      runAction(event, conversationId, onAccept)
                    }
                    disabled={isPending}
                    className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-60"
                    title="Chấp nhận"
                  >
                    <FiCheck />
                  </button>
                  <button
                    onClick={(event) =>
                      runAction(event, conversationId, onReject)
                    }
                    disabled={isPending}
                    className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 disabled:opacity-60"
                    title="Từ chối"
                  >
                    <FiUserX />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
