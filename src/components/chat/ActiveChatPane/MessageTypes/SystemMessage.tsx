import { getMessageId } from "../../../../utils/chatUtils";

export const SystemMessage = ({ message, index, isFirst, firstMessageRef, text }) => {
  return (
    <div
      ref={isFirst ? firstMessageRef : null}
      key={getMessageId(message, index)}
      className="w-full flex justify-center my-1"
    >
      <div className="text-[12.5px] font-medium px-3 py-1 bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200 rounded-full shadow-sm text-center max-w-[80%] inline-block">
        {text}
      </div>
    </div>
  );
};
