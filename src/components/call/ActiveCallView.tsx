import { useEffect, useMemo, useRef, useState } from "react";
import { FiMic, FiMicOff, FiPhoneOff, FiUsers, FiVideo, FiVideoOff } from "react-icons/fi";
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

interface WindowWithCallRoom extends Window {
  __callRoom?: Room;
}

interface RemoteTile {
  participantId: string;
  participantName: string;
  videoTrack?: RemoteTrack;
  audioTracks: RemoteTrack[];
}

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

function ParticipantFallback({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#eef8ff] to-[#cfeeff] text-slate-900">
      <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#5fc3ff] to-[#229ed9] text-2xl font-semibold text-white shadow-[0_18px_40px_rgba(34,158,217,0.28)] ring-4 ring-white/70">
        {name?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="max-w-[80%] truncate text-sm font-semibold">{name || "Dang ket noi..."}</div>
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
      participantName: participant.name || participant.identity || "Nguoi tham gia",
      videoTrack: videoPublication?.track,
      audioTracks,
    });
  });

  return tiles;
}

function getLocalVideoTrack(room: Room): LocalTrack | undefined {
  const videoPublication = Array.from(room.localParticipant.trackPublications.values()).find(
    (publication: LocalTrackPublication) => publication.track?.kind === "video",
  );
  return videoPublication?.track;
}

export default function ActiveCallView() {
  const callV2 = useCallV2();
  const state = callV2.state;

  const endCall = callV2.endCallV2;
  const toggleVideo = callV2.toggleVideo;
  const toggleAudio = callV2.toggleAudio;

  const [duration, setDuration] = useState(0);
  const [remoteTiles, setRemoteTiles] = useState<RemoteTile[]>([]);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalTrack | undefined>();

  useEffect(() => {
    if (state.status !== "active") {
      setDuration(0);
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.status]);

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

  const remoteAudioTracks = useMemo(
    () =>
      remoteTiles.flatMap((tile) =>
        tile.audioTracks.map((track) => ({ key: `${tile.participantId}:${track.sid}`, track })),
      ),
    [remoteTiles],
  );

  if (state.status !== "active") return null;

  const isVideo = state.type === "video";
  const participantCount = remoteTiles.length + 1 || Object.keys(state.participants).length || 1;
  const gridClass =
    remoteTiles.length <= 1
      ? "grid-cols-1"
      : remoteTiles.length <= 4
        ? "grid-cols-2"
        : "grid-cols-2 lg:grid-cols-3";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#dceefb] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(64,169,255,0.26),transparent_32%),radial-gradient(circle_at_88%_92%,rgba(34,158,217,0.22),transparent_38%)]" />
      {remoteAudioTracks.map(({ key, track }) => (
        <AudioTrackView key={key} track={track} />
      ))}

      {isVideo ? (
        <div className="relative flex-1 overflow-hidden pb-24 pt-16">
          {remoteTiles.length > 0 ? (
            <div className={`grid h-full gap-3 p-3 sm:gap-4 sm:p-5 ${gridClass}`}>
              {remoteTiles.map((tile) => (
                <div
                  key={tile.participantId}
                  className="relative overflow-hidden rounded-[26px] border border-white/75 bg-white/55 shadow-[0_18px_50px_rgba(35,95,145,0.18)]"
                >
                  {tile.videoTrack && !tile.videoTrack.isMuted ? (
                    <VideoTrackView track={tile.videoTrack} className="h-full w-full object-cover" />
                  ) : (
                    <ParticipantFallback name={tile.participantName} />
                  )}
                  <div className="absolute bottom-3 left-3 max-w-[80%] truncate rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-800 shadow-sm backdrop-blur">
                    {tile.participantName}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <div className="h-full max-h-[34rem] w-full max-w-[34rem] overflow-hidden rounded-[28px] border border-white/75 bg-white/55 shadow-[0_18px_50px_rgba(35,95,145,0.18)]">
                <ParticipantFallback name="Dang ket noi..." />
              </div>
            </div>
          )}

          <div className="absolute bottom-28 right-4 h-28 w-40 overflow-hidden rounded-[22px] border border-white/80 bg-white/75 shadow-[0_18px_45px_rgba(35,95,145,0.24)] backdrop-blur sm:right-6">
            {localVideoTrack && state.localVideoEnabled && !localVideoTrack.isMuted ? (
              <VideoTrackView track={localVideoTrack} muted className="h-full w-full object-cover" />
            ) : (
              <ParticipantFallback name="Ban" />
            )}
            <div className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-slate-800 shadow-sm">
              Ban
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-16">
          <div className="mb-6 flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-[#5fc3ff] to-[#229ed9] shadow-[0_24px_70px_rgba(34,158,217,0.34)] ring-8 ring-white/55">
            <span className="text-5xl font-semibold text-white">
              {remoteTiles[0]?.participantName?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <p className="max-w-full truncate text-2xl font-semibold">
            {remoteTiles[0]?.participantName || "Dang ket noi..."}
          </p>
          <div className="mt-2 flex items-center gap-2 text-slate-600">
            <FiUsers className="h-4 w-4" />
            <span className="text-sm">{participantCount} nguoi tham gia</span>
          </div>
        </div>
      )}

      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-3 sm:p-4">
        <div className="flex items-center gap-2 rounded-full border border-white/75 bg-white/75 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[#34c759]" />
          <span className="font-semibold">{formatDuration(duration)}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/75 bg-white/75 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur">
          <FiUsers className="h-4 w-4" />
          <span className="font-semibold">{participantCount}</span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center p-4">
        <div className="flex items-center justify-center gap-3 rounded-full border border-white/75 bg-white/80 p-3 shadow-[0_18px_45px_rgba(35,95,145,0.22)] backdrop-blur-xl">
          <button
            onClick={toggleAudio}
            className={`h-12 w-12 rounded-full transition hover:-translate-y-0.5 ${
              state.localAudioEnabled
                ? "bg-[#edf7ff] text-[#229ed9] hover:bg-[#dff1ff]"
                : "bg-[#ff4d5e] text-white hover:bg-[#e94352]"
            }`}
            aria-label={state.localAudioEnabled ? "Tat microphone" : "Bat microphone"}
            title={state.localAudioEnabled ? "Tat microphone" : "Bat microphone"}
          >
            {state.localAudioEnabled ? (
              <FiMic className="mx-auto h-6 w-6" />
            ) : (
              <FiMicOff className="mx-auto h-6 w-6" />
            )}
          </button>
          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`h-12 w-12 rounded-full transition hover:-translate-y-0.5 ${
                state.localVideoEnabled
                  ? "bg-[#edf7ff] text-[#229ed9] hover:bg-[#dff1ff]"
                  : "bg-[#ff4d5e] text-white hover:bg-[#e94352]"
              }`}
              aria-label={state.localVideoEnabled ? "Tat camera" : "Bat camera"}
              title={state.localVideoEnabled ? "Tat camera" : "Bat camera"}
            >
              {state.localVideoEnabled ? (
                <FiVideo className="mx-auto h-6 w-6" />
              ) : (
                <FiVideoOff className="mx-auto h-6 w-6" />
              )}
            </button>
          )}
          <button
            onClick={endCall}
            className="h-14 w-14 rounded-full bg-[#ff4d5e] text-white shadow-[0_14px_28px_rgba(255,77,94,0.34)] transition hover:-translate-y-0.5 hover:bg-[#e94352]"
            aria-label="Ket thuc cuoc goi"
          >
            <FiPhoneOff className="mx-auto h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
