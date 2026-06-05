import React from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../../context";

interface MediaItem {
  messageId: string;
  url: string;
  name: string;
  mediaType: string;
  senderId: string;
  createdAt: string;
}

interface MediaGalleryVoiceProps {
  voices: MediaItem[];
  isLoading: boolean;
  onShowInChat?: (mediaUrl: string) => void;
  messages?: any[];
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const MediaGalleryVoice: React.FC<MediaGalleryVoiceProps> = ({ voices, isLoading, onShowInChat, messages }) => {
  const { t } = useLanguage();
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; voice: MediaItem } | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handlePlayClick = (voiceId: string, url: string) => {
    if (playing === voiceId) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlaying(voiceId);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, voice: MediaItem) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 80);
    setContextMenu({ x, y, voice });
  };

  const handleShowInChat = () => {
    if (contextMenu && onShowInChat) {
      onShowInChat(contextMenu.voice.url);
    }
    setContextMenu(null);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {voices.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            <p className="text-sm">{t("chat.noVoice")}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {voices.map((voice) => (
              <div
                key={voice.messageId}
                onContextMenu={(e) => handleContextMenu(e, voice)}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700"
              >
                {/* Play Button */}
                <button
                  onClick={() => handlePlayClick(voice.messageId, voice.url)}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors active:scale-95"
                >
                  <svg
                    className={`w-5 h-5 text-white transition-transform ${playing === voice.messageId ? "" : ""}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {playing === voice.messageId ? (
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z" />
                    ) : (
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    )}
                  </svg>
                </button>

                {/* Voice Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {voice.name || t("chat.voiceMessage")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(voice.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Duration */}
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">0:00</div>

                {/* Download Button */}
                <a
                  href={voice.url}
                  download={voice.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <audio ref={audioRef} onEnded={() => setPlaying(null)} />

      {/* Context Menu - Rendered via Portal */}
      {contextMenu &&
        createPortal(
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)}>
            <div
              className="absolute bg-white dark:bg-slate-800 rounded-lg shadow-xl py-2 min-w-48 border border-gray-200 dark:border-slate-700"
              style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              {onShowInChat && (
                <button
                  onClick={handleShowInChat}
                  className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 text-left flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t("chat.showInChat")}
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
