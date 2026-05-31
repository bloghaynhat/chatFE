import { useMemo, useState, useEffect, useCallback } from "react";
import { FiArchive, FiUser, FiSearch } from "react-icons/fi";
import { userService, conversationService } from "../../services";
import { socketService } from "../../services/socketService";
import { ConversationItem } from "./ChatList/ConversationItem";
import { GlobalUserItem } from "./ChatList/GlobalUserItem";
import { useAuth } from "../../hooks/useAuth";
import { getChatMessagePreview } from "../../utils/chatPreview";
import type { Conversation } from "../../types/conversation";
import type { GroupRenamedPayload, GroupAvatarChangedPayload } from "../../types/socket";

const APP_TITLE = "ChatChit";
const TAB_LOGO_PATH = "/Logo_Tab.png";

const getTimeValue = (value: any) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const hasRealPreview = (message: any) => {
  if (!message) return false;
  return getChatMessagePreview(message) !== "No messages";
};

const mergeFetchedChats = (previousChats: any[], fetchedChats: any[]) => {
  const previousById = new Map(previousChats.map((chat) => [chat.id, chat]));

  return fetchedChats.map((fetchedChat) => {
    const previousChat = previousById.get(fetchedChat.id);
    if (!previousChat?.lastMessage) return fetchedChat;

    const fetchedPreviewIsMissing = !hasRealPreview(fetchedChat.lastMessage);
    const previousPreviewIsValid = hasRealPreview(previousChat.lastMessage);
    const fetchedTime = getTimeValue(fetchedChat.lastMessageAt || fetchedChat.lastMessage?.createdAt);
    const previousTime = getTimeValue(previousChat.lastMessageAt || previousChat.lastMessage?.createdAt);

    if (previousPreviewIsValid && (fetchedPreviewIsMissing || fetchedTime < previousTime)) {
      return {
        ...fetchedChat,
        lastMessage: previousChat.lastMessage,
        lastMessageAt: previousChat.lastMessageAt,
        lastMessageStatus: previousChat.lastMessageStatus,
        lastMessageTimeFormatted: previousChat.lastMessageTimeFormatted,
      };
    }

    return fetchedChat;
  });
};

const extractSocketMessage = (payload: any) => {
  const candidates = [
    payload?.payload?.message,
    Array.isArray(payload?.message?.messages) ? payload.message.messages[0] : null,
    payload?.message?.message,
    Array.isArray(payload?.messages) ? payload.messages[0] : null,
    payload?.message,
    payload,
  ].filter(Boolean);

  const message =
    candidates.find((candidate) => {
      if (candidate?.success && Array.isArray(candidate?.messages)) return false;
      return (
        candidate?.id ||
        candidate?._id ||
        candidate?.messageId ||
        candidate?.text ||
        candidate?.content ||
        candidate?.textPreview ||
        candidate?.media ||
        candidate?.files ||
        candidate?.attachments
      );
    }) ||
    candidates.find((candidate) => Array.isArray(candidate?.messages))?.messages?.[0] ||
    payload;

  const conversationId =
    payload?.payload?.conversationId ||
    message?.conversationId ||
    message?.conversation?.id ||
    message?.conversation?._id ||
    payload?.conversationId;

  return { message, conversationId, candidates };
};

const setTabFavicon = (unreadCount: number) => {
  const link =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]') ||
    document.createElement("link");

  link.rel = "icon";
  link.type = "image/png";

  if (unreadCount <= 0) {
    link.href = TAB_LOGO_PATH;
    document.head.appendChild(link);
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    ctx.beginPath();
    ctx.arc(50, 14, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    link.href = canvas.toDataURL("image/png");
    document.head.appendChild(link);
  };
  img.onerror = () => {
    link.href = TAB_LOGO_PATH;
    document.head.appendChild(link);
  };
  img.src = TAB_LOGO_PATH;
};

export const ChatList = ({
  searchQuery = "",
  filterMode = "all",
  isCollapsed = false,
  activeChatId = null,
  openingChatId = null,
  isGlobalSearchEnabled = false,
  onSelectChat,
}: any) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response: any = await conversationService.getConversations();
      const data = response?.data || response || [];
      const fetchedChats = Array.isArray(data) ? data : [];
      setChats((previousChats) => mergeFetchedChats(previousChats, fetchedChats));
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setChats([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Listen for local trigger to refresh the chat list (e.g. when accepting friend request)
  useEffect(() => {
    const handleRefresh = () => fetchChats(false);
    window.addEventListener("chatList:refresh", handleRefresh);

    // Also listen to socket event if the other party accepted our request
    const unsubFriendAccepted = socketService.on("friend_request:accepted", () => {
      fetchChats(false);
    });

    return () => {
      window.removeEventListener("chatList:refresh", handleRefresh);
      if (unsubFriendAccepted) unsubFriendAccepted();
    };
  }, [fetchChats]);

  // Handle member removed from conversation (including self leave)
  useEffect(() => {
    const handleMemberRemoved = (data: any) => {
      const { conversationId, removedUserId } = data;

      // If current user was removed, remove the conversation from local state
      if (removedUserId === user?.id) {
        setChats((prev) => prev.filter((chat) => chat.id !== conversationId));
      } else {
        // Other member was removed, refresh the list to update member counts
        fetchChats(false);
      }
    };

    const cleanup = socketService.on("conversation:member_removed", handleMemberRemoved);
    return () => cleanup();
  }, [user?.id, fetchChats]);

  // Handle conversation deleted
  useEffect(() => {
    const handleConversationDeleted = (data: any) => {
      const { conversationId } = data;
      setChats((prev) => prev.filter((chat) => chat.id !== conversationId));
    };

    const cleanup = socketService.on("conversation:deleted", handleConversationDeleted);
    return () => cleanup();
  }, []);

  // Handle group name/avatar updates
  useEffect(() => {
    const handleGroupRenamed = (data: GroupRenamedPayload) => {
      const { conversationId, newName } = data;
      if (!conversationId || !newName) return;

      // Optimistic update: update name immediately in UI
      setChats((prev) => prev.map((chat) => (chat.id === conversationId ? { ...chat, name: newName } : chat)));

      // Refetch to ensure consistency
      fetchChats(false);
    };

    const handleGroupAvatarChanged = (data: GroupAvatarChangedPayload) => {
      const { conversationId, avatarUrl } = data;
      if (!conversationId || !avatarUrl) return;

      // Optimistic update: update avatar immediately in UI
      setChats((prev) => prev.map((chat) => (chat.id === conversationId ? { ...chat, avatarUrl } : chat)));

      fetchChats(false);
    };

    const cleanupRenamed = socketService.on("group:renamed", handleGroupRenamed);
    const cleanupAvatar = socketService.on("group:avatar_changed", handleGroupAvatarChanged);

    return () => {
      if (cleanupRenamed) cleanupRenamed();
      if (cleanupAvatar) cleanupAvatar();
    };
  }, [fetchChats]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (activeChatId) {
      setChats((prevChats) => prevChats.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c)));
    }
  }, [activeChatId]);

  useEffect(() => {
    const totalUnread = chats.reduce((total, chat) => total + Number(chat.unreadCount || 0), 0);
    document.title = totalUnread > 0 ? `(${totalUnread > 99 ? "99+" : totalUnread}) ${APP_TITLE}` : APP_TITLE;
    setTabFavicon(totalUnread);
  }, [chats]);

  useEffect(() => {
    const unsubscribe = socketService.onNewMessage((payload) => {
      const { message, conversationId } = extractSocketMessage(payload);
      let msgConvId = conversationId;
      if (msgConvId && typeof msgConvId === "object") {
        msgConvId = msgConvId._id || msgConvId.id;
      }

      if (!msgConvId) return;

      setChats((prevChats) => {
        const idx = prevChats.findIndex((c) => c.id === msgConvId);

        const newLastMessage = {
          messageId: message.id || message._id,
          createdAt: message.createdAt || new Date().toISOString(),
          senderId: message.senderId || message.sender?.id || message.sender?._id || message.id_sender,
          textPreview: getChatMessagePreview(message),
          type: message.type || "text",
        };

        if (idx !== -1) {
          const chat = prevChats[idx];
          const isCurrentlyActive = activeChatId === msgConvId || openingChatId === msgConvId;

          const updatedChat = {
            ...chat,
            lastMessage: newLastMessage,
            lastMessageTimeFormatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            unreadCount: isCurrentlyActive ? 0 : (chat.unreadCount || 0) + 1,
            lastMessageAt: newLastMessage.createdAt,
          };

          // Filter out the old chat and put the updated one at the top
          const filteredChats = prevChats.filter((c) => c.id !== msgConvId);
          return [updatedChat, ...filteredChats];
        } else {
          // If the chat doesn't exist in the list, fetch the updated list from the server silently
          fetchChats(false);
          return prevChats;
        }
      });
    });

    return () => {
      // Call the unsubscribe function returned by our event manager
      unsubscribe();
    };
  }, [activeChatId, openingChatId, fetchChats]);

  // Listen to seen/delivered events to update the status for the latest message
  // so the sender immediately sees the "eye" icon without refreshing
  useEffect(() => {
    const unsubSeen = socketService.onMessageStatusUpdate((payload) => {
      const convId = payload?.conversationId;
      const lastSeenId = payload?.lastSeenMessageId || payload?.messageId;

      if (!convId || !lastSeenId) return;

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            // Because the frontend only keeps the ID of the last message
            const currentLastMsgId = c.lastMessage?.messageId || c.lastMessage?.id;
            // Update if the seen message is the last message
            if (currentLastMsgId && String(currentLastMsgId) === String(lastSeenId)) {
              return {
                ...c,
                lastMessageStatus: "seen",
                lastMessage: {
                  ...c.lastMessage,
                  status: "seen",
                },
              };
            }
          }
          return c;
        }),
      );
    });

    const unsubDelivered = socketService.onMessageDelivered((payload) => {
      const convId = payload?.conversationId;
      const lastDeliveredId = payload?.lastDeliveredMessageId || payload?.messageId;

      if (!convId || !lastDeliveredId) return;

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            const currentLastMsgId = c.lastMessage?.messageId || c.lastMessage?.id;
            if (currentLastMsgId && String(currentLastMsgId) === String(lastDeliveredId)) {
              // Only escalate to delivered if it is not already seen
              if (c.lastMessageStatus !== "seen" && c.lastMessage?.status !== "seen") {
                return {
                  ...c,
                  lastMessageStatus: "delivered",
                  lastMessage: {
                    ...c.lastMessage,
                    status: "delivered",
                  },
                };
              }
            }
          }
          return c;
        }),
      );
    });

    return () => {
      unsubSeen();
      unsubDelivered();
    };
  }, []);

  useEffect(() => {
    const unsubUpdated = socketService.on("conversation:updated", () => {
      fetchChats(false);
    });
    return () => unsubUpdated();
  }, [fetchChats]);

  // Handle new conversation created (e.g., group creation)
  useEffect(() => {
    const handleConversationCreated = (payload: any) => {
      const conversation = payload?.conversation || payload;
      if (!conversation?.id) return;

      // Add new conversation to the top if not already present
      setChats((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        if (exists) return prev;
        return [conversation, ...prev];
      });
    };

    const cleanup = socketService.on("conversation:created", handleConversationCreated);
    return () => cleanup();
  }, []);

  // Handle members added to a conversation
  useEffect(() => {
    const handleMembersAdded = (data: any) => {
      const { conversationId, memberIds } = data;
      if (!conversationId || !Array.isArray(memberIds)) return;

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === conversationId) {
            const currentCount = chat.membersCount || 0;
            const newChat = {
              ...chat,
              membersCount: currentCount + memberIds.length,
            };

            // If the conversation has pendingMembers, add new members to pending list
            if (chat.pendingMembers) {
              const newPending = chat.pendingMembers.filter((pendingId: string) => !memberIds.includes(pendingId));
              if (newPending.length > 0) {
                newChat.pendingMembers = newPending;
              } else {
                delete newChat.pendingMembers;
              }
            }

            return newChat;
          }
          return chat;
        }),
      );
    };

    const cleanup = socketService.on("conversation:members_added", handleMembersAdded);
    return () => cleanup();
  }, []);

  // Handle conversation admin actions: pin, archive, mute
  useEffect(() => {
    const handlePinToggled = () => fetchChats(false);
    const handleArchivedToggled = () => fetchChats(false);
    const handleMuteChanged = () => fetchChats(false);

    const cleanupPin = socketService.on("conversation:pin_toggled", handlePinToggled);
    const cleanupArchive = socketService.on("conversation:archived_toggled", handleArchivedToggled);
    const cleanupMute = socketService.on("conversation:mute_changed", handleMuteChanged);

    return () => {
      if (cleanupPin) cleanupPin();
      if (cleanupArchive) cleanupArchive();
      if (cleanupMute) cleanupMute();
    };
  }, [fetchChats]);

  // Handle group admin actions: settings, approval/rejection, admin/owner changes
  useEffect(() => {
    const handleGroupSettingsUpdated = () => fetchChats(false);
    const handleMemberApproved = () => fetchChats(false);
    const handleMemberRejected = () => fetchChats(false);
    const handleAdminChanged = () => fetchChats(false);
    const handleOwnerTransferred = () => fetchChats(false);

    const cleanupSettings = socketService.on("group:settings_updated", handleGroupSettingsUpdated);
    const cleanupApproved = socketService.on("group:member_approved", handleMemberApproved);
    const cleanupRejected = socketService.on("group:member_rejected", handleMemberRejected);
    const cleanupAdmin = socketService.on("group:admin_changed", handleAdminChanged);
    const cleanupOwner = socketService.on("group:owner_transferred", handleOwnerTransferred);

    return () => {
      if (cleanupSettings) cleanupSettings();
      if (cleanupApproved) cleanupApproved();
      if (cleanupRejected) cleanupRejected();
      if (cleanupAdmin) cleanupAdmin();
      if (cleanupOwner) cleanupOwner();
    };
  }, [fetchChats]);

  // Handle group member left (kicked or voluntary leave)
  useEffect(() => {
    const handleMemberLeft = (data: any) => {
      const { conversationId, userId } = data;

      // If current user was removed/kicked, remove conversation from list
      if (userId === user?.id) {
        setChats((prev) => prev.filter((chat) => chat.id !== conversationId));
      } else {
        // Other member left, refresh to update member count
        fetchChats(false);
      }
    };

    const cleanup = socketService.on("group:member_left", handleMemberLeft);
    return () => cleanup();
  }, [user?.id, fetchChats]);

  // Handle group dissolved
  useEffect(() => {
    const handleGroupDissolved = (data: any) => {
      const { conversationId } = data;
      setChats((prev) => prev.filter((chat) => chat.id !== conversationId));
    };

    const cleanup = socketService.on("group:dissolved", handleGroupDissolved);
    return () => cleanup();
  }, []);

  const [globalUsers, setGlobalUsers] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  useEffect(() => {
    if (!isGlobalSearchEnabled) return;

    const isPossiblePhone = /^0\d{9}$/.test(normalizedQuery);

    if (!normalizedQuery || !isPossiblePhone) {
      setGlobalUsers([]);
      setIsSearchingGlobal(false);
      return;
    }

    const fetchGlobalSearch = async () => {
      setIsSearchingGlobal(true);
      try {
        const response: any = await userService.searchUsers(normalizedQuery);
        const results = response?.users || response || [];
        setGlobalUsers(Array.isArray(results) ? results : results.id || results._id ? [results] : []);
      } catch (err) {
        console.error("Global search error:", err);
        setGlobalUsers([]);
      } finally {
        setIsSearchingGlobal(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchGlobalSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [normalizedQuery, isGlobalSearchEnabled]);

  const visibleChats = useMemo(() => {
    let baseList = chats;

    if (filterMode === "archived") {
      baseList = chats.filter((chat) => chat.archived);
    }

    if (!normalizedQuery) {
      return baseList;
    }

    return baseList.filter(
      (chat) =>
        chat.name?.toLowerCase().includes(normalizedQuery) ||
        chat.lastMessage?.textPreview?.toLowerCase().includes(normalizedQuery),
    );
  }, [chats, filterMode, normalizedQuery]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto pb-20">
        {normalizedQuery && (
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Recent Chats
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : visibleChats.length === 0 && !normalizedQuery ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6 text-gray-500 dark:text-gray-400">
            {!isCollapsed && (
              <>
                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">No matching conversations found</p>
                <p className="text-sm">Try a different keyword or start a new message from the + button.</p>
              </>
            )}
            {isCollapsed && <FiSearch className="text-xl text-gray-400" />}
          </div>
        ) : (
          visibleChats.map((chat) => (
            <ConversationItem
              key={chat.id}
              chat={chat}
              isCollapsed={isCollapsed}
              activeChatId={activeChatId}
              openingChatId={openingChatId}
              onSelectChat={onSelectChat}
            />
          ))
        )}

        {isGlobalSearchEnabled && normalizedQuery && (
          <div className="mt-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400 border-t dark:border-slate-700">
              Global Users
            </div>

            {isSearchingGlobal ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : globalUsers.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">No users found</div>
            ) : (
              globalUsers.map((user) => (
                <GlobalUserItem
                  key={`global-${user.id || user._id}`}
                  user={user}
                  isCollapsed={isCollapsed}
                  onSelectChat={onSelectChat}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
