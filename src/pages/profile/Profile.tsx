// // src/pages/Profile.tsx
// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
//   useMemo,
// } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import Cropper from "cropperjs";
// import "cropperjs/dist/cropper.css";
// import {
//   Settings,
//   MessageCircle,
//   Camera,
//   X,
//   Check,
//   Eye,
//   Heart,
//   Calendar,
//   BookOpen,
//   Users,
//   Loader2,
//   Plus,
//   Feather,
//   ChevronRight,
//   CheckCircle2,
//   Image as ImageIcon,
//   Trash2,
//   Grid3X3,
//   List,
//   AlertCircle,
// } from "lucide-react";

// import { useAuth } from "../../contexts/AuthContext";
// import api from "../../services/api";
// import { ErrorCard } from "../../components/ErrorCard";

// /* ============================================================================
//  * Types
//  * ========================================================================== */

// interface Story {
//   _id: string;
//   title: string;
//   story: string;
//   category: string;
//   image?: { url: string };
//   views: string[];
//   likedBy: string[];
//   timeStamp: string;
//   owner?: {
//     _id?: string;
//     username: string;
//     name: string;
//     image?: { url: string };
//   };
// }

// interface ProfileData {
//   _id: string;
//   name: string;
//   username: string;
//   email: string;
//   bio?: string;
//   image?: { url: string; filename: string };
//   banner?: { url: string; filename: string };
//   followersCount: number;
//   followingCount: number;
//   storiesCount: number;
//   createdAt: string;
// }

// interface FollowUser {
//   _id: string;
//   name: string;
//   username: string;
//   bio?: string;
//   image?: { url: string };
// }

// type AlertType = "success" | "error" | "info";
// type AlertState = { type: AlertType; message: string } | null;
// type TabKey = "writings" | "liked" | "about";
// type StoriesView = "grid" | "list";
// type FollowModalType = "followers" | "following";

// /* ============================================================================
//  * Constants
//  * ========================================================================== */

// const MAX_PROFILE_IMAGE_MB = 5;
// const MAX_BANNER_IMAGE_MB = 5;
// const MAX_PROFILE_BYTES = MAX_PROFILE_IMAGE_MB * 1024 * 1024;
// const MAX_BANNER_BYTES = MAX_BANNER_IMAGE_MB * 1024 * 1024;

// const ACCEPTED_IMAGE_TYPES = [
//   "image/jpeg",
//   "image/jpg",
//   "image/png",
//   "image/webp",
//   "image/gif",
// ] as const;

// const PROFILE_FILTERS = [
//   { name: "Original", value: "none" },
//   { name: "Classic", value: "contrast(130%) brightness(100%) saturate(120%)" },
//   {
//     name: "Cinema",
//     value: "contrast(150%) saturate(100%) brightness(90%) sepia(20%)",
//   },
//   {
//     name: "Golden",
//     value: "hue-rotate(60deg) saturate(120%) brightness(110%)",
//   },
//   { name: "Noir", value: "grayscale(100%) contrast(180%) brightness(75%)" },
//   { name: "Moody", value: "contrast(150%) brightness(80%) saturate(140%)" },
//   {
//     name: "Warmth",
//     value: "sepia(40%) saturate(130%) contrast(110%) brightness(100%)",
//   },
//   { name: "Cool", value: "hue-rotate(210deg) brightness(95%) saturate(140%)" },
//   { name: "Retro", value: "grayscale(60%) sepia(50%) contrast(120%)" },
//   { name: "Vivid", value: "contrast(140%) brightness(140%) saturate(130%)" },
//   { name: "Crisp", value: "contrast(200%) brightness(120%) saturate(100%)" },
// ];

// const BANNER_FILTERS = [
//   { name: "Original", value: "none" },
//   { name: "Classic", value: "contrast(130%)" },
//   { name: "Film", value: "grayscale(100%)" },
//   { name: "Warm", value: "sepia(50%)" },
//   { name: "Vivid", value: "contrast(140%) saturate(130%)" },
// ];

// const ALERT_TIMEOUT_MS = 4000;
// const STICKY_TAB_TOP_OFFSET = "56px";

// /* ============================================================================
//  * Utilities
//  * ========================================================================== */

// const timeAgo = (dateStr: string): string => {
//   const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
//   if (seconds < 60) return "Just now";
//   const minutes = Math.floor(seconds / 60);
//   if (minutes < 60) return `${minutes}m ago`;
//   const hours = Math.floor(minutes / 60);
//   if (hours < 24) return `${hours}h ago`;
//   const days = Math.floor(hours / 24);
//   if (days < 7) return `${days}d ago`;
//   if (days < 30) return `${Math.floor(days / 7)}w ago`;
//   if (days < 365) return `${Math.floor(days / 30)}mo ago`;
//   return `${Math.floor(days / 365)}y ago`;
// };

// const formatJoinDate = (dateStr: string): string => {
//   try {
//     return new Date(dateStr).toLocaleDateString("en-US", {
//       month: "long",
//       year: "numeric",
//     });
//   } catch {
//     return "";
//   }
// };

// const formatNumber = (n: number): string => {
//   if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
//   if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
//   return String(n);
// };

// const formatBytes = (bytes: number): string => {
//   if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
//   return `${(bytes / 1024).toFixed(0)}KB`;
// };

// const avatarUrl = (name: string): string =>
//   `https://ui-avatars.com/api/?name=${encodeURIComponent(
//     name,
//   )}&background=f1f5f9&color=475569&bold=true&size=200`;

// const validateImageFile = (
//   file: File,
//   maxBytes: number,
//   allowGif = false,
// ): string | null => {
//   const allowed = allowGif
//     ? ACCEPTED_IMAGE_TYPES
//     : ACCEPTED_IMAGE_TYPES.filter((t) => t !== "image/gif");

//   if (!(allowed as readonly string[]).includes(file.type)) {
//     return allowGif
//       ? "Invalid file type. Please choose a JPG, PNG, WEBP, or GIF image."
//       : "Invalid file type. Please choose a JPG, PNG, or WEBP image.";
//   }

//   if (file.size > maxBytes) {
//     return `File is too large (${formatBytes(file.size)}). Maximum allowed size is ${formatBytes(maxBytes)}.`;
//   }

//   return null;
// };

// const canvasToBlob = (
//   canvas: HTMLCanvasElement,
//   type = "image/jpeg",
//   quality = 0.88,
// ): Promise<Blob> =>
//   new Promise((resolve, reject) =>
//     canvas.toBlob(
//       (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
//       type,
//       quality,
//     ),
//   );

// const extractUploadError = (err: any, maxMB: number): string => {
//   const serverMsg: string | undefined = err?.response?.data?.error;
//   const status = err?.response?.status;
//   const lower = serverMsg?.toLowerCase() ?? "";

//   if (status === 413 || lower.includes("size") || lower.includes("large")) {
//     return `File too large. Please use an image under ${maxMB}MB.`;
//   }
//   return serverMsg || "Upload failed. Check your connection and try again.";
// };

// /* ============================================================================
//  * Small Presentational Components
//  * ========================================================================== */

// const InlineAlert: React.FC<{
//   alert: AlertState;
//   onDismiss: () => void;
// }> = ({ alert, onDismiss }) => {
//   useEffect(() => {
//     if (!alert) return;
//     const timer = setTimeout(onDismiss, ALERT_TIMEOUT_MS);
//     return () => clearTimeout(timer);
//   }, [alert, onDismiss]);

//   if (!alert) return null;

//   const styles: Record<
//     AlertType,
//     { bg: string; icon: React.ReactNode; text: string }
//   > = {
//     success: {
//       bg: "bg-emerald-50 border-emerald-200",
//       icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
//       text: "text-emerald-800",
//     },
//     error: {
//       bg: "bg-red-50 border-red-200",
//       icon: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
//       text: "text-red-700",
//     },
//     info: {
//       bg: "bg-blue-50 border-blue-200",
//       icon: <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />,
//       text: "text-blue-700",
//     },
//   };

//   const cfg = styles[alert.type];

//   return (
//     <div
//       className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${cfg.bg} mb-3 animate-fadeIn`}
//     >
//       {cfg.icon}
//       <p className={`text-[13px] font-medium flex-1 ${cfg.text}`}>
//         {alert.message}
//       </p>
//       <button
//         onClick={onDismiss}
//         className="opacity-40 hover:opacity-70 transition-opacity ml-1"
//         aria-label="Dismiss"
//       >
//         <X className="w-3.5 h-3.5" />
//       </button>
//     </div>
//   );
// };

// const FieldError: React.FC<{ message: string | null }> = ({ message }) => {
//   if (!message) return null;
//   return (
//     <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
//       <AlertCircle
//         className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
//         strokeWidth={2}
//       />
//       <p className="text-[12.5px] text-red-600 font-medium leading-relaxed">
//         {message}
//       </p>
//     </div>
//   );
// };

// const SizeHint: React.FC<{ mb: number; formats: string }> = ({
//   mb,
//   formats,
// }) => (
//   <p className="text-[10.5px] text-gray-400 text-center">
//     Max file size: <span className="font-semibold">{mb}MB</span> · {formats}
//   </p>
// );

// const StatBlock: React.FC<{
//   icon: React.ReactNode;
//   label: string;
//   value: string;
// }> = ({ icon, label, value }) => (
//   <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
//     <div className="flex-shrink-0">{icon}</div>
//     <div className="min-w-0">
//       <p className="text-[10px] text-gray-400 font-medium">{label}</p>
//       <p className="text-[13px] font-bold text-gray-900 truncate">{value}</p>
//     </div>
//   </div>
// );

// const LightboxModal: React.FC<{
//   onClose: () => void;
//   children: React.ReactNode;
// }> = ({ onClose, children }) => (
//   <div
//     className="fixed inset-0 z-[100] flex items-center justify-center p-4"
//     style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
//     onClick={onClose}
//   >
//     <div className="relative" onClick={(e) => e.stopPropagation()}>
//       <button
//         onClick={onClose}
//         className="absolute -top-11 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
//         style={{ background: "rgba(255,255,255,0.15)" }}
//         aria-label="Close"
//       >
//         <X className="w-4 h-4" strokeWidth={2.5} />
//       </button>
//       {children}
//     </div>
//   </div>
// );

// const BottomSheetModal: React.FC<{
//   title: string;
//   onClose: () => void;
//   children: React.ReactNode;
//   maxW?: string;
//   headerExtra?: React.ReactNode;
//   className?: string;
// }> = ({
//   title,
//   onClose,
//   children,
//   maxW = "max-w-md",
//   headerExtra,
//   className = "",
// }) => (
//     <div
//       className={`fixed inset-0 z-[110] flex items-end sm:items-center justify-center ${className}`}
//       style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
//       onClick={(e) => e.target === e.currentTarget && onClose()}
//     >
//       <div
//         className={`bg-white w-full ${maxW} sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-xl border border-gray-100 animate-slideUp`}
//       >
//         <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
//           <h2 className="text-[14px] font-bold text-gray-900">{title}</h2>
//           <div className="flex items-center gap-2">
//             {headerExtra}
//             <button
//               onClick={onClose}
//               className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
//               aria-label="Close"
//             >
//               <X className="w-4 h-4" strokeWidth={2.5} />
//             </button>
//           </div>
//         </div>
//         <div className="w-8 h-1 rounded-full bg-gray-200 mx-auto mt-2 sm:hidden" />
//         {children}
//       </div>
//     </div>
//   );

// interface StoryCardProps {
//   story: Story;
//   showUnlike?: boolean;
//   onUnlike?: (storyId: string) => void;
// }

// const GridStoryCard: React.FC<StoryCardProps> = ({
//   story,
//   showUnlike = false,
//   onUnlike,
// }) => (
//   <div className="relative group/card">
//     <Link
//       to={`/stories/${story._id}`}
//       className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 active:scale-[0.98]"
//     >
//       <div
//         className="relative w-full bg-gray-100 overflow-hidden"
//         style={{ aspectRatio: "4/3" }}
//       >
//         {story.image?.url ? (
//           <img
//             src={story.image.url}
//             alt={story.title}
//             loading="lazy"
//             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
//           />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center bg-gray-50">
//             <Feather className="w-7 h-7 text-gray-200" strokeWidth={1.5} />
//           </div>
//         )}
//         {story.category && (
//           <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-gray-600 backdrop-blur-sm">
//             {story.category}
//           </span>
//         )}
//         {showUnlike && onUnlike && (
//           <button
//             type="button"
//             onClick={(e) => {
//               e.preventDefault();
//               e.stopPropagation();
//               onUnlike(story._id);
//             }}
//             className="absolute top-2 right-2 p-1.5 rounded-full bg-white/95 hover:bg-white text-rose-500 hover:text-rose-600 shadow-sm backdrop-blur-sm transition-all hover:scale-110 active:scale-90 z-10 border border-gray-100"
//             title="Unlike story"
//             aria-label="Unlike story"
//           >
//             <Heart className="w-3.5 h-3.5 fill-rose-500" strokeWidth={1.8} />
//           </button>
//         )}
//       </div>
//       <div className="p-3">
//         {story.owner && (
//           <p className="text-[10px] text-gray-400 truncate mb-1">
//             by <span className="font-semibold text-gray-600">@{story.owner.username}</span>
//           </p>
//         )}
//         <h3 className="text-[12.5px] font-bold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-gray-600 transition-colors">
//           {story.title}
//         </h3>
//         <div className="flex items-center justify-between">
//           <span className="text-[10px] text-gray-400">
//             {timeAgo(story.timeStamp)}
//           </span>
//           <div className="flex items-center gap-2">
//             <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
//               <Eye className="w-3 h-3" strokeWidth={1.8} />
//               {formatNumber(story.views?.length || 0)}
//             </span>
//             <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
//               <Heart className="w-3 h-3" strokeWidth={1.8} />
//               {formatNumber(story.likedBy?.length || 0)}
//             </span>
//           </div>
//         </div>
//       </div>
//     </Link>
//   </div>
// );

// const ListStoryCard: React.FC<StoryCardProps> = ({
//   story,
//   showUnlike = false,
//   onUnlike,
// }) => (
//   <div className="relative group/card flex items-center bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-sm transition-all duration-200">
//     <Link
//       to={`/stories/${story._id}`}
//       className="group flex-1 flex items-center gap-3 min-w-0"
//     >
//       <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
//         {story.image?.url ? (
//           <img
//             src={story.image.url}
//             alt={story.title}
//             loading="lazy"
//             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
//           />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center">
//             <Feather className="w-5 h-5 text-gray-200" strokeWidth={1.5} />
//           </div>
//         )}
//       </div>
//       <div className="flex-1 min-w-0 pr-2">
//         <div className="flex items-center gap-1.5 mb-1 flex-wrap">
//           {story.category && (
//             <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
//               {story.category}
//             </span>
//           )}
//           {story.owner && (
//             <>
//               <span className="text-[9px] text-gray-300">·</span>
//               <span className="text-[10px] text-gray-400 truncate">
//                 @{story.owner.username}
//               </span>
//             </>
//           )}
//           <span className="text-[9px] text-gray-300">·</span>
//           <span className="text-[10px] text-gray-400">
//             {timeAgo(story.timeStamp)}
//           </span>
//         </div>
//         <h3 className="text-[13px] font-bold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-gray-600 transition-colors">
//           {story.title}
//         </h3>
//         <div className="flex items-center gap-3">
//           <span className="flex items-center gap-1 text-[10.5px] text-gray-400">
//             <Eye className="w-3 h-3" strokeWidth={1.8} />
//             {formatNumber(story.views?.length || 0)}
//           </span>
//           <span className="flex items-center gap-1 text-[10.5px] text-gray-400">
//             <Heart className="w-3 h-3" strokeWidth={1.8} />
//             {formatNumber(story.likedBy?.length || 0)}
//           </span>
//         </div>
//       </div>
//     </Link>
//     <div className="flex items-center gap-2 flex-shrink-0">
//       {showUnlike && onUnlike && (
//         <button
//           type="button"
//           onClick={(e) => {
//             e.preventDefault();
//             e.stopPropagation();
//             onUnlike(story._id);
//           }}
//           className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 transition-all active:scale-90"
//           title="Unlike story"
//           aria-label="Unlike story"
//         >
//           <Heart className="w-4 h-4 fill-rose-500" strokeWidth={1.8} />
//         </button>
//       )}
//       <Link to={`/stories/${story._id}`}>
//         <ChevronRight
//           className="w-4 h-4 text-gray-200 hover:text-gray-400 transition-colors"
//           strokeWidth={2}
//         />
//       </Link>
//     </div>
//   </div>
// );

// /* ============================================================================
//  * Main Component
//  * ========================================================================== */

// export const Profile: React.FC = () => {
//   const { username } = useParams<{ username: string }>();
//   const { user: currentUser, login } = useAuth();
//   const navigate = useNavigate();

//   // ── Core state ────────────────────────────────────────────────────────────
//   const [profile, setProfile] = useState<ProfileData | null>(null);
//   const [stories, setStories] = useState<Story[]>([]);
//   const [isFollowing, setIsFollowing] = useState(false);
//   const [followsMe, setFollowsMe] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [pageError, setPageError] = useState<string | null>(null);
//   const [followLoading, setFollowLoading] = useState(false);

//   // ── UI state ──────────────────────────────────────────────────────────────
//   const [activeTab, setActiveTab] = useState<TabKey>("writings");
//   const [storiesView, setStoriesView] = useState<StoriesView>("grid");
//   const [alert, setAlert] = useState<AlertState>(null);
//   const [bannerViewOpen, setBannerViewOpen] = useState(false);
//   const [profileViewOpen, setProfileViewOpen] = useState(false);

//   // ── Liked stories state ───────────────────────────────────────────────────
//   const [likedStories, setLikedStories] = useState<Story[]>([]);
//   const [loadingLiked, setLoadingLiked] = useState<boolean>(false);
//   const [hasLoadedLiked, setHasLoadedLiked] = useState<boolean>(false);
//   const [likedCount, setLikedCount] = useState<number>(0);

//   // ── Followers/Following modal ─────────────────────────────────────────────
//   const [modalType, setModalType] = useState<FollowModalType | null>(null);
//   const [modalUsers, setModalUsers] = useState<FollowUser[]>([]);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [modalError, setModalError] = useState<string | null>(null);

//   // ── Profile image editor ──────────────────────────────────────────────────
//   const [profileEditOpen, setProfileEditOpen] = useState(false);
//   const [profileUploading, setProfileUploading] = useState(false);
//   const [profileFilter, setProfileFilter] = useState("none");
//   const [profileEditError, setProfileEditError] = useState<string | null>(null);
//   const [profileHasImage, setProfileHasImage] = useState(false);
//   const [profileFileInfo, setProfileFileInfo] = useState<{
//     name: string;
//     size: string;
//   } | null>(null);
//   const profilePreviewRef = useRef<HTMLImageElement>(null);
//   const profileInputRef = useRef<HTMLInputElement>(null);
//   const profileCropperRef = useRef<Cropper | null>(null);

//   // ── Banner editor ─────────────────────────────────────────────────────────
//   const [bannerEditOpen, setBannerEditOpen] = useState(false);
//   const [bannerUploading, setBannerUploading] = useState(false);
//   const [bannerFilter, setBannerFilter] = useState("none");
//   const [bannerSelected, setBannerSelected] = useState(false);
//   const [bannerEditError, setBannerEditError] = useState<string | null>(null);
//   const [bannerIsGif, setBannerIsGif] = useState(false);
//   const [bannerGifFile, setBannerGifFile] = useState<File | null>(null);
//   const [bannerGifPreviewUrl, setBannerGifPreviewUrl] = useState<string | null>(
//     null,
//   );
//   const [bannerFileInfo, setBannerFileInfo] = useState<{
//     name: string;
//     size: string;
//   } | null>(null);
//   const bannerPreviewRef = useRef<HTMLImageElement>(null);
//   const bannerInputRef = useRef<HTMLInputElement>(null);
//   const bannerCropperRef = useRef<Cropper | null>(null);

//   // ── Derived values ────────────────────────────────────────────────────────
//   const isSelf = !!currentUser && !!profile && profile._id === currentUser._id;

//   const reversedStories = useMemo(() => [...stories].reverse(), [stories]);

//   const totalViews = useMemo(
//     () => stories.reduce((sum, s) => sum + (s.views?.length || 0), 0),
//     [stories],
//   );

//   const totalLikes = useMemo(
//     () => stories.reduce((sum, s) => sum + (s.likedBy?.length || 0), 0),
//     [stories],
//   );

//   const showAlert = useCallback((type: AlertType, message: string) => {
//     setAlert({ type, message });
//   }, []);

//   /* ── Cleanup on unmount: destroy active cropper instances ──────────── */
//   useEffect(() => {
//     return () => {
//       profileCropperRef.current?.destroy();
//       bannerCropperRef.current?.destroy();
//     };
//   }, []);

//   /* ── Cleanup Object URL separately to avoid stale unmount closures ── */
//   useEffect(() => {
//     return () => {
//       if (bannerGifPreviewUrl) {
//         URL.revokeObjectURL(bannerGifPreviewUrl);
//       }
//     };
//   }, [bannerGifPreviewUrl]);

//   /* ── Fetch profile ──────────────────────────────────────────────────────── */
//   const fetchProfile = useCallback(async () => {
//     if (!username) return;
//     setLoading(true);
//     setPageError(null);
//     try {
//       const res = await api.get(`/users/profile/${username}`);
//       if (res.data.success) {
//         setProfile(res.data.profile);
//         setStories(res.data.stories || []);
//         setIsFollowing(!!res.data.isFollowing);
//         setFollowsMe(!!res.data.followsMe);
//         if (res.data.stats?.likedStoriesCount !== undefined) {
//           setLikedCount(res.data.stats.likedStoriesCount);
//         }
//       } else {
//         setPageError("This profile could not be loaded.");
//       }
//     } catch (err: any) {
//       const msg =
//         err?.response?.status === 404
//           ? "This user does not exist."
//           : err?.response?.data?.error ||
//           "Something went wrong loading this profile.";
//       setPageError(msg);
//     } finally {
//       setLoading(false);
//     }
//   }, [username]);

//   /* ── Fetch liked stories ────────────────────────────────────────────────── */
//   const fetchLikedStories = useCallback(async () => {
//     if (!username) return;
//     setLoadingLiked(true);
//     try {
//       const res = await api.get(`/users/profile/${username}/liked`);
//       if (res.data.success) {
//         setLikedStories(res.data.stories || []);
//         setLikedCount(
//           res.data.pagination?.totalStories ?? res.data.stories?.length ?? 0,
//         );
//         setHasLoadedLiked(true);
//       }
//     } catch (err: any) {
//       console.error("Failed to load liked stories:", err);
//     } finally {
//       setLoadingLiked(false);
//     }
//   }, [username]);

//   /* ── Unlike a story ─────────────────────────────────────────────────────── */
//   const handleUnlike = useCallback(
//     async (storyId: string) => {
//       // Optimistic removal from liked list
//       setLikedStories((prev) => prev.filter((s) => s._id !== storyId));
//       setLikedCount((prev) => Math.max(0, prev - 1));

//       try {
//         const res = await api.post(`/stories/${storyId}/likes`);
//         if (res.data.success) {
//           showAlert("success", "Story unliked.");
//         } else {
//           fetchLikedStories();
//           showAlert("error", "Could not unlike story. Please try again.");
//         }
//       } catch (err: any) {
//         fetchLikedStories();
//         showAlert(
//           "error",
//           err?.response?.data?.error ||
//           err?.message ||
//           "Failed to unlike story.",
//         );
//       }
//     },
//     [fetchLikedStories, showAlert],
//   );

//   useEffect(() => {
//     fetchProfile();
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }, [fetchProfile]);

//   useEffect(() => {
//     // Reset state on username change
//     setActiveTab("writings");
//     setLikedStories([]);
//     setHasLoadedLiked(false);
//   }, [username]);

//   useEffect(() => {
//     // Safety: If not profile owner, liked tab must never be active
//     if (!isSelf && activeTab === "liked") {
//       setActiveTab("writings");
//     }
//   }, [isSelf, activeTab]);

//   useEffect(() => {
//     if (isSelf && activeTab === "liked" && !hasLoadedLiked) {
//       fetchLikedStories();
//     }
//   }, [isSelf, activeTab, hasLoadedLiked, fetchLikedStories]);

//   /* ── Follow / Unfollow ──────────────────────────────────────────────────── */
//   const handleFollowToggle = async () => {
//     if (!profile || !currentUser) return;

//     setFollowLoading(true);
//     const prevFollowing = isFollowing;
//     const prevCount = profile.followersCount;

//     // Optimistic update
//     setIsFollowing(!prevFollowing);
//     setProfile((p) =>
//       p
//         ? {
//           ...p,
//           followersCount: prevFollowing
//             ? p.followersCount - 1
//             : p.followersCount + 1,
//         }
//         : null,
//     );

//     try {
//       const res = await api.post(`/users/follow/${profile._id}`);
//       if (!res.data.success) throw new Error("Follow request failed");

//       setIsFollowing(res.data.isFollowing);
//       setProfile((p) =>
//         p ? { ...p, followersCount: res.data.followersCount } : null,
//       );

//       showAlert(
//         "success",
//         res.data.isFollowing
//           ? `You're now following @${profile.username}`
//           : `Unfollowed @${profile.username}`,
//       );
//     } catch {
//       // Rollback
//       setIsFollowing(prevFollowing);
//       setProfile((p) => (p ? { ...p, followersCount: prevCount } : null));
//       showAlert("error", "Could not update follow status. Please try again.");
//     } finally {
//       setFollowLoading(false);
//     }
//   };

//   /* ── Followers / Following modal ────────────────────────────────────────── */
//   const openFollowsModal = async (type: FollowModalType) => {
//     if (!profile) return;
//     setModalType(type);
//     setModalUsers([]);
//     setModalError(null);
//     setModalLoading(true);
//     try {
//       const res = await api.get(`/users/${type}/${profile._id}`);
//       if (res.data.success) {
//         setModalUsers(res.data[type] || []);
//       } else {
//         setModalError(`Could not load ${type}.`);
//       }
//     } catch {
//       setModalError(`Failed to load ${type}. Please try again.`);
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   /* ── Profile image cropper ──────────────────────────────────────────────── */
//   const initProfileCropper = useCallback(() => {
//     if (!profilePreviewRef.current) return;
//     profileCropperRef.current?.destroy();
//     profileCropperRef.current = new Cropper(profilePreviewRef.current, {
//       aspectRatio: 1,
//       viewMode: 1,
//       guides: true,
//       autoCropArea: 0.8,
//       responsive: true,
//     });
//   }, []);

//   const openProfileEdit = () => {
//     setProfileFilter("none");
//     setProfileEditError(null);
//     setProfileHasImage(false);
//     setProfileFileInfo(null);
//     setProfileEditOpen(true);
//     setTimeout(initProfileCropper, 200);
//   };

//   const closeProfileEdit = useCallback(() => {
//     setProfileEditOpen(false);
//     profileCropperRef.current?.destroy();
//     profileCropperRef.current = null;
//     setProfileFilter("none");
//     setProfileEditError(null);
//     setProfileHasImage(false);
//     setProfileFileInfo(null);
//     if (profileInputRef.current) profileInputRef.current.value = "";
//   }, []);

//   const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Reset input so the same file can be re-selected after an error
//     if (profileInputRef.current) profileInputRef.current.value = "";

//     const error = validateImageFile(file, MAX_PROFILE_BYTES, false);
//     if (error) {
//       setProfileEditError(error);
//       setProfileHasImage(false);
//       setProfileFileInfo(null);
//       return;
//     }

//     setProfileEditError(null);
//     setProfileHasImage(true);
//     setProfileFileInfo({ name: file.name, size: formatBytes(file.size) });

//     const reader = new FileReader();
//     reader.onload = (ev) => {
//       if (!profilePreviewRef.current || !ev.target?.result) return;
//       profilePreviewRef.current.src = ev.target.result as string;
//       setProfileFilter("none");
//       profileCropperRef.current?.destroy();
//       profileCropperRef.current = null;
//       setTimeout(initProfileCropper, 150);
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleProfileFilterClick = (val: string) => {
//     setProfileFilter(val);
//     const targets = [
//       document.querySelector(".profile-edit-modal .cropper-view-box img"),
//       document.querySelector(".profile-edit-modal .cropper-canvas img"),
//     ] as (HTMLElement | null)[];
//     targets.forEach((el) => {
//       if (el) el.style.filter = val === "none" ? "" : val;
//     });
//   };

//   const handleProfileSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setProfileEditError(null);

//     if (!profileCropperRef.current) {
//       setProfileEditError("Please select and position an image first.");
//       return;
//     }

//     setProfileUploading(true);
//     try {
//       const sourceCanvas = profileCropperRef.current.getCroppedCanvas({
//         width: 400,
//         height: 400,
//       });

//       const finalCanvas = document.createElement("canvas");
//       finalCanvas.width = sourceCanvas.width;
//       finalCanvas.height = sourceCanvas.height;
//       const ctx = finalCanvas.getContext("2d");
//       if (!ctx) throw new Error("Canvas context unavailable");
//       if (profileFilter !== "none") ctx.filter = profileFilter;
//       ctx.drawImage(sourceCanvas, 0, 0);

//       const blob = await canvasToBlob(finalCanvas);

//       if (blob.size > MAX_PROFILE_BYTES) {
//         setProfileEditError(
//           `Processed image is ${formatBytes(blob.size)}, which exceeds the ${MAX_PROFILE_IMAGE_MB}MB limit. Try a smaller source image.`,
//         );
//         return;
//       }

//       const fd = new FormData();
//       fd.append("image", blob, "profile.jpg");

//       const res = await api.put("/users/profile/image", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       if (!res.data.success) {
//         setProfileEditError("Upload failed. Please try again.");
//         return;
//       }

//       const url: string = res.data.imageUrl || res.data.image?.url;
//       setProfile((p) =>
//         p ? { ...p, image: { url, filename: "profile_image" } } : null,
//       );
//       if (currentUser) {
//         login({ ...currentUser, image: { url, filename: "profile_image" } });
//       }
//       closeProfileEdit();
//       showAlert("success", "Profile picture updated successfully!");
//     } catch (err: any) {
//       setProfileEditError(extractUploadError(err, MAX_PROFILE_IMAGE_MB));
//     } finally {
//       setProfileUploading(false);
//     }
//   };

//   /* ── Banner editor ──────────────────────────────────────────────────────── */
//   const openBannerEdit = () => {
//     setBannerFilter("none");
//     setBannerSelected(false);
//     setBannerEditError(null);
//     setBannerIsGif(false);
//     setBannerGifFile(null);
//     setBannerGifPreviewUrl(null);
//     setBannerFileInfo(null);
//     setBannerEditOpen(true);
//   };

//   const closeBannerEdit = useCallback(() => {
//     setBannerEditOpen(false);
//     bannerCropperRef.current?.destroy();
//     bannerCropperRef.current = null;
//     setBannerFilter("none");
//     setBannerSelected(false);
//     setBannerEditError(null);
//     setBannerIsGif(false);
//     setBannerGifFile(null);
//     setBannerFileInfo(null);
//     setBannerGifPreviewUrl((prev) => {
//       if (prev) URL.revokeObjectURL(prev);
//       return null;
//     });
//     if (bannerInputRef.current) bannerInputRef.current.value = "";
//   }, []);

//   const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (bannerInputRef.current) bannerInputRef.current.value = "";

//     const error = validateImageFile(file, MAX_BANNER_BYTES, true);
//     if (error) {
//       setBannerEditError(error);
//       setBannerSelected(false);
//       setBannerFileInfo(null);
//       return;
//     }

//     setBannerEditError(null);
//     setBannerSelected(true);
//     setBannerFileInfo({ name: file.name, size: formatBytes(file.size) });

//     const isGif = file.type === "image/gif";
//     setBannerIsGif(isGif);

//     if (isGif) {
//       // GIF: no cropping, preserve animation
//       bannerCropperRef.current?.destroy();
//       bannerCropperRef.current = null;
//       setBannerGifFile(file);
//       setBannerFilter("none");
//       setBannerGifPreviewUrl((prev) => {
//         if (prev) URL.revokeObjectURL(prev);
//         return URL.createObjectURL(file);
//       });
//       return;
//     }

//     // Static image: enable cropping
//     setBannerGifFile(null);
//     setBannerGifPreviewUrl((prev) => {
//       if (prev) URL.revokeObjectURL(prev);
//       return null;
//     });

//     const reader = new FileReader();
//     reader.onload = (ev) => {
//       if (!bannerPreviewRef.current || !ev.target?.result) return;
//       bannerCropperRef.current?.destroy();
//       bannerCropperRef.current = null;
//       bannerPreviewRef.current.src = ev.target.result as string;
//       setBannerFilter("none");
//       setTimeout(() => {
//         if (!bannerPreviewRef.current) return;
//         bannerCropperRef.current = new Cropper(bannerPreviewRef.current, {
//           aspectRatio: 16 / 5,
//           viewMode: 1,
//           guides: true,
//           autoCropArea: 1,
//         });
//       }, 200);
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleBannerFilterClick = (val: string) => {
//     setBannerFilter(val);
//     const el = document.querySelector(
//       ".banner-edit-modal .cropper-view-box img",
//     ) as HTMLElement | null;
//     if (el) el.style.filter = val === "none" ? "" : val;
//   };

//   const uploadBanner = async (blob: Blob, filename: string) => {
//     const fd = new FormData();
//     fd.append("image", blob, filename);
//     const res = await api.put("/users/profile/banner", fd, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });

//     if (!res.data.success) {
//       throw new Error("Upload failed");
//     }

//     const url: string = res.data.bannerUrl || res.data.banner?.url;
//     setProfile((p) =>
//       p ? { ...p, banner: { url, filename: "banner_image" } } : null,
//     );
//     if (currentUser) {
//       login({ ...currentUser, banner: { url, filename: "banner_image" } });
//     }
//     closeBannerEdit();
//     showAlert("success", "Cover photo updated!");
//   };

//   const handleBannerSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setBannerEditError(null);

//     // GIF path
//     if (bannerIsGif) {
//       if (!bannerGifFile) {
//         setBannerEditError("Please select a GIF file first.");
//         return;
//       }
//       setBannerUploading(true);
//       try {
//         await uploadBanner(bannerGifFile, "banner.gif");
//       } catch (err: any) {
//         setBannerEditError(extractUploadError(err, MAX_BANNER_IMAGE_MB));
//       } finally {
//         setBannerUploading(false);
//       }
//       return;
//     }

//     // Static image path
//     if (!bannerCropperRef.current) {
//       setBannerEditError("Please select a banner image first.");
//       return;
//     }

//     setBannerUploading(true);
//     try {
//       const sourceCanvas = bannerCropperRef.current.getCroppedCanvas({
//         width: 1200,
//         height: 375,
//       });

//       const finalCanvas = document.createElement("canvas");
//       finalCanvas.width = sourceCanvas.width;
//       finalCanvas.height = sourceCanvas.height;
//       const ctx = finalCanvas.getContext("2d");
//       if (!ctx) throw new Error("Canvas context unavailable");
//       if (bannerFilter !== "none") ctx.filter = bannerFilter;
//       ctx.drawImage(sourceCanvas, 0, 0);

//       const blob = await canvasToBlob(finalCanvas);

//       if (blob.size > MAX_BANNER_BYTES) {
//         setBannerEditError(
//           `Processed image is ${formatBytes(blob.size)}, which exceeds the ${MAX_BANNER_IMAGE_MB}MB limit. Try a smaller source image.`,
//         );
//         return;
//       }

//       await uploadBanner(blob, "banner.jpg");
//     } catch (err: any) {
//       setBannerEditError(extractUploadError(err, MAX_BANNER_IMAGE_MB));
//     } finally {
//       setBannerUploading(false);
//     }
//   };

//   const handleDeleteBanner = async () => {
//     setBannerEditError(null);
//     try {
//       await api.delete("/users/profile/banner");
//       setProfile((p) => (p ? { ...p, banner: undefined } : null));
//       if (currentUser) {
//         login({ ...currentUser, banner: undefined });
//       }
//       closeBannerEdit();
//       showAlert("success", "Cover photo removed.");
//     } catch (err: any) {
//       setBannerEditError(
//         err?.response?.data?.error ||
//         "Failed to remove cover photo. Try again.",
//       );
//     }
//   };

//   /* ── Loading / Error / Missing states ───────────────────────────────────── */
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin mx-auto mb-4" />
//           <p className="text-[13px] text-gray-500 font-medium">
//             Loading profile…
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (pageError) {
//     const isNotFound =
//       pageError.toLowerCase().includes("not exist") ||
//       pageError.toLowerCase().includes("not found");
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="w-full max-w-md">
//           <ErrorCard
//             variant="centered"
//             title={isNotFound ? "Profile not found" : "Failed to load profile"}
//             message={pageError}
//             actionLabel="Try again"
//             onAction={fetchProfile}
//             secondaryActionLabel="Go back"
//             onSecondaryAction={() => navigate(-1)}
//           />
//         </div>
//       </div>
//     );
//   }

//   if (!profile) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="w-full max-w-md">
//           <ErrorCard
//             variant="centered"
//             title="Profile not found"
//             message="This user profile does not exist or could not be loaded."
//             secondaryActionLabel="Go back"
//             onSecondaryAction={() => navigate(-1)}
//           />
//         </div>
//       </div>
//     );
//   }

//   /* ── Render ─────────────────────────────────────────────────────────────── */
//   return (
//     <div className="min-h-screen  bg-gray-50">



//       {/* Global alert */}
//       {alert && (
//         <div className="max-w-2xl mx-auto px-4 mt-3">
//           <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
//         </div>
//       )}

//       <main className="max-w-[76rem]  border-rounded  mx-auto pb-20">
//         {/* Banner */}
//         <div
//           className="relative w-full  rounded-none lg:rounded-2xl overflow-hidden bg-gray-200"
//           style={{ aspectRatio: "16/5" }}
//         >
//           {profile.banner?.url ? (
//             <img
//               src={profile.banner.url}
//               alt="Cover"
//               className="w-full  rounded-none lg:rounded-2xl h-full object-cover cursor-pointer"
//               onClick={() => setBannerViewOpen(true)}
//             />
//           ) : (
//             <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
//           )}
//           {isSelf && (
//             <button
//               onClick={openBannerEdit}
//               className="absolute bottom-2.5 right-3 flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
//             >
//               <Camera className="w-3 h-3" strokeWidth={2.5} />
//               Edit cover
//             </button>
//           )}
//         </div>

//         {/* Profile header */}
//         <div className="px-4 sm:px-5 bg-white border-b border-gray-100 pb-5">
//           <div className="flex items-start justify-between mt-3 mb-4">
//             <div className="relative -mt-12 sm:-mt-14">
//               <div
//                 className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-4 ring-white overflow-hidden shadow-md bg-gray-100 cursor-pointer flex-shrink-0"
//                 onClick={() => profile.image?.url && setProfileViewOpen(true)}
//               >
//                 <img
//                   src={profile.image?.url || avatarUrl(profile.name)}
//                   alt={profile.name}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               {isSelf && (
//                 <button
//                   onClick={openProfileEdit}
//                   className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-md border-2 border-white active:scale-90 transition-all"
//                   title="Change photo"
//                 >
//                   <Camera className="w-3 h-3" strokeWidth={2.5} />
//                 </button>
//               )}
//             </div>

//             <div className="flex items-center gap-2 pt-2">
//               {!isSelf && currentUser ? (
//                 <>
//                   <button
//                     onClick={handleFollowToggle}
//                     disabled={followLoading}
//                     className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97] disabled:opacity-60 ${isFollowing
//                       ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
//                       : "bg-gray-900 text-white hover:bg-gray-800"
//                       }`}
//                   >
//                     {followLoading ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : isFollowing ? (
//                       "Following"
//                     ) : followsMe ? (
//                       "Follow back"
//                     ) : (
//                       "Follow"
//                     )}
//                   </button>
//                   <button
//                     onClick={() => navigate(`/chat?user=${profile._id}`)}
//                     className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors active:scale-95 border border-gray-200"
//                     title="Message"
//                   >
//                     <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
//                   </button>
//                 </>
//               ) : isSelf ? (
//                 <>
//                   <Link
//                     to="/diary/calendar"
//                     className="px-3 py-2 rounded-xl text-[13px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 flex items-center gap-1.5"
//                     title="My Diary Calendar"
//                   >
//                     <Calendar className="w-3.5 h-3.5" strokeWidth={1.8} />
//                     <span className="hidden sm:inline">Calendar</span>
//                   </Link>
//                   <Link
//                     to="/settings"
//                     className="px-3 py-2 rounded-xl text-[13px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 flex items-center gap-1.5"
//                   >
//                     <Settings className="w-3.5 h-3.5" strokeWidth={1.8} />
//                     <span className="hidden sm:inline">Edit profile</span>
//                     <span className="sm:hidden">Edit</span>
//                   </Link>
//                   <Link
//                     to="/write"
//                     className="px-3 py-2 rounded-xl text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-1.5"
//                   >
//                     <Feather className="w-3.5 h-3.5" strokeWidth={2} />
//                     Write
//                   </Link>
//                 </>
//               ) : null}
//             </div>
//           </div>

//           {/* Name & bio */}
//           <div className="mb-4">
//             <div className="flex items-center gap-2 flex-wrap mb-0.5">
//               <h1 className="text-[18px] sm:text-[20px] font-bold text-gray-900">
//                 {profile.name}
//               </h1>
//               {followsMe && !isSelf && (
//                 <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
//                   Follows you
//                 </span>
//               )}
//             </div>
//             <p className="text-[12.5px] text-gray-400 mb-3">
//               @{profile.username}
//             </p>
//             {profile.bio && (
//               <p className="text-[13.5px] text-gray-600 leading-relaxed whitespace-pre-wrap max-w-lg">
//                 {profile.bio}
//               </p>
//             )}
//           </div>

//           {/* Stats */}
//           <div className="flex items-center gap-1">
//             <button
//               onClick={() => openFollowsModal("followers")}
//               className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
//             >
//               <span className="text-[15px] font-bold text-gray-900">
//                 {formatNumber(profile.followersCount)}
//               </span>
//               <span className="text-[12px] text-gray-400 group-hover:text-gray-600 transition-colors">
//                 {profile.followersCount === 1 ? "Follower" : "Followers"}
//               </span>
//             </button>
//             <div className="w-px h-4 bg-gray-200 mx-1" />
//             <button
//               onClick={() => openFollowsModal("following")}
//               className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
//             >
//               <span className="text-[15px] font-bold text-gray-900">
//                 {formatNumber(profile.followingCount)}
//               </span>
//               <span className="text-[12px] text-gray-400 group-hover:text-gray-600 transition-colors">
//                 Following
//               </span>
//             </button>
//             <div className="w-px h-4 bg-gray-200 mx-1" />
//             <div className="flex items-center gap-1.5 px-3 py-2">
//               <span className="text-[15px] font-bold text-gray-900">
//                 {profile.storiesCount || stories.length}
//               </span>
//               <span className="text-[12px] text-gray-400">
//                 {(profile.storiesCount || stories.length) === 1
//                   ? "Story"
//                   : "Stories"}
//               </span>
//             </div>
//           </div>

//           {/* Calendar Entry Point for Owner */}
//           {isSelf && (
//             <div className="mt-4 pt-3.5 border-t border-gray-100">
//               <Link
//                 to="/diary/calendar"
//                 className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gray-50/70 hover:bg-gray-100/80 border border-gray-100 transition-all duration-200 group"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-center text-gray-700 group-hover:text-gray-900 group-hover:border-gray-300 transition-colors">
//                     <Calendar className="w-4 h-4" strokeWidth={1.8} />
//                   </div>
//                   <div>
//                     <h3 className="text-[13px] font-semibold text-gray-900 flex items-center gap-1.5">
//                       My Diary Calendar
//                     </h3>
//                     <p className="text-[11.5px] text-gray-400">
//                       See what you wrote on each day
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-1 text-[12px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors pr-1">
//                   <span>View</span>
//                   <ChevronRight
//                     className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all"
//                     strokeWidth={2}
//                   />
//                 </div>
//               </Link>
//             </div>
//           )}
//         </div>

//         {/* Tabs */}
//         <div
//           className="sticky  bg-white border-b border-gray-100"
//           style={{ top: STICKY_TAB_TOP_OFFSET }}
//         >
//           <div className="max-w-2xl mx-auto flex">
//             {(isSelf
//               ? (["writings", "liked", "about"] as const)
//               : (["writings", "about"] as const)
//             ).map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-semibold capitalize transition-colors relative ${activeTab === tab
//                   ? "text-gray-900"
//                   : "text-gray-400 hover:text-gray-600"
//                   }`}
//               >
//                 {tab === "writings" ? (
//                   <>
//                     <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
//                     <span>Writings</span>
//                     {stories.length > 0 && (
//                       <span
//                         className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "writings"
//                           ? "bg-gray-900 text-white"
//                           : "bg-gray-100 text-gray-400"
//                           }`}
//                       >
//                         {stories.length}
//                       </span>
//                     )}
//                   </>
//                 ) : tab === "liked" ? (
//                   <>
//                     <Heart className="w-3.5 h-3.5" strokeWidth={2} />
//                     <span>Liked</span>
//                     {(likedCount > 0 || likedStories.length > 0) && (
//                       <span
//                         className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "liked"
//                           ? "bg-gray-900 text-white"
//                           : "bg-gray-100 text-gray-400"
//                           }`}
//                       >
//                         {hasLoadedLiked ? likedStories.length : likedCount}
//                       </span>
//                     )}
//                   </>
//                 ) : (
//                   <>
//                     <Users className="w-3.5 h-3.5" strokeWidth={2} />
//                     <span>About</span>
//                   </>
//                 )}
//                 {activeTab === tab && (
//                   <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-900 rounded-full" />
//                 )}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Tab content */}
//         <div className="px-4 sm:px-5 pt-4">
//           {activeTab === "writings" && (
//             <div className="animate-fadeIn">
//               {reversedStories.length === 0 ? (
//                 <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center mt-2">
//                   <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
//                     <Feather
//                       className="w-6 h-6 text-gray-300"
//                       strokeWidth={1.5}
//                     />
//                   </div>
//                   <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">
//                     {isSelf ? "Write your first story" : "No stories yet"}
//                   </h3>
//                   <p className="text-[12.5px] text-gray-400 max-w-xs mx-auto leading-relaxed">
//                     {isSelf
//                       ? "Your published stories will appear here."
//                       : `@${profile.username} hasn't published any stories yet.`}
//                   </p>
//                   {isSelf && (
//                     <Link
//                       to="/write"
//                       className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
//                     >
//                       <Plus className="w-4 h-4" strokeWidth={2.5} />
//                       Write a story
//                     </Link>
//                   )}
//                 </div>
//               ) : (
//                 <>
//                   <div className="flex items-center justify-between mb-3">
//                     <p className="text-[12px] text-gray-400 font-medium">
//                       {reversedStories.length}{" "}
//                       {reversedStories.length === 1 ? "story" : "stories"}
//                     </p>
//                     <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
//                       <button
//                         onClick={() => setStoriesView("grid")}
//                         className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${storiesView === "grid"
//                           ? "bg-white shadow-sm text-gray-900"
//                           : "text-gray-400 hover:text-gray-600"
//                           }`}
//                         aria-label="Grid view"
//                       >
//                         <Grid3X3 className="w-3.5 h-3.5" strokeWidth={2} />
//                       </button>
//                       <button
//                         onClick={() => setStoriesView("list")}
//                         className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${storiesView === "list"
//                           ? "bg-white shadow-sm text-gray-900"
//                           : "text-gray-400 hover:text-gray-600"
//                           }`}
//                         aria-label="List view"
//                       >
//                         <List className="w-3.5 h-3.5" strokeWidth={2} />
//                       </button>
//                     </div>
//                   </div>

//                   {storiesView === "grid" ? (
//                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4">
//                       {reversedStories.map((story) => (
//                         <GridStoryCard key={story._id} story={story} />
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="space-y-2.5 max-w-4xl mx-auto">
//                       {reversedStories.map((story) => (
//                         <ListStoryCard key={story._id} story={story} />
//                       ))}
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           )}

//           {isSelf && activeTab === "liked" && (
//             <div className="animate-fadeIn">
//               {loadingLiked && !hasLoadedLiked ? (
//                 <div className="py-12 flex items-center justify-center">
//                   <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
//                 </div>
//               ) : likedStories.length === 0 ? (
//                 <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center mt-2">
//                   <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
//                     <Heart className="w-6 h-6 text-rose-300" strokeWidth={1.5} />
//                   </div>
//                   <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">
//                     No liked stories yet
//                   </h3>
//                   <p className="text-[12.5px] text-gray-400 max-w-xs mx-auto leading-relaxed">
//                     Stories you like while browsing Diary will appear here.
//                   </p>
//                   <Link
//                     to="/stories"
//                     className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
//                   >
//                     Explore stories →
//                   </Link>
//                 </div>
//               ) : (
//                 <>
//                   <div className="flex items-center justify-between mb-3">
//                     <p className="text-[12px] text-gray-400 font-medium">
//                       {likedStories.length}{" "}
//                       {likedStories.length === 1 ? "liked story" : "liked stories"}
//                     </p>
//                     <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
//                       <button
//                         onClick={() => setStoriesView("grid")}
//                         className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${storiesView === "grid"
//                           ? "bg-white shadow-sm text-gray-900"
//                           : "text-gray-400 hover:text-gray-600"
//                           }`}
//                         aria-label="Grid view"
//                       >
//                         <Grid3X3 className="w-3.5 h-3.5" strokeWidth={2} />
//                       </button>
//                       <button
//                         onClick={() => setStoriesView("list")}
//                         className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${storiesView === "list"
//                           ? "bg-white shadow-sm text-gray-900"
//                           : "text-gray-400 hover:text-gray-600"
//                           }`}
//                         aria-label="List view"
//                       >
//                         <List className="w-3.5 h-3.5" strokeWidth={2} />
//                       </button>
//                     </div>
//                   </div>

//                   {storiesView === "grid" ? (
//                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4">
//                       {likedStories.map((story) => (
//                         <GridStoryCard
//                           key={story._id}
//                           story={story}
//                           showUnlike={true}
//                           onUnlike={handleUnlike}
//                         />
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="space-y-2.5 max-w-4xl mx-auto">
//                       {likedStories.map((story) => (
//                         <ListStoryCard
//                           key={story._id}
//                           story={story}
//                           showUnlike={true}
//                           onUnlike={handleUnlike}
//                         />
//                       ))}
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           )}

//           {activeTab === "about" && (
//             <div className="animate-fadeIn space-y-3 pb-6 mt-1">
//               <div className="bg-white rounded-2xl p-4 border border-gray-100">
//                 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
//                   Activity
//                 </p>
//                 <div className="grid grid-cols-2 gap-3">
//                   <StatBlock
//                     icon={
//                       <Eye
//                         className="w-4 h-4 text-gray-400"
//                         strokeWidth={1.8}
//                       />
//                     }
//                     label="Total reads"
//                     value={formatNumber(totalViews)}
//                   />
//                   <StatBlock
//                     icon={
//                       <Heart
//                         className="w-4 h-4 text-gray-400"
//                         strokeWidth={1.8}
//                       />
//                     }
//                     label="Total likes"
//                     value={formatNumber(totalLikes)}
//                   />
//                   <StatBlock
//                     icon={
//                       <BookOpen
//                         className="w-4 h-4 text-gray-400"
//                         strokeWidth={1.8}
//                       />
//                     }
//                     label="Published"
//                     value={`${profile.storiesCount || stories.length} stories`}
//                   />
//                   <StatBlock
//                     icon={
//                       <Users
//                         className="w-4 h-4 text-gray-400"
//                         strokeWidth={1.8}
//                       />
//                     }
//                     label="Followers"
//                     value={formatNumber(profile.followersCount)}
//                   />
//                 </div>
//               </div>

//               <div className="bg-white rounded-2xl p-4 border border-gray-100">
//                 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
//                   Details
//                 </p>
//                 <div className="flex items-center gap-3">
//                   <Calendar
//                     className="w-4 h-4 text-gray-400 flex-shrink-0"
//                     strokeWidth={1.8}
//                   />
//                   <div>
//                     <p className="text-[11px] text-gray-400">Member since</p>
//                     <p className="text-[13px] font-semibold text-gray-800">
//                       {formatJoinDate(profile.createdAt)}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {isSelf && (
//                 <Link
//                   to="/diary/calendar"
//                   className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-colors group"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700 group-hover:bg-gray-900 group-hover:text-white transition-colors">
//                       <Calendar className="w-4 h-4" strokeWidth={1.8} />
//                     </div>
//                     <div>
//                       <p className="text-[13px] font-semibold text-gray-900">
//                         My Diary Calendar
//                       </p>
//                       <p className="text-[11px] text-gray-400">
//                         See what you wrote on each day
//                       </p>
//                     </div>
//                   </div>
//                   <ChevronRight
//                     className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform"
//                     strokeWidth={2}
//                   />
//                 </Link>
//               )}

//               {isSelf && (
//                 <Link
//                   to="/write"
//                   className="flex items-center justify-between bg-gray-900 text-white rounded-2xl p-4 hover:bg-gray-800 transition-colors group"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
//                       <Feather className="w-4 h-4" strokeWidth={2} />
//                     </div>
//                     <div>
//                       <p className="text-[13px] font-semibold">Start writing</p>
//                       <p className="text-[11px] text-gray-400">
//                         Share your story with the world
//                       </p>
//                     </div>
//                   </div>
//                   <ChevronRight
//                     className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform"
//                     strokeWidth={2}
//                   />
//                 </Link>
//               )}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* Banner lightbox */}
//       {bannerViewOpen && profile.banner?.url && (
//         <LightboxModal onClose={() => setBannerViewOpen(false)}>
//           <img
//             src={profile.banner.url}
//             alt="Banner"
//             className="w-full max-h-[80vh] object-contain rounded-xl"
//           />
//         </LightboxModal>
//       )}

//       {/* Profile image lightbox */}
//       {profileViewOpen && profile.image?.url && (
//         <LightboxModal onClose={() => setProfileViewOpen(false)}>
//           <img
//             src={profile.image.url}
//             alt={profile.name}
//             className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-2xl shadow-2xl"
//           />
//         </LightboxModal>
//       )}

//       {/* Profile image editor */}
//       {profileEditOpen && (
//         <BottomSheetModal
//           title="Update profile photo"
//           onClose={closeProfileEdit}
//           className="profile-edit-modal"
//         >
//           <div className="p-5 space-y-4">
//             <div
//               className="relative mx-auto overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200"
//               style={{ width: 200, height: 200, borderRadius: "50%" }}
//             >
//               <img
//                 ref={profilePreviewRef}
//                 src={profile.image?.url || avatarUrl(profile.name)}
//                 alt="Preview"
//                 className="block max-w-full"
//               />
//               {!profileHasImage && (
//                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-full pointer-events-none">
//                   <ImageIcon
//                     className="w-7 h-7 text-white/80 mb-1"
//                     strokeWidth={1.5}
//                   />
//                   <span className="text-[11px] text-white/80 font-medium">
//                     Choose photo
//                   </span>
//                 </div>
//               )}
//             </div>

//             {profileFileInfo && (
//               <div className="flex items-center justify-center gap-2">
//                 <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full truncate max-w-[220px]">
//                   {profileFileInfo.name} · {profileFileInfo.size}
//                 </span>
//               </div>
//             )}

//             {profileHasImage && (
//               <div>
//                 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
//                   Filters
//                 </p>
//                 <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
//                   {PROFILE_FILTERS.map((f) => (
//                     <button
//                       key={f.name}
//                       type="button"
//                       onClick={() => handleProfileFilterClick(f.value)}
//                       className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all whitespace-nowrap border ${profileFilter === f.value
//                         ? "bg-gray-900 text-white border-gray-900"
//                         : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
//                         }`}
//                     >
//                       {f.name}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <SizeHint mb={MAX_PROFILE_IMAGE_MB} formats="JPG, PNG, WEBP" />
//             <FieldError message={profileEditError} />

//             <form onSubmit={handleProfileSubmit}>
//               <input
//                 ref={profileInputRef}
//                 type="file"
//                 className="hidden"
//                 accept="image/jpeg,image/jpg,image/png,image/webp"
//                 onChange={handleProfileFileChange}
//               />
//               <div className="flex items-center gap-2.5">
//                 <button
//                   type="button"
//                   onClick={() => profileInputRef.current?.click()}
//                   className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[13px] font-semibold text-gray-600 transition-colors border border-gray-200"
//                 >
//                   <ImageIcon className="w-4 h-4" strokeWidth={2} />
//                   {profileHasImage ? "Change photo" : "Choose photo"}
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={profileUploading || !profileHasImage}
//                   className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {profileUploading ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" /> Saving…
//                     </>
//                   ) : (
//                     <>
//                       <Check className="w-4 h-4" strokeWidth={2.5} /> Save photo
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </BottomSheetModal>
//       )}

//       {/* Banner editor */}
//       {bannerEditOpen && (
//         <BottomSheetModal
//           title="Update cover photo"
//           onClose={closeBannerEdit}
//           maxW="max-w-xl"
//           className="banner-edit-modal"
//           headerExtra={
//             profile.banner?.url ? (
//               <button
//                 onClick={handleDeleteBanner}
//                 className="flex items-center gap-1 text-red-500 hover:text-red-600 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
//               >
//                 <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
//                 Remove
//               </button>
//             ) : null
//           }
//         >
//           <div className="p-5 space-y-4">
//             <div
//               className="relative w-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 rounded-xl"
//               style={{ aspectRatio: "16/5" }}
//             >
//               {bannerIsGif && bannerGifPreviewUrl ? (
//                 <img
//                   src={bannerGifPreviewUrl}
//                   alt="GIF preview"
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <img
//                   ref={bannerPreviewRef}
//                   src={
//                     profile.banner?.url ||
//                     "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
//                   }
//                   alt="Banner preview"
//                   className="block max-w-full max-h-full w-full"
//                 />
//               )}
//               {!bannerSelected && !profile.banner?.url && (
//                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
//                   <ImageIcon
//                     className="w-7 h-7 text-gray-300 mb-1.5"
//                     strokeWidth={1.5}
//                   />
//                   <p className="text-[12px] text-gray-400 font-medium">
//                     Choose a cover photo
//                   </p>
//                   <p className="text-[10.5px] text-gray-300 mt-0.5">
//                     Recommended: 1200 × 375px · GIF supported
//                   </p>
//                 </div>
//               )}
//             </div>

//             {bannerFileInfo && (
//               <div className="flex items-center justify-center gap-2">
//                 <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full truncate max-w-[260px]">
//                   {bannerFileInfo.name} · {bannerFileInfo.size}
//                 </span>
//               </div>
//             )}

//             {bannerIsGif && bannerSelected && (
//               <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
//                 <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0">
//                   <span className="text-[8px] font-black text-white leading-none">
//                     GIF
//                   </span>
//                 </div>
//                 <p className="text-[12px] text-blue-700 font-medium">
//                   Animated GIF — saved as-is to keep the animation.
//                 </p>
//               </div>
//             )}

//             {!bannerIsGif && bannerSelected && (
//               <div>
//                 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
//                   Filters
//                 </p>
//                 <div className="flex gap-1.5 flex-wrap">
//                   {BANNER_FILTERS.map((f) => (
//                     <button
//                       key={f.name}
//                       type="button"
//                       onClick={() => handleBannerFilterClick(f.value)}
//                       className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all border ${bannerFilter === f.value
//                         ? "bg-gray-900 text-white border-gray-900"
//                         : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
//                         }`}
//                     >
//                       {f.name}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <SizeHint mb={MAX_BANNER_IMAGE_MB} formats="JPG, PNG, WEBP, GIF" />
//             <FieldError message={bannerEditError} />

//             <form onSubmit={handleBannerSubmit}>
//               <input
//                 ref={bannerInputRef}
//                 type="file"
//                 className="hidden"
//                 accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
//                 onChange={handleBannerFileChange}
//               />
//               <div className="flex items-center gap-2.5">
//                 <button
//                   type="button"
//                   onClick={() => bannerInputRef.current?.click()}
//                   className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[13px] font-semibold text-gray-600 transition-colors border border-gray-200"
//                 >
//                   <ImageIcon className="w-4 h-4" strokeWidth={2} />
//                   {bannerSelected ? "Change image" : "Choose image"}
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={bannerUploading || !bannerSelected}
//                   className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {bannerUploading ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" /> Saving…
//                     </>
//                   ) : (
//                     <>
//                       <Check className="w-4 h-4" strokeWidth={2.5} /> Save cover
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </BottomSheetModal>
//       )}

//       {/* Followers / Following modal */}
//       {modalType && (
//         <div
//           className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center"
//           style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
//           onClick={(e) => e.target === e.currentTarget && setModalType(null)}
//         >
//           <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl max-h-[75vh] flex flex-col shadow-xl border border-gray-100 animate-slideUp">
//             <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
//               <div>
//                 <h3 className="text-[15px] font-bold text-gray-900 capitalize">
//                   {modalType}
//                 </h3>
//                 {!modalLoading && (
//                   <p className="text-[11px] text-gray-400 mt-0.5">
//                     {modalUsers.length}{" "}
//                     {modalUsers.length === 1 ? "person" : "people"}
//                   </p>
//                 )}
//               </div>
//               <button
//                 onClick={() => setModalType(null)}
//                 className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
//                 aria-label="Close"
//               >
//                 <X className="w-4 h-4" strokeWidth={2.5} />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto overscroll-contain">
//               {modalLoading ? (
//                 <div className="flex items-center justify-center h-40">
//                   <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin" />
//                 </div>
//               ) : modalError ? (
//                 <div className="p-5">
//                   <FieldError message={modalError} />
//                   <button
//                     onClick={() => modalType && openFollowsModal(modalType)}
//                     className="w-full mt-3 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
//                   >
//                     Try again
//                   </button>
//                 </div>
//               ) : modalUsers.length === 0 ? (
//                 <div className="py-14 text-center px-5">
//                   <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
//                     <Users
//                       className="w-5 h-5 text-gray-300"
//                       strokeWidth={1.8}
//                     />
//                   </div>
//                   <p className="text-[14px] font-bold text-gray-800">
//                     No one here yet
//                   </p>
//                   <p className="text-[12px] text-gray-400 mt-1">
//                     {modalType === "followers"
//                       ? "No followers yet."
//                       : "Not following anyone yet."}
//                   </p>
//                 </div>
//               ) : (
//                 <div className="p-3 space-y-0.5">
//                   {modalUsers.map((u) => (
//                     <Link
//                       key={u._id}
//                       to={`/profile/${u.username}`}
//                       onClick={() => setModalType(null)}
//                       className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
//                     >
//                       <img
//                         src={u.image?.url || avatarUrl(u.name)}
//                         alt={u.name}
//                         className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-gray-100"
//                       />
//                       <div className="flex-1 min-w-0">
//                         <p className="text-[13px] font-semibold text-gray-800 truncate">
//                           {u.name}
//                         </p>
//                         <p className="text-[11px] text-gray-400 truncate">
//                           @{u.username}
//                         </p>
//                       </div>
//                       <ChevronRight
//                         className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0"
//                         strokeWidth={2}
//                       />
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       <style
//         dangerouslySetInnerHTML={{
//           __html: `
//         .no-scrollbar::-webkit-scrollbar { display: none; }
//         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(6px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes slideUp {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fadeIn { animation: fadeIn 0.22s ease-out; }
//         .animate-slideUp { animation: slideUp 0.28s ease-out; }
//       `,
//         }}
//       />
//     </div>
//   );
// };

// export default Profile;
// src/pages/Profile.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import {
  Settings,
  MessageCircle,
  Camera,
  X,
  Check,
  Eye,
  Heart,
  Calendar,
  BookOpen,
  Users,
  Loader2,
  Plus,
  Feather,
  ChevronRight,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
  Grid3X3,
  List,
  AlertCircle,
  Search,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { ErrorCard } from "../../components/ErrorCard";

/* ============================================================================
 * Types
 * ========================================================================== */
interface Story {
  _id: string;
  title: string;
  story: string;
  category: string;
  image?: { url: string };
  views: string[];
  likedBy: string[];
  timeStamp: string;
  owner?: {
    _id?: string;
    username: string;
    name: string;
    image?: { url: string };
  };
}

interface ProfileData {
  _id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  image?: { url: string; filename: string };
  banner?: { url: string; filename: string };
  followersCount: number;
  followingCount: number;
  storiesCount: number;
  createdAt: string;
}

interface FollowUser {
  _id: string;
  name: string;
  username: string;
  bio?: string;
  image?: { url: string };
}

type AlertType = "success" | "error" | "info";
type AlertState = { type: AlertType; message: string } | null;
type TabKey = "writings" | "liked" | "about";
type StoriesView = "grid" | "list";
type FollowModalType = "followers" | "following";

/* ============================================================================
 * Constants
 * ========================================================================== */
const MAX_PROFILE_IMAGE_MB = 5;
const MAX_BANNER_IMAGE_MB = 5;
const MAX_PROFILE_BYTES = MAX_PROFILE_IMAGE_MB * 1024 * 1024;
const MAX_BANNER_BYTES = MAX_BANNER_IMAGE_MB * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const PROFILE_FILTERS = [
  { name: "Original", value: "none" },
  { name: "Classic", value: "contrast(130%) brightness(100%) saturate(120%)" },
  {
    name: "Cinema",
    value: "contrast(150%) saturate(100%) brightness(90%) sepia(20%)",
  },
  {
    name: "Golden",
    value: "hue-rotate(60deg) saturate(120%) brightness(110%)",
  },
  { name: "Noir", value: "grayscale(100%) contrast(180%) brightness(75%)" },
  { name: "Moody", value: "contrast(150%) brightness(80%) saturate(140%)" },
  {
    name: "Warmth",
    value: "sepia(40%) saturate(130%) contrast(110%) brightness(100%)",
  },
  { name: "Cool", value: "hue-rotate(210deg) brightness(95%) saturate(140%)" },
  { name: "Retro", value: "grayscale(60%) sepia(50%) contrast(120%)" },
  { name: "Vivid", value: "contrast(140%) brightness(140%) saturate(130%)" },
  { name: "Crisp", value: "contrast(200%) brightness(120%) saturate(100%)" },
];

const BANNER_FILTERS = [
  { name: "Original", value: "none" },
  { name: "Classic", value: "contrast(130%)" },
  { name: "Film", value: "grayscale(100%)" },
  { name: "Warm", value: "sepia(50%)" },
  { name: "Vivid", value: "contrast(140%) saturate(130%)" },
];

const ALERT_TIMEOUT_MS = 4000;
const STICKY_TAB_TOP_OFFSET = "56px";

/* ============================================================================
 * Utilities
 * ========================================================================== */
const timeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const formatJoinDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / 1024).toFixed(0)}KB`;
};

const avatarUrl = (name: string): string =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=f1f5f9&color=334155&bold=true&size=240`;

const validateImageFile = (
  file: File,
  maxBytes: number,
  allowGif = false,
): string | null => {
  const allowed = allowGif
    ? ACCEPTED_IMAGE_TYPES
    : ACCEPTED_IMAGE_TYPES.filter((t) => t !== "image/gif");
  if (!(allowed as readonly string[]).includes(file.type)) {
    return allowGif
      ? "Invalid file type. Please choose a JPG, PNG, WEBP, or GIF image."
      : "Invalid file type. Please choose a JPG, PNG, or WEBP image.";
  }
  if (file.size > maxBytes) {
    return `File is too large (${formatBytes(file.size)}). Maximum allowed size is ${formatBytes(maxBytes)}.`;
  }
  return null;
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.88,
): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      type,
      quality,
    ),
  );

const extractUploadError = (err: any, maxMB: number): string => {
  const serverMsg: string | undefined = err?.response?.data?.error;
  const status = err?.response?.status;
  const lower = serverMsg?.toLowerCase() ?? "";
  if (status === 413 || lower.includes("size") || lower.includes("large")) {
    return `File too large. Please use an image under ${maxMB}MB.`;
  }
  return serverMsg || "Upload failed. Check your connection and try again.";
};

/* ============================================================================
 * Small Presentational Components
 * ========================================================================== */
const InlineAlert: React.FC<{
  alert: AlertState;
  onDismiss: () => void;
}> = ({ alert, onDismiss }) => {
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(onDismiss, ALERT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const styles: Record<
    AlertType,
    { bg: string; icon: React.ReactNode; text: string }
  > = {
    success: {
      bg: "bg-emerald-50 border-emerald-200/90 shadow-sm",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
      text: "text-emerald-900",
    },
    error: {
      bg: "bg-red-50 border-red-200/90 shadow-sm",
      icon: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
      text: "text-red-800",
    },
    info: {
      bg: "bg-blue-50 border-blue-200/90 shadow-sm",
      icon: <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />,
      text: "text-blue-800",
    },
  };

  const cfg = styles[alert.type];

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${cfg.bg} mb-3 animate-fadeIn`}
    >
      {cfg.icon}
      <p className={`text-[13px] font-medium flex-1 ${cfg.text}`}>
        {alert.message}
      </p>
      <button
        onClick={onDismiss}
        className="opacity-45 hover:opacity-80 transition-opacity ml-1"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const FieldError: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
      <AlertCircle
        className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
        strokeWidth={2}
      />
      <p className="text-[12.5px] text-red-600 font-medium leading-relaxed">
        {message}
      </p>
    </div>
  );
};

const SizeHint: React.FC<{ mb: number; formats: string }> = ({
  mb,
  formats,
}) => (
  <p className="text-[11px] text-gray-400 text-center">
    Max file size: <span className="font-semibold text-gray-600">{mb}MB</span> ·{" "}
    {formats}
  </p>
);

const StatBlock: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100">
    <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center flex-shrink-0 shadow-2xs">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      <p className="text-[15px] font-bold text-gray-900 truncate tracking-tight">
        {value}
      </p>
    </div>
  </div>
);

const LightboxModal: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
}> = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-11 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
        style={{ background: "rgba(255,255,255,0.18)" }}
        aria-label="Close"
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>
      {children}
    </div>
  </div>
);

const BottomSheetModal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxW?: string;
  headerExtra?: React.ReactNode;
  className?: string;
}> = ({
  title,
  onClose,
  children,
  maxW = "max-w-md",
  headerExtra,
  className = "",
}) => (
    <div
      className={`fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 ${className}`}
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white w-full ${maxW} sm:rounded-[26px] rounded-t-[26px] overflow-hidden shadow-xl border border-gray-100 animate-slideUp`}
      >
        <div className="w-9 h-1 rounded-full bg-gray-200 mx-auto mt-2.5 sm:hidden" />
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[14.5px] font-bold text-gray-900 tracking-tight">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {headerExtra}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

/* ============================================================================
 * Story Cards (Cover Art + Title + Writer + Likes/Views ONLY — No Story Body)
 * ========================================================================== */
interface StoryCardProps {
  story: Story;
  showUnlike?: boolean;
  onUnlike?: (storyId: string) => void;
}

const GridStoryCard: React.FC<StoryCardProps> = ({
  story,
  showUnlike = false,
  onUnlike,
}) => (
  <div className="relative group/card h-full">
    <Link
      to={`/stories/${story._id}`}
      className="group flex flex-col h-full bg-white rounded-2xl border border-gray-200/80 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
    >
      {/* Cover Art */}
      <div
        className="relative w-full bg-gray-100 overflow-hidden"
        style={{ aspectRatio: "4/3" }}
      >
        {story.image?.url ? (
          <img
            src={story.image.url}
            alt={story.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <Feather className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
          </div>
        )}

        {story.category && (
          <span className="absolute top-2.5 left-2.5 text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/95 text-gray-700 shadow-2xs backdrop-blur-sm">
            {story.category}
          </span>
        )}

        {showUnlike && onUnlike && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUnlike(story._id);
            }}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/95 hover:bg-white text-rose-500 hover:text-rose-600 shadow-sm backdrop-blur-sm transition-all hover:scale-110 active:scale-90 z-10 border border-gray-100"
            title="Unlike story"
            aria-label="Unlike story"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Meta: Writer + Title + Likes/Views */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {story.owner && (
            <p className="text-[11px] text-gray-400 truncate mb-1">
              by{" "}
              <span className="font-semibold text-gray-700">
                @{story.owner.username}
              </span>
            </p>
          )}
          <h3 className="text-[13.5px] font-bold text-gray-900 line-clamp-2 leading-snug mb-2.5 group-hover:text-gray-600 transition-colors">
            {story.title}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-[10.5px] text-gray-400 font-medium">
            {timeAgo(story.timeStamp)}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
              <Eye className="w-3 h-3" strokeWidth={1.8} />
              {formatNumber(story.views?.length || 0)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
              <Heart className="w-3 h-3" strokeWidth={1.8} />
              {formatNumber(story.likedBy?.length || 0)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  </div>
);

const ListStoryCard: React.FC<StoryCardProps> = ({
  story,
  showUnlike = false,
  onUnlike,
}) => (
  <div className="relative group/card flex items-center bg-white rounded-2xl border border-gray-200/80 p-3 hover:border-gray-300 hover:shadow-xs transition-all duration-200">
    <Link
      to={`/stories/${story._id}`}
      className="group flex-1 flex items-center gap-3.5 min-w-0"
    >
      {/* Cover Art */}
      <div className="w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
        {story.image?.url ? (
          <img
            src={story.image.url}
            alt={story.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Feather className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Title + Writer + Likes/Views */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {story.category && (
            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
              {story.category}
            </span>
          )}
          {story.owner && (
            <>
              <span className="text-[11px] font-semibold text-gray-600 truncate">
                @{story.owner.username}
              </span>
              <span className="text-[9px] text-gray-300">·</span>
            </>
          )}
          <span className="text-[10.5px] text-gray-400">
            {timeAgo(story.timeStamp)}
          </span>
        </div>

        <h3 className="text-[13.5px] sm:text-[14px] font-bold text-gray-900 line-clamp-2 leading-snug mb-1.5 group-hover:text-gray-600 transition-colors">
          {story.title}
        </h3>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
            <Eye className="w-3 h-3" strokeWidth={1.8} />
            {formatNumber(story.views?.length || 0)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
            <Heart className="w-3 h-3" strokeWidth={1.8} />
            {formatNumber(story.likedBy?.length || 0)}
          </span>
        </div>
      </div>
    </Link>

    <div className="flex items-center gap-2 flex-shrink-0">
      {showUnlike && onUnlike && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUnlike(story._id);
          }}
          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 transition-all active:scale-90"
          title="Unlike story"
          aria-label="Unlike story"
        >
          <Heart className="w-4 h-4 fill-rose-500" strokeWidth={1.8} />
        </button>
      )}
      <Link
        to={`/stories/${story._id}`}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <ChevronRight className="w-4 h-4" strokeWidth={2} />
      </Link>
    </div>
  </div>
);

/* ============================================================================
 * Main Component
 * ========================================================================== */
export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, login } = useAuth();
  const navigate = useNavigate();

  // ── Core state ────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("writings");
  const [storiesView, setStoriesView] = useState<StoriesView>("grid");
  const [alert, setAlert] = useState<AlertState>(null);
  const [bannerViewOpen, setBannerViewOpen] = useState(false);
  const [profileViewOpen, setProfileViewOpen] = useState(false);

  // ── Liked stories state ───────────────────────────────────────────────────
  const [likedStories, setLikedStories] = useState<Story[]>([]);
  const [loadingLiked, setLoadingLiked] = useState<boolean>(false);
  const [hasLoadedLiked, setHasLoadedLiked] = useState<boolean>(false);
  const [likedCount, setLikedCount] = useState<number>(0);

  // ── Followers/Following modal ─────────────────────────────────────────────
  const [modalType, setModalType] = useState<FollowModalType | null>(null);
  const [modalUsers, setModalUsers] = useState<FollowUser[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalLayout, setModalLayout] = useState<"cards" | "list">("cards");

  // ── Profile image editor ──────────────────────────────────────────────────
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileFilter, setProfileFilter] = useState("none");
  const [profileEditError, setProfileEditError] = useState<string | null>(null);
  const [profileHasImage, setProfileHasImage] = useState(false);
  const [profileFileInfo, setProfileFileInfo] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const profilePreviewRef = useRef<HTMLImageElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const profileCropperRef = useRef<Cropper | null>(null);

  // ── Banner editor ─────────────────────────────────────────────────────────
  const [bannerEditOpen, setBannerEditOpen] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerFilter, setBannerFilter] = useState("none");
  const [bannerSelected, setBannerSelected] = useState(false);
  const [bannerEditError, setBannerEditError] = useState<string | null>(null);
  const [bannerIsGif, setBannerIsGif] = useState(false);
  const [bannerGifFile, setBannerGifFile] = useState<File | null>(null);
  const [bannerGifPreviewUrl, setBannerGifPreviewUrl] = useState<string | null>(
    null,
  );
  const [bannerFileInfo, setBannerFileInfo] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const bannerPreviewRef = useRef<HTMLImageElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bannerCropperRef = useRef<Cropper | null>(null);

  // ── Derived values ────────────────────────────────────────────────────────
  const isSelf = !!currentUser && !!profile && profile._id === currentUser._id;
  const reversedStories = useMemo(() => [...stories].reverse(), [stories]);

  const totalViews = useMemo(
    () => stories.reduce((sum, s) => sum + (s.views?.length || 0), 0),
    [stories],
  );

  const totalLikes = useMemo(
    () => stories.reduce((sum, s) => sum + (s.likedBy?.length || 0), 0),
    [stories],
  );

  const filteredModalUsers = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    if (!q) return modalUsers;
    return modalUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    );
  }, [modalUsers, modalSearch]);

  const showAlert = useCallback((type: AlertType, message: string) => {
    setAlert({ type, message });
  }, []);

  /* ── Cleanup on unmount: destroy active cropper instances ──────────── */
  useEffect(() => {
    return () => {
      profileCropperRef.current?.destroy();
      bannerCropperRef.current?.destroy();
    };
  }, []);

  /* ── Cleanup Object URL separately to avoid stale unmount closures ── */
  useEffect(() => {
    return () => {
      if (bannerGifPreviewUrl) {
        URL.revokeObjectURL(bannerGifPreviewUrl);
      }
    };
  }, [bannerGifPreviewUrl]);

  /* ── Fetch profile ──────────────────────────────────────────────────────── */
  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setPageError(null);
    try {
      const res = await api.get(`/users/profile/${username}`);
      if (res.data.success) {
        setProfile(res.data.profile);
        setStories(res.data.stories || []);
        setIsFollowing(!!res.data.isFollowing);
        setFollowsMe(!!res.data.followsMe);
        if (res.data.stats?.likedStoriesCount !== undefined) {
          setLikedCount(res.data.stats.likedStoriesCount);
        }
      } else {
        setPageError("This profile could not be loaded.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.status === 404
          ? "This user does not exist."
          : err?.response?.data?.error ||
          "Something went wrong loading this profile.";
      setPageError(msg);
    } finally {
      setLoading(false);
    }
  }, [username]);

  /* ── Fetch liked stories ────────────────────────────────────────────────── */
  const fetchLikedStories = useCallback(async () => {
    if (!username) return;
    setLoadingLiked(true);
    try {
      const res = await api.get(`/users/profile/${username}/liked`);
      if (res.data.success) {
        setLikedStories(res.data.stories || []);
        setLikedCount(
          res.data.pagination?.totalStories ?? res.data.stories?.length ?? 0,
        );
        setHasLoadedLiked(true);
      }
    } catch (err: any) {
      console.error("Failed to load liked stories:", err);
    } finally {
      setLoadingLiked(false);
    }
  }, [username]);

  /* ── Unlike a story ─────────────────────────────────────────────────────── */
  const handleUnlike = useCallback(
    async (storyId: string) => {
      setLikedStories((prev) => prev.filter((s) => s._id !== storyId));
      setLikedCount((prev) => Math.max(0, prev - 1));
      try {
        const res = await api.post(`/stories/${storyId}/likes`);
        if (res.data.success) {
          showAlert("success", "Story unliked.");
        } else {
          fetchLikedStories();
          showAlert("error", "Could not unlike story. Please try again.");
        }
      } catch (err: any) {
        fetchLikedStories();
        showAlert(
          "error",
          err?.response?.data?.error ||
          err?.message ||
          "Failed to unlike story.",
        );
      }
    },
    [fetchLikedStories, showAlert],
  );

  useEffect(() => {
    fetchProfile();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProfile]);

  useEffect(() => {
    setActiveTab("writings");
    setLikedStories([]);
    setHasLoadedLiked(false);
  }, [username]);

  useEffect(() => {
    if (!isSelf && activeTab === "liked") {
      setActiveTab("writings");
    }
  }, [isSelf, activeTab]);

  useEffect(() => {
    if (isSelf && activeTab === "liked" && !hasLoadedLiked) {
      fetchLikedStories();
    }
  }, [isSelf, activeTab, hasLoadedLiked, fetchLikedStories]);

  /* ── Follow / Unfollow ──────────────────────────────────────────────────── */
  const handleFollowToggle = async () => {
    if (!profile || !currentUser) return;
    setFollowLoading(true);
    const prevFollowing = isFollowing;
    const prevCount = profile.followersCount;

    setIsFollowing(!prevFollowing);
    setProfile((p) =>
      p
        ? {
          ...p,
          followersCount: prevFollowing
            ? p.followersCount - 1
            : p.followersCount + 1,
        }
        : null,
    );

    try {
      const res = await api.post(`/users/follow/${profile._id}`);
      if (!res.data.success) throw new Error("Follow request failed");
      setIsFollowing(res.data.isFollowing);
      setProfile((p) =>
        p ? { ...p, followersCount: res.data.followersCount } : null,
      );
      showAlert(
        "success",
        res.data.isFollowing
          ? `You're now following @${profile.username}`
          : `Unfollowed @${profile.username}`,
      );
    } catch {
      setIsFollowing(prevFollowing);
      setProfile((p) => (p ? { ...p, followersCount: prevCount } : null));
      showAlert("error", "Could not update follow status. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  /* ── Followers / Following modal ────────────────────────────────────────── */
  const openFollowsModal = async (type: FollowModalType) => {
    if (!profile) return;
    setModalType(type);
    setModalUsers([]);
    setModalSearch("");
    setModalError(null);
    setModalLoading(true);
    try {
      const res = await api.get(`/users/${type}/${profile._id}`);
      if (res.data.success) {
        setModalUsers(res.data[type] || []);
      } else {
        setModalError(`Could not load ${type}.`);
      }
    } catch {
      setModalError(`Failed to load ${type}. Please try again.`);
    } finally {
      setModalLoading(false);
    }
  };

  /* ── Profile image cropper ──────────────────────────────────────────────── */
  const initProfileCropper = useCallback(() => {
    if (!profilePreviewRef.current) return;
    profileCropperRef.current?.destroy();
    profileCropperRef.current = new Cropper(profilePreviewRef.current, {
      aspectRatio: 1,
      viewMode: 1,
      guides: true,
      autoCropArea: 0.8,
      responsive: true,
    });
  }, []);

  const openProfileEdit = () => {
    setProfileFilter("none");
    setProfileEditError(null);
    setProfileHasImage(false);
    setProfileFileInfo(null);
    setProfileEditOpen(true);
    setTimeout(initProfileCropper, 200);
  };

  const closeProfileEdit = useCallback(() => {
    setProfileEditOpen(false);
    profileCropperRef.current?.destroy();
    profileCropperRef.current = null;
    setProfileFilter("none");
    setProfileEditError(null);
    setProfileHasImage(false);
    setProfileFileInfo(null);
    if (profileInputRef.current) profileInputRef.current.value = "";
  }, []);

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (profileInputRef.current) profileInputRef.current.value = "";
    const error = validateImageFile(file, MAX_PROFILE_BYTES, false);
    if (error) {
      setProfileEditError(error);
      setProfileHasImage(false);
      setProfileFileInfo(null);
      return;
    }
    setProfileEditError(null);
    setProfileHasImage(true);
    setProfileFileInfo({ name: file.name, size: formatBytes(file.size) });
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!profilePreviewRef.current || !ev.target?.result) return;
      profilePreviewRef.current.src = ev.target.result as string;
      setProfileFilter("none");
      profileCropperRef.current?.destroy();
      profileCropperRef.current = null;
      setTimeout(initProfileCropper, 150);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileFilterClick = (val: string) => {
    setProfileFilter(val);
    const targets = [
      document.querySelector(".profile-edit-modal .cropper-view-box img"),
      document.querySelector(".profile-edit-modal .cropper-canvas img"),
    ] as (HTMLElement | null)[];
    targets.forEach((el) => {
      if (el) el.style.filter = val === "none" ? "" : val;
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileEditError(null);
    if (!profileCropperRef.current) {
      setProfileEditError("Please select and position an image first.");
      return;
    }
    setProfileUploading(true);
    try {
      const sourceCanvas = profileCropperRef.current.getCroppedCanvas({
        width: 400,
        height: 400,
      });
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = sourceCanvas.width;
      finalCanvas.height = sourceCanvas.height;
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      if (profileFilter !== "none") ctx.filter = profileFilter;
      ctx.drawImage(sourceCanvas, 0, 0);
      const blob = await canvasToBlob(finalCanvas);
      if (blob.size > MAX_PROFILE_BYTES) {
        setProfileEditError(
          `Processed image is ${formatBytes(blob.size)}, which exceeds the ${MAX_PROFILE_IMAGE_MB}MB limit. Try a smaller source image.`,
        );
        return;
      }
      const fd = new FormData();
      fd.append("image", blob, "profile.jpg");
      const res = await api.put("/users/profile/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data.success) {
        setProfileEditError("Upload failed. Please try again.");
        return;
      }
      const url: string = res.data.imageUrl || res.data.image?.url;
      setProfile((p) =>
        p ? { ...p, image: { url, filename: "profile_image" } } : null,
      );
      if (currentUser) {
        login({ ...currentUser, image: { url, filename: "profile_image" } });
      }
      closeProfileEdit();
      showAlert("success", "Profile picture updated successfully!");
    } catch (err: any) {
      setProfileEditError(extractUploadError(err, MAX_PROFILE_IMAGE_MB));
    } finally {
      setProfileUploading(false);
    }
  };

  /* ── Banner editor ──────────────────────────────────────────────────────── */
  const openBannerEdit = () => {
    setBannerFilter("none");
    setBannerSelected(false);
    setBannerEditError(null);
    setBannerIsGif(false);
    setBannerGifFile(null);
    setBannerGifPreviewUrl(null);
    setBannerFileInfo(null);
    setBannerEditOpen(true);
  };

  const closeBannerEdit = useCallback(() => {
    setBannerEditOpen(false);
    bannerCropperRef.current?.destroy();
    bannerCropperRef.current = null;
    setBannerFilter("none");
    setBannerSelected(false);
    setBannerEditError(null);
    setBannerIsGif(false);
    setBannerGifFile(null);
    setBannerFileInfo(null);
    setBannerGifPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }, []);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    const error = validateImageFile(file, MAX_BANNER_BYTES, true);
    if (error) {
      setBannerEditError(error);
      setBannerSelected(false);
      setBannerFileInfo(null);
      return;
    }
    setBannerEditError(null);
    setBannerSelected(true);
    setBannerFileInfo({ name: file.name, size: formatBytes(file.size) });
    const isGif = file.type === "image/gif";
    setBannerIsGif(isGif);
    if (isGif) {
      bannerCropperRef.current?.destroy();
      bannerCropperRef.current = null;
      setBannerGifFile(file);
      setBannerFilter("none");
      setBannerGifPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      return;
    }
    setBannerGifFile(null);
    setBannerGifPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!bannerPreviewRef.current || !ev.target?.result) return;
      bannerCropperRef.current?.destroy();
      bannerCropperRef.current = null;
      bannerPreviewRef.current.src = ev.target.result as string;
      setBannerFilter("none");
      setTimeout(() => {
        if (!bannerPreviewRef.current) return;
        bannerCropperRef.current = new Cropper(bannerPreviewRef.current, {
          aspectRatio: 16 / 5,
          viewMode: 1,
          guides: true,
          autoCropArea: 1,
        });
      }, 200);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFilterClick = (val: string) => {
    setBannerFilter(val);
    const el = document.querySelector(
      ".banner-edit-modal .cropper-view-box img",
    ) as HTMLElement | null;
    if (el) el.style.filter = val === "none" ? "" : val;
  };

  const uploadBanner = async (blob: Blob, filename: string) => {
    const fd = new FormData();
    fd.append("image", blob, filename);
    const res = await api.put("/users/profile/banner", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!res.data.success) {
      throw new Error("Upload failed");
    }
    const url: string = res.data.bannerUrl || res.data.banner?.url;
    setProfile((p) =>
      p ? { ...p, banner: { url, filename: "banner_image" } } : null,
    );
    if (currentUser) {
      login({ ...currentUser, banner: { url, filename: "banner_image" } });
    }
    closeBannerEdit();
    showAlert("success", "Cover photo updated!");
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerEditError(null);
    if (bannerIsGif) {
      if (!bannerGifFile) {
        setBannerEditError("Please select a GIF file first.");
        return;
      }
      setBannerUploading(true);
      try {
        await uploadBanner(bannerGifFile, "banner.gif");
      } catch (err: any) {
        setBannerEditError(extractUploadError(err, MAX_BANNER_IMAGE_MB));
      } finally {
        setBannerUploading(false);
      }
      return;
    }
    if (!bannerCropperRef.current) {
      setBannerEditError("Please select a banner image first.");
      return;
    }
    setBannerUploading(true);
    try {
      const sourceCanvas = bannerCropperRef.current.getCroppedCanvas({
        width: 1200,
        height: 375,
      });
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = sourceCanvas.width;
      finalCanvas.height = sourceCanvas.height;
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      if (bannerFilter !== "none") ctx.filter = bannerFilter;
      ctx.drawImage(sourceCanvas, 0, 0);
      const blob = await canvasToBlob(finalCanvas);
      if (blob.size > MAX_BANNER_BYTES) {
        setBannerEditError(
          `Processed image is ${formatBytes(blob.size)}, which exceeds the ${MAX_BANNER_IMAGE_MB}MB limit. Try a smaller source image.`,
        );
        return;
      }
      await uploadBanner(blob, "banner.jpg");
    } catch (err: any) {
      setBannerEditError(extractUploadError(err, MAX_BANNER_IMAGE_MB));
    } finally {
      setBannerUploading(false);
    }
  };

  const handleDeleteBanner = async () => {
    setBannerEditError(null);
    try {
      await api.delete("/users/profile/banner");
      setProfile((p) => (p ? { ...p, banner: undefined } : null));
      if (currentUser) {
        login({ ...currentUser, banner: undefined });
      }
      closeBannerEdit();
      showAlert("success", "Cover photo removed.");
    } catch (err: any) {
      setBannerEditError(
        err?.response?.data?.error ||
        "Failed to remove cover photo. Try again.",
      );
    }
  };

  /* ── Loading / Error / Missing states ───────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-11 h-11 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin mx-auto mb-3.5" />
          <p className="text-[13px] text-gray-500 font-medium">
            Loading profile…
          </p>
        </div>
      </div>
    );
  }

  if (pageError) {
    const isNotFound =
      pageError.toLowerCase().includes("not exist") ||
      pageError.toLowerCase().includes("not found");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ErrorCard
            variant="centered"
            title={isNotFound ? "Profile not found" : "Failed to load profile"}
            message={pageError}
            actionLabel="Try again"
            onAction={fetchProfile}
            secondaryActionLabel="Go back"
            onSecondaryAction={() => navigate(-1)}
          />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ErrorCard
            variant="centered"
            title="Profile not found"
            message="This user profile does not exist or could not be loaded."
            secondaryActionLabel="Go back"
            onSecondaryAction={() => navigate(-1)}
          />
        </div>
      </div>
    );
  }

  const storiesTotalCount = profile.storiesCount || stories.length;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50/80 text-gray-900">
      {/* Global alert */}
      {alert && (
        <div className="max-w-xl mx-auto px-4 pt-3">
          <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
        </div>
      )}

      <main className="max-w-[74rem] mx-auto sm:px-4 lg:px-6 sm:pt-4 pb-20">
        {/* ====================================================================
         * LIGHT-MODE CREATOR PROFILE CARD (Inspired by Reference Layout)
         * ================================================================== */}
        <section className="bg-white sm:rounded-[28px] border-b sm:border border-gray-200/80 overflow-hidden shadow-2xs">
          {/* Cover Banner */}
          <div
            className="relative w-full overflow-hidden bg-gray-100"
            style={{ aspectRatio: "16/5" }}
          >
            {profile.banner?.url ? (
              <img
                src={profile.banner.url}
                alt="Cover"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setBannerViewOpen(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 via-gray-100 to-stone-200/70" />
            )}

            {isSelf && (
              <button
                onClick={openBannerEdit}
                className="absolute top-3 right-3 sm:bottom-3 sm:top-auto flex items-center gap-1.5 bg-black/45 hover:bg-black/65 backdrop-blur-md text-white text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span>Edit cover</span>
              </button>
            )}
          </div>

          {/* Creator Identity + 3-Col Divided Stats + Recessed Pill Action Bar */}
          <div className="px-4 sm:px-7 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
              {/* Left / Center on Mobile: Avatar, Name, Username, Bio */}
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                {/* Avatar */}
                <div className="relative -mt-12 sm:-mt-16 mb-3">
                  <div
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-[26px] ring-4 ring-white overflow-hidden shadow-md bg-gray-100 cursor-pointer flex-shrink-0"
                    onClick={() =>
                      profile.image?.url && setProfileViewOpen(true)
                    }
                  >
                    <img
                      src={profile.image?.url || avatarUrl(profile.name)}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isSelf && (
                    <button
                      onClick={openProfileEdit}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center shadow-md border-2 border-white active:scale-90 transition-all"
                      title="Change photo"
                    >
                      <Camera className="w-3.5 h-3.5" strokeWidth={2.3} />
                    </button>
                  )}
                </div>

                {/* Name & Handle */}
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                  <h1 className="text-[20px] sm:text-[23px] font-bold text-gray-900 tracking-tight">
                    {profile.name}
                  </h1>
                  {followsMe && !isSelf && (
                    <span className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      Follows you
                    </span>
                  )}
                </div>

                <p className="text-[13px] text-gray-400 font-medium mt-0.5 mb-2.5">
                  @{profile.username}
                </p>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-[13.5px] text-gray-600 leading-relaxed whitespace-pre-wrap max-w-lg">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Right / Bottom on Mobile: Reference-Inspired 3-Col Stats & Recessed Action Dock */}
              <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3.5">
                {/* 3-Column Divided Metrics Bar (Stories | Followers | Following) */}
                <div className="w-full sm:w-auto min-w-[280px] sm:min-w-[320px] grid grid-cols-3 items-center bg-gray-50/90 border border-gray-200/70 rounded-2xl py-3 px-2">
                  <div className="flex flex-col items-center justify-center px-3">
                    <span className="text-[16px] sm:text-[18px] font-bold text-gray-900 tracking-tight leading-none">
                      {formatNumber(storiesTotalCount)}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium mt-1">
                      {storiesTotalCount === 1 ? "Story" : "Stories"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openFollowsModal("followers")}
                    className="flex flex-col items-center justify-center px-3 border-x border-gray-200/80 hover:opacity-75 transition-opacity"
                  >
                    <span className="text-[16px] sm:text-[18px] font-bold text-gray-900 tracking-tight leading-none">
                      {formatNumber(profile.followersCount)}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium mt-1">
                      {profile.followersCount === 1 ? "Follower" : "Followers"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openFollowsModal("following")}
                    className="flex flex-col items-center justify-center px-3 hover:opacity-75 transition-opacity"
                  >
                    <span className="text-[16px] sm:text-[18px] font-bold text-gray-900 tracking-tight leading-none">
                      {formatNumber(profile.followingCount)}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium mt-1">
                      Following
                    </span>
                  </button>
                </div>

                {/* Recessed Pill Action Dock */}
                {!isSelf && currentUser ? (
                  <div className="w-full sm:w-auto min-w-[280px] sm:min-w-[320px] flex items-center justify-between gap-2 p-1.5 rounded-full bg-gray-100/90 border border-gray-200/80">
                    <div className="flex items-center gap-1.5 pl-0.5">
                      <button
                        onClick={() => navigate(`/chat?user=${profile._id}`)}
                        className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-2xs border border-gray-200/80 transition-all active:scale-95"
                        title="Message"
                        aria-label="Message"
                      >
                        <MessageCircle className="w-4 h-4" strokeWidth={1.9} />
                      </button>
                      <button
                        onClick={() => openFollowsModal("followers")}
                        className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-2xs border border-gray-200/80 transition-all active:scale-95"
                        title="Followers"
                        aria-label="Followers"
                      >
                        <Users className="w-4 h-4" strokeWidth={1.9} />
                      </button>
                    </div>

                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`flex-1 sm:flex-initial min-w-[140px] h-9 px-5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-60 ${isFollowing
                          ? "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 shadow-2xs"
                          : "bg-gray-900 text-white hover:bg-gray-800 shadow-2xs"
                        }`}
                    >
                      {followLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFollowing ? (
                        "Following"
                      ) : followsMe ? (
                        "Follow back"
                      ) : (
                        "Follow"
                      )}
                    </button>
                  </div>
                ) : isSelf ? (
                  <div className="w-full sm:w-auto min-w-[280px] sm:min-w-[320px] flex items-center justify-between gap-2 p-1.5 rounded-full bg-gray-100/90 border border-gray-200/80">
                    <div className="flex items-center gap-1.5 pl-0.5">
                      <Link
                        to="/diary/calendar"
                        className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-2xs border border-gray-200/80 transition-all active:scale-95"
                        title="My Diary Calendar"
                      >
                        <Calendar className="w-4 h-4" strokeWidth={1.9} />
                      </Link>
                      <Link
                        to="/settings"
                        className="h-9 px-3.5 rounded-full bg-white hover:bg-gray-50 text-gray-700 text-[12.5px] font-semibold flex items-center gap-1.5 shadow-2xs border border-gray-200/80 transition-all active:scale-95"
                        title="Edit profile"
                      >
                        <Settings className="w-3.5 h-3.5" strokeWidth={1.9} />
                        <span>Edit</span>
                      </Link>
                    </div>

                    <Link
                      to="/write"
                      className="flex-1 sm:flex-initial min-w-[130px] h-9 px-5 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
                    >
                      <Feather className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Write</span>
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Calendar Entry Point for Owner */}
            {isSelf && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <Link
                  to="/diary/calendar"
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/60 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex items-center justify-center text-gray-700 group-hover:text-gray-900 transition-colors">
                      <Calendar className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-gray-900">
                        My Diary Calendar
                      </h3>
                      <p className="text-[11.5px] text-gray-400">
                        See what you wrote on each day
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors pr-1">
                    <span>View</span>
                    <ChevronRight
                      className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all"
                      strokeWidth={2}
                    />
                  </div>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ====================================================================
         * TABS
         * ================================================================== */}
        <div
          className="sticky z-20 bg-white/95 backdrop-blur-md border-b border-gray-200/80 sm:rounded-t-2xl sm:mt-4 sm:border-x sm:border-t"
          style={{ top: STICKY_TAB_TOP_OFFSET }}
        >
          <div className="max-w-2xl mx-auto flex">
            {(isSelf
              ? (["writings", "liked", "about"] as const)
              : (["writings", "about"] as const)
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-semibold capitalize transition-colors relative ${activeTab === tab
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {tab === "writings" ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Writings</span>
                    {stories.length > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "writings"
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {stories.length}
                      </span>
                    )}
                  </>
                ) : tab === "liked" ? (
                  <>
                    <Heart className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Liked</span>
                    {(likedCount > 0 || likedStories.length > 0) && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "liked"
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {hasLoadedLiked ? likedStories.length : likedCount}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>About</span>
                  </>
                )}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-6 right-6 h-0.5 bg-gray-900 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ====================================================================
         * TAB CONTENT
         * ================================================================== */}
        <div className="px-4 sm:px-0 pt-4">
          {/* WRITINGS TAB */}
          {activeTab === "writings" && (
            <div className="animate-fadeIn">
              {reversedStories.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 border border-gray-200/80 text-center mt-2">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Feather
                      className="w-6 h-6 text-gray-300"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">
                    {isSelf ? "Write your first story" : "No stories yet"}
                  </h3>
                  <p className="text-[12.5px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                    {isSelf
                      ? "Your published stories will appear here."
                      : `@${profile.username} hasn't published any stories yet.`}
                  </p>
                  {isSelf && (
                    <Link
                      to="/write"
                      className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-full text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                      Write a story
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3.5">
                    <p className="text-[12px] text-gray-400 font-medium">
                      {reversedStories.length}{" "}
                      {reversedStories.length === 1 ? "story" : "stories"}
                    </p>
                    <div className="flex items-center gap-1 bg-gray-200/70 rounded-lg p-1">
                      <button
                        onClick={() => setStoriesView("grid")}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${storiesView === "grid"
                            ? "bg-white shadow-2xs text-gray-900"
                            : "text-gray-400 hover:text-gray-600"
                          }`}
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setStoriesView("list")}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${storiesView === "list"
                            ? "bg-white shadow-2xs text-gray-900"
                            : "text-gray-400 hover:text-gray-600"
                          }`}
                        aria-label="List view"
                      >
                        <List className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {storiesView === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {reversedStories.map((story) => (
                        <GridStoryCard key={story._id} story={story} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-w-4xl mx-auto">
                      {reversedStories.map((story) => (
                        <ListStoryCard key={story._id} story={story} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* LIKED TAB */}
          {isSelf && activeTab === "liked" && (
            <div className="animate-fadeIn">
              {loadingLiked && !hasLoadedLiked ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : likedStories.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 border border-gray-200/80 text-center mt-2">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                    <Heart
                      className="w-6 h-6 text-rose-300"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">
                    No liked stories yet
                  </h3>
                  <p className="text-[12.5px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Stories you like while browsing Diary will appear here.
                  </p>
                  <Link
                    to="/stories"
                    className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-full text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                  >
                    Explore stories →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3.5">
                    <p className="text-[12px] text-gray-400 font-medium">
                      {likedStories.length}{" "}
                      {likedStories.length === 1
                        ? "liked story"
                        : "liked stories"}
                    </p>
                    <div className="flex items-center gap-1 bg-gray-200/70 rounded-lg p-1">
                      <button
                        onClick={() => setStoriesView("grid")}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${storiesView === "grid"
                            ? "bg-white shadow-2xs text-gray-900"
                            : "text-gray-400 hover:text-gray-600"
                          }`}
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setStoriesView("list")}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${storiesView === "list"
                            ? "bg-white shadow-2xs text-gray-900"
                            : "text-gray-400 hover:text-gray-600"
                          }`}
                        aria-label="List view"
                      >
                        <List className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {storiesView === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {likedStories.map((story) => (
                        <GridStoryCard
                          key={story._id}
                          story={story}
                          showUnlike={true}
                          onUnlike={handleUnlike}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-w-4xl mx-auto">
                      {likedStories.map((story) => (
                        <ListStoryCard
                          key={story._id}
                          story={story}
                          showUnlike={true}
                          onUnlike={handleUnlike}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="animate-fadeIn max-w-2xl mx-auto space-y-3 pb-6 mt-1">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Activity
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <StatBlock
                    icon={
                      <Eye
                        className="w-4 h-4 text-gray-500"
                        strokeWidth={1.8}
                      />
                    }
                    label="Total reads"
                    value={formatNumber(totalViews)}
                  />
                  <StatBlock
                    icon={
                      <Heart
                        className="w-4 h-4 text-gray-500"
                        strokeWidth={1.8}
                      />
                    }
                    label="Total likes"
                    value={formatNumber(totalLikes)}
                  />
                  <StatBlock
                    icon={
                      <BookOpen
                        className="w-4 h-4 text-gray-500"
                        strokeWidth={1.8}
                      />
                    }
                    label="Published"
                    value={`${storiesTotalCount} stories`}
                  />
                  <StatBlock
                    icon={
                      <Users
                        className="w-4 h-4 text-gray-500"
                        strokeWidth={1.8}
                      />
                    }
                    label="Followers"
                    value={formatNumber(profile.followersCount)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Details
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <Calendar
                      className="w-4 h-4 text-gray-500"
                      strokeWidth={1.8}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Member since</p>
                    <p className="text-[13.5px] font-semibold text-gray-800">
                      {formatJoinDate(profile.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {isSelf && (
                <Link
                  to="/diary/calendar"
                  className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200/80 hover:border-gray-300 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                      <Calendar className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">
                        My Diary Calendar
                      </p>
                      <p className="text-[11px] text-gray-400">
                        See what you wrote on each day
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform"
                    strokeWidth={2}
                  />
                </Link>
              )}

              {isSelf && (
                <Link
                  to="/write"
                  className="flex items-center justify-between bg-gray-900 text-white rounded-2xl p-4 hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                      <Feather className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">Start writing</p>
                      <p className="text-[11px] text-gray-400">
                        Share your story with the world
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform"
                    strokeWidth={2}
                  />
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Banner lightbox */}
      {bannerViewOpen && profile.banner?.url && (
        <LightboxModal onClose={() => setBannerViewOpen(false)}>
          <img
            src={profile.banner.url}
            alt="Banner"
            className="w-full max-h-[80vh] object-contain rounded-xl"
          />
        </LightboxModal>
      )}

      {/* Profile image lightbox */}
      {profileViewOpen && profile.image?.url && (
        <LightboxModal onClose={() => setProfileViewOpen(false)}>
          <img
            src={profile.image.url}
            alt={profile.name}
            className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-2xl shadow-2xl"
          />
        </LightboxModal>
      )}

      {/* Profile image editor */}
      {profileEditOpen && (
        <BottomSheetModal
          title="Update profile photo"
          onClose={closeProfileEdit}
          className="profile-edit-modal"
        >
          <div className="p-5 space-y-4">
            <div
              className="relative mx-auto overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200"
              style={{ width: 200, height: 200, borderRadius: "50%" }}
            >
              <img
                ref={profilePreviewRef}
                src={profile.image?.url || avatarUrl(profile.name)}
                alt="Preview"
                className="block max-w-full"
              />
              {!profileHasImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-full pointer-events-none">
                  <ImageIcon
                    className="w-7 h-7 text-white/80 mb-1"
                    strokeWidth={1.5}
                  />
                  <span className="text-[11px] text-white/80 font-medium">
                    Choose photo
                  </span>
                </div>
              )}
            </div>
            {profileFileInfo && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full truncate max-w-[220px]">
                  {profileFileInfo.name} · {profileFileInfo.size}
                </span>
              </div>
            )}
            {profileHasImage && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Filters
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {PROFILE_FILTERS.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => handleProfileFilterClick(f.value)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all whitespace-nowrap border ${profileFilter === f.value
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <SizeHint mb={MAX_PROFILE_IMAGE_MB} formats="JPG, PNG, WEBP" />
            <FieldError message={profileEditError} />
            <form onSubmit={handleProfileSubmit}>
              <input
                ref={profileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleProfileFileChange}
              />
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[13px] font-semibold text-gray-700 transition-colors border border-gray-200"
                >
                  <ImageIcon className="w-4 h-4" strokeWidth={2} />
                  {profileHasImage ? "Change photo" : "Choose photo"}
                </button>
                <button
                  type="submit"
                  disabled={profileUploading || !profileHasImage}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" strokeWidth={2.5} /> Save photo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </BottomSheetModal>
      )}

      {/* Banner editor */}
      {bannerEditOpen && (
        <BottomSheetModal
          title="Update cover photo"
          onClose={closeBannerEdit}
          maxW="max-w-xl"
          className="banner-edit-modal"
          headerExtra={
            profile.banner?.url ? (
              <button
                onClick={handleDeleteBanner}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                Remove
              </button>
            ) : null
          }
        >
          <div className="p-5 space-y-4">
            <div
              className="relative w-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 rounded-xl"
              style={{ aspectRatio: "16/5" }}
            >
              {bannerIsGif && bannerGifPreviewUrl ? (
                <img
                  src={bannerGifPreviewUrl}
                  alt="GIF preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  ref={bannerPreviewRef}
                  src={
                    profile.banner?.url ||
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                  }
                  alt="Banner preview"
                  className="block max-w-full max-h-full w-full"
                />
              )}
              {!bannerSelected && !profile.banner?.url && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <ImageIcon
                    className="w-7 h-7 text-gray-300 mb-1.5"
                    strokeWidth={1.5}
                  />
                  <p className="text-[12px] text-gray-400 font-medium">
                    Choose a cover photo
                  </p>
                  <p className="text-[10.5px] text-gray-300 mt-0.5">
                    Recommended: 1200 × 375px · GIF supported
                  </p>
                </div>
              )}
            </div>
            {bannerFileInfo && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full truncate max-w-[260px]">
                  {bannerFileInfo.name} · {bannerFileInfo.size}
                </span>
              </div>
            )}
            {bannerIsGif && bannerSelected && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
                <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-black text-white leading-none">
                    GIF
                  </span>
                </div>
                <p className="text-[12px] text-blue-700 font-medium">
                  Animated GIF — saved as-is to keep the animation.
                </p>
              </div>
            )}
            {!bannerIsGif && bannerSelected && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Filters
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {BANNER_FILTERS.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => handleBannerFilterClick(f.value)}
                      className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all border ${bannerFilter === f.value
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <SizeHint mb={MAX_BANNER_IMAGE_MB} formats="JPG, PNG, WEBP, GIF" />
            <FieldError message={bannerEditError} />
            <form onSubmit={handleBannerSubmit}>
              <input
                ref={bannerInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleBannerFileChange}
              />
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[13px] font-semibold text-gray-700 transition-colors border border-gray-200"
                >
                  <ImageIcon className="w-4 h-4" strokeWidth={2} />
                  {bannerSelected ? "Change image" : "Choose image"}
                </button>
                <button
                  type="submit"
                  disabled={bannerUploading || !bannerSelected}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bannerUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" strokeWidth={2.5} /> Save cover
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </BottomSheetModal>
      )}

      {/* ====================================================================
       * FOLLOWERS / FOLLOWING MODAL (Light Theme + Portrait Cards Option)
       * ================================================================== */}
      {modalType && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setModalType(null)}
        >
          <div className="bg-white w-full sm:max-w-md sm:rounded-[28px] rounded-t-[28px] max-h-[80vh] flex flex-col shadow-xl border border-gray-100 animate-slideUp overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-gray-900 capitalize">
                    {modalType}
                  </h3>
                  {!modalLoading && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {modalUsers.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setModalLayout((prev) =>
                        prev === "cards" ? "list" : "cards",
                      )
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                    title={
                      modalLayout === "cards"
                        ? "Switch to list view"
                        : "Switch to card view"
                    }
                  >
                    {modalLayout === "cards" ? (
                      <List className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      <Grid3X3 className="w-4 h-4" strokeWidth={2} />
                    )}
                  </button>
                  <button
                    onClick={() => setModalType(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {modalUsers.length > 0 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder={`Search ${modalType}…`}
                    className="w-full bg-gray-100/80 focus:bg-white text-gray-900 placeholder-gray-400 text-[12.5px] rounded-full pl-9 pr-8 py-2 border border-gray-200/80 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  {modalSearch && (
                    <button
                      type="button"
                      onClick={() => setModalSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-3.5">
              {modalLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin" />
                </div>
              ) : modalError ? (
                <div className="p-4">
                  <FieldError message={modalError} />
                  <button
                    onClick={() => modalType && openFollowsModal(modalType)}
                    className="w-full mt-3 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredModalUsers.length === 0 ? (
                <div className="py-14 text-center px-5">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Users
                      className="w-5 h-5 text-gray-300"
                      strokeWidth={1.8}
                    />
                  </div>
                  <p className="text-[14px] font-bold text-gray-800">
                    {modalSearch ? "No matching people" : "No one here yet"}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-1">
                    {modalSearch
                      ? `No results for "${modalSearch}"`
                      : modalType === "followers"
                        ? "No followers yet."
                        : "Not following anyone yet."}
                  </p>
                </div>
              ) : modalLayout === "cards" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredModalUsers.map((u) => (
                    <Link
                      key={u._id}
                      to={`/profile/${u.username}`}
                      onClick={() => setModalType(null)}
                      className="group relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/80 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                      style={{ aspectRatio: "3/4" }}
                    >
                      <img
                        src={u.image?.url || avatarUrl(u.name)}
                        alt={u.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-2.5">
                        <p className="text-[12.5px] font-bold text-white truncate leading-tight">
                          {u.name}
                        </p>
                        <p className="text-[10.5px] text-white/80 truncate mt-0.5">
                          @{u.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredModalUsers.map((u) => (
                    <Link
                      key={u._id}
                      to={`/profile/${u.username}`}
                      onClick={() => setModalType(null)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <img
                        src={u.image?.url || avatarUrl(u.name)}
                        alt={u.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          @{u.username}
                        </p>
                      </div>
                      <ChevronRight
                        className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                        strokeWidth={2}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.22s ease-out; }
        .animate-slideUp { animation: slideUp 0.28s ease-out; }
      `,
        }}
      />
    </div>
  );
};

export default Profile;