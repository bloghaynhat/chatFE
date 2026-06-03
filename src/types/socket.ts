/**
 * Socket Event Payload Types
 * These interfaces define the data structures for socket.io events
 */

import { Conversation, Message } from "./conversation";

// ========== MESSAGE EVENTS ==========

export interface EditMessagePayload {
  messageId: string;
  text: string;
  editedAt: string;
}

export interface DeleteMessagePayload {
  messageId: string;
}

export interface PinMessagePayload {
  messageId: string;
  conversationId?: string;
  message?: Message;
  pinnedBy?: string;
  pinnedAt?: string;
}

export interface UnpinMessagePayload {
  messageId: string;
  conversationId?: string;
  message?: Message;
}

export interface QuotedMessagePayload {
  conversationId: string;
  message: Message;
  quotedMessageId: string;
}

// ========== CONVERSATION EVENTS ==========

export interface ConversationCreatedPayload {
  conversation: Conversation;
}

export interface ConversationUpdatedPayload {
  conversationId: string;
  updates: Partial<Conversation>;
}

export interface ConversationMembersAddedPayload {
  conversationId: string;
  newMembers?: Array<{
    id?: string;
    _id?: string;
    conversationId?: string;
    userId: string;
    role?: string;
    status?: string;
    joinedAt?: string;
    [key: string]: any;
  }>;
  memberIds?: string[];
  addedBy?: string;
}

export interface ConversationMemberRemovedPayload {
  conversationId: string;
  removedUserId: string;
  removedBy?: string;
  reason?: "removed" | "left";
}

export interface ConversationPinToggledPayload {
  conversationId: string;
  isPinned: boolean;
}

export interface ConversationArchivedToggledPayload {
  conversationId: string;
  isArchived: boolean;
}

export interface ConversationMuteChangedPayload {
  conversationId: string;
  muted: boolean;
  mutedUntil?: string;
}

// ========== GROUP EVENTS ==========

export interface GroupMemberLeftPayload {
  conversationId: string;
  userId: string;
  leftAt?: string;
}

export interface GroupDissolvedPayload {
  conversationId: string;
  dissolvedBy: string;
  dissolvedAt: string;
}

export interface GroupRenamedPayload {
  conversationId: string;
  newName: string;
  renamedBy: string;
  renamedAt: string;
}

export interface GroupAvatarChangedPayload {
  conversationId: string;
  avatarUrl: string;
  changedBy: string;
}

export interface GroupAdminChangedPayload {
  conversationId: string;
  userId: string;
  isAdmin: boolean;
  changedBy: string;
}

export interface GroupOwnerTransferredPayload {
  conversationId: string;
  newOwnerId: string;
  transferredBy: string;
}

export interface GroupMemberApprovedPayload {
  conversationId: string;
  userId: string;
  approvedBy: string;
  approvedAt: string;
}

export interface GroupMemberRejectedPayload {
  conversationId: string;
  userId: string;
  rejectedBy: string;
  rejectedAt: string;
}

export interface GroupSettings {
  allowSendLink: boolean;
  requireApproval: boolean;
  allowMemberInvite: boolean;
}

export interface GroupSettingsUpdatedPayload {
  conversationId: string;
  settings: GroupSettings;
  updatedBy: string;
}

// ========== FRIEND EVENTS ==========

// These are already defined in useContactsSocketListeners.ts but included for completeness
export interface FriendRequestReceivedPayload {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface FriendRequestAcceptedPayload {
  requestId: string;
  friendId: string;
  acceptedBy: string;
}

export interface FriendRequestRejectedPayload {
  requestId: string;
  rejectedBy: string;
}

export interface FriendRequestCanceledPayload {
  requestId: string;
  canceledBy: string;
}

export interface FriendshipUnfriendedPayload {
  userId: string;
  unfriendedBy: string;
}

// ========== TYPING EVENTS ==========

export interface TypingStartPayload {
  userId: string;
  conversationId?: string;
  groupId?: string;
}

export interface TypingStopPayload {
  userId: string;
  conversationId?: string;
  groupId?: string;
}
