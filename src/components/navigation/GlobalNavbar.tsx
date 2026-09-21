import { useLocation } from "react-router-dom";

import { DesktopNavbar } from "./DesktopNavbar";
import { MobileBottomNavbar } from "./MobileBottomNavbar";
import { MobileSearchOverlay } from "./MobileSearchOverlay";
import { MobileAccountDrawer } from "./MobileAccountDrawer";

export function GlobalNavbar() {
  const { pathname } = useLocation();

  const compactMobilePages =
    pathname === "/notifications" ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/stories/") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/write") ||
    pathname.startsWith("/search");

  return (
    <>
      <div
        className={`
          fixed top-0 inset-x-0 z-50
          pt-3 sm:pt-4 px-3 sm:px-5
          pointer-events-none select-none
          ${compactMobilePages ? "hidden lg:block" : "block"}
        `}
      >
        <DesktopNavbar />
      </div>

      <MobileBottomNavbar />

      <MobileSearchOverlay />

      <MobileAccountDrawer />
    </>
  );
}

export default GlobalNavbar;