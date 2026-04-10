import { useEffect } from "react";
import { FiUser, FiUsers, FiUserPlus } from "react-icons/fi";
import { MdOutlineCampaign } from "react-icons/md";

// mapping to image 2 text but using image 1 style icons:
// action 1 (bottom): "New message" -> using person icon like Img 1 "New Private Chat"
// action 2 (middle): "Create group" -> using people icon like Img 1 "New Group"
// action 3 (top): "Add contact" -> using megaphone/channel icon like Img 1 "New Channel" (or user plus to make more sense)
// In Hình 1, it's Megaphone -> New Channel, People -> New Group, Person -> New Private Chat.
// Since you wanted actions from Hình 2 ("New message", "Create group", "Add contact") with icons from Hình 1:
const quickActions = [
  {
    id: "add-contact",
    label: "Add contact",
    icon: <MdOutlineCampaign className="text-2xl" />,
  },
  {
    id: "create-group",
    label: "Create group",
    icon: <FiUsers className="text-xl" />,
  },
  {
    id: "new-message",
    label: "New message",
    icon: <FiUser className="text-xl" />,
  },
];

export const QuickActionSheet = ({ isOpen, onClose, onSelectAction }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  // Keep it mounted but control visibility via CSS
  return (
    <>
      <div
        className={`absolute inset-0 bg-black/10 z-30 transition-opacity duration-200 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
      />

      <div
        className={`absolute bottom-20 right-4 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden border border-gray-100 dark:border-slate-700 transition-all duration-200 transform origin-bottom-right ${isOpen ? "scale-100 opacity-100" : "scale-75 opacity-0 pointer-events-none"}`}
      >
        <div className="py-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                onSelectAction(action.id);
                onClose();
              }}
              className="w-full flex items-center gap-4 px-4 py-3 text-left font-medium text-[15px] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex w-6 justify-center">{action.icon}</div>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
