import React from "react";

interface MediaItem {
  messageId: string;
  url: string;
  name: string;
  mediaType: string;
  senderId: string;
  createdAt: string;
}

interface MediaGalleryFilesProps {
  files: MediaItem[];
  isLoading: boolean;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  const iconMap: Record<string, { icon: string; color: string }> = {
    pdf: { icon: "📄", color: "text-red-600" },
    doc: { icon: "📝", color: "text-blue-600" },
    docx: { icon: "📝", color: "text-blue-600" },
    xls: { icon: "📊", color: "text-green-600" },
    xlsx: { icon: "📊", color: "text-green-600" },
    ppt: { icon: "📈", color: "text-orange-600" },
    pptx: { icon: "📈", color: "text-orange-600" },
    zip: { icon: "📦", color: "text-yellow-600" },
    rar: { icon: "📦", color: "text-yellow-600" },
    mp4: { icon: "🎬", color: "text-purple-600" },
    avi: { icon: "🎬", color: "text-purple-600" },
    mov: { icon: "🎬", color: "text-purple-600" },
    mp3: { icon: "🎵", color: "text-pink-600" },
    wav: { icon: "🎵", color: "text-pink-600" },
    txt: { icon: "📃", color: "text-gray-600" },
  };

  return iconMap[ext] || { icon: "📎", color: "text-gray-600" };
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const MediaGalleryFiles: React.FC<MediaGalleryFilesProps> = ({ files, isLoading }) => {
  return (
    <div className="flex flex-col h-full">
      {files.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No files</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {files.map((file) => {
            const { icon, color } = getFileIcon(file.name);

            return (
              <a
                key={file.messageId}
                href={file.url}
                download={file.name}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 cursor-pointer group"
              >
                {/* File Icon Container */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-lg`}
                >
                  {icon}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Download Button */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-blue-500 hover:bg-blue-600 rounded-full p-2 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
