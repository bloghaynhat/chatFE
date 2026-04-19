import { FiDownload } from "react-icons/fi";

export const MessageDocument = ({ message, messageFiles, mine }) => {
  const file = message?.file || (messageFiles && messageFiles[0]);
  const fileName = file?.name || file?.filename || file?.originalName || "Document";
  const fileSize = file?.size ? `${(file.size / 1024).toFixed(0)} KB` : "";
  const fileUrl = file?.url || file?.preview || (typeof file === "string" ? file : "");
  return (
    <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-t-2xl gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${mine ? "bg-emerald-600" : "bg-blue-500"}`}
        >
          <svg
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-xl"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium truncate hover:underline cursor-pointer text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {fileName}
          </a>
          <span className="text-xs opacity-70">{fileSize}</span>
        </div>
      </div>
      {fileUrl && (
        <a
          href={fileUrl}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <FiDownload className="text-lg" />
        </a>
      )}
    </div>
  );
};
