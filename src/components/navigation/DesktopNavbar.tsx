import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import DiaryLogo from "../DiaryLogo";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { NotificationBadge } from "./NotificationBadge";
import { ProfileMenu } from "./ProfileMenu";
import { Avatar } from "./Avatar";
import { useActiveRoute } from "./useActiveRoute";

export function DesktopNavbar() {
  const { user } = useAuth();
  const { unreadMsg, unreadNotif, setMobileMenuOpen, setMobileSearchOpen } =
    useNavigation();
  const { isStoriesActive, isWritersActive } = useActiveRoute();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync search input with URL search param when on /stories
  useEffect(() => {
    if (location.pathname === "/stories") {
      setSearchInput(searchParams.get("search") || "");
    }
  }, [location.pathname, searchParams]);

  // Cmd+K shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (location.pathname === "/stories") {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set("search", query);
      } else {
        params.delete("search");
      }
      navigate(`/stories?${params.toString()}`);
    } else {
      if (query) {
        navigate(`/stories?search=${encodeURIComponent(query)}`);
      } else {
        navigate("/stories");
      }
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    if (location.pathname === "/stories" && searchParams.has("search")) {
      const params = new URLSearchParams(searchParams);
      params.delete("search");
      navigate(`/stories?${params.toString()}`);
    }
  };

  return (
    <header className="pointer-events-auto max-w-7xl mx-auto  h-14 sm:h-[64px] bg-white rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] flex items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-4">
      {/* Left: logo + tabs */}
      <div className="flex items-center gap-3 lg:gap-6 min-w-0 shrink-0">
        <Link
          to={user ? "/stories" : "/"}
          className="flex items-center shrink-0 pl-1 hover:opacity-80 transition-opacity active:scale-95"
          aria-label="Diary Home"
        >
          <DiaryLogo />
        </Link>

        {/* Desktop primary tabs */}
        <nav
          className="hidden lg:flex items-center bg-[#f4f5f7] p-1 rounded-full"
          aria-label="Primary"
        >
          <Link
            to="/stories"
            className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-colors ${
              isStoriesActive
                ? "text-white bg-[#111] shadow-sm"
                : "text-[#888] hover:text-[#111]"
            }`}
          >
            Stories
          </Link>
          <Link
            to="/search"
            className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-colors ${
              isWritersActive
                ? "text-white bg-[#111] shadow-sm"
                : "text-[#888] hover:text-[#111]"
            }`}
          >
            Writers
          </Link>
        </nav>
      </div>

      {/* Center: search stories input (tablet+) */}
      <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-1 sm:mx-2">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative w-full flex items-center h-10 bg-[#f4f5f7] rounded-full border-2 border-transparent focus-within:border-[#111]/10 focus-within:bg-white transition-all duration-300">
            <svg
              className="absolute left-3.5 text-[#888] pointer-events-none"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>

            <input
              ref={searchInputRef}
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
                onClick={clearSearch}
                className="absolute right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-[#e5e7eb] text-[#111] hover:bg-[#d1d5db] active:scale-90 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
        </form>
      </div>

      {/* Right: navigation actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile search trigger (phone) */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden w-10 h-10 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#111] active:scale-95 transition-transform cursor-pointer"
          aria-label="Open search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H9.2L5 19.2V7.5z"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinejoin="round"
                />
              </svg>
              <NotificationBadge count={unreadMsg} variant="desktop" />
            </Link>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative hidden sm:flex w-10 h-10 rounded-full bg-[#f4f5f7] items-center justify-center text-[#111] hover:bg-[#e8e9eb] active:scale-95 transition-all"
              aria-label="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
              <NotificationBadge count={unreadNotif} variant="desktop" />
            </Link>

            {/* Write CTA button */}
            <Link
              to="/write"
              className="hidden md:inline-flex items-center h-10 gap-1.5 px-4 sm:px-5 rounded-full bg-[#111] text-white text-[13px] font-bold hover:bg-[#333] active:scale-95 transition-all shadow-[0_6px_16px_rgba(0,0,0,0.14)]"
            >
              Write
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </Link>

            <div className="hidden lg:block w-px h-5 bg-[#e8e8e8] mx-1" aria-hidden="true" />

            {/* Desktop profile dropdown */}
            <ProfileMenu />

            {/* Mobile menu trigger (phone & tablet) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
              aria-label="Open user menu"
            >
              <Avatar
                src={user.image?.url}
                alt={user.name || user.username || "User"}
                size={36}
                className="rounded-full object-cover"
              />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default DesktopNavbar;
