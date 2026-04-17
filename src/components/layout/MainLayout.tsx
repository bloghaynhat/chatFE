import { useCallback, useState, useEffect } from "react";
import { conversationService, mediaService } from "../../services";
import { socketService } from "../../services/socketService";
import { ActiveChatPane } from "../chat";
import { ResizableChatPanel } from "./ResizableChatPanel";
import { useAuth } from "../../hooks";

const MainLayout = ({ children }: { children?: any }) => {
  const [activeView, setActiveView] = useState("chats"); // 'chats', 'contacts'
  const [darkMode, setDarkMode] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [openingChatId, setOpeningChatId] = useState(null);
  const [chatError, setChatError] = useState("");
  const [forwardingMessage, setForwardingMessage] = useState(null); // Added state
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
            let msgConvId = message.conversationId || payload?.conversationId;
            if (msgConvId && typeof msgConvId === "object") {
              msgConvId = msgConvId._id || msgConvId.id;
            }
            if (String(msgConvId) === String(selectedConversationId)) {
              return [...prev, message];
            }
            return prev;
          });
        });

        socketService.onMessageEdited((payload) => {
          const editedMsg = payload?.message || payload;
          if (!editedMsg || (!editedMsg._id && !editedMsg.id)) return;

          setMessages((prev) =>
            prev.map((m) =>
              String(m._id || m.id) === String(editedMsg._id || editedMsg.id)
                ? { ...m, ...editedMsg, isEdited: true }
                : m,
            ),
          );
        });

        socketService.onMessageRevoked((payload) => {
          console.log("Socket message revoked payload:", payload);
          const revokedId =
            payload?.messageId ||
            payload?.message?._id ||
            payload?.message?.id ||
            payload?.id ||
            payload?._id;
          if (!revokedId) return;

          setMessages((prev) =>
            prev.map((m) =>
              String(m._id || m.id) === String(revokedId)
                ? {
                    ...m,
                    isRevoked: true,
                    deletedAt: payload.deletedAt || new Date().toISOString(),
                  }
                : m,
            ),
          );
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
      socketService.offMessageRevoked();
      socketService.offMessageEdited();
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

        // Sort messages by createdAt in ascending order (oldest first)
        const sortedMessages = (messageResult.messages || []).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
          return dateA - dateB;
        });

        setMessages(sortedMessages);

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

  const handleForwardToTarget = useCallback(
    (targetChat, msg) => {
      // Navigate to user's chat
      openChatByRow(targetChat);
      // Set the forwarding message
      setForwardingMessage(msg);
    },
    [openChatByRow],
  );

  const clearForwardingMessage = useCallback(() => {
    setForwardingMessage(null);
  }, []);

  const handleSendMessage = async (payloadOrText, mediaFiles = []) => {
    let conversationId = selectedConversationId || selectedChat?.id;

    if (!conversationId) return;

    let payloadText = "";
    let payloadMedia = [];

    if (typeof payloadOrText === "object" && payloadOrText !== null) {
      if (payloadOrText.type === "edit") {
        try {
          // Optimistically update UI
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payloadOrText.id || msg._id === payloadOrText.id
                ? {
                    ...msg,
                    text: payloadOrText.text,
                    content: payloadOrText.text,
                    isEdited: true,
                  }
                : msg,
            ),
          );

          await conversationService.editMessage(payloadOrText.id, {
            text: payloadOrText.text,
          });
        } catch (error) {
          console.error("Failed to edit message", error);
          // Ideally revert UI state here, but logging is minimum.
        }
        return;
      }

      if (payloadOrText instanceof File || Array.isArray(payloadOrText)) {
        payloadText = "";
        payloadMedia = Array.isArray(payloadOrText)
          ? payloadOrText
          : [payloadOrText];
      } else {
        payloadText = payloadOrText.text || "";
        payloadMedia = payloadOrText.media || [];
      }
    } else {
      payloadText = payloadOrText || "";
      payloadMedia = mediaFiles || [];
    }

    if (
      !payloadText.trim() &&
      payloadMedia.length === 0 &&
      !payloadOrText?.forwardingMessage
    )
      return;

    const fwMsg = payloadOrText?.forwardingMessage;

    const performSend = async (txt, medias, isForward = false) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const optimisticMessage = {
        id: tempId,
        text: txt,
        media: medias,
        createdAt: new Date().toISOString(),
        isMine: true,
        senderId: "me",
        status: "sending",
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        let finalMedia = [];
        const filesToUpload = medias.filter((f) => !f.url);
        const existingMedia = medias.filter((f) => f.url);

        if (filesToUpload.length > 0) {
          const uploadedMedia = await Promise.all(
            filesToUpload.map(async (file) => {
              // 1. Lấy Pre-signed URL
              const reqResponse: any = await mediaService.requestUploadUrl(
                file.name,
                file.type,
                file.size,
              );
              // Phụ thuộc vào dữ liệu trả về từ backend, fix triệt để các format có thể trả về:
              const uploadUrl =
                reqResponse?.uploadUrl ||
                reqResponse?.presignedUrl ||
                reqResponse?.url ||
                reqResponse?.signedUrl ||
                reqResponse?.data?.uploadUrl ||
                reqResponse?.data?.url ||
                reqResponse?.data?.presignedUrl;
              const fileId =
                reqResponse?.fileId ||
                reqResponse?.id ||
                reqResponse?.data?.fileId ||
                reqResponse?.data?.id;

              if (!uploadUrl) {
                console.error("Missing uploadUrl in response:", reqResponse);
                throw new Error(
                  "Không lấy được pre-signed upload URL từ server",
                );
              }

              // 2. Upload file trực tiếp lên S3 qua Pre-signed URL
              await mediaService.uploadToPresignedUrl(uploadUrl, file);

              // URL upload file cần gọi confirm: bỏ phần query
              const uploadedUrlClean = uploadUrl.split("?")[0];

              // 3. Confirm quá trình upload với backend
              const confirmResponse: any = await mediaService.confirmUpload(
                fileId,
                uploadedUrlClean,
              );

              // Lấy URL cuối cùng từ confirm hoặc cắt URL upload bỏ đi phần query
              const finalUrl =
                confirmResponse?.url ||
                confirmResponse?.fileUrl ||
                confirmResponse?.data?.url ||
                uploadedUrlClean;

              return {
                fileId:
                  confirmResponse?.fileId || confirmResponse?._id || fileId,
                type: file.type?.startsWith("image/")
                  ? "IMAGE"
                  : file.type?.startsWith("video/")
                    ? "VIDEO"
                    : file.type?.startsWith("audio/")
                      ? "AUDIO"
                      : "DOCUMENT",
                url: finalUrl,
                thumbnailUrl: finalUrl,
                filename: file.name || "unknown",
                size: file.size || 0,
                mimetype: file.type,
              };
            }),
          );
          finalMedia = [...existingMedia, ...uploadedMedia];
        } else if (existingMedia.length > 0) {
          finalMedia = existingMedia;
        }

        const sentMessage: any = await socketService.sendMessage(
          conversationId,
          txt,
          finalMedia,
        );

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...sentMessage, id: sentMessage._id || sentMessage.id }
              : msg,
          ),
        );
      } catch (error) {
        console.error("Failed to send message via socket", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" } : msg,
          ),
        );
      }
    };

    // Nếu gửi forward kèm message trước khi gửi thì gửi message trước rồi forward sau
    if (payloadText.trim() || payloadMedia.length > 0) {
      await performSend(payloadText, payloadMedia, false);
    }

    if (fwMsg) {
      try {
        const msgId = fwMsg.id || fwMsg._id;
        if (msgId) {
          const res = await conversationService.forwardMessages({
            messageIds: [msgId],
            targetConversationIds: [conversationId],
          });

          // Normalize res to an array of messages
          let newMessages = [];
          if (Array.isArray(res)) {
            newMessages = res;
          } else if (res && typeof res === "object") {
            if (Array.isArray(res.data)) {
              newMessages = res.data;
            } else if (res.data) {
              newMessages = [res.data];
            } else if (res._id || res.id) {
              newMessages = [res];
            }
          }

          if (newMessages.length > 0) {
            setMessages((prev) => {
              const newMsgs = [...prev];
              newMessages.forEach((newMsg) => {
                if (
                  !newMsgs.some(
                    (m) =>
                      String(m._id || m.id) === String(newMsg._id || newMsg.id),
                  )
                ) {
                  newMsgs.push(newMsg);
                }
              });
              return newMsgs;
            });
          }
        }
      } catch (error) {
        console.error("Failed to forward message via API", error);
      }
    }
  };
  const handleRevokeMessage = async (message) => {
    try {
      const messageId = message?.id || message?._id;
      if (!messageId) return;

      const res: any = await socketService.revokeMessage(messageId);

      if (res && res.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId || msg._id === messageId
              ? { ...msg, isRevoked: true, deletedAt: new Date().toISOString() }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to revoke message:", error);
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
              onForwardToTarget={handleForwardToTarget}
              forwardingMessage={forwardingMessage}
              onClearForwarding={clearForwardingMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export { MainLayout };
