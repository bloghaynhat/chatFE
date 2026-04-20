import React from "react";
import { FiX, FiDownload } from "react-icons/fi";

interface VideoPreviewModalProps {
  previewVideoUrl: string | null;
  onClose: () => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  previewVideoUrl,
  onClose,
}) => {
  if (!previewVideoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-6 text-white hover:text-gray-300 hover:bg-white/10 p-3 rounded-full z-[10000] transition-colors shadow-lg"
        onClick={onClose}
      >
        <FiX className="text-3xl" />
      </button>

      <div
        className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-[1200px] aspect-video max-h-[85vh] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black ring-1 ring-white/10 relative group">
          <video
            src={previewVideoUrl}
            controls
            autoPlay
            className="w-full h-full object-contain outline-none"
            controlsList="nodownload"
          />
          <a
            href={previewVideoUrl}
            download="video.mp4"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 backdrop-blur-md border border-white/20 shadow-lg"
            title="Download video"
          >
            <FiDownload className="text-xl" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewModal;
