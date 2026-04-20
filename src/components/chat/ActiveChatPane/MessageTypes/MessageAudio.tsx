export const MessageAudio = ({ audios, mine, hasText }) => {
  return (
    <div className={`p-2 flex flex-col gap-2 pb-2`}>
      {audios.map((aud, i) => {
        const audUrl = aud.url || aud.preview || (typeof aud === "string" ? aud : "");
        return (
          <div key={i} className="flex flex-col gap-1 w-full max-w-[240px] md:max-w-[280px]">
            <audio
              controls
              src={audUrl}
              className={`w-full h-10 outline-none ${mine ? "" : "filter brightness-90 dark:brightness-100"}`}
            />
          </div>
        );
      })}
    </div>
  );
};
