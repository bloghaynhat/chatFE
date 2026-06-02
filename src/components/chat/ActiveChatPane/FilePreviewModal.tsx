import React from "react";
import { FiX, FiMoreVertical, FiFile } from "react-icons/fi";
import { useLanguage } from "../../../context";

interface FilePreview {
  preview: string;
  type: string;
  isImageMode?: boolean;
  name: string;
  size?: number;
}

interface FilePreviewModalProps {
  files: FilePreview[];
  draftMessage: string;
  onDraftMessageChange: (value: string) => void;
  onCancel: () => void;
  onSend: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  files,
  draftMessage,
  onDraftMessageChange,
  onCancel,
  onSend,
}) => {
  const { t } = useLanguage();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  return (
    <div className="absolute inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <FiX className="text-xl text-gray-500 dark:text-gray-400" />
            </button>
            <h3 className="font-medium text-lg text-gray-800 dark:text-white">
              {t("app.send")} {files.length} {files.length === 1 ? t("chat.photo") : t("chat.photos")}
            </h3>
          </div>
          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
            <FiMoreVertical className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            {files.map((file, index) => {
              const isImage = file.type.startsWith("image/") && file.isImageMode !== false;
              return (
                <div
                  key={index}
                  className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 ${
                    files.length === 3 && index === 2
                      ? "col-span-2 aspect-video"
                      : files.length === 5 && index >= 2
                        ? "col-span-1 aspect-square"
                        : "aspect-square"
                  }`}
                >
                  {isImage ? (
                    <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <FiFile className="text-4xl text-blue-500 mb-2" />
                      <span className="text-xs text-center truncate w-full px-2 text-gray-700 dark:text-gray-300">
                        {file.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-slate-700">
          <input
            type="text"
            placeholder={t("chat.addCaption")}
            value={draftMessage}
            onChange={(e) => onDraftMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-white placeholder-gray-400"
          />
          <button
            onClick={onSend}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
