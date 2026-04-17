export const getMessageId = (message, index) =>
  message?.id || message?._id || `${index}-${message?.createdAt || "msg"}`;

export const getMessageText = (message) =>
  message?.text || message?.content || message?.message || "";

export const getMessageTime = (message) => {
  const value = message?.createdAt || message?.updatedAt || message?.time;
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const getDateLabel = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
};

export const CALENDAR_WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
