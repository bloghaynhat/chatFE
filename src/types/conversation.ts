export interface Message {
  messageId: string;
  createdAt: string;
  senderId: string;
  textPreview: string;
  type: "text" | "media" | "mixed";
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
}

export interface ConversationResponse {
  status: "success" | "error";
  msg: string;
  data: Conversation[];
}
