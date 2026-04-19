import { FiRefreshCw } from "react-icons/fi";
import { PhotoProvider } from "react-photo-view";
import { MessageItem } from "./MessageItem";
import { getDateLabel, groupMediaMessages, getMessageTime } from "../../../utils/chatUtils";

export const MessageList = ({
  isLoading,
  error,
  messages,
  visibleMessages,
  displayCount,
  onRetry,
  currentUserId,
  typingUsers,
  selectedChat,
  firstMessageRef,
  messagesEndRef,
  handleContextMenu,
  setPreviewVideoUrl,
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-4 pb-24 bg-[linear-gradient(120deg,_rgba(245,245,200,0.75)_0%,_rgba(184,220,185,0.78)_45%,_rgba(143,198,169,0.8)_100%)] dark:bg-[linear-gradient(120deg,_rgba(30,41,59,0.9)_0%,_rgba(22,78,99,0.85)_50%,_rgba(30,58,138,0.82)_100%)]">
        <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          Opening conversation...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-4 pb-24 bg-[linear-gradient(120deg,_rgba(245,245,200,0.75)_0%,_rgba(184,220,185,0.78)_45%,_rgba(143,198,169,0.8)_100%)] dark:bg-[linear-gradient(120deg,_rgba(30,41,59,0.9)_0%,_rgba(22,78,99,0.85)_50%,_rgba(30,58,138,0.82)_100%)]">
        <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            Couldn’t open this conversation
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition"
          >
            <FiRefreshCw className="text-sm" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-4 pb-24 bg-[linear-gradient(120deg,_rgba(245,245,200,0.75)_0%,_rgba(184,220,185,0.78)_45%,_rgba(143,198,169,0.8)_100%)] dark:bg-[linear-gradient(120deg,_rgba(30,41,59,0.9)_0%,_rgba(22,78,99,0.85)_50%,_rgba(30,58,138,0.82)_100%)]">
        <div className="h-full flex flex-col items-center justify-center">
          <div className="bg-black/15 dark:bg-black/30 rounded-[20px] p-6 px-8 flex flex-col items-center justify-center text-center max-w-[300px] backdrop-blur-md border border-white/10 shadow-sm">
            <span className="text-white dark:text-white/90 font-semibold text-[15px] mb-1">
              No messages here yet...
            </span>
            <span className="text-white/90 dark:text-white/70 text-[14px] mb-5">
              Send a message or tap the greeting below.
            </span>
            <div className="text-[70px] drop-shadow-md hover:scale-110 transition-transform cursor-pointer">
              👋
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-4 pb-24 bg-[linear-gradient(120deg,_rgba(245,245,200,0.75)_0%,_rgba(184,220,185,0.78)_45%,_rgba(143,198,169,0.8)_100%)] dark:bg-[linear-gradient(120deg,_rgba(30,41,59,0.9)_0%,_rgba(22,78,99,0.85)_50%,_rgba(30,58,138,0.82)_100%)]">
      {visibleMessages.length > 0 && (
        <PhotoProvider maskOpacity={0.8}>
          <div className="flex flex-col gap-3 items-start max-w-4xl mx-auto w-full">
            <div className="mx-auto px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 shadow-sm transition-all duration-300 ease-in-out">
              {displayCount < messages.length ? (
                <div className="flex items-center gap-2">
                  <FiRefreshCw className="animate-spin" />
                  Loading older messages...
                </div>
              ) : (
                getDateLabel(visibleMessages[0]?.createdAt) || "Today"
              )}
            </div>

            {groupMediaMessages(visibleMessages).map((message, index) => {
              const mine = Boolean(
                message?.isMine ||
                  message?.sender?.isMe ||
                  (currentUserId && (
                    message?.senderId === currentUserId ||
                    message?.sender === currentUserId ||
                    message?.sender?.id === currentUserId ||
                    message?.sender?._id === currentUserId ||
                    message?.id_sender === currentUserId
                  )),
              );

              const groupedMessages = groupMediaMessages(visibleMessages);
              
              const prevMessage = index > 0 ? groupedMessages[index - 1] : null;
              const nextMessage = index < groupedMessages.length - 1 ? groupedMessages[index + 1] : null;
              
              const getSenderId = (m) => m?.senderId || m?.sender?.id || m?.id_sender || (m?.isMine ? "me" : null);
              
              const currentSenderId = getSenderId(message);
              const isFirstInSequence = !prevMessage || getSenderId(prevMessage) !== currentSenderId || (getMessageTime(prevMessage) !== getMessageTime(message) && Math.abs(new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) > 300000);
              const isLastInSequence = !nextMessage || getSenderId(nextMessage) !== currentSenderId || (getMessageTime(nextMessage) !== getMessageTime(message) && Math.abs(new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime()) > 300000);

              const isGroup = selectedChat?.type === "group" || selectedChat?.type === "GROUP" || selectedChat?.isGroup === true || (selectedChat?.members && selectedChat.members.length > 2);

              return (
                <MessageItem
                  key={message.id || message._id || index}
                  message={message}
                  messages={visibleMessages}
                  index={index}
                  isFirst={index === 0}
                  firstMessageRef={firstMessageRef}
                  mine={mine}
                  isGroup={isGroup}
                  isFirstInSequence={isFirstInSequence}
                  isLastInSequence={isLastInSequence}
                  handleContextMenu={handleContextMenu}
                  setPreviewVideoUrl={setPreviewVideoUrl}
                />
              );
            })}

            {/* Typing Indicator */}
            {typingUsers.size > 0 &&
              (selectedChat?.targetUserId
                ? typingUsers.has(selectedChat.targetUserId)
                : true) && (
                <div className="w-fit self-start bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1.5 h-4">
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>
        </PhotoProvider>
      )}
    </div>
  );
};
