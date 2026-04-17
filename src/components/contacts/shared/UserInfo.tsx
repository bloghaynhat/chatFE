/**
 * UserInfo Component
 * Hiển thị tên user và số điện thoại
 *
 * Props:
 * - name: User's display name
 * - phone: User's phone number
 */
export const UserInfo = ({ name = "Unknown", phone = "" }) => (
  <div className="flex-1 min-w-0">
    <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{name}</p>
    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Số điện thoại: {phone}</p>
  </div>
);
