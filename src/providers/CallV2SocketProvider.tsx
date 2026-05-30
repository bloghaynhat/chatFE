import { createContext, useContext, useEffect, useReducer, useRef, useCallback, ReactNode } from "react";
import { Room, RoomEvent } from "livekit-client";
import { toast } from "sonner";
import { callV2Socket } from "../services/callV2Socket";
import { callV2Service } from "../services/callV2.service";
import { useAuth } from "../hooks/useAuth";
import {
  CallV2IncomingPayload,
  CallV2OngoingPayload,
  CallV2JoinedPayload,
  CallV2LeftPayload,
  CallV2DeclinedPayload,
  CallV2MissedPayload,
  CallV2BusyPayload,
  CallV2EndedPayload,
  CallV2ParticipantStatus,
} from "../services/callV2.types";

type CallV2Status = "idle" | "calling" | "ringing" | "incoming" | "active" | "ended";

interface WindowWithCallRoom extends Window {
  __callRoom?: Room;
}

interface CallV2ParticipantInfo {
  userId: string;
  status: CallV2ParticipantStatus;
  invitedAt?: number;
  joinedAt?: number;
  leftAt?: number;
  endedAt?: number;
}

interface CallV2State {
  status: CallV2Status;
  callId: string | null;
  conversationId: string | null;
  type: "audio" | "video";
  callerId: string | null;
  roomName: string | null;
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  isGroup: boolean;
  livekitProvider: "self-hosted" | "cloud";
  participants: Record<string, CallV2ParticipantInfo>;
  busyUserIds: string[];
}

type CallV2Action =
  | {
      type: "SET_CALLING";
      callId: string;
      conversationId: string;
      callType: "audio" | "video";
      roomName?: string | null;
      participants: Record<string, CallV2ParticipantInfo>;
      busyUserIds: string[];
    }
  | { type: "SET_INCOMING"; payload: CallV2IncomingPayload }
  | { type: "SET_ONGOING"; payload: CallV2OngoingPayload }
  | { type: "SET_ACTIVE"; roomName: string }
  | { type: "SET_ENDED" }
  | { type: "UPDATE_PARTICIPANT"; callId: string; userId: string; participant: CallV2ParticipantInfo }
  | { type: "REMOVE_PARTICIPANT"; callId: string; userId: string }
  | { type: "SET_BUSY"; busyUserIds: string[] }
  | { type: "SET_LOCAL_MEDIA"; audioEnabled?: boolean; videoEnabled?: boolean }
  | { type: "TOGGLE_VIDEO" }
  | { type: "TOGGLE_AUDIO" }
  | { type: "RESET" };

const initialState: CallV2State = {
  status: "idle",
  callId: null,
  conversationId: null,
  type: "audio",
  callerId: null,
  roomName: null,
  localVideoEnabled: true,
  localAudioEnabled: true,
  isGroup: false,
  livekitProvider: "cloud",
  participants: {},
  busyUserIds: [],
};

const formatErrorMessage = (error: unknown, fallback: string) => {
  const err = error as { message?: string; payload?: { message?: string }; response?: { data?: { message?: string } } };
  return err?.payload?.message || err?.response?.data?.message || err?.message || fallback;
};

const refreshCallMessage = (conversationId?: string | null) => {
  if (!conversationId) return;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("chatList:refresh"));
  }
};

function callV2Reducer(state: CallV2State, action: CallV2Action): CallV2State {
  switch (action.type) {
    case "SET_CALLING":
      return {
        ...state,
        status: "calling",
        callId: action.callId,
        conversationId: action.conversationId,
        type: action.callType,
        callerId: null,
        roomName: action.roomName ?? state.roomName,
        participants: action.participants,
        busyUserIds: action.busyUserIds,
        localAudioEnabled: true,
        localVideoEnabled: action.callType === "video",
      };
    case "SET_INCOMING":
      return {
        ...state,
        status: "incoming",
        callId: action.payload.callId,
        callerId: action.payload.callerId,
        type: action.payload.type,
        conversationId: action.payload.conversationId,
        roomName: action.payload.roomName,
        livekitProvider: action.payload.livekitProvider ?? "cloud",
        participants: {},
        busyUserIds: action.payload.busyUserIds ?? [],
        localAudioEnabled: true,
        localVideoEnabled: action.payload.type === "video",
      };
    case "SET_ONGOING":
      return {
        ...state,
        status: "incoming",
        callId: action.payload.callId,
        callerId: action.payload.callerId,
        type: action.payload.type,
        conversationId: action.payload.conversationId,
        roomName: action.payload.roomName,
        livekitProvider: action.payload.livekitProvider ?? "cloud",
        participants: {},
        busyUserIds: action.payload.busyUserIds ?? [],
        localAudioEnabled: true,
        localVideoEnabled: action.payload.type === "video",
      };
    case "SET_ACTIVE":
      return { ...state, status: "active", roomName: action.roomName };
    case "SET_ENDED":
      return { ...state, status: "ended" };
    case "UPDATE_PARTICIPANT":
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.userId]: action.participant,
        },
      };
    case "REMOVE_PARTICIPANT": {
      const { [action.userId]: _, ...rest } = state.participants;
      return { ...state, participants: rest };
    }
    case "SET_BUSY":
      return { ...state, busyUserIds: action.busyUserIds };
    case "SET_LOCAL_MEDIA":
      return {
        ...state,
        localAudioEnabled: action.audioEnabled ?? state.localAudioEnabled,
        localVideoEnabled: action.videoEnabled ?? state.localVideoEnabled,
      };
    case "TOGGLE_VIDEO":
      return { ...state, localVideoEnabled: !state.localVideoEnabled };
    case "TOGGLE_AUDIO":
      return { ...state, localAudioEnabled: !state.localAudioEnabled };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

interface CallV2ContextValue {
  state: CallV2State;
  startCallV2: (
    conversationId: string,
    type: "audio" | "video",
    inviteeIds?: string[],
    inviteAll?: boolean,
  ) => Promise<void>;
  joinCallV2: () => Promise<void>;
  joinExistingCallV2: (callId: string, conversationId: string, type?: "audio" | "video") => Promise<void>;
  leaveCallV2: () => Promise<void>;
  rejectCallV2: () => Promise<void>;
  endCallV2: () => Promise<void>;
  toggleVideo: () => void;
  toggleAudio: () => void;
}

const CallV2Context = createContext<CallV2ContextValue | null>(null);

export function CallV2SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(callV2Reducer, initialState);
  const roomRef = useRef<Room | null>(null);
  const incomingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const currentTypeRef = useRef<"audio" | "video">("audio");
  const stateRef = useRef<CallV2State>(initialState);
  const isStartingRef = useRef(false);
  const isJoiningRef = useRef(false);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cleanupRoom = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      delete (window as WindowWithCallRoom).__callRoom;
    }
  }, []);

  const clearIncomingTimer = useCallback(() => {
    if (incomingTimerRef.current) {
      clearTimeout(incomingTimerRef.current);
      incomingTimerRef.current = null;
    }
  }, []);

  const connectToRoom = useCallback(
    async (
      token: string,
      wsUrl: string,
      roomName: string,
      callType: "audio" | "video",
      activateOnConnect = true,
    ) => {
      cleanupRoom();
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;
      (window as WindowWithCallRoom).__callRoom = room;
      currentTypeRef.current = callType;

      room.on(RoomEvent.Connected, () => {
        console.log("[CallV2SocketProvider] LiveKit connected to room:", roomName);
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("[CallV2SocketProvider] Participant connected:", participant.identity);
        dispatch({ type: "SET_ACTIVE", roomName });
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log("[CallV2SocketProvider] Participant disconnected:", participant.identity);
        if (stateRef.current.isGroup && room.remoteParticipants.size > 0) {
          toast.info("Mot thanh vien da roi cuoc goi");
          return;
        }
        toast.info("Doi tuong da ket thuc cuoc goi");
        cleanupRoom();
        dispatch({ type: "RESET" });
        currentCallIdRef.current = null;
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log("[CallV2SocketProvider] LiveKit disconnected:", reason);
        cleanupRoom();
        dispatch({ type: "RESET" });
        currentCallIdRef.current = null;
      });

      room.on(RoomEvent.MediaDevicesError, (error) => {
        console.error("[CallV2SocketProvider] Media device error:", error);
        toast.error("Khong the truy cap thiet bi nghe goi");
      });

      try {
        await room.connect(wsUrl, token);
        if (activateOnConnect) {
          dispatch({ type: "SET_ACTIVE", roomName });
        }
      } catch (err) {
        console.error("[CallV2SocketProvider] Failed to connect to LiveKit room:", err);
        toast.error("Khong the ket noi cuoc goi");
        cleanupRoom();
        dispatch({ type: "RESET" });
        currentCallIdRef.current = null;
        return;
      }

      let videoEnabled = false;
      if (callType === "video") {
        try {
          await room.localParticipant.setCameraEnabled(true);
          videoEnabled = true;
        } catch (err) {
          console.error("[CallV2SocketProvider] Failed to enable camera:", err);
          toast.error("Khong the bat camera. Cuoc goi van tiep tuc o che do khong camera.");
        }
      }

      let audioEnabled = false;
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
        audioEnabled = true;
      } catch (err) {
        console.error("[CallV2SocketProvider] Failed to enable microphone:", err);
        toast.error("Khong tim thay hoac khong the truy cap microphone.");
      }

      dispatch({
        type: "SET_LOCAL_MEDIA",
        audioEnabled,
        videoEnabled,
      });
    },
    [cleanupRoom],
  );

  const connectFromJoin = useCallback(
    async (
      token: string,
      wsUrl: string,
      roomName: string,
      callType: "audio" | "video",
      activateOnConnect = true,
    ) => {
      if (roomRef.current?.state === "connected" || isConnectingRef.current) {
        return;
      }
      isConnectingRef.current = true;
      clearIncomingTimer();
      try {
        await connectToRoom(token, wsUrl, roomName, callType, activateOnConnect);
      } finally {
        isConnectingRef.current = false;
      }
    },
    [clearIncomingTimer, connectToRoom],
  );

  const startCallV2 = useCallback(
    async (conversationId: string, type: "audio" | "video", inviteeIds?: string[], inviteAll?: boolean) => {
      if (state.status !== "idle") {
        toast.warning("Mot cuoc goi dang dien ra");
        return;
      }
      if (isStartingRef.current) return;
      isStartingRef.current = true;
      clearIncomingTimer();
      try {
        const res = await callV2Service.createCall({
          conversationId,
          type,
          inviteeIds,
          inviteAll,
        });
        currentCallIdRef.current = res.call.callId;
        currentTypeRef.current = type;
        dispatch({
          type: "SET_CALLING",
          callId: res.call.callId,
          conversationId,
          callType: type,
          roomName: res.call.roomName,
          participants: res.call.participants,
          busyUserIds: res.busyUserIds,
        });
        if (res.busyUserIds.length > 0) {
          dispatch({ type: "SET_BUSY", busyUserIds: res.busyUserIds });
        }
        callV2Socket.joinCallRoom(res.call.callId);
        const joinRes = await callV2Service.joinCall(res.call.callId);
        if (joinRes.token && joinRes.wsUrl && joinRes.roomName) {
          await connectFromJoin(joinRes.token, joinRes.wsUrl, joinRes.roomName, type, false);
        }
      } catch (err: unknown) {
        toast.error(formatErrorMessage(err, "Khong the bat dau cuoc goi"));
        dispatch({ type: "RESET" });
        currentCallIdRef.current = null;
      } finally {
        isStartingRef.current = false;
      }
    },
    [state.status, clearIncomingTimer, connectFromJoin],
  );

  const joinCallV2 = useCallback(async () => {
    if (!state.callId) return;
    if (isJoiningRef.current) return;
    isJoiningRef.current = true;
    clearIncomingTimer();
    try {
      const res = await callV2Service.joinCall(state.callId);
      callV2Socket.joinCallRoom(state.callId);
      if (res.token && res.wsUrl && res.roomName) {
        await connectFromJoin(res.token, res.wsUrl, res.roomName, currentTypeRef.current);
      }
    } catch (err: unknown) {
      toast.error(formatErrorMessage(err, "Khong the tham gia cuoc goi"));
      dispatch({ type: "RESET" });
      currentCallIdRef.current = null;
    } finally {
      isJoiningRef.current = false;
    }
  }, [state.callId, clearIncomingTimer, connectFromJoin]);

  const joinExistingCallV2 = useCallback(
    async (callId: string, conversationId: string, type: "audio" | "video" = "audio") => {
      if (!callId || isJoiningRef.current) return;
      isJoiningRef.current = true;
      clearIncomingTimer();
      currentCallIdRef.current = callId;
      currentTypeRef.current = type;
      try {
        const res = await callV2Service.joinCall(callId);
        const callType = res.call.type ?? type;
        currentTypeRef.current = callType;
        dispatch({
          type: "SET_ONGOING",
          payload: {
            callId,
            callerId: res.call.callerId,
            conversationId,
            type: callType,
            roomName: res.roomName,
            livekitProvider: res.livekitProvider,
            status: res.call.status,
            busyUserIds: res.call.busyUserIds,
          },
        });
        callV2Socket.joinCallRoom(callId);
        if (res.token && res.wsUrl && res.roomName) {
          await connectFromJoin(res.token, res.wsUrl, res.roomName, callType);
        }
      } catch (err: unknown) {
        toast.error(formatErrorMessage(err, "Khong the tham gia cuoc goi"));
        dispatch({ type: "RESET" });
        currentCallIdRef.current = null;
      } finally {
        isJoiningRef.current = false;
      }
    },
    [clearIncomingTimer, connectFromJoin],
  );

  const leaveCallV2 = useCallback(async () => {
    const callId = state.callId;
    if (callId) {
      try {
        const res = await callV2Service.leaveCall(callId);
        refreshCallMessage(res.call?.conversationId);
        callV2Socket.leaveCallRoom(callId);
      } catch {
        // ignore
      }
    }
    cleanupRoom();
    clearIncomingTimer();
    dispatch({ type: "RESET" });
    currentCallIdRef.current = null;
  }, [state.callId, cleanupRoom, clearIncomingTimer]);

  const rejectCallV2 = useCallback(async () => {
    if (!state.callId) return;
    clearIncomingTimer();
    try {
      const res = await callV2Service.rejectCall(state.callId);
      refreshCallMessage(res.call?.conversationId);
      callV2Socket.leaveCallRoom(state.callId);
    } catch {
      // ignore
    }
    cleanupRoom();
    dispatch({ type: "RESET" });
    currentCallIdRef.current = null;
  }, [state.callId, clearIncomingTimer, cleanupRoom]);

  const endCallV2 = useCallback(async () => {
    const callId = state.callId;
    if (callId) {
      try {
        const res = await callV2Service.endCall(callId);
        refreshCallMessage(res.call?.conversationId);
        callV2Socket.leaveCallRoom(callId);
      } catch {
        // ignore
      }
    }
    cleanupRoom();
    clearIncomingTimer();
    dispatch({ type: "RESET" });
    currentCallIdRef.current = null;
  }, [state.callId, cleanupRoom, clearIncomingTimer]);

  const toggleVideo = useCallback(() => {
    const nextEnabled = !state.localVideoEnabled;
    if (!roomRef.current) {
      dispatch({ type: "SET_LOCAL_MEDIA", videoEnabled: nextEnabled });
      return;
    }
    void roomRef.current.localParticipant
      .setCameraEnabled(nextEnabled)
      .then(() => dispatch({ type: "SET_LOCAL_MEDIA", videoEnabled: nextEnabled }))
      .catch((err) => {
        console.error("[CallV2SocketProvider] Failed to toggle camera:", err);
        toast.error("Khong the thay doi trang thai camera");
      });
  }, [state.localVideoEnabled]);

  const toggleAudio = useCallback(() => {
    const nextEnabled = !state.localAudioEnabled;
    if (!roomRef.current) {
      dispatch({ type: "SET_LOCAL_MEDIA", audioEnabled: nextEnabled });
      return;
    }
    void roomRef.current.localParticipant
      .setMicrophoneEnabled(nextEnabled)
      .then(() => dispatch({ type: "SET_LOCAL_MEDIA", audioEnabled: nextEnabled }))
      .catch((err) => {
        console.error("[CallV2SocketProvider] Failed to toggle microphone:", err);
        toast.error("Khong the thay doi trang thai microphone");
      });
  }, [state.localAudioEnabled]);

  useEffect(() => {
    if (!user?.id) return;

    void callV2Socket.connect();

    const offIncoming = callV2Socket.on<CallV2IncomingPayload>("call:incoming", (data) => {
      console.log("[CallV2SocketProvider] Received call:incoming:", data);
      if (data.callerId === user?.id) return;
      if (currentCallIdRef.current && currentCallIdRef.current !== data.callId) return;
      clearIncomingTimer();
      currentCallIdRef.current = data.callId;
      currentTypeRef.current = data.type;
      toast.info(`Ban co cuoc goi ${data.type === "video" ? "video" : "thoai"} den!`, { duration: Infinity });
      dispatch({ type: "SET_INCOMING", payload: data });
      incomingTimerRef.current = setTimeout(async () => {
        try {
          const res = await callV2Service.missedCall(data.callId);
          refreshCallMessage(res.call?.conversationId);
          callV2Socket.leaveCallRoom(data.callId);
        } catch (err) {
          console.warn("[CallV2SocketProvider] Failed to mark missed call:", err);
        }
        toast.error("Cuoc goi khong duoc tra loi");
        dispatch({ type: "RESET" });
        currentCallIdRef.current = null;
      }, 60000);
    });

    const offOngoing = callV2Socket.on<CallV2OngoingPayload>("call:ongoing", (data) => {
      console.log("[CallV2SocketProvider] Received call:ongoing:", data);
    });

    const offJoined = callV2Socket.on<CallV2JoinedPayload>("call:joined", (data) => {
      console.log("[CallV2SocketProvider] User joined:", data);
      if (data.socketOnly || !data.userId) return;
      dispatch({
        type: "UPDATE_PARTICIPANT",
        callId: data.callId,
        userId: data.userId,
        participant: data.participant ?? {
          userId: data.userId,
          status: CallV2ParticipantStatus.JOINED,
        },
      });
      if (
        currentCallIdRef.current === data.callId &&
        stateRef.current.status === "calling" &&
        data.userId !== user?.id &&
        stateRef.current.roomName
      ) {
        dispatch({ type: "SET_ACTIVE", roomName: stateRef.current.roomName });
      }
    });

    const offLeft = callV2Socket.on<CallV2LeftPayload>("call:left", (data) => {
      console.log("[CallV2SocketProvider] User left:", data);
      dispatch({
        type: "UPDATE_PARTICIPANT",
        callId: data.callId,
        userId: data.userId,
        participant: { userId: data.userId, status: CallV2ParticipantStatus.LEFT, endedAt: Date.now() },
      });
    });

    const offDeclined = callV2Socket.on<CallV2DeclinedPayload>("call:declined", (data) => {
      console.log("[CallV2SocketProvider] User declined:", data);
      dispatch({
        type: "UPDATE_PARTICIPANT",
        callId: data.callId,
        userId: data.userId,
        participant: { userId: data.userId, status: CallV2ParticipantStatus.DECLINED, endedAt: Date.now() },
      });
    });

    const offMissed = callV2Socket.on<CallV2MissedPayload>("call:missed", (data) => {
      console.log("[CallV2SocketProvider] User missed:", data);
      dispatch({
        type: "UPDATE_PARTICIPANT",
        callId: data.callId,
        userId: data.userId,
        participant: { userId: data.userId, status: CallV2ParticipantStatus.MISSED, endedAt: Date.now() },
      });
    });

    const offBusy = callV2Socket.on<CallV2BusyPayload>("call:busy", (data) => {
      console.log("[CallV2SocketProvider] User busy:", data);
      dispatch({ type: "SET_BUSY", busyUserIds: data.busyUserIds });
      toast.warning("Nguoi nhan dang ban");
    });

    const offEnded = callV2Socket.on<CallV2EndedPayload>("call:ended", (data) => {
      console.log("[CallV2SocketProvider] Call ended:", data);
      if (currentCallIdRef.current !== data.callId) return;
      clearIncomingTimer();
      refreshCallMessage(data.conversationId);
      cleanupRoom();
      dispatch({ type: "SET_ENDED" });
      setTimeout(() => {
        dispatch({ type: "RESET" });
        currentCallIdRef.current = null;
      }, 2000);
    });

    return () => {
      offIncoming();
      offOngoing();
      offJoined();
      offLeft();
      offDeclined();
      offMissed();
      offBusy();
      offEnded();
      callV2Socket.disconnect();
      clearIncomingTimer();
      cleanupRoom();
      currentCallIdRef.current = null;
      isStartingRef.current = false;
      isJoiningRef.current = false;
      isConnectingRef.current = false;
    };
  }, [user?.id, cleanupRoom, clearIncomingTimer]);

  return (
    <CallV2Context.Provider
      value={{
        state,
        startCallV2,
        joinCallV2,
        joinExistingCallV2,
        leaveCallV2,
        rejectCallV2,
        endCallV2,
        toggleVideo,
        toggleAudio,
      }}
    >
      {children}
    </CallV2Context.Provider>
  );
}

export function useCallV2() {
  const ctx = useContext(CallV2Context);
  if (!ctx) throw new Error("useCallV2 must be used within CallV2SocketProvider");
  return ctx;
}
