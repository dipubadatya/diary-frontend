import  { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "./Avatar";

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  // Close on Escape key or outside click
  useEffect(() => {
    if (!profileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      if (logout) await logout();
      navigate("/login");
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative hidden lg:block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setProfileOpen((open) => !open)}
        className="flex items-center rounded-full ring-2 ring-transparent hover:ring-[#f0f0f0] active:scale-95 transition-all focus:outline-none focus-visible:ring-[#111]/20 cursor-pointer"
        aria-label="Open profile menu"
        aria-expanded={profileOpen}
        aria-haspopup="menu"
      >
        <Avatar
          src={user.image?.url}
          alt={user.name || user.username || "User"}
          size={36}
          className="rounded-full object-cover"
        />
      </button>

      {profileOpen && (
        <div
          className="absolute right-0 mt-3 z-50 w-56 bg-white rounded-[20px] border border-[#f0f0f0] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.14)] p-1.5 animate-in fade-in zoom-in-95 duration-150"
          role="menu"
          aria-label="User navigation"
        >
          <div className="px-3.5 py-2.5 bg-[#f6f7f9] rounded-[14px] mb-1 select-none">
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
            onClick={handleLogout}
            className="w-full text-left flex items-center px-3.5 py-2.5 rounded-[12px] text-[13px] font-bold text-[#e5484d] hover:bg-[#fff1f0] transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
