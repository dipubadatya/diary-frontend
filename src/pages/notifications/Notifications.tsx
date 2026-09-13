import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";

import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  UserPlus,
  Trash2,
  CheckCheck,
  Search,
  BellOff,
  Settings,
  SlidersHorizontal,
  X,
  ArrowLeft,
  Inbox,
  Sparkles,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

import api from "../../services/api";
import { ErrorCard } from "../../components/ErrorCard";
import { useSocket } from "../../contexts/SocketContext";
import moment from "moment";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface NotificationUser {
  _id: string;
  username: string;
  name: string;
  image?: { url: string };
}

interface NotificationStory {
  _id: string;
  title: string;
}

interface NotificationItem {
  _id: string;
  type: "like" | "comment" | "follow";
  targetType?: "story" | "comment";
  fromUser: NotificationUser | null;
  storyId?: NotificationStory | string | null;
  storyTitle?: string;
  timeStamp: string;
  read: boolean;
}

interface NotificationGroups {
  today: NotificationItem[];
  yesterday: NotificationItem[];
  older: NotificationItem[];
}

type FilterType = "all" | "unread" | "like" | "comment" | "follow";
type GroupKey = keyof NotificationGroups;

interface InlineError {
  id: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers — safe data extraction so bad payloads don't crash UI
// ─────────────────────────────────────────────────────────────

const getUserData = (user: NotificationUser | null | undefined) => {
  const isValid = !!(user && user._id && user.username);
  const name = user?.name || user?.username || "Someone";
  const username = user?.username || null;
  const avatar =
    user?.image?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e0e7ff&color=4f46e5&bold=true`;

  return { isValid, name, username, avatar };
};

const getStoryData = (
  story: NotificationStory | string | null | undefined,
  fallbackTitle?: string,
) => {
  let id: string | null = null;
  let title: string | null = null;

  if (typeof story === "object" && story !== null) {
    id = story._id?.toString() || null;
    title = story.title || null;
  } else if (typeof story === "string" && story.trim()) {
    id = story.trim();
  }

  if (!title && fallbackTitle?.trim()) {
    title = fallbackTitle.trim();
  }

  return { id, title, isValid: !!id };
};

const safeTimeAgo = (timestamp: string | undefined | null): string => {
  if (!timestamp) return "";
  try {
    const m = moment(timestamp);
    return m.isValid() ? m.fromNow() : "";
  } catch {
    return "";
  }
};

// ─────────────────────────────────────────────────────────────
// Style configs for each notification type (icon + colors)
// ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  like: {
    icon: Heart,
    bg: "bg-gradient-to-br from-rose-400 to-rose-600",
    fill: true,
    action: "liked",
  },
  comment: {
    icon: MessageSquare,
    bg: "bg-gradient-to-br from-sky-400 to-sky-600",
    fill: false,
    action: "commented on",
  },
  follow: {
    icon: UserPlus,
    bg: "bg-gradient-to-br from-indigo-400 to-indigo-600",
    fill: false,
    action: "started following you",
  },
} as const;

const FILTERS: { key: FilterType; label: string; icon: React.FC<any> }[] = [
  { key: "all", label: "All", icon: Inbox },
  { key: "unread", label: "Unread", icon: Sparkles },
  { key: "like", label: "Likes", icon: Heart },
  { key: "comment", label: "Comments", icon: MessageSquare },
  { key: "follow", label: "Follows", icon: UserPlus },
];

// ─────────────────────────────────────────────────────────────
// Confirm Modal — reusable dialog for destructive actions
// ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  // Lock scroll + handle ESC while modal is open
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={() => !loading && onCancel()}
    >
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 animate-scaleIn"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              destructive
                ? "bg-rose-100 dark:bg-rose-500/15"
                : "bg-indigo-100 dark:bg-indigo-500/15"
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${destructive ? "text-rose-500" : "text-indigo-500"}`}
              strokeWidth={2}
            />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3
              id="confirm-title"
              className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight"
            >
              {title}
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 ${
              destructive
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-indigo-500 hover:bg-indigo-600"
            }`}
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Banner components — top-of-page feedback for user actions
// ─────────────────────────────────────────────────────────────

const BannerError: React.FC<{
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}> = ({ message, onDismiss, onRetry }) => (
  <div
    role="alert"
    className="flex items-center gap-2.5 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl mb-4 animate-slideDown shadow-sm"
  >
    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
    <span className="text-[12.5px] text-rose-700 dark:text-rose-300 font-medium flex-1">
      {message}
    </span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 underline"
      >
        Retry
      </button>
    )}
    <button
      onClick={onDismiss}
      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
      aria-label="Dismiss error"
    >
      <X className="w-3.5 h-3.5 text-rose-500" strokeWidth={2.5} />
    </button>
  </div>
);

const SuccessBanner: React.FC<{ message: string; onDismiss: () => void }> = ({
  message,
  onDismiss,
}) => (
  <div
    role="status"
    className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl mb-4 animate-slideDown shadow-sm"
  >
    <CheckCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    <span className="text-[12.5px] text-emerald-700 dark:text-emerald-300 font-medium flex-1">
      {message}
    </span>
    <button
      onClick={onDismiss}
      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
      aria-label="Dismiss message"
    >
      <X className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main Notifications Page
// ─────────────────────────────────────────────────────────────

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Data
  const [groups, setGroups] = useState<NotificationGroups>({
    today: [],
    yesterday: [],
    older: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Action state (loading flags + confirmation dialogs)
  const [markingRead, setMarkingRead] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<{
    id: string;
    group: GroupKey;
  } | null>(null);

  // Feedback state
  const [inlineErrors, setInlineErrors] = useState<InlineError[]>([]);
  const [bannerError, setBannerError] = useState<{
    message: string;
    retry?: () => void;
  } | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  // Track inline error timeouts so we can clean them up on unmount
  const inlineTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Auto-dismiss success banner after 3s
  useEffect(() => {
    if (!bannerSuccess) return;
    const t = setTimeout(() => setBannerSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [bannerSuccess]);

  // Auto-dismiss error banner after 6s
  useEffect(() => {
    if (!bannerError) return;
    const t = setTimeout(() => setBannerError(null), 6000);
    return () => clearTimeout(t);
  }, [bannerError]);

  // Clear pending inline-error timers when leaving the page
  useEffect(() => {
    return () => {
      inlineTimeoutsRef.current.forEach((t) => clearTimeout(t));
      inlineTimeoutsRef.current.clear();
    };
  }, []);

  const addInlineError = useCallback((id: string, message: string) => {
    setInlineErrors((prev) => {
      if (prev.some((e) => e.id === id)) return prev;
      return [...prev, { id, message }];
    });

    // Clear any previous timer for this id, then set a new one
    const existing = inlineTimeoutsRef.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      setInlineErrors((prev) => prev.filter((e) => e.id !== id));
      inlineTimeoutsRef.current.delete(id);
    }, 5000);

    inlineTimeoutsRef.current.set(id, timer);
  }, []);

  const dismissInlineError = useCallback((id: string) => {
    const existing = inlineTimeoutsRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      inlineTimeoutsRef.current.delete(id);
    }
    setInlineErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ─── Fetch ─────────────────────────────────────────────────

  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const res = await api.get("/users/notifications");

      if (res.data?.success && res.data.notifications) {
        const raw = res.data.notifications as NotificationGroups;
        setGroups({
          today: Array.isArray(raw.today) ? raw.today : [],
          yesterday: Array.isArray(raw.yesterday) ? raw.yesterday : [],
          older: Array.isArray(raw.older) ? raw.older : [],
        });
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load notifications.";
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Live update: refresh silently when a new notification arrives
  useEffect(() => {
    if (!socket) return;

    const handler = () => fetchNotifications(true);
    socket.on("newNotification", handler);

    return () => {
      socket.off("newNotification", handler);
    };
  }, [socket, fetchNotifications]);

  // ─── Derived data ──────────────────────────────────────────

  const allNotifications = useMemo(
    () => [...groups.today, ...groups.yesterday, ...groups.older],
    [groups],
  );

  const unreadCount = useMemo(
    () => allNotifications.filter((n) => !n.read).length,
    [allNotifications],
  );

  const counts = useMemo(
    () => ({
      all: allNotifications.length,
      unread: unreadCount,
      like: allNotifications.filter((n) => n.type === "like").length,
      comment: allNotifications.filter((n) => n.type === "comment").length,
      follow: allNotifications.filter((n) => n.type === "follow").length,
    }),
    [allNotifications, unreadCount],
  );

  const filterItems = useCallback(
    (items: NotificationItem[]) =>
      items.filter((n) => {
        // Filter by type/unread
        if (activeFilter === "unread" && n.read) return false;
        if (
          activeFilter !== "all" &&
          activeFilter !== "unread" &&
          n.type !== activeFilter
        ) {
          return false;
        }

        // Filter by search query (name, username, story title)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const { name, username } = getUserData(n.fromUser);
          const { title } = getStoryData(n.storyId, n.storyTitle);
          const matches =
            name.toLowerCase().includes(q) ||
            (username || "").toLowerCase().includes(q) ||
            (title || "").toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      }),
    [activeFilter, searchQuery],
  );

  const filteredGroups = useMemo(
    () => ({
      today: filterItems(groups.today),
      yesterday: filterItems(groups.yesterday),
      older: filterItems(groups.older),
    }),
    [groups, filterItems],
  );

  const filteredTotal =
    filteredGroups.today.length +
    filteredGroups.yesterday.length +
    filteredGroups.older.length;

  // ─── Actions ───────────────────────────────────────────────

  // Delete a single notification with optimistic update + rollback
  const performDelete = useCallback(
    async (notifId: string, groupKey: GroupKey) => {
      const backup = groups[groupKey];

      setGroups((prev) => ({
        ...prev,
        [groupKey]: prev[groupKey].filter((n) => n._id !== notifId),
      }));
      dismissInlineError(notifId);

      try {
        const res = await api.delete(`/users/notifications/${notifId}`);
        if (!res.data?.success) throw new Error("Delete failed");
      } catch {
        // Restore on failure and show an inline error for this item
        setGroups((prev) => ({ ...prev, [groupKey]: backup }));
        addInlineError(notifId, "Could not remove. Please try again.");
      }
    },
    [groups, addInlineError, dismissInlineError],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;

    setMarkingRead(true);
    setBannerError(null);

    try {
      const res = await api.put("/users/notifications/mark-read");
      if (res.data?.success === false) throw new Error();

      setGroups((prev) => ({
        today: prev.today.map((n) => ({ ...n, read: true })),
        yesterday: prev.yesterday.map((n) => ({ ...n, read: true })),
        older: prev.older.map((n) => ({ ...n, read: true })),
      }));
      setBannerSuccess("All notifications marked as read");
    } catch {
      setBannerError({
        message: "Failed to mark all as read.",
        retry: handleMarkAllRead,
      });
    } finally {
      setMarkingRead(false);
    }
  }, [unreadCount]);

  // Clear everything — tries bulk endpoint, falls back to per-item deletes
  const performClearAll = useCallback(async () => {
    if (allNotifications.length === 0) return;

    setClearingAll(true);
    setBannerError(null);

    const backup = groups;
    setGroups({ today: [], yesterday: [], older: [] });

    try {
      const res = await api.delete("/users/notifications");
      if (!res.data?.success) throw new Error();
      setBannerSuccess("All notifications cleared");
      setConfirmClearOpen(false);
    } catch {
      // Fallback: try to delete each notification individually
      try {
        const results = await Promise.allSettled(
          allNotifications.map((n) =>
            api.delete(`/users/notifications/${n._id}`),
          ),
        );

        const failed = results.filter((r) => r.status === "rejected").length;

        if (failed === 0) {
          setBannerSuccess("All notifications cleared");
          setConfirmClearOpen(false);
        } else if (failed < allNotifications.length) {
          // Partial success — refresh from server to sync state
          setBannerError({
            message: `${failed} notification${failed > 1 ? "s" : ""} could not be removed.`,
            retry: performClearAll,
          });
          await fetchNotifications(true);
          setConfirmClearOpen(false);
        } else {
          throw new Error("All deletes failed");
        }
      } catch {
        setGroups(backup);
        setBannerError({
          message: "Could not clear notifications.",
          retry: performClearAll,
        });
      }
    } finally {
      setClearingAll(false);
    }
  }, [allNotifications, groups, fetchNotifications]);

  // Route the user based on notification type
  const handleNotificationClick = useCallback(
    (notif: NotificationItem) => {
      if (notif.type === "follow") {
        const { username } = getUserData(notif.fromUser);
        if (username) navigate(`/profile/${username}`);
        return;
      }
      const { id } = getStoryData(notif.storyId, notif.storyTitle);
      if (id) navigate(`/stories/${id}`);
    },
    [navigate],
  );

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setActiveFilter("all");
    setShowSearch(false);
  }, []);

  // ─── Render helpers ────────────────────────────────────────

  const renderNotification = (notif: NotificationItem, groupKey: GroupKey) => {
    const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.follow;
    const Icon = config.icon;
    const isUnread = !notif.read;

    const user = getUserData(notif.fromUser);
    const story = getStoryData(notif.storyId, notif.storyTitle);

    const isClickable =
      (notif.type === "follow" && user.isValid) ||
      (notif.type !== "follow" && story.isValid);

    const inlineErr = inlineErrors.find((e) => e.id === notif._id);

    // Label for the "target" in like/comment notifications
    const targetLabel =
      notif.type === "like"
        ? notif.targetType === "comment"
          ? "your comment"
          : "your story"
        : notif.type === "comment"
          ? "your story"
          : "";

    // Keyboard-accessible activation for the card
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isClickable) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleNotificationClick(notif);
      }
    };

    return (
      <div key={notif._id} className="mb-2.5 last:mb-0">
        <div
          onClick={() => isClickable && handleNotificationClick(notif)}
          onKeyDown={handleKeyDown}
          role={isClickable ? "button" : undefined}
          tabIndex={isClickable ? 0 : undefined}
          aria-label={
            isClickable ? `View ${notif.type} notification` : undefined
          }
          className={`group relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4956a]/50 ${
            isClickable ? "cursor-pointer" : "cursor-default"
          } ${
            isUnread
              ? "bg-white dark:bg-slate-900 border-[#c4956a]/25 dark:border-[#c4956a]/20 shadow-[0_4px_20px_rgba(196,149,106,0.08)] hover:shadow-[0_6px_24px_rgba(196,149,106,0.14)] hover:border-[#c4956a]/40"
              : "bg-white dark:bg-slate-900 border-slate-100/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)] hover:border-slate-200 dark:hover:border-slate-700"
          }`}
        >
          {/* Unread indicator dot */}
          {isUnread && (
            <span
              className="absolute left-3 top-3 w-2 h-2 rounded-full bg-[#c4956a] shadow-[0_0_6px_rgba(196,149,106,0.6)]"
              aria-hidden="true"
            />
          )}

          {/* Avatar with type badge */}
          <div className={`relative shrink-0 ${isUnread ? "ml-1.5" : ""}`}>
            {user.isValid && user.username ? (
              <Link
                to={`/profile/${user.username}`}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Go to ${user.name}'s profile`}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm group-hover:ring-[#c4956a]/30 transition-all"
                />
              </Link>
            ) : (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover opacity-50 grayscale ring-2 ring-white dark:ring-slate-900"
              />
            )}

            <div
              className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${config.bg} ring-[2.5px] ring-white dark:ring-slate-900 flex items-center justify-center shadow-sm`}
              aria-hidden="true"
            >
              <Icon
                className="w-2.5 h-2.5 text-white"
                fill={config.fill ? "white" : "none"}
                strokeWidth={2.5}
              />
            </div>
          </div>

          {/* Message body */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-[13.5px] leading-snug text-slate-600 dark:text-slate-400 line-clamp-2">
              {user.isValid && user.username ? (
                <Link
                  to={`/profile/${user.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-slate-900 dark:text-white hover:text-[#c4956a] dark:hover:text-[#c4956a] transition-colors"
                >
                  {user.name}
                </Link>
              ) : (
                <span className="font-semibold text-slate-500 dark:text-slate-500 italic">
                  {user.name}
                </span>
              )}
              <span className="text-slate-500 dark:text-slate-400">
                {" "}
                {config.action}{" "}
              </span>

              {notif.type !== "follow" && (
                <>
                  {story.title ? (
                    story.isValid && story.id ? (
                      <Link
                        to={`/stories/${story.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-[#c4956a] hover:text-[#a87b52] transition-colors"
                      >
                        &ldquo;{story.title}&rdquo;
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-400 dark:text-slate-500 italic">
                        &ldquo;{story.title}&rdquo;
                        <span className="ml-1 text-[10px] text-rose-400 not-italic font-semibold">
                          deleted
                        </span>
                      </span>
                    )
                  ) : story.isValid && story.id ? (
                    <Link
                      to={`/stories/${story.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-[#c4956a] hover:text-[#a87b52] transition-colors"
                    >
                      {targetLabel}
                    </Link>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic">
                      {targetLabel}
                      <span className="ml-1 text-[10px] text-rose-400 not-italic font-semibold">
                        deleted
                      </span>
                    </span>
                  )}
                </>
              )}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {safeTimeAgo(notif.timeStamp)}
              </span>
              {isUnread && (
                <span className="text-[9px] font-bold uppercase tracking-wide text-[#c4956a] bg-[#c4956a]/10 px-1.5 py-0.5 rounded-md">
                  New
                </span>
              )}
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-1 shrink-0">
            {isClickable && (
              <ChevronRight
                className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#c4956a] group-hover:translate-x-0.5 transition-all hidden sm:block"
                aria-hidden="true"
              />
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId({ id: notif._id, group: groupKey });
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 active:scale-95 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Remove notification"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Per-item inline error (shown when delete fails) */}
        {inlineErr && (
          <div
            role="alert"
            className="flex items-center gap-2 mt-1.5 mx-1 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex-1">
              {inlineErr.message}
            </span>
            <button
              onClick={() => dismissInlineError(notif._id)}
              className="text-[10px] text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderGroup = (
    items: NotificationItem[],
    key: GroupKey,
    title: string,
  ) => {
    if (items.length === 0) return null;

    return (
      <section className="mb-7 last:mb-0" aria-label={title}>
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            {title}
          </h3>
          <span className="text-[10px] font-bold text-[#c4956a] bg-[#c4956a]/10 border border-[#c4956a]/15 px-2 py-0.5 rounded-full tabular-nums">
            {items.length}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-200/80 dark:from-slate-800 to-transparent" />
        </div>

        <div>{items.map((n) => renderNotification(n, key))}</div>
      </section>
    );
  };

  // ─── Main render ───────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
      {/* Header + filters */}
      <div className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Header card (dark gilded) */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[20px] mb-6 sm:mb-8 border border-white/[0.06] shadow-xl">
          {/* Layered background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#18161a] via-[#121014] to-[#0c0b0e]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(196,149,106,0.18),_transparent_55%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(140,110,80,0.12),_transparent_50%)] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c4956a]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Top row: title + actions */}
          <div className="relative z-10 flex items-center justify-between gap-3 px-3.5 py-3 sm:px-5 sm:py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#a89f96] hover:text-[#f5f0ea] transition-colors active:scale-95 shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
              </button>

              {/* Bronze accent bar */}
              <div className="w-[3px] self-stretch min-h-[32px] rounded-full bg-gradient-to-b from-[#e8c9a0] via-[#c4956a] to-[#8b6a4a] shrink-0 opacity-90" />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-[14px] sm:text-base font-semibold text-[#f5f0ea] tracking-tight truncate leading-tight">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#c4956a]/15 border border-[#c4956a]/25 text-[11px] font-semibold text-[#e5c3a6] tabular-nums shrink-0">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-[12px] text-[#a89f96] mt-0.5 truncate leading-none">
                  {unreadCount > 0 ? "Unread updates" : "Activity logs"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const next = !showSearch;
                  setShowSearch(next);
                  if (!next) setSearchQuery("");
                }}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all border active:scale-95 ${
                  showSearch
                    ? "bg-[#c4956a]/15 border-[#c4956a]/40 text-[#e5c3a6]"
                    : "bg-white/[0.05] border-white/10 text-[#a89f96] hover:bg-white/[0.1] hover:text-[#f5f0ea]"
                }`}
                aria-label={showSearch ? "Close search" : "Open search"}
                aria-expanded={showSearch}
              >
                <Search className="w-4 h-4" strokeWidth={2.5} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingRead}
                  className="h-8 sm:h-9 px-3 rounded-full text-[11px] sm:text-[12px] font-semibold text-[#121014] bg-gradient-to-r from-[#e8c9a0] to-[#c4956a] hover:opacity-95 active:scale-95 disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
                >
                  {markingRead ? (
                    <RefreshCw
                      className="w-3.5 h-3.5 animate-spin"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
                  )}
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}

              <button
                onClick={() => navigate("/settings")}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-[#a89f96] hover:text-[#f5f0ea] transition-colors active:scale-95 shrink-0"
                aria-label="Open settings"
              >
                <Settings className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Collapsible search field */}
          {showSearch && (
            <div className="relative z-10 px-3.5 pb-3 sm:px-5 sm:pb-3.5 border-t border-white/[0.06] pt-3 animate-slideDown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a89f96]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search notifications"
                  className="w-full pl-9 pr-8 h-8 sm:h-9 bg-white/[0.04] border border-white/10 rounded-full text-[11px] sm:text-[12px] text-[#f5f0ea] placeholder-[#a89f96]/40 outline-none focus:border-[#c4956a]/50 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3 text-[#a89f96]" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filter chips */}
        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-4"
          role="tablist"
          aria-label="Notification filters"
        >
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.key;
            const count = counts[f.key];

            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                role="tab"
                aria-selected={isActive}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 border ${
                  isActive
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span>{f.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0 rounded-full tabular-nums ${
                      isActive
                        ? "bg-white/20 dark:bg-slate-900/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed content */}
      <main className="max-w-2xl mx-auto px-4">
        {bannerSuccess && (
          <SuccessBanner
            message={bannerSuccess}
            onDismiss={() => setBannerSuccess(null)}
          />
        )}

        {bannerError && (
          <BannerError
            message={bannerError.message}
            onDismiss={() => setBannerError(null)}
            onRetry={bannerError.retry}
          />
        )}

        {loading ? (
          // Skeleton placeholders
          <div
            className="space-y-2.5"
            aria-busy="true"
            aria-label="Loading notifications"
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-3/4" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 px-2">
            <ErrorCard
              title="Could not load notifications"
              message={error}
              actionLabel="Try again"
              onAction={() => fetchNotifications()}
            />
          </div>
        ) : filteredTotal === 0 ? (
          // Empty state — differentiates between "no results" and "no data"
          <div className="text-center py-16 sm:py-20 px-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-5 shadow-inner">
              {searchQuery || activeFilter !== "all" ? (
                <SlidersHorizontal
                  className="w-8 h-8 text-indigo-400"
                  strokeWidth={1.5}
                />
              ) : (
                <BellOff
                  className="w-8 h-8 text-indigo-400"
                  strokeWidth={1.5}
                />
              )}
            </div>
            <h3 className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white">
              {searchQuery || activeFilter !== "all"
                ? "Nothing found"
                : "You're all caught up!"}
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {searchQuery || activeFilter !== "all"
                ? "Try adjusting your search or filters to see more results."
                : "When someone likes your stories, comments, or follows you, updates will appear here."}
            </p>
            {(searchQuery || activeFilter !== "all") && (
              <button
                onClick={resetFilters}
                className="mt-5 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12.5px] font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {renderGroup(filteredGroups.today, "today", "Today")}
            {renderGroup(filteredGroups.yesterday, "yesterday", "Yesterday")}
            {renderGroup(filteredGroups.older, "older", "Earlier")}

            {/* Bulk "clear all" action */}
            {allNotifications.length > 0 && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={clearingAll}
                  className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation dialogs */}
      <ConfirmModal
        open={confirmClearOpen}
        title="Clear all notifications?"
        message="This will permanently remove all your notifications. This action cannot be undone."
        confirmLabel="Clear all"
        cancelLabel="Cancel"
        destructive
        loading={clearingAll}
        onConfirm={performClearAll}
        onCancel={() => !clearingAll && setConfirmClearOpen(false)}
      />

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Remove notification?"
        message="This notification will be permanently removed."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (confirmDeleteId) {
            performDelete(confirmDeleteId.id, confirmDeleteId.group);
            setConfirmDeleteId(null);
          }
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Local animation styles */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default Notifications;
