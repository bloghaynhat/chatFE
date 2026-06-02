import { FiArrowLeft, FiMenu, FiSearch, FiX } from "react-icons/fi";
import { useLanguage } from "../../context";

export const MainTaskbar = ({
  searchValue,
  onSearchChange,
  onOpenMenu,
  onClearSearch,
  onExitSearch = () => {},
  onSearchFocus = () => {},
  onSearchBlur = () => {},
  isSearchMode = false,
  friendRequestCount = 0,
  isCollapsed = false,
  placeholder = "Search",
}) => {
  const { t } = useLanguage();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-3 border-b dark:border-slate-700 bg-white dark:bg-slate-900 ${isCollapsed ? "justify-center" : ""}`}
    >
      <button
        onClick={isSearchMode ? onExitSearch : onOpenMenu}
        className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition flex-shrink-0 relative overflow-visible"
        title={isSearchMode ? t("app.back") : t("nav.openMenu")}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
            isSearchMode ? "-rotate-180 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        >
          <FiMenu className="text-xl" />
        </span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
            isSearchMode ? "rotate-0 scale-100 opacity-100" : "rotate-180 scale-75 opacity-0"
          }`}
        >
          <FiArrowLeft className="text-xl" />
        </span>
        {!isSearchMode && friendRequestCount > 0 && (
          <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
            {friendRequestCount > 9 ? "9+" : friendRequestCount}
          </span>
        )}
      </button>

      {!isCollapsed && (
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            placeholder={placeholder}
            className="w-full h-10 pl-10 pr-10 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
          />

          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <FiSearch className="text-lg opacity-70" />
          </span>

          {searchValue.trim() && (
            <button
              onMouseDown={(event) => event.preventDefault()}
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-300"
              title={t("search.clear")}
            >
              <FiX className="text-lg opacity-80" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
