import React, { useEffect, useState, useCallback, useRef } from "react";
import { conversationService, socketService } from "../../../services";
import { MediaGalleryImages } from "./RightSideBarTypes/MediaGalleryImages";
import { MediaGalleryFiles } from "./RightSideBarTypes/MediaGalleryFiles";
import { MediaGalleryLinks } from "./RightSideBarTypes/MediaGalleryLinks";
import { MediaGalleryVoice } from "./RightSideBarTypes/MediaGalleryVoice";

interface MediaItem {
  messageId: string;
  url: string;
  name: string;
  mediaType: string;
  senderId: string;
  createdAt: string;
}

interface MediaData {
  images: MediaItem[];
  files: MediaItem[];
  links: MediaItem[];
  voices: MediaItem[];
  nextCursor: string;
  hasMore: boolean;
}

interface MediaGalleryProps {
  conversationId: string;
  currentUserId?: string;
  onShowInChat?: (mediaUrl: string) => void;
  messages?: any[];
  activeTab?: "images" | "files" | "links" | "voice";
  hideTabNavigation?: boolean;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  conversationId,
  currentUserId,
  onShowInChat,
  messages,
  activeTab: externalActiveTab,
  hideTabNavigation,
}) => {
  const [media, setMedia] = useState<MediaData>({
    images: [],
    files: [],
    links: [],
    voices: [],
    nextCursor: "",
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"images" | "files" | "links" | "voice">("images");
  const [nextCursor, setNextCursor] = useState<string>("");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Use external activeTab if provided, otherwise use internal state
  const currentActiveTab = externalActiveTab || activeTab;
  const setCurrentActiveTab = externalActiveTab ? () => {} : setActiveTab;

  const fetchMedia = useCallback(
    async (cursor?: string) => {
      try {
        setIsLoading(true);
        const result = await conversationService.getConversationMedia(conversationId, {
          limit: 50,
          ...(cursor && { cursor }),
        });

        console.log("📸 Media API Response:", result);

        setMedia((prev) => ({
          images: cursor ? [...prev.images, ...(result.images || [])] : result.images || [],
          files: cursor ? [...prev.files, ...(result.files || [])] : result.files || [],
          links: cursor ? [...prev.links, ...(result.links || [])] : result.links || [],
          voices: cursor ? [...prev.voices, ...(result.voices || [])] : result.voices || [],
          nextCursor: result.nextCursor || "",
          hasMore: result.hasMore || false,
        }));

        setNextCursor(result.nextCursor || "");
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId],
  );

  // Initial fetch
  useEffect(() => {
    fetchMedia();
  }, [conversationId, fetchMedia]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current || !media.hasMore || isLoading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextCursor) {
        fetchMedia(nextCursor);
      }
    });

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [media.hasMore, nextCursor, isLoading, fetchMedia]);

  // Socket listener for new messages with media
  useEffect(() => {
    const handleNewMessage = (messageData: any) => {
      // Only refetch if the message is from current conversation
      const msgConversationId = messageData?.conversationId || messageData?.message?.conversationId;
      if (msgConversationId !== conversationId) return;

      // Check if the message contains any media
      if (
        messageData?.message?.media &&
        Array.isArray(messageData.message.media) &&
        messageData.message.media.length > 0
      ) {
        console.log("🔔 New message with media received, refetching media gallery...");
        // Refetch media when new message with media arrives
        fetchMedia();
      }
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.offNewMessage();
    };
  }, [conversationId, fetchMedia]);

  const totalMedia = media.images.length + media.files.length + media.links.length + media.voices.length;

  if (totalMedia === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">No media in this conversation</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation - Horizontal Scrollable */}
      {!hideTabNavigation && (
        <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0 overflow-x-auto scrollbar-hide">
          {[
            { tab: "images", label: "Media", count: media.images.length },
            { tab: "files", label: "Files", count: media.files.length },
            { tab: "links", label: "Links", count: media.links.length },
            { tab: "voice", label: "Voice", count: media.voices.length },
          ].map(({ tab, label, count }) => (
            <button
              key={tab}
              onClick={() => setCurrentActiveTab(tab as any)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                currentActiveTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              {label}
              {count > 0 && <span className="ml-1 text-xs">({count})</span>}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {currentActiveTab === "images" && (
          <MediaGalleryImages
            images={media.images}
            isLoading={isLoading}
            onShowInChat={onShowInChat}
            messages={messages}
          />
        )}
        {currentActiveTab === "files" && (
          <MediaGalleryFiles
            files={media.files}
            isLoading={isLoading}
            onShowInChat={onShowInChat}
            messages={messages}
          />
        )}
        {currentActiveTab === "links" && (
          <MediaGalleryLinks
            links={media.links}
            isLoading={isLoading}
            onShowInChat={onShowInChat}
            messages={messages}
          />
        )}
        {currentActiveTab === "voice" && (
          <MediaGalleryVoice
            voices={media.voices}
            isLoading={isLoading}
            onShowInChat={onShowInChat}
            messages={messages}
          />
        )}

        {/* Infinite scroll trigger */}
        <div ref={observerTarget} className="h-4" />

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
};
