import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { CALENDAR_WEEKDAYS } from "../../../utils/chatUtils";

export const CalendarModal = ({
  isCalendarModalOpen,
  setIsCalendarModalOpen,
  selectedCalendarHeadline,
  setCalendarMonth,
  calendarMonthLabel,
  isViewingCurrentMonthOrLater,
  calendarGrid,
  calendarMonth,
  todayStart,
  selectedCalendarDate,
  setSelectedCalendarDate,
  setHeaderSearchValue,
}) => {
  if (!isCalendarModalOpen) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center px-3 lg:px-4 py-5 bg-black/20 backdrop-blur-[1px]"
      onMouseDown={() => {
        // Parent already handles this or we can let parent do it.
        // Actually, in ActiveChatPane we called setIsAttachMenuOpen(false) here, we can pass it if we want.
      }}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="w-[min(400px,92vw)] max-h-[min(78vh,620px)] overflow-y-auto rounded-2xl lg:rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl px-5 lg:px-6 py-4 lg:py-5"
      >
        <p className="text-[28px] lg:text-[32px] font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-3">
          {selectedCalendarHeadline}
        </p>

        <div className="flex items-center justify-between mb-3.5">
          <button
            onClick={() =>
              setCalendarMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
              )
            }
            className="h-9 w-9 rounded-full inline-flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            title="Previous month"
          >
            <FiChevronLeft className="text-[22px]" />
          </button>
          <p className="text-[15px] lg:text-[16px] font-semibold text-gray-800 dark:text-gray-100">
            {calendarMonthLabel}
          </p>
          <button
            onClick={() =>
              setCalendarMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
              )
            }
            disabled={isViewingCurrentMonthOrLater}
            className={`h-9 w-9 rounded-full inline-flex items-center justify-center transition ${isViewingCurrentMonthOrLater ? "text-gray-300 dark:text-slate-600 cursor-not-allowed" : "text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
            title="Next month"
          >
            <FiChevronRight className="text-[22px]" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1.5 mb-1">
          {CALENDAR_WEEKDAYS.map((weekday, index) => (
            <div
              key={`${weekday}-${index}`}
              className="h-7 flex items-center justify-center text-[12px] font-medium text-gray-500 dark:text-gray-400"
            >
              {weekday}
            </div>
          ))}

          {Array.from({ length: calendarGrid.leadingEmptyDays }).map(
            (_, idx) => (
              <div key={`empty-${idx}`} className="h-9" />
            ),
          )}

          {Array.from({ length: calendarGrid.totalDays }).map((_, index) => {
            const day = index + 1;
            const year = calendarMonth.getFullYear();
            const month = calendarMonth.getMonth();
            const cellDate = new Date(year, month, day);
            cellDate.setHours(0, 0, 0, 0);
            const isFutureDate = cellDate.getTime() > todayStart.getTime();
            const isSelected =
              selectedCalendarDate.getFullYear() === year &&
              selectedCalendarDate.getMonth() === month &&
              selectedCalendarDate.getDate() === day;

            return (
              <button
                key={`day-${day}`}
                onClick={() => {
                  if (isFutureDate) return;
                  setSelectedCalendarDate(new Date(year, month, day));
                }}
                disabled={isFutureDate}
                className={`h-9 w-9 mx-auto rounded-full inline-flex items-center justify-center text-[14px] transition ${isFutureDate ? "text-gray-300 dark:text-slate-600 cursor-not-allowed" : isSelected ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={() => setIsCalendarModalOpen(false)}
            className="h-9 px-3 rounded-md text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              setHeaderSearchValue(
                selectedCalendarDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              );
              setIsCalendarModalOpen(false);
            }}
            className="h-9 px-3 rounded-md text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
          >
            JUMP TO DATE
          </button>
        </div>
      </div>
    </div>
  );
};
