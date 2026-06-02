import { useLanguage } from "../../../context";

/**
 * UserInfo Component
 * Displays a user's name and phone number.
 *
 * Props:
 * - name: User's display name
 * - phone: User's phone number
 */
export const UserInfo = ({ name, phone = "" }) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 min-w-0">
      <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{name || t("app.unknown")}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
        {t("contacts.phone")}: {phone || t("contacts.notAvailable")}
      </p>
    </div>
  );
};
