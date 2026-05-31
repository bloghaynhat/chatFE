// Application constants and enums

export const API_ENDPOINTS = {
  AUTH: "/auth",
  USERS: "/users",
  MESSAGES: "/messages",
  FRIEND_REQUESTS: "/friend-requests",
  FRIENDSHIPS: "/friendships",
  CHAT: "/conversations",
};

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  GUEST: "guest",
};

export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  FILE: "file",
  SYSTEM: "system",
};

export const STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  AWAY: "away",
  BUSY: "busy",
};

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};
