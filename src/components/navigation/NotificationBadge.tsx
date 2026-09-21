
export interface NotificationBadgeProps {
  count: number;
  variant?: "desktop" | "mobile-chat" | "mobile-alerts";
  className?: string;
}

export function NotificationBadge({
  count,
  variant = "desktop",
  className = "",
}: NotificationBadgeProps) {
  if (!count || count <= 0) return null;

  const displayCount = count > 99 ? "99+" : String(count);

  if (variant === "mobile-chat") {
    return (
      <span
        className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#f0b45a] text-white text-[8px] font-bold leading-4 text-center ring-[2.5px] ring-white shadow-[0_2px_6px_rgba(240,180,90,0.35)] select-none ${className}`}
        aria-label={`${displayCount} unread messages`}
      >
        {displayCount}
      </span>
    );
  }

  if (variant === "mobile-alerts") {
    return (
      <span
        className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ef8a8a] text-white text-[8px] font-bold leading-4 text-center ring-[2.5px] ring-white shadow-[0_2px_6px_rgba(239,138,138,0.35)] select-none ${className}`}
        aria-label={`${displayCount} unread notifications`}
      >
        {displayCount}
      </span>
    );
  }

  // Default: desktop variant
  return (
    <span
      className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white select-none ${className}`}
      aria-label={`${displayCount} unread items`}
    >
      {displayCount}
    </span>
  );
}

export default NotificationBadge;
