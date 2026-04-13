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

    // Initialize global socket
    socketService.connect().then((socket) => {
      if (!active) return;
      if (socket) {
        socketService.onNewMessage((payload) => {
          // Payload từ receiveMessage: { message: {...}, conversationId: "..." }
          const message = payload?.message || payload;

          setMessages((prev) => {
            if (!message || (!message._id && !message.id)) return prev;
            // Prevent duplicate messages
            const msgId = message._id || message.id;
            if (prev.some((m) => String(m._id || m.id) === String(msgId)))
              return prev;

            // Only add if it belongs to currently open conversation
            const msgConvId = message.conversationId || payload?.conversationId;
            if (String(msgConvId) === String(selectedConversationId)) {
              return [...prev, message];
            }
            return prev;
          });
        });

        socketService.onMessageStatusUpdate((payload) => {
          // payload might contain { messageId, status }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.messageId ? { ...m, status: payload.status } : m,
            ),
          );
        });

        socketService.onTypingStart((payload) => {
          if (payload?.userId) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.add(payload.userId);
              return newSet;
            });
          }
        });

        socketService.onTypingStop((payload) => {
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
      socketService.offNewMessage();
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

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const buildMockMessages = (chat) => {
    const base = new Date("2026-02-08T07:30:00").getTime();
    return [
      {
        id: `${chat.id}-1`,
        type: "text",
        text: "Đã đủ",
        createdAt: new Date(base + 1000 * 60 * 14).toISOString(),
        isMine: false,
      },
      {
        id: `${chat.id}-2`,
        type: "image",
        text: "TẠI HẠ BÁI PHỤC",
        imageUrl: "https://picsum.photos/420/280?random=12",
        imageAlt: "Mock meme",
        createdAt: new Date(base + 1000 * 60 * 15).toISOString(),
        isMine: false,
      },
      {
        id: `${chat.id}-3`,
        type: "text",
        text: "Tin nhắn mock để preview khung chat giống ảnh tham chiếu.",
        createdAt: new Date(base + 1000 * 60 * 35).toISOString(),
        isMine: true,
      },
    ];
  };

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
          const conversation =
            await conversationService.createPrivateConversation(
              chat.targetUserId,
            );
          conversationId = resolveConversationId(conversation);
        }

        if (!conversationId) {
          setChatError("Conversation not found.");
          setIsOpeningConversation(false);
          setOpeningChatId(null);
          return;
        }

        setSelectedConversationId(conversationId);

        const messageResult =
          await conversationService.getConversationMessages(conversationId);
        setMessages(messageResult.messages || []);

        // fire-and-forget status sync
        conversationService.markDelivered(conversationId).catch(() => {});
        conversationService.markSeen(conversationId).catch(() => {});
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
      const sentMessage = await socketService.sendMessage(
        conversationId,
        payload.text || "",
        payload.media || [],
      );

      // Replace optimistic message with actual server message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...sentMessage, id: sentMessage._id || sentMessage.id }
            : msg,
        ),
      );
    } catch (error) {
      console.error("Failed to send message via socket", error);
      // Update status to failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: "failed" } : msg,
        ),
      );
    }
  };

  const handleRevokeMessage = async (messageId) => {
    try {
      await conversationService.revokeMessage(messageId);
      // Optimistically remove or mark message as revoked
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isRevoked: true, content: "Message revoked" }
            : msg,
        ),
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
