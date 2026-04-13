import { useCallback, useState, useEffect } from "react";
import { conversationService } from "../../services";
import { socketService } from "../../services/socketService";
import { ActiveChatPane } from "../chat";
import { ResizableChatPanel } from "./ResizableChatPanel";
import { useAuth } from "../../hooks";

export const MainLayout = ({ children }) => {
  const [activeView, setActiveView] = useState("chats"); // 'chats', 'contacts'
  const [darkMode, setDarkMode] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [openingChatId, setOpeningChatId] = useState(null);
  const [chatError, setChatError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    let active = true;

    let unsubs = {};
    socketService.connect().then((socket) => {
      if (!active) return;
      if (socket) {
        unsubs.unsubNewMessage = socketService.onNewMessage((payload) => {
          const message = payload?.message || payload;

          setMessages((prev) => {
            if (!message || (!message._id && !message.id)) return prev;
            // Prevent duplicate messages
            const msgId = message._id || message.id;
            if (prev.some((m) => String(m._id || m.id) === String(msgId))) return prev;

            // Only add if it belongs to currently open conversation
            const msgConvId = message.conversationId || payload?.conversationId;
            const msgIdForLog = message._id || message.id;
            if (String(msgConvId) === String(selectedConversationId)) {
              conversationService.markSeen(msgConvId, msgIdForLog);
              return [...prev, { ...message, status: "SENT" }];
            } else {
              conversationService.markDelivered(msgConvId, msgIdForLog);
            }
            return prev;
          });
        });

        unsubs.unsubMessageStatus = socketService.onMessageStatusUpdate((payload) => {
          if (payload.lastSeenMessageId) {
            setMessages((prev) => {
              const seenIndex = prev.findIndex((m) => (m._id || m.id) === payload.lastSeenMessageId);
              if (seenIndex === -1) return prev;
              const newMessages = [...prev];
              for (let i = 0; i <= seenIndex; i++) {
                if (newMessages[i].senderId === user?.id || newMessages[i].userId === user?.id) {
                  newMessages[i] = { ...newMessages[i], status: "SEEN" };
                }
              }
              return newMessages;
            });
          }
        });

        unsubs.unsubMessageDelivered = socketService.onMessageDelivered((payload) => {
          if (payload.lastDeliveredMessageId) {
            setMessages((prev) => {
              const delivIndex = prev.findIndex((m) => (m._id || m.id) === payload.lastDeliveredMessageId);
              if (delivIndex === -1) return prev;
              const newMessages = [...prev];
              for (let i = 0; i <= delivIndex; i++) {
                if (
                  (newMessages[i].senderId === user?.id || newMessages[i].userId === user?.id) &&
                  newMessages[i].status !== "SEEN"
                ) {
                  newMessages[i] = { ...newMessages[i], status: "DELIVERED" };
                }
              }
              return newMessages;
            });
          }
        });

        unsubs.unsubTypingStart = socketService.onTypingStart((payload) => {
          if (payload?.userId) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.add(payload.userId);
              return newSet;
            });
          }
        });

        unsubs.unsubTypingStop = socketService.onTypingStop((payload) => {
          if (payload?.userId) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(payload.userId);
              return newSet;
            });
          }
        });
      }
    });

    return () => {
      active = false;
      Object.values(unsubs).forEach((unsub) => unsub && unsub());
      // Do not disconnect the socket here to preserve global connectivity
    };
  }, [selectedConversationId]);

  useEffect(() => {
    setTypingUsers(new Set());
    if (selectedConversationId) {
      socketService.joinRoom(selectedConversationId);
    }
    return () => {
      if (selectedConversationId) {
        socketService.leaveRoom(selectedConversationId);
      }
    };
  }, [selectedConversationId]);

  // Mark messages as delivered when chat is opened
  useEffect(() => {
    if (!selectedConversationId) return;

    const markMessagesAsDelivered = async () => {
      try {
        // Get conversation detail to get lastMessage.messageId from backend
        const detail = await conversationService.getConversationDetail(selectedConversationId);
        const lastMessageId = detail?.conversation?.lastMessage?.messageId;

        if (lastMessageId) {
          await conversationService.markDelivered(selectedConversationId, lastMessageId);
        }
      } catch (error) {
        console.error("[MainLayout] Error marking as delivered:", error);
      }
    };

    markMessagesAsDelivered();
  }, [selectedConversationId]);

  // Mark messages as seen when chat is opened
  useEffect(() => {
    if (!selectedConversationId) return;

    const markMessagesAsSeen = async () => {
      try {
        // Wait a bit for messages to render
        await new Promise((resolve) => setTimeout(resolve, 500));

        const detail = await conversationService.getConversationDetail(selectedConversationId);
        const lastMessageId = detail?.conversation?.lastMessage?.messageId;

        if (lastMessageId) {
          await conversationService.markSeen(selectedConversationId, lastMessageId);
        }
      } catch (error) {
        // Silently fail for seen marking (temporary, will fix backend later)
      }
    };

    markMessagesAsSeen();
  }, [selectedConversationId]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const resolveConversationId = (conversationPayload) => {
    return (
      conversationPayload?.conversationId ||
      conversationPayload?.id ||
      conversationPayload?._id ||
      conversationPayload?.conversation?.id ||
      conversationPayload?.conversation?._id ||
      null
    );
  };

  const openChatByRow = useCallback(
    async (chat) => {
      if (!chat?.id) {
        setChatError("Couldn’t open this conversation");
        return;
      }

      if (isOpeningConversation && openingChatId === chat.id) {
        return;
      }

      setSelectedChat(chat);
      setChatError("");
      setIsOpeningConversation(true);
      setOpeningChatId(chat.id);

      try {
        // Nếu chat.id có dạng temp- (click từ global search), cần tìm conversation thật trước
        let conversationId = chat.id;

        if (String(conversationId).startsWith("temp-") && chat.targetUserId) {
          const conversation = await conversationService.createPrivateConversation(chat.targetUserId);
          conversationId = resolveConversationId(conversation);
        }

        if (!conversationId) {
          setChatError("Conversation not found.");
          setIsOpeningConversation(false);
          setOpeningChatId(null);
          return;
        }

        setSelectedConversationId(conversationId);

        const messageResult = await conversationService.getConversationMessages(conversationId);

        // Sort messages by createdAt in ascending order (oldest first)
        const sortedMessages = (messageResult.messages || []).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
          return dateA - dateB;
        });

        // Ensure all messages have status field (default to SENT)
        const messagesWithStatus = sortedMessages.map((msg) => ({
          ...msg,
          status: msg.status || "SENT",
        }));

        setMessages(messagesWithStatus);
      } catch (error) {
        setMessages([]);
        if (
          error?.status === 404 ||
          error?.response?.status === 404 ||
          error?.code === "NOT_FOUND" ||
          error?.payload?.statusCode === 404 ||
          error?.code === "VALIDATION_ERROR" ||
          error?.payload?.statusCode === 400
        ) {
          setChatError("");
        } else {
          setChatError(error?.message || "Couldn’t open this conversation");
        }
      } finally {
        setIsOpeningConversation(false);
        setOpeningChatId(null);
      }
    },
    [isOpeningConversation, openingChatId],
  );

  const retryOpenCurrentChat = useCallback(() => {
    if (!selectedChat) return;
    openChatByRow(selectedChat);
  }, [openChatByRow, selectedChat]);

  const handleSendMessage = async (payload) => {
    let conversationId = selectedConversationId || selectedChat?.id;

    if (!conversationId) return;

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      ...payload,
      createdAt: new Date().toISOString(),
      isMine: true,
      senderId: "me", // Normally this would be the current user's ID
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Gọi socketService.sendMessage thay vì conversationService REST
      const sentMessage = await socketService.sendMessage(conversationId, payload.text || "", payload.media || []);

      // Replace optimistic message with actual server message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...(sentMessage || msg), id: sentMessage?._id || sentMessage?.id || tempId, status: "sent" }
            : msg,
        ),
      );

      // Emit event to notify ChatList to refetch conversations
      window.dispatchEvent(new CustomEvent("messageAdded", { detail: { conversationId } }));
    } catch (error) {
      console.error("Failed to send message via socket", error);
      // Update status to failed
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, status: "failed" } : msg)));
    }
  };

  const handleRevokeMessage = async (messageId) => {
    try {
      await conversationService.revokeMessage(messageId);
      // Optimistically remove or mark message as revoked
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isRevoked: true, content: "Message revoked" } : msg)),
      );
    } catch (error) {
      console.error("Failed to revoke message", error);
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-white dark:bg-slate-900">
        {/* Resizable Left Panel - Chat List */}
        <ResizableChatPanel
          activeView={activeView}
          onViewChange={setActiveView}
          activeChatId={selectedChat?.id || null}
          openingChatId={openingChatId}
          onSelectChat={openChatByRow}
        />

        {/* Right Panel - Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-slate-950">
          {children || (
            <ActiveChatPane
              selectedChat={selectedChat}
              selectedConversationId={selectedConversationId}
              isLoading={isOpeningConversation}
              error={chatError}
              messages={messages}
              typingUsers={typingUsers}
              currentUserId={user?.id || user?._id}
              onRetry={retryOpenCurrentChat}
              onSendMessage={handleSendMessage}
              onRevokeMessage={handleRevokeMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
};
