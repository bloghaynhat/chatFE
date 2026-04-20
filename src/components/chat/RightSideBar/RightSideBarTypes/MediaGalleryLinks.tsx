import React from "react";

interface MediaItem {
  messageId: string;
  url: string;
  name: string;
  mediaType: string;
  senderId: string;
  createdAt: string;
}

interface MediaGalleryLinksProps {
  links: MediaItem[];
  isLoading: boolean;
}

const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace("www.", "");
  } catch {
    return url;
  }
};

const truncateUrl = (url: string, maxLength: number = 45): string => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
};

export const MediaGalleryLinks: React.FC<MediaGalleryLinksProps> = ({ links, isLoading }) => {
  return (
    <div className="flex flex-col h-full">
      {links.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No links</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {links.map((link) => {
            const domain = extractDomain(link.url);

            return (
              <a
                key={link.messageId}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 cursor-pointer group"
              >
                {/* Link Icon Container */}
                <div className="flex-shrink-0 w-10 h-10 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>

                {/* Link Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {link.name || truncateUrl(link.url)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{domain}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* External Link Indicator */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
