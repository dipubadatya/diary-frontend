import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  X,
  ArrowLeft,
  UserPlus,
  UserCheck,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface SearchUser {
  _id: string;
  name: string;
  username: string;
  image?: { url: string };
  isFollowing?: boolean;
  followsMe?: boolean;
}

type Relation = 'self' | 'mutual' | 'following' | 'follower' | null;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getAvatarUrl = (u: SearchUser) =>
  u.image?.url ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=188AF2&color=fff&bold=true&size=120`;

const getRelation = (user: SearchUser, currentUserId?: string): Relation => {
  if (currentUserId === user._id) return 'self';
  if (user.isFollowing && user.followsMe) return 'mutual';
  if (user.isFollowing) return 'following';
  if (user.followsMe) return 'follower';
  return null;
};

const RELATION_META: Record<Exclude<Relation, null>, { label: string; dotClass: string }> = {
  self:      { label: 'You',         dotClass: 'bg-[#188AF2]' },
  mutual:    { label: 'Mutual',      dotClass: 'bg-[#D5FF3F] border border-black/10' },
  following: { label: 'Following',   dotClass: 'bg-[#188AF2]' },
  follower:  { label: 'Follows you', dotClass: 'bg-[#121212] dark:bg-white' },
};

// ─────────────────────────────────────────────
// Custom hook: debounced value
// ─────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
const FollowButton: React.FC<{
  isFollowing?: boolean;
  loading?: boolean;
  onClick: (e: React.MouseEvent) => void;
}> = ({ isFollowing, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`
      inline-flex items-center gap-1.5 px-4 py-2 rounded-full
      text-[11px] sm:text-xs font-bold
      transition-all duration-200 active:scale-95
      disabled:opacity-50 disabled:cursor-not-allowed
      ${isFollowing
        ? 'bg-[#F4F5F6] dark:bg-[#2A2A2A] text-[#121212] dark:text-white hover:bg-neutral-200 dark:hover:bg-[#3A3A3A]'
        : 'bg-[#121212] dark:bg-white text-white dark:text-[#121212] shadow-sm hover:shadow-md hover:scale-[1.03]'
      }
    `}
  >
    {loading ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : isFollowing ? (
      <>
        <UserCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span className="hidden xs:inline">Following</span>
      </>
    ) : (
      <>
        <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span className="hidden xs:inline">Follow</span>
      </>
    )}
  </button>
);

const UserRow: React.FC<{
  user: SearchUser;
  relation: Relation;
  showRemove: boolean;
  isRemoving: boolean;
  isFollowLoading: boolean;
  onSelect: () => void;
  onToggleFollow: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}> = ({ user, relation, showRemove, isRemoving, isFollowLoading, onSelect, onToggleFollow, onRemove }) => {
  const meta = relation ? RELATION_META[relation] : null;
  const isSelf = relation === 'self';

  return (
    <div
      onClick={onSelect}
      className={`
        group flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl cursor-pointer
        hover:bg-[#F4F5F6] dark:hover:bg-[#2A2A2A]
        transition-all duration-200
        ${isRemoving ? 'opacity-0 -translate-x-4 max-h-0 !p-0 overflow-hidden' : 'opacity-100 max-h-24'}
      `}
      style={{ transitionProperty: 'opacity, transform, max-height, padding, background-color' }}
    >
      <img
        src={getAvatarUrl(user)}
        alt={user.name}
        loading="lazy"
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0 bg-[#F4F5F6] dark:bg-[#2A2A2A] ring-1 ring-black/5 dark:ring-white/5"
      />

      <div className="flex-1 min-w-0">
        <p className="font-bold text-[13px] sm:text-sm text-[#121212] dark:text-white truncate">
          {user.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] sm:text-xs text-neutral-500">
          <span className="font-medium truncate">@{user.username}</span>
          {meta && (
            <>
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dotClass}`} />
              <span className="font-semibold whitespace-nowrap">{meta.label}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isSelf && (
          <FollowButton
            isFollowing={user.isFollowing}
            loading={isFollowLoading}
            onClick={onToggleFollow}
          />
        )}
        {showRemove && (
          <button
            onClick={onRemove}
            aria-label="Remove from history"
            className="
              w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
              text-neutral-400 hover:text-red-500
              hover:bg-white dark:hover:bg-[#2A2A2A] hover:shadow-sm
              opacity-100 sm:opacity-60 group-hover:opacity-100
              active:scale-90 transition-all
            "
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ isSearching: boolean; query: string }> = ({ isSearching, query }) => (
  <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-12 sm:p-16 text-center border border-[#F4F5F6] dark:border-[#2A2A2A]">
    <div className="w-14 h-14 rounded-full bg-[#188AF2]/10 mx-auto mb-4 flex items-center justify-center">
      {isSearching
        ? <SearchIcon className="w-6 h-6 text-[#188AF2]" strokeWidth={2} />
        : <Clock className="w-6 h-6 text-[#188AF2]" strokeWidth={2} />
      }
    </div>
    <h3 className="text-sm sm:text-base font-bold text-[#121212] dark:text-white mb-1.5">
      {isSearching ? 'No matching writers' : 'No recent searches'}
    </h3>
    <p className="text-xs sm:text-[13px] text-neutral-500 max-w-[240px] mx-auto leading-relaxed">
      {isSearching
        ? `We couldn't find anyone matching "${query}". Try adjusting your spelling.`
        : 'Your search history is empty. Start typing to discover writers.'}
    </p>
  </div>
);

const RowSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-2 border border-[#F4F5F6] dark:border-[#2A2A2A] space-y-1">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
        <div className="w-12 h-12 rounded-full bg-[#F4F5F6] dark:bg-[#2A2A2A] flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3 bg-[#F4F5F6] dark:bg-[#2A2A2A] rounded-full w-1/3" />
          <div className="h-2 bg-[#F4F5F6] dark:bg-[#2A2A2A]/60 rounded-full w-1/4" />
        </div>
        <div className="h-9 w-24 bg-[#F4F5F6] dark:bg-[#2A2A2A] rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
);

const ErrorBanner: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <div className="mb-6 flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
    <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 min-w-0">
      <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
      <p className="text-xs sm:text-[13px] font-medium leading-tight truncate">{message}</p>
    </div>
    <button
      onClick={onDismiss}
      aria-label="Dismiss error"
      className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1 flex-shrink-0"
    >
      <X className="w-4 h-4" strokeWidth={2.5} />
    </button>
  </div>
);

const Legend: React.FC = () => (
  <div className="mt-5 mx-auto w-max flex items-center gap-4 sm:gap-6 px-4 py-2 rounded-full bg-[#F4F5F6]/60 dark:bg-[#1A1A1A]/60">
    {(['mutual', 'following', 'follower'] as const).map(key => {
      const { label, dotClass } = RELATION_META[key];
      return (
        <div key={key} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500">{label}</span>
        </div>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export const Search: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 350);

  const [results, setResults] = useState<SearchUser[]>([]);
  const [recent, setRecent] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const isSearching = debouncedQuery.length > 0;
  const isTyping = query.trim() !== debouncedQuery;
  const items = isSearching ? results : recent;

  // Clear error when user retries
  useEffect(() => {
    if (error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Load recent searches
  const loadRecent = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await api.get('/users/search?q=');
      if (res.data.success) setRecent(res.data.results || []);
    } catch (err) {
      console.error('Failed to load recent searches', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isSearching) loadRecent();
  }, [isSearching, loadRecent]);

  // Execute search (with cancellation to prevent race conditions)
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get(`/users/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => {
        if (cancelled) return;
        if (res.data.success) setResults(res.data.results || []);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || 'Something went wrong while searching.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Handlers
  const openProfile = async (user: SearchUser) => {
    // Fire and forget — don't block navigation on history save
    api.post('/users/recent-searches', { writerId: user._id }).catch(() => {});
    navigate(`/profile/${user.username}`);
  };

  const removeRecent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRemovingIds(prev => new Set(prev).add(id));

    try {
      const res = await api.delete(`/users/recent-searches/${id}`);
      if (res.data.success) {
        // Wait for exit animation before unmounting
        setTimeout(() => {
          setRecent(prev => prev.filter(item => item._id !== id));
          setRemovingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 250);
      }
    } catch {
      setError('Failed to remove from recent searches.');
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const clearAllRecent = async () => {
    try {
      const res = await api.delete('/users/recent-searches');
      if (res.data.success) setRecent([]);
    } catch {
      setError('Failed to clear recent searches.');
    }
  };

  const toggleFollow = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFollowingIds(prev => new Set(prev).add(id));

    try {
      const res = await api.post(`/users/follow/${id}`);
      if (res.data.success) {
        const patch = (list: SearchUser[]) =>
          list.map(u => (u._id === id ? { ...u, isFollowing: res.data.isFollowing } : u));
        setResults(patch);
        setRecent(patch);
      }
    } catch {
      setError('Failed to update follow status.');
    } finally {
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Memoize rendered rows to avoid re-computing relations on unrelated re-renders
  const rows = useMemo(
    () =>
      items.map(user => ({
        user,
        relation: getRelation(user, currentUser?._id),
      })),
    [items, currentUser?._id]
  );

  const showSkeleton = (loading || isTyping) && results.length === 0 && isSearching;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0C] transition-colors duration-300">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-28">

        {/* Header */}
        <header className="flex items-center gap-3 mb-4 sm:mb-5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="
              w-11 h-11 rounded-full flex items-center justify-center
              bg-[#121212] dark:bg-white text-white dark:text-[#121212]
              shadow-md hover:scale-105 active:scale-95 transition-transform
            "
          >
            <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={2.2} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#121212] dark:text-white">
              Discover
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-neutral-500 mt-0.5">
              Find writers and connect
            </p>
          </div>
        </header>

        {/* Search input */}
        <div className="mb-6 rounded-full bg-[#F4F5F6] dark:bg-[#1A1A1A] focus-within:ring-1 focus-within:ring-[#188AF2]/30 focus-within:shadow-[0_8px_24px_rgba(24,138,242,0.1)] transition-all">
          <div className="flex items-center gap-2 p-2">
            <div className="pl-3 text-neutral-400">
              {loading || isTyping ? (
                <Loader2 className="w-[17px] h-[17px] animate-spin text-[#188AF2]" />
              ) : (
                <SearchIcon className="w-[17px] h-[17px]" strokeWidth={2.2} />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search writers by name or username..."
              autoFocus
              className="
                flex-1 min-w-0 py-2 pr-2 bg-transparent outline-none
                text-sm font-medium text-[#121212] dark:text-white
                placeholder:text-neutral-400
              "
            />

            {query ? (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#2A2A2A] shadow-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-[#3A3A3A] active:scale-90 transition-all"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                onClick={() => inputRef.current?.focus()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D5FF3F] text-[#121212] text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
              >
                <SearchIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                Search
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Section header */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#121212] dark:text-white">
              {isSearching ? 'Search Results' : 'Recent Searches'}
            </h2>
            {isSearching && !loading && !isTyping && (
              <span className="text-[10px] font-bold text-[#188AF2] bg-[#188AF2]/10 px-2 py-0.5 rounded-full">
                {results.length}
              </span>
            )}
          </div>

          {!isSearching && recent.length > 0 && (
            <button
              onClick={clearAllRecent}
              className="text-[11px] font-bold text-neutral-400 hover:text-[#188AF2] underline underline-offset-2 active:scale-95 transition-all"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Content */}
        {showSkeleton ? (
          <RowSkeleton />
        ) : items.length === 0 ? (
          <EmptyState isSearching={isSearching} query={debouncedQuery} />
        ) : (
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-2 border border-[#F4F5F6] dark:border-[#2A2A2A]">
            {rows.map(({ user, relation }) => (
              <UserRow
                key={user._id}
                user={user}
                relation={relation}
                showRemove={!isSearching}
                isRemoving={removingIds.has(user._id)}
                isFollowLoading={followingIds.has(user._id)}
                onSelect={() => openProfile(user)}
                onToggleFollow={e => toggleFollow(e, user._id)}
                onRemove={e => removeRecent(e, user._id)}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        {items.length > 0 && !loading && !isTyping && <Legend />}
      </main>
    </div>
  );
};