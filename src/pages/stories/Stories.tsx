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

function PremiumWriteCard() {
  return (
    <Link
      to="/write"
      className="group relative block w-full overflow-hidden rounded-2xl sm:rounded-[24px] mb-6 sm:mb-8"
    >
      {/* Base — deep ink with warm paper undertone */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1520] via-[#121018] to-[#0c0a10]" />

      {/* Soft color wash — diary ink + parchment feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(196,149,106,0.18),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(120,90,160,0.14),_transparent_50%)]" />

      {/* Fine top hairline (editorial) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c4956a]/40 to-transparent" />

      {/* Right-side soft panel glow on larger screens */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#c4956a]/8 to-transparent  pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3 sm:gap-5 px-4 py-3.5 sm:px-7 sm:py-5">
        {/* Accent mark — vertical gold bar (no icon / no abstract pages) */}
        <div className=" w-[3px] self-stretch min-h-[40px] rounded-full bg-gradient-to-b from-[#e8c9a0] via-[#c4956a] to-[#8b6a4a] opacity-90 shrink-0" />

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className="hidden sm:block text-[10px] font-medium tracking-[0.2em] uppercase text-[#c4956a] mb-1">
            New entry
          </p>
          <h2 className="text-[15px] sm:text-lg font-semibold text-[#f5f0ea] tracking-tight leading-snug">
            Write something today
          </h2>
          <p className=" text-[13px] text-[#a89f96] mt-0.5 leading-snug">
            A quiet place for your thoughts.
          </p>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-[#f5f0ea] text-[#1a1520] text-xs sm:text-sm font-semibold px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full group-hover:bg-white transition-colors shadow-sm">
            <span className="">Write</span>

            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="opacity-70 group-hover:translate-x-0.5 transition-transform"
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
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </Link>
  );
}

function CategoryCardsWithImages({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (c: string) => void;
}) {
  return (
    <section className="mb-8 sm:mb-10">
      <div className="flex items-baseline justify-between gap-3 mb-3.5 sm:mb-4">
        <div className="min-w-0">
          <h3 className="text-[15px] sm:text-base font-semibold text-neutral-900 tracking-tight">
            Browse by mood
          </h3>
          <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 hidden sm:block">
            Tap a genre to filter stories
          </p>
        </div>
        {active && (
          <button
            onClick={() => onSelect("")}
            className="shrink-0 text-[11px] sm:text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 px-2.5 py-1 rounded-full transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5">
        {/* All */}
        <button
          onClick={() => onSelect("")}
          className={`snap-start shrink-0 relative h-[72px] sm:h-[84px] w-[72px] sm:w-[92px] rounded-2xl overflow-hidden transition-all duration-300 ${
            !active
              ? "ring-2 ring-neutral-900 ring-offset-2 shadow-md"
              : "hover:opacity-95"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12),_transparent_60%)]" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-1.5">
            <span className="text-white text-[11px] sm:text-xs font-semibold tracking-tight">
              All
            </span>
          </div>
        </button>

        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(isActive ? "" : key)}
              className={`snap-start shrink-0 relative h-[72px] sm:h-[84px] w-[112px] sm:w-[132px] rounded-2xl overflow-hidden transition-all duration-300 ${
                isActive
                  ? "ring-2 ring-neutral-900 ring-offset-2 shadow-md scale-[1.02]"
                  : "hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              {/* Image */}
              <img
                src={cat.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />

              {/* Overlay — readable, not muddy */}
              <div
                className={`absolute inset-0 bg-gradient-to-t ${cat.color || "from-black/80 to-black/20"} opacity-80`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

              {/* Label only — no icon clutter */}
              <div className="relative z-10 h-full flex flex-col justify-end p-2.5 sm:p-3 text-left">
                <span className="text-white text-[12px] sm:text-[13px] font-semibold leading-tight tracking-tight drop-shadow-sm">
                  {cat.label}
                </span>
                {cat.description && (
                  <span className="hidden sm:block text-white/70 text-[10px] mt-0.5 leading-tight line-clamp-1">
                    {cat.description}
                  </span>
                )}
              </div>

              {/* Active check — small, quiet */}
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#171717"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WritersSmallRow({ writers }: { writers: Writer[] }) {
  if (!writers.length) return null;

  return (
    <section className="mb-10 sm:mb-14">
      {/* Header Section */}
      <div className="flex items-baseline justify-between gap-3 mb-4 sm:mb-5">
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight">
            Voices to follow
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Writers our community keeps coming back to
          </p>
        </div>
        <Link
          to="/search"
          className="shrink-0 text-xs font-semibold text-[#c4956a] hover:text-[#8b6a4a] transition-colors flex items-center gap-1"
        >
          View all <i className="ri-arrow-right-line" />
        </Link>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-4">
        {writers.slice(0, 8).map((writer, i) => (
          <Link
            key={writer._id}
            to={`/profile/${writer.username}`}
            className="group relative flex flex-col snap-start shrink-0 w-[160px] sm:w-[180px] rounded-2xl sm:rounded-[24px] overflow-hidden hover:-translate-y-1 transition-transform duration-500 shadow-sm hover:shadow-xl"
          >
            {/* Base — deep ink with warm paper undertone */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1520] via-[#121018] to-[#0c0a10]" />

            {/* Soft color wash — diary ink + parchment feel */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(196,149,106,0.18),_transparent_55%)] opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(120,90,160,0.14),_transparent_50%)] opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Fine top hairline (editorial) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c4956a]/40 to-transparent" />

            {/* Bottom hairline */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="relative z-10 flex flex-col items-center text-center px-4 py-6 sm:py-7">
              {/* Avatar Container with Premium Ring */}
              <div className="relative mb-4">
                <div className="rounded-full p-[2px] bg-gradient-to-b from-[#e8c9a0] via-[#c4956a] to-[#8b6a4a] opacity-90 group-hover:opacity-100 transition-opacity shadow-[0_0_15px_rgba(196,149,106,0.2)]">
                  <div className="bg-[#121018] rounded-full p-[2px]">
                    <Avatar
                      src={writer.image?.url}
                      alt={writer.username}
                      size={56}
                    />
                  </div>
                </div>

                {/* Ranking Badge */}
                {i < 3 && (
                  <span
                    className={`absolute -bottom-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-[#121018] shadow-sm ${
                      i === 0
                        ? "bg-gradient-to-br from-[#e8c9a0] to-[#c4956a] text-[#1a1520]"
                        : i === 1
                          ? "bg-gradient-to-br from-gray-300 to-gray-400 text-[#1a1520]"
                          : "bg-gradient-to-br from-[#c4956a] to-[#8b6a4a] text-white"
                    }`}
                  >
                    #{i + 1}
                  </span>
                )}
              </div>

              {/* Writer Info */}
              <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#f5f0ea] truncate w-full leading-tight">
                {writer.name || writer.username}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#c4956a] truncate w-full mt-1 font-medium tracking-wide">
                @{writer.username}
              </p>

              {/* Decorative Divider */}
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 mb-3" />

              {/* Metric */}
              <p className="text-[11px] text-[#a89f96]">
                <span className="font-semibold text-[#f5f0ea]">
                  {formatCount(writer.followers?.length || 0)}
                </span>{" "}
                followers
              </p>
            </div>

            {/* Subtle right-side soft panel glow appearing on hover */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#c4956a]/0 group-hover:from-[#c4956a]/5 to-transparent pointer-events-none transition-all duration-500" />
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
    <Link to={`/stories/${story._id}`} className="group block">
      {/* ── Cover ── */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100 mb-2.5">
        {story.image?.url ? (
          <img
            src={story.image.url}
            alt={story.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              cat.color || cat.gradient || "from-neutral-600 to-neutral-900"
            }`}
          />
        )}

        {/* Bottom fade for genre legibility */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />

        {/* Genre — bottom left on cover */}
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/95 tracking-wide">
          {cat.label}
        </span>

        {/* Time — bottom right on cover */}
        <span className="absolute bottom-2 right-2 text-[10px] font-medium text-white/80 tabular-nums">
          {timeAgo}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="min-w-0 space-y-1.5">
        {/* Title */}
        <h4 className="text-[13px] sm:text-[14px] font-semibold text-neutral-900 leading-[1.35] line-clamp-2 tracking-tight group-hover:text-neutral-600 transition-colors">
          {story.title}
        </h4>

        {/* Author */}
        <div className="flex items-center gap-1.5 min-w-0">
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
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
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

      {/* ══════════ DESKTOP HEADER ══════════ */}
      {/* ══════════ HEADER ══════════ */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
            {/* Left — logo + desktop nav */}
            <div className="flex items-center gap-6 sm:gap-8 min-w-0 shrink-0">
              <Link to="/" className="flex items-center shrink-0">
                <DiaryLogo />
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                <Link
                  to="/"
                  className="px-3 py-1.5 text-sm font-medium text-neutral-900 rounded-full bg-neutral-100"
                >
                  Stories
                </Link>
                <Link
                  to="/search"
                  className="px-3 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-full transition-colors"
                >
                  Writers
                </Link>
              </nav>
            </div>

            {/* Center — search (tablet & up) */}
            <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg">
              <div className="relative w-full">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
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
                  placeholder="Search stories or writers"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-10 pl-10 pr-9 rounded-full bg-neutral-100 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none border border-transparent focus:bg-white focus:border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/80 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Mobile search */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label="Search"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
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
              </button>

              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-900 px-3 py-2 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center h-9 px-4 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    Join
                  </Link>
                </>
              ) : (
                <>
                  {/* Desktop-only secondary actions */}
                  <Link
                    to="/notifications"
                    className="relative hidden lg:flex w-9 h-9 rounded-full items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                    aria-label="Notifications"
                  >
                    <svg
                      width="18"
                      height="18"
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
                    <NotificationBadge count={unreadNotif} />
                  </Link>

                  <Link
                    to="/chat"
                    className="relative hidden lg:flex w-9 h-9 rounded-full items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                    aria-label="Messages"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V6.5z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <NotificationBadge count={unreadMsg} />
                  </Link>

                  <Link
                    to="/write"
                    className="hidden md:inline-flex items-center h-9 gap-1.5 px-4 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors ml-1"
                  >
                    Write
                  </Link>

                  {/* Profile — desktop */}
                  <div className="relative hidden lg:block ml-1">
                    <button
                      type="button"
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center rounded-full hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
                      aria-label="Account menu"
                    >
                      <Avatar
                        src={user.image?.url}
                        alt={user.username}
                        size={32}
                      />
                    </button>

                    {profileOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setProfileOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-neutral-200/80 py-1.5 z-20 overflow-hidden">
                          <div className="px-4 py-3 border-b border-neutral-100">
                            <p className="text-sm font-semibold text-neutral-900 truncate">
                              {user.name || user.username}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              @{user.username}
                            </p>
                          </div>
                          <Link
                            to={`/profile/${user.username}`}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                          >
                            Your profile
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                          >
                            Settings
                          </Link>
                          <div className="border-t border-neutral-100 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileOpen(false);
                                handleLogout();
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                              Sign out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mobile — open account drawer via avatar only */}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                    aria-label="Menu"
                  >
                    <Avatar
                      src={user.image?.url}
                      alt={user.username}
                      size={30}
                    />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 lg:pb-24">
        {/* TOP LAYOUT: Hero -> Write Card -> Categories -> Writers */}
        {!hasFilter && (
          <>
            {sidebarLoading ? (
              <div className="w-full rounded-[24px] bg-gray-100 animate-pulse aspect-[4/5] sm:aspect-[21/9] mb-6" />
            ) : trendingStories.length > 0 ? (
              <TopHeroSection stories={trendingStories} />
            ) : null}

            <PremiumWriteCard />

            {/* Keep category chips visible above the feed for easy filtering */}
            <CategoryCardsWithImages
              active={category}
              onSelect={handleCategorySelect}
            />

            {!sidebarLoading && topWriters.length > 0 && (
              <WritersSmallRow writers={topWriters} />
            )}
          </>
        )}

        {/* FEED SECTION */}
        <section
          ref={exploreRef}
          className="scroll-mt-32 border-t border-gray-100 pt-8 mt-4"
        >
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-5">
            <div className="min-w-0">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight truncate mb-1">
                {hasFilter
                  ? search
                    ? `Results for "${search}"`
                    : `${CATEGORIES[category]?.label} Section`
                  : "Stories"}
              </h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {loading ? "Searching..." : `${totalStories} Stories found`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {hasFilter && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-black text-gray-900 bg-gray-100 hover:bg-gray-200 px-5 py-3 rounded-full transition-colors whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
              <div className="relative w-full sm:w-auto min-w-[180px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none text-sm font-black bg-white border-2 border-gray-100 rounded-full pl-5 pr-12 py-3 outline-none cursor-pointer text-gray-900 hover:border-gray-300 focus:border-gray-900 transition-all shadow-sm"
                >
                  <option value="best">Top Rated</option>
                  <option value="newest">New</option>
                  <option value="oldest">Old Stories</option>
                </select>
                <i className="ri-arrow-down-s-fill absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg" />
              </div>
            </div>
          </div>

          {/* If there is a filter but no results, show the premium empty state */}
          {error && (
            <div className="py-10 text-center">
              <p className="text-red-500 font-bold mb-4">{error}</p>
              <button
                onClick={fetchStories}
                className="px-6 py-2 bg-gray-100 rounded-full font-bold"
              >
                Try Again
              </button>
            </div>
          )}

          {!error && loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col gap-3">
                  <div className="aspect-[4/5] bg-gray-100 rounded-[20px]" />
                  <div className="h-4 bg-gray-100 rounded-md w-3/4 mx-1" />
                  <div className="h-3 bg-gray-100 rounded-md w-1/2 mx-1" />
                </div>
              ))}
            </div>
          )}

          {!error && !loading && stories.length === 0 && (
            <PremiumEmptyState
              search={search}
              category={category}
              onClear={clearFilters}
            />
          )}

          {!error && !loading && stories.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                {stories.map((story) => (
                  <PremiumStoryCard key={story._id} story={story} />
                ))}
              </div>
              <PremiumPagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
                fill="currentColor"
              />
            </svg>
            <span className="text-[10px] font-semibold tracking-wide">Home</span>
            <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-amber-600" />
          </Link>

          {/* Messages */}
          <Link
            to="/chat"
            className="relative flex flex-col items-center justify-center gap-0.5 py-2 text-stone-400 hover:text-[#1a1520] transition-colors"
            aria-label="Messages"
          >
            <span className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
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
            <span className="text-[10px] font-medium tracking-wide">Chat</span>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="relative" aria-hidden>
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
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
            <span className="text-[10px] font-medium tracking-wide">Alerts</span>
          </Link>

          {/* Profile */}
          <Link
            to={`/profile/${user.username}`}
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-stone-400 hover:text-[#1a1520] transition-colors"
            aria-label="Profile"
          >
            <span className="rounded-full p-[1.5px] bg-gradient-to-br from-stone-200 to-stone-300">
              <Avatar src={user.image?.url} alt={user.username} size={22} />
            </span>
            <span className="text-[10px] font-medium tracking-wide">Me</span>
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
        <div className="fixed inset-0 z-[60] bg-white flex flex-col lg:hidden animate-in fade-in duration-200">
          <div className="bg-white border-b border-gray-100 shadow-sm pt-safe">
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full shrink-0 transition-colors"
              >
                <i className="ri-arrow-left-line text-xl" />
              </button>
              <div className="relative flex-1">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Find stories or writers..."
                  autoFocus
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 rounded-full text-[15px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all border border-transparent"
                />
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-gray-200 rounded-full"
                  >
                    <i className="ri-close-line text-gray-600 font-bold" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter category directly inside the mobile search overlay without closing it */}
            <div className="px-4 pb-3 flex gap-2.5 overflow-x-auto no-scrollbar snap-x">
              <button
                onClick={() => setCategory("")}
                className={`shrink-0 snap-start px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${category === "" ? "bg-gray-900 text-white shadow-md" : "bg-gray-50 text-gray-500 border border-gray-100"}`}
              >
                All
              </button>
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const isActive = category === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(isActive ? "" : key)}
                    className={`shrink-0 snap-start flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${isActive ? "bg-gray-900 text-white shadow-md" : "bg-gray-50 text-gray-500 border border-gray-100"}`}
                  >
                    <i className={`${cat.icon} text-[13px]`} /> {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-[11px] font-black tracking-widest uppercase text-gray-400">
                {search || category
                  ? loading
                    ? "Searching..."
                    : `${stories.length} Results found`
                  : "🔥 Trending Now"}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] bg-gray-100 rounded-[20px] animate-pulse"
                  />
                ))}
              </div>
            ) : search || category ? (
              stories.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {stories.map((s) => (
                    <div key={s._id} onClick={() => setMobileSearchOpen(false)}>
                      <PremiumStoryCard story={s} />
                    </div>
                  ))}
                </div>
              ) : (
                <PremiumEmptyState
                  search={search}
                  category={category}
                  onClear={clearFilters}
                />
              )
            ) : (
              // Default view if no search or category is typed in overlay
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
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
