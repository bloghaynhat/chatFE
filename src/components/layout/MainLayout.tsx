import { useCallback, useState, useEffect, useRef } from "react";
import { conversationService, mediaService } from "../../services";
import { socketService } from "../../services/socketService";
import { ActiveChatPane } from "../chat";
import { RightSidebar } from "../chat/RightSidebar";
import { ResizableChatPanel } from "./ResizableChatPanel";
import { useAuth } from "../../hooks";

const MainLayout = ({ children }: { children?: any }) => {
  const [activeView, setActiveView] = useState("chats"); // 'chats', 'contacts'
  const [darkMode, setDarkMode] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const selectedChatRef = useRef(null);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [openingChatId, setOpeningChatId] = useState(null);
  const [chatError, setChatError] = useState("");
  const [forwardingMessage, setForwardingMessage] = useState(null); // Added state
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
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

          setTypingUsers((prev) => {
            const sender =
              message?.senderId ||
              message?.sender?.id ||
              message?.sender?._id ||
              message?.id_sender ||
              (typeof message?.sender === "string" ? message.sender : null);
            if (sender && prev.has(sender)) {
              const ns = new Set(prev);
              ns.delete(sender);
              return ns;
            }
            return prev;
          });

          setMessages((prev) => {
            if (!message || (!message._id && !message.id)) return prev;
            // Prevent duplicate messages
            const msgId = message._id || message.id;
            if (prev.some((m) => String(m._id || m.id) === String(msgId))) return prev;

            // Only add if it belongs to currently open conversation
            let msgConvId = message.conversationId || payload?.conversationId;
            if (msgConvId && typeof msgConvId === "object") {
              msgConvId = msgConvId._id || msgConvId.id;
            }
            if (String(msgConvId) === String(selectedConversationId)) {
              // Auto mark as seen when message is received in current conversation
              const senderId = message?.senderId || message?.sender?.id || message?.sender?._id || message?.id_sender;
              if (senderId && senderId !== user?.id) {
                // Only mark seen if message is from someone else, not from current user
                conversationService.markSeen(selectedConversationId, msgId).catch(() => {});
              }
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
            payload?.messageId || payload?.message?._id || payload?.message?.id || payload?.id || payload?._id;
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
          // payload might contain { messageId, status } or { id, conversationId }
          // Mark all messages up to lastSeenMessageId as seen
          const lastSeenMessageId = payload?.lastSeenMessageId;

          if (!lastSeenMessageId) return;

          setMessages((prev) => {
            let foundIndex = -1;

            // Find the index of the lastSeenMessageId
            for (let i = 0; i < prev.length; i++) {
              const msgId = prev[i].id || prev[i]._id;
              if (String(msgId) === String(lastSeenMessageId)) {
                foundIndex = i;
                break;
              }
            }

            // If found, mark all messages up to and including this index as seen
            if (foundIndex !== -1) {
              return prev.map((m, idx) => {
                if (idx <= foundIndex) {
                  return {
                    ...m,
                    status: "seen",
                    isSeen: true,
                    readAt: new Date().toISOString(),
                  };
                }
                return m;
              });
            }

            return prev;
          });
        });

        socketService.onTypingStart((payload) => {
          const currentChat = selectedChatRef.current;
          if (payload?.groupId) {
            if (payload.groupId !== selectedConversationId) return;
          } else {
            const isGroup = currentChat?.type === "group" || currentChat?.type === "GROUP";
            if (isGroup) return;
          }

          const uId = payload?.userId || payload?.senderId || payload?.id_sender;
          if (uId) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.add(uId);
              return newSet;
            });
          }
        });

        socketService.onTypingStop((payload) => {
          const uId = payload?.userId || payload?.senderId || payload?.id_sender;
          if (uId) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(uId);
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

      let processedChat = { ...chat };
      if (
        !processedChat.targetUserId &&
        processedChat.type !== "group" &&
        processedChat.type !== "GROUP" &&
        processedChat.pairKey
      ) {
        processedChat.targetUserId = processedChat.pairKey
          .split("_")
          .find((id) => id !== user?.id && id !== user?._id);
      }

      setSelectedChat(processedChat);
      setChatError("");
      setIsOpeningConversation(true);
      setOpeningChatId(processedChat.id);

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

        setMessages(sortedMessages);

        // fire-and-forget status sync with last message ID
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        if (lastMessage) {
          const lastMessageId = lastMessage.id || lastMessage._id;
          conversationService.markDelivered(conversationId, lastMessageId).catch(() => {});
          conversationService.markSeen(conversationId, lastMessageId).catch(() => {});
        }
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
        payloadMedia = Array.isArray(payloadOrText) ? payloadOrText : [payloadOrText];
      } else {
        payloadText = payloadOrText.text || "";
        payloadMedia = payloadOrText.media || [];
      }
    } else {
      payloadText = payloadOrText || "";
      payloadMedia = mediaFiles || [];
    }

    if (!payloadText.trim() && payloadMedia.length === 0 && !payloadOrText?.forwardingMessage && !payloadOrText?.replyingMessage) return;

    const fwMsg = payloadOrText?.forwardingMessage;
    const replyMsg = payloadOrText?.replyingMessage;

    const performSend = async (txt, medias, isForward = false) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      const previewMedias = medias.map((f) => {
        if (f instanceof File) {
          const objUrl = URL.createObjectURL(f);
          return {
            name: f.name,
            filename: f.name,
            size: f.size,
            type: f.type,
            mimetype: f.type,
            url: objUrl,
            preview: objUrl,
          };
        }
        return f;
      });

      const optimisticMessage = {
        id: tempId,
        text: txt,
        media: previewMedias,
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
              const reqResponse: any = await mediaService.requestUploadUrl(file.name, file.type, file.size);
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
                reqResponse?.fileId || reqResponse?.id || reqResponse?.data?.fileId || reqResponse?.data?.id;

              if (!uploadUrl) {
                console.error("Missing uploadUrl in response:", reqResponse);
                throw new Error("Không lấy được pre-signed upload URL từ server");
              }

              // 2. Upload file trực tiếp lên S3 qua Pre-signed URL
              await mediaService.uploadToPresignedUrl(uploadUrl, file);

              // URL upload file cần gọi confirm: bỏ phần query
              const uploadedUrlClean = uploadUrl.split("?")[0];

              // 3. Confirm quá trình upload với backend
              const confirmResponse: any = await mediaService.confirmUpload(fileId, uploadedUrlClean);

              const finalUrl =
                confirmResponse?.url || confirmResponse?.fileUrl || confirmResponse?.data?.url || uploadedUrlClean;

              return {
                fileId: confirmResponse?.fileId || confirmResponse?._id || fileId,
                type: file.type?.startsWith("image/")
                  ? "image"
                  : file.type?.startsWith("video/")
                    ? "video"
                    : file.type?.startsWith("audio/")
                      ? "audio"
                      : "file",
                url: finalUrl,
                thumbnailUrl: finalUrl,
                filename: file.name || "unknown",
                size: file.size || 0,
                mimetype: file.type || "application/octet-stream",
                mimeType: file.type || "application/octet-stream",
              };
            }),
          );

          finalMedia = [...existingMedia, ...uploadedMedia];
        } else if (existingMedia.length > 0) {
          finalMedia = existingMedia;
        }

        // Strict normalization for API compliance
        const validMedia = finalMedia.map((m: any) => {
          const rawType = (m.type || m.mimeType || m.mimetype || "").toLowerCase();
          const pType = rawType.startsWith("image")
            ? "image"
            : rawType.startsWith("video")
              ? "video"
              : rawType.startsWith("audio")
                ? "audio"
                : "file";
          return {
            fileId: m.fileId || m.id || m._id || undefined,
            type: pType,
            url: m.url || m.preview || "",
            thumbnailUrl: m.thumbnailUrl || m.preview || m.url || "",
            filename: m.filename || m.name || "unknown",
            size: Number(m.size) || 0,
            mimetype: m.mimeType || m.mimetype || rawType || "application/octet-stream",
            mimeType: m.mimeType || m.mimetype || rawType || "application/octet-stream",
          };
        });

        let apiResponse: any;
        if (replyMsg) {
          const messageId = replyMsg.id || replyMsg._id;
          apiResponse = await conversationService.quoteMessage(messageId, {
            text: txt || " ",
            media: validMedia,
          });
        } else {
          apiResponse = await conversationService.sendMessage(conversationId, {
            text: txt || " ",
            media: validMedia,
          });
        }

        const responseData = apiResponse?.data || apiResponse;
        const sentMessagesArray = Array.isArray(responseData)
          ? responseData
          : responseData?.data && Array.isArray(responseData.data)
            ? responseData.data
            : [responseData];

        setMessages((prev) => {
          // Remove the optimistic 'tempId' message
          const updatedMessages = prev.filter((m) => m.id !== tempId);

          // Append or update messages from the API response
          for (const sMsg of sentMessagesArray) {
            if (!sMsg || (!sMsg._id && !sMsg.id)) continue;

            const msgId = sMsg._id || sMsg.id;
            const existingIndex = updatedMessages.findIndex((m) => String(m.id || m._id) === String(msgId));

            if (existingIndex !== -1) {
              updatedMessages[existingIndex] = { ...updatedMessages[existingIndex], status: "sent", id: msgId };
            } else {
              updatedMessages.push({ ...sMsg, id: msgId, status: "sent" });
            }
          }

          return updatedMessages;
        });

        // Update Chat sidebar and mark message as delivered
        if (sentMessagesArray.length > 0) {
          const lastSent = sentMessagesArray[sentMessagesArray.length - 1];
          const lastMessageId = lastSent.id || lastSent._id;

          socketService.emit("receiveMessage", { message: lastSent, conversationId });

          if (lastMessageId) {
            conversationService.markDelivered(conversationId, lastMessageId).catch(() => {});
          }
        }
      } catch (error) {
        console.error("Failed to send message via socket", error);
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, status: "failed" } : msg)));
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
            newMessages = [res];
          }

          if (newMessages.length > 0) {
            setMessages((prev) => {
              const newMsgs = [...prev];
              newMessages.forEach((newMsg) => {
                if (!newMsgs.some((m) => String(m._id || m.id) === String(newMsg._id || newMsg.id))) {
                  newMsgs.push(newMsg);
                }
              });
              return newMsgs;
            });

            // Mark delivered and seen after forwarding message
            const lastForwardedMessage = newMessages[newMessages.length - 1];
            const lastMessageId = lastForwardedMessage.id || lastForwardedMessage._id;
            if (lastMessageId) {
              // Only mark own messages as delivered (not seen)
              conversationService.markDelivered(conversationId, lastMessageId).catch(() => {});
            }
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
        <div className="flex-1 flex flex-col min-w-0 bg-gray-100 dark:bg-slate-950">
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
              isRightSidebarOpen={isRightSidebarOpen}
              setIsRightSidebarOpen={setIsRightSidebarOpen}
            />
          )}
        </div>

        <RightSidebar
          isOpen={isRightSidebarOpen && !!selectedChat}
          selectedChat={selectedChat}
          currentUserId={user?.id || user?._id}
          onClose={() => setIsRightSidebarOpen(false)}
        />
      </div>
    </div>
  );
};

export { MainLayout };
