/**
 * Avatar Component
 * Reusable avatar với gradient background và initials fallback
 *
 * Props:
 * - name: Display name để generate initials
 * - src: Avatar image URL
 * - size: "sm" | "md" | "lg" (default: "md")
 */
export const Avatar = ({ name = "?", src, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden`}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className={textSizeClasses[size]}>{name?.charAt(0).toUpperCase() || "?"}</span>
      )}
    </div>
  );
};
