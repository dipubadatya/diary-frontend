

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
  AlertCircle
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
  self: { label: 'You', dotClass: 'bg-[#188AF2]' },
  mutual: { label: 'Mutual', dotClass: 'bg-[#D5FF3F] border border-black/10' },
  following: { label: 'Following', dotClass: 'bg-[#188AF2]' },
  follower: { label: 'Follows you', dotClass: 'bg-[#121212] dark:bg-white' },
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
      inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full
      text-[12px] sm:text-[13px] font-semibold tracking-wide
      transition-all duration-300 active:scale-[0.97]
      disabled:opacity-50 disabled:cursor-not-allowed
      ${isFollowing
        ? 'bg-[#F4F5F6] dark:bg-[#2A2A2A] text-[#121212] dark:text-white hover:bg-neutral-200 dark:hover:bg-[#3A3A3A]'
        : 'bg-[#121212] dark:bg-white text-white dark:text-[#121212] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:-translate-y-[0.5px]'
      }
    `}
  >
    {loading ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : isFollowing ? (
      <>
        <UserCheck className="w-4 h-4" strokeWidth={2.5} />
        <span className="hidden xs:inline">Following</span>
      </>
    ) : (
      <>
        <UserPlus className="w-4 h-4" strokeWidth={2.5} />
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
        group flex items-center gap-4 p-3 sm:p-4 rounded-[20px] sm:rounded-[24px] cursor-pointer
        hover:bg-[#F8F9FA] dark:hover:bg-[#222222]
        transition-all duration-300 ease-out
        ${isRemoving ? 'opacity-0 -translate-x-4 max-h-0 !p-0 overflow-hidden' : 'opacity-100 max-h-24'}
      `}
      style={{ transitionProperty: 'opacity, transform, max-height, padding, background-color' }}
    >
      <img
        src={getAvatarUrl(user)}
        alt={user.name}
        loading="lazy"
        className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full object-cover flex-shrink-0 bg-[#F4F5F6] dark:bg-[#2A2A2A] ring-1 ring-black/5 dark:ring-white/5"
      />

      <div className="flex-1 min-w-0">
        <p className="font-semibold tracking-tight text-[14px] sm:text-[15px] text-[#121212] dark:text-white truncate">
          {user.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 text-[12px] sm:text-[13px] text-neutral-500">
          <span className="truncate">@{user.username}</span>
          {meta && (
            <>
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dotClass}`} />
              <span className="font-medium whitespace-nowrap">{meta.label}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 pl-2">
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
              w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
              text-neutral-400 hover:text-red-500
              hover:bg-white dark:hover:bg-[#2A2A2A] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]
              opacity-100 sm:opacity-0 group-hover:opacity-100
              active:scale-95 transition-all duration-200
            "
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ isSearching: boolean; query: string }> = ({ isSearching, query }) => (
  <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-12 sm:p-20 text-center border border-neutral-100 dark:border-[#2A2A2A] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
    <div className="w-16 h-16 rounded-full bg-[#188AF2]/10 mx-auto mb-5 flex items-center justify-center">
      {isSearching
        ? <SearchIcon className="w-7 h-7 text-[#188AF2]" strokeWidth={2} />
        : <Clock className="w-7 h-7 text-[#188AF2]" strokeWidth={2} />
      }
    </div>
    <h3 className="text-base font-bold text-slate-950 dark:text-white">
      {isSearching ? 'No writers found' : 'No recent searches'}
    </h3>

    <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
      {isSearching ? (
        <>
          We couldn't find anyone for <span className="font-semibold text-slate-800 dark:text-slate-200">"{query}"</span>. Check the spelling and try again.
        </>
      ) : (
        'People you look up will show up here.'
      )}
    </p>
  </div>
);

const RowSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-2.5 sm:p-3 border border-neutral-100 dark:border-[#2A2A2A] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-1">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3 sm:p-4 rounded-[24px] animate-pulse">
        <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-[#F4F5F6] dark:bg-[#2A2A2A] flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-3.5 bg-[#F4F5F6] dark:bg-[#2A2A2A] rounded-full w-1/3" />
          <div className="h-2.5 bg-[#F4F5F6] dark:bg-[#2A2A2A]/60 rounded-full w-1/4" />
        </div>
        <div className="h-10 w-28 bg-[#F4F5F6] dark:bg-[#2A2A2A] rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
);

const ErrorBanner: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <div className="mb-6 flex items-center justify-between gap-4 p-4 rounded-[20px] bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
    <div className="flex items-center gap-3 text-red-600 dark:text-red-400 min-w-0">
      <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
      <p className="text-[13px] sm:text-[14px] font-medium leading-tight truncate">{message}</p>
    </div>
    <button
      onClick={onDismiss}
      aria-label="Dismiss error"
      className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1.5 flex-shrink-0 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 rounded-full transition-colors"
    >
      <X className="w-4 h-4" strokeWidth={2.5} />
    </button>
  </div>
);

const Legend: React.FC = () => (
  <div className="mt-8 mx-auto w-max flex items-center gap-5 sm:gap-8 px-6 py-3 rounded-full bg-[#F4F5F6]/60 dark:bg-[#1A1A1A]/60 border border-neutral-100 dark:border-[#2A2A2A]/50">
    {(['mutual', 'following', 'follower'] as const).map(key => {
      const { label, dotClass } = RELATION_META[key];
      return (
        <div key={key} className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
          <span className="text-[11px] sm:text-[12px] font-semibold tracking-wide text-neutral-500">{label}</span>
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

  // Execute search
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
    api.post('/users/recent-searches', { writerId: user._id }).catch(() => { });
    navigate(`/profile/${user.username}`);
  };

  const removeRecent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRemovingIds(prev => new Set(prev).add(id));

    try {
      const res = await api.delete(`/users/recent-searches/${id}`);
      if (res.data.success) {
        setTimeout(() => {
          setRecent(prev => prev.filter(item => item._id !== id));
          setRemovingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 300); // slightly longer timeout to match smoother transition
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0C] transition-colors duration-300">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-28">

        {/* Header */}
        <header className="flex items-center gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="
              w-12 h-12 rounded-full flex items-center justify-center
              bg-white dark:bg-[#1A1A1A] text-[#121212] dark:text-white
              border border-neutral-100 dark:border-[#2A2A2A]
              shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] 
              hover:-translate-y-[0.5px] active:scale-[0.97] transition-all duration-300
            "
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#121212] dark:text-white">
              Discover
            </h1>
            <p className="text-[13px] sm:text-[14px] font-medium text-neutral-500 mt-0.5">
              Find writers and connect
            </p>
          </div>
        </header>

        {/* Search input */}
        <div className="mb-8 rounded-full bg-white dark:bg-[#1A1A1A] border border-neutral-100 dark:border-[#2A2A2A] shadow-[0_2px_12px_rgba(0,0,0,0.02)] focus-within:border-neutral-200 dark:focus-within:border-neutral-700 focus-within:shadow-[0_8px_30px_rgba(24,138,242,0.08)] transition-all duration-300">
          <div className="flex items-center gap-2 p-1.5 sm:p-2">
            <div className="pl-4 text-neutral-400">
              {loading || isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#188AF2]" />
              ) : (
                <SearchIcon className="w-5 h-5" strokeWidth={2} />
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
                flex-1 min-w-0 py-2.5 px-2 bg-transparent outline-none
                text-[14px] sm:text-[15px] font-medium text-[#121212] dark:text-white
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
                className="w-10 h-10 mr-1 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-[#2A2A2A] text-neutral-500 hover:bg-neutral-200 dark:hover:bg-[#3A3A3A] active:scale-95 transition-all duration-200"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                onClick={() => inputRef.current?.focus()}
                className="flex items-center gap-2 px-5 py-2.5 mr-0.5 rounded-full bg-[#D5FF3F] text-[#121212] text-[13px] font-bold shadow-[0_2px_8px_rgba(213,255,63,0.25)] hover:shadow-[0_4px_16px_rgba(213,255,63,0.4)] hover:-translate-y-[0.5px] active:scale-[0.97] transition-all duration-300"
              >
                <SearchIcon className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden xs:inline">Search</span>
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Section header */}
        <div className="flex items-center justify-between mb-4 px-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {isSearching ? 'Search Results' : 'Recent Searches'}
            </h2>
            {isSearching && !loading && !isTyping && (
              <span className="text-[11px] font-bold text-[#188AF2] bg-[#188AF2]/10 px-2.5 py-0.5 rounded-full">
                {results.length}
              </span>
            )}
          </div>

          {!isSearching && recent.length > 0 && (
            <button
              onClick={clearAllRecent}
              className="text-[12px] font-semibold text-neutral-400 hover:text-[#188AF2] active:scale-95 transition-all"
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
          <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-2 sm:p-3 border border-neutral-100 dark:border-[#2A2A2A] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
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