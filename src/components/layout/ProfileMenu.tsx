import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks";
import { useLanguage } from "../../context";

export const ProfileMenu = ({ onClose, onOpenProfile }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const handleMenuItemClick = (itemId) => {
    if (itemId === "profile") {
      onOpenProfile?.();
      return;
    }

    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const menuItems = [
    { label: t("profile.setEmojiStatus"), id: "emoji" },
    { label: t("profile.myProfile"), id: "profile" },
    { label: t("profile.wallet"), id: "wallet" },
    { label: t("nav.newGroup"), id: "group" },
    { label: t("profile.newChannel"), id: "channel" },
    { label: t("nav.contacts"), id: "contacts" },
    { label: t("profile.calls"), id: "calls" },
    { label: t("nav.savedMessages"), id: "saved" },
    { label: t("nav.settings"), id: "settings" },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg dark:shadow-xl border dark:border-slate-700 overflow-hidden z-50"
    >
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-lg shadow-md overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user?.displayName} className="w-full h-full object-cover" />
            ) : (
              user?.displayName?.charAt(0) || t("app.user").charAt(0)
            )}
          </div>
          <div>
            <p className="font-semibold text-white">{user?.displayName || t("app.user")}</p>
            <p className="text-xs text-blue-100">{t("app.online")}</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-slate-700" />

      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {menuItems.map((item, index) => (
          <div key={item.id}>
            <button
              onClick={() => handleMenuItemClick(item.id)}
              className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition flex items-center gap-3 text-sm"
            >
              {item.label}
            </button>
            {index === 7 && <div className="h-px bg-gray-200 dark:bg-slate-700" />}
          </div>
        ))}
      </div>

      <div className="border-t dark:border-slate-700 p-2">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition"
        >
          {t("nav.logout")}
        </button>
      </div>
    </div>
  );
};
