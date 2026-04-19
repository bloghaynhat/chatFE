import { useState, useEffect, useRef } from "react";
import { FiCheck, FiDownload, FiEye } from "react-icons/fi";
import { PhotoView } from "react-photo-view";
import { getMessageId, getMessageText, getMessageTime } from "../../../utils/chatUtils";
import userService from "../../../services/userService";
import { SystemMessage } from "./MessageTypes/SystemMessage";
import { RevokedMessage } from "./MessageTypes/RevokedMessage";
import { MessageMedia } from "./MessageTypes/MessageMedia";
import { MessageAudio } from "./MessageTypes/MessageAudio";
import { MessageDocument } from "./MessageTypes/MessageDocument";
import { MessageText } from "./MessageTypes/MessageText";
import { ForwardedMessageHeader } from "./MessageTypes/ForwardedMessageHeader";
import { QuotedMessageHeader } from "./MessageTypes/QuotedMessageHeader";
import { socketService } from "../../../services/socketService";
import { conversationService } from "../../../services/conversationService";
import { useAuth } from "../../../hooks";

const DEFAULT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

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
  setPreviewVideoUrl,
  currentUserId,
}) => {
  const [fetchedSender, setFetchedSender] = useState(null);

  useEffect(() => {
    if (isGroup && !mine && message?.senderId && !message?.senderName && !message?.sender?.displayName) {
      userService
        .getUserById(message.senderId)
        .then((res) => {
          if (res) {
            setFetchedSender(res.data || res);
          }
        })
        .catch((err) => console.error("Failed to fetch sender", err));
    }
  }, [isGroup, mine, message?.senderId, message?.senderName, message?.sender?.displayName]);

  const rawText = getMessageText(message);

  // Determine if message is seen by recipient
  const isSeen = message?.status === "seen" || message?.isSeen === true || message?.readAt !== undefined;

  // Parse forwarded message
  let isForwarded = Boolean(message?.originalMessageId);
  let fwData = null;
  let text = rawText;

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
      text: message?.originalMessage?.text || message?.originalMessage?.content || rawText || "Forwarded Message",
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
      f?.type === "video" ||
      f?.type === "VIDEO" ||
      f?.type?.startsWith("video/") ||
      f?.mimetype?.startsWith("video/") ||
      f?.url?.match(/\.(mp4|webm|ogg|mov)$/i),
  );

  // Extract all audios
  const audios = messageFiles.filter(
    (f) =>
      f?.type === "audio" ||
      f?.type === "AUDIO" ||
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
    (message?.type === "document" ||
      message?.type === "DOCUMENT" ||
      message?.type === "file" ||
      (messageFiles &&
        messageFiles.length > 0 &&
        !mediaItems.includes(messageFiles[0]) &&
        !audios.includes(messageFiles[0])));

  const isSystem = message?.type === "system" || message?.type === "SYSTEM";

  const hasText = !!text && text.trim() !== "";
  const onlyImagesOrVideos = isMedia && !hasText && !isDocument && !isAudio && !isForwarded && !isSystem;

  if (isSystem) {
    return (
      <SystemMessage message={message} index={index} isFirst={isFirst} firstMessageRef={firstMessageRef} text={text} />
    );
  }

  const senderName =
    fetchedSender?.displayName ||
    fetchedSender?.username ||
    message?.senderName ||
    message?.sender?.displayName ||
    message?.sender?.username ||
    message?.sender?.name ||
    "Unknown";

  const senderAvatar =
    fetchedSender?.avatarUrl ||
    fetchedSender?.avatar ||
    message?.senderAvatar ||
    message?.sender?.avatar ||
    message?.sender?.avatarUrl ||
    message?.sender?.profilePicture ||
    null;

  const senderAvatarStr = senderName !== "Unknown" ? senderName.charAt(0).toUpperCase() : "?";

  if (message.isRevoked || message.deletedAt) {
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
      />
    );
  }

  return (
    <div className={`w-full flex ${mine ? "justify-end" : "justify-start"} items-end gap-2 mb-1 group`}>
      {isGroup && !mine && (
        <div
          className="w-7 h-7 rounded-full shrink-0 overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shadow-sm mb-0.5"
          style={{ opacity: isLastInSequence ? 1 : 0 }}
        >
          {isLastInSequence ? (
            senderAvatar ? (
              <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
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
        key={getMessageId(message, index)}
        onContextMenu={(e) => handleContextMenu(e, message)}
        className={`w-fit max-w-[74%] lg:max-w-[68%] rounded-2xl text-sm shadow-sm flex flex-col relative ${
          mine
            ? "self-end bg-[#d9fdd3] dark:bg-emerald-900/70 text-gray-900 dark:text-emerald-50 rounded-br-md border border-transparent dark:border-slate-700/50"
            : "self-start bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-slate-700/50"
        }`}
      >
        {isGroup && !mine && isFirstInSequence && !isForwarded && (
          <span className="text-[12.5px] font-semibold text-blue-600 dark:text-blue-400 px-3 pt-2 pb-0 block">
            {senderName}
          </span>
        )}
        {isForwarded && fwData && <ForwardedMessageHeader fwData={fwData} />}
        <QuotedMessageHeader message={message} messages={messages} mine={mine} />

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

        {isAudio && <MessageAudio audios={audios} mine={mine} hasText={hasText} />}

        {isDocument && <MessageDocument message={message} messageFiles={messageFiles} mine={mine} />}

        {!onlyImagesOrVideos && <MessageText message={message} text={text} mine={mine} isSeen={isSeen} />}

        {/* Render selected reactions */}
        {message?.reactions && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 px-1.5 pb-1.5 -mt-0.5 z-10 ${mine ? "justify-end" : "justify-start"}`}>
            {message.reactions.map((r, i) => {
              const hasMyReaction = r.users?.some((u) => String(u._id || u.id) === String(currentUserId));
              return (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    const msgId = message._id || message.id;
                    if (hasMyReaction) {
                      conversationService.removeReactionMessage(msgId, r.emoji).catch(console.error);
                    } else {
                      conversationService.reactMessage(msgId, r.emoji).catch(console.error);
                    }
                  }}
                  className={`rounded-full px-1.5 py-[2px] flex items-center space-x-1 cursor-pointer border shadow-sm ${hasMyReaction ? "bg-blue-50/90 border-blue-200 dark:bg-blue-900/40 dark:border-blue-800" : "bg-gray-50/90 border-gray-200 dark:bg-slate-700 dark:border-slate-600"}`}
                  style={{ fontSize: "11.5px", lineHeight: "18px" }}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && (
                    <span
                      className={`font-semibold ${hasMyReaction ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"}`}
                    >
                      {r.count}
                    </span>
                  )}
                  <div className="flex -space-x-1 ml-0.5">
                    {r.users?.slice(0, 3).map((u, idx) => (
                      <div
                        key={idx}
                        className="w-[18px] h-[18px] rounded-full overflow-hidden border border-white dark:border-slate-800 bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500"
                      >
                        {u.avatar || u.avatarUrl || u.profilePicture ? (
                          <img
                            src={u.avatar || u.avatarUrl || u.profilePicture}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (u.displayName || u.username || u.name || "?").charAt(0).toUpperCase()
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
