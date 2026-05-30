// ============ Call V2 Types ============

export enum CallV2ParticipantStatus {
  INVITED = "invited",
  RINGING = "ringing",
  JOINED = "joined",
  DECLINED = "declined",
  MISSED = "missed",
  LEFT = "left",
  BUSY = "busy",
}

export enum CallV2SessionStatus {
  RINGING = "ringing",
  IN_CALL = "in-call",
  ENDED = "ended",
  MISSED = "missed",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface CallV2Participant {
  userId: string;
  status: CallV2ParticipantStatus;
  invitedAt?: number;
  joinedAt?: number;
  leftAt?: number;
  endedAt?: number;
}

export interface CallV2Session {
  callId: string;
  callerId: string;
  conversationId: string;
  type: "audio" | "video";
  isGroup: boolean;
  livekitProvider: "self-hosted" | "cloud";
  roomName: string;
  status: CallV2SessionStatus;
  createdAt: number;
  answeredAt?: number;
  endedAt?: number;
  endedBy?: string;
  calleeIds: string[];
  participants: Record<string, CallV2Participant>;
  busyUserIds: string[];
  loggedMessageId?: string;
}

// ============ Call V2 Request/Response Types ============

export interface CreateCallV2Params {
  conversationId: string;
  type: "audio" | "video";
  inviteeIds?: string[];
  inviteAll?: boolean;
}

export interface CreateCallV2Response {
  call: CallV2Session;
  invitedUserIds: string[];
  busyUserIds: string[];
}

export interface JoinCallV2Response {
  call: CallV2Session;
  token: string;
  wsUrl: string;
  roomName: string;
  livekitProvider: "self-hosted" | "cloud";
}

export interface LeaveCallV2Response {
  call: CallV2Session;
  terminal: boolean;
  callMessage?: unknown;
}

export interface RejectCallV2Response {
  call: CallV2Session;
  terminal: boolean;
  callMessage?: unknown;
}

export interface MissedCallV2Response {
  call: CallV2Session;
  terminal: boolean;
  callMessage?: unknown;
}

export interface EndCallV2Response {
  call: CallV2Session;
  callMessage?: unknown;
}

export interface GetCallTokenV2Response {
  token: string;
  wsUrl: string;
  roomName: string;
  livekitProvider: "self-hosted" | "cloud";
}

// ============ Call V2 Socket Event Payloads ============

export interface CallV2IncomingPayload {
  callId: string;
  callerId: string;
  type: "audio" | "video";
  conversationId: string;
  roomName: string;
  apiVersion?: "v1" | "v2";
  livekitProvider?: "self-hosted" | "cloud";
  status?: CallV2SessionStatus;
  busyUserIds?: string[];
}

export type CallV2OngoingPayload = CallV2IncomingPayload;

export interface CallV2JoinedPayload {
  callId: string;
  conversationId?: string;
  userId?: string;
  status?: CallV2ParticipantStatus | CallV2SessionStatus;
  participant?: CallV2Participant;
  socketOnly?: boolean;
}

export interface CallV2LeftPayload {
  callId: string;
  conversationId: string;
  userId: string;
  status: CallV2ParticipantStatus | CallV2SessionStatus;
}

export interface CallV2DeclinedPayload {
  callId: string;
  conversationId: string;
  userId: string;
  status: CallV2ParticipantStatus | CallV2SessionStatus;
}

export interface CallV2MissedPayload {
  callId: string;
  conversationId: string;
  userId: string;
  status: CallV2ParticipantStatus | CallV2SessionStatus;
}

export interface CallV2BusyPayload {
  callId: string;
  conversationId: string;
  busyUserIds: string[];
}

export interface CallV2EndedPayload {
  callId: string;
  conversationId: string;
  status: CallV2SessionStatus;
  endedAt?: number;
  endedBy?: string;
  callMessage?: unknown;
}
