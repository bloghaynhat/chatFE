import { FiEdit2, FiX } from "react-icons/fi";

export const QuickActionFab = ({
  onClick,
  disabled = false,
  isOpen = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="absolute bottom-4 right-4 h-14 w-14 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-gray-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-2xl z-50 transform hover:scale-105 active:scale-95"
      title="Open quick actions"
      aria-label="Open quick actions"
    >
      <div
        className={`transition-transform duration-300 flex items-center justify-center ${isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
      >
        <FiEdit2 className="text-2xl absolute" />
      </div>
      <div
        className={`transition-transform duration-300 flex items-center justify-center ${isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}
      >
        <FiX className="text-3xl absolute" />
      </div>
    </button>
  );
};
