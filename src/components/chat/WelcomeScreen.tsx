import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiMessageCircle,
  FiUsers,
} from "react-icons/fi";

const slideIllustrations = {
  chat: (
    <svg
      viewBox="0 0 320 220"
      className="h-full w-full"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="welcome-chat-a"
          x1="54"
          y1="20"
          x2="260"
          y2="196"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect
        x="58"
        y="36"
        width="204"
        height="136"
        rx="30"
        fill="url(#welcome-chat-a)"
        opacity="0.14"
      />
      <rect x="72" y="48" width="128" height="54" rx="20" fill="#FFFFFF" />
      <rect x="92" y="66" width="76" height="8" rx="4" fill="#60A5FA" />
      <rect x="92" y="82" width="48" height="8" rx="4" fill="#BFDBFE" />
      <rect x="124" y="116" width="132" height="58" rx="21" fill="#2563EB" />
      <rect
        x="148"
        y="135"
        width="78"
        height="8"
        rx="4"
        fill="#FFFFFF"
        opacity="0.95"
      />
      <rect
        x="148"
        y="151"
        width="50"
        height="8"
        rx="4"
        fill="#DBEAFE"
        opacity="0.88"
      />
      <circle cx="88" cy="152" r="22" fill="#10B981" opacity="0.18" />
      <path
        d="M80 152l6 6 12-14"
        stroke="#10B981"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  files: (
    <svg
      viewBox="0 0 320 220"
      className="h-full w-full"
      role="img"
      aria-hidden="true"
    >
      <rect x="70" y="42" width="122" height="148" rx="24" fill="#FFFFFF" />
      <path d="M152 42l40 40h-27a13 13 0 01-13-13V42z" fill="#BFDBFE" />
      <rect x="92" y="102" width="78" height="9" rx="4.5" fill="#60A5FA" />
      <rect x="92" y="122" width="56" height="9" rx="4.5" fill="#CBD5E1" />
      <rect x="92" y="142" width="72" height="9" rx="4.5" fill="#CBD5E1" />
      <rect x="168" y="88" width="92" height="78" rx="22" fill="#10B981" />
      <path
        d="M198 124h32M214 108v32"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="78" cy="64" r="15" fill="#F59E0B" opacity="0.2" />
      <circle cx="250" cy="58" r="19" fill="#2563EB" opacity="0.16" />
    </svg>
  ),
  groups: (
    <svg
      viewBox="0 0 320 220"
      className="h-full w-full"
      role="img"
      aria-hidden="true"
    >
      <rect x="68" y="48" width="184" height="126" rx="32" fill="#EEF2FF" />
      <circle cx="160" cy="90" r="28" fill="#2563EB" />
      <circle cx="109" cy="111" r="22" fill="#38BDF8" />
      <circle cx="211" cy="111" r="22" fill="#10B981" />
      <path
        d="M117 160c7-24 28-38 43-38s36 14 43 38"
        fill="#2563EB"
        opacity="0.2"
      />
      <path
        d="M76 158c5-20 19-31 33-31s28 11 33 31"
        fill="#38BDF8"
        opacity="0.28"
      />
      <path
        d="M178 158c5-20 19-31 33-31s28 11 33 31"
        fill="#10B981"
        opacity="0.28"
      />
      <rect
        x="126"
        y="154"
        width="68"
        height="12"
        rx="6"
        fill="#2563EB"
        opacity="0.8"
      />
    </svg>
  ),
};

const slides = [
  {
    id: "chat",
    icon: FiMessageCircle,
    title: "Nhắn tin mượt mà",
    description:
      "Giao tiếp không độ trễ, lưu trữ tin nhắn an toàn và đồng bộ trên mọi thiết bị.",
    illustration: slideIllustrations.chat,
  },
  {
    id: "files",
    icon: FiFileText,
    title: "Gửi file siêu tốc",
    description:
      "Chia sẻ tài liệu, hình ảnh và video với tốc độ cao trong từng cuộc trò chuyện.",
    illustration: slideIllustrations.files,
  },
  {
    id: "groups",
    icon: FiUsers,
    title: "Quản lý nhóm hiệu quả",
    description:
      "Phân quyền chi tiết, duyệt thành viên và tạo liên kết mời nhóm nhanh chóng.",
    illustration: slideIllustrations.groups,
  },
];

export const WelcomeScreen = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goToSlide = useCallback(
    (nextIndex: number) => {
      const normalizedIndex = (nextIndex + slides.length) % slides.length;
      setDirection(
        normalizedIndex > activeIndex ||
          (activeIndex === slides.length - 1 && normalizedIndex === 0)
          ? 1
          : -1,
      );
      setActiveIndex(normalizedIndex);
    },
    [activeIndex],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [activeIndex]);

  const activeSlide = slides[activeIndex];
  const ActiveIcon = activeSlide.icon;

  return (
    <section className="flex-1 w-full h-full min-h-0 overflow-hidden bg-gray-50 dark:bg-slate-900/50">
      <div className="relative flex h-full w-full flex-col items-center justify-center px-6 py-8 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-[0.45] dark:opacity-[0.18]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.10),transparent_28%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:34px_34px]" />
        </div>

        <div className="relative z-10 flex w-full max-w-[680px] flex-col items-center select-none">
          <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl lg:text-[32px] ">
            Chào mừng đến với ChatChit!
          </h1>
          <p className="mb-8 max-w-[500px] text-sm leading-relaxed text-gray-500 dark:text-gray-400 md:mb-12 md:text-base">
            Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người
            thân, bạn bè mỗi ngày.
          </p>

          <div className="relative flex h-[320px] w-full max-w-[600px] items-center justify-center overflow-hidden px-12 sm:h-[350px]">
            <button
              type="button"
              aria-label="Slide trước"
              onClick={() => goToSlide(activeIndex - 1)}
              className="absolute left-0 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-blue-600 shadow-md transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeSlide.id}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 64 : -64 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -64 : 64 }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full flex-col items-center"
              >
                <div className="mb-6 h-[180px] w-full max-w-[300px] drop-shadow-lg sm:h-[200px]">
                  {activeSlide.illustration}
                </div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {activeSlide.title}
                </h2>
                <p className="mx-auto max-w-[400px] text-sm text-gray-600 dark:text-gray-300">
                  {activeSlide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              aria-label="Slide tiếp theo"
              onClick={() => goToSlide(activeIndex + 1)}
              className="absolute right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-blue-600 shadow-md transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 md:mt-10 select-none">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Đến slide ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${index === activeIndex
                  ? "w-6 bg-blue-500"
                  : "w-2 bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
