import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiMaximize2,
  FiMic,
  FiMicOff,
  FiMinimize2,
  FiPhoneOff,
  FiUsers,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi";
import {
  RoomEvent,
  type LocalTrack,
  type LocalTrackPublication,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  type Room,
} from "livekit-client";
import { useCallV2 } from "../../providers/CallV2SocketProvider";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userService";
import { useLanguage } from "../../context";

interface WindowWithCallRoom extends Window {
  __callRoom?: Room;
}

interface RemoteTile {
  participantId: string;
  participantName: string;
  avatarUrl?: string | null;
  videoTrack?: RemoteTrack;
  audioTracks: RemoteTrack[];
}

interface ParticipantTileInfo {
  participantId: string;
  participantName: string;
  avatarUrl?: string | null;
  videoTrack?: RemoteTrack;
  audioTracks: RemoteTrack[];
  connected: boolean;
}

interface CallWindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}

const MIN_WINDOW_WIDTH = 300;
const MIN_WINDOW_HEIGHT = 420;
const DEFAULT_WINDOW_WIDTH = 368;
const DEFAULT_WINDOW_HEIGHT = 520;
const WINDOW_MARGIN = 16;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getInitialBounds = (): CallWindowBounds => {
  if (typeof window === "undefined") {
    return {
      x: WINDOW_MARGIN,
      y: WINDOW_MARGIN,
      width: DEFAULT_WINDOW_WIDTH,
      height: DEFAULT_WINDOW_HEIGHT,
      maximized: false,
    };
  }

  const width = Math.min(DEFAULT_WINDOW_WIDTH, window.innerWidth - WINDOW_MARGIN * 2);
  const height = Math.min(DEFAULT_WINDOW_HEIGHT, window.innerHeight - WINDOW_MARGIN * 2);

  return {
    x: Math.max(WINDOW_MARGIN, window.innerWidth - width - WINDOW_MARGIN),
    y: Math.max(WINDOW_MARGIN, window.innerHeight - height - WINDOW_MARGIN),
    width,
    height,
    maximized: false,
  };
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function VideoTrackView({
  track,
  muted,
  className,
}: {
  track: LocalTrack | RemoteTrack;
  muted?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    track.attach(el);
    void el.play().catch(() => {});
    return () => {
      track.detach(el);
    };
  }, [track]);

  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}

function AudioTrackView({ track }: { track: RemoteTrack }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    track.attach(el);
    void el.play().catch(() => {});
    return () => {
      track.detach(el);
    };
  }, [track]);

  return <audio ref={ref} autoPlay playsInline />;
}

function ParticipantFallback({ name, avatarUrl, status }: { name: string; avatarUrl?: string | null; status?: string }) {
  const initial = name?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#eef8ff] to-[#cfeeff] text-slate-900">
      <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#5fc3ff] to-[#229ed9] text-2xl font-semibold text-white shadow-[0_18px_40px_rgba(34,158,217,0.28)] ring-4 ring-white/70">
        {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : initial}
      </div>
      <div className="max-w-[80%] truncate text-sm font-semibold">{name || "Connecting..."}</div>
      {status && <div className="mt-1 text-xs font-medium text-slate-500">{status}</div>}
    </div>
  );
}

function getRemoteTiles(room: Room): RemoteTile[] {
  const tiles: RemoteTile[] = [];

  room.remoteParticipants.forEach((participant: RemoteParticipant) => {
    const publications = Array.from(participant.trackPublications.values());
    const videoPublication = publications.find(
      (publication: RemoteTrackPublication) => publication.track?.kind === "video",
    );
    const audioTracks = publications
      .map((publication: RemoteTrackPublication) => publication.track)
      .filter((track): track is RemoteTrack => !!track && track.kind === "audio");

    tiles.push({
      participantId: participant.identity,
      participantName: participant.name || participant.identity || "Participant",
      videoTrack: videoPublication?.track,
      audioTracks,
    });
  });

  return tiles;
}

const normalizeUserInfo = (payload: any, fallbackId?: string) => {
  const data = payload?.data?.data || payload?.data || payload?.user || payload;
  if (!data) return null;
  return {
    id: data.id || data._id || data.userId || fallbackId,
    name: data.displayName || data.fullName || data.name || data.username || data.phone || fallbackId,
    avatarUrl: data.avatarUrl || data.avatar || data.profilePicture || null,
  };
};

function getLocalVideoTrack(room: Room): LocalTrack | undefined {
  const videoPublication = Array.from(room.localParticipant.trackPublications.values()).find(
    (publication: LocalTrackPublication) => publication.track?.kind === "video",
  );
  return videoPublication?.track;
}

export default function ActiveCallView() {
  const { t } = useLanguage();
  const callV2 = useCallV2();
  const state = callV2.state;
  const { user } = useAuth();

  const hangUpCall = state.isGroup ? callV2.leaveCallV2 : callV2.endCallV2;
  const toggleVideo = callV2.toggleVideo;
  const toggleAudio = callV2.toggleAudio;

  const [duration, setDuration] = useState(0);
  const [remoteTiles, setRemoteTiles] = useState<RemoteTile[]>([]);
  const [participantProfiles, setParticipantProfiles] = useState<Record<string, { name?: string; avatarUrl?: string | null }>>({});
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalTrack | undefined>();
  const [windowBounds, setWindowBounds] = useState<CallWindowBounds>(() => getInitialBounds());
  const savedBoundsRef = useRef<CallWindowBounds | null>(null);

  useEffect(() => {
    if (state.status !== "active") {
      setDuration(0);
      return;
    }
    const startTime = state.activeStartedAt || Date.now();
    setDuration(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    const interval = setInterval(() => {
      setDuration(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.activeStartedAt, state.status]);

  useEffect(() => {
    if (state.status !== "active") {
      setRemoteTiles([]);
      setLocalVideoTrack(undefined);
      return;
    }

    const room = (window as WindowWithCallRoom).__callRoom;
    if (!room) return;

    const syncMedia = () => {
      setRemoteTiles(getRemoteTiles(room));
      setLocalVideoTrack(getLocalVideoTrack(room));
    };

    syncMedia();

    room.on(RoomEvent.TrackSubscribed, syncMedia);
    room.on(RoomEvent.TrackUnsubscribed, syncMedia);
    room.on(RoomEvent.TrackPublished, syncMedia);
    room.on(RoomEvent.TrackUnpublished, syncMedia);
    room.on(RoomEvent.LocalTrackPublished, syncMedia);
    room.on(RoomEvent.LocalTrackUnpublished, syncMedia);
    room.on(RoomEvent.TrackMuted, syncMedia);
    room.on(RoomEvent.TrackUnmuted, syncMedia);
    room.on(RoomEvent.ParticipantConnected, syncMedia);
    room.on(RoomEvent.ParticipantDisconnected, syncMedia);

    return () => {
      room.off(RoomEvent.TrackSubscribed, syncMedia);
      room.off(RoomEvent.TrackUnsubscribed, syncMedia);
      room.off(RoomEvent.TrackPublished, syncMedia);
      room.off(RoomEvent.TrackUnpublished, syncMedia);
      room.off(RoomEvent.LocalTrackPublished, syncMedia);
      room.off(RoomEvent.LocalTrackUnpublished, syncMedia);
      room.off(RoomEvent.TrackMuted, syncMedia);
      room.off(RoomEvent.TrackUnmuted, syncMedia);
      room.off(RoomEvent.ParticipantConnected, syncMedia);
      room.off(RoomEvent.ParticipantDisconnected, syncMedia);
    };
  }, [state.status]);

  useEffect(() => {
    if (state.status === "active") {
      setWindowBounds((bounds) => {
        const maxX = window.innerWidth - bounds.width - WINDOW_MARGIN;
        const maxY = window.innerHeight - bounds.height - WINDOW_MARGIN;
        return {
          ...bounds,
          x: clamp(bounds.x, WINDOW_MARGIN, Math.max(WINDOW_MARGIN, maxX)),
          y: clamp(bounds.y, WINDOW_MARGIN, Math.max(WINDOW_MARGIN, maxY)),
        };
      });
    }
  }, [state.status]);

  useEffect(() => {
    const handleResize = () => {
      setWindowBounds((bounds) => {
        if (bounds.maximized) {
          return {
            ...bounds,
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        }

        const width = Math.min(bounds.width, window.innerWidth - WINDOW_MARGIN * 2);
        const height = Math.min(bounds.height, window.innerHeight - WINDOW_MARGIN * 2);
        return {
          ...bounds,
          width,
          height,
          x: clamp(bounds.x, WINDOW_MARGIN, Math.max(WINDOW_MARGIN, window.innerWidth - width - WINDOW_MARGIN)),
          y: clamp(bounds.y, WINDOW_MARGIN, Math.max(WINDOW_MARGIN, window.innerHeight - height - WINDOW_MARGIN)),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDragPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (windowBounds.maximized) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const startBounds = windowBounds;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextX = startBounds.x + moveEvent.clientX - startX;
      const nextY = startBounds.y + moveEvent.clientY - startY;
      setWindowBounds((bounds) => ({
        ...bounds,
        x: clamp(nextX, WINDOW_MARGIN, Math.max(WINDOW_MARGIN, window.innerWidth - bounds.width - WINDOW_MARGIN)),
        y: clamp(nextY, WINDOW_MARGIN, Math.max(WINDOW_MARGIN, window.innerHeight - bounds.height - WINDOW_MARGIN)),
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleResizePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (windowBounds.maximized) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const startBounds = windowBounds;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const maxWidth = window.innerWidth - startBounds.x - WINDOW_MARGIN;
      const maxHeight = window.innerHeight - startBounds.y - WINDOW_MARGIN;
      const width = clamp(startBounds.width + moveEvent.clientX - startX, MIN_WINDOW_WIDTH, maxWidth);
      const height = clamp(startBounds.height + moveEvent.clientY - startY, MIN_WINDOW_HEIGHT, maxHeight);
      setWindowBounds((bounds) => ({
        ...bounds,
        width,
        height,
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const toggleMaximized = () => {
    setWindowBounds((bounds) => {
      if (bounds.maximized && savedBoundsRef.current) {
        return savedBoundsRef.current;
      }

      savedBoundsRef.current = bounds;
      return {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        maximized: true,
      };
    });
  };

  const remoteAudioTracks = useMemo(
    () =>
      remoteTiles.flatMap((tile) =>
        tile.audioTracks.map((track) => ({ key: `${tile.participantId}:${track.sid}`, track })),
      ),
    [remoteTiles],
  );

  useEffect(() => {
    const idsToFetch = Array.from(
      new Set([...remoteTiles.map((tile) => tile.participantId), ...Object.keys(state.participants || {})]),
    ).filter((id) => id && id !== user?.id && !participantProfiles[id]);

    if (idsToFetch.length === 0) return;

    let cancelled = false;
    idsToFetch.forEach((id) => {
      userService
        .getUserById(id)
        .then((res) => {
          if (cancelled) return;
          const profile = normalizeUserInfo(res, id);
          if (!profile) return;
          setParticipantProfiles((prev) => ({
            ...prev,
            [id]: {
              name: profile.name,
              avatarUrl: profile.avatarUrl,
            },
          }));
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [participantProfiles, remoteTiles, state.participants, user?.id]);

  if (state.status !== "active") return null;

  const remoteIds = remoteTiles.map((tile) => tile.participantId).filter(Boolean);
  const expectedIds = Object.keys(state.participants || {}).filter((id) => {
    const participant = state.participants?.[id];
    return id && id !== user?.id && participant?.status === "joined";
  });
  const allRemoteIds = state.isGroup ? remoteIds : Array.from(new Set([...remoteIds, ...expectedIds]));
  const remotePeople: ParticipantTileInfo[] =
    allRemoteIds.length > 0
      ? allRemoteIds.map((id) => {
          const liveTile = remoteTiles.find((tile) => tile.participantId === id);
          const profile = participantProfiles[id];
          const isPeer = state.remotePeer?.id === id || allRemoteIds.length === 1;
          return {
            participantId: id,
            participantName:
              profile?.name ||
              liveTile?.participantName ||
              (isPeer ? state.remotePeer?.name || undefined : undefined) ||
              "Participant",
            avatarUrl: profile?.avatarUrl || (isPeer ? state.remotePeer?.avatarUrl : null),
            videoTrack: liveTile?.videoTrack,
            audioTracks: liveTile?.audioTracks || [],
            connected: Boolean(liveTile),
          };
        })
      : state.isGroup
        ? []
        : [
          {
            participantId: state.remotePeer?.id || "remote-peer",
            participantName: state.remotePeer?.name || "Connecting...",
            avatarUrl: state.remotePeer?.avatarUrl,
            audioTracks: [],
            connected: false,
          },
        ];
  const participantCount = remotePeople.length + 1;
  const hasRemoteVideo = remotePeople.some((tile) => tile.videoTrack && !tile.videoTrack.isMuted);
  const hasLocalVideo = Boolean(localVideoTrack && state.localVideoEnabled && !localVideoTrack.isMuted);
  const isVideo = state.type === "video" || hasLocalVideo || hasRemoteVideo;
  const gridClass =
    remotePeople.length <= 1
      ? "grid-cols-1"
      : remotePeople.length <= 2
        ? "grid-cols-2"
        : "grid-cols-2";

  return (
    <div
      className={`fixed z-50 flex flex-col overflow-hidden border border-white/80 bg-[#dceefb] text-slate-900 shadow-[0_24px_70px_rgba(35,95,145,0.32)] ${
        windowBounds.maximized ? "rounded-none" : "rounded-[28px]"
      }`}
      style={{
        left: windowBounds.x,
        top: windowBounds.y,
        width: windowBounds.width,
        height: windowBounds.height,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(64,169,255,0.24),transparent_34%),radial-gradient(circle_at_88%_92%,rgba(34,158,217,0.2),transparent_42%)]" />
      {remoteAudioTracks.map(({ key, track }) => (
        <AudioTrackView key={key} track={track} />
      ))}

      {isVideo ? (
        <div className="relative flex-1 overflow-hidden pb-24 pt-14">
          {remotePeople.length > 0 ? (
            <div className={`grid h-full gap-2 p-3 ${gridClass}`}>
              {remotePeople.map((tile) => (
                <div
                  key={tile.participantId}
                  className="relative min-h-0 overflow-hidden rounded-[22px] border border-white/75 bg-white/55 shadow-[0_14px_34px_rgba(35,95,145,0.16)]"
                >
                  {tile.videoTrack && !tile.videoTrack.isMuted ? (
                    <VideoTrackView track={tile.videoTrack} className="h-full w-full object-cover" />
                  ) : (
                    <ParticipantFallback
                      name={tile.participantName}
                      avatarUrl={tile.avatarUrl}
                      status={tile.connected ? t("call.cameraOff") : t("call.connecting")}
                    />
                  )}
                  <div className="absolute bottom-3 left-3 max-w-[80%] truncate rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-800 shadow-sm backdrop-blur">
                    {tile.participantName}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-3">
              <div className="h-full w-full overflow-hidden rounded-[22px] border border-white/75 bg-white/55 shadow-[0_14px_34px_rgba(35,95,145,0.16)]">
                <ParticipantFallback name={t("call.connecting")} />
              </div>
            </div>
          )}

          <div className="absolute bottom-24 right-4 h-24 w-32 overflow-hidden rounded-[18px] border border-white/80 bg-white/75 shadow-[0_14px_34px_rgba(35,95,145,0.22)] backdrop-blur">
            {localVideoTrack && state.localVideoEnabled && !localVideoTrack.isMuted ? (
              <VideoTrackView track={localVideoTrack} muted className="h-full w-full object-cover" />
            ) : (
              <ParticipantFallback name={t("app.you")} avatarUrl={user?.avatarUrl || user?.avatar} />
            )}
            <div className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-slate-800 shadow-sm">
              {t("app.you")}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col px-4 pb-24 pt-16">
          <div className={`grid flex-1 content-center gap-3 ${gridClass}`}>
            {remotePeople.map((tile) => (
              <div
                key={tile.participantId}
                className="min-h-[150px] overflow-hidden rounded-[22px] border border-white/75 bg-white/55 shadow-[0_14px_34px_rgba(35,95,145,0.16)]"
              >
                <ParticipantFallback
                  name={tile.participantName}
                  avatarUrl={tile.avatarUrl}
                  status={tile.connected ? t("call.connected") : t("call.connecting")}
                />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-white/65 px-4 py-2 text-slate-600 shadow-sm backdrop-blur">
            <FiUsers className="h-4 w-4" />
            <span className="text-sm">{participantCount} {t("call.participants")}</span>
          </div>
        </div>
      )}

      <div
        className={`absolute left-0 right-0 top-0 flex items-center justify-between gap-2 p-3 ${
          windowBounds.maximized ? "cursor-default" : "cursor-move"
        }`}
        onPointerDown={handleDragPointerDown}
      >
        <div className="flex items-center gap-2 rounded-full border border-white/75 bg-white/75 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[#34c759]" />
          <span className="font-semibold">{formatDuration(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/75 bg-white/75 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur">
            <FiUsers className="h-4 w-4" />
            <span className="font-semibold">{participantCount}</span>
          </div>
          <button
            type="button"
            onClick={toggleMaximized}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/75 bg-white/75 text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
            aria-label={windowBounds.maximized ? t("call.restoreWindow") : t("call.maximizeWindow")}
            title={windowBounds.maximized ? t("call.restore") : t("call.maximize")}
          >
            {windowBounds.maximized ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center p-3">
        <div className="flex items-center justify-center gap-3 rounded-full border border-white/75 bg-white/85 p-2.5 shadow-[0_16px_40px_rgba(35,95,145,0.22)] backdrop-blur-xl">
          <button
            onClick={toggleAudio}
            className={`h-11 w-11 rounded-full transition hover:-translate-y-0.5 ${
              state.localAudioEnabled
                ? "bg-[#edf7ff] text-[#229ed9] hover:bg-[#dff1ff]"
                : "bg-[#ff4d5e] text-white hover:bg-[#e94352]"
            }`}
            aria-label={state.localAudioEnabled ? t("call.mute") : t("call.unmute")}
            title={state.localAudioEnabled ? t("call.mute") : t("call.unmute")}
          >
            {state.localAudioEnabled ? (
              <FiMic className="mx-auto h-6 w-6" />
            ) : (
              <FiMicOff className="mx-auto h-6 w-6" />
            )}
          </button>
          <button
            onClick={toggleVideo}
            className={`h-11 w-11 rounded-full transition hover:-translate-y-0.5 ${
              state.localVideoEnabled
                ? "bg-[#edf7ff] text-[#229ed9] hover:bg-[#dff1ff]"
                : "bg-[#ff4d5e] text-white hover:bg-[#e94352]"
            }`}
            aria-label={state.localVideoEnabled ? t("call.cameraOff") : t("call.cameraOn")}
            title={state.localVideoEnabled ? t("call.cameraOff") : t("call.cameraOn")}
          >
            {state.localVideoEnabled ? (
              <FiVideo className="mx-auto h-6 w-6" />
            ) : (
              <FiVideoOff className="mx-auto h-6 w-6" />
            )}
          </button>
          <button
            onClick={hangUpCall}
            className="h-12 w-12 rounded-full bg-[#ff4d5e] text-white shadow-[0_14px_28px_rgba(255,77,94,0.34)] transition hover:-translate-y-0.5 hover:bg-[#e94352]"
            aria-label={state.isGroup ? t("call.leave") : t("call.end")}
          >
            <FiPhoneOff className="mx-auto h-6 w-6" />
          </button>
        </div>
      </div>
      {!windowBounds.maximized && (
        <div
          className="absolute bottom-1.5 right-1.5 h-5 w-5 cursor-nwse-resize rounded-br-[20px]"
          onPointerDown={handleResizePointerDown}
          aria-label={t("call.resizeWindow")}
          title={t("call.dragResize")}
        >
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-br border-b-2 border-r-2 border-[#229ed9]/70" />
        </div>
      )}
    </div>
  );
}
