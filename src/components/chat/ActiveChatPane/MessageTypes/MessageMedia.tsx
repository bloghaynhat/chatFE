import { FiCheck, FiDownload, FiEye } from "react-icons/fi";
import { PhotoView } from "react-photo-view";
import { getMessageTime } from "../../../../utils/chatUtils";

export const MessageMedia = ({
  message,
  mediaItems,
  images,
  hasText,
  onlyImagesOrVideos,
  mine,
  isSeen,
  setPreviewVideoUrl,
}) => {
  return (
    <div className={`p-1 cursor-pointer overflow-hidden ${hasText ? "pb-0 rounded-t-lg" : "rounded-lg"} relative`}>
      {mediaItems.length === 1 ? (
        images.includes(mediaItems[0]) ? (
          <PhotoView src={mediaItems[0].url || mediaItems[0].preview || mediaItems[0]}>
            <img
              src={mediaItems[0].url || mediaItems[0].preview || mediaItems[0]}
              alt="Message image"
              className="w-full max-w-[340px] max-h-[400px] rounded-lg object-contain"
            />
          </PhotoView>
        ) : (
          <div
            className="relative w-full rounded-lg bg-black overflow-hidden group flex justify-center items-center cursor-pointer"
            onClick={() =>
              setPreviewVideoUrl(
                mediaItems[0].url || mediaItems[0].preview || (typeof mediaItems[0] === "string" ? mediaItems[0] : ""),
              )
            }
          >
            <video
              src={
                mediaItems[0].url || mediaItems[0].preview || (typeof mediaItems[0] === "string" ? mediaItems[0] : "")
              }
              className="w-full h-auto max-h-[400px] object-contain pointer-events-none"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm shadow-xl hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <a
              href={
                mediaItems[0].url || mediaItems[0].preview || (typeof mediaItems[0] === "string" ? mediaItems[0] : "")
              }
              download={mediaItems[0].filename || mediaItems[0].name || "video.mp4"}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <FiDownload className="text-sm" />
            </a>
          </div>
        )
      ) : (
        <div
          className={`grid gap-0.5 rounded-lg overflow-hidden max-w-[340px] ${
            mediaItems.length === 2 || mediaItems.length === 4
              ? "grid-cols-2"
              : mediaItems.length === 3
                ? "grid-cols-2"
                : "grid-cols-3"
          }`}
        >
          {mediaItems.map((media, i) => {
            const isImg = images.includes(media);
            const mediaUrl = media.url || media.preview || (typeof media === "string" ? media : "");

            if (isImg) {
              return (
                <PhotoView key={i} src={mediaUrl}>
                  <div
                    className={`relative ${
                      mediaItems.length === 3 && i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                    }`}
                  >
                    <img src={mediaUrl} alt={`Image ${i}`} className="w-full h-full object-cover" />
                  </div>
                </PhotoView>
              );
            } else {
              return (
                <div
                  key={i}
                  className={`relative w-full bg-black group flex justify-center items-center cursor-pointer ${
                    mediaItems.length === 3 && i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                  }`}
                  onClick={() => setPreviewVideoUrl(mediaUrl)}
                >
                  <video src={mediaUrl} className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm shadow-xl hover:scale-110 transition-transform">
                      <svg
                        className="w-5 h-5 ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <a
                    href={mediaUrl}
                    download={media.filename || media.name || "video.mp4"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FiDownload className="text-[11px]" />
                  </a>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};
