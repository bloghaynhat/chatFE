import { useCallback, useState } from "react";
import { conversationService } from "../../services";
import { ActiveChatPane } from "../chat";
import { ResizableChatPanel } from "./ResizableChatPanel";

export const MainLayout = ({ children }) => {
  const [activeView, setActiveView] = useState("chats"); // 'chats', 'contacts'
  const [darkMode, setDarkMode] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [openingChatId, setOpeningChatId] = useState(null);
  const [chatError, setChatError] = useState("");

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
      if (!chat?.targetUserId) {
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
        // Mock mode for chat pane (API temporarily disabled)
        await wait(350);
        setSelectedConversationId(`mock-conversation-${chat.id}`);
        setMessages(buildMockMessages(chat));

        // API mode (keep for later, do not delete)
        // const conversation = await conversationService.openPrivateConversation(
        //   chat.targetUserId,
        // );
        //
        // const conversationId = resolveConversationId(conversation);
        // if (!conversationId) {
        //   throw new Error("Conversation id missing");
        // }
        //
        // setSelectedConversationId(conversationId);
        //
        // const messageResult =
        //   await conversationService.getConversationMessages(conversationId);
        //
        // setMessages(messageResult.messages || []);
        //
        // // fire-and-forget status sync
        // conversationService.markDelivered(conversationId).catch(() => {});
        // conversationService.markSeen(conversationId).catch(() => {});
      } catch (error) {
        setMessages([]);
        setChatError(error?.message || "Couldn’t open this conversation");
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
              onRetry={retryOpenCurrentChat}
            />
          )}
        </div>
      </div>
    </div>
  );
};
