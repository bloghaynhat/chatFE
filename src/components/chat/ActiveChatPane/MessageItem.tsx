import { FiCheck, FiDownload, FiEye } from "react-icons/fi";
import { PhotoView } from "react-photo-view";
import { getMessageId, getMessageText, getMessageTime } from "../../../utils/chatUtils";

export const MessageItem = ({
  message,
  index,
  isFirst,
  firstMessageRef,
  mine,
  handleContextMenu,
  setPreviewVideoUrl,
}) => {
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
      <div
        ref={isFirst ? firstMessageRef : null}
        key={getMessageId(message, index)}
        className="w-full flex justify-center my-1"
      >
        <div className="text-[12.5px] font-medium px-3 py-1 bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200 rounded-full shadow-sm text-center max-w-[80%] inline-block">
          {text}
        </div>
      </div>
    );
  }

  if (message.isRevoked || message.deletedAt) {
    return (
      <div
        ref={isFirst ? firstMessageRef : null}
        key={getMessageId(message, index)}
        className={`w-fit max-w-[74%] lg:max-w-[68%] rounded-2xl text-[14px] shadow-sm flex flex-col relative px-3 py-2 border border-gray-100 dark:border-slate-700/50 bg-black/[0.02] dark:bg-white/[0.02] ${
          mine ? "self-end rounded-br-md" : "self-start rounded-bl-md"
        }`}
      >
        <span className="text-gray-500 dark:text-gray-400 italic font-medium">Message recalled</span>
      </div>
    );
  }

  return (
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
      {isForwarded && fwData && (
        <div className="px-2.5 pt-2 pb-1 flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">Forwarded from</span>
          <div className="flex items-center gap-1.5 opacity-90">
            <div className="w-[18px] h-[18px] rounded-full bg-pink-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0 shadow-sm">
              {fwData.senderAvatarStr || "U"}
            </div>
            <span className="font-semibold text-[14px] text-emerald-700 dark:text-emerald-300 tracking-tight">
              {fwData.senderName || "Unknown"}
            </span>
          </div>
        </div>
      )}

      {isMedia && (
        <div className={`p-1 cursor-pointer overflow-hidden ${hasText ? "pb-0 rounded-t-lg" : "rounded-lg"} relative`}>
          {mediaItems.length === 1 ? (
            images.includes(mediaItems[0]) ? (
              <PhotoView src={mediaItems[0].url || mediaItems[0].preview || mediaItems[0]}>
                <img
                  src={mediaItems[0].url || mediaItems[0].preview || mediaItems[0]}
                  alt="Message image"
                  className="w-full max-w-[340px] max-h-[400px] rounded-lg object-contain"
                />
              </PhotoView>
            ) : (
              <div
                className="relative w-full rounded-lg bg-black overflow-hidden group flex justify-center items-center cursor-pointer"
                onClick={() =>
                  setPreviewVideoUrl(
                    mediaItems[0].url ||
                      mediaItems[0].preview ||
                      (typeof mediaItems[0] === "string" ? mediaItems[0] : ""),
                  )
                }
              >
                <video
                  src={
                    mediaItems[0].url ||
                    mediaItems[0].preview ||
                    (typeof mediaItems[0] === "string" ? mediaItems[0] : "")
                  }
                  className="w-full h-auto max-h-[400px] object-contain pointer-events-none"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm shadow-xl hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <a
                  href={
                    mediaItems[0].url ||
                    mediaItems[0].preview ||
                    (typeof mediaItems[0] === "string" ? mediaItems[0] : "")
                  }
                  download={mediaItems[0].filename || mediaItems[0].name || "video.mp4"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiDownload className="text-sm" />
                </a>
              </div>
            )
          ) : (
            <div
              className={`grid gap-0.5 rounded-lg overflow-hidden max-w-[340px] ${
                mediaItems.length === 2 || mediaItems.length === 4
                  ? "grid-cols-2"
                  : mediaItems.length === 3
                    ? "grid-cols-2"
                    : "grid-cols-3"
              }`}
            >
              {mediaItems.map((media, i) => {
                const isImg = images.includes(media);
                const mediaUrl = media.url || media.preview || (typeof media === "string" ? media : "");

                if (isImg) {
                  return (
                    <PhotoView key={i} src={mediaUrl}>
                      <div
                        className={`relative ${
                          mediaItems.length === 3 && i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                        }`}
                      >
                        <img src={mediaUrl} alt={`Image ${i}`} className="w-full h-full object-cover" />
                      </div>
                    </PhotoView>
                  );
                } else {
                  return (
                    <div
                      key={i}
                      className={`relative w-full bg-black group flex justify-center items-center cursor-pointer ${
                        mediaItems.length === 3 && i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                      }`}
                      onClick={() => setPreviewVideoUrl(mediaUrl)}
                    >
                      <video src={mediaUrl} className="w-full h-full object-cover pointer-events-none" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm shadow-xl hover:scale-110 transition-transform">
                          <svg
                            className="w-5 h-5 ml-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                      <a
                        href={mediaUrl}
                        download={media.filename || media.name || "video.mp4"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiDownload className="text-[11px]" />
                      </a>
                    </div>
                  );
                }
              })}
            </div>
          )}
          {onlyImagesOrVideos && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 rounded-full flex items-center justify-end gap-[4px] text-white pointer-events-none">
              {message.isEdited && <span className="italic font-semibold text-[10px]">edited</span>}
              <span className="text-[11px] font-medium leading-none">{getMessageTime(message)}</span>
              {mine && <>{isSeen ? <FiEye className="text-[13px]" /> : <FiCheck className="text-[13px]" />}</>}
            </div>
          )}
        </div>
      )}

      {isAudio && (
        <div className={`p-2 flex flex-col gap-2 ${hasText ? "pb-1" : ""}`}>
          {audios.map((aud, i) => {
            const audUrl = aud.url || aud.preview || (typeof aud === "string" ? aud : "");
            return (
              <div key={i} className="flex flex-col gap-1 w-full max-w-[240px] md:max-w-[280px]">
                <audio
                  controls
                  src={audUrl}
                  className={`w-full h-10 outline-none ${mine ? "" : "filter brightness-90 dark:brightness-100"}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {isDocument &&
        (() => {
          const file = message?.file || (messageFiles && messageFiles[0]);
          const fileName = file?.name || file?.filename || file?.originalName || "Document";
          const fileSize = file?.size ? `${(file.size / 1024).toFixed(0)} KB` : "";
          const fileUrl = file?.url || file?.preview || (typeof file === "string" ? file : "");
          return (
            <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-t-2xl gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${mine ? "bg-emerald-600" : "bg-blue-500"}`}
                >
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-xl"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium truncate hover:underline cursor-pointer text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {fileName}
                  </a>
                  <span className="text-xs opacity-70">{fileSize}</span>
                </div>
              </div>
              {fileUrl && (
                <a
                  href={fileUrl}
                  download={fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiDownload className="text-lg" />
                </a>
              )}
            </div>
          );
        })()}

      {!onlyImagesOrVideos && (
        <div className="px-3 pb-2 pt-2 cursor-default relative">
          {!!text && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{text}</p>}
          <p
            className={`mt-1 text-[11.5px] font-medium tracking-tight flex items-center justify-end gap-[5px] ${mine ? "text-emerald-700/80 dark:text-emerald-200/80" : "text-gray-400 dark:text-gray-500"}`}
          >
            {message.isEdited && (
              <span className="italic font-semibold opacity-75 text-[10.5px] tracking-normal">edited</span>
            )}
            <span>{getMessageTime(message)}</span>
            {mine && <>{isSeen ? <FiEye className="text-[13px]" /> : <FiCheck className="text-[13px]" />}</>}
          </p>
        </div>
      )}
    </div>
  );
};
