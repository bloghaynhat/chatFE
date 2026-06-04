import { useState, useEffect, useRef } from "react";
import { PhotoView } from "react-photo-view";
import { FiCheck, FiDownload, FiEye, FiMapPin } from "react-icons/fi";
import {
  getMessageId,
  getMessageText,
  getMessageTime,
} from "../../../utils/chatUtils";
import userService from "../../../services/userService";
import { SystemMessage } from "./MessageTypes/SystemMessage";
import { RevokedMessage } from "./MessageTypes/RevokedMessage";
import { MessageMedia } from "./MessageTypes/MessageMedia";
import { MessageAudio } from "./MessageTypes/MessageAudio";
import { MessageDocument } from "./MessageTypes/MessageDocument";
import { MessageText } from "./MessageTypes/MessageText";
import { PollMessage } from "./MessageTypes/PollMessage";
import { ReminderMessage, extractReminderFromMessage } from "./MessageTypes/ReminderMessage";
import { CallMessageBubble, parseCallMessage } from "./MessageTypes/CallMessageBubble";
import { ProfileCardMessage } from "./MessageTypes/ProfileCardMessage";
import { ForwardedMessageHeader } from "./MessageTypes/ForwardedMessageHeader";
import { QuotedMessageHeader } from "./MessageTypes/QuotedMessageHeader";
import { conversationService } from "../../../services/conversationService";
import { socketService } from "../../../services/socketService";
import { JUMBO_EMOJI_ASSETS } from "./MessageTypes/AnimatedEmojiMessage";

const senderDisplayCache = new Map<string, any>();

export const MessageItem = ({
  message,
  messages,
  index,
  isFirst,
  firstMessageRef,
  mine,
  isGroup,
  isFirstInSequence = true,
  isLastInSequence = true,
  handleContextMenu,
  activeContextMessageId,
  activeContextMenuClosing,
  setPreviewVideoUrl,
  currentUserId,
  onNavigateToMessage,
  onPollUpdated,
  onOpenChat,
  senderFallback,
  wallpaperTheme,
  hasUploadedWallpaper,
}: any) => {
  const [fetchedSender, setFetchedSender] = useState(null);
  const [reactionView, setReactionView] = useState(null);

  const fallbackSenderName =
    senderFallback?.displayName ||
    senderFallback?.name ||
    senderFallback?.username ||
    senderFallback?.fullName ||
    null;
  const cachedSender = message?.senderId
    ? senderDisplayCache.get(String(message.senderId))
    : null;

  useEffect(() => {
    const cacheKey = message?.senderId ? String(message.senderId) : null;
    const senderToCache = senderFallback || message?.sender;
    if (cacheKey && senderToCache) {
      senderDisplayCache.set(cacheKey, senderToCache);
    }
  }, [message?.sender, message?.senderId, senderFallback]);

  useEffect(() => {
    if (
      isGroup &&
      !mine &&
      message?.senderId &&
      !message?.senderName &&
      !message?.sender?.displayName &&
      !fallbackSenderName
    ) {
      userService
        .getUserById(message.senderId)
        .then((res) => {
          if (res) {
            const sender = res.data || res;
            senderDisplayCache.set(String(message.senderId), sender);
            setFetchedSender(sender);
          }
        })
        .catch((err) => console.error("Failed to fetch sender", err));
    }
  }, [
    isGroup,
    mine,
    message?.senderId,
    message?.senderName,
    message?.sender?.displayName,
    fallbackSenderName,
  ]);

  const rawText = getMessageText(message);

  // Determine if message is seen by recipient
  const isSeen =
    message?.status === "seen" ||
    message?.isSeen === true ||
    message?.readAt !== undefined;

  // Parse forwarded message
  let isForwarded = Boolean(message?.originalMessageId);
  let fwData = null;
  let text = rawText;
  const messageType = String(message?.type || message?.messageType || "").toLowerCase();

  if (typeof rawText === "string" && rawText.startsWith("[FWM]::")) {
    isForwarded = true;
    try {
      fwData = JSON.parse(rawText.replace("[FWM]::", ""));
      text = fwData.text || "";
    } catch (e) {
      text = rawText;
    }
  } else if (isForwarded) {
    // Fallback for API forwarded message
    fwData = {
      senderName:
        message?.originalMessage?.senderName ||
        message?.originalMessage?.sender?.displayName ||
        message?.originalMessage?.sender?.username ||
        "Unknown",
      senderAvatarStr: "U",
      text:
        message?.originalMessage?.text ||
        message?.originalMessage?.content ||
        rawText ||
        "Forwarded Message",
    };
    if (fwData.senderName !== "Unknown") {
      fwData.senderAvatarStr = fwData.senderName.charAt(0).toUpperCase();
    }
  }

  // Simple check for attachments
  const messageFiles = message?.files || message?.media || [];

  // Extract all images
  const images = messageFiles.filter(
    (f) =>
      messageType === "image" ||
      f?.type === "image" ||
      f?.type === "IMAGE" ||
      f?.type?.startsWith("image/") ||
      f?.mimetype?.startsWith("image/") ||
      f?.url?.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i),
  );

  // If there's a top-level imageUrl but it's not in the array, add it
  if (message?.imageUrl && images.length === 0) {
    images.push({ url: message.imageUrl, type: "image/jpeg" });
  }

  // Extract all videos
  const videos = messageFiles.filter(
    (f) =>
      messageType === "video" ||
      f?.type === "video" ||
      f?.type === "VIDEO" ||
      f?.type?.startsWith("video/") ||
      f?.mimetype?.startsWith("video/") ||
      f?.url?.match(/\.(mp4|webm|ogg|mov)$/i),
  );

  // Extract all audios
  const audios = messageFiles.filter(
    (f) =>
      messageType === "voice" ||
      f?.type === "audio" ||
      f?.type === "voice" ||
      f?.type === "AUDIO" ||
      f?.type === "VOICE" ||
      f?.type?.startsWith("audio/") ||
      f?.mimetype?.startsWith("audio/") ||
      f?.url?.match(/\.(mp3|wav|ogg|m4a|aac)$/i),
  );

  const isImage = images.length > 0;
  const isVideo = videos.length > 0;
  const mediaItems = [...images, ...videos];
  const isMedia = mediaItems.length > 0;
  const isAudio = audios.length > 0;

  const isDocument =
    !isMedia &&
    !isAudio &&
    (messageType === "file" ||
      (messageFiles &&
        messageFiles.length > 0 &&
        !mediaItems.includes(messageFiles[0]) &&
        !audios.includes(messageFiles[0])));

  const isSystem = messageType === "system";
  const isPoll = messageType === "poll" || Boolean(message?.poll);
  const isProfileCard =
    messageType === "profile_card" ||
    Boolean(message?.profileCard || message?.profileCardUserId);
  const isReminder = Boolean(extractReminderFromMessage(message, text));
  const callMessage = parseCallMessage(message, text);
  const isCallMessage = Boolean(callMessage);

  const hasText = !!text && text.trim() !== "";

  const trimmedText = text ? text.trim() : "";
  const isJumboEmoji =
    !!JUMBO_EMOJI_ASSETS[trimmedText] &&
    text.replace(/\s+/g, "") === trimmedText &&
    !isMedia &&
    !isDocument &&
    !isAudio &&
    !isForwarded &&
    !isSystem &&
    !isCallMessage &&
    !isReminder &&
    !isPoll &&
    !isProfileCard;

  const onlyImagesOrVideos =
    isMedia && !hasText && !isDocument && !isAudio && !isForwarded && !isSystem;

  const senderName =
    fallbackSenderName ||
    cachedSender?.displayName ||
    cachedSender?.username ||
    cachedSender?.name ||
    fetchedSender?.displayName ||
    fetchedSender?.username ||
    fetchedSender?.name ||
    message?.senderName ||
    message?.sender?.displayName ||
    message?.sender?.username ||
    message?.sender?.name ||
    "Thành viên";

  if (isSystem) {
    let displaySystemText = text;
    if (displaySystemText.includes("Unknown User")) {
      const displaySender = mine
        ? "Bạn"
        : senderName !== "Unknown"
          ? senderName
          : "Ai đó";
      displaySystemText = displaySystemText.replace(
        "Unknown User",
        displaySender,
      );
    }
    return (
      <SystemMessage
        message={message}
        index={index}
        isFirst={isFirst}
        firstMessageRef={firstMessageRef}
        text={displaySystemText}
        hasUploadedWallpaper={hasUploadedWallpaper}
      />
    );
  }

  const senderAvatar =
    fetchedSender?.avatarUrl ||
    fetchedSender?.avatar ||
    cachedSender?.avatarUrl ||
    cachedSender?.avatar ||
    cachedSender?.profilePicture ||
    senderFallback?.avatarUrl ||
    senderFallback?.avatar ||
    senderFallback?.profilePicture ||
    message?.senderAvatar ||
    message?.sender?.avatar ||
    message?.sender?.avatarUrl ||
    message?.sender?.profilePicture ||
    null;

  const senderAvatarStr =
    senderName ? senderName.charAt(0).toUpperCase() : "?";
  const currentMessageId = getMessageId(message, index);
  const isContextActive =
    activeContextMessageId &&
    String(activeContextMessageId) === String(currentMessageId);
  const messageStatus = String(
    message?.status ||
      message?.messageStatus ||
      message?.state ||
      message?.action ||
      "",
  ).toLowerCase();
  const isRevokedMessage = Boolean(
    message.isRevoked ||
      message.deletedAt ||
      message.revoked ||
      message.isRecalled ||
      message.recalled ||
      message.deletedForEveryone ||
      message.isDeletedForEveryone ||
      message.revokedAt ||
      message.recalledAt ||
      messageStatus === "revoked" ||
      messageStatus === "recalled" ||
      messageStatus === "deleted_for_everyone",
  );
  const isEditedMessage = Boolean(
    message.isEdited ||
      message.edited ||
      message.isEditted ||
      message.editted ||
      message.editedAt ||
      message.edittedAt ||
      message.editHistory?.length ||
      messageStatus === "edited" ||
      messageStatus === "editted",
  );

  if (isRevokedMessage) {
    return (
      <RevokedMessage
        message={message}
        index={index}
        isFirst={isFirst}
        firstMessageRef={firstMessageRef}
        mine={mine}
        isGroup={isGroup}
        isFirstInSequence={isFirstInSequence}
        isLastInSequence={isLastInSequence}
        senderName={senderName}
        senderAvatarStr={senderAvatarStr}
        wallpaperTheme={wallpaperTheme}
      />
    );
  }

  return (
    <div
      className={`telegram-message-row w-full flex ${mine ? "justify-end" : "justify-start"} items-end gap-2 ${isLastInSequence ? "mb-1.5" : "mb-[2px]"} group ${
        isContextActive ? "telegram-message-row-active" : ""
      } ${
        isContextActive && activeContextMenuClosing
          ? "telegram-message-row-active-closing"
          : ""
      }`}
      data-message-row="true"
      data-message-id={currentMessageId}
      onContextMenu={(e) => handleContextMenu(e, message)}
    >
      <style>{`
        @keyframes reactionChipIn {
          from { opacity: 0; transform: translateY(-3px) scale(0.88); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes outgoingMessageIn {
          0% { transform: translate3d(0, 8px, 0) scale(0.985); }
          70% { transform: translate3d(0, -1px, 0) scale(1.002); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        .telegram-message-sending {
          animation: outgoingMessageIn 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
          transform-origin: right bottom;
          will-change: transform;
        }
      `}</style>
      {isGroup && !mine && (
        <div
          className="w-7 h-7 rounded-full shrink-0 overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shadow-sm mb-0.5"
          style={{ opacity: isLastInSequence ? 1 : 0 }}
        >
          {isLastInSequence ? (
            senderAvatar ? (
              <img
                src={senderAvatar}
                alt={senderName}
                className="w-full h-full object-cover"
              />
            ) : (
              senderAvatarStr
            )
          ) : (
            ""
          )}
        </div>
      )}
      <div
        ref={isFirst ? firstMessageRef : null}
        id={`message-${message.id || message._id}`}
        key={currentMessageId}
        data-message-id={currentMessageId}
        className={`w-fit max-w-[464px] mx-[6px] text-[14px] md:text-[15px] flex flex-col relative select-none ${
          isJumboEmoji
            ? ""
            : `telegram-bubble ${mine ? "telegram-bubble-mine" : "telegram-bubble-other"} ${
                isFirstInSequence ? "telegram-bubble-first" : "telegram-bubble-middle"
              } ${
                isLastInSequence ? "telegram-bubble-last telegram-bubble-tail" : "telegram-bubble-middle"
              }`
        } ${message.status === "sending" && mine ? "telegram-message-sending" : ""} ${
          isJumboEmoji
            ? mine
              ? "self-end bg-transparent"
              : "self-start bg-transparent"
            : mine
              ? `self-end text-gray-900 dark:text-emerald-50 ${isCallMessage ? "min-w-[242px]" : ""}`
              : `self-start text-gray-800 dark:text-gray-100 ${isCallMessage ? "min-w-[242px]" : ""}`
        }`}
      >
        {isGroup &&
          !mine &&
          isFirstInSequence &&
          !isForwarded &&
          !isJumboEmoji && (
            <span
              className={`text-[12.5px] font-semibold px-3 pt-[5px] pb-0 block leading-tight ${
                wallpaperTheme?.sender || "text-blue-600 dark:text-blue-400"
              }`}
            >
              {senderName}
            </span>
          )}
        {isForwarded && fwData && <ForwardedMessageHeader fwData={fwData} />}
        <QuotedMessageHeader
          message={message}
          messages={messages}
          mine={mine}
          currentUserId={currentUserId}
          onNavigateToMessage={onNavigateToMessage}
          wallpaperTheme={wallpaperTheme}
        />

        {isMedia && (
          <MessageMedia
            message={message}
            mediaItems={mediaItems}
            images={images}
            hasText={hasText}
            onlyImagesOrVideos={onlyImagesOrVideos}
            mine={mine}
            isSeen={isSeen}
            setPreviewVideoUrl={setPreviewVideoUrl}
          />
        )}

        {isAudio && <MessageAudio audios={audios} mine={mine} />}

        {isDocument && (
          <MessageDocument
            message={message}
            messageFiles={messageFiles}
            mine={mine}
          />
        )}

        {isReminder ? (
          <ReminderMessage message={message} text={text} mine={mine} />
        ) : isPoll ? (
          <PollMessage
            message={message}
            mine={mine}
            currentUserId={currentUserId}
            onPollUpdated={onPollUpdated}
          />
        ) : isProfileCard ? (
          <ProfileCardMessage
            message={message}
            text={text}
            mine={mine}
            onOpenChat={onOpenChat}
          />
        ) : isCallMessage ? (
          <CallMessageBubble message={message} text={text} mine={mine} />
        ) : (
          !onlyImagesOrVideos && !isAudio && <MessageText message={message} text={text} mine={mine} isSeen={isSeen} />
        )}

        {/* Bottom area: Reactions + Timestamp */}
        <div
          className={`flex items-end gap-2 px-[7px] flex-row flex-wrap justify-between ${
            (!message.reactions || message.reactions.length === 0) && !isPoll
              ? "absolute bottom-[7px] right-[6px] w-auto pt-0 pb-0"
              : "w-full pt-1 pb-1"
          } z-10`}
        >
          {/* Render selected reactions */}
          {message?.reactions && message.reactions.length > 0 && (
            <div className="flex max-w-[390px] flex-wrap justify-start gap-1">
              {message.reactions.map((r, i) => {
                const hasMyReaction = r.users?.some(
                  (u) => String(u._id || u.id) === String(currentUserId),
                );
                return (
                  <div
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      const msgId = message._id || message.id;
                      if (hasMyReaction) {
                        socketService
                          .removeReaction(msgId, r.emoji)
                          .catch(console.error);
                      } else {
                        socketService
                          .addReaction(msgId, r.emoji)
                          .catch(console.error);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReactionView({
                        emoji: r.emoji,
                        users: r.users,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    className={`flex cursor-pointer items-center space-x-1 rounded-full border px-1.5 py-[2px] shadow-sm backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95 ${
                      hasMyReaction
                        ? mine
                          ? "border-emerald-500/40 bg-emerald-500/90 text-white shadow-emerald-900/10 dark:border-emerald-400/30 dark:bg-emerald-600/85"
                          : "border-blue-500/40 bg-blue-500/90 text-white shadow-blue-900/10 dark:border-blue-400/30 dark:bg-blue-600/85"
                        : "border-white/70 bg-white/90 text-gray-700 shadow-slate-900/10 dark:border-slate-600/70 dark:bg-slate-700/90 dark:text-gray-100"
                    }`}
                    style={{
                      fontSize: "12px",
                      lineHeight: "18px",
                      animation: "reactionChipIn 180ms cubic-bezier(0.16, 1, 0.3, 1) both",
                      animationDelay: `${i * 22}ms`,
                    }}
                  >
                    <span className="leading-none">{r.emoji}</span>
                    {message.reactions.length >= 3 && (
                      <span
                        className={`font-semibold text-[11px] ${hasMyReaction ? "text-white" : "text-gray-600 dark:text-gray-300"}`}
                        style={{ paddingLeft: "1px", paddingRight: "1px" }}
                      >
                        {r.count}
                      </span>
                    )}
                    {message.reactions.length < 3 && (
                      <div className="flex -space-x-1 ml-0.5">
                        {r.users?.slice(0, 3).map((u, idx) => (
                          <div
                            key={idx}
                            className={`w-[18px] h-[18px] rounded-full overflow-hidden border bg-gray-200 flex items-center justify-center text-[8.5px] font-bold text-gray-500 shrink-0 ${hasMyReaction ? (mine ? "border-emerald-500 dark:border-emerald-600" : "border-blue-500 dark:border-blue-600") : "border-white dark:border-slate-800"}`}
                          >
                            {u.avatar || u.avatarUrl || u.profilePicture ? (
                              <img
                                src={
                                  u.avatar || u.avatarUrl || u.profilePicture
                                }
                                alt="User"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (u.displayName || u.username || u.name || "?")
                                .charAt(0)
                                .toUpperCase()
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Render Timestamp */}
          <div
            className={`shrink-0 flex items-center justify-end gap-[4px] font-medium tracking-tight leading-none ml-auto ${
              isJumboEmoji ||
              (onlyImagesOrVideos &&
                (!message.reactions || message.reactions.length === 0))
                ? "px-[6px] py-[2px] bg-black/25 dark:bg-black/35 backdrop-blur-sm rounded-full text-white pointer-events-none text-[11px] shadow-sm ml-auto z-20"
                : mine
                  ? "text-emerald-700/80 dark:text-emerald-200/80 text-[10.5px]"
                  : "text-gray-400 dark:text-gray-500 text-[10.5px]"
            }`}
          >
            {message.pinned === true && (
              <FiMapPin
                className="text-[14px] md:text-[15px] text-blue-500 dark:text-blue-400"
                strokeWidth={2.5}
              />
            )}
            {isEditedMessage && (
              <span
                className={`italic font-semibold ${(isJumboEmoji || onlyImagesOrVideos) && (!message.reactions || message.reactions.length === 0) ? "text-[10px]" : "opacity-75 text-[10px]"}`}
              >
                edited
              </span>
            )}
            <span>{getMessageTime(message)}</span>
            {mine && (
              <>
                {isSeen ? (
                  <FiEye className="text-[12px]" />
                ) : (
                  <FiCheck className="text-[12px]" />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reaction View Popover */}
      {reactionView && (
        <>
          <div
            className="fixed inset-0 z-50 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              setReactionView(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setReactionView(null);
            }}
          ></div>
          <div
            className="fixed z-[60] bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700/60 rounded-xl p-2 min-w-[160px] max-w-[220px]"
            style={{
              top: Math.min(reactionView.y, window.innerHeight - 200),
              left: Math.min(reactionView.x, window.innerWidth - 180),
            }}
          >
            <div className="text-[13px] font-semibold mb-2 px-1 border-b border-gray-100 dark:border-slate-700/60 pb-1.5 dark:text-gray-200 flex items-center gap-1.5">
              <span>{reactionView.emoji}</span>
              <span className="text-gray-500 font-normal ml-1">
                Đã thả cảm xúc ({reactionView.users?.length || 0})
              </span>
            </div>
            <div className="max-h-[160px] overflow-y-auto w-full custom-scrollbar pr-1">
              {reactionView.users?.map((u, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg cursor-default"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 border border-gray-100 dark:border-slate-700 shrink-0 flex items-center justify-center">
                    {u.avatar || u.avatarUrl || u.profilePicture ? (
                      <img
                        src={u.avatar || u.avatarUrl || u.profilePicture}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] font-bold text-gray-500">
                        {(u.displayName || u.username || u.name || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] truncate dark:text-gray-300 font-medium">
                    {u.displayName || u.username || u.name || "Unknown"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
