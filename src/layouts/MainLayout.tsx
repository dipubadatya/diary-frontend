import { Outlet, useLocation } from "react-router-dom";
import { GlobalNavbar } from "../components/navigation/GlobalNavbar";

export function MainLayout() {
  const { pathname } = useLocation();

const compactMobilePages =
  pathname === "/notifications" ||
  pathname.startsWith("/profile/") ||
  pathname.startsWith("/stories/") ||
  pathname.startsWith("/diary/") ||
  pathname.startsWith("/search") ||
  pathname.startsWith("/write") ||
  pathname.startsWith("/chat");
  const isChat =
    pathname === "/chat" || pathname.startsWith("/chat");

  const isWrite =
    pathname === "/write" || pathname.startsWith("/write");

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <GlobalNavbar />

    <main
      className={`
        flex-1 w-full
        ${
          isChat
            ? "flex flex-col h-[calc(100dvh-76px)] lg:h-screen pt-0 lg:pt-[84px] lg:pb-3 overflow-hidden min-h-0"
            : compactMobilePages
              ? "pt-0 lg:pt-[88px] pb-[100px] lg:pb-8"
              : isWrite
                ? "pt-[76px] sm:pt-[88px] pb-24 lg:pb-8"
                : "pt-[76px] sm:pt-[88px] pb-[100px] lg:pb-8"
        }
        transition-all
      `}
    >
      <Outlet />
    </main>
    </div>
  );
}

export default MainLayout;