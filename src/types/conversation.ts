import { User } from "./user";

export interface Reaction {
  emoji: string;
  users: (User | { id: string; _id?: string })[];
}

export interface Message {
  // ID fields (backend may use either)
  _id?: string;
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
  type: "text" | "media" | "mixed" | "call" | "poll" | "system";
  status?: "sent" | "delivered" | "seen";
  isSeen?: boolean;
  readAt?: string;

  // Media attachments
  files?: MediaFile[];
  media?: MediaFile[];
  imageUrl?: string;
  call?: {
    callId: string;
    roomName: string;
    callType: "audio" | "video";
    status: "completed" | "missed" | "rejected" | "cancelled";
    callerId: string;
    calleeIds: string[];
    answeredAt?: string | Date;
    endedAt?: string | Date;
    endedBy?: string;
    durationSeconds?: number;
    participantOutcomes?: Record<string, unknown>;
  };
  pollId?: string;
  poll?: Poll;

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

  // Additional fields used in codebase
  reactions?: Reaction[];
  id_sender?: string;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount?: number;
  votedUserIds?: string[];
  voters?: string[];
}

export interface Poll {
  id: string;
  conversationId: string;
  messageId?: string;
  question: string;
  options: PollOption[];
  createdBy?: string;
  isMultipleChoice?: boolean;
  allowAddOption?: boolean;
  allowChangeVote?: boolean;
  showResultsBeforeClose?: boolean;
  hideVoters?: boolean;
  status?: "active" | "closed";
  pinned?: boolean;
  totalVotes?: number;
  createdAt?: string;
  expiresAt?: string;
  closedAt?: string;
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
  type: "private" | "group" | "saved_messages";
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
  isSelfChat?: boolean;
  isSavedMessages?: boolean;
  description?: string;
  pendingMembers?: string[]; // User IDs pending approval
}

export interface ConversationResponse {
  status: "success" | "error";
  msg: string;
  data: Conversation[];
}
