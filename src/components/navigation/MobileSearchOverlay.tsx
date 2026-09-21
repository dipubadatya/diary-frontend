import  { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "../../contexts/NavigationContext";
import api from "../../services/api";

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  fantasy: { label: "Fantasy", icon: "ri-magic-line" },
  "random-thoughts": { label: "Thoughts", icon: "ri-bubble-chart-line" },
  poetry: { label: "Poetry", icon: "ri-quill-pen-line" },
  letter: { label: "Letters", icon: "ri-mail-send-line" },
  mystery: { label: "Mystery", icon: "ri-search-eye-line" },
  adventure: { label: "Adventure", icon: "ri-compass-3-line" },
  historical: { label: "Historical", icon: "ri-hourglass-2-line" },
  fiction: { label: "Fiction", icon: "ri-book-open-line" },
};

interface SearchStory {
  _id: string;
  title: string;
  category: string;
  image?: { url: string };
  owner: {
    username: string;
    name: string;
  };
}

export function MobileSearchOverlay() {
  const { mobileSearchOpen, setMobileSearchOpen } = useNavigation();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<SearchStory[]>([]);
  const [loading, setLoading] = useState(false);

  // Lock body scroll when overlay is active
  useEffect(() => {
    if (mobileSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setSearchInput("");
      setCategory("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSearchOpen]);

  // Perform search query
  const executeSearch = useCallback(async (q: string, cat: string) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 12 };
      if (q.trim()) params.search = q.trim();
      if (cat) params.category = cat;

      const res = await api.get("/stories", { params });
      if (res.data?.success) {
        setResults(res.data.stories || []);
      }
    } catch {
      // Fail gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (!mobileSearchOpen) return;
    const timer = setTimeout(() => {
      executeSearch(searchInput, category);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, category, mobileSearchOpen, executeSearch]);

  if (!mobileSearchOpen) return null;

  const handleSelectStory = (storyId: string) => {
    setMobileSearchOpen(false);
    navigate(`/stories/${storyId}`);
  };

  const handleViewAllInStories = () => {
    setMobileSearchOpen(false);
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set("search", searchInput.trim());
    if (category) params.set("category", category);
    navigate(`/stories?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#FAFAFA] flex flex-col lg:hidden select-none">
      {/* Sticky header */}
      <div
        className="shrink-0 bg-white/95 backdrop-blur-2xl border-b border-black/[0.04] z-10"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 active:scale-90 transition-all shrink-0"
            aria-label="Close search"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleViewAllInStories();
              }}
            >
              <input
                type="search"
                placeholder="Search stories..."
                autoFocus
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-full bg-neutral-100 text-[15px] font-medium text-neutral-900 placeholder:text-neutral-400 outline-none border-2 border-transparent focus:bg-white focus:border-neutral-900/10 transition-all"
                aria-label="Search stories input"
              />
            </form>

            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-200/90 text-neutral-600 flex items-center justify-center active:scale-90 transition-all"
                aria-label="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
        className="flex-1 overflow-y-auto px-4 pt-4 bg-[#FAFAFA]"
        style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[11px] font-bold tracking-[0.1em] uppercase text-neutral-400 flex items-center gap-1.5">
            {searchInput || category ? (
              loading ? (
                "Searching…"
              ) : (
                `${results.length} result${results.length === 1 ? "" : "s"}`
              )
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Featured stories
              </>
            )}
          </h3>

          {(searchInput || category) && (
            <button
              type="button"
              onClick={handleViewAllInStories}
              className="text-[12px] font-bold text-neutral-600 hover:text-neutral-900 active:scale-95 transition-all"
            >
              See all in feed →
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-neutral-200/60 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2.5">
            {results.map((story) => (
              <div
                key={story._id}
                onClick={() => handleSelectStory(story._id)}
                className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-black/[0.04] shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                {story.image?.url ? (
                  <img
                    src={story.image.url}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="2" strokeLinecap="round" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {story.title}
                  </p>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    by {story.owner?.name || story.owner?.username || "Anonymous"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-neutral-600">No stories found</p>
            <p className="text-xs text-neutral-400 mt-1">Try a different search term or category</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileSearchOverlay;
