import { api } from "./api";
import type {
  CreateCallV2Params,
  CreateCallV2Response,
  JoinCallV2Response,
  LeaveCallV2Response,
  RejectCallV2Response,
  MissedCallV2Response,
  EndCallV2Response,
  GetCallTokenV2Response,
} from "./callV2.types";

const unwrapData = <T>(response: T | { data?: T }) => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data?: T }).data as T;
  }
  return response as T;
};

export const callV2Service = {
  async createCall(params: CreateCallV2Params): Promise<CreateCallV2Response> {
    const response = await api.post<CreateCallV2Response>("/calls", params);
    return unwrapData(response);
  },

  async getActiveCall(conversationId: string): Promise<CreateCallV2Response["call"] | null> {
    try {
      const response = await api.get<CreateCallV2Response["call"] | null>(
        `/calls/conversations/${conversationId}/active`,
      );
      return unwrapData(response) ?? null;
    } catch {
      return null;
    }
  },

  async getActiveCallByConversation(conversationId: string): Promise<CreateCallV2Response["call"] | null> {
    try {
      const response = await api.get<CreateCallV2Response["call"] | null>(
        `/calls/active-by-conversation/${conversationId}`,
      );
      return unwrapData(response) ?? null;
    } catch {
      return null;
    }
  },

  async joinCall(callId: string): Promise<JoinCallV2Response> {
    const response = await api.post<JoinCallV2Response>(`/calls/${callId}/join`, {});
    return unwrapData(response);
  },

  async leaveCall(callId: string): Promise<LeaveCallV2Response> {
    const response = await api.post<LeaveCallV2Response>(`/calls/${callId}/leave`, {});
    return unwrapData(response);
  },

  async rejectCall(callId: string): Promise<RejectCallV2Response> {
    const response = await api.post<RejectCallV2Response>(`/calls/${callId}/reject`, {});
    return unwrapData(response);
  },

  async missedCall(callId: string): Promise<MissedCallV2Response> {
    const response = await api.post<MissedCallV2Response>(`/calls/${callId}/missed`, {});
    return unwrapData(response);
  },

  async endCall(callId: string): Promise<EndCallV2Response> {
    try {
      const response = await api.post<EndCallV2Response>(`/calls/${callId}/end`, {});
      return unwrapData(response);
    } catch {
      const response = await api.delete<EndCallV2Response>(`/calls/${callId}`, undefined);
      return unwrapData(response);
    }
  },

  async getToken(callId: string): Promise<GetCallTokenV2Response> {
    const response = await api.get<GetCallTokenV2Response>(`/calls/${callId}/token`);
    return unwrapData(response);
  },
};
