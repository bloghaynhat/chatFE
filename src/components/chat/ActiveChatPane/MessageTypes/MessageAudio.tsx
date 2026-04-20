export const MessageAudio = ({ audios, mine }) => {
  return (
    <div className={`p-2 flex flex-col gap-2 pb-3 min-w-[260px] md:min-w-[320px]`}>
      {audios.map((aud, i) => {
        const audUrl = aud.url || aud.preview || (typeof aud === "string" ? aud : "");
        return (
          <div key={i} className="w-full">
            <audio
              controls
              src={audUrl}
              className={`w-full h-[44px] outline-none rounded-full overflow-hidden ${mine ? "" : "filter shadow-sm"}`}
              style={{ backgroundColor: mine ? "transparent" : "#f1f5f9" }}
            />
          </div>
        );
      })}
    </div>
  );
};
