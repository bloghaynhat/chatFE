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
  const [reactionView, setReactionView] = useState(null);

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

  const senderName =
    fetchedSender?.displayName ||
    fetchedSender?.username ||
    message?.senderName ||
    message?.sender?.displayName ||
    message?.sender?.username ||
    message?.sender?.name ||
    "Unknown";

  if (isSystem) {
    let displaySystemText = text;
    if (displaySystemText.includes("Unknown User")) {
      const displaySender = mine ? "Bạn" : (senderName !== "Unknown" ? senderName : "Ai đó");
      displaySystemText = displaySystemText.replace("Unknown User", displaySender);
    }
    return (
      <SystemMessage
        message={message}
        index={index}
        isFirst={isFirst}
        firstMessageRef={firstMessageRef}
        text={displaySystemText}
      />
    );
  }

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
    <div
      className={`w-full flex ${mine ? "justify-end" : "justify-start"} items-end gap-2 ${isLastInSequence ? "mb-2.5" : "mb-[2px]"} group`}
    >
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
        className={`w-fit max-w-[464px] mx-[8px] rounded-2xl text-sm shadow-sm flex flex-col relative ${
          mine
            ? "self-end bg-[#d9fdd3] dark:bg-emerald-900/70 text-gray-900 dark:text-emerald-50 rounded-br-md border border-transparent dark:border-slate-700/50"
            : "self-start bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-slate-700/50"
        }`}
      >
        {isGroup && !mine && isFirstInSequence && !isForwarded && (
          <span className="text-[12.5px] font-semibold text-blue-600 dark:text-blue-400 px-3 pt-[5px] pb-0 block leading-tight">
            {senderName}
          </span>
        )}
        {isForwarded && fwData && <ForwardedMessageHeader fwData={fwData} />}
        <QuotedMessageHeader message={message} messages={messages} mine={mine} currentUserId={currentUserId} />

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

        {/* Bottom area: Reactions + Timestamp */}
        <div
          className={`flex items-end gap-[6px] px-2 pb-[3px] flex-row flex-wrap justify-between ${!message.reactions || message.reactions.length === 0 ? "absolute bottom-[3px] right-[4px] w-auto" : "w-full"} z-10`}
        >
          {/* Render selected reactions */}
          {message?.reactions && message.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 max-w-[390px] justify-start`}>
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
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReactionView({ emoji: r.emoji, users: r.users, x: e.clientX, y: e.clientY });
                    }}
                    className={`rounded-[100px] px-2 py-[3px] flex items-center space-x-1 cursor-pointer border shadow-sm transition-colors ${hasMyReaction ? (mine ? "bg-[#55b25f] border-[#55b25f] dark:bg-[#489951] dark:border-[#489951]" : "bg-[#3895e6] border-[#3895e6] dark:bg-[#307bbd] dark:border-[#307bbd]") : "bg-gray-50/90 border-gray-200 dark:bg-slate-700 dark:border-slate-600"}`}
                    style={{ fontSize: "12.5px", lineHeight: "20px" }}
                  >
                    <span>{r.emoji}</span>
                    {message.reactions.length >= 3 && (
                      <span
                        className={`font-semibold text-[11.5px] ${hasMyReaction ? "text-white" : "text-gray-600 dark:text-gray-300"}`}
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
                            className={`w-[20px] h-[20px] rounded-full overflow-hidden border bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500 shrink-0 ${hasMyReaction ? (mine ? "border-[#55b25f] dark:border-[#489951]" : "border-[#3895e6] dark:border-[#307bbd]") : "border-white dark:border-slate-800"}`}
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
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Render Timestamp */}
          <div
            className={`shrink-0 flex items-center justify-end gap-[4px] font-medium tracking-tight ml-auto ${
              onlyImagesOrVideos && (!message.reactions || message.reactions.length === 0)
                ? "px-1.5 py-0.5 bg-black/40 rounded-full text-white pointer-events-none text-[11px]"
                : mine
                  ? "text-emerald-700/80 dark:text-emerald-200/80 text-[10.5px]"
                  : "text-gray-400 dark:text-gray-500 text-[10.5px]"
            }`}
          >
            {message.isEdited && (
              <span
                className={`italic font-semibold ${onlyImagesOrVideos && (!message.reactions || message.reactions.length === 0) ? "text-[10px]" : "opacity-75 text-[10px]"}`}
              >
                edited
              </span>
            )}
            <span>{getMessageTime(message)}</span>
            {mine && <>{isSeen ? <FiEye className="text-[12px]" /> : <FiCheck className="text-[12px]" />}</>}
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
              <span className="text-gray-500 font-normal ml-1">Đã thả cảm xúc ({reactionView.users?.length || 0})</span>
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
                        {(u.displayName || u.username || u.name || "?").charAt(0).toUpperCase()}
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
