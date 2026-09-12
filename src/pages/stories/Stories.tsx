import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import api from "../../services/api";
import moment from "moment";
import DiaryLogo from "../../components/DiaryLogo";

/* ──────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────── */
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

interface CategoryConfig {
  label: string;
  icon: string;
  image: string;
  color: string;
  description?: string;
  gradient?: string;
}

/* ──────────────────────────────────────────────
   CONSTANTS
   ────────────────────────────────────────────── */
const CATEGORIES: Record<string, CategoryConfig> = {
  fantasy: {
    label: "Fantasy",
    icon: "ri-magic-line",
    image:
      "https://i.pinimg.com/1200x/12/a6/bb/12a6bb431be19d279d71565b093ccc18.jpg",
    color: "from-purple-900/80 to-purple-500/40",
  },
  "random-thoughts": {
    label: "Thoughts",
    icon: "ri-bubble-chart-line",
    image:
      "https://i.pinimg.com/736x/10/49/b9/1049b9a6330162cef9be352d8040b68e.jpg",
    color: "from-amber-900/80 to-amber-500/40",
  },
  poetry: {
    label: "Poetry",
    icon: "ri-quill-pen-line",
    image:
      "https://i.pinimg.com/1200x/0b/f0/da/0bf0dabee8e3126c0a7b831fee2d4881.jpg",
    color: "from-rose-900/80 to-rose-500/40",
  },
  letter: {
    label: "Letters",
    icon: "ri-mail-send-line",
    image:
      "https://i.pinimg.com/736x/a4/84/1a/a4841adebd96ea5b0392f108b71c07d0.jpg",
    color: "from-blue-900/80 to-blue-500/40",
  },
  mystery: {
    label: "Mystery",
    icon: "ri-search-eye-line",
    image:
      "https://i.pinimg.com/1200x/cc/08/55/cc08551884c332df2b9fae31b719e261.jpg",
    color: "from-slate-900/90 to-slate-600/50",
  },
  adventure: {
    label: "Adventure",
    icon: "ri-compass-3-line",
    image:
      "https://i.pinimg.com/736x/d1/9f/50/d19f5015be54cc5c8b45f1399774dae1.jpg",
    color: "from-emerald-900/80 to-emerald-500/40",
  },
  historical: {
    label: "Historical",
    icon: "ri-hourglass-2-line",
    image:
      "https://i.pinimg.com/736x/f1/a6/a6/f1a6a6d1aaa13d6f6782cece659c9468.jpg",
    color: "from-orange-900/80 to-orange-600/40",
  },
  fiction: {
    label: "Fiction",
    icon: "ri-book-open-line",
    image:
      "https://i.pinimg.com/736x/8d/b3/53/8db3530c7573c623019007da057e3df1.jpg",
    color: "from-indigo-900/80 to-indigo-500/40",
  },
};

const STORIES_PER_PAGE = 12;

const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100";

/* ──────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────── */
const formatCount = (n: number): string =>
  n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);

const getLikesCount = (story: Story): number => {
  if (typeof story.likesCounts === "number") return story.likesCounts;
  if (Array.isArray(story.likedBy)) return story.likedBy.length;
  return 0;
};

const getViewsCount = (story: Story): number =>
  Array.isArray(story.views) ? story.views.length : 0;

const getTimeAgo = (timestamp: string, short = false): string => {
  const m = moment(timestamp);
  const sec = moment().diff(m, "seconds");
  if (sec < 60) return short ? `${Math.max(1, sec)}s` : `${Math.max(1, sec)}s ago`;
  const min = moment().diff(m, "minutes");
  if (min < 60) return short ? `${min}m` : `${min}m ago`;
  const hr = moment().diff(m, "hours");
  if (hr < 24) return short ? `${hr}h` : `${hr}h ago`;
  const day = moment().diff(m, "days");
  if (day < 30) return short ? `${day}d` : `${day}d ago`;
  const mo = moment().diff(m, "months");
  if (mo < 12) return short ? `${mo}mo` : `${mo}mo ago`;
  return short ? `${moment().diff(m, "years")}y` : `${moment().diff(m, "years")}y ago`;
};

/* ──────────────────────────────────────────────
   ATOMS
   ────────────────────────────────────────────── */
interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
  ring?: boolean;
  className?: string;
}

function Avatar({ src, alt, size = 32, ring = false, className = "" }: AvatarProps) {
  return (
    <img
      src={src || AVATAR_FALLBACK}
      alt={alt}
      className={`rounded-full object-cover bg-gray-100 flex-shrink-0 ${
        ring ? "ring-2 ring-white/30" : ""
      } ${className}`}
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

/* ──────────────────────────────────────────────
   HERO CAROUSEL — Featured stories at top of page
   ────────────────────────────────────────────── */
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
  const cat = CATEGORIES[story.category] || CATEGORIES.fiction;
  const likes = getLikesCount(story);
  const views = getViewsCount(story);
  const timeAgo = getTimeAgo(story.timeStamp);

  return (
    <section className="relative w-full overflow-hidden rounded-2xl sm:rounded-[28px] bg-neutral-950 mb-5 sm:mb-6">
      <div className="relative h-[240px] xs:h-[260px] sm:h-[340px] md:h-[400px] lg:h-[440px]">
        {/* Background image or gradient */}
        {story.image?.url ? (
          <img
            key={story._id}
            src={story.image.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover animate-heroFade"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${cat.color}`} />
        )}

        {/* Dark overlays for text legibility */}
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

          {/* Title */}
          <h1
            className="text-white font-semibold tracking-tight leading-[1.15] mb-2 sm:mb-3 line-clamp-2"
            style={{
              fontSize: "clamp(1.25rem, 4.2vw, 2.75rem)",
              letterSpacing: "-0.02em",
            }}
          >
            {story.title}
          </h1>

          {/* Author + stats row */}
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

          {/* CTA + carousel dots */}
          <div className="flex items-center justify-between gap-3">
            <Link
              to={`/stories/${story._id}`}
              className="inline-flex items-center gap-1.5 bg-white text-neutral-900 text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              Read story
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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

/* ──────────────────────────────────────────────
   WRITE CARD — Primary CTA banner
   ────────────────────────────────────────────── */
function PremiumWriteCard() {
  return (
    <Link
      to="/write"
      className="group relative block w-full overflow-hidden rounded-2xl sm:rounded-[24px] mb-6 sm:mb-8"
    >
      {/* Layered background: base + radial washes + hairline accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020826] via-[#00145a] to-[#01061c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,92,0,0.35),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,212,255,0.22),_transparent_50%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF7A00]/60 to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#FF5C00]/12 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3 sm:gap-5 px-4 py-3.5 sm:px-7 sm:py-5">
        {/* Accent bar */}
        <div className="w-[3px] self-stretch min-h-[40px] rounded-full bg-gradient-to-b from-[#FF9E00] via-[#FF0055] to-[#00D4FF] opacity-95 shrink-0" />

        {/* Text block */}
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

        {/* CTA pill */}
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

/* ──────────────────────────────────────────────
   CATEGORY SELECTOR — Horizontal scrollable card row
   ────────────────────────────────────────────── */
interface CategoryCardsProps {
  active: string;
  onSelect: (c: string) => void;
  categories?: Record<string, CategoryConfig>;
}

function CategoryCardsWithImages({
  active,
  onSelect,
  categories = CATEGORIES,
}: CategoryCardsProps) {
  return (
    <section className="mb-7 sm:mb-10">
      {/* Section header */}
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

      {/* Scrollable card deck */}
      <div className="flex gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
        {/* "All" trigger */}
        <button
          onClick={() => onSelect("")}
          type="button"
          className={`snap-start shrink-0 relative h-[82px] sm:h-[94px] w-[82px] sm:w-[100px] rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.97] border ${
            !active
              ? "border-neutral-900 bg-neutral-900 text-white shadow-lg shadow-neutral-900/15 ring-2 ring-neutral-900/10"
              : "border-neutral-200/80 bg-neutral-100 text-neutral-700 hover:bg-neutral-200/60"
          }`}
        >
          {!active && (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-900 to-black opacity-90" />
          )}

          <div className="relative z-10 h-full flex flex-col items-center justify-center p-2 text-center">
            <span className="text-xs sm:text-sm font-bold tracking-tight">All</span>
            <span
              className={`text-[10px] mt-0.5 font-medium ${
                !active ? "text-neutral-400" : "text-neutral-500"
              }`}
            >
              Explore
            </span>
          </div>
        </button>

        {/* Category cards */}
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
              {/* Background image */}
              <img
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />

              {/* Scrim for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

              {/* Category color wash */}
              {cat.color && (
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-40 mix-blend-overlay`}
                />
              )}

              {/* Active checkmark */}
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-md">
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

              {/* Label */}
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

/* ──────────────────────────────────────────────
   WRITERS ROW — Suggested authors banners
   ────────────────────────────────────────────── */
function WritersSmallRow({ writers }: { writers: Writer[] }) {
  if (!writers.length) return null;

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
      {/* Section header */}
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

      {/* Writer banners */}
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {writers.slice(0, 8).map((writer, i) => (
          <Link
            key={writer._id}
            to={`/profile/${writer.username}`}
            className="group snap-start shrink-0 relative w-[220px] sm:w-[248px] h-[104px] sm:h-[112px] rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-200"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${gradients[i % gradients.length]}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />

            {/* Text side */}
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
                {formatCount(writer.storiesCount || 0)}{" "}
                <span className="font-normal text-white/65">Stories</span>
              </p>
            </div>

            {/* Photo side */}
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

/* ──────────────────────────────────────────────
   STORY CARD — Grid item
   ────────────────────────────────────────────── */
function PremiumStoryCard({ story }: { story: Story }) {
  const cat = CATEGORIES[story.category] || CATEGORIES.fiction;
  const likes = getLikesCount(story);
  const views = getViewsCount(story);
  const timeAgo = getTimeAgo(story.timeStamp, true);

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
          <div className={`absolute inset-0 bg-gradient-to-br ${cat.color}`} />
        )}

        {/* Bottom scrim */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none" />

        {/* Category chip */}
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

        {/* Author row */}
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

        {/* Stats row */}
        <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-neutral-400 tabular-nums">
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            {formatCount(views)}
          </span>

          <span className="text-neutral-300" aria-hidden>·</span>

          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
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

/* ──────────────────────────────────────────────
   EMPTY STATE — No results or empty feed
   ────────────────────────────────────────────── */
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
  let heading = "No stories yet";
  let subheading = "Be the first to write something worth remembering.";
  let badge = "Empty";

  if (search && category) {
    heading = "No stories found";
    subheading = `Nothing matched "${search}" in ${catLabel}.`;
    badge = "Filtered";
  } else if (search) {
    heading = "No stories found";
    subheading = `Nothing matched "${search}". Try another search.`;
    badge = "Search";
  } else if (category) {
    heading = `No ${catLabel} stories yet`;
    subheading = "Be the first to share a story in this collection.";
    badge = catLabel;
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-sm mx-auto select-none">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100/80 border border-stone-200/60 text-[10px] font-bold tracking-wider text-stone-500 uppercase mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        {badge}
      </span>

      <h3 className="text-base font-bold text-stone-900 tracking-tight mb-1">
        {heading}
      </h3>
      <p className="text-xs text-stone-500 font-medium max-w-[270px] leading-relaxed mb-5">
        {subheading}
      </p>

      <div className="flex items-center gap-2">
        {(search || category) && (
          <button
            type="button"
            onClick={onClear}
            className="h-8 px-3.5 rounded-full border border-stone-200/80 bg-white/80 hover:bg-stone-100 text-stone-700 text-xs font-semibold active:scale-95 transition-all shadow-xs"
          >
            Clear filters
          </button>
        )}
        <Link
          to="/write"
          className="h-8 px-4 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-semibold active:scale-95 transition-all inline-flex items-center gap-1.5 shadow-sm"
        >
          <span>Write story</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   PAGINATION
   ────────────────────────────────────────────── */
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
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center my-10 select-none"
    >
      <div className="inline-flex items-center gap-1.5 p-1.5 bg-white rounded-full border border-neutral-100 shadow-[0_12px_36px_rgba(0,0,0,0.07),0_2px_8px_rgba(0,0,0,0.03)]">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-800 hover:bg-black hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 px-1">
          {pages.map((item, i) =>
            item === "gap" ? (
              <span
                key={`gap-${i}`}
                className="w-7 h-10 flex items-center justify-center text-neutral-300 font-black text-[9px] tracking-widest"
              >
                •••
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`relative h-10 min-w-[40px] px-3.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
                  item === page
                    ? "bg-black text-white shadow-md shadow-black/15"
                    : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                }`}
              >
                {item}
                {item === page && (
                  <span className="absolute -top-0.5 right-0.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white" />
                )}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-800 hover:bg-black hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE — Stories
   ══════════════════════════════════════════════ */
export const Stories: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const exploreRef = useRef<HTMLDivElement>(null);

  // Featured content state
  const [trendingStories, setTrendingStories] = useState<Story[]>([]);
  const [topWriters, setTopWriters] = useState<Writer[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // Main feed state
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

  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("best");
  const [page, setPage] = useState(1);

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  /* Debounce search input */
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Reset page when category or sort changes */
  useEffect(() => {
    setPage(1);
  }, [category, sortBy]);

  /* Fetch unread counts */
  const checkBadges = useCallback(async () => {
    if (!user) return;
    try {
      const [nr, cr] = await Promise.all([
        api.get("/users/notifications/unread-count"),
        api.get("/chat/conversations"),
      ]);
      if (nr.data.success) setUnreadNotif(nr.data.unreadCount || 0);
      if (cr.data.success) {
        setUnreadMsg(
          cr.data.conversations.reduce(
            (a: number, c: { unreadCount?: number }) => a + (c.unreadCount || 0),
            0
          )
        );
      }
    } catch {
      // Silent fail — badges are non-critical
    }
  }, [user]);

  /* Fetch featured content (hero + writers) */
  const fetchSidebar = useCallback(async () => {
    try {
      setSidebarLoading(true);
      const res = await api.get("/stories", {
        params: { page: 1, limit: 12, sort: "best" },
      });
      if (res.data.success) {
        setTrendingStories(
          res.data.topFiveStories || res.data.trendingStories || []
        );
        if (res.data.topFiveWriters) setTopWriters(res.data.topFiveWriters);
      }
    } catch (err) {
      console.error("Sidebar fetch failed:", err);
    } finally {
      setSidebarLoading(false);
    }
  }, []);

  /* Fetch main paginated feed */
  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = {
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
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "We couldn't connect to the library. Please try again.";
      setError(message);
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

  /* Socket listeners for real-time badges */
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

  /* Derived values */
  const hasFilter = !!(category || search);
  const { totalStories, totalPages } = pagination;

  /* Handlers */
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

      {/* ══════════════════════════════════════════
          FLOATING HEADER
          ══════════════════════════════════════════ */}
      <div className="fixed top-0 inset-x-0 z-50 pt-3 sm:pt-4 px-3 sm:px-5 pointer-events-none select-none">
        <header className="pointer-events-auto max-w-6xl mx-auto h-14 sm:h-[64px] bg-white rounded-full sm:rounded-[24px] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-4">
          {/* Left: logo + tabs */}
          <div className="flex items-center gap-3 lg:gap-6 min-w-0 shrink-0">
            <Link
              to="/"
              className="flex items-center shrink-0 pl-1 hover:opacity-80 transition-opacity active:scale-95"
              aria-label="Home"
            >
              <DiaryLogo />
            </Link>

            {/* Desktop tabs */}
            <nav
              className="hidden lg:flex items-center bg-[#f4f5f7] p-1 rounded-full"
              aria-label="Primary"
            >
              <Link
                to="/"
                className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-colors ${
                  location.pathname === "/"
                    ? "text-white bg-[#111] shadow-sm"
                    : "text-[#888] hover:text-[#111]"
                }`}
              >
                Stories
              </Link>
              <Link
                to="/search"
                className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-colors ${
                  location.pathname.startsWith("/search")
                    ? "text-white bg-[#111] shadow-sm"
                    : "text-[#888] hover:text-[#111]"
                }`}
              >
                Writers
              </Link>
            </nav>
          </div>

          {/* Center: search (tablet+) */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-1 sm:mx-2">
            <div className="relative w-full flex items-center h-10 bg-[#f4f5f7] rounded-full border-2 border-transparent focus-within:border-[#111]/10 focus-within:bg-white transition-all duration-300">
              <svg
                className="absolute left-3.5 text-[#888] pointer-events-none"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>

              <input
                type="search"
                placeholder="Search stories..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-full pl-10 pr-10 bg-transparent text-[13px] font-semibold text-[#111] placeholder:text-[#aaa] outline-none"
                aria-label="Search stories"
              />

              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="absolute right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-[#e5e7eb] text-[#111] hover:bg-[#d1d5db] active:scale-90 transition-colors"
                  aria-label="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              ) : (
                <div className="absolute right-3 hidden xl:flex pointer-events-none">
                  <span className="text-[10px] font-bold text-[#aaa] bg-white px-1.5 py-0.5 rounded-md shadow-sm">
                    Cmd K
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile search trigger */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden w-10 h-10 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#111] active:scale-95 transition-transform"
              aria-label="Open search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>

            {!user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-[#111] text-white text-[13px] font-bold hover:bg-[#333] active:scale-95 transition-all shadow-[0_6px_16px_rgba(0,0,0,0.12)] whitespace-nowrap"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <>
                {/* Messages */}
                <Link
                  to="/chat"
                  className="relative hidden sm:flex w-10 h-10 rounded-full bg-[#f4f5f7] items-center justify-center text-[#111] hover:bg-[#e8e9eb] active:scale-95 transition-all"
                  aria-label="Messages"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H9.2L5 19.2V7.5z"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <NotificationBadge count={unreadMsg} />
                </Link>

                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative hidden sm:flex w-10 h-10 rounded-full bg-[#f4f5f7] items-center justify-center text-[#111] hover:bg-[#e8e9eb] active:scale-95 transition-all"
                  aria-label="Notifications"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 20a2 2 0 0 0 4 0"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                    />
                  </svg>
                  <NotificationBadge count={unreadNotif} />
                </Link>

                {/* Write button */}
                <Link
                  to="/write"
                  className="hidden md:inline-flex items-center h-10 gap-1.5 px-4 sm:px-5 rounded-full bg-[#111] text-white text-[13px] font-bold hover:bg-[#333] active:scale-95 transition-all shadow-[0_6px_16px_rgba(0,0,0,0.14)]"
                >
                  Write
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </Link>

                <div className="hidden lg:block w-px h-5 bg-[#e8e8e8] mx-1" aria-hidden />

                {/* Desktop profile dropdown */}
                <div className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="flex items-center rounded-full ring-2 ring-transparent hover:ring-[#f0f0f0] active:scale-95 transition-all focus:outline-none focus-visible:ring-[#111]/20"
                    aria-label="Open profile menu"
                    aria-expanded={profileOpen}
                  >
                    <Avatar
                      src={user.image?.url}
                      alt={user.username || "User"}
                      size={36}
                      className="rounded-full object-cover"
                    />
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        aria-hidden
                        onClick={() => setProfileOpen(false)}
                      />
                      <div
                        className="absolute right-0 mt-3 z-20 w-56 bg-white rounded-[20px] border border-[#f0f0f0] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.14)] p-1.5"
                        role="menu"
                      >
                        <div className="px-3.5 py-2.5 bg-[#f6f7f9] rounded-[14px] mb-1">
                          <p className="text-[14px] font-bold text-[#111] truncate">
                            {user.name || user.username}
                          </p>
                          <p className="text-[12px] font-semibold text-[#888] truncate mt-0.5">
                            @{user.username}
                          </p>
                        </div>

                        <Link
                          to={`/profile/${user.username}`}
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center px-3.5 py-2.5 rounded-[12px] text-[13px] font-bold text-[#555] hover:text-[#111] hover:bg-[#f4f5f7] transition-colors"
                        >
                          Profile
                        </Link>

                        <Link
                          to="/settings"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center px-3.5 py-2.5 rounded-[12px] text-[13px] font-bold text-[#555] hover:text-[#111] hover:bg-[#f4f5f7] transition-colors"
                        >
                          Settings
                        </Link>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left flex items-center px-3.5 py-2.5 rounded-[12px] text-[13px] font-bold text-[#e5484d] hover:bg-[#fff1f0] transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile menu trigger */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  aria-label="Open menu"
                >
                  <Avatar
                    src={user.image?.url}
                    alt={user.username || "User"}
                    size={36}
                    className="rounded-full object-cover"
                  />
                </button>
              </>
            )}
          </div>
        </header>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[76px] sm:h-[88px] shrink-0" aria-hidden />

      {/* ══════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-32 selection:bg-neutral-200">
        {/* Top layout — only when no filter active */}
        {!hasFilter && (
          <div className="flex flex-col gap-10 sm:gap-14 mb-10 sm:mb-16">
            {sidebarLoading ? (
              <div className="w-full rounded-[20px] sm:rounded-[28px] bg-neutral-100 animate-pulse aspect-[4/3] sm:aspect-[21/9]" />
            ) : trendingStories.length > 0 ? (
              <TopHeroSection stories={trendingStories} />
            ) : null}

            <PremiumWriteCard />

            {!sidebarLoading && topWriters.length > 0 && (
              <WritersSmallRow writers={topWriters} />
            )}

            <CategoryCardsWithImages
              active={category}
              onSelect={handleCategorySelect}
            />
          </div>
        )}

        {/* Feed section */}
        <section
          ref={exploreRef}
          className={`scroll-mt-28 ${!hasFilter ? "mt-2" : ""}`}
        >
          {/* Feed control card */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-[20px] mb-6 sm:mb-8 border border-white/[0.06] shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#18161a] via-[#121014] to-[#0c0b0e]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(196,149,106,0.18),_transparent_55%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(140,110,80,0.12),_transparent_50%)] pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c4956a]/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            <div className="relative z-10 flex items-center justify-between gap-3 px-3.5 py-3 sm:px-5 sm:py-3.5">
              {/* Left: title + count */}
              <div className="flex items-center gap-3 min-w-0">
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

                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#c4956a]/15 border border-[#c4956a]/25 text-[11px] font-semibold text-[#e5c3a6] tabular-nums shrink-0">
                      {loading ? "..." : formatCount(totalStories)}
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-[12px] text-[#a89f96] mt-0.5 truncate leading-none">
                    {hasFilter ? "Filtered view" : "Community Stories"}
                  </p>
                </div>
              </div>

              {/* Right: clear + sort */}
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

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-8 sm:h-9 appearance-none rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-[11px] sm:text-[12px] font-medium text-[#f5f0ea] pl-3 pr-7 outline-none cursor-pointer transition-colors"
                  >
                    <option value="best" className="bg-[#121014] text-[#f5f0ea]">Top rated</option>
                    <option value="newest" className="bg-[#121014] text-[#f5f0ea]">Newest</option>
                    <option value="oldest" className="bg-[#121014] text-[#f5f0ea]">Oldest</option>
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

          {/* Error state */}
          {error && (
            <div className="mb-6 p-2 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-black/5 transition-all">
              <div className="flex items-center gap-2.5 pt-2 sm:pt-0 pl-2 sm:pl-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/80 shrink-0" />
                <p className="text-[13px] font-medium text-neutral-600 leading-none mt-0.5">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={fetchStories}
                className="w-full sm:w-auto h-8 px-4 rounded-full bg-black/5 text-neutral-700 text-xs font-semibold hover:bg-black/10 transition-all active:scale-95"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading skeletons */}
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

          {/* Empty state */}
          {!error && !loading && stories.length === 0 && (
            <PremiumEmptyState
              search={search}
              category={category}
              onClear={clearFilters}
            />
          )}

          {/* Story grid */}
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

      {/* ══════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION
          ══════════════════════════════════════════ */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 select-none pointer-events-none">
          <div
            className="pointer-events-auto px-4"
            style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
          >
            <div className="max-w-md mx-auto">
              <div className="relative bg-white/95 backdrop-blur-xl rounded-[32px] border border-[#efeef3] shadow-[0_12px_40px_rgba(45,40,70,0.10),0_4px_12px_rgba(45,40,70,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="grid grid-cols-5 items-center gap-0.5 h-[68px] px-2">
                  {/* Writers */}
                  <Link
                    to="/"
                    className="group flex flex-col items-center justify-center gap-1 h-[56px] rounded-[22px] active:scale-[0.96] transition-all duration-200"
                    aria-label="Writers"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-[16px] bg-[#f4f2f8] text-[#2d2838] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] group-hover:bg-[#eeeaf6] transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <circle cx="10" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                        <path
                          d="M16 4.5a3.5 3.5 0 0 1 0 6.8M20 19.5v-1a4.5 4.5 0 0 0-3-4.25"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <span className="text-[9px] font-semibold tracking-wide text-[#2d2838]">Writers</span>
                  </Link>

                  {/* Chat */}
                  <Link
                    to="/chat"
                    className="group flex flex-col items-center justify-center gap-1 h-[56px] rounded-[22px] active:scale-[0.96] transition-all duration-200"
                    aria-label="Messages"
                  >
                    <span className="relative flex items-center justify-center w-10 h-10 rounded-[16px] text-[#9b95a8] group-hover:bg-[#f4f2f8] group-hover:text-[#2d2838] transition-all">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H9.2L5 19.2V7.5z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {unreadMsg > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#f0b45a] text-white text-[8px] font-bold leading-4 text-center ring-[2.5px] ring-white shadow-[0_2px_6px_rgba(240,180,90,0.35)]">
                          {unreadMsg > 99 ? "99+" : unreadMsg}
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] font-medium tracking-wide text-[#9b95a8] group-hover:text-[#2d2838] transition-colors">
                      Chat
                    </span>
                  </Link>

                  {/* Write (center CTA) */}
                  <div className="relative flex justify-center items-center h-full">
                    <Link
                      to="/write"
                      className="absolute -top-5 flex items-center justify-center w-[52px] h-[52px] rounded-[20px] bg-[#2d2838] text-white shadow-[0_12px_28px_rgba(45,40,56,0.32),0_4px_10px_rgba(45,40,56,0.18)] ring-[4px] ring-white hover:scale-[1.04] active:scale-[0.95] transition-transform duration-200"
                      aria-label="Write a story"
                    >
                      <span className="absolute inset-0 rounded-[20px] bg-gradient-to-tr from-white/15 via-transparent to-transparent pointer-events-none" />
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="relative" aria-hidden>
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                      </svg>
                    </Link>
                  </div>

                  {/* Alerts */}
                  <Link
                    to="/notifications"
                    className="group flex flex-col items-center justify-center gap-1 h-[56px] rounded-[22px] active:scale-[0.96] transition-all duration-200"
                    aria-label="Notifications"
                  >
                    <span className="relative flex items-center justify-center w-10 h-10 rounded-[16px] text-[#9b95a8] group-hover:bg-[#f4f2f8] group-hover:text-[#2d2838] transition-all">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ef8a8a] text-white text-[8px] font-bold leading-4 text-center ring-[2.5px] ring-white shadow-[0_2px_6px_rgba(239,138,138,0.35)]">
                          {unreadNotif > 99 ? "99+" : unreadNotif}
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] font-medium tracking-wide text-[#9b95a8] group-hover:text-[#2d2838] transition-colors">
                      Alerts
                    </span>
                  </Link>

                  {/* Me */}
                  <Link
                    to={`/profile/${user.username}`}
                    className="group flex flex-col items-center justify-center gap-1 h-[56px] rounded-[22px] active:scale-[0.96] transition-all duration-200"
                    aria-label="Profile"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-[16px] overflow-hidden bg-[#f4f2f8] ring-[1.5px] ring-[#ebe7f2] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <Avatar
                        src={user.image?.url}
                        alt={user.username}
                        size={40}
                        className="rounded-[16px] object-cover w-full h-full"
                      />
                    </span>
                    <span className="text-[9px] font-medium tracking-wide text-[#9b95a8] group-hover:text-[#2d2838] transition-colors">
                      Me
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* ══════════════════════════════════════════
          MOBILE ACCOUNT DRAWER
          ══════════════════════════════════════════ */}
      {mobileMenuOpen && user && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#1a1520]/40 backdrop-blur-[6px] animate-drawerFade"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="absolute right-0 top-0 bottom-0 w-[min(100%,300px)] bg-[#fffdf9] shadow-2xl flex flex-col animate-drawerSlide">
            {/* Drawer header */}
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

            {/* Drawer links */}
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
                      <p className="text-sm font-semibold leading-tight">{item.label}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">{item.hint}</p>
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

            {/* Drawer footer */}
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

      {/* ══════════════════════════════════════════
          MOBILE SEARCH OVERLAY
          ══════════════════════════════════════════ */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-[#FAFAFA] flex flex-col lg:hidden">
          {/* Sticky header */}
          <div
            className="shrink-0 bg-white/90 backdrop-blur-2xl border-b border-black/[0.04] z-10"
            style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
          >
            <div className="flex items-center gap-2 px-3 pb-3">
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 active:scale-90 transition-all shrink-0"
                aria-label="Close search"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>

                <input
                  type="search"
                  placeholder="Search stories or writers..."
                  autoFocus
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-full bg-neutral-100 text-[15px] font-medium text-neutral-900 placeholder:text-neutral-400 outline-none border-2 border-transparent focus:bg-white focus:border-neutral-900/10 transition-all"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-200/90 text-neutral-600 flex items-center justify-center active:scale-90 transition-all"
                    aria-label="Clear search"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category filter pills */}
            <div className="px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setCategory("")}
                className={`shrink-0 h-9 px-4 rounded-full text-[13px] font-bold transition-all active:scale-95 ${
                  category === ""
                    ? "bg-black text-white shadow-md shadow-black/15"
                    : "bg-white text-neutral-600 border border-neutral-200/80"
                }`}
              >
                All
              </button>

              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const isActive = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(isActive ? "" : key)}
                    className={`shrink-0 h-9 px-3.5 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 ${
                      isActive
                        ? "bg-black text-white shadow-md shadow-black/15"
                        : "bg-white text-neutral-600 border border-neutral-200/80"
                    }`}
                  >
                    {cat.icon && (
                      <i
                        className={`${cat.icon} text-[13px] ${
                          isActive ? "text-white/80" : "text-neutral-400"
                        }`}
                      />
                    )}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results area */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-3 pt-4 bg-[#FAFAFA]"
            style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[11px] font-bold tracking-[0.1em] uppercase text-neutral-400 flex items-center gap-1.5">
                {search || category ? (
                  loading ? (
                    "Searching…"
                  ) : (
                    `${stories.length} result${stories.length === 1 ? "" : "s"}`
                  )
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Trending now
                  </>
                )}
              </h3>

              {(search || category) && !loading && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[12px] font-bold text-neutral-500 hover:text-neutral-900 active:scale-95 transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] rounded-[20px] bg-neutral-200/60 animate-pulse"
                  />
                ))}
              </div>
            ) : search || category ? (
              stories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {stories.map((s) => (
                    <div key={s._id} onClick={() => setMobileSearchOpen(false)}>
                      <PremiumStoryCard story={s} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-6">
                  <PremiumEmptyState
                    search={search}
                    category={category}
                    onClear={clearFilters}
                  />
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 gap-3">
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

export default Stories;