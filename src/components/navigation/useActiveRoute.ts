import { useLocation } from "react-router-dom";

export function useActiveRoute() {
  const location = useLocation();
  const path = location.pathname;

  const isStoriesActive = path === "/stories" || path.startsWith("/stories/");
  const isWritersActive = path === "/search" || path.startsWith("/search");
  const isChatActive = path === "/chat" || path.startsWith("/chat");
  const isAlertsActive = path === "/notifications" || path.startsWith("/notifications");
  const isWriteActive = path === "/write" || path.startsWith("/write");
  const isProfileActive = path.startsWith("/profile");
  const isSettingsActive = path === "/settings" || path.startsWith("/settings");

  return {
    pathname: path,
    isStoriesActive,
    isWritersActive,
    isChatActive,
    isAlertsActive,
    isWriteActive,
    isProfileActive,
    isSettingsActive,
  };
}

export default useActiveRoute;
