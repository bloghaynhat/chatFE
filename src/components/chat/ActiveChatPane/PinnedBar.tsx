import { useState, useEffect, useRef } from "react";
import { FiMapPin, FiList, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getMessageText } from "../../../utils/chatUtils";
import type { Message } from "../../../types/conversation";

interface PinnedBarProps {
  pinnedMessages: Message[];
  currentUserId: string;
  onUnpin: (messageId: string) => Promise<void>;
  onOpenList: () => void;
  onNavigateToMessage: (messageId: string) => void;
}

export const PinnedBar: React.FC<PinnedBarProps> = ({
  pinnedMessages,
  currentUserId,
  onUnpin,
  onOpenList,
  onNavigateToMessage,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Reset to first pin when messages change
  useEffect(() => {
    setCurrentIndex(0);
  }, [pinnedMessages.length]);

  const getSenderName = (msg: Message) => {
    return msg?.sender?.displayName || msg?.senderName || "Unknown";
  };

  const activePin = pinnedMessages[currentIndex];
  const senderName = activePin ? getSenderName(activePin) : "";

  const handlePinClick = () => {
    if (activePin) {
      onNavigateToMessage(activePin.id || activePin._id);
    }
  };

  const handleCycleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = (currentIndex + 1) % pinnedMessages.length;
    setCurrentIndex(nextIndex);
    onNavigateToMessage(pinnedMessages[nextIndex].id || pinnedMessages[nextIndex]._id);
  };

  const handleCyclePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIndex = (currentIndex - 1 + pinnedMessages.length) % pinnedMessages.length;
    setCurrentIndex(prevIndex);
    onNavigateToMessage(pinnedMessages[prevIndex].id || pinnedMessages[prevIndex]._id);
  };

  const handleUnpin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePin) {
      try {
        await onUnpin(activePin.id || activePin._id);
        // Reset to first pin if we're at the last one
        if (currentIndex >= pinnedMessages.length - 1) {
          setCurrentIndex(Math.max(0, pinnedMessages.length - 2));
        }
      } catch (error) {
        console.error("Failed to unpin:", error);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next
        handleCycleNext({ stopPropagation: () => {} } as React.MouseEvent);
      } else {
        // Swipe right - prev
        handleCyclePrev({ stopPropagation: () => {} } as React.MouseEvent);
      }
    }
  };

  if (pinnedMessages.length === 0) {
    return null;
  }

  const totalPinned = pinnedMessages.length;
  const hasMultiple = totalPinned > 1;

  return (
    <div
      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-900/80 border-b border-blue-100 dark:border-slate-700 px-4 py-2 cursor-pointer select-none"
      onClick={handlePinClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center gap-3">
        {/* Progress Indicators (Instagram Stories style) */}
        <div className="flex gap-1.5 shrink-0">
          {pinnedMessages.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "bg-blue-500 dark:bg-blue-400 w-6"
                  : idx < currentIndex
                  ? "bg-blue-300 dark:bg-blue-600/50 w-4"
                  : "bg-gray-300 dark:bg-slate-600 w-4"
              }`}
            />
          ))}
        </div>

        {/* Preview Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <FiMapPin className="text-blue-500 dark:text-blue-400 shrink-0" strokeWidth={2.5} />
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">
              Pinned {totalPinned > 1 ? `(${currentIndex + 1}/${totalPinned})` : ""}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium truncate">
              {senderName}
            </p>
            <p className="text-[13px] text-gray-700 dark:text-gray-200 truncate leading-tight">
              {activePin ? getMessageText(activePin) : ""}
            </p>
          </div>
        </div>

        {/* Navigation & Action Buttons */}
        {hasMultiple && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCyclePrev}
              className="p-1 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="Previous pinned message"
            >
              <FiChevronLeft className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleCycleNext}
              className="p-1 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="Next pinned message"
            >
              <FiChevronRight className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        )}

        <button
          onClick={handleUnpin}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full transition-colors shrink-0"
          title="Unpin message"
        >
          <FiX />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenList();
          }}
          className="p-1 hover:bg-blue-100 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-full transition-colors shrink-0"
          title="View all pinned messages"
        >
          <FiList />
        </button>
      </div>
    </div>
  );
};

export default PinnedBar;
