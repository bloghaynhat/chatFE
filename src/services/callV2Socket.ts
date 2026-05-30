import { io, Socket } from "socket.io-client";
import { authStorage } from "../runtime/storage";
import type {
  CallV2IncomingPayload,
  CallV2OngoingPayload,
  CallV2JoinedPayload,
  CallV2LeftPayload,
  CallV2DeclinedPayload,
  CallV2MissedPayload,
  CallV2BusyPayload,
  CallV2EndedPayload,
} from "./callV2.types";

const resolveSocketBaseUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && /^https?:\/\//.test(apiUrl)) {
    return apiUrl.replace(/\/v1\/?$/, "");
  }

  return "http://localhost:3000";
};

const SOCKET_BASE_URL = resolveSocketBaseUrl();

type CallV2EventHandler = (data: unknown) => void;

class CallV2SocketManager {
  private socket: Socket | null = null;
  private handlers: Map<string, Set<CallV2EventHandler>> = new Map();
  private connecting = false;

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log("[CallV2Socket] Already connected, skipping");
      return;
    }
    if (this.connecting || (this.socket as (Socket & { connecting?: boolean }) | null)?.connecting) {
      console.log("[CallV2Socket] Already connecting, skipping");
      return;
    }

    this.connecting = true;
    try {
      const token = await authStorage.getItem("token");
      const deviceId = await authStorage.getItem("deviceId");

      console.log(
        "[CallV2Socket] Connecting to",
        `${SOCKET_BASE_URL}/v1/calls`,
        "with token:",
        token ? "present" : "MISSING",
      );

      this.socket = io(`${SOCKET_BASE_URL}/v1/calls`, {
        auth: { token, deviceId },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        console.log("[CallV2Socket] Connected! Socket ID:", this.socket?.id);
        this.notifyHandlers("connect", {});
      });

      this.socket.on("connect_error", (error) => {
        console.error(
          "[CallV2Socket] Connection error:",
          error.message,
          "data:",
          (error as Error & { data?: unknown }).data,
        );
        this.notifyHandlers("connect_error", { message: error.message });
      });

      this.socket.on("disconnect", (reason) => {
        console.log("[CallV2Socket] Disconnected:", reason);
        this.notifyHandlers("disconnect", { reason });
      });

      this.socket.on("call:incoming", (data: CallV2IncomingPayload) => {
        console.log("[CallV2Socket] Received call:incoming:", data);
        this.notifyHandlers("call:incoming", data);
      });

      this.socket.on("call:ongoing", (data: CallV2OngoingPayload) => {
        console.log("[CallV2Socket] Received call:ongoing:", data);
        this.notifyHandlers("call:ongoing", data);
      });

      this.socket.on("call:joined", (data: CallV2JoinedPayload) => {
        console.log("[CallV2Socket] Received call:joined:", data);
        this.notifyHandlers("call:joined", data);
      });

      this.socket.on("call:left", (data: CallV2LeftPayload) => {
        console.log("[CallV2Socket] Received call:left:", data);
        this.notifyHandlers("call:left", data);
      });

      this.socket.on("call:declined", (data: CallV2DeclinedPayload) => {
        console.log("[CallV2Socket] Received call:declined:", data);
        this.notifyHandlers("call:declined", data);
      });

      this.socket.on("call:missed", (data: CallV2MissedPayload) => {
        console.log("[CallV2Socket] Received call:missed:", data);
        this.notifyHandlers("call:missed", data);
      });

      this.socket.on("call:busy", (data: CallV2BusyPayload) => {
        console.log("[CallV2Socket] Received call:busy:", data);
        this.notifyHandlers("call:busy", data);
      });

      this.socket.on("call:ended", (data: CallV2EndedPayload) => {
        console.log("[CallV2Socket] Received call:ended:", data);
        this.notifyHandlers("call:ended", data);
      });
    } finally {
      this.connecting = false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinCallRoom(callId: string): void {
    if (!callId) {
      console.warn("[CallV2Socket] Cannot join call room without callId");
      return;
    }
    console.log("[CallV2Socket] Joining call room:", callId, "connected:", this.socket?.connected);
    this.socket?.emit("call:join", { callId });
  }

  leaveCallRoom(callId: string): void {
    if (!callId) return;
    this.socket?.emit("call:leave", { callId });
  }

  on<T>(event: string, handler: (data: T) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as CallV2EventHandler);
    return () => {
      this.handlers.get(event)?.delete(handler as CallV2EventHandler);
    };
  }

  private notifyHandlers(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const callV2Socket = new CallV2SocketManager();
