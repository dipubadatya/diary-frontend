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
      compactMobilePages
        ? "pt-0 lg:pt-[88px]"
        : "pt-[76px] sm:pt-[88px]"
    }
    ${
      isChat
        ? "flex flex-col h-[calc(100dvh-76px)] sm:h-[calc(100dvh-88px)] overflow-hidden"
        : isWrite
          ? "pb-24 lg:pb-8"
          : "pb-[100px] lg:pb-8"
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