import  { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { Avatar } from "./Avatar";

export function MobileAccountDrawer() {
  const { user, logout } = useAuth();
  const { mobileMenuOpen, setMobileMenuOpen } = useNavigation();
  const navigate = useNavigate();

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Handle escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  if (!mobileMenuOpen || !user) return null;

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    try {
      if (logout) await logout();
      navigate("/login");
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a1520]/40 backdrop-blur-[6px] transition-opacity duration-200"
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out sheet */}
      <div className="absolute right-0 top-0 bottom-0 w-[min(100%,300px)] bg-[#fffdf9] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
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
                    alt={user.name || user.username || "User"}
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
              aria-label="Close menu"
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

        {/* Drawer navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-stone-400">
            Account
          </p>

          <div className="space-y-0.5">
            <Link
              to={`/profile/${user.username}`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-[#1a1520] hover:bg-amber-50/70 active:bg-amber-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">Your profile</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Stories & followers</p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-stone-300 shrink-0"
                aria-hidden="true"
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

            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-[#1a1520] hover:bg-amber-50/70 active:bg-amber-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">Settings</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Preferences & security</p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-stone-300 shrink-0"
                aria-hidden="true"
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
          </div>
        </nav>

        {/* Drawer footer with sign out */}
        <div
          className="p-4 border-t border-stone-200/70 bg-white/80"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-11 rounded-full text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200/80 hover:text-[#1a1520] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileAccountDrawer;
