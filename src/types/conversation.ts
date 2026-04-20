import { User } from "./user";

export interface Message {
  // ID fields (backend may use either)
  messageId?: string;
  id?: string;
  _id?: string;

  createdAt: string;
  updatedAt?: string;
  senderId?: string;

  // Sender information (can be embedded or fetched separately)
  sender?: User;
  senderName?: string;

  // Content fields
  text?: string;
  content?: string;
  textPreview: string;

  // Message type and status
  type: "text" | "media" | "mixed";
  status?: "sent" | "delivered" | "seen";
  isSeen?: boolean;
  readAt?: string;

  // Media attachments
  files?: MediaFile[];
  media?: MediaFile[];
  imageUrl?: string;

  // Forwarded message
  originalMessageId?: string;
  originalMessage?: Message;

  // Reply/quote
  quotedMessageId?: string;
  quotedMessage?: Message;
  quotedMessagePreview?: string;

  // Pin-related fields
  pinnedAt?: string;
  pinnedBy?: string;

  // Edit history
  editedAt?: string;
  isEdited?: boolean;

  // Delete status
  isRevoked?: boolean;
  revokedAt?: string;
}

export interface MediaFile {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
  type?: "image" | "video" | "audio" | "document";
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Group settings that control behavior of a group conversation
 */
export interface GroupSettings {
  allowSendLink: boolean;
  requireApproval: boolean;
  allowMemberInvite: boolean;
}

export interface Conversation {
  admins: string[];
  id: string;
  lastMessage: Message;
  membersCount: number;
  pairKey: string;
  type: "private" | "group";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  name: string;
  avatarUrl: string;
  unreadCount: number;
  role: "member" | "admin";
  lastMessageStatus: "sent" | "delivered" | "seen";
  lastMessageTimeFormatted: string;
  /**
   * Group-specific fields (may be undefined for private conversations)
   */
  ownerId?: string;
  settings?: GroupSettings;
  isPinned?: boolean;
  isArchived?: boolean;
  description?: string;
  pendingMembers?: string[]; // User IDs pending approval
}

export interface ConversationResponse {
  status: "success" | "error";
  msg: string;
  data: Conversation[];
}
