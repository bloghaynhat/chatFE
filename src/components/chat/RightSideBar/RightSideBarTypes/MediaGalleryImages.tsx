import React, { useState } from "react";
import { createPortal } from "react-dom";

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
}

export const MediaGalleryImages: React.FC<MediaGalleryImagesProps> = ({ images, isLoading }) => {
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleImageClick = (image: MediaItem) => {
    setSelectedImage(image);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div className="p-2">
        {images.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No images</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {images.map((image) => (
              <button
                key={image.messageId}
                onClick={() => handleImageClick(image)}
                className="relative group aspect-square rounded overflow-hidden bg-gray-100 dark:bg-slate-700 hover:opacity-80 transition-opacity cursor-pointer shadow-sm hover:shadow-md"
              >
                <img src={image.url} alt={image.name} className="w-full h-full object-cover" loading="lazy" />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
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
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal - Rendered via Portal */}
      {isPreviewOpen &&
        selectedImage &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setIsPreviewOpen(false)}
          >
            <div
              className="relative max-w-2xl max-h-[90vh] bg-black rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 rounded-full p-2 z-10 transition-colors active:scale-95"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image */}
              <img src={selectedImage.url} alt={selectedImage.name} className="w-full h-full object-contain" />

              {/* Info bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
                <p className="text-white text-sm truncate font-medium">{selectedImage.name}</p>
                <p className="text-gray-300 text-xs mt-1">{new Date(selectedImage.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Download button */}
              <a
                href={selectedImage.url}
                download={selectedImage.name}
                className="absolute top-4 left-4 bg-blue-500 hover:bg-blue-600 rounded-full p-2 z-10 transition-colors active:scale-95"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </a>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
