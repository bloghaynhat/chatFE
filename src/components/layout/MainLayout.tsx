import { useCallback, useState, useEffect, useRef } from "react";
import { conversationService, mediaService } from "../../services";
import { socketService } from "../../services/socketService";
import { ActiveChatPane } from "../chat";
import { RightSidebar } from "../chat/RightSidebar";
import { ResizableChatPanel } from "./ResizableChatPanel";
import { useAuth } from "../../hooks";
import type {
  PinMessagePayload,
  UnpinMessagePayload,
} from "../../types/socket";

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

  // Track pending pin/unpin operations to prevent duplicate requests
  const pendingPinOperations = useRef<Set<string>>(new Set());

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
            if (!message || !message.id) return prev;
            // Prevent duplicate messages
            const msgId = message.id;
            if (prev.some((m) => String(m.id) === String(msgId))) return prev;

            // Only add if it belongs to currently open conversation
            let msgConvId = message.conversationId || payload?.conversationId;
            if (msgConvId && typeof msgConvId === "object") {
              msgConvId = msgConvId.id;
            }
            if (String(msgConvId) === String(selectedConversationId)) {
              // Auto mark as seen when message is received in current conversation
              const senderId =
                message?.senderId || message?.sender?.id || message?.id_sender;
              if (senderId && senderId !== user?.id) {
                // Only mark seen if message is from someone else, not from current user
                socketService
                  .markSeen(selectedConversationId, msgId)
                  .catch(() => {});
              }
              return [...prev, message];
            }
            return prev;
          });
        });

        // Handle quoted message (reply with quote)
        socketService.onMessageQuoted((payload) => {
          console.log("[Socket] Received message:quoted:", payload);
          const message = payload?.message || payload;
          if (!message) {
            console.warn(
              "[Socket] message:quoted payload has no message:",
              payload,
            );
            return;
          }

          setMessages((prev) => {
            const msgId = message.id;
            if (!msgId) {
              console.warn(
                "[Socket] message:quoted message has no id:",
                message,
              );
              return prev;
            }
            if (prev.some((m) => String(m.id) === String(msgId))) {
              console.log(
                "[Socket] message:quoted already exists, skipping:",
                msgId,
              );
              return prev;
            }

            let msgConvId = message.conversationId || payload?.conversationId;
            if (msgConvId && typeof msgConvId === "object") {
              msgConvId = msgConvId.id;
            }
            if (String(msgConvId) === String(selectedConversationId)) {
              console.log("[Socket] Adding quoted message to state:", msgId);
              return [...prev, message];
            }
            console.log(
              "[Socket] message:quoted conversationId mismatch. msgConvId:",
              msgConvId,
              "selected:",
              selectedConversationId,
            );
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
            const isGroup =
              currentChat?.type === "group" || currentChat?.type === "GROUP";
            if (isGroup) return;
          }

          const uId =
            payload?.userId || payload?.senderId || payload?.id_sender;
          if (uId) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.add(uId);
              return newSet;
            });
          }
        });

        socketService.onTypingStop((payload) => {
          const uId =
            payload?.userId || payload?.senderId || payload?.id_sender;
          if (uId) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(uId);
              return newSet;
            });
          }
        });

        socketService.onMessageReaction((payload: any) => {
          if (!payload) return;
          const messageId = payload.messageId || payload.reaction?.messageId;
          const reaction = payload.reaction;
          if (!messageId || !reaction) return;

          setMessages((prev) =>
            prev.map((m) => {
              if (String(m._id || m.id) === String(messageId)) {
                const currentReactions = m.reactions ? [...m.reactions] : [];
                // Find if an object for this emoji already exists
                const existingIndex = currentReactions.findIndex(
                  (r) => r.emoji === reaction.emoji,
                );
                const userObj = {
                  _id: reaction.userId,
                  id: reaction.userId,
                  avatarUrl: reaction.user?.avatarUrl || undefined,
                  displayName: reaction.user?.displayName || "Unknown User",
                };

                if (existingIndex !== -1) {
                  const existingReaction = currentReactions[existingIndex];
                  const hasUser = existingReaction.users?.some(
                    (u: any) =>
                      String(u._id || u.id) === String(reaction.userId),
                  );
                  if (!hasUser) {
                    currentReactions[existingIndex] = {
                      ...existingReaction,
                      users: existingReaction.users
                        ? [...existingReaction.users, userObj]
                        : [userObj],
                      count:
                        (existingReaction.count ||
                          existingReaction.users?.length ||
                          0) + 1,
                    };
                  }
                } else {
                  currentReactions.push({
                    emoji: reaction.emoji,
                    users: [userObj],
                    count: 1,
                  });
                }
                return { ...m, reactions: currentReactions };
              }
              return m;
            }),
          );
        });

        socketService.onMessageReactionRemove((payload: any) => {
          if (!payload) return;
          const { messageId, userId, emoji } = payload;
          if (!messageId || !userId) return;

          setMessages((prev) =>
            prev.map((m) => {
              if (String(m._id || m.id) === String(messageId)) {
                if (!m.reactions || m.reactions.length === 0) return m;
                let newReactions = [...m.reactions];

                if (emoji) {
                  const index = newReactions.findIndex(
                    (r) => r.emoji === emoji,
                  );
                  if (index !== -1) {
                    newReactions[index] = {
                      ...newReactions[index],
                      users:
                        newReactions[index].users?.filter(
                          (u: any) => String(u._id || u.id) !== String(userId),
                        ) || [],
                    };
                    newReactions[index].count =
                      newReactions[index].users.length;
                    if (newReactions[index].count <= 0) {
                      newReactions.splice(index, 1);
                    }
                  }
                } else {
                  newReactions = newReactions
                    .map((r) => ({
                      ...r,
                      users:
                        r.users?.filter(
                          (u: any) => String(u._id || u.id) !== String(userId),
                        ) || [],
                    }))
                    .map((r) => ({ ...r, count: r.users.length }))
                    .filter((r) => r.count > 0);
                }

                return { ...m, reactions: newReactions };
              }
              return m;
            }),
          );
        });

        // Handle message pin
        socketService.onMessagePinned((payload: any) => {
          const { conversationId, message } = payload;
          if (!message) return;
          const msgId = message.id || message._id;

          setMessages((prev) => {
            // Only update if it belongs to currently open conversation
            let msgConvId = conversationId || message.conversationId;
            if (msgConvId && typeof msgConvId === "object") {
              msgConvId = msgConvId._id || msgConvId.id;
            }
            if (String(msgConvId) !== String(selectedConversationId))
              return prev;

            return prev.map((m) =>
              String(m._id || m.id) === String(msgId)
                ? {
                    ...m,
                    ...message,
                    pinnedAt: message.pinnedAt || new Date().toISOString(),
                  }
                : m,
            );
          });
        });

        // Handle message unpin
        socketService.onMessageUnpinned((payload: any) => {
          const { conversationId, message } = payload;
          if (!message) return;
          const msgId = message.id || message._id;

          setMessages((prev) => {
            // Only update if it belongs to currently open conversation
            let msgConvId = conversationId || message.conversationId;
            if (msgConvId && typeof msgConvId === "object") {
              msgConvId = msgConvId._id || msgConvId.id;
            }
            if (String(msgConvId) !== String(selectedConversationId))
              return prev;

            return prev.map((m) =>
              String(m._id || m.id) === String(msgId)
                ? { ...m, ...message, pinnedAt: undefined, pinnedBy: undefined }
                : m,
            );
          });
        });

        socketService.on("conversation:updated", (payload: any) => {
          const { conversationId, updates } = payload;
          if (!conversationId || !updates) return;

          if (String(conversationId) === String(selectedConversationId)) {
            setSelectedChat((prev: any) => {
              if (!prev) return prev;
              return { ...prev, ...updates };
            });
          }
        });

        // Handle group dissolution - this group has been deleted by an admin
        socketService.onGroupDissolved((payload: any) => {
          const { conversationId } = payload;
          if (!conversationId) return;

          // If the dissolved group is currently open, navigate away
          if (String(conversationId) === String(selectedConversationId)) {
            setSelectedChat(null);
            setSelectedConversationId(null);
            setMessages([]);
            setChatError("This group has been deleted by an admin");
          }

          // Notify ChatList to refresh and remove the dissolved group
          window.dispatchEvent(new Event("chatList:refresh"));
        });

        // Handle group renamed
        const handleGroupRenamed = (payload: any) => {
          const { conversationId, newName } = payload;
          if (!conversationId || !newName) return;

          if (String(conversationId) === String(selectedConversationId)) {
            setSelectedChat((prev: any) => {
              if (!prev) return prev;
              return { ...prev, name: newName };
            });
          }
        };

        // Handle group avatar changed
        const handleGroupAvatarChanged = (payload: any) => {
          const { conversationId, avatarUrl } = payload;
          if (!conversationId || !avatarUrl) return;

          if (String(conversationId) === String(selectedConversationId)) {
            setSelectedChat((prev: any) => {
              if (!prev) return prev;
              return { ...prev, avatarUrl };
            });
          }
        };

        socketService.onGroupRenamed(handleGroupRenamed);
        socketService.onGroupAvatarChanged(handleGroupAvatarChanged);
      }
    });

    return () => {
      active = false;
      socketService.offNewMessage();
      socketService.offMessageRevoked();
      socketService.offMessageEdited();
      socketService.offMessageReaction();
      socketService.offMessageReactionRemove();
      socketService.offMessagePinned();
      socketService.offMessageUnpinned();
      socketService.offMessageQuoted();
      socketService.off("conversation:updated");
      socketService.offGroupDissolved();
      socketService.offGroupRenamed();
      socketService.offGroupAvatarChanged();
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
          .find((id) => id !== user?.id);
      }

      setSelectedChat(processedChat);
      setChatError("");
      setIsOpeningConversation(true);
      setOpeningChatId(processedChat.id);

      try {
        // Nếu chat.id có dạng temp- (click từ global search), cần tìm conversation thật trước
        let conversationId = chat.id;

        if (String(conversationId).startsWith("temp-") && chat.targetUserId) {
          const conversation =
            await conversationService.createPrivateConversation(
              chat.targetUserId,
            );
          conversationId = resolveConversationId(conversation);
          setSelectedChat((prev: any) => ({
            ...prev,
            ...conversation,
            id: conversationId,
            conversationId: conversationId,
            name: chat.name || prev?.name || conversation?.name,
            avatarUrl:
              chat.avatarUrl || prev?.avatarUrl || conversation?.avatarUrl,
            displayName:
              chat.name ||
              prev?.displayName ||
              (conversation as any)?.displayName,
          }));
        }

        if (!conversationId) {
          setChatError("Conversation not found.");
          setIsOpeningConversation(false);
          setOpeningChatId(null);
          return;
        }

        setSelectedConversationId(conversationId);

        // Nếu là group chat, fetch thông tin nhóm mới nhất và update selectedChat
        const isGroupChat =
          processedChat.type === "group" || processedChat.type === "GROUP";
        if (isGroupChat) {
          try {
            const infoResult: any =
              await conversationService.getGroupInfo(conversationId);
            const infoData = infoResult?.data || infoResult;
            const groupData = infoData?.conversation || infoData;
            if (groupData) {
              setSelectedChat((prev: any) => ({
                ...prev,
                name: groupData.name ?? prev.name,
                avatarUrl: groupData.avatarUrl ?? prev.avatarUrl,
                membersCount: groupData.membersCount ?? prev.membersCount,
              }));
            }
          } catch (e) {
            console.warn("Failed to fetch group info on open", e);
          }
        }

        const messageResult =
          await conversationService.getConversationMessages(conversationId);

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
          const lastMessageId = lastMessage.id;
          conversationService
            .markDelivered(conversationId, lastMessageId)
            .catch(() => {});
          conversationService
            .markSeen(conversationId, lastMessageId)
            .catch(() => {});
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

  const openSavedMessages = useCallback(async () => {
    setActiveView("chats");
    setChatError("");

    try {
      const conversations = await conversationService.getConversations();
      const savedMessages = (Array.isArray(conversations) ? conversations : []).find(
        (conversation: any) =>
          conversation?.type === "saved_messages" ||
          conversation?.isSavedMessages ||
          conversation?.isSelfChat ||
          conversation?.pairKey === `self_${user?.id}`,
      );

      if (!savedMessages) {
        setChatError("Saved Messages not found.");
        return;
      }

      await openChatByRow({
        ...savedMessages,
        name: savedMessages.name || "Saved Messages",
        type: "saved_messages",
        isSavedMessages: true,
        isSelfChat: true,
      });
    } catch (error) {
      console.error("Failed to open Saved Messages:", error);
      setChatError("Could not open Saved Messages.");
    }
  }, [openChatByRow, user?.id]);

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

          await socketService.editMessage(payloadOrText.id, payloadOrText.text);
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
      !payloadOrText?.forwardingMessage &&
      !payloadOrText?.replyingMessage
    )
      return;

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

      setMessages((prev) => {
        const optimisticMessage: any = {
          id: tempId,
          text: txt,
          media: previewMedias,
          createdAt: new Date().toISOString(),
          isMine: true,
          senderId: user?.id || "me",
          status: "sending",
        };
        if (replyMsg) {
          optimisticMessage.quotedMessageId = replyMsg.id || replyMsg._id;
          optimisticMessage.quotedMessage = replyMsg;
        }
        return [...prev, optimisticMessage];
      });

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

              const finalUrl =
                confirmResponse?.url ||
                confirmResponse?.fileUrl ||
                confirmResponse?.data?.url ||
                uploadedUrlClean;

              return {
                fileId:
                  confirmResponse?.fileId || confirmResponse?._id || fileId,
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
          const rawType = (
            m.type ||
            m.mimeType ||
            m.mimetype ||
            ""
          ).toLowerCase();
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
            mimetype:
              m.mimeType || m.mimetype || rawType || "application/octet-stream",
            mimeType:
              m.mimeType || m.mimetype || rawType || "application/octet-stream",
          };
        });

        let apiResponse: any;
        if (replyMsg) {
          const messageId = replyMsg.id || replyMsg._id;
          apiResponse = await socketService.quoteMessage(
            messageId,
            txt || " ",
            selectedConversationId,
            validMedia,
          );
        } else {
          apiResponse = await socketService.sendMessage(
            conversationId,
            txt || " ",
            validMedia,
          );
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
            const existingIndex = updatedMessages.findIndex(
              (m) => String(m.id || m._id) === String(msgId),
            );

            if (existingIndex !== -1) {
              updatedMessages[existingIndex] = {
                ...updatedMessages[existingIndex],
                ...sMsg,
                status: "sent",
                id: msgId,
              };
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

          socketService.emit("receiveMessage", {
            message: lastSent,
            conversationId,
          });

          if (lastMessageId) {
            socketService
              .markDelivered(conversationId, lastMessageId)
              .catch(() => {});
          }
        }
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
          const res: any = await socketService.forwardMessages(
            [msgId],
            conversationId,
          );

          // Normalize res to an array of messages
          let newMessages = [];
          if (Array.isArray(res)) {
            newMessages = res;
          } else if (res?.data && Array.isArray(res.data)) {
            newMessages = res.data;
          } else if (res && typeof res === "object") {
            newMessages = [res.message || res.data || res];
          }

          if (newMessages.length > 0) {
            setMessages((prev) => {
              const newMsgs = [...prev];
              newMessages.forEach((newMsg) => {
                if (
                  newMsg &&
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

            // Mark delivered and seen after forwarding message
            const lastForwardedMessage = newMessages[newMessages.length - 1];
            const lastMessageId =
              lastForwardedMessage?.id || lastForwardedMessage?._id;
            if (lastMessageId) {
              // Only mark own messages as delivered (not seen)
              socketService
                .markDelivered(conversationId, lastMessageId)
                .catch(() => {});
            }
          }
        }
      } catch (error) {
        console.error("Failed to forward message via socket", error);
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

  const handleDeleteMessageForMe = async (message) => {
    const messageId = message?.id || message?._id;
    if (!messageId) return;

    try {
      const res: any = await socketService.deleteMessage(messageId);

      if (
        res &&
        (res.success ||
          res.status === 200 ||
          res.statusText === "OK" ||
          res.status === "success")
      ) {
        setMessages((prev) =>
          prev.filter(
            (msg) =>
              String(msg.id) !== String(messageId) &&
              String(msg._id) !== String(messageId),
          ),
        );
      }
    } catch (error) {
      console.error("Failed to delete message for me via socket:", error);
      // Fallback to API if socket fails or not implemented for this action
      try {
        await conversationService.deleteMessageForMe(messageId);
        setMessages((prev) =>
          prev.filter(
            (msg) =>
              String(msg.id) !== String(messageId) &&
              String(msg._id) !== String(messageId),
          ),
        );
      } catch (apiErr) {
        console.error("Failed to delete message for me via API:", apiErr);
      }
    }
  };

  const handleDeleteMessageForEveryone = async (message: any) => {
    const messageId = message?.id || message?._id;
    if (!messageId) return;

    try {
      const res: any = await socketService.deleteMessageForEveryone(messageId);

      if (
        res &&
        (res.success || res.status === 200 || res.status === "success")
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id || m.id) === String(messageId)
              ? {
                  ...m,
                  isRevoked: true,
                  text: "Message deleted for everyone",
                  deletedAt: new Date().toISOString(),
                }
              : m,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to delete message for everyone via socket:", error);
      try {
        await conversationService.deleteMessageForEveryone(messageId);
      } catch (apiErr) {
        console.error("Failed to delete message for everyone via API:", apiErr);
      }
    }
  };

  const handlePinMessage = async (messageId: string) => {
    // Prevent duplicate requests
    const operationKey = `pin-${messageId}`;
    if (pendingPinOperations.current.has(operationKey)) {
      console.warn(`Pin operation already pending for message ${messageId}`);
      return;
    }

    if (!selectedConversationId) {
      console.error("Cannot pin message: no conversation selected", {
        selectedConversationId,
        messageId,
      });
      return;
    }

    pendingPinOperations.current.add(operationKey);

    console.log("[Pin] Pinning message:", {
      conversationId: selectedConversationId,
      messageId,
    });

    // Get current pinned state before optimistic update (for potential rollback)
    const currentMessage = messages.find(
      (m) => String(m.id || m._id) === String(messageId),
    );
    const originalPinnedAt = currentMessage?.pinnedAt;
    const originalPinnedBy = currentMessage?.pinnedBy;

    // Optimistic update - add pinnedAt immediately
    setMessages((prev) =>
      prev.map((msg) =>
        String(msg.id || msg._id) === String(messageId)
          ? {
              ...msg,
              pinnedAt: new Date().toISOString(),
              pinnedBy: user?.id,
            }
          : msg,
      ),
    );

    try {
      const res: any = await socketService.pinMessage(messageId);
      if (
        res &&
        (res.success ||
          res.status === 200 ||
          res.statusText === "OK" ||
          res.status === "success")
      ) {
        console.log("[Pin] Success:", {
          conversationId: selectedConversationId,
          messageId,
        });
        // Server will broadcast back to other clients, but we already updated optimistically
      } else {
        throw new Error(res?.error || res?.msg || res?.message || "Pin failed");
      }
    } catch (error) {
      // Rollback on error
      console.error("Failed to pin message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id || msg._id) === String(messageId)
            ? { ...msg, pinnedAt: originalPinnedAt, pinnedBy: originalPinnedBy }
            : msg,
        ),
      );
      throw error;
    } finally {
      pendingPinOperations.current.delete(operationKey);
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    // Prevent duplicate requests
    const operationKey = `unpin-${messageId}`;
    if (pendingPinOperations.current.has(operationKey)) {
      console.warn(`Unpin operation already pending for message ${messageId}`);
      return;
    }

    if (!selectedConversationId) {
      console.error("Cannot unpin message: no conversation selected", {
        selectedConversationId,
        messageId,
      });
      return;
    }

    pendingPinOperations.current.add(operationKey);

    console.log("[Unpin] Unpinning message:", {
      conversationId: selectedConversationId,
      messageId,
    });

    // Get current pinned state before optimistic update (for potential rollback)
    const currentMessage = messages.find(
      (m) => String(m.id || m._id) === String(messageId),
    );
    const originalPinnedAt = currentMessage?.pinnedAt;
    const originalPinnedBy = currentMessage?.pinnedBy;

    // Optimistic update - remove pinnedAt immediately
    setMessages((prev) =>
      prev.map((msg) =>
        String(msg.id || msg._id) === String(messageId)
          ? { ...msg, pinnedAt: undefined, pinnedBy: undefined }
          : msg,
      ),
    );

    try {
      const res: any = await socketService.unpinMessage(messageId);
      if (
        res &&
        (res.success ||
          res.status === 200 ||
          res.statusText === "OK" ||
          res.status === "success")
      ) {
        console.log("[Unpin] Success:", {
          conversationId: selectedConversationId,
          messageId,
        });
        // Server will broadcast back to other clients, but we already updated optimistically
      } else {
        throw new Error(
          res?.error || res?.msg || res?.message || "Unpin failed",
        );
      }
    } catch (error) {
      // Rollback on error - restore original pinned state
      console.error("Failed to unpin message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id || msg._id) === String(messageId)
            ? { ...msg, pinnedAt: originalPinnedAt, pinnedBy: originalPinnedBy }
            : msg,
        ),
      );
      throw error;
    } finally {
      pendingPinOperations.current.delete(operationKey);
    }
  };

  const handleShowInChat = (mediaUrl: string) => {
    // Search for the actual message that contains this media
    console.log("🔍 Searching for message containing media URL:", mediaUrl);

    const foundMessage = messages.find((msg) => {
      if (!msg.media || !Array.isArray(msg.media)) return false;
      return msg.media.some(
        (m: any) => m.url === mediaUrl || m.preview === mediaUrl,
      );
    });

    if (!foundMessage) {
      console.warn("❌ Message containing this media not found");
      return;
    }

    const messageId = foundMessage.id || foundMessage._id;
    console.log("✅ Found message ID:", messageId);

    // Try to find and scroll to the message element
    const findAndScrollToMessage = () => {
      const messageElement = document.querySelector(
        `[data-message-id="${messageId}"]`,
      );
      console.log("📍 Found element:", messageElement);

      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight the message temporarily
        messageElement.classList.add("bg-yellow-100", "dark:bg-yellow-900/30");
        console.log("✅ Message highlighted and scrolled");
        setTimeout(() => {
          messageElement.classList.remove(
            "bg-yellow-100",
            "dark:bg-yellow-900/30",
          );
        }, 2000);
        return true;
      }
      return false;
    };

    // First attempt
    if (findAndScrollToMessage()) return;

    // If message element not found (may be outside viewport), scroll chat to top and retry
    console.warn(
      "⚠️ Message element not found, trying to scroll chat to top...",
    );
    const chatContainer = document.querySelector("[data-chat-container]");
    if (chatContainer) {
      chatContainer.scrollTop = 0;
      // Wait for messages to render, then retry
      setTimeout(() => {
        findAndScrollToMessage();
      }, 300);
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
          onOpenSavedMessages={openSavedMessages}
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
              currentUserId={user?.id}
              onRetry={retryOpenCurrentChat}
              onSendMessage={handleSendMessage}
              onRevokeMessage={handleRevokeMessage}
              onDeleteMessageForMe={handleDeleteMessageForMe}
              onDeleteMessageForEveryone={handleDeleteMessageForEveryone}
              onForwardToTarget={handleForwardToTarget}
              forwardingMessage={forwardingMessage}
              onClearForwarding={clearForwardingMessage}
              isRightSidebarOpen={isRightSidebarOpen}
              setIsRightSidebarOpen={setIsRightSidebarOpen}
              onPinMessage={handlePinMessage}
              onUnpinMessage={handleUnpinMessage}
            />
          )}
        </div>

        <RightSidebar
          isOpen={isRightSidebarOpen && !!selectedChat}
          selectedChat={selectedChat}
          currentUserId={user?.id}
          onClose={() => setIsRightSidebarOpen(false)}
          onGroupUpdated={(newInfo: any) => {
            setSelectedChat((prev: any) =>
              prev ? { ...prev, ...newInfo } : prev,
            );
          }}
          onShowInChat={handleShowInChat}
          messages={messages}
          onSendMessage={(member: any) => {
            const memberId =
              member.userId ||
              member.user?.id ||
              member.user?._id ||
              member._id ||
              member.id;
            const participant = member.user || member;
            const name =
              participant.displayName ||
              participant.name ||
              participant.username ||
              "Unknown";

            if (memberId) {
              openChatByRow({
                id: `temp-${memberId}`,
                targetUserId: memberId,
                name: name,
                avatarUrl: participant.avatarUrl,
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export { MainLayout };
