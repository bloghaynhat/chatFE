import { getMessageId } from "../../../../utils/chatUtils";
import { translateKnownPreviewText } from "../../../../utils/chatPreview";
import { useLanguage } from "../../../../context";

export const SystemMessage = ({
  message,
  index,
  isFirst,
  firstMessageRef,
  text,
  hasUploadedWallpaper,
}) => {
  const { language } = useLanguage();

  let translatedText = text;
  if (typeof text === "string") {
    translatedText = translateKnownPreviewText(text, language);
  }

  return (
    <div
      ref={isFirst ? firstMessageRef : null}
      key={getMessageId(message, index)}
      className="w-full flex justify-center my-1.5"
    >
      <div
        className={`text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full text-center max-w-[80%] inline-block ${
          hasUploadedWallpaper
            ? "bg-white/88 text-slate-800 border border-white/70 shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur-md"
            : "bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200 shadow-sm"
        }`}
      >
        {translatedText}
      </div>
    </div>
  );
};
