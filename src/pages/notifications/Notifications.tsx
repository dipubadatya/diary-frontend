
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  Trash2,
  CheckCheck,
  Search,
  Sparkles,
  BellOff,
  Settings,
  ArrowLeft,
  SlidersHorizontal,
  X,
  Inbox,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';

interface NotificationUser {
  _id: string;
  username: string;
  name: string;
  image?: { url: string };
}

interface NotificationItem {
  _id: string;
  type: 'like' | 'comment' | 'follow';
  fromUser: NotificationUser;
  storyId?: {
    _id: string;
    title: string;
  };
  timeStamp: string;
  read: boolean;
}

interface NotificationGroups {
  today: NotificationItem[];
  yesterday: NotificationItem[];
  older: NotificationItem[];
}

type FilterType = 'all' | 'like' | 'comment' | 'follow' | 'unread';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<NotificationGroups>({ today: [], yesterday: [], older: [] });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/notifications');
      if (res.data.success) {
        setGroups(res.data.notifications);
      }
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const allNotifications = useMemo(
    () => [...groups.today, ...groups.yesterday, ...groups.older],
    [groups]
  );

  const unreadCount = useMemo(
    () => allNotifications.filter(n => !n.read).length,
    [allNotifications]
  );

  const counts = useMemo(() => ({
    all: allNotifications.length,
    unread: unreadCount,
    like: allNotifications.filter(n => n.type === 'like').length,
    comment: allNotifications.filter(n => n.type === 'comment').length,
    follow: allNotifications.filter(n => n.type === 'follow').length,
  }), [allNotifications, unreadCount]);

  const filterAndSearch = (items: NotificationItem[]) => {
    return items.filter(n => {
      if (activeFilter === 'unread' && n.read) return false;
      if (activeFilter !== 'all' && activeFilter !== 'unread' && n.type !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = n.fromUser.name.toLowerCase().includes(q) || n.fromUser.username.toLowerCase().includes(q);
        const matchStory = n.storyId?.title.toLowerCase().includes(q);
        if (!matchName && !matchStory) return false;
      }
      return true;
    });
  };

  const filteredGroups: NotificationGroups = useMemo(() => ({
    today: filterAndSearch(groups.today),
    yesterday: filterAndSearch(groups.yesterday),
    older: filterAndSearch(groups.older),
  }), [groups, activeFilter, searchQuery]);

  const filteredTotal =
    filteredGroups.today.length + filteredGroups.yesterday.length + filteredGroups.older.length;

  const handleDeleteNotification = async (notifId: string, groupKey: keyof NotificationGroups) => {
    const backup = groups[groupKey];
    setGroups(prev => ({
      ...prev,
      [groupKey]: prev[groupKey].filter(n => n._id !== notifId),
    }));

    try {
      const res = await api.delete(`/users/notifications/${notifId}`);
      if (!res.data.success) throw new Error();
    } catch {
      toast.error('Failed to remove');
      setGroups(prev => ({ ...prev, [groupKey]: backup }));
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingRead(true);
    try {
      await api.put('/users/notifications/mark-read');
    } catch {
      // silent — still update UI
    } finally {
      setGroups(prev => ({
        today: prev.today.map(n => ({ ...n, read: true })),
        yesterday: prev.yesterday.map(n => ({ ...n, read: true })),
        older: prev.older.map(n => ({ ...n, read: true })),
      }));
      toast.success('All marked as read');
      setMarkingRead(false);
    }
  };

  const handleClearAll = async () => {
    if (allNotifications.length === 0) return;
    if (!window.confirm('Clear all notifications? This cannot be undone.')) return;

    setClearingAll(true);
    const backup = { ...groups };
    setGroups({ today: [], yesterday: [], older: [] });

    try {
      const res = await api.delete('/users/notifications');
      if (!res.data.success) throw new Error();
      toast.success('All notifications cleared');
    } catch {
      try {
        await Promise.all(allNotifications.map(n => api.delete(`/users/notifications/${n._id}`)));
        toast.success('All notifications cleared');
      } catch {
        toast.error('Failed to clear');
        setGroups(backup);
      }
    } finally {
      setClearingAll(false);
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (notif.type === 'follow') {
      navigate(`/profile/${notif.fromUser.username}`);
    } else if (notif.storyId) {
      navigate(`/stories/${notif.storyId._id}`);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'like':
        return {
          icon: Heart,
          bg: 'bg-rose-500',
          softBg: 'bg-rose-50 dark:bg-rose-500/10',
          text: 'text-rose-500',
          fill: true,
        };
      case 'comment':
        return {
          icon: MessageSquare,
          bg: 'bg-sky-500',
          softBg: 'bg-sky-50 dark:bg-sky-500/10',
          text: 'text-sky-500',
          fill: false,
        };
      case 'follow':
        return {
          icon: UserPlus,
          bg: 'bg-indigo-500',
          softBg: 'bg-indigo-50 dark:bg-indigo-500/10',
          text: 'text-indigo-500',
          fill: false,
        };
      default:
        return {
          icon: Bell,
          bg: 'bg-slate-400',
          softBg: 'bg-slate-100',
          text: 'text-slate-400',
          fill: false,
        };
    }
  };

  const renderNotification = (notif: NotificationItem, groupKey: keyof NotificationGroups) => {
    const typeStyle = getTypeStyle(notif.type);
    const Icon = typeStyle.icon;
    const isUnread = !notif.read;

    return (
      <div
        key={notif._id}
        onClick={() => handleNotificationClick(notif)}
        className={`group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
          isUnread
            ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            : 'bg-transparent hover:bg-white dark:hover:bg-slate-900'
        }`}
      >
        {/* Left accent bar for unread */}
        {isUnread && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
        )}

        {/* Avatar + Type badge */}
        <div className="relative flex-shrink-0">
          <Link
            to={`/profile/${notif.fromUser.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                notif.fromUser.image?.url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.fromUser.name)}&background=e0e7ff&color=4f46e5&bold=true`
              }
              alt={notif.fromUser.name}
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full object-cover"
            />
          </Link>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full ${typeStyle.bg} ring-[3px] ring-white dark:ring-slate-950 flex items-center justify-center`}
          >
            <Icon
              className="w-[11px] h-[11px] text-white"
              fill={typeStyle.fill ? 'white' : 'none'}
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] leading-snug text-slate-700 dark:text-slate-300 line-clamp-2">
            <Link
              to={`/profile/${notif.fromUser.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {notif.fromUser.name}
            </Link>{' '}

            {notif.type === 'like' && (
              <>
                <span className="text-slate-500 dark:text-slate-400">liked your story</span>
                {notif.storyId && (
                  <>
                    {' '}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      "{notif.storyId.title}"
                    </span>
                  </>
                )}
              </>
            )}

            {notif.type === 'comment' && (
              <>
                <span className="text-slate-500 dark:text-slate-400">commented on</span>
                {notif.storyId ? (
                  <>
                    {' '}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      "{notif.storyId.title}"
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400"> your story</span>
                )}
              </>
            )}

            {notif.type === 'follow' && (
              <span className="text-slate-500 dark:text-slate-400">started following you</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {moment(notif.timeStamp).fromNow()}
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

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteNotification(notif._id, groupKey);
          }}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>
    );
  };

  const renderGroup = (items: NotificationItem[], groupKey: keyof NotificationGroups, title: string) => {
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
          {items.map(n => renderNotification(n, groupKey))}
        </div>
      </section>
    );
  };

  const filters: { key: FilterType; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: Inbox },
    { key: 'unread', label: 'Unread', icon: Sparkles },
    { key: 'like', label: 'Likes', icon: Heart },
    { key: 'comment', label: 'Comments', icon: MessageSquare },
    { key: 'follow', label: 'Follows', icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-[#F6F7FB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* ============ STICKY TOP BAR ============ */}
      <div className="sticky top-0 z-40 bg-[#F6F7FB]/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Row 1: Back + Title + Actions */}
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
                onClick={() => setShowSearch(s => !s)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  showSearch
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
                <CheckCheck className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all active:scale-95"
                title="Settings"
              >
                <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Row 2: Search Bar (collapsible) */}
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
                  >
                    <X className="w-3 h-3 text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Row 3: Filter Pills */}
          <div className="pb-3 flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {filters.map(f => {
              const isActive = activeFilter === f.key;
              const count = counts[f.key];
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <f.icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {f.label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 rounded-full ${
                        isActive
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
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <main className="max-w-2xl mx-auto px-3 sm:px-6 py-5 pb-28">
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
                : 'You’re all caught up'}
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {searchQuery || activeFilter !== 'all'
                ? 'Try changing your search or filter.'
                : 'When someone likes, comments, or follows you, it will appear here.'}
            </p>
            {(searchQuery || activeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                  setShowSearch(false);
                }}
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

            {/* Clear All footer action */}
            {allNotifications.length > 0 && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleClearAll}
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>
    </div>
  );
};