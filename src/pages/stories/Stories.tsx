import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import api from "../../services/api";
import moment from "moment";
import DiaryLogo from "../../components/DiaryLogo";

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
   CONSTANTS & CONFIG
   ══════════════════════════════════════ */
const CATEGORIES: Record<
  string,
  { label: string; icon: string; image: string; color: string }
> = {
  fantasy: {
    label: "Fantasy",
    icon: "ri-magic-line",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=400&q=80",
    color: "from-purple-900/80 to-purple-500/40",
  },
  "random-thoughts": {
    label: "Thoughts",
    icon: "ri-bubble-chart-line",
    image:
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=400&q=80",
    color: "from-amber-900/80 to-amber-500/40",
  },
  poetry: {
    label: "Poetry",
    icon: "ri-quill-pen-line",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80",
    color: "from-rose-900/80 to-rose-500/40",
  },
  letter: {
    label: "Letters",
    icon: "ri-mail-send-line",
    image:
      "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=400&q=80",
    color: "from-blue-900/80 to-blue-500/40",
  },
  mystery: {
    label: "Mystery",
    icon: "ri-search-eye-line",
    image:
      "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=400&q=80",
    color: "from-slate-900/90 to-slate-600/50",
  },
  adventure: {
    label: "Adventure",
    icon: "ri-compass-3-line",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
    color: "from-emerald-900/80 to-emerald-500/40",
  },
  historical: {
    label: "Historical",
    icon: "ri-hourglass-2-line",
    image:
      "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80",
    color: "from-orange-900/80 to-orange-600/40",
  },
  fiction: {
    label: "Fiction",
    icon: "ri-book-open-line",
    image:
      "https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=400&q=80",
    color: "from-indigo-900/80 to-indigo-500/40",
  },
};

const STORIES_PER_PAGE = 12;
const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100";

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */
const formatCount = (n: number): string =>
  n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);

const getLikesCount = (story: Story): number => {
  if (typeof story.likesCounts === "number") return story.likesCounts;
  if (Array.isArray(story.likedBy)) return story.likedBy.length;
  return 0;
};

const getViewsCount = (story: Story): number =>
  Array.isArray(story.views) ? story.views.length : 0;

/* ══════════════════════════════════════
   ATOMS
   ══════════════════════════════════════ */
function Avatar({
  src,
  alt,
  size = 32,
}: {
  src?: string;
  alt: string;
  size?: number;
}) {
  return (
    <img
      src={src || AVATAR_FALLBACK}
      alt={alt}
      className="rounded-full object-cover bg-gray-100 flex-shrink-0"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      loading="lazy"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
      }}
    />
  );
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ══════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════ */

function TopHeroSection({ stories }: { stories: Story[] }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroStories = stories.slice(0, 5);

  const next = useCallback(() => {
    setActive((p) => (p + 1) % heroStories.length);
  }, [heroStories.length]);

  useEffect(() => {
    if (heroStories.length <= 1) return;
    timerRef.current = setInterval(next, 6500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, heroStories.length]);

  const goTo = (i: number) => {
    setActive(i);
    if (timerRef.current) clearInterval(timerRef.current);
    if (heroStories.length > 1) {
      timerRef.current = setInterval(next, 6500);
    }
  };

  if (heroStories.length === 0) return null;

  const story = heroStories[active];
  const cat =
    CATEGORIES[story.category] || CATEGORIES.fiction || CATEGORIES.other;
  const likes = getLikesCount(story);
  const views = getViewsCount(story);

  const timeAgo = (() => {
    const m = moment(story.timeStamp);
    const sec = moment().diff(m, "seconds");
    if (sec < 60) return `${Math.max(1, sec)}s ago`;
    const min = moment().diff(m, "minutes");
    if (min < 60) return `${min}m ago`;
    const hr = moment().diff(m, "hours");
    if (hr < 24) return `${hr}h ago`;
    const day = moment().diff(m, "days");
    if (day < 30) return `${day}d ago`;
    const mo = moment().diff(m, "months");
    if (mo < 12) return `${mo}mo ago`;
    return `${moment().diff(m, "years")}y ago`;
  })();

  return (
    <section className="relative w-full overflow-hidden rounded-2xl sm:rounded-[28px] bg-neutral-950 mb-5 sm:mb-6">
      {/*
        Height strategy:
        - Mobile: fixed short banner (not tall portrait 4/5)
        - sm+: cinematic wide crop
      */}
      <div className="relative h-[240px] xs:h-[260px] sm:h-[340px] md:h-[400px] lg:h-[440px]">
        {/* Image */}
        {story.image?.url ? (
          <img
            key={story._id}
            src={story.image.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover animate-heroFade"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              cat.color || cat.gradient || "from-neutral-800 to-neutral-950"
            }`}
          />
        )}

        {/* Overlays — stronger on mobile bottom, side wash on desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
        <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-black/80 via-black/35 to-transparent" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-7 md:p-9 max-w-3xl">
          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <span className="inline-flex items-center bg-white text-neutral-900 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md tracking-wide">
              Featured
            </span>
            <span className="inline-flex items-center text-white/90 text-[9px] sm:text-[10px] font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/15">
              {cat.label}
            </span>
            <span className="hidden sm:inline text-white/50 text-[10px] font-medium">
              {timeAgo}
            </span>
          </div>

          {/* Title — smaller on phone so it doesn’t dominate */}
          <h1
            className="text-white font-semibold tracking-tight leading-[1.15] mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-2"
            style={{
              fontSize: "clamp(1.25rem, 4.2vw, 2.75rem)",
              letterSpacing: "-0.02em",
            }}
          >
            {story.title}
          </h1>

          {/* Author + stats */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-3 sm:mb-5">
            <Link
              to={`/profile/${story.owner.username}`}
              className="flex items-center gap-2 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                src={story.owner.image?.url}
                alt={story.owner.username}
                size={28}
                ring
              />
              <span className="text-white text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                {story.owner.name || story.owner.username}
              </span>
            </Link>

            <span className="hidden sm:flex items-center gap-2 text-white/55 text-xs">
              <span>{formatCount(views)} reads</span>
              <span className="text-white/25">·</span>
              <span>{formatCount(likes)} likes</span>
            </span>
          </div>

          {/* CTA + dots row */}
          <div className="flex items-center justify-between gap-3">
            <Link
              to={`/stories/${story._id}`}
              className="inline-flex items-center gap-1.5 bg-white text-neutral-900 text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              Read story
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            {heroStories.length > 1 && (
              <div className="flex items-center gap-1.5">
                {heroStories.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show story ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === active
                        ? "w-5 sm:w-6 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroFade {
          from { opacity: 0; transform: scale(1.04); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-heroFade { animation: heroFade 0.85s ease-out forwards; }
      `}</style>
    </section>
  );
}

export default function PremiumWriteCard() {
  return (
    <Link
      to="/write"
      className="group relative block w-full overflow-hidden rounded-2xl sm:rounded-[24px] mb-6 sm:mb-8"
    >
      {/* Base — Deep Electric Cobalt Canvas */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020826] via-[#00145a] to-[#01061c]" />

      {/* Soft color wash — Sunset Coral (Top Right) & Electric Cyan (Bottom Left) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,92,0,0.35),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,212,255,0.22),_transparent_50%)]" />

      {/* Fine top hairline — Sunset Gold Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF7A00]/60 to-transparent" />

      {/* Right-side soft panel glow on larger screens */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#FF5C00]/12 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3 sm:gap-5 px-4 py-3.5 sm:px-7 sm:py-5">
        {/* Accent mark — Vivid Gradient Bar (Sunset Orange to Electric Cyan) */}
        <div className="w-[3px] self-stretch min-h-[40px] rounded-full bg-gradient-to-b from-[#FF9E00] via-[#FF0055] to-[#00D4FF] opacity-95 shrink-0" />

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className="hidden sm:block text-[10px] font-medium tracking-[0.2em] uppercase text-[#FF9E00] mb-1">
            New entry
          </p>
          <h2 className="text-[15px] sm:text-lg font-semibold text-white tracking-tight leading-snug">
            Write something today
          </h2>
          <p className="text-[13px] text-[#A3B3D9] mt-0.5 leading-snug">
            A quiet place for your thoughts.
          </p>
        </div>

        {/* CTA — Acid Lime Pop Button (Matches reference image styling) */}
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-[#88FF00] text-[#020826] text-xs sm:text-sm font-bold px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full group-hover:bg-[#9eff1a] group-hover:shadow-[0_0_20px_rgba(136,255,0,0.4)] transition-all shadow-sm">
            <span>Write</span>

            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="opacity-90 group-hover:translate-x-0.5 transition-transform"
              aria-hidden
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </Link>
  );
}

// Types (retained for TypeScript safety)
interface CategoryCardsProps {
  active: string;
  onSelect: (c: string) => void;
  categories?: Record<
    string,
    { label: string; image: string; description?: string; color?: string }
  >;
}

function CategoryCardsWithImages({
  active,
  onSelect,
  categories = CATEGORIES, // Uses your CATEGORIES object
}: CategoryCardsProps) {
  return (
    <section className="mb-7 sm:mb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
            Browse by mood
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">
            Select a genre to filter stories
          </p>
        </div>

        {active && (
          <button
            onClick={() => onSelect("")}
            type="button"
            className="shrink-0 text-xs font-semibold text-neutral-600 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-full transition-all active:scale-95"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Horizontal Scroll Deck */}
      <div className="flex gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
        {/* "ALL" Card — Styled as a sleek tactile trigger */}
        <button
          onClick={() => onSelect("")}
          type="button"
          className={`snap-start shrink-0 relative h-[82px] sm:h-[94px] w-[82px] sm:w-[100px] rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.97] border ${
            !active
              ? "border-neutral-900 bg-neutral-900 text-white shadow-lg shadow-neutral-900/15 ring-2 ring-neutral-900/10"
              : "border-neutral-200/80 bg-neutral-100 text-neutral-700 hover:bg-neutral-200/60"
          }`}
        >
          {/* Active subtle background glow */}
          {!active && (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-900 to-black opacity-90" />
          )}

          <div className="relative z-10 h-full flex flex-col items-center justify-center p-2 text-center">
            <span className="text-xs sm:text-sm font-bold tracking-tight">
              All
            </span>
            <span
              className={`text-[10px] mt-0.5 font-medium ${
                !active ? "text-neutral-400" : "text-neutral-500"
              }`}
            >
              Explore
            </span>
          </div>
        </button>

        {/* Category Cards */}
        {Object.entries(categories).map(([key, cat]) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(isActive ? "" : key)}
              type="button"
              className={`group snap-start shrink-0 relative h-[82px] sm:h-[94px] w-[124px] sm:w-[148px] rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.97] border ${
                isActive
                  ? "border-neutral-950 ring-2 ring-neutral-950 ring-offset-2 shadow-xl scale-[1.02]"
                  : "border-black/5 hover:border-black/15 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              {/* Background Image */}
              <img
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />

              {/* Scrim Overlay — Guarantees 100% text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

              {/* Category Color Wash (Optional accent) */}
              {cat.color && (
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-40 mix-blend-overlay`}
                />
              )}

              {/* Active State Checkmark Badge */}
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-md animate-in fade-in zoom-in-75 duration-200">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}

              {/* Content Label */}
              <div className="relative z-10 h-full flex flex-col justify-end p-2.5 sm:p-3 text-left">
                <span className="text-white text-[13px] sm:text-[14px] font-bold leading-tight tracking-tight drop-shadow-sm truncate">
                  {cat.label}
                </span>
                {cat.description && (
                  <span className="text-neutral-300 text-[10px] sm:text-[11px] font-medium mt-0.5 leading-tight line-clamp-1 opacity-90">
                    {cat.description}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WritersSmallRow({ writers }: { writers: Writer[] }) {
  if (!writers.length) return null;

  // Soft diary-safe gradients (readable, not neon-AI)
  const gradients = [
    "from-[#2a211c] via-[#4a3728] to-[#c4956a]",
    "from-[#1c1a2a] via-[#3d2a4a] to-[#8b6a9a]",
    "from-[#1a2420] via-[#2a4038] to-[#6a9a8a]",
    "from-[#241c1c] via-[#4a2a2a] to-[#c47a6a]",
    "from-[#1a1e28] via-[#2a3850] to-[#6a8ab4]",
    "from-[#241c18] via-[#5a4030] to-[#d4a574]",
    "from-[#1c2428] via-[#2a4850] to-[#5a9aa8]",
    "from-[#221c28] via-[#403050] to-[#9a7ab0]",
  ];

  return (
    <section className="mb-8 sm:mb-12">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 mb-3.5 sm:mb-4">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
            Voices to follow
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Writers people come back to
          </p>
        </div>
        <Link
          to="/search"
          className="shrink-0 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-0.5"
        >
          See all
          <i className="ri-arrow-right-s-line text-sm" />
        </Link>
      </div>

      {/* Horizontal banners — reference layout */}
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {writers.slice(0, 8).map((writer, i) => (
          <Link
            key={writer._id}
            to={`/profile/${writer.username}`}
            className="group snap-start shrink-0 relative w-[220px] sm:w-[248px] h-[104px] sm:h-[112px] rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-200"
          >
            {/* Gradient base */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${gradients[i % gradients.length]}`}
            />

            {/* Light wash for depth (no noise, no orbs) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />

            {/* Text — left */}
            <div className="relative z-10 h-full flex flex-col justify-center pl-3.5 sm:pl-4 pr-[88px] sm:pr-[96px]">
              {i < 3 && (
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 mb-1">
                  Top writer
                </span>
              )}
              <h4 className="text-[15px] sm:text-base font-bold text-white leading-tight truncate">
                {writer.name || writer.username}
              </h4>
              <p className="text-[11px] text-white/75 truncate mt-0.5">
                @{writer.username}
              </p>
              <p className="text-[11px] text-white/90 mt-2 font-medium tabular-nums">
                {formatCount(writer.followers?.length || 0)}{" "}
                <span className="font-normal text-white/65">followers</span>
              </p>
            </div>

            {/* Photo — right, large crop like reference */}
            <div className="absolute right-0 top-0 bottom-0 w-[92px] sm:w-[100px]">
              <div className="absolute inset-0 bg-gradient-to-r from-black/25 to-transparent z-10 pointer-events-none" />
              {writer.image?.url ? (
                <img
                  src={writer.image.url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.04] transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Avatar src={undefined} alt={writer.username} size={56} />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PremiumStoryCard({ story }: { story: Story }) {
  const cat =
    CATEGORIES[story.category] || CATEGORIES.other || CATEGORIES.fiction;
  const likes = getLikesCount(story);
  const views = getViewsCount(story);

  const timeAgo = (() => {
    const m = moment(story.timeStamp);
    const sec = moment().diff(m, "seconds");
    if (sec < 60) return `${Math.max(1, sec)}s`;
    const min = moment().diff(m, "minutes");
    if (min < 60) return `${min}m`;
    const hr = moment().diff(m, "hours");
    if (hr < 24) return `${hr}h`;
    const day = moment().diff(m, "days");
    if (day < 30) return `${day}d`;
    const mo = moment().diff(m, "months");
    if (mo < 12) return `${mo}mo`;
    return `${moment().diff(m, "years")}y`;
  })();

  return (
    <Link
      to={`/stories/${story._id}`}
      className="group block active:scale-[0.98] transition-transform duration-150"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] rounded-[18px] sm:rounded-2xl overflow-hidden bg-neutral-100 mb-2.5 ring-1 ring-black/[0.04] shadow-sm group-hover:shadow-md transition-shadow duration-300">
        {story.image?.url ? (
          <img
            src={story.image.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              cat.color || cat.gradient || "from-neutral-700 to-neutral-900"
            }`}
          />
        )}

        {/* Soft bottom scrim — text stays readable */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none" />

        {/* Genre pill */}
        <span className="absolute bottom-2 left-2 max-w-[70%] truncate px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-semibold text-white tracking-wide border border-white/10">
          {cat.label}
        </span>

        {/* Time */}
        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-medium text-white/85 tabular-nums">
          {timeAgo}
        </span>
      </div>

      {/* Body */}
      <div className="min-w-0 px-0.5">
        <h4 className="text-[13px] sm:text-[14px] font-semibold text-neutral-900 leading-snug line-clamp-2 tracking-tight group-hover:text-neutral-600 transition-colors duration-200">
          {story.title}
        </h4>

        {/* Author */}
        <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
          <Avatar
            src={story.owner?.image?.url}
            alt={story.owner?.username || ""}
            size={16}
          />
          <span className="text-[11px] text-neutral-500 font-medium truncate">
            {story.owner?.name || story.owner?.username}
          </span>
        </div>

        {/* Stats — quiet, secondary */}
        <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-neutral-400 tabular-nums">
          <span className="inline-flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
            {formatCount(views)}
          </span>

          <span className="text-neutral-300" aria-hidden>
            ·
          </span>

          <span className="inline-flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 20s-7-4.2-9.2-8.2C1.2 8.5 3.4 5 7 5c1.6 0 3 1 3.9 2.4C11.9 6 13.4 5 15 5c3.6 0 5.8 3.5 4.2 6.8C19 15.8 12 20 12 20z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {formatCount(likes)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function PremiumEmptyState({
  search,
  category,
  onClear,
}: {
  search: string;
  category: string;
  onClear: () => void;
}) {
  const catLabel = category ? CATEGORIES[category]?.label : "";

  let heading = "It's completely quiet here";
  let subheading =
    "Be the first to break the silence. Start writing your masterpiece today.";

  if (search && category) {
    heading = `No matches in ${catLabel}`;
    subheading = `We couldn't find any ${catLabel} stories matching "${search}". Try adjusting your keywords.`;
  } else if (search) {
    heading = `No results for "${search}"`;
    subheading =
      "We couldn't find anything matching your search. Check the spelling or try a broader term.";
  } else if (category) {
    heading = `No ${catLabel} stories yet`;
    subheading = `Looks like this section is waiting for its first adventure. Will you be the one to write it?`;
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] my-8">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <i
          className={
            search
              ? "ri-search-2-line text-3xl text-gray-400"
              : "ri-ghost-line text-3xl text-gray-400"
          }
        />
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
        {heading}
      </h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
        {subheading}
      </p>

      {search || category ? (
        <button
          onClick={onClear}
          className="bg-gray-100 text-gray-900 px-6 py-3 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors shadow-sm"
        >
          Clear all filters
        </button>
      ) : (
        <Link
          to="/write"
          className="bg-gray-900 text-white px-8 py-3.5 rounded-full text-sm font-black hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2"
        >
          <i className="ri-quill-pen-line text-lg" /> Start Writing
        </Link>
      )}
    </div>
  );
}

function PremiumPagination({
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
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1))
        items.push(i);
      else if (items[items.length - 1] !== "gap") items.push("gap");
    }
    return items;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12 pb-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-sm"
      >
        <i className="ri-arrow-left-s-line text-xl" />
      </button>
      {pages.map((item, i) =>
        item === "gap" ? (
          <span
            key={`g${i}`}
            className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold"
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={`w-10 h-10 rounded-full text-sm font-black transition-all shadow-sm ${
              item === page
                ? "bg-gray-900 text-white border-transparent"
                : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-sm"
      >
        <i className="ri-arrow-right-s-line text-xl" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════ */
export const Stories: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const exploreRef = useRef<HTMLDivElement>(null);

  const [trendingStories, setTrendingStories] = useState<Story[]>([]);
  const [topWriters, setTopWriters] = useState<Writer[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);

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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("best");
  const [page, setPage] = useState(1);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [category, sortBy]);

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
            0,
          ),
        );
    } catch {}
  }, [user]);

  const fetchSidebar = useCallback(async () => {
    try {
      setSidebarLoading(true);
      const res = await api.get("/stories", {
        params: { page: 1, limit: 12, sort: "best" },
      });
      if (res.data.success) {
        setTrendingStories(
          res.data.topFiveStories || res.data.trendingStories || [],
        );
        if (res.data.topFiveWriters) setTopWriters(res.data.topFiveWriters);
      }
    } catch (err) {
      console.error("Sidebar fetch failed:", err);
    } finally {
      setSidebarLoading(false);
    }
  }, []);

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
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        } else {
          const total = res.data.totalStories ?? list.length;
          const totalPgs = Math.max(1, Math.ceil(total / STORIES_PER_PAGE));
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
      setError(
        e.message || "We couldn't connect to the library. Please try again.",
      );
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

  const hasFilter = !!(category || search);
  const { totalStories, totalPages } = pagination;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    setTimeout(() => {
      exploreRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleCategorySelect = (catKey: string) => {
    setCategory(catKey);
    setTimeout(() => {
      exploreRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const clearFilters = () => {
    setCategory("");
    setSearch("");
    setSearchInput("");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-200">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-black/[0.04] supports-[backdrop-filter]:bg-white/50 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 md:h-20 flex items-center justify-between gap-4 sm:gap-8">
            {/* 1. Left — Logo & App-like Segmented Nav */}
            <div className="flex items-center gap-6 xl:gap-8 min-w-0 shrink-0">
              <Link
                to="/"
                className="flex items-center shrink-0 hover:opacity-80 transition-opacity active:scale-95"
              >
                {/* Replace with your actual Logo component */}
                <DiaryLogo />
              </Link>

              {/* Segmented Control Nav (Premium Desktop look) */}
              <nav className="hidden lg:flex items-center bg-neutral-100/80 p-1 rounded-full border border-neutral-200/50 shadow-inner">
                <Link
                  to="/"
                  className="px-4 py-1.5 text-[13px] font-bold text-neutral-900 bg-white rounded-full shadow-sm ring-1 ring-black/5"
                >
                  Stories
                </Link>
                <Link
                  to="/search"
                  className="px-4 py-1.5 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors rounded-full hover:bg-neutral-200/50"
                >
                  Writers
                </Link>
              </nav>
            </div>

            {/* 2. Center — Command Palette Style Search */}
            <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg transition-all duration-300 group">
              <div className="relative w-full">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M20 20l-3-3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  type="text"
                  placeholder="Search stories or writers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-10 pl-10 pr-12 rounded-full bg-neutral-100/80 text-[14px] font-medium text-neutral-900 placeholder:text-neutral-400 outline-none border border-transparent focus:bg-white focus:border-neutral-200 focus:ring-4 focus:ring-neutral-900/5 transition-all duration-300"
                />

                {/* Dynamic Right Element: Clear button OR Shortcut Hint */}
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/80 transition-all active:scale-90"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center pointer-events-none">
                    <span className="text-[10px] font-bold tracking-widest text-neutral-400 bg-neutral-200/60 px-1.5 py-0.5 rounded-md">
                      ⌘K
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Right — Fluid Actions & Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile search trigger */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M20 20l-3-3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {!user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex text-[14px] font-semibold text-neutral-600 hover:text-neutral-950 px-3 py-2 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center h-9 sm:h-10 px-5 rounded-full bg-neutral-950 text-white text-[13px] sm:text-[14px] font-bold tracking-wide hover:bg-neutral-800 active:scale-95 transition-all shadow-md shadow-neutral-900/10 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Join
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Notification Icon */}
                  <Link
                    to="/notifications"
                    className="relative hidden lg:flex w-10 h-10 rounded-full items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 active:scale-95 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 20a2 2 0 0 0 4 0"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <NotificationBadge count={unreadNotif} />
                  </Link>

                  {/* Messages Icon */}
                  <Link
                    to="/chat"
                    className="relative hidden lg:flex w-10 h-10 rounded-full items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 active:scale-95 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V6.5z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <NotificationBadge count={unreadMsg} />
                  </Link>

                  {/* Primary CTA (Write) */}
                  <Link
                    to="/write"
                    className="hidden md:inline-flex items-center h-10 gap-2 px-5 rounded-full bg-neutral-950 text-white text-[14px] font-bold tracking-wide hover:bg-neutral-800 active:scale-95 transition-all shadow-md shadow-neutral-900/10 hover:shadow-lg hover:-translate-y-0.5 ml-2"
                  >
                    Write
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="opacity-80"
                    >
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>

                  {/* Vertical Divider */}
                  <div className="hidden lg:block w-px h-6 bg-neutral-200 mx-2" />

                  {/* Profile Dropdown (Desktop) */}
                  <div className="relative hidden lg:block">
                    <button
                      type="button"
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center rounded-full ring-2 ring-transparent hover:ring-neutral-200 active:scale-95 transition-all focus:outline-none"
                    >
                      <Avatar
                        src={user.image?.url}
                        alt={user.username}
                        size={36}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {profileOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setProfileOpen(false)}
                        />
                        <div className="absolute right-0 mt-3 w-60 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-200/60 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="px-5 py-3 border-b border-neutral-100/80 mb-1">
                            <p className="text-[14px] font-bold text-neutral-900 truncate">
                              {user.name || user.username}
                            </p>
                            <p className="text-[12px] font-medium text-neutral-500 truncate mt-0.5">
                              @{user.username}
                            </p>
                          </div>

                          <Link
                            to={`/profile/${user.username}`}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
                          >
                            Your profile
                          </Link>

                          <Link
                            to="/settings"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
                          >
                            Account settings
                          </Link>

                          <div className="border-t border-neutral-100/80 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileOpen(false);
                                handleLogout();
                              }}
                              className="w-full text-left flex items-center gap-3 px-5 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Sign out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mobile Menu Trigger */}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Avatar
                      src={user.image?.url}
                      alt={user.username}
                      size={32}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-32 selection:bg-neutral-200">
        {/* ── TOP LAYOUT: Hero -> Write -> Categories -> Writers ── */}
        {!hasFilter && (
          <div className="flex flex-col gap-10 sm:gap-14 mb-10 sm:mb-16">
            {/* 1. Hero */}
            {sidebarLoading ? (
              <div className="w-full rounded-[20px] sm:rounded-[28px] bg-neutral-100 animate-pulse aspect-[4/3] sm:aspect-[21/9]" />
            ) : trendingStories.length > 0 ? (
              <TopHeroSection stories={trendingStories} />
            ) : null}

            {/* 2. Write Action */}
            <PremiumWriteCard />
  {/* 4. Authors */}
            {!sidebarLoading && topWriters.length > 0 && (
              <WritersSmallRow writers={topWriters} />
            )}
            {/* 3. Browse Filter */}
            <CategoryCardsWithImages
              active={category}
              onSelect={handleCategorySelect}
            />

          
          </div>
        )}

        {/* ── FEED SECTION ── */}
        {/* ══════════ FEED CONTROL CARD ══════════ */}
        <section
          ref={exploreRef}
          className={`scroll-mt-28 ${!hasFilter ? "mt-2" : ""}`}
        >
          <div className="relative overflow-hidden rounded-2xl sm:rounded-[20px] mb-6 sm:mb-8 border border-white/[0.06] shadow-xl">
            {/* Base Canvas — Deep Warm Ink */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#18161a] via-[#121014] to-[#0c0b0e]" />

            {/* Soft Radial Color Washes — Parchment & Warm Amber (Human / Diary Feel) */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(196,149,106,0.18),_transparent_55%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(140,110,80,0.12),_transparent_50%)] pointer-events-none" />

            {/* Hairlines for Depth */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c4956a]/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Card Interior */}
            <div className="relative z-10 flex items-center justify-between gap-3 px-3.5 py-3 sm:px-5 sm:py-3.5">
              {/* LEFT: Accent Bar + Title & Story Count */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Warm Gold/Amber Accent Bar */}
                <div className="w-[3px] self-stretch min-h-[32px] rounded-full bg-gradient-to-b from-[#e8c9a0] via-[#c4956a] to-[#8b6a4a] shrink-0 opacity-90" />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] sm:text-base font-semibold text-[#f5f0ea] tracking-tight truncate leading-tight">
                      {hasFilter
                        ? search
                          ? `"${search}"`
                          : CATEGORIES[category]?.label || "Filtered"
                        : "All Stories"}
                    </h2>

                    {/* Compact Story Count Badge */}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#c4956a]/15 border border-[#c4956a]/25 text-[11px] font-semibold text-[#e5c3a6] tabular-nums shrink-0">
                      {loading ? "..." : formatCount(totalStories)}
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-[12px] text-[#a89f96] mt-0.5 truncate leading-none">
                    {hasFilter ? "Filtered view" : "Community Stories"}
                  </p>
                </div>
              </div>

              {/* RIGHT: Clear Button + Sort Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                {hasFilter && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-8 sm:h-9 px-3 rounded-full text-[11px] sm:text-[12px] font-medium text-[#c4956a] bg-white/[0.05] hover:bg-white/[0.1] border border-[#c4956a]/30 transition-colors active:scale-95"
                  >
                    Clear
                  </button>
                )}

                {/* Minimal Glass Sort Select */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-8 sm:h-9 appearance-none rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-[11px] sm:text-[12px] font-medium text-[#f5f0ea] pl-3 pr-7 outline-none cursor-pointer transition-colors"
                  >
                    <option
                      value="best"
                      className="bg-[#121014] text-[#f5f0ea]"
                    >
                      Top rated
                    </option>
                    <option
                      value="newest"
                      className="bg-[#121014] text-[#f5f0ea]"
                    >
                      Newest
                    </option>
                    <option
                      value="oldest"
                      className="bg-[#121014] text-[#f5f0ea]"
                    >
                      Oldest
                    </option>
                  </select>

                  <svg
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a89f96]"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-2 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-black/5 dark:bg-white/5 transition-all">
              <div className="flex items-center gap-2.5 pt-2 sm:pt-0 pl-2 sm:pl-3">
                {/* Soft indicator dot instead of a harsh warning icon */}
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/80 shrink-0" />
                <p className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 leading-none mt-0.5">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={fetchStories}
                className="w-full sm:w-auto h-8 px-4 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-black/10 dark:hover:bg-white/20 transition-all active:scale-95"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {!error && loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="min-w-0">
                  <div className="aspect-[4/5] rounded-[16px] bg-neutral-200/60 animate-pulse mb-2.5" />
                  <div className="h-3.5 w-3/4 rounded bg-neutral-200/60 animate-pulse mb-1.5" />
                  <div className="h-3 w-1/2 rounded bg-neutral-200/60 animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!error && !loading && stories.length === 0 && (
            <PremiumEmptyState
              search={search}
              category={category}
              onClear={clearFilters}
            />
          )}

          {/* Stories Grid */}
          {!error && !loading && stories.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10">
                {stories.map((story) => (
                  <PremiumStoryCard key={story._id} story={story} />
                ))}
              </div>

              <div className="mt-10 sm:mt-12">
                <PremiumPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </section>
      </main>

      {/* ══════════ MOBILE BOTTOM NAV ══════════ */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
          {/* Soft top fade so content doesn’t collide with the bar */}
          <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-black/[0.04] to-transparent" />

          <div className="bg-[#fffdf9]/92 backdrop-blur-xl border-t border-stone-200/80 pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-md mx-auto px-2">
              <div className="grid grid-cols-5 items-end h-[64px]">
                {/* Home */}
                <Link
                  to="/"
                  className="relative flex flex-col items-center justify-center gap-0.5 py-2 text-[#1a1520]"
                  aria-label="Home"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-[10px] font-semibold tracking-wide">
                    Home
                  </span>
                  <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-amber-600" />
                </Link>

                {/* Messages */}
                <Link
                  to="/chat"
                  className="relative flex flex-col items-center justify-center gap-0.5 py-2 text-stone-400 hover:text-[#1a1520] transition-colors"
                  aria-label="Messages"
                >
                  <span className="relative">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H9.2L5 19.2V7.5z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {unreadMsg > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-600 text-white text-[9px] font-bold leading-4 text-center ring-2 ring-[#fffdf9]">
                        {unreadMsg > 99 ? "99+" : unreadMsg}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium tracking-wide">
                    Chat
                  </span>
                </Link>

                {/* Write — center elevated */}
                <div className="relative flex justify-center">
                  <Link
                    to="/write"
                    className="absolute -top-5 flex items-center justify-center w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#1a1520] via-[#2a2230] to-[#1a1520] text-[#f5f0ea] shadow-[0_10px_24px_-8px_rgba(26,21,32,0.55)] ring-4 ring-[#fffdf9] hover:scale-[1.04] active:scale-95 transition-transform"
                    aria-label="Write a story"
                  >
                    {/* warm edge light */}
                    <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/25 via-transparent to-violet-400/20" />
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="relative"
                      aria-hidden
                    >
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Link>
                </div>

                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative flex flex-col items-center justify-center gap-0.5 py-2 text-stone-400 hover:text-[#1a1520] transition-colors"
                  aria-label="Notifications"
                >
                  <span className="relative">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 20a2 2 0 0 0 4 0"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    {unreadNotif > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold leading-4 text-center ring-2 ring-[#fffdf9]">
                        {unreadNotif > 99 ? "99+" : unreadNotif}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium tracking-wide">
                    Alerts
                  </span>
                </Link>

                {/* Profile */}
                <Link
                  to={`/profile/${user.username}`}
                  className="flex flex-col items-center justify-center gap-0.5 py-2 text-stone-400 hover:text-[#1a1520] transition-colors"
                  aria-label="Profile"
                >
                  <span className="rounded-full p-[1.5px] bg-gradient-to-br from-stone-200 to-stone-300">
                    <Avatar
                      src={user.image?.url}
                      alt={user.username}
                      size={22}
                    />
                  </span>
                  <span className="text-[10px] font-medium tracking-wide">
                    Me
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* ══════════ MOBILE ACCOUNT DRAWER ══════════ */}
      {mobileMenuOpen && user && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#1a1520]/40 backdrop-blur-[6px] animate-drawerFade"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-[min(100%,300px)] bg-[#fffdf9] shadow-2xl flex flex-col animate-drawerSlide">
            {/* Header */}
            <div className="relative px-5 pt-5 pb-4 border-b border-stone-200/70">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-50/80 to-transparent pointer-events-none" />
              <div className="relative flex items-start justify-between gap-3">
                <Link
                  to={`/profile/${user.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <div className="rounded-full p-[2px] bg-gradient-to-br from-amber-300 via-amber-100 to-violet-300 shrink-0">
                    <div className="rounded-full p-[2px] bg-white">
                      <Avatar
                        src={user.image?.url}
                        alt={user.username}
                        size={48}
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1a1520] truncate leading-tight">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-stone-500 truncate mt-0.5">
                      @{user.username}
                    </p>
                    <p className="text-[11px] font-medium text-amber-800/80 mt-1">
                      View profile
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-[#1a1520] hover:bg-stone-100 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Secondary links only — no Home / Chat / Notifications */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-stone-400">
                Account
              </p>

              <div className="space-y-0.5">
                {[
                  {
                    to: `/profile/${user.username}`,
                    label: "Your profile",
                    hint: "Stories & followers",
                  },
                  {
                    to: "/write",
                    label: "Write a story",
                    hint: "New entry",
                  },
                  {
                    to: "/settings",
                    label: "Settings",
                    hint: "Preferences",
                  },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-[#1a1520] hover:bg-amber-50/70 active:bg-amber-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {item.hint}
                      </p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-stone-300 shrink-0"
                      aria-hidden
                    >
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200/70 bg-white/80">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full h-11 rounded-full text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200/80 hover:text-[#1a1520] transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          <style>{`
      @keyframes drawerFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes drawerSlide {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      .animate-drawerFade { animation: drawerFade 0.2s ease-out; }
      .animate-drawerSlide { animation: drawerSlide 0.32s cubic-bezier(0.16, 1, 0.3, 1); }
    `}</style>
        </div>
      )}

      {/* ══════════ MOBILE SEARCH & DISCOVER OVERLAY ══════════ */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-[#FAFAFA] flex flex-col lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* 1. Header & Search Bar (Sticky with Frosted Glass) */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-black/[0.04] pt-safe z-10 shrink-0">
            <div className="flex items-center gap-2.5 p-4">
              {/* Back Button - Large tap target */}
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="w-11 h-11 flex items-center justify-center text-neutral-600 active:bg-neutral-100 rounded-full shrink-0 transition-colors focus:outline-none"
                aria-label="Close search"
              >
                <i className="ri-arrow-left-line text-2xl" />
              </button>

              {/* Search Input Box */}
              <div className="relative flex-1 group">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-lg group-focus-within:text-neutral-900 transition-colors" />
                <input
                  type="text"
                  placeholder="Search stories or writers..."
                  autoFocus
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-11 pl-11 pr-12 bg-neutral-100/80 rounded-full text-[15px] font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:bg-white focus:ring-2 focus:ring-neutral-900/10 transition-all border border-transparent shadow-inner"
                />

                {/* Clear Button */}
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-neutral-200/80 hover:bg-neutral-300 text-neutral-600 rounded-full active:scale-90 transition-all"
                  >
                    <i className="ri-close-line text-base font-bold" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Filter Categories (Premium Pill Design) */}
            <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar ">
              <button
                onClick={() => setCategory("")}
                className={`shrink-0 snap-start px-5 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
                  category === ""
                    ? "bg-neutral-900 text-white shadow-md shadow-neutral-900/20"
                    : "bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50"
                }`}
              >
                All
              </button>
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const isActive = category === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(isActive ? "" : key)}
                    className={`shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-md shadow-neutral-900/20"
                        : "bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50"
                    }`}
                  >
                    <i
                      className={`${cat.icon} text-[14px] ${isActive ? "text-white/80" : "text-neutral-400"}`}
                    />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Scrollable Results Area */}
          <div className="flex-1 overflow-y-auto px-4 pt-5 pb-safe-bottom bg-[#FAFAFA]">
            {/* Section Status Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-bold tracking-[0.08em] uppercase text-neutral-400">
                {search || category ? (
                  loading ? (
                    "Searching..."
                  ) : (
                    `${stories.length} Results`
                  )
                ) : (
                  <span className="flex items-center gap-1.5">
                    <i className="ri-fire-fill text-orange-500 text-sm" />{" "}
                    Trending Now
                  </span>
                )}
              </h3>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] bg-neutral-200/50 rounded-[20px] animate-pulse"
                  />
                ))}
              </div>
            ) : search || category ? (
              stories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {stories.map((s) => (
                    <div key={s._id} onClick={() => setMobileSearchOpen(false)}>
                      <PremiumStoryCard story={s} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-10">
                  <PremiumEmptyState
                    search={search}
                    category={category}
                    onClear={clearFilters}
                  />
                </div>
              )
            ) : (
              /* Default / Trending View */
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-10">
                {trendingStories.slice(0, 10).map((s) => (
                  <div key={s._id} onClick={() => setMobileSearchOpen(false)}>
                    <PremiumStoryCard story={s} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
