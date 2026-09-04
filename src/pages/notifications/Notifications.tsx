import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
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
} from 'lucide-react';
import api from '../../services/api';
import { ErrorCard } from '../../components/ErrorCard';
import { useSocket } from '../../contexts/SocketContext';
import moment from 'moment';

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

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
  type: 'like' | 'comment' | 'follow';
  targetType?: 'story' | 'comment';
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

type FilterType = 'all' | 'unread' | 'like' | 'comment' | 'follow';
type GroupKey = keyof NotificationGroups;

interface InlineError {
  id: string;
  message: string;
}

// ══════════════════════════════════════════════
// Safe accessors — handle deleted users/stories
// ══════════════════════════════════════════════

const getUserData = (user: NotificationUser | null | undefined) => {
  const isValid = !!(user && user._id && user.username);
  const name = user?.name || user?.username || 'Someone';
  const username = user?.username || null;
  const avatar =
    user?.image?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=e0e7ff&color=4f46e5&bold=true`;

  return { isValid, name, username, avatar };
};

const getStoryData = (
  story: NotificationStory | string | null | undefined,
  fallbackTitle?: string
) => {
  let id: string | null = null;
  let title: string | null = null;

  if (typeof story === 'object' && story !== null) {
    id = story._id?.toString() || null;
    title = story.title || null;
  } else if (typeof story === 'string' && story.trim()) {
    id = story.trim();
  }

  if (!title && fallbackTitle?.trim()) {
    title = fallbackTitle.trim();
  }

  return { id, title, isValid: !!id };
};

const safeTimeAgo = (timestamp: string | undefined | null): string => {
  if (!timestamp) return '';
  try {
    const m = moment(timestamp);
    return m.isValid() ? m.fromNow() : '';
  } catch {
    return '';
  }
};

// ══════════════════════════════════════════════
// Type Style Config
// ══════════════════════════════════════════════

const TYPE_CONFIG = {
  like: { icon: Heart, bg: 'bg-rose-500', fill: true, label: 'liked' },
  comment: { icon: MessageSquare, bg: 'bg-sky-500', fill: false, label: 'commented' },
  follow: { icon: UserPlus, bg: 'bg-indigo-500', fill: false, label: 'followed' },
} as const;

const FILTERS: { key: FilterType; label: string; icon: React.FC<any> }[] = [
  { key: 'all', label: 'All', icon: Inbox },
  { key: 'unread', label: 'Unread', icon: Sparkles },
  { key: 'like', label: 'Likes', icon: Heart },
  { key: 'comment', label: 'Comments', icon: MessageSquare },
  { key: 'follow', label: 'Follows', icon: UserPlus },
];

// ══════════════════════════════════════════════
// Confirm Modal — replaces window.confirm
// ══════════════════════════════════════════════

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
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && !loading && onCancel();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => !loading && onCancel()}
    >
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 animate-scaleIn"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${destructive
                ? 'bg-rose-100 dark:bg-rose-500/15'
                : 'bg-indigo-100 dark:bg-indigo-500/15'
              }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${destructive ? 'text-rose-500' : 'text-indigo-500'}`}
              strokeWidth={2}
            />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight">
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
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 ${destructive
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// Banner Error — reusable inline banner
// ══════════════════════════════════════════════

const BannerError: React.FC<{
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}> = ({ message, onDismiss, onRetry }) => (
  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl mb-4 animate-slideDown">
    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
    <span className="text-[12px] text-rose-600 dark:text-rose-400 font-medium flex-1">
      {message}
    </span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 underline"
      >
        Retry
      </button>
    )}
    <button
      onClick={onDismiss}
      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
      aria-label="Dismiss"
    >
      <X className="w-3 h-3 text-rose-500" strokeWidth={2.5} />
    </button>
  </div>
);

// ══════════════════════════════════════════════
// Success Toast (inline top banner — no library)
// ══════════════════════════════════════════════

const SuccessBanner: React.FC<{ message: string; onDismiss: () => void }> = ({
  message,
  onDismiss,
}) => (
  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl mb-4 animate-slideDown">
    <CheckCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    <span className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium flex-1">
      {message}
    </span>
    <button
      onClick={onDismiss}
      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
      aria-label="Dismiss"
    >
      <X className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
    </button>
  </div>
);

// ══════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Data state
  const [groups, setGroups] = useState<NotificationGroups>({
    today: [],
    yesterday: [],
    older: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Action state
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

  // ── Auto-dismiss banners ──
  useEffect(() => {
    if (!bannerSuccess) return;
    const t = setTimeout(() => setBannerSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [bannerSuccess]);

  useEffect(() => {
    if (!bannerError) return;
    const t = setTimeout(() => setBannerError(null), 6000);
    return () => clearTimeout(t);
  }, [bannerError]);

  // ── Inline error helpers ──
  const addInlineError = useCallback((id: string, message: string) => {
    setInlineErrors((prev) => {
      if (prev.some((e) => e.id === id)) return prev;
      return [...prev, { id, message }];
    });
    setTimeout(() => {
      setInlineErrors((prev) => prev.filter((e) => e.id !== id));
    }, 5000);
  }, []);

  const dismissInlineError = useCallback((id: string) => {
    setInlineErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const res = await api.get('/users/notifications');

      if (res.data?.success && res.data.notifications) {
        const raw = res.data.notifications as NotificationGroups;
        setGroups({
          today: Array.isArray(raw.today) ? raw.today : [],
          yesterday: Array.isArray(raw.yesterday) ? raw.yesterday : [],
          older: Array.isArray(raw.older) ? raw.older : [],
        });
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load notifications.';
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Realtime socket updates ──
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchNotifications(true);
    socket.on('newNotification', handler);
    return () => {
      socket.off('newNotification', handler);
    };
  }, [socket, fetchNotifications]);

  // ── Derived data ──
  const allNotifications = useMemo(
    () => [...groups.today, ...groups.yesterday, ...groups.older],
    [groups]
  );

  const unreadCount = useMemo(
    () => allNotifications.filter((n) => !n.read).length,
    [allNotifications]
  );

  const counts = useMemo(
    () => ({
      all: allNotifications.length,
      unread: unreadCount,
      like: allNotifications.filter((n) => n.type === 'like').length,
      comment: allNotifications.filter((n) => n.type === 'comment').length,
      follow: allNotifications.filter((n) => n.type === 'follow').length,
    }),
    [allNotifications, unreadCount]
  );

  // ── Filter + search ──
  const filterItems = useCallback(
    (items: NotificationItem[]) =>
      items.filter((n) => {
        if (activeFilter === 'unread' && n.read) return false;
        if (
          activeFilter !== 'all' &&
          activeFilter !== 'unread' &&
          n.type !== activeFilter
        )
          return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const { name, username } = getUserData(n.fromUser);
          const { title } = getStoryData(n.storyId, n.storyTitle);
          const matches =
            name.toLowerCase().includes(q) ||
            (username || '').toLowerCase().includes(q) ||
            (title || '').toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      }),
    [activeFilter, searchQuery]
  );

  const filteredGroups = useMemo(
    () => ({
      today: filterItems(groups.today),
      yesterday: filterItems(groups.yesterday),
      older: filterItems(groups.older),
    }),
    [groups, filterItems]
  );

  const filteredTotal =
    filteredGroups.today.length +
    filteredGroups.yesterday.length +
    filteredGroups.older.length;

  // ── Delete single notification ──
  const performDelete = useCallback(
    async (notifId: string, groupKey: GroupKey) => {
      const backup = [...groups[groupKey]];
      setGroups((prev) => ({
        ...prev,
        [groupKey]: prev[groupKey].filter((n) => n._id !== notifId),
      }));
      dismissInlineError(notifId);

      try {
        const res = await api.delete(`/users/notifications/${notifId}`);
        if (!res.data?.success) throw new Error();
      } catch {
        setGroups((prev) => ({ ...prev, [groupKey]: backup }));
        addInlineError(notifId, 'Could not remove. Please try again.');
      }
    },
    [groups, addInlineError, dismissInlineError]
  );

  // ── Mark all as read ──
  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    setMarkingRead(true);
    setBannerError(null);

    try {
      const res = await api.put('/users/notifications/mark-read');
      if (res.data?.success === false) throw new Error();

      setGroups((prev) => ({
        today: prev.today.map((n) => ({ ...n, read: true })),
        yesterday: prev.yesterday.map((n) => ({ ...n, read: true })),
        older: prev.older.map((n) => ({ ...n, read: true })),
      }));
      setBannerSuccess('All notifications marked as read');
    } catch {
      setBannerError({
        message: 'Failed to mark all as read.',
        retry: handleMarkAllRead,
      });
    } finally {
      setMarkingRead(false);
    }
  }, [unreadCount]);

  // ── Clear all ──
  const performClearAll = useCallback(async () => {
    if (allNotifications.length === 0) return;
    setClearingAll(true);
    setBannerError(null);
    const backup = { ...groups };
    setGroups({ today: [], yesterday: [], older: [] });

    try {
      const res = await api.delete('/users/notifications');
      if (!res.data?.success) throw new Error();
      setBannerSuccess('All notifications cleared');
      setConfirmClearOpen(false);
    } catch {
      // fallback: delete one-by-one
      try {
        await Promise.all(
          allNotifications.map((n) => api.delete(`/users/notifications/${n._id}`))
        );
        setBannerSuccess('All notifications cleared');
        setConfirmClearOpen(false);
      } catch {
        setGroups(backup);
        setBannerError({
          message: 'Could not clear notifications.',
          retry: performClearAll,
        });
      }
    } finally {
      setClearingAll(false);
    }
  }, [allNotifications, groups]);

  // ── Navigation ──
  const handleNotificationClick = useCallback(
    (notif: NotificationItem) => {
      if (notif.type === 'follow') {
        const { username } = getUserData(notif.fromUser);
        if (username) navigate(`/profile/${username}`);
        return;
      }
      const { id } = getStoryData(notif.storyId, notif.storyTitle);
      if (id) navigate(`/stories/${id}`);
    },
    [navigate]
  );

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setShowSearch(false);
  };

  // ═══════════════════════════════════════════
  // Render — Notification Item
  // ═══════════════════════════════════════════

  const renderNotification = (notif: NotificationItem, groupKey: GroupKey) => {
    const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.follow;
    const Icon = config.icon;
    const isUnread = !notif.read;

    const user = getUserData(notif.fromUser);
    const story = getStoryData(notif.storyId, notif.storyTitle);

    const isClickable =
      (notif.type === 'follow' && user.isValid) ||
      (notif.type !== 'follow' && story.isValid);

    const inlineErr = inlineErrors.find((e) => e.id === notif._id);

    // Build the message parts as JSX
    const renderMessage = () => {
      const targetLabel =
        notif.type === 'like'
          ? notif.targetType === 'comment'
            ? 'your comment on'
            : 'your story'
          : notif.type === 'comment'
            ? 'your story'
            : '';

      const actionText = {
        like: 'liked',
        comment: 'commented on',
        follow: 'started following you',
      }[notif.type];

      return (
        <>
          {/* User name */}
          {user.isValid && user.username ? (
            <Link
              to={`/profile/${user.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {user.name}
            </Link>
          ) : (
            <span className="font-semibold text-slate-500 dark:text-slate-400 italic">
              {user.name}
            </span>
          )}{' '}

          {/* Action */}
          <span className="text-slate-500 dark:text-slate-400">{actionText}</span>

          {/* Target: for like/comment */}
          {notif.type !== 'follow' && (
            <>
              {' '}
              {story.title ? (
                story.isValid && story.id ? (
                  <Link
                    to={`/stories/${story.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    "{story.title}"
                  </Link>
                ) : (
                  <span className="font-medium text-slate-400 dark:text-slate-500 italic">
                    "{story.title}"{' '}
                    <span className="text-[10px] text-rose-400 font-normal not-italic">
                      (deleted)
                    </span>
                  </span>
                )
              ) : story.isValid && story.id ? (
                <Link
                  to={`/stories/${story.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {targetLabel}
                </Link>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">
                  {targetLabel}{' '}
                  <span className="text-[10px] text-rose-400 not-italic">
                    (deleted)
                  </span>
                </span>
              )}
            </>
          )}
        </>
      );
    };

    return (
      <div key={notif._id}>
        <div
          onClick={() => isClickable && handleNotificationClick(notif)}
          className={`group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-all duration-200 ${isClickable ? 'cursor-pointer' : 'cursor-default'
            } ${isUnread
              ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              : 'bg-transparent hover:bg-white dark:hover:bg-slate-900'
            }`}
        >
          {/* Unread accent */}
          {isUnread && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
          )}

          {/* Avatar + type badge */}
          <div className="relative flex-shrink-0">
            {user.isValid && user.username ? (
              <Link
                to={`/profile/${user.username}`}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full object-cover ring-2 ring-transparent hover:ring-indigo-400 transition-all"
                />
              </Link>
            ) : (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full object-cover opacity-60 grayscale"
              />
            )}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full ${config.bg} ring-[3px] ring-white dark:ring-slate-950 flex items-center justify-center`}
            >
              <Icon
                className="w-[11px] h-[11px] text-white"
                fill={config.fill ? 'white' : 'none'}
                strokeWidth={2.5}
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] leading-snug text-slate-700 dark:text-slate-300 line-clamp-2">
              {renderMessage()}
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {safeTimeAgo(notif.timeStamp)}
              </span>
              {isUnread && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    New
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDeleteId({ id: notif._id, group: groupKey });
            }}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Remove notification"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Inline error under item */}
        {inlineErr && (
          <div className="flex items-center gap-2 mt-1 px-4">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span className="text-[11px] text-rose-500 font-medium flex-1">
              {inlineErr.message}
            </span>
            <button
              onClick={() => dismissInlineError(notif._id)}
              className="text-[10px] text-rose-400 hover:text-rose-600 underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // Render — Group Section
  // ═══════════════════════════════════════════

  const renderGroup = (items: NotificationItem[], key: GroupKey, title: string) => {
    if (items.length === 0) return null;
    return (
      <section>
        <div className="flex items-center gap-2 px-3 sm:px-4 mb-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
            {title}
          </h3>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <div className="bg-white/50 dark:bg-slate-900/40 rounded-3xl p-1.5 space-y-0.5 border border-slate-100 dark:border-slate-800/50">
          {items.map((n) => renderNotification(n, key))}
        </div>
      </section>
    );
  };

  // ═══════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#F6F7FB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* ═══ Sticky Top Bar ═══ */}
      <header className="sticky top-0 z-40 bg-[#F6F7FB]/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Row 1: Title */}
          <div className="flex items-center justify-between gap-2 h-14">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 active:scale-95 transition-all"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              <div className="min-w-0">
                <h1 className="text-[17px] font-bold tracking-tight leading-tight truncate">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-[11px] font-medium text-indigo-500 leading-tight">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setShowSearch((s) => !s);
                  if (showSearch) setSearchQuery('');
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${showSearch
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>

              <button
                onClick={handleMarkAllRead}
                disabled={markingRead || unreadCount === 0}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Mark all as read"
              >
                {markingRead ? (
                  <RefreshCw className="w-[18px] h-[18px] animate-spin" strokeWidth={2} />
                ) : (
                  <CheckCheck className="w-[18px] h-[18px]" strokeWidth={2} />
                )}
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all active:scale-95"
                aria-label="Settings"
              >
                <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Row 2: Search */}
          {showSearch && (
            <div className="pb-3 animate-slideDown">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by name or story..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-400 dark:focus:border-indigo-600 rounded-xl text-[13px] outline-none transition-colors placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3 text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Row 3: Filters */}
          <div className="pb-3 flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              const count = counts[f.key];
              const FilterIcon = f.icon;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all active:scale-95 ${isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                >
                  <FilterIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  {f.label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 rounded-full ${isActive
                          ? 'bg-white/20 dark:bg-slate-900/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
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
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="max-w-2xl mx-auto px-3 sm:px-6 py-5 pb-28">
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
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl animate-pulse"
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
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mx-auto mb-5 shadow-inner">
              {searchQuery || activeFilter !== 'all' ? (
                <SlidersHorizontal className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
              ) : (
                <BellOff className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
              )}
            </div>
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-white">
              {searchQuery || activeFilter !== 'all'
                ? 'Nothing found'
                : "You're all caught up"}
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {searchQuery || activeFilter !== 'all'
                ? 'Try changing your search or filter.'
                : 'When someone likes, comments, or follows you, it will appear here.'}
            </p>
            {(searchQuery || activeFilter !== 'all') && (
              <button
                onClick={resetFilters}
                className="mt-5 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12.5px] font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all"
              >
                Reset
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {renderGroup(filteredGroups.today, 'today', 'Today')}
            {renderGroup(filteredGroups.yesterday, 'yesterday', 'Yesterday')}
            {renderGroup(filteredGroups.older, 'older', 'Earlier')}

            {allNotifications.length > 0 && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={clearingAll}
                  className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══ Confirm Modals ═══ */}
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

      {/* ═══ Global Styles ═══ */}
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