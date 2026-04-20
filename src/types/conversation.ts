export interface Message {
  messageId: string;
  createdAt: string;
  senderId: string;
  textPreview: string;
  type: "text" | "media" | "mixed";
  status?: "sent" | "delivered" | "seen";
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
