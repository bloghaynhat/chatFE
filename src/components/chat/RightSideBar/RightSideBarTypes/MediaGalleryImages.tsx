import React, { useState } from "react";
import { createPortal } from "react-dom";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { useLanguage } from "../../../../context";

interface MediaItem {
  messageId: string;
  url: string;
  name: string;
  mediaType: string;
  senderId: string;
  createdAt: string;
}

interface MediaGalleryImagesProps {
  images: MediaItem[];
  isLoading: boolean;
  onShowInChat?: (mediaUrl: string) => void;
  messages?: any[];
}

export const MediaGalleryImages: React.FC<MediaGalleryImagesProps> = ({
  images,
  isLoading,
  onShowInChat,
  messages,
}) => {
  const { t } = useLanguage();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; image: MediaItem } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, image: MediaItem) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 80);
    setContextMenu({ x, y, image });
  };

  const handleShowInChat = () => {
    if (contextMenu && onShowInChat) {
      console.log("🖼️ Show in chat clicked for image:", contextMenu.image.url);
      onShowInChat(contextMenu.image.url);
    }
    setContextMenu(null);
  };

  return (
    <>
      <div className="p-2">
        {images.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            <p className="text-sm">{t("chat.noImages")}</p>
          </div>
        ) : (
          <PhotoProvider
            maskOpacity={0.8}
            overlayRender={({ index }) => {
              const selectedImage = images[index];
              if (!selectedImage) return null;
              return (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 pointer-events-none">
                  <p className="text-white text-sm truncate font-medium">{selectedImage.name}</p>
                  <p className="text-gray-300 text-xs mt-1">
                    {new Date(selectedImage.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            }}
            toolbarRender={({ index }) => {
              const selectedImage = images[index];
              if (!selectedImage) return null;
              return (
                <a
                  href={selectedImage.url}
                  download={selectedImage.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-2 opacity-75 hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                  title={t("chat.download")}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </a>
              );
            }}
          >
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((image) => (
                <PhotoView key={image.messageId} src={image.url}>
                  <div
                    onContextMenu={(e) => handleContextMenu(e, image)}
                    className="relative group aspect-square rounded overflow-hidden bg-gray-100 dark:bg-slate-700 hover:opacity-80 transition-opacity cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <img src={image.url} alt={image.name} className="w-full h-full object-cover" loading="lazy" />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </PhotoView>
              ))}
            </div>
          </PhotoProvider>
        )}
      </div>

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
