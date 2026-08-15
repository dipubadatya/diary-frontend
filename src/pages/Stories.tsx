

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import api from "../services/api";
import toast from "react-hot-toast";
import moment from "moment";
import { ErrorCard } from "../components/ErrorCard";
import DiaryLogo from "../components/DiaryLogo";

/* ══════════════════════════════════════
   TYPES
   ══════════════════════════════════════ */
interface Story {
  _id: string;
  title: string;
  story: string;
  category: string;
  image?: { url: string };
  owner: {
    _id: string;
    username: string;
    name: string;
    image?: { url: string };
  };
  views: string[];
  likedBy: string[];
  likesCounts?: number;
  timeStamp: string;
}

interface Writer {
  _id: string;
  username: string;
  name: string;
  image?: { url: string };
  followers: string[];
  storiesCount: number;
  totalLikes?: number;
  totalViews?: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalStories: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/* ══════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════ */
const CATEGORIES: Record<string, { label: string; icon: string }> = {
  fantasy: { label: "Fantasy", icon: "ri-magic-line" },
  "random-thoughts": { label: "Thoughts", icon: "ri-lightbulb-line" },
  poetry: { label: "Poetry", icon: "ri-quill-pen-line" },
  letter: { label: "Letters", icon: "ri-mail-line" },
  mystery: { label: "Mystery", icon: "ri-search-eye-line" },
  adventure: { label: "Adventure", icon: "ri-compass-3-line" },
  historical: { label: "Historical", icon: "ri-ancient-gate-line" },
  fiction: { label: "Fiction", icon: "ri-book-line" },
  other: { label: "Other", icon: "ri-more-line" },
};

const STORIES_PER_PAGE = 12;

const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80";

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */

// Extract clean text from HTML for excerpts
const excerpt = (html: string, n = 120): string => {
  const t = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
};

// Format numbers: 1500 → "1.5k"
const formatCount = (n: number): string =>
  n >= 1000
    ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
    : String(n);

// Safe count helpers — handle both array and number
const getLikesCount = (story: Story): number => {
  if (typeof story.likesCounts === "number") return story.likesCounts;
  if (Array.isArray(story.likedBy)) return story.likedBy.length;
  return 0;
};

const getViewsCount = (story: Story): number => {
  if (Array.isArray(story.views)) return story.views.length;
  return 0;
};

/* ══════════════════════════════════════
   ATOMS
   ══════════════════════════════════════ */
function Avatar({
  src,
  alt,
  size = 32,
  ring = false,
}: {
  src?: string;
  alt: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <img
      src={src || AVATAR_FALLBACK}
      alt={alt}
      className={`rounded-full object-cover bg-gray-100 flex-shrink-0 ${
        ring ? "ring-2 ring-white" : ""
      }`}
      style={{ width: size, height: size, minWidth: size }}
    />
  );
}

function Pill({
  children,
  variant = "ink",
  to,
  onClick,
  className = "",
  icon,
}: {
  children: React.ReactNode;
  variant?: "ink" | "lime" | "ghost" | "white";
  to?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) {
  const styles = {
    ink: "bg-[#0A0A0A] text-white hover:bg-black",
    lime: "bg-[#D9F26B] text-[#0A0A0A] hover:brightness-105",
    ghost:
      "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/20",
    white: "bg-white text-[#0A0A0A] hover:bg-gray-50",
  };

  const base = `inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${styles[variant]} ${className}`;

  const content = (
    <>
      <span>{children}</span>
      {icon && (
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
            variant === "lime"
              ? "bg-[#0A0A0A] text-white"
              : "bg-white/20 text-current"
          }`}
        >
          {icon}
        </span>
      )}
    </>
  );

  if (to) return <Link to={to} className={base}>{content}</Link>;
  return (
    <button onClick={onClick} className={base}>
      {content}
    </button>
  );
}

function Badge({
  count,
  color = "red",
}: {
  count: number;
  color?: "red" | "lime";
}) {
  if (count <= 0) return null;

  const bg =
    color === "lime"
      ? "bg-[#D9F26B] text-[#0A0A0A]"
      : "bg-red-500 text-white";

  return (
    <span
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] ${bg} text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function CategoryChip({
  category,
  dark = false,
}: {
  category: string;
  dark?: boolean;
}) {
  const cat = CATEGORIES[category];
  if (!cat) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
        dark
          ? "bg-white/20 text-white backdrop-blur-sm border border-white/20"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      <i className={`${cat.icon} text-[11px]`} />
      {cat.label}
    </span>
  );
}

function SoftCard({
  children,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article";
}) {
  const Tag = as as any;
  return (
    <Tag
      className={`bg-white rounded-3xl shadow-[0_2px_16px_-4px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </Tag>
  );
}

/* ══════════════════════════════════════
   HERO CAROUSEL — Top trending stories slider
   ══════════════════════════════════════ */
function HeroCarousel({ stories }: { stories: Story[] }) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (idx: number) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => {
        setActive(idx);
        setAnimating(false);
      }, 300);
    },
    [animating]
  );

  const next = useCallback(() => {
    goTo((active + 1) % stories.length);
  }, [active, stories.length, goTo]);

  // Auto-advance every 5s
  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  };

  const handleDot = (i: number) => {
    goTo(i);
    resetTimer();
  };

  const handlePrev = () => {
    goTo((active - 1 + stories.length) % stories.length);
    resetTimer();
  };

  const handleNext = () => {
    goTo((active + 1) % stories.length);
    resetTimer();
  };

  const story = stories[active];
  if (!story) return null;

  const likesCount = getLikesCount(story);
  const viewsCount = getViewsCount(story);

  return (
    <section className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] mb-8 group">
      {/* Background image + overlay */}
      <div className="absolute inset-0">
        {story.image?.url ? (
          <img
            src={story.image.url}
            alt=""
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              animating ? "opacity-0" : "opacity-100"
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 transition-opacity duration-300 ${
          animating ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 sm:p-6 md:p-8">
          <CategoryChip category={story.category} dark />
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="text-white font-bold text-sm">{active + 1}</span>
            <span className="text-white/50 text-xs">/</span>
            <span className="text-white/60 text-xs">{stories.length}</span>
          </div>
        </div>

        {/* Story info */}
        <div className="px-4 sm:px-8 md:px-12 pb-6 sm:pb-8 md:pb-10 pt-16 sm:pt-24 md:pt-32">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[#D9F26B]">
              <i className="ri-fire-fill" />
              #{active + 1} Trending
            </span>
            <span className="text-white/30">·</span>
            <span className="text-white/60 text-[11px]">
              {moment(story.timeStamp).fromNow()}
            </span>
          </div>

          <h1
            className="text-white font-bold leading-tight tracking-tight mb-3 max-w-2xl"
            style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)" }}
          >
            {story.title}
          </h1>

          <p className="text-white/75 text-sm sm:text-base leading-relaxed max-w-xl mb-5 line-clamp-2">
            {excerpt(story.story, 140)}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {story.owner && (
              <Link
                to={`/profile/${story.owner.username}`}
                className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2 hover:bg-white/25 transition-colors"
              >
                <Avatar
                  src={story.owner.image?.url}
                  alt={story.owner.username || ""}
                  size={24}
                  ring
                />
                <span className="text-white text-sm font-semibold truncate max-w-[120px]">
                  {story.owner.name || story.owner.username}
                </span>
              </Link>
            )}

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
                <span className="w-6 h-6 bg-white/15 rounded-full flex items-center justify-center">
                  <i className="ri-heart-fill text-red-400 text-xs" />
                </span>
                {formatCount(likesCount)}
              </span>
              <span className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
                <span className="w-6 h-6 bg-white/15 rounded-full flex items-center justify-center">
                  <i className="ri-eye-line text-blue-300 text-xs" />
                </span>
                {formatCount(viewsCount)}
              </span>
            </div>

            <Link
              to={`/stories/${story._id}`}
              className="ml-auto sm:ml-0 inline-flex items-center gap-2 bg-[#D9F26B] text-[#0A0A0A] font-bold text-sm px-5 py-2.5 rounded-full hover:brightness-105 transition-all"
            >
              Read Story
              <span className="w-5 h-5 bg-[#0A0A0A] text-[#D9F26B] rounded-full flex items-center justify-center">
                <i className="ri-arrow-right-up-line text-[11px]" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 bg-black/40 backdrop-blur-sm border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
      >
        <i className="ri-arrow-left-s-line text-lg" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 bg-black/40 backdrop-blur-sm border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
      >
        <i className="ri-arrow-right-s-line text-lg" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {stories.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDot(i)}
            className={`rounded-full transition-all duration-300 ${
              i === active
                ? "w-6 h-2 bg-[#D9F26B]"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/10">
        <div
          key={active}
          className="h-full bg-[#D9F26B] rounded-full"
          style={{ animation: "heroProgress 5s linear forwards" }}
        />
      </div>

      <style>{`
        @keyframes heroProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════
   HIGHLIGHT CARDS
   ══════════════════════════════════════ */
function HighlightCards({
  stats,
}: {
  stats: {
    totalStories: number;
    totalWriters: number;
    featuredWriter?: Writer;
  };
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
      {stats.featuredWriter && (
        <Link
          to={`/profile/${stats.featuredWriter.username}`}
          className="relative col-span-2 lg:col-span-1 rounded-3xl overflow-hidden min-h-[160px] sm:min-h-[180px] group"
        >
          {stats.featuredWriter.image?.url ? (
            <img
              src={stats.featuredWriter.image.url}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt=""
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative z-10 flex flex-col justify-between h-full p-4">
            <span className="text-white font-bold text-base tracking-wide">
              DIARY
            </span>
            <div>
              <p className="text-2xl font-bold text-white">
                {formatCount(stats.featuredWriter.followers?.length || 0)}+
              </p>
              <p className="text-white/70 text-xs mt-0.5 truncate">
                {stats.featuredWriter.name || stats.featuredWriter.username}
              </p>
            </div>
          </div>
        </Link>
      )}

      <div className="rounded-3xl bg-gray-100 p-4 sm:p-5 min-h-[160px] sm:min-h-[180px] flex flex-col justify-between">
        <p className="text-xs text-gray-500 font-medium">Community driven</p>
        <div>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">100%</p>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
            A calm space to read and share stories.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-[#D9F26B] p-4 sm:p-5 min-h-[160px] sm:min-h-[180px] flex flex-col justify-between">
        <p className="text-xs text-[#0A0A0A]/70 font-semibold">Total Stories</p>
        <div>
          <p className="text-3xl sm:text-4xl font-bold text-[#0A0A0A]">
            {formatCount(stats.totalStories)}+
          </p>
          <p className="text-xs text-[#0A0A0A]/60 mt-1.5 leading-relaxed">
            Published by writers worldwide.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-[#0A0A0A] p-4 sm:p-5 min-h-[160px] sm:min-h-[180px] flex flex-col justify-between text-white">
        <p className="text-xs text-white/60 font-medium">Writers</p>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl sm:text-4xl font-bold">
            {formatCount(stats.totalWriters)}+
          </p>
          <i className="ri-arrow-right-up-line text-2xl text-[#D9F26B]" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   STORY CARD — main grid item
   ══════════════════════════════════════ */
function StoryCard({ story }: { story: Story }) {
  const likesCount = getLikesCount(story);
  const viewsCount = getViewsCount(story);

  return (
    <Link to={`/stories/${story._id}`} className="group block h-full">
      <SoftCard className="overflow-hidden hover:shadow-[0_8px_32px_-4px_rgba(15,23,42,0.12)] transition-all duration-300 h-full flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 flex-shrink-0">
          {story.image?.url ? (
            <img
              src={story.image.url}
              alt={story.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
              <i
                className={`${
                  CATEGORIES[story.category]?.icon || "ri-file-text-line"
                } text-4xl text-blue-400`}
              />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <CategoryChip category={story.category} dark />
          </div>
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
              <i className="ri-heart-fill text-red-400 text-[10px]" />
              {formatCount(likesCount)}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <h3 className="text-[15px] font-bold leading-snug text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {story.title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">
            {excerpt(story.story, 90)}
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                src={story.owner?.image?.url}
                alt={story.owner?.username || ""}
                size={24}
              />
              <span className="text-xs font-semibold text-gray-700 truncate">
                {story.owner?.name || story.owner?.username}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <i className="ri-eye-line text-[11px]" />
                {formatCount(viewsCount)}
              </span>
              <span className="text-gray-200">·</span>
              <span>{moment(story.timeStamp).fromNow(true)}</span>
            </div>
          </div>
        </div>
      </SoftCard>
    </Link>
  );
}

/* ══════════════════════════════════════
   STORY COMPACT — sidebar/trending row
   ══════════════════════════════════════ */
function StoryCompact({ story, index }: { story: Story; index: number }) {
  const likesCount = getLikesCount(story);
  const viewsCount = getViewsCount(story);

  return (
    <Link
      to={`/stories/${story._id}`}
      className="group flex items-start gap-3 py-3"
    >
      <span
        className={`text-xl font-bold w-6 shrink-0 leading-none pt-0.5 ${
          index === 0
            ? "text-[#D9F26B]"
            : index === 1
            ? "text-gray-300"
            : index === 2
            ? "text-orange-300"
            : "text-gray-200"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-blue-600 transition-colors">
          {story.title}
        </h4>
        <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
          <span className="truncate max-w-[80px]">
            {story.owner?.name || story.owner?.username}
          </span>
          <span className="text-gray-300 shrink-0">·</span>
          <span className="shrink-0 flex items-center gap-0.5">
            <i className="ri-heart-fill text-red-400 text-[10px]" />
            {formatCount(likesCount)}
          </span>
          <span className="text-gray-300 shrink-0">·</span>
          <span className="shrink-0 flex items-center gap-0.5">
            <i className="ri-eye-line text-[10px]" />
            {formatCount(viewsCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════
   WRITER ROW
   ══════════════════════════════════════ */
function WriterRow({ writer, rank }: { writer: Writer; rank: number }) {
  return (
    <Link
      to={`/profile/${writer.username}`}
      className="flex items-center gap-3 py-2.5 group"
    >
      <div className="relative shrink-0">
        <Avatar src={writer.image?.url} alt={writer.username} size={40} />
        {rank <= 3 && (
          <span
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white ${
              rank === 1
                ? "bg-[#D9F26B] text-[#0A0A0A]"
                : rank === 2
                ? "bg-gray-200 text-gray-700"
                : "bg-orange-200 text-orange-800"
            }`}
          >
            {rank}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {writer.name || writer.username}
        </p>
        <p className="text-xs text-gray-500">
          {formatCount(writer.followers?.length || 0)} followers
          {writer.storiesCount > 0 && ` · ${writer.storiesCount} stories`}
        </p>
      </div>
      <i className="ri-arrow-right-s-line text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
    </Link>
  );
}

/* ══════════════════════════════════════
   PAGINATION BAR
   ══════════════════════════════════════ */
function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const items: (number | "gap")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        items.push(i);
      } else if (items[items.length - 1] !== "gap") {
        items.push("gap");
      }
    }
    return items;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="h-10 w-10 rounded-full bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center shadow-sm"
      >
        <i className="ri-arrow-left-line" />
      </button>
      {pages.map((item, i) =>
        item === "gap" ? (
          <span
            key={`g${i}`}
            className="w-10 h-10 flex items-center justify-center text-gray-400"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
              item === page
                ? "bg-[#0A0A0A] text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
            }`}
          >
            {item}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="h-10 w-10 rounded-full bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center shadow-sm"
      >
        <i className="ri-arrow-right-line" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   SKELETONS
   ══════════════════════════════════════ */
const CardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
      <div className="aspect-[16/10] bg-gray-100" />
      <div className="p-5 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mt-3" />
      </div>
    </div>
  </div>
);

const WriterSkeleton = () => (
  <div className="flex items-center gap-3 py-2.5 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
    </div>
  </div>
);

/* ══════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════ */
export const Stories: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Ref to scroll to stories section on pagination
  const storiesSectionRef = useRef<HTMLDivElement>(null);

  // Sidebar data (loads once)
  const [trendingStories, setTrendingStories] = useState<Story[]>([]);
  const [topWriters, setTopWriters] = useState<Writer[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // Paginated stories
  const [stories, setStories] = useState<Story[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalStories: 0,
    limit: STORIES_PER_PAGE,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("best"); // ✅ Default = best (score based)
  const [page, setPage] = useState(1);

  // UI state
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);

  // ══════════════════════════════
  // EFFECTS
  // ══════════════════════════════

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [category, sortBy, search]);

  // Notification / message badge counts
  const checkBadges = useCallback(async () => {
    if (!user) return;
    try {
      const [nr, cr] = await Promise.all([
        api.get("/users/notifications/unread-count"),
        api.get("/chat/conversations"),
      ]);
      if (nr.data.success) setUnreadNotif(nr.data.unreadCount || 0);
      if (cr.data.success)
        setUnreadMsg(
          cr.data.conversations.reduce(
            (a: number, c: any) => a + (c.unreadCount || 0),
            0
          )
        );
    } catch {
      // silently fail — badges are optional
    }
  }, [user]);

  // Fetch sidebar (trending + writers) — ONCE
  // ✅ Backend already sorts by trending score — don't re-sort here
  const fetchSidebar = useCallback(async () => {
    try {
      setSidebarLoading(true);
      const res = await api.get("/stories", {
        params: { page: 1, limit: 12 },
      });

      if (res.data.success) {
        // ✅ Trust backend order — no client-side sorting
        const trending =
          res.data.topFiveStories || res.data.trendingStories || [];
        setTrendingStories(trending);
 console.log("Backend trending:", res.data.topFiveStories);
        if (res.data.topFiveWriters) {
          setTopWriters(res.data.topFiveWriters);
        }
      }
    } catch (err) {
      console.error("Sidebar fetch failed:", err);
    } finally {
      setSidebarLoading(false);
    }
  }, []);

  // Fetch paginated stories (on filter/page change)
  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page,
        limit: STORIES_PER_PAGE,
        sort: sortBy,
      };
      if (search) params.search = search;
      if (category) params.category = category;

      const res = await api.get("/stories", { params });

      if (res.data.success) {
        const list: Story[] = res.data.stories || [];
        setStories(list);

        // Use pagination object from backend
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        } else {
          // Fallback if backend doesn't send pagination
          const total = res.data.totalStories ?? list.length;
          const totalPgs = Math.ceil(total / STORIES_PER_PAGE);
          setPagination({
            currentPage: page,
            totalPages: totalPgs,
            totalStories: total,
            limit: STORIES_PER_PAGE,
            hasNextPage: page < totalPgs,
            hasPrevPage: page > 1,
          });
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to load stories");
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy, page]);

  useEffect(() => {
    fetchSidebar();
  }, [fetchSidebar]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    checkBadges();
    const id = setInterval(checkBadges, 15000);
    return () => clearInterval(id);
  }, [checkBadges]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket || !user) return;
    const onN = () => setUnreadNotif((p) => p + 1);
    const onM = () => setUnreadMsg((p) => p + 1);
    socket.on("newNotification", onN);
    socket.on("newMessage", onM);
    return () => {
      socket.off("newNotification", onN);
      socket.off("newMessage", onM);
    };
  }, [socket, user]);

  // ══════════════════════════════
  // DERIVED
  // ══════════════════════════════
  const hasFilter = !!(category || search);
  const { totalStories, totalPages } = pagination;

  // ══════════════════════════════
  // HANDLERS
  // ══════════════════════════════
  const clearFilters = () => {
    setCategory("");
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ✅ FIXED: Scroll to stories section, not top of page
  const handlePageChange = (p: number) => {
    setPage(p);
    // Scroll to top of stories section (not top of page)
    setTimeout(() => {
      storiesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // ══════════════════════════════
  // RENDER
  // ══════════════════════════════
  return (
    <div className="min-h-screen bg-[#F5F5F7]">

      {/* HEADER */}
      <header className="sticky top-0 z-40 pt-3 sm:pt-4 px-3 sm:px-5">
        <div className="max-w-7xl mx-auto">
          <nav className="bg-white rounded-full shadow-[0_4px_24px_-6px_rgba(15,23,42,0.1)] flex items-center justify-between pl-4 sm:pl-6 pr-2 sm:pr-3 py-2">
            <Link to="/" className="shrink-0 flex items-center">
              <DiaryLogo />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {[
                { to: "/", label: "Home" },
                { to: "/search", label: "Writers" },
                { to: "/write", label: "Write" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 text-xs font-bold tracking-wider uppercase text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <i className="ri-search-line text-base sm:text-lg" />
              </button>

              {!user ? (
                <Pill
                  variant="lime"
                  to="/login"
                  className="!py-2 !px-4 !text-xs ml-1"
                >
                  Sign in
                </Pill>
              ) : (
                <>
                  <Link
                    to="/chat"
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <i className="ri-chat-3-line text-base sm:text-lg" />
                    <Badge count={unreadMsg} color="lime" />
                  </Link>
                  <Link
                    to="/notifications"
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <i className="ri-notification-3-line text-base sm:text-lg" />
                    <Badge count={unreadNotif} />
                  </Link>

                  {/* Profile dropdown */}
                  <div className="relative hidden md:block ml-1">
                    <button
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center"
                    >
                      <Avatar
                        src={user.image?.url}
                        alt={user.username}
                        size={34}
                      />
                    </button>
                    {profileOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setProfileOpen(false)}
                        />
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {user.name || user.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              @{user.username}
                            </p>
                          </div>
                          {[
                            {
                              to: `/profile/${user.username}`,
                              icon: "ri-user-line",
                              label: "Profile",
                            },
                            {
                              to: "/settings",
                              icon: "ri-settings-line",
                              label: "Settings",
                            },
                          ].map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <i className={`${item.icon} text-gray-400`} />{" "}
                              {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              onClick={() => {
                                setProfileOpen(false);
                                handleLogout();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              <i className="ri-logout-box-line" /> Sign out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <Link to="/write" className="hidden md:inline-flex ml-1">
                    <Pill
                      variant="lime"
                      className="!py-2 !px-4 !text-xs"
                      icon={<i className="ri-arrow-right-up-line text-xs" />}
                    >
                      Write
                    </Pill>
                  </Link>

                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 ml-0.5"
                  >
                    <i className="ri-menu-line text-lg" />
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-5 pb-28 lg:pb-12">

        {/* HERO CAROUSEL — trending stories */}
        {!hasFilter && (
          sidebarLoading ? (
            <div
              className="rounded-[28px] sm:rounded-[36px] bg-gray-200 animate-pulse mb-8"
              style={{ height: "clamp(340px, 55vw, 520px)" }}
            />
          ) : trendingStories.length > 0 ? (
            <HeroCarousel stories={trendingStories} />
          ) : null
        )}

        {/* HIGHLIGHT CARDS */}
        {!hasFilter && !sidebarLoading && (
          <>
            <div className="text-center mb-6">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">
                · About ·
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
                A calm home for{" "}
                <span className="inline-flex items-center gap-1 align-middle">
                  <span className="w-6 h-6 rounded-full bg-blue-500 inline-flex items-center justify-center">
                    <i className="ri-quill-pen-line text-white text-xs" />
                  </span>
                  writers
                </span>{" "}
                and readers.
              </h2>
            </div>
            <HighlightCards
              stats={{
                totalStories: totalStories || trendingStories.length,
                totalWriters: topWriters.length > 0 ? topWriters.length * 20 : 0,
                featuredWriter: topWriters[0],
              }}
            />
          </>
        )}

        {/* MAIN LAYOUT */}
        <div className="flex gap-6 xl:gap-8">

          {/* MAIN COLUMN */}
          <main className="flex-1 min-w-0">

            {/* Category tabs */}
            <div className="bg-white rounded-2xl p-1.5 mb-5 shadow-sm flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setCategory("")}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  category === ""
                    ? "bg-[#0A0A0A] text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <i className="ri-apps-line text-[11px]" />
                All
              </button>
              {Object.entries(CATEGORIES).map(([val, m]) => (
                <button
                  key={val}
                  onClick={() => setCategory(val === category ? "" : val)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    category === val
                      ? "bg-[#0A0A0A] text-white"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <i className={`${m.icon} text-[11px]`} />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Active filter pill */}
            {hasFilter && (
              <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 mb-4 shadow-sm">
                <p className="text-sm text-gray-600">
                  {search ? (
                    <>
                      Results for "
                      <span className="font-bold text-gray-900">{search}</span>"
                    </>
                  ) : (
                    <>
                      Category:{" "}
                      <span className="font-bold text-gray-900">
                        {CATEGORIES[category]?.label}
                      </span>
                    </>
                  )}
                  {!loading && (
                    <span className="text-gray-400 ml-2">
                      · {totalStories} found
                    </span>
                  )}
                </p>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 ml-4 shrink-0"
                >
                  Clear ×
                </button>
              </div>
            )}

            {/* Section header + sort */}
            {/* ✅ Ref here so pagination scrolls to this section */}
            <div
              ref={storiesSectionRef}
              className="flex items-center justify-between mb-5 scroll-mt-24"
            >
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-0.5">
                  {hasFilter ? "· Results ·" : "· Stories ·"}
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {hasFilter
                    ? "Matching stories"
                    : sortBy === "best"
                    ? "Best of the community"
                    : sortBy === "newest"
                    ? "Fresh from the community"
                    : "Oldest stories first"}
                </h2>
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="text-xs sm:text-sm font-semibold bg-white border border-gray-200 rounded-full px-3 sm:px-4 py-2 outline-none cursor-pointer text-gray-700 hover:border-gray-300 transition-colors shrink-0"
              >
                {/* ✅ Added "Best" option (default score-based) */}
                <option value="best">✨ Best</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            {/* Error */}
            {error && <ErrorCard message={error} onRetry={fetchStories} />}

            {/* Loading skeleton */}
            {!error && loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!error && !loading && stories.length === 0 && (
              <SoftCard className="p-10 sm:p-14 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                  <i className="ri-book-open-line text-2xl text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {search ? "No stories match your search" : "No stories yet"}
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  {search
                    ? "Try different keywords or browse by category."
                    : "Be the first to share a story."}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {hasFilter && (
                    <Pill variant="white" onClick={clearFilters}>
                      Clear filters
                    </Pill>
                  )}
                  <Pill
                    variant="lime"
                    to="/write"
                    icon={<i className="ri-arrow-right-up-line text-sm" />}
                  >
                    Write a story
                  </Pill>
                </div>
              </SoftCard>
            )}

            {/* Stories grid */}
            {!error && !loading && stories.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  {stories.map((story) => (
                    <StoryCard key={story._id} story={story} />
                  ))}
                </div>

                {/* Pagination info */}
                {totalStories > 0 && (
                  <div className="text-center mt-6">
                    <p className="text-xs text-gray-400">
                      Showing{" "}
                      <span className="font-semibold text-gray-600">
                        {(page - 1) * STORIES_PER_PAGE + 1}–
                        {Math.min(page * STORIES_PER_PAGE, totalStories)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-gray-600">
                        {totalStories}
                      </span>{" "}
                      stories
                    </p>
                  </div>
                )}

                <PaginationBar
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}

            {/* MOBILE: Trending + Writers (below grid) */}
            <div className="lg:hidden mt-8 space-y-5">
           

              {topWriters.length > 0 && (
                <SoftCard className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500">
                      Top Writers
                    </p>
                    <Link
                      to="/search"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      See all
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {topWriters.slice(0, 6).map((w, i) => (
                      <WriterRow key={w._id} writer={w} rank={i + 1} />
                    ))}
                  </div>
                </SoftCard>
              )}

              <div className="rounded-3xl bg-[#0A0A0A] p-6 text-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#D9F26B] flex items-center justify-center shrink-0">
                  <i className="ri-quill-pen-line text-[#0A0A0A] text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base mb-0.5">Got a story?</h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Share with a community that reads.
                  </p>
                </div>
                <Link
                  to="/write"
                  className="shrink-0 w-10 h-10 bg-[#D9F26B] text-[#0A0A0A] rounded-full flex items-center justify-center font-bold"
                >
                  <i className="ri-arrow-right-up-line" />
                </Link>
              </div>
            </div>
          </main>

          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="sticky top-24 space-y-5">

              <SoftCard className="p-4">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500 mb-3">
                  Search
                </p>
                <div className="relative">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Find a story…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                  />
                </div>
              </SoftCard>

             

              {sidebarLoading ? (
                <SoftCard className="p-5">
                  <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500 mb-3">
                    Top Writers
                  </p>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <WriterSkeleton key={i} />
                  ))}
                </SoftCard>
              ) : topWriters.length > 0 ? (
                <SoftCard className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500">
                      Top Writers
                    </p>
                    <Link
                      to="/search"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      See all
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {topWriters.slice(0, 5).map((w, i) => (
                      <WriterRow key={w._id} writer={w} rank={i + 1} />
                    ))}
                  </div>
                </SoftCard>
              ) : null}

              <div className="rounded-3xl bg-[#0A0A0A] p-6 text-white">
                <div className="w-10 h-10 rounded-full bg-[#D9F26B] flex items-center justify-center mb-4">
                  <i className="ri-quill-pen-line text-[#0A0A0A] text-lg" />
                </div>
                <h3 className="text-lg font-bold leading-tight mb-2">
                  Got a story?
                </h3>
                <p className="text-sm text-white/60 leading-relaxed mb-5">
                  Share your thoughts, fiction, or poetry with a community that
                  reads.
                </p>
                <Pill
                  variant="lime"
                  to="/write"
                  className="w-full !justify-center"
                  icon={<i className="ri-arrow-right-up-line text-sm" />}
                >
                  Start writing
                </Pill>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {user && (
        <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="bg-white rounded-full shadow-[0_8px_32px_-4px_rgba(15,23,42,0.15)] flex items-center justify-around py-2 px-2 max-w-sm mx-auto">
            <Link
              to="/"
              className="flex flex-col items-center gap-0.5 py-2 px-3 text-blue-600"
            >
              <i className="ri-home-5-fill text-lg" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Home
              </span>
            </Link>
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="flex flex-col items-center gap-0.5 py-2 px-3 text-gray-400"
            >
              <i className="ri-search-line text-lg" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Search
              </span>
            </button>
            <Link
              to="/write"
              className="flex items-center justify-center w-12 h-12 bg-[#D9F26B] text-[#0A0A0A] rounded-full shadow-lg -my-3 shrink-0"
            >
              <i className="ri-add-line text-xl" />
            </Link>
            <Link
              to="/notifications"
              className="relative flex flex-col items-center gap-0.5 py-2 px-3 text-gray-400"
            >
              <i className="ri-notification-3-line text-lg" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Alerts
              </span>
              <Badge count={unreadNotif} />
            </Link>
            <Link
              to={`/profile/${user.username}`}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-gray-400"
            >
              <Avatar src={user.image?.url} alt={user.username} size={22} />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Me
              </span>
            </Link>
          </div>
        </nav>
      )}

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && user && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Avatar src={user.image?.url} alt={user.username} size={42} />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {[
                { to: "/", label: "Home", icon: "ri-home-5-line" },
                { to: "/search", label: "Discover", icon: "ri-compass-3-line" },
                { to: "/write", label: "Write a Story", icon: "ri-quill-pen-line" },
                { to: "/chat", label: "Messages", icon: "ri-chat-3-line", badge: unreadMsg },
                { to: "/notifications", label: "Notifications", icon: "ri-notification-3-line", badge: unreadNotif },
                { to: `/profile/${user.username}`, label: "My Profile", icon: "ri-user-line" },
                { to: "/settings", label: "Settings", icon: "ri-settings-line" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                      <i className={`${item.icon} text-gray-500 text-sm`} />
                    </span>
                    {item.label}
                  </span>
                  {(item as any).badge > 0 && (
                    <span className="min-w-[20px] h-5 bg-[#D9F26B] text-[#0A0A0A] text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {(item as any).badge > 99 ? "99+" : (item as any).badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                  <i className="ri-logout-box-line text-red-500 text-sm" />
                </span>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SEARCH OVERLAY */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[70] bg-[#F5F5F7] flex flex-col">
          <div className="flex items-center gap-3 p-4 bg-white shadow-sm">
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 shrink-0"
            >
              <i className="ri-arrow-left-line text-xl text-gray-700" />
            </button>
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search stories, writers…"
                autoFocus
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center"
                >
                  <i className="ri-close-circle-fill text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500">
                {search
                  ? loading
                    ? "Searching…"
                    : `${stories.length} result${stories.length !== 1 ? "s" : ""}`
                  : "🔥 Trending Stories"}
              </p>
              {search && stories.length > 0 && (
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="text-xs font-bold text-blue-600"
                >
                  See all →
                </button>
              )}
            </div>

            {search && loading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 bg-white rounded-2xl animate-pulse"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-gray-100 rounded w-4/5" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && (
              <div className="space-y-2">
                {(search ? stories : trendingStories)
                  .slice(0, 20)
                  .map((s, idx) => {
                    const sLikes = getLikesCount(s);
                    const sViews = getViewsCount(s);

                    return (
                      <Link
                        key={s._id}
                        to={`/stories/${s._id}`}
                        onClick={() => setMobileSearchOpen(false)}
                        className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100 relative">
                          {s.image?.url ? (
                            <img
                              src={s.image.url}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                              <i
                                className={`${
                                  CATEGORIES[s.category]?.icon || "ri-book-line"
                                } text-blue-400 text-lg`}
                              />
                            </div>
                          )}
                          {!search && (
                            <span
                              className={`absolute top-1 left-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                idx === 0
                                  ? "bg-[#D9F26B] text-[#0A0A0A]"
                                  : idx === 1
                                  ? "bg-gray-200 text-gray-700"
                                  : idx === 2
                                  ? "bg-orange-200 text-orange-800"
                                  : "bg-black/50 text-white"
                              }`}
                            >
                              {idx + 1}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {s.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mb-1">
                            {s.owner?.name || s.owner?.username} ·{" "}
                            {CATEGORIES[s.category]?.label}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <i className="ri-heart-fill text-red-400 text-[10px]" />
                              {formatCount(sLikes)}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <i className="ri-eye-line text-[10px]" />
                              {formatCount(sViews)}
                            </span>
                          </div>
                        </div>

                        <i className="ri-arrow-right-s-line text-gray-300 shrink-0" />
                      </Link>
                    );
                  })}
              </div>
            )}

            {search && !loading && stories.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <i className="ri-search-line text-2xl text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  No results for "{search}"
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try different keywords
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};