import { FiArrowLeft, FiSearch, FiX } from "react-icons/fi";
import { useLanguage } from "../../context";

/**
 * ContactsHeader Component
 * Header với back button và search input
 *
 * Props:
 * - searchQuery: Current search query value
 * - onSearchChange: Callback khi search input thay đổi
 * - onBack: Callback khi back button được click
 */
export const ContactsHeader = ({ searchQuery = "", onSearchChange, onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="px-3 py-3 border-b dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-2">
      <button
        onClick={onBack}
        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition flex-shrink-0"
        title={t("app.back")}
      >
        <FiArrowLeft className="w-5 h-5" />
      </button>

      {/* Search Input */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("contacts.searchPlaceholder")}
          className="w-full h-10 pl-9 pr-9 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
        />

        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg opacity-70" />

        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition"
            title={t("search.clear")}
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
