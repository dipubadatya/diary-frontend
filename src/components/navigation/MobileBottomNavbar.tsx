
// import { Link } from "react-router-dom";
// import { useAuth } from "../../contexts/AuthContext";
// import { useNavigation } from "../../contexts/NavigationContext";
// import { NotificationBadge } from "./NotificationBadge";
// import { Avatar } from "./Avatar";
// import { useActiveRoute } from "./useActiveRoute";

// export function MobileBottomNavbar() {
//   const { user } = useAuth();
//   const { unreadMsg, unreadNotif } = useNavigation();
//   const {
//     isWritersActive,
//     isChatActive,
//     isWriteActive,
//     isAlertsActive,
//     isProfileActive,
//   } = useActiveRoute();

//   if (!user) return null;

//   return (
//     <nav
//       className="lg:hidden fixed bottom-0 left-0 right-0 z-40 select-none pointer-events-none"
//       aria-label="Mobile navigation"
//     >
//       <div
//         className="pointer-events-auto px-4"
//         style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
//       >
//         <div className="max-w-md mx-auto">
//           <div className="relative bg-white/95 backdrop-blur-xl rounded-[32px] border border-[#efeef3] shadow-[0_12px_40px_rgba(45,40,70,0.10),0_4px_12px_rgba(45,40,70,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
//             <div className="grid grid-cols-5 items-center gap-0.5 h-[68px] px-2">
//               {/* 1. Writers */}
//               <Link
//                 to="/search"
//                 className="group flex flex-col items-center justify-center gap-1 h-[56px] rounded-[22px] active:scale-[0.96] transition-all duration-200"
//                 aria-label="Writers"
//                 aria-current={isWritersActive ? "page" : undefined}
//               >
//                 <span
//                   className={`flex items-center justify-center w-10 h-10 rounded-[16px] transition-all duration-200 ${
//                     isWritersActive
//                       ? "bg-[#2d2838] text-white shadow-md scale-105"
//                       : "bg-[#f4f2f8] text-[#2d2838] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
//                   }`}
//                 >
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
//                     <path
//                       d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20"
//                       stroke="currentColor"
//                       strokeWidth="1.8"
//                       strokeLinecap="round"
//                     />
//                     <circle cx="10" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
//                     <path
//                       d="M16 4.5a3.5 3.5 0 0 1 0 6.8M20 19.5v-1a4.5 4.5 0 0 0-3-4.25"
//                       stroke="currentColor"
//                       strokeWidth="1.8"
//                       strokeLinecap="round"
//                     />
//                   </svg>
//                 </span>
//                 <span
//                   className={`text-[9px] tracking-wide transition-colors ${
//                     isWritersActive ? "font-bold text-[#2d2838]" : "font-semibold text-[#9b95a8]"
//                   }`}
//                 >
//                   Writers
//                 </span>
//               </Link>

//               {/* 2. Chat */}
//               <Link
//                 to="/chat"
//                 className="group flex flex-col items-center justify-center gap-1 h-[56px] rounded-[22px] active:scale-[0.96] transition-all duration-200"
//                 aria-label="Chat messages"
//                 aria-current={isChatActive ? "page" : undefined}
//               >
//                 <span
//                   className={`relative flex items-center justify-center w-10 h-10 rounded-[16px] transition-all duration-200 ${
//                     isChatActive
//                       ? "bg-[#2d2838] text-white shadow-md scale-105"
//                       : "text-[#9b95a8]"
//                   }`}
//                 >
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
//                     <path
//                       d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H9.2L5 19.2V7.5z"
//                       stroke="currentColor"
//                       strokeWidth="1.8"
//                       strokeLinejoin="round"
//                     />
//                   </svg>
//                   <NotificationBadge count={unreadMsg} variant="mobile-chat" />
//                 </span>
//                 <span
//                   className={`text-[9px] tracking-wide transition-colors ${
//                     isChatActive ? "font-bold text-[#2d2838]" : "font-medium text-[#9b95a8]"
//                   }`}
//                 >
//                   Chat
//                 </span>
//               </Link>

//               {/* 3. Write (center floating CTA) */}
//               <div className="relative flex justify-center items-center h-full">
//                 <Link
//                   to="/write"
//                   className={`absolute -top-5 flex items-center justify-center w-[52px] h-[52px] rounded-[20px] bg-[#2d2838] text-white shadow-[0_12px_28px_rgba(45,40,56,0.32),0_4px_10px_rgba(45,40,56,0.18)] ring-[4px] ring-white hover:scale-[1.04] active:scale-[0.95] transition-transform duration-200 ${
//                     isWriteActive ? "scale-105 ring-[#2d2838]/20" : ""
//                   }`}
//                   aria-label="Write a story"
//                   aria-current={isWriteActive ? "page" : undefined}
//                 >
//                   <span className="absolute inset-0 rounded-[20px] bg-gradient-to-tr from-white/15 via-transparent to-transparent pointer-events-none" />
//                   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="relative" aria-hidden="true">
//                     <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
//                   </svg>
//                 </Link>
//               </div>

//               {/* 4. Alerts */}
//               <Link
//                 to="/notifications"
//                 className="group flex flex-col items-center justify-center gap-1 h-[56px] rounded-[22px] active:scale-[0.96] transition-all duration-200"
//                 aria-label="Notifications"
//                 aria-current={isAlertsActive ? "page" : undefined}
//               >
//                 <span
//                   className={`relative flex items-center justify-center w-10 h-10 rounded-[16px] transition-all duration-200 ${
//                     isAlertsActive
//                       ? "bg-[#2d2838] text-white shadow-md scale-105"
//                       : "text-[#9b95a8]"
//                   }`}
//                 >
//                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
//                     <path
//                       d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"
//                       stroke="currentColor"
//                       strokeWidth="1.8"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     />
//                     <path
//                       d="M10 20a2 2 0 0 0 4 0"
//                       stroke="currentColor"
//                       strokeWidth="1.8"
//                       strokeLinecap="round"
//                     />
//                   </svg>
//                   <NotificationBadge count={unreadNotif} variant="mobile-alerts" />
//                 </span>
//                 <span
//                   className={`text-[9px] tracking-wide transition-colors ${
//                     isAlertsActive ? "font-bold text-[#2d2838]" : "font-medium text-[#9b95a8]"
//                   }`}
//                 >
//                   Alerts
//                 </span>
//               </Link>

//               {/* 5. Me */}
//               <Link
//                 to={`/profile/${user.username}`}
//                 className="group flex flex-col items-center justify-center gap-1 h-[56px] rounded-[22px] active:scale-[0.96] transition-all duration-200"
//                 aria-label="Your profile"
//                 aria-current={isProfileActive ? "page" : undefined}
//               >
//                 <span
//                   className={`flex items-center justify-center w-10 h-10 rounded-[16px] overflow-hidden transition-all duration-200 ${
//                     isProfileActive
//                       ? "ring-[2.5px] ring-[#2d2838] scale-105 shadow-md"
//                       : "ring-[1.5px] ring-[#ebe7f2] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
//                   }`}
//                 >
//                   <Avatar
//                     src={user.image?.url}
//                     alt={user.name || user.username || "User"}
//                     size={40}
//                     className="rounded-[16px] object-cover w-full h-full"
//                   />
//                 </span>
//                 <span
//                   className={`text-[9px] tracking-wide transition-colors ${
//                     isProfileActive ? "font-bold text-[#2d2838]" : "font-medium text-[#9b95a8]"
//                   }`}
//                 >
//                   Me
//                 </span>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// export default MobileBottomNavbar;

import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { NotificationBadge } from "./NotificationBadge";
import { useActiveRoute } from "./useActiveRoute";

export function MobileBottomNavbar() {
  const { user } = useAuth();
  const { unreadMsg, unreadNotif } = useNavigation();
  const {
    isStoriesActive, // Handled as Home
    isWritersActive,
    isChatActive,
    isWriteActive,
    isAlertsActive,
  } = useActiveRoute();

  if (!user) return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 select-none pointer-events-none"
      aria-label="Mobile navigation"
    >
      {/* Premium ambient backdrop glow behind the navbar container */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/[0.08] to-transparent pointer-events-none" />

      <div
        className="pointer-events-auto px-4 relative"
        style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-md mx-auto">
          <div
            className="relative bg-white/90 backdrop-blur-2xl rounded-[28px] border border-black/[0.04] shadow-[0_16px_40px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.8)]"
            style={{ willChange: "transform, box-shadow" }}
          >
            <div className="grid grid-cols-5 items-center justify-items-center h-[66px] px-2 relative">
              
              {/* 1. Home */}
              <Link
                to="/stories"
                className="relative flex flex-col items-center justify-center w-full h-[54px] rounded-2xl active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] [-webkit-tap-highlight-color:transparent]"
                aria-label="Home Feed"
                aria-current={isStoriesActive ? "page" : undefined}
              >
                <div
                  className={`relative flex items-center justify-center w-[46px] h-[30px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isStoriesActive
                      ? "bg-[#111111]/5 text-[#111111] scale-105"
                      : "text-[#8a8a93] hover:text-[#111111]"
                  }`}
                >
                  {isStoriesActive && (
                    <span className="absolute inset-0 bg-[#111111]/5 rounded-full animate-[pillPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]" />
                  )}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="relative z-10 transition-transform duration-300"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 10.182V18.4a2.4 2.4 0 0 0 2.4 2.4h13.2a2.4 2.4 0 0 0 2.4-2.4v-8.218a2.4 2.4 0 0 0-.907-1.879l-6.6-5.28a2.4 2.4 0 0 0-2.986 0l-6.6 5.28A2.4 2.4 0 0 0 3 10.182z"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 15h4"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span
                  className={`text-[9px] mt-1.5 font-bold tracking-wide transition-colors duration-300 ${
                    isStoriesActive ? "text-[#111111]" : "text-[#8a8a93]"
                  }`}
                >
                  Home
                </span>
              </Link>

              {/* 2. Writers */}
              <Link
                to="/search"
                className="relative flex flex-col items-center justify-center w-full h-[54px] rounded-2xl active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] [-webkit-tap-highlight-color:transparent]"
                aria-label="Writers"
                aria-current={isWritersActive ? "page" : undefined}
              >
                <div
                  className={`relative flex items-center justify-center w-[46px] h-[30px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isWritersActive
                      ? "bg-[#111111]/5 text-[#111111] scale-105"
                      : "text-[#8a8a93] hover:text-[#111111]"
                  }`}
                >
                  {isWritersActive && (
                    <span className="absolute inset-0 bg-[#111111]/5 rounded-full animate-[pillPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]" />
                  )}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="relative z-10 transition-transform duration-300"
                    aria-hidden="true"
                  >
                    <path
                      d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                    />
                    <circle cx="10" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.9" />
                    <path
                      d="M16 4.5a3.5 3.5 0 0 1 0 6.8M20 19.5v-1a4.5 4.5 0 0 0-3-4.25"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span
                  className={`text-[9px] mt-1.5 font-bold tracking-wide transition-colors duration-300 ${
                    isWritersActive ? "text-[#111111]" : "text-[#8a8a93]"
                  }`}
                >
                  Writers
                </span>
              </Link>

              {/* 3. Write (center floating CTA) */}
              <div className="relative flex justify-center items-center h-full w-full">
                <Link
                  to="/write"
                  className={`absolute -top-4 flex items-center justify-center w-[48px] h-[48px] rounded-[18px] bg-[#111111] text-white shadow-[0_12px_24px_rgba(0,0,0,0.22)] border border-white/[0.08] hover:scale-105 active:scale-90 active:translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] [-webkit-tap-highlight-color:transparent] ${
                    isWriteActive ? "scale-[1.08] shadow-[0_12px_24px_rgba(0,0,0,0.3)] ring-[4px] ring-[#111111]/10" : ""
                  }`}
                  aria-label="Write a story"
                  aria-current={isWriteActive ? "page" : undefined}
                >
                  <span className="absolute inset-0 rounded-[18px] bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`relative transition-transform duration-300 ${isWriteActive ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </Link>
              </div>

              {/* 4. Chat */}
              <Link
                to="/chat"
                className="relative flex flex-col items-center justify-center w-full h-[54px] rounded-2xl active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] [-webkit-tap-highlight-color:transparent]"
                aria-label="Chat messages"
                aria-current={isChatActive ? "page" : undefined}
              >
                <div
                  className={`relative flex items-center justify-center w-[46px] h-[30px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isChatActive
                      ? "bg-[#111111]/5 text-[#111111] scale-105"
                      : "text-[#8a8a93] hover:text-[#111111]"
                  }`}
                >
                  {isChatActive && (
                    <span className="absolute inset-0 bg-[#111111]/5 rounded-full animate-[pillPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]" />
                  )}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="relative z-10 transition-transform duration-300"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H9.2L5 19.2V7.5z"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <NotificationBadge count={unreadMsg} variant="mobile-chat" />
                </div>
                <span
                  className={`text-[9px] mt-1.5 font-bold tracking-wide transition-colors duration-300 ${
                    isChatActive ? "text-[#111111]" : "text-[#8a8a93]"
                  }`}
                >
                  Chat
                </span>
              </Link>

              {/* 5. Alerts */}
              <Link
                to="/notifications"
                className="relative flex flex-col items-center justify-center w-full h-[54px] rounded-2xl active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] [-webkit-tap-highlight-color:transparent]"
                aria-label="Notifications"
                aria-current={isAlertsActive ? "page" : undefined}
              >
                <div
                  className={`relative flex items-center justify-center w-[46px] h-[30px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isAlertsActive
                      ? "bg-[#111111]/5 text-[#111111] scale-105"
                      : "text-[#8a8a93] hover:text-[#111111]"
                  }`}
                >
                  {isAlertsActive && (
                    <span className="absolute inset-0 bg-[#111111]/5 rounded-full animate-[pillPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]" />
                  )}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="relative z-10 transition-transform duration-300"
                    aria-hidden="true"
                  >
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
                  <NotificationBadge count={unreadNotif} variant="mobile-alerts" />
                </div>
                <span
                  className={`text-[9px] mt-1.5 font-bold tracking-wide transition-colors duration-300 ${
                    isAlertsActive ? "text-[#111111]" : "text-[#8a8a93]"
                  }`}
                >
                  Alerts
                </span>
              </Link>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pillPop {
          0% { transform: scale3d(0.85, 0.85, 1); opacity: 0; }
          60% { transform: scale3d(1.04, 1.04, 1); opacity: 1; }
          100% { transform: scale3d(1, 1, 1); opacity: 1; }
        }
      `}</style>
    </nav>
  );
}

export default MobileBottomNavbar;