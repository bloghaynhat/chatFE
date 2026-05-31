export const getChatMessagePreview = (message: any) => {
  if (!message) return "No messages";

  const text =
    message.textPreview ||
    message.preview ||
    message.text ||
    message.content ||
    message.body ||
    message.message ||
    message.caption ||
    message.lastMessageText ||
    message.lastMessageContent;

  if (typeof text === "string" && text.trim()) {
    return text.trim();
  }

  const type = String(message.type || message.messageType || "").toLowerCase();
  const media = message.media || message.files || message.attachments || [];
  const firstMedia = Array.isArray(media) ? media[0] : media;
  const mediaType = String(firstMedia?.type || firstMedia?.mimetype || firstMedia?.mimeType || "").toLowerCase();

  if (type.includes("image") || mediaType.includes("image")) return "Sent a photo";
  if (type.includes("video") || mediaType.includes("video")) return "Sent a video";
  if (type.includes("audio") || mediaType.includes("audio")) return "Sent a voice message";
  if (type.includes("document") || type.includes("file") || mediaType) return "Sent a file";
  if (type.includes("media") || (Array.isArray(media) && media.length > 0)) return "Sent a media file";

  return "No messages";
};
