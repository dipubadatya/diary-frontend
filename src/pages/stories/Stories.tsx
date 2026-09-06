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
import { ErrorCard } from "../../components/ErrorCard";
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
   CONSTANTS
   ══════════════════════════════════════ */
const CATEGORIES: Record<
  string,
  {
    label: string;
    icon: string;
    gradient: string;
    image: string;
    description: string;
  }
> = {
  fantasy: {
    label: "Fantasy",
    icon: "ri-magic-line",
    gradient: "from-purple-600 via-pink-500 to-rose-500",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=600&q=80",
    description: "Magic & mythical worlds",
  },
  "random-thoughts": {
    label: "Thoughts",
    icon: "ri-lightbulb-line",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    image:
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=600&q=80",
    description: "Musings & reflections",
  },
  poetry: {
    label: "Poetry",
    icon: "ri-quill-pen-line",
    gradient: "from-rose-400 via-pink-500 to-fuchsia-600",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80",
    description: "Verse & rhythm",
  },
  letter: {
    label: "Letters",
    icon: "ri-mail-line",
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    image:
      "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80",
    description: "Personal correspondence",
  },
  mystery: {
    label: "Mystery",
    icon: "ri-search-eye-line",
    gradient: "from-slate-700 via-slate-800 to-black",
    image:
      "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=600&q=80",
    description: "Suspense & thrill",
  },
  adventure: {
    label: "Adventure",
    icon: "ri-compass-3-line",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80",
    description: "Journeys & exploration",
  },
  historical: {
    label: "Historical",
    icon: "ri-ancient-gate-line",
    gradient: "from-yellow-600 via-amber-700 to-orange-800",
    image:
      "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80",
    description: "Stories from the past",
  },
  fiction: {
    label: "Fiction",
    icon: "ri-book-line",
    gradient: "from-cyan-500 via-blue-500 to-indigo-600",
    image:
      "https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=600&q=80",
    description: "Imagined narratives",
  },
  other: {
    label: "Other",
    icon: "ri-more-line",
    gradient: "from-gray-500 via-gray-600 to-gray-700",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80",
    description: "Unique perspectives",
  },
};

const STORIES_PER_PAGE = 12;
const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80";

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
      loading="lazy"
    />
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
    color === "lime" ? "bg-[#D9F26B] text-[#0A0A0A]" : "bg-red-500 text-white";
  return (
    <span
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] ${bg} text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ══════════════════════════════════════
   BOOK COVER CARD
   ══════════════════════════════════════ */
function BookCard({
  story,
  size = "md",
}: {
  story: Story;
  size?: "sm" | "md" | "lg";
}) {
  const cat = CATEGORIES[story.category] || CATEGORIES.other;
  const likesCount = getLikesCount(story);

  const dims = {
    sm: { title: "text-xs", padding: "p-2.5", avatar: 14 },
    md: { title: "text-sm", padding: "p-3", avatar: 16 },
    lg: { title: "text-base", padding: "p-4", avatar: 18 },
  }[size];

  return (
    <Link to={`/stories/${story._id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1">
        {story.image?.url ? (
          <img
            src={story.image.url}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}
          >
            <i className={`${cat.icon} text-white text-4xl opacity-70`} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Category tag */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-[9px] font-bold px-2 py-0.5 rounded-full text-gray-800 uppercase tracking-wider">
            <i className={`${cat.icon} text-[9px]`} />
            {cat.label}
          </span>
        </div>

        {/* Likes */}
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            <i className="ri-heart-fill text-red-400 text-[9px]" />
            {formatCount(likesCount)}
          </span>
        </div>

        {/* Title & author */}
        <div className={`absolute bottom-0 left-0 right-0 ${dims.padding}`}>
          <h3
            className={`${dims.title} font-bold text-white leading-tight line-clamp-2 mb-1.5 drop-shadow-lg`}
          >
            {story.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <Avatar
              src={story.owner?.image?.url}
              alt={story.owner?.username || ""}
              size={dims.avatar}
              ring
            />
            <span className="text-[10px] text-white/90 font-medium truncate">
              {story.owner?.name || story.owner?.username}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════
   HERO — Premium editorial style
   ══════════════════════════════════════ */
function HeroSection({ stories }: { stories: Story[] }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setActive((p) => (p + 1) % Math.min(stories.length, 5));
  }, [stories.length]);

  useEffect(() => {
    timerRef.current = setInterval(next, 6500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 6500);
  };

  const heroStories = stories.slice(0, 5);
  const story = heroStories[active];
  if (!story) return null;

  const cat = CATEGORIES[story.category] || CATEGORIES.other;
  const likesCount = getLikesCount(story);
  const viewsCount = getViewsCount(story);

  return (
    <section className="mb-8 sm:mb-10">
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
        {/* MAIN HERO */}
        <div className="lg:col-span-3 relative overflow-hidden rounded-[24px] sm:rounded-[32px] h-[440px] sm:h-[500px] lg:h-[560px] group">
          {/* Background */}
          <div className="absolute inset-0">
            {story.image?.url ? (
              <img
                key={story._id}
                src={story.image.url}
                alt=""
                className="w-full h-full object-cover animate-heroFade"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${cat.gradient}`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-7 lg:p-9">
            {/* Top badges */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-[#D9F26B] text-[#0A0A0A] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  <i className="ri-fire-fill" /> Trending #1
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/20">
                  <i className={cat.icon} /> {cat.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                <span className="text-[#D9F26B] font-bold text-sm">
                  {String(active + 1).padStart(2, "0")}
                </span>
                <span className="text-white/40 text-xs">/</span>
                <span className="text-white/70 text-xs">
                  {String(heroStories.length).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="text-[#D9F26B] text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-3">
                · Editor's Pick ·
              </p>
              <h1
                className="text-white font-black leading-[1.05] tracking-tight mb-4 line-clamp-3"
                style={{ fontSize: "clamp(1.75rem, 4vw, 3.25rem)" }}
              >
                {story.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-5">
                <Link
                  to={`/profile/${story.owner.username}`}
                  className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full pl-1 pr-4 py-1 hover:bg-white/20 transition-all"
                >
                  <Avatar
                    src={story.owner.image?.url}
                    alt={story.owner.username || ""}
                    size={26}
                    ring
                  />
                  <span className="text-white text-xs sm:text-sm font-bold">
                    {story.owner.name || story.owner.username}
                  </span>
                </Link>

                <div className="flex items-center gap-3 text-white/80 text-xs sm:text-sm">
                  <span className="flex items-center gap-1">
                    <i className="ri-heart-fill text-red-400" />
                    <span className="font-semibold">
                      {formatCount(likesCount)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-eye-line text-blue-300" />
                    <span className="font-semibold">
                      {formatCount(viewsCount)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-white/60 hidden sm:flex">
                    <i className="ri-time-line" />
                    {moment(story.timeStamp).fromNow()}
                  </span>
                </div>
              </div>

              <Link
                to={`/stories/${story._id}`}
                className="inline-flex items-center gap-3 bg-[#D9F26B] text-[#0A0A0A] font-black text-sm px-6 py-3.5 rounded-full hover:brightness-110 transition-all shadow-2xl shadow-lime-500/30"
              >
                <i className="ri-book-open-line text-base" />
                Read Story
                <span className="w-6 h-6 bg-[#0A0A0A] text-[#D9F26B] rounded-full flex items-center justify-center">
                  <i className="ri-arrow-right-line text-xs" />
                </span>
              </Link>
            </div>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {heroStories.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActive(i);
                    resetTimer();
                  }}
                  className={`rounded-full transition-all duration-500 ${
                    i === active
                      ? "w-8 h-2 bg-[#D9F26B]"
                      : "w-2 h-2 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* SIDE LIST - Top 4 trending */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-500 mb-0.5">
                · Top This Week ·
              </p>
              <h3 className="text-lg font-black text-gray-900">Rising Now</h3>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 flex-1">
            {heroStories.slice(1, 5).map((s, i) => {
              const sCat = CATEGORIES[s.category] || CATEGORIES.other;
              return (
                <Link
                  key={s._id}
                  to={`/stories/${s._id}`}
                  className="group flex lg:flex-row flex-col gap-3 bg-white rounded-2xl overflow-hidden p-2.5 hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <div className="relative w-full lg:w-[90px] aspect-[16/9] lg:aspect-square rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {s.image?.url ? (
                      <img
                        src={s.image.url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${sCat.gradient} flex items-center justify-center`}
                      >
                        <i className={`${sCat.icon} text-white text-2xl`} />
                      </div>
                    )}
                    <div className="absolute top-1 left-1 w-5 h-5 bg-[#0A0A0A] text-[#D9F26B] text-[10px] font-black rounded-full flex items-center justify-center">
                      {i + 2}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <span className="inline-block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">
                        {sCat.label}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {s.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Avatar
                        src={s.owner?.image?.url}
                        alt={s.owner?.username || ""}
                        size={16}
                      />
                      <span className="text-[10px] text-gray-500 truncate">
                        {s.owner?.name || s.owner?.username}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto shrink-0">
                        <i className="ri-heart-fill text-red-400 mr-0.5" />
                        {formatCount(getLikesCount(s))}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroFade {
          from { opacity: 0; transform: scale(1.03); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-heroFade { animation: heroFade 0.8s ease-out; }
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════
   CATEGORIES SHOWCASE — Image cards
   ══════════════════════════════════════ */
function CategoriesShowcase({
  activeCategory,
  onSelect,
}: {
  activeCategory: string;
  onSelect: (cat: string) => void;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <i className="ri-apps-2-line text-lg text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Browse by Genre
            </h2>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Find stories that match your mood
          </p>
        </div>
        {activeCategory && (
          <button
            onClick={() => onSelect("")}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Clear filter <i className="ri-close-line" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const isActive = activeCategory === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key === activeCategory ? "" : key)}
              className={`group relative overflow-hidden rounded-2xl aspect-[4/3] transition-all hover:-translate-y-1 hover:shadow-2xl ${
                isActive ? "ring-4 ring-[#D9F26B] shadow-2xl" : "shadow-md"
              }`}
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-70 group-hover:opacity-80 transition-opacity`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 text-left">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                    <i className={`${cat.icon} text-white text-base sm:text-lg`} />
                  </div>
                  {isActive && (
                    <div className="w-6 h-6 bg-[#D9F26B] rounded-full flex items-center justify-center">
                      <i className="ri-check-line text-[#0A0A0A] text-xs font-bold" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-black text-base sm:text-lg leading-tight mb-0.5">
                    {cat.label}
                  </h3>
                  <p className="text-white/80 text-[10px] sm:text-xs font-medium">
                    {cat.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   FEATURED WRITERS
   ══════════════════════════════════════ */
function WritersShowcase({ writers }: { writers: Writer[] }) {
  if (writers.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <i className="ri-award-line text-lg text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Featured Writers
            </h2>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            The most read voices on Diary
          </p>
        </div>
        <Link
          to="/search"
          className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 shrink-0"
        >
          See all <i className="ri-arrow-right-line" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {writers.slice(0, 5).map((w, i) => (
          <Link
            key={w._id}
            to={`/profile/${w.username}`}
            className="group relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            {i < 3 && (
              <div
                className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-md ${
                  i === 0
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                    : i === 1
                    ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                    : "bg-gradient-to-br from-orange-400 to-orange-500 text-white"
                }`}
              >
                {i + 1}
              </div>
            )}

            <div className="flex justify-center mb-3">
              <div className="relative">
                <Avatar src={w.image?.url} alt={w.username} size={64} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D9F26B] rounded-full flex items-center justify-center ring-2 ring-white">
                  <i className="ri-quill-pen-line text-[#0A0A0A] text-[10px]" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-gray-900 truncate mb-0.5">
                {w.name || w.username}
              </p>
              <p className="text-[10px] text-gray-500 truncate mb-2">
                @{w.username}
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600">
                <span className="flex items-center gap-0.5">
                  <i className="ri-user-follow-line" />
                  {formatCount(w.followers?.length || 0)}
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-0.5">
                  <i className="ri-book-2-line" />
                  {w.storiesCount || 0}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   NETFLIX-STYLE CATEGORY ROW
   ══════════════════════════════════════ */
function CategoryRow({
  title,
  subtitle,
  icon,
  stories,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  stories: Story[];
  onSeeAll?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (stories.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <i className={`${icon} text-lg text-gray-700`} />
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full bg-white shadow-sm hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition-all"
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full bg-white shadow-sm hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition-all"
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              See all <i className="ri-arrow-right-line" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-3 sm:-mx-5 px-3 sm:px-5"
      >
        {stories.map((s) => (
          <div
            key={s._id}
            className="shrink-0 w-[140px] sm:w-[160px] md:w-[180px] snap-start"
          >
            <BookCard story={s} size="md" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   WRITE STORY CTA
   ══════════════════════════════════════ */
function WriteStoryCard() {
  return (
    <section className="mb-10">
      <Link
        to="/write"
        className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A0A0A] via-[#1a1a1a] to-[#0A0A0A] p-6 sm:p-8 md:p-10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D9F26B]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="absolute top-6 right-8 hidden md:block opacity-20 group-hover:opacity-40 transition-opacity">
          <i className="ri-quill-pen-line text-6xl text-[#D9F26B]" />
        </div>
        <div className="absolute bottom-6 right-24 hidden md:block opacity-10 group-hover:opacity-25 transition-opacity">
          <i className="ri-book-open-line text-8xl text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 max-w-3xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#D9F26B] rounded-2xl flex items-center justify-center shadow-2xl shadow-lime-500/20 group-hover:rotate-6 transition-transform duration-500 shrink-0">
            <i className="ri-quill-pen-line text-[#0A0A0A] text-3xl sm:text-4xl" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[#D9F26B] text-xs font-bold tracking-[0.25em] uppercase mb-2">
              · Your story matters ·
            </p>
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-3">
              Ready to share your{" "}
              <span className="text-[#D9F26B]">next chapter</span>?
            </h2>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-5 max-w-xl">
              Join thousands of writers publishing thoughts, poetry, and fiction
              to a community that reads.
            </p>

            <div className="inline-flex items-center gap-3 bg-[#D9F26B] text-[#0A0A0A] font-black text-sm px-6 py-3.5 rounded-full group-hover:scale-105 transition-transform shadow-xl">
              <i className="ri-edit-line" />
              Start Writing
              <span className="w-6 h-6 bg-[#0A0A0A] text-[#D9F26B] rounded-full flex items-center justify-center">
                <i className="ri-arrow-right-up-line text-xs" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

/* ══════════════════════════════════════
   PAGINATION
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
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
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
const BookSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-[2/3] bg-gray-200 rounded-2xl" />
  </div>
);

/* ══════════════════════════════════════
   SEARCH BAR (Desktop)
   ══════════════════════════════════════ */
function DesktopSearchBar({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative w-full max-w-md">
      <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
      <input
        type="text"
        placeholder="Search stories, writers, topics…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center"
        >
          <i className="ri-close-circle-fill text-gray-400" />
        </button>
      )}
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

  const storiesSectionRef = useRef<HTMLDivElement>(null);

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

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchCategory, setMobileSearchCategory] = useState("");
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page on filter change
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
            0
          )
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
        const trending =
          res.data.topFiveStories || res.data.trendingStories || [];
        setTrendingStories(trending);
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
      setError(e.message || "Failed to load stories");
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

  // Group stories by category for showcase rows (only when no filter)
  const storiesByCategory = useMemo(() => {
    if (hasFilter) return {};
    const grouped: Record<string, Story[]> = {};
    stories.forEach((s) => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });
    return grouped;
  }, [stories, hasFilter]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    setTimeout(() => {
      storiesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setTimeout(() => {
      storiesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const clearFilters = () => {
    setCategory("");
    setSearch("");
    setSearchInput("");
  };

  // Mobile search filtered stories
  const mobileSearchResults = useMemo(() => {
    let list = search ? stories : trendingStories;
    if (mobileSearchCategory) {
      list = list.filter((s) => s.category === mobileSearchCategory);
    }
    return list;
  }, [search, stories, trendingStories, mobileSearchCategory]);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* ══════════ DESKTOP HEADER ══════════ */}
      <header className="sticky top-0 z-40 pt-3 sm:pt-4 px-3 sm:px-5">
        <div className="max-w-7xl mx-auto">
          <nav className="bg-white rounded-full shadow-[0_4px_24px_-6px_rgba(15,23,42,0.1)] flex items-center gap-3 pl-4 sm:pl-6 pr-2 sm:pr-3 py-2">
            <Link to="/" className="shrink-0 flex items-center">
              <DiaryLogo />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1 ml-4">
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

            {/* Desktop search bar - centered */}
            <div className="hidden md:flex flex-1 justify-center px-4">
              <DesktopSearchBar
                value={searchInput}
                onChange={setSearchInput}
                onClear={() => {
                  setSearchInput("");
                  setSearch("");
                }}
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 ml-auto md:ml-0">
              {/* Mobile search button */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <i className="ri-search-line text-base" />
              </button>

              {!user ? (
                <Link
                  to="/login"
                  className="ml-1 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#D9F26B] text-[#0A0A0A] hover:brightness-105 transition-all"
                >
                  Sign in
                </Link>
              ) : (
                <>
                  {/* Chat & Notifications - hidden on mobile (in bottom nav) */}
                  <Link
                    to="/chat"
                    className="relative hidden md:flex w-10 h-10 rounded-full items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <i className="ri-chat-3-line text-lg" />
                    <Badge count={unreadMsg} color="lime" />
                  </Link>
                  <Link
                    to="/notifications"
                    className="relative hidden md:flex w-10 h-10 rounded-full items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <i className="ri-notification-3-line text-lg" />
                    <Badge count={unreadNotif} />
                  </Link>

                  {/* Desktop profile menu */}
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

                  {/* Desktop write button */}
                  <Link
                    to="/write"
                    className="hidden md:inline-flex ml-1 items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#D9F26B] text-[#0A0A0A] hover:brightness-105 transition-all"
                  >
                    Write
                    <span className="w-5 h-5 bg-[#0A0A0A] text-[#D9F26B] rounded-full flex items-center justify-center">
                      <i className="ri-arrow-right-up-line text-[10px]" />
                    </span>
                  </Link>

                  {/* Mobile menu button */}
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

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-5 pb-28 lg:pb-12">
        {/* HERO — only when no filter */}
        {!hasFilter &&
          (sidebarLoading ? (
            <div className="grid lg:grid-cols-5 gap-4 mb-8">
              <div className="lg:col-span-3 rounded-[24px] sm:rounded-[32px] bg-gray-200 animate-pulse h-[440px] sm:h-[500px] lg:h-[560px]" />
              <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 rounded-2xl animate-pulse h-24 lg:h-full"
                  />
                ))}
              </div>
            </div>
          ) : trendingStories.length > 0 ? (
            <HeroSection stories={trendingStories} />
          ) : null)}

        {/* CATEGORIES SHOWCASE */}
        {!hasFilter && (
          <CategoriesShowcase
            activeCategory={category}
            onSelect={handleCategorySelect}
          />
        )}

        {/* TOP WRITERS */}
        {!hasFilter && !sidebarLoading && topWriters.length > 0 && (
          <WritersShowcase writers={topWriters} />
        )}

        {/* CATEGORY ROWS */}
        {!hasFilter &&
          !loading &&
          Object.keys(storiesByCategory).length > 0 && (
            <>
              {Object.entries(storiesByCategory)
                .filter(([_, list]) => list.length >= 2)
                .slice(0, 3)
                .map(([catKey, catStories]) => {
                  const cat = CATEGORIES[catKey];
                  if (!cat) return null;
                  return (
                    <CategoryRow
                      key={catKey}
                      title={cat.label}
                      subtitle={`${catStories.length} stories in this category`}
                      icon={cat.icon}
                      stories={catStories}
                      onSeeAll={() => handleCategorySelect(catKey)}
                    />
                  );
                })}
            </>
          )}

        {/* WRITE CTA */}
        {!hasFilter && <WriteStoryCard />}

        {/* MAIN LIBRARY */}
        <section ref={storiesSectionRef} className="scroll-mt-24">
          <div className="flex items-end justify-between mb-5 px-1 gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <i className="ri-book-2-line text-lg text-gray-700" />
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                  {hasFilter
                    ? search
                      ? `Results for "${search}"`
                      : `${CATEGORIES[category]?.label} Stories`
                    : "Explore All Stories"}
                </h2>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {loading
                  ? "Loading…"
                  : `${totalStories} ${
                      totalStories === 1 ? "story" : "stories"
                    } available`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasFilter && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap"
                >
                  Clear ×
                </button>
              )}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold bg-white border border-gray-200 rounded-full px-3 py-2 outline-none cursor-pointer text-gray-700 hover:border-gray-300 transition-colors"
              >
                <option value="best">✨ Best</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {error && <ErrorCard message={error} onRetry={fetchStories} />}

          {!error && loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <BookSkeleton key={i} />
              ))}
            </div>
          )}

          {!error && !loading && stories.length === 0 && (
            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center shadow-sm">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <i className="ri-book-open-line text-3xl text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {search ? "No stories match your search" : "No stories yet"}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                {search
                  ? "Try different keywords or browse by category."
                  : "Be the first to share a story."}
              </p>
              <Link
                to="/write"
                className="inline-flex items-center gap-2 bg-[#D9F26B] text-[#0A0A0A] font-bold text-sm px-6 py-3 rounded-full hover:brightness-105 transition-all"
              >
                <i className="ri-quill-pen-line" />
                Write a story
              </Link>
            </div>
          )}

          {!error && !loading && stories.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {stories.map((story) => (
                  <BookCard key={story._id} story={story} size="md" />
                ))}
              </div>

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
        </section>
      </div>

      {/* ══════════ MOBILE BOTTOM NAV ══════════ */}
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
            <Link
              to="/chat"
              className="relative flex flex-col items-center gap-0.5 py-2 px-3 text-gray-400"
            >
              <i className="ri-chat-3-line text-lg" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Chat
              </span>
              <Badge count={unreadMsg} color="lime" />
            </Link>
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

      {/* ══════════ MOBILE MENU DRAWER ══════════ */}
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
                { to: "/search", label: "Discover Writers", icon: "ri-compass-3-line" },
                { to: "/write", label: "Write a Story", icon: "ri-quill-pen-line" },
                { to: `/profile/${user.username}`, label: "My Profile", icon: "ri-user-line" },
                { to: "/settings", label: "Settings", icon: "ri-settings-line" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <i className={`${item.icon} text-gray-500 text-sm`} />
                  </span>
                  {item.label}
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

      {/* ══════════ MOBILE SEARCH OVERLAY ══════════ */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[70] bg-[#F5F5F7] flex flex-col">
          <div className="bg-white shadow-sm">
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => {
                  setMobileSearchOpen(false);
                  setMobileSearchCategory("");
                }}
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

            <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setMobileSearchCategory("")}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  mobileSearchCategory === ""
                    ? "bg-[#0A0A0A] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <i className="ri-apps-line text-[11px]" />
                All
              </button>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() =>
                    setMobileSearchCategory(
                      key === mobileSearchCategory ? "" : key
                    )
                  }
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    mobileSearchCategory === key
                      ? "bg-[#0A0A0A] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <i className={`${cat.icon} text-[11px]`} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500">
                {search
                  ? loading
                    ? "Searching…"
                    : `${mobileSearchResults.length} result${
                        mobileSearchResults.length !== 1 ? "s" : ""
                      }`
                  : mobileSearchCategory
                  ? `${CATEGORIES[mobileSearchCategory]?.label} Stories`
                  : "🔥 Trending Stories"}
              </p>
            </div>

            {search && loading && (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <BookSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && mobileSearchResults.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {mobileSearchResults.slice(0, 30).map((s) => (
                  <div key={s._id} onClick={() => setMobileSearchOpen(false)}>
                    <BookCard story={s} size="sm" />
                  </div>
                ))}
              </div>
            )}

            {!loading && mobileSearchResults.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <i className="ri-search-line text-2xl text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  {search ? `No results for "${search}"` : "No stories found"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try different keywords or category
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};