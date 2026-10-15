import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";

import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import moment from "moment";
import { Avatar } from "../../components/navigation/Avatar";

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
    description: "Magic, wonder & distant realms",
  },
  "random-thoughts": {
    label: "Thoughts",
    icon: "ri-bubble-chart-line",
    image:
      "https://i.pinimg.com/736x/10/49/b9/1049b9a6330162cef9be352d8040b68e.jpg",
    color: "from-amber-900/80 to-amber-500/40",
    description: "Late night reflections & musings",
  },
  poetry: {
    label: "Poetry",
    icon: "ri-quill-pen-line",
    image:
      "https://i.pinimg.com/1200x/0b/f0/da/0bf0dabee8e3126c0a7b831fee2d4881.jpg",
    color: "from-rose-900/80 to-rose-500/40",
    description: "Verses that linger in the heart",
  },
  letter: {
    label: "Letters",
    icon: "ri-mail-send-line",
    image:
      "https://i.pinimg.com/736x/a4/84/1a/a4841adebd96ea5b0392f108b71c07d0.jpg",
    color: "from-blue-900/80 to-blue-500/40",
    description: "Unsent words and quiet truths",
  },
  mystery: {
    label: "Mystery",
    icon: "ri-search-eye-line",
    image:
      "https://i.pinimg.com/1200x/cc/08/55/cc08551884c332df2b9fae31b719e261.jpg",
    color: "from-slate-900/90 to-slate-600/50",
    description: "Shadows, riddles & forgotten secrets",
  },
  adventure: {
    label: "Adventure",
    icon: "ri-compass-3-line",
    image:
      "https://i.pinimg.com/736x/d1/9f/50/d19f5015be54cc5c8b45f1399774dae1.jpg",
    color: "from-emerald-900/80 to-emerald-500/40",
    description: "Journeys across uncharted paths",
  },
  historical: {
    label: "Historical",
    icon: "ri-hourglass-2-line",
    image:
      "https://i.pinimg.com/736x/f1/a6/a6/f1a6a6d1aaa13d6f6782cece659c9468.jpg",
    color: "from-orange-900/80 to-orange-600/40",
    description: "Echoes of times long passed",
  },
  fiction: {
    label: "Fiction",
    icon: "ri-book-open-line",
    image:
      "https://i.pinimg.com/736x/8d/b3/53/8db3530c7573c623019007da057e3df1.jpg",
    color: "from-indigo-900/80 to-indigo-500/40",
    description: "Stories shaped by imagination",
  },
};

const STORIES_PER_PAGE = 12;

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

const getTimeAgo = (dateStr: string, compact = false): string => {
  const m = moment(dateStr);
  const now = moment();
  const diffSec = now.diff(m, "seconds");

  if (compact) {
    if (diffSec < 60) return `${Math.max(1, diffSec)}s`;
    const diffMin = now.diff(m, "minutes");
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = now.diff(m, "hours");
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = now.diff(m, "days");
    if (diffDay < 30) return `${diffDay}d`;
    const diffMo = now.diff(m, "months");
    if (diffMo < 12) return `${diffMo}mo`;
    return `${now.diff(m, "years")}y`;
  }

  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = now.diff(m, "minutes");
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = now.diff(m, "hours");
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = now.diff(m, "days");
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = now.diff(m, "months");
  if (diffMo < 12) return `${diffMo}mo ago`;
  return `${now.diff(m, "years")}y ago`;
};

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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
              aria-hidden="true"
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
            className="shrink-0 text-xs font-semibold text-neutral-600 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer"
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
          className={`snap-start shrink-0 relative h-[82px] sm:h-[94px] w-[82px] sm:w-[100px] rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.97] border cursor-pointer ${
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
              className={`group snap-start shrink-0 relative h-[82px] sm:h-[94px] w-[124px] sm:w-[148px] rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.97] border cursor-pointer ${
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
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
            Top voices
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">
            Writers shaping the conversation today
          </p>
        </div>

        <Link
          to="/search"
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 inline-flex items-center gap-1 active:scale-95 transition-all"
        >
          <span>Find writers</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-1 snap-mandatory">
        {writers.map((writer, i) => (
          <Link
            key={writer._id}
            to={`/profile/${writer.username}`}
            className="group snap-start shrink-0 relative h-[88px] sm:h-[96px] w-[220px] sm:w-[240px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${
                gradients[i % gradients.length]
              } opacity-90 group-hover:opacity-100 transition-opacity`}
            />

            {/* Content layout */}
            <div className="relative z-10 h-full flex flex-col justify-between p-3.5 pr-[88px] sm:pr-[96px]">
              <div>
                <p className="text-white text-xs sm:text-[13px] font-bold tracking-tight truncate drop-shadow-sm">
                  {writer.name || writer.username}
                </p>
                <p className="text-white/70 text-[10px] sm:text-[11px] truncate mt-0.5">
                  @{writer.username}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-white/80 font-medium">
                <span>{writer.storiesCount || 0} stories</span>
                <span className="text-white/40">·</span>
                <span>{formatCount(writer.followers?.length || 0)} followers</span>
              </div>
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

          <span className="text-neutral-300" aria-hidden="true">·</span>

          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            className="h-8 px-3.5 rounded-full border border-stone-200/80 bg-white/80 hover:bg-stone-100 text-stone-700 text-xs font-semibold active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Clear filters
          </button>
        )}
        <Link
          to="/write"
          className="h-8 px-4 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-semibold active:scale-95 transition-all inline-flex items-center gap-1.5 shadow-sm"
        >
          <span>Write story</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-800 hover:bg-black hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all duration-200 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                className={`relative h-10 min-w-[40px] px-3.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
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
          className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-800 hover:bg-black hover:text-white disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all duration-200 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Filter state synchronized with URL search params
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [category, setCategory] = useState(() => searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState("best");
  const [page, setPage] = useState(1);

  // Keep state in sync with URL changes
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") || "";
    setSearch(urlSearch);
    setCategory(urlCategory);
    setPage(1);
  }, [searchParams]);

  /* Reset page when category or sort changes */
  useEffect(() => {
    setPage(1);
  }, [category, sortBy]);

  /* Fetch featured content (hero + writers) */
  const fetchSidebar = useCallback(async () => {
    try {
      setSidebarLoading(true);
      const res = await api.get("/stories", {
        params: { page: 1, limit: 12, sort: "best" },
      });
      if (res.data?.success) {
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
      if (res.data?.success) {
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

  /* Derived values */
  const hasFilter = !!(category || search);
  const { totalStories, totalPages } = pagination;

  /* Handlers */
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
    const nextCategory = category === catKey ? "" : catKey;
    setCategory(nextCategory);
    const params = new URLSearchParams(searchParams);
    if (nextCategory) {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
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
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.delete("category");
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg[#fafafa] text-gray-900 font-sans selection:bg-gray-200">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ══════════════════════════════════════════
          MAIN CONTENT (Global navigation provided by MainLayout)
          ══════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-32 selection:bg-neutral-200">
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

        {/* ══════════════════════════════════════════
            EXPLORE / FEED SECTION
            ══════════════════════════════════════════ */}
        <section ref={exploreRef} className="scroll-mt-24">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 sm:mb-8 border-b border-black/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                  {category
                    ? CATEGORIES[category]?.label || "Stories"
                    : search
                    ? `Results for "${search}"`
                    : "Latest library"}
                </h2>
                {!loading && (
                  <span className="text-xs font-semibold text-neutral-400 bg-neutral-100 px-2.5 py-0.5 rounded-full tabular-nums">
                    {totalStories}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                {category && CATEGORIES[category]?.description
                  ? CATEGORIES[category].description
                  : search
                  ? "Stories matching your search across the library"
                  : "Curated entries from writers everywhere"}
              </p>
            </div>

            {/* Filter chips / Sort toggle */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {hasFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer"
                >
                  <span>Reset filters</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}

              <div className="inline-flex p-1 bg-neutral-100 rounded-full text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSortBy("best")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    sortBy === "best"
                      ? "bg-white text-neutral-900 shadow-xs"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Best
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("newest")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    sortBy === "newest"
                      ? "bg-white text-neutral-900 shadow-xs"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Newest
                </button>
              </div>
            </div>
          </div>

          {/* Active filter pill display */}
          {hasFilter && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs font-semibold text-neutral-400">
                Filtered by:
              </span>
              {category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-semibold">
                  <span>{CATEGORIES[category]?.label || category}</span>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Remove category filter"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-semibold">
                  <span>"{search}"</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      const params = new URLSearchParams(searchParams);
                      params.delete("search");
                      setSearchParams(params);
                    }}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Remove search filter"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Stories Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-100 rounded-2xl mb-2.5" />
                  <div className="h-3.5 bg-neutral-100 rounded-md w-3/4 mb-2" />
                  <div className="h-3 bg-neutral-100 rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center max-w-sm mx-auto">
              <p className="text-sm font-semibold text-neutral-800 mb-1">
                Unable to load stories
              </p>
              <p className="text-xs text-neutral-500 mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchStories}
                className="px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : stories.length === 0 ? (
            <PremiumEmptyState
              search={search}
              category={category}
              onClear={clearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                {stories.map((story) => (
                  <PremiumStoryCard key={story._id} story={story} />
                ))}
              </div>

              {/* Pagination */}
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
      </div>
    </div>
  );
};

export default Stories;