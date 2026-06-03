type PreviewLanguage = "en" | "vi";

const getLanguage = (language?: string): PreviewLanguage =>
  language === "vi" ? "vi" : "en";

const formatCallDuration = (seconds?: number) => {
  const duration = Number(seconds);
  if (!Number.isFinite(duration) || duration <= 0) return "";
  const safeSeconds = Math.floor(duration);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const rest = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
};

const getCallPreview = (message: any, language: PreviewLanguage) => {
  const call = message?.call || message?.callMetadata || message?.metadata?.call;
  const isVideo = call?.callType === "video";
  const status = String(call?.status || "").toLowerCase();
  const duration = formatCallDuration(call?.durationSeconds);

  if (status === "missed") {
    if (language === "vi") return isVideo ? "Cuộc gọi video nhỡ" : "Cuộc gọi thoại nhỡ";
    return isVideo ? "Missed video call" : "Missed voice call";
  }

  const label = language === "vi"
    ? isVideo
      ? "Cuộc gọi video"
      : "Cuộc gọi thoại"
    : isVideo
      ? "Video call"
      : "Voice call";
  return duration ? `${label} ${duration}` : label;
};

const translateKnownPreviewText = (value: string, language: PreviewLanguage) => {
  const text = value.trim();
  if (!text) return text;

  const exact: Record<PreviewLanguage, Record<string, string>> = {
    en: {
      "Tin nhắn đã thu hồi": "Message recalled",
      "Một thành viên đã rời khỏi nhóm": "A member left the group",
      "Có thành viên mới được thêm vào nhóm": "A new member was added to the group",
      "Bạn đã rời khỏi nhóm này.": "You left this group.",
      "Tin nhắn mới từ người lạ": "New message from a stranger",
      "Đã gửi media": "Sent a media file",
      "Tin nhắn mock để preview khung chat giống ảnh tham chiếu.": "Mock message for previewing the chat layout.",
      "No messages": "No messages",
      "Poll": "Poll",
      "Sent a photo": "Sent a photo",
      "Sent a video": "Sent a video",
      "Sent a voice message": "Sent a voice message",
      "Sent a file": "Sent a file",
      "Sent a media file": "Sent a media file",
    },
    vi: {
      "Tin nhắn đã thu hồi": "Tin nhắn đã thu hồi",
      "Một thành viên đã rời khỏi nhóm": "Một thành viên đã rời khỏi nhóm",
      "Có thành viên mới được thêm vào nhóm": "Có thành viên mới được thêm vào nhóm",
      "Bạn đã rời khỏi nhóm này.": "Bạn đã rời khỏi nhóm này.",
      "Tin nhắn mới từ người lạ": "Tin nhắn mới từ người lạ",
      "Đã gửi media": "Đã gửi media",
      "Tin nhắn mock để preview khung chat giống ảnh tham chiếu.": "Tin nhắn mock để preview khung chat giống ảnh tham chiếu.",
      "No messages": "Chưa có tin nhắn",
      "Poll": "Bình chọn",
      "Sent a photo": "Đã gửi ảnh",
      "Sent a video": "Đã gửi video",
      "Sent a voice message": "Đã gửi tin nhắn thoại",
      "Sent a file": "Đã gửi tệp",
      "Sent a media file": "Đã gửi media",
    },
  };

  if (exact[language][text]) return exact[language][text];

  const pollPrefix = text.match(/^Poll:\s*(.+)$/i);
  if (pollPrefix) {
    return language === "vi"
      ? `Bình chọn: ${pollPrefix[1]}`
      : `Poll: ${pollPrefix[1]}`;
  }

  const createdGroup = text.match(/^(.+?)\s+đã tạo nhóm$/i);
  if (createdGroup) {
    return language === "vi" ? text : `${createdGroup[1]} created the group`;
  }

  const lockedPoll = text.match(/^Đã khóa bình chọn\s+"(.+)"$/i);
  if (lockedPoll) {
    return language === "vi" ? text : `Closed poll "${lockedPoll[1]}"`;
  }

  const leftGroup = text.match(/^(.+?)\s+đã rời khỏi nhóm$/i);
  if (leftGroup) {
    return language === "vi" ? text : `${leftGroup[1]} left the group`;
  }

  const addedMember = text.match(/^(.+?)\s+đã thêm\s+(.+?)\s+vào nhóm$/i);
  if (addedMember) {
    return language === "vi"
      ? text
      : `${addedMember[1]} added ${addedMember[2]} to the group`;
  }

  const removedMember = text.match(/^(.+?)\s+đã xóa\s+(.+?)\s+khỏi nhóm$/i);
  if (removedMember) {
    return language === "vi"
      ? text
      : `${removedMember[1]} removed ${removedMember[2]} from the group`;
  }

  return text;
};

export const getChatMessagePreview = (message: any, language?: string) => {
  const previewLanguage = getLanguage(language);

  if (!message) return translateKnownPreviewText("No messages", previewLanguage);

  if (message.isRevoked || message.deletedAt) {
    return translateKnownPreviewText("Tin nhắn đã thu hồi", previewLanguage);
  }

  const type = String(message.type || message.messageType || "").toLowerCase();
  if (type.includes("call")) {
    return getCallPreview(message, previewLanguage);
  }

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
    return translateKnownPreviewText(text, previewLanguage);
  }

  if (type.includes("poll")) {
    return message.poll?.question
      ? translateKnownPreviewText(`Poll: ${message.poll.question}`, previewLanguage)
      : translateKnownPreviewText("Poll", previewLanguage);
  }

  if (type.includes("sticker")) return "Sticker";
  if (type.includes("gif")) return "GIF";

  const media = message.media || message.files || message.attachments || [];
  const firstMedia = Array.isArray(media) ? media[0] : media;
  const mediaType = String(firstMedia?.type || firstMedia?.mimetype || firstMedia?.mimeType || "").toLowerCase();

  if (type.includes("image") || mediaType.includes("image")) return translateKnownPreviewText("Sent a photo", previewLanguage);
  if (type.includes("video") || mediaType.includes("video")) return translateKnownPreviewText("Sent a video", previewLanguage);
  if (type.includes("voice") || type.includes("audio") || mediaType.includes("voice") || mediaType.includes("audio")) return translateKnownPreviewText("Sent a voice message", previewLanguage);
  if (type.includes("file") || mediaType) return translateKnownPreviewText("Sent a file", previewLanguage);
  if (type.includes("media") || (Array.isArray(media) && media.length > 0)) return translateKnownPreviewText("Sent a media file", previewLanguage);

  return translateKnownPreviewText("No messages", previewLanguage);
};
