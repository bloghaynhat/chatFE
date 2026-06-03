import { useEffect, useRef, useState } from "react";
import { FiDownload, FiPause, FiPlay } from "react-icons/fi";

const formatAudioTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getAudioUrl = (audio: any) => audio?.url || audio?.preview || (typeof audio === "string" ? audio : "");

const getAudioName = (audio: any, index: number) =>
  audio?.name || audio?.fileName || audio?.originalName || `voice-message-${index + 1}.mp3`;

const getInitialDuration = (audio: any) => {
  const duration = Number(audio?.duration || audio?.durationSeconds || audio?.metadata?.duration);
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
};

const waveformHeights = [8, 14, 10, 18, 12, 21, 15, 9, 17, 11, 20, 14, 8, 16, 10, 19, 12, 8];

function VoicePlayer({ audio, index, mine }: { audio: any; index: number; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(() => getInitialDuration(audio));
  const [hasError, setHasError] = useState(false);

  const audioUrl = getAudioUrl(audio);
  const audioName = getAudioName(audio, index);
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audioElement.duration)) {
        setDuration(audioElement.duration);
      }
      setHasError(false);
    };
    const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audioElement.currentTime = 0;
    };
    const handleError = () => {
      setIsPlaying(false);
      setHasError(true);
    };

    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);

    return () => {
      audioElement.pause();
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
    };
  }, [audioUrl]);

  const togglePlayback = async () => {
    const audioElement = audioRef.current;
    if (!audioElement || !audioUrl || hasError) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audioElement.play();
      setIsPlaying(true);
      setHasError(false);
    } catch {
      setIsPlaying(false);
      setHasError(true);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    const audioElement = audioRef.current;
    if (!audioElement || !Number.isFinite(nextTime)) return;

    audioElement.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div
      className="group/voice relative flex w-[224px] max-w-[calc(100vw-96px)] items-center gap-2.5 sm:w-[276px]"
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <button
        type="button"
        onClick={togglePlayback}
        disabled={!audioUrl || hasError}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
          mine ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#2ea6f3] hover:bg-[#1f97e5]"
        }`}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <FiPause className="text-[18px]" /> : <FiPlay className="ml-0.5 text-[18px]" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex h-6 min-w-0 flex-1 items-end gap-[3px]" aria-hidden="true">
          {waveformHeights.map((height, barIndex) => (
            <span
              key={barIndex}
              className={`w-[3px] flex-1 rounded-full transition-colors ${
                barIndex / waveformHeights.length <= progress / 100
                  ? mine
                    ? "bg-emerald-600"
                    : "bg-[#2ea6f3]"
                  : mine
                    ? "bg-emerald-700/20 dark:bg-emerald-200/22"
                    : "bg-slate-300 dark:bg-slate-600"
              }`}
              style={{ height }}
            />
          ))}
          </div>
          <span
            className={`w-9 shrink-0 text-right text-[11px] font-semibold leading-none ${
              mine ? "text-emerald-700/85 dark:text-emerald-100/80" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {hasError ? "--:--" : formatAudioTime(duration)}
          </span>
        </div>

        <div className="relative mt-1 h-2.5">
          <div
            className={`absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full ${
              mine ? "bg-emerald-700/18 dark:bg-emerald-200/20" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-150 ${
                mine ? "bg-emerald-600" : "bg-[#2ea6f3]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime)}
            onChange={handleSeek}
            disabled={!duration || hasError}
            aria-label="Voice message progress"
            className="absolute inset-0 h-3 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {audioUrl && (
        <a
          href={audioUrl}
          download={audioName}
          target="_blank"
          rel="noopener noreferrer"
          className={`absolute -right-1 -top-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm ring-1 ring-black/5 transition hover:bg-white group-hover/voice:opacity-100 dark:bg-slate-800/95 dark:ring-white/10 dark:hover:bg-slate-700 ${
            mine ? "text-emerald-700 dark:text-emerald-100" : "text-slate-500 dark:text-slate-300"
          }`}
          aria-label="Download voice message"
          title="Download"
        >
          <FiDownload className="text-[16px]" />
        </a>
      )}
    </div>
  );
}

export const MessageAudio = ({ audios, mine }: { audios: any[]; mine: boolean }) => {
  return (
    <div className="flex min-w-[248px] flex-col gap-2 px-3 py-2 sm:min-w-[300px]">
      {audios.map((audio, index) => (
        <VoicePlayer key={getAudioUrl(audio) || index} audio={audio} index={index} mine={mine} />
      ))}
    </div>
  );
};
