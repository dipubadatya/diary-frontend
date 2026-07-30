// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { useSocket } from '../contexts/SocketContext';
// import api from '../services/api';
// import toast from 'react-hot-toast';
// import moment from 'moment';
// import { ErrorCard } from '../components/ErrorCard';

// interface Story {
//   _id: string;
//   title: string;
//   story: string;
//   category: string;
//   image?: {
//     url: string;
//   };
//   owner: {
//     _id: string;
//     username: string;
//     name: string;
//     image?: {
//       url: string;
//     };
//   };
//   views: string[];
//   likedBy: string[];
//   timeStamp: string;
// }

// interface Writer {
//   _id: string;
//   username: string;
//   name: string;
//   image?: {
//     url: string;
//   };
//   followers: string[];
//   storiesCount: number;
// }

// export const Stories: React.FC = () => {
//   const { user, logout } = useAuth();
//   const { socket } = useSocket();
//   const navigate = useNavigate();

//   const [stories, setStories] = useState<Story[]>([]);
//   const [topWriters, setTopWriters] = useState<Writer[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState('');
//   const [category, setCategory] = useState('');
//   const [sortBy, setSortBy] = useState('newest');

//   // Dropdown states
//   const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
//   const [unreadNotifications, setUnreadNotifications] = useState(0);
//   const [unreadMessages, setUnreadMessages] = useState(0);

//   // Fetch unread badges
//   const checkBadges = async () => {
//     if (!user) return;
//     try {
//       const notifRes = await api.get('/users/notifications/unread-count');
//       if (notifRes.data.success) {
//         setUnreadNotifications(notifRes.data.unreadCount || 0);
//       }

//       const chatRes = await api.get('/chat/conversations');
//       if (chatRes.data.success) {
//         const totalUnread = chatRes.data.conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
//         setUnreadMessages(totalUnread);
//       }
//     } catch (err) {
//       console.error('Badge checks failed:', err);
//     }
//   };

//   // Fetch Stories Feed
//   const fetchStories = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const res = await api.get('/stories', {
//         params: {
//           search,
//           category: category || undefined,
//           sort: sortBy
//         }
//       });
//       if (res.data.success) {
//         setStories(res.data.stories);
//         if (res.data.topFiveWriters) {
//           setTopWriters(res.data.topFiveWriters);
//         }
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to load stories feed.');
//       toast.error('Failed to load stories feed.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStories();
//   }, [search, category, sortBy]);

//   useEffect(() => {
//     checkBadges();
//     const interval = setInterval(checkBadges, 8000);
//     return () => clearInterval(interval);
//   }, [user]);

//   // Socket notification hooks
//   useEffect(() => {
//     if (!socket || !user) return;

//     const handleNotification = () => {
//       setUnreadNotifications(prev => prev + 1);
//     };
//     const handleMessage = () => {
//       setUnreadMessages(prev => prev + 1);
//     };

//     socket.on('newNotification', handleNotification);
//     socket.on('newMessage', handleMessage);

//     return () => {
//       socket.off('newNotification', handleNotification);
//       socket.off('newMessage', handleMessage);
//     };
//   }, [socket, user]);

//   const handleLogout = async () => {
//     await logout();
//     navigate('/login');
//   };

//   // Category Pills definition
//   const pills = [
//     { value: '', label: 'All', icon: 'ri-compass-3-line' },
//     { value: 'random-thoughts', label: 'Thoughts', icon: 'ri-lightbulb-flash-line' },
//     { value: 'poetry', label: 'Poetry', icon: 'ri-quill-pen-line' },
//     { value: 'drama', label: 'Adventure', icon: 'ri-sword-line' },
//     { value: 'mystery', label: 'Mystery', icon: 'ri-spy-line' },
//     { value: 'fantasy', label: 'Fantasy', icon: 'ri-magic-line' }
//   ];

//   // System Dark Mode Toggler
//   const toggleTheme = () => {
//     const isDark = document.documentElement.classList.toggle('dark');
//     localStorage.setItem('theme', isDark ? 'dark' : 'light');
//   };

//   return (
//     <div className="bg-bgLight dark:bg-bgDark text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-500 font-sans pb-28 md:pb-12 selection:bg-brand/20 selection:text-brand">

//       <main className="max-w-7xl mx-auto w-full px-5 md:px-8 pt-6 md:pt-10">

//         {/* Header Section */}
//         <header className="flex justify-between items-center mb-8 md:mb-12">
//           {/* Left: User welcome or guest welcome */}
//           <div className="flex items-center gap-3">
//             {user ? (
//               <>
//                 <div className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden shadow-sm border border-borderLight dark:border-borderDark">
//                   <img
//                     src={user.image?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'}
//                     className="w-full h-full object-cover"
//                     alt={user.name}
//                   />
//                 </div>
//                 <div className="flex flex-col justify-center">
//                   <p className="text-[12px] md:text-sm text-gray-500 font-semibold tracking-wide">
//                     Hello, {user.username} <span className="text-sm ml-0.5">👋</span>
//                   </p>
//                   <h1 className="text-[16px] md:text-xl font-extrabold leading-tight mt-0.5">Let's read now</h1>
//                 </div>
//               </>
//             ) : (
//               <>
//                 <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-brandLight dark:bg-brand/10 flex items-center justify-center text-brand">
//                   <i className="ri-book-open-line text-xl md:text-2xl"></i>
//                 </div>
//                 <div className="flex flex-col justify-center">
//                   <p className="text-[12px] md:text-sm text-gray-500 font-semibold tracking-wide">Welcome to DIARY.</p>
//                   <Link to="/login" className="text-[16px] md:text-xl font-extrabold leading-tight text-brand">
//                     Login to continue
//                   </Link>
//                 </div>
//               </>
//             )}
//           </div>

//           {/* Center: Desktop Navigation Dock */}
//           {user && (
//             <nav className="hidden md:flex items-center gap-8 bg-white dark:bg-cardDark px-8 py-3 rounded-full border border-borderLight dark:border-borderDark shadow-sm font-semibold">
//               <Link to="/stories" className="text-brand flex items-center gap-2 font-bold">
//                 <i className="ri-home-5-fill text-xl"></i> Home
//               </Link>
//               <Link to={`/profile/${user.username}`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 font-semibold">
//                 <i className="ri-map-2-line text-xl"></i> Explore
//               </Link>
//               <Link to="/write" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 font-semibold">
//                 <i className="ri-add-circle-line text-xl"></i> Write
//               </Link>
//             </nav>
//           )}

//           {/* Right: Notification Toggles & Dropdowns */}
//           <div className="flex items-center gap-2 md:gap-4">
//             <Link
//               to="/notifications"
//               className="relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-cardDark transition-colors"
//             >
//               <i className="ri-notification-4-line text-[22px]"></i>
//               {unreadNotifications > 0 && (
//                 <span className="absolute top-2 right-2.5 w-2 h-2 bg-brand rounded-full ring-2 ring-white dark:ring-bgDark"></span>
//               )}
//             </Link>

//             <button
//               onClick={toggleTheme}
//               className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-cardDark transition-colors"
//             >
//               <i id="theme-icon" className="ri-sound-module-line text-[22px]"></i>
//             </button>

//             {user && (
//               <div className="relative group hidden md:block cursor-pointer ml-2">
//                 <button
//                   onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
//                   className="flex items-center gap-2 bg-white dark:bg-cardDark border border-borderLight dark:border-borderDark pl-2 pr-4 py-1.5 rounded-full hover:shadow-md transition-all"
//                 >
//                   <img
//                     src={user.image?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'}
//                     className="w-8 h-8 rounded-full object-cover"
//                     alt={user.username}
//                   />
//                   <i className="ri-arrow-down-s-line text-gray-500"></i>
//                 </button>

//                 {profileDropdownOpen && (
//                   <>
//                     <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
//                     <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-cardDark rounded-2xl shadow-app border border-borderLight dark:border-borderDark py-2 z-[70] overflow-hidden">
//                       <Link
//                         to={`/profile/${user.username}`}
//                         onClick={() => setProfileDropdownOpen(false)}
//                         className="block px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
//                       >
//                         <i className="ri-dashboard-line mr-2 text-gray-400"></i> Dashboard
//                       </Link>
//                       <Link
//                         to="/settings"
//                         onClick={() => setProfileDropdownOpen(false)}
//                         className="block px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
//                       >
//                         <i className="ri-user-line mr-2 text-gray-400"></i> Profile
//                       </Link>
//                       <button
//                         onClick={() => {
//                           setProfileDropdownOpen(false);
//                           handleLogout();
//                         }}
//                         className="w-full text-left block px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
//                       >
//                         <i className="ri-logout-box-line mr-2"></i> Logout
//                       </button>
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//         </header>

//         {/* Search, Pills, Banner Layout */}
//         <div className="md:grid md:grid-cols-12 md:gap-8">

//           {/* Left Column (Search, Hero, Filters) */}
//           <div className="md:col-span-12 lg:col-span-8">
//             {/* Search Input Box */}
//             <section className="mb-6 md:mb-8">
//               <div className="relative w-full shadow-sm group">
//                 <i className="ri-search-2-line absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-focus-within:text-brand transition-colors"></i>
//                 <input
//                   type="text"
//                   placeholder="Search stories, authors, or categories..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="w-full pl-12 pr-4 py-4 bg-white dark:bg-cardDark border border-borderLight dark:border-borderDark rounded-full outline-none text-base font-medium focus:border-brand dark:focus:border-brand transition-all placeholder:text-gray-400"
//                 />
//               </div>
//             </section>

//             {/* Category Pills Filters */}
//             <section className="mb-8">
//               <div className="flex flex-wrap md:flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-2 mask-image-fade">
//                 <div className="flex gap-3 w-full">
//                   {pills.map((pill) => (
//                     <button
//                       key={pill.value}
//                       onClick={() => setCategory(pill.value)}
//                       className={`category-pill ${category === pill.value ? 'active' : ''}`}
//                     >
//                       <i className={pill.icon}></i>
//                       <span>{pill.label}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </section>

//             {/* Hero Brand Banner */}
//             <section className="mb-10">
//               <div className="w-full bg-gradient-to-r from-[#FF8C42] to-[#FE5621] rounded-[24px] p-6 md:p-10 relative overflow-hidden shadow-orange">
//                 <div className="absolute -right-6 -bottom-6 w-32 md:w-64 md:h-64 h-32 bg-white opacity-10 rounded-full blur-2xl md:blur-3xl"></div>

//                 <div className="relative z-10 w-2/3 md:w-1/2">
//                   <h2 className="text-white text-2xl md:text-4xl font-extrabold leading-tight mb-4">
//                     Share Your<br />Thoughts Today
//                   </h2>
//                   <p className="text-white/80 hidden md:block text-sm mb-6 font-medium">
//                     Join thousands of writers sharing their unique stories, poems, and mysteries with the world.
//                   </p>
//                   <Link
//                     to="/write"
//                     className="inline-block bg-black text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-gray-800 transition-colors shadow-lg"
//                   >
//                     Write a Story
//                   </Link>
//                 </div>

//                 <div className="absolute bottom-0 right-2 md:right-10 w-28 h-28 md:w-48 md:h-48 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
//                   <i className="ri-edit-circle-line text-white/50 text-6xl md:text-8xl"></i>
//                 </div>
//               </div>
//             </section>
//           </div>

//           {/* Right Column (Top Writers Sidebar Widget) */}
//           <div className="md:col-span-12 lg:col-span-4">
//             <section className="mb-10 lg:pl-6 lg:border-l border-borderLight dark:border-borderDark h-full">
//               <div className="flex items-center justify-between mb-5">
//                 <h2 className="text-[18px] md:text-xl font-extrabold text-gray-900 dark:text-white">Top Writers</h2>
//                 <span className="text-xs md:text-sm font-bold text-brand hover:underline cursor-pointer">See All</span>
//               </div>

//               <div className="flex lg:flex-col gap-5 lg:gap-4 overflow-x-auto lg:overflow-visible no-scrollbar pb-2">
//                 {topWriters.map((writer) => (
//                   <Link
//                     key={writer._id}
//                     to={`/profile/${writer.username}`}
//                     className="flex-shrink-0 flex flex-col lg:flex-row items-center lg:items-center gap-3 group w-[68px] lg:w-full lg:bg-white lg:dark:bg-cardDark lg:p-3 lg:rounded-2xl lg:border border-borderLight lg:dark:border-borderDark lg:hover:border-brand lg:transition-colors"
//                   >
//                     <div className="w-[60px] h-[60px] lg:w-12 lg:h-12 rounded-full p-[2px] border-2 border-transparent group-hover:border-brand transition-colors">
//                       <img
//                         className="w-full h-full rounded-full object-cover bg-gray-200"
//                         src={writer.image?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'}
//                         alt={writer.username}
//                       />
//                     </div>
//                     <div className="text-center lg:text-left overflow-hidden">
//                       <h3 className="text-[11px] lg:text-sm font-bold mt-2 lg:mt-0 text-gray-700 dark:text-gray-200 truncate w-full">
//                         {writer.username}
//                       </h3>
//                       <p className="hidden lg:block text-xs text-gray-500 font-medium">Author</p>
//                     </div>
//                   </Link>
//                 ))}
//               </div>
//             </section>
//           </div>
//         </div>

//         {/* Stories Listing Grid Section */}
//         <section id="content-area" className="mb-10 w-full mt-4">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-[20px] md:text-2xl font-extrabold text-gray-900 dark:text-white">Top Stories</h2>
//             <select
//               value={sortBy}
//               onChange={(e) => setSortBy(e.target.value)}
//               className="bg-transparent text-sm md:text-base font-bold text-brand border-none outline-none focus:ring-0 cursor-pointer text-right"
//             >
//               <option value="newest">Recently Added</option>
//               <option value="oldest">Oldest First</option>
//             </select>
//           </div>

//           {/* Skeleton loading placeholders */}
//           {error ? (
//             <ErrorCard message={error} onRetry={fetchStories} />
//           ) : loading ? (
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
//               {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
//                 <div key={n} className="aspect-[4/5] bg-gray-200 dark:bg-cardDark rounded-[20px] md:rounded-[24px] animate-pulse"></div>
//               ))}
//             </div>
//           ) : stories.length === 0 ? (
//             <div className="text-center py-20 bg-white dark:bg-cardDark rounded-[24px] border border-borderLight dark:border-borderDark p-8">
//               <span className="text-3xl">📚</span>
//               <h3 className="text-lg font-bold mt-4">No stories found</h3>
//               <p className="text-gray-500 dark:text-gray-400 mt-2 font-serif italic max-w-sm mx-auto">
//                 No insights match this configuration. Start writing to fill the blank pages!
//               </p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 transition-opacity duration-300">
//               {stories.map((story) => (
//                 <article
//                   key={story._id}
//                   className="relative aspect-[4/5] rounded-[20px] md:rounded-[24px] overflow-hidden group shadow-sm bg-gray-100 dark:bg-cardDark"
//                 >
//                   <Link to={`/stories/${story._id}`} className="block w-full h-full">
//                     {story.image?.url && (
//                       <img
//                         src={story.image.url}
//                         alt={story.title}
//                         className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
//                       />
//                     )}
//                     <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>

//                     {/* Badge details */}
//                     <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
//                       <span className="px-2.5 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-[10px] md:text-xs font-bold text-white uppercase tracking-wider shadow-sm">
//                         {story.category.replace('-', ' ')}
//                       </span>
//                       <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-sm hover:bg-brand transition-colors">
//                         <i className="ri-bookmark-line text-[14px]"></i>
//                       </div>
//                     </div>

//                     {/* Bottom overlay details */}
//                     <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1.5">
//                       <h3 className="text-white text-sm md:text-base font-extrabold leading-tight line-clamp-2 drop-shadow-md group-hover:text-brandLight transition-colors">
//                         {story.title}
//                       </h3>

//                       <div className="flex items-center gap-1.5 text-gray-300 text-[11px] md:text-xs font-semibold">
//                         <img
//                           src={story.owner?.image?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40'}
//                           className="w-4 h-4 rounded-full object-cover"
//                           alt={story.owner?.username || 'deleted_user'}
//                         />
//                         <span className="truncate">{story.owner?.username || 'deleted_user'}</span>
//                       </div>

//                       <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-[10px] md:text-[11px] text-white/80 font-bold font-sans">
//                         <span className="flex items-center gap-1">
//                           <i className="ri-eye-2-line text-brand"></i> {story.views.length} Views
//                         </span>
//                         <span>{moment(story.timeStamp).fromNow()}</span>
//                       </div>
//                     </div>
//                   </Link>
//                 </article>
//               ))}
//             </div>
//           )}
//         </section>
//       </main>

//       {/* Floating Bottom Nav Dock (Mobile Navigation) */}
//       {user && (
//         <nav className="fixed bottom-6 left-0 right-0 z-[60] px-4 pointer-events-none md:hidden">
//           <div className="max-w-md mx-auto glass-dock rounded-[2.5rem] p-2 shadow-2xl flex items-center justify-between pointer-events-auto">
//             <Link to="/chat" className="w-12 h-12 flex items-center justify-center rounded-full relative text-gray-500 dark:text-gray-400">
//               <i className="ri-chat-smile-2-line text-xl md:text-2xl"></i>
//               {unreadMessages > 0 && (
//                 <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand rounded-full ring-4 ring-white dark:ring-slate-900 animate-pulse"></span>
//               )}
//             </Link>
//             <Link to={`/profile/${user.username}`} className="w-12 h-12 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400">
//               <i className="ri-team-line text-xl md:text-2xl"></i>
//             </Link>

//             <Link
//               to="/write"
//               className="w-14 h-14 md:w-16 md:h-16 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full flex items-center justify-center shadow-2xl transform -translate-y-6 hover:scale-110 active:scale-95 transition-all"
//             >
//               <i className="ri-add-line text-3xl md:text-4xl"></i>
//             </Link>

//             <Link to="/notifications" className="w-12 h-12 flex items-center justify-center rounded-full relative text-gray-500 dark:text-gray-400">
//               <i className="ri-notification-4-line text-xl md:text-2xl"></i>
//               {unreadNotifications > 0 && (
//                 <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-white dark:ring-slate-900 animate-pulse"></span>
//               )}
//             </Link>
//             <Link to="/settings" className="w-12 h-12 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400">
//               <i className="ri-user-line text-xl md:text-2xl"></i>
//             </Link>
//           </div>
//         </nav>
//       )}
//     </div>
//   );
// };



// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { useSocket } from '../contexts/SocketContext';
// import api from '../services/api';
// import toast from 'react-hot-toast';
// import moment from 'moment';
// import { ErrorCard } from '../components/ErrorCard';

// interface Story {
//   _id: string;
//   title: string;
//   story: string;
//   category: 'fantasy' | 'random-thoughts' | 'poetry' | 'letter' | 'mystery' | 'adventure' | 'historical' | 'fiction' | 'other';
//   image?: { url: string };
//   owner: {
//     _id: string; username: string; name: string;
//     image?: { url: string };
//   };
//   views: string[];
//   likedBy: string[];
//   timeStamp: string;
// }

// interface Writer {
//   _id: string; username: string; name: string;
//   image?: { url: string };
//   followers: string[];
//   storiesCount: number;
// }

// const CATEGORY_META: Record<string, { label: string; icon: string; gradient: string }> = {
//   'fantasy':        { label: 'Fantasy',    icon: 'ri-magic-line',           gradient: 'from-purple-500 to-indigo-500' },
//   'random-thoughts':{ label: 'Thoughts',   icon: 'ri-lightbulb-flash-line', gradient: 'from-yellow-400 to-orange-400' },
//   'poetry':         { label: 'Poetry',     icon: 'ri-quill-pen-line',       gradient: 'from-pink-500 to-rose-500' },
//   'letter':         { label: 'Letter',     icon: 'ri-mail-open-line',       gradient: 'from-sky-400 to-cyan-400' },
//   'mystery':        { label: 'Mystery',    icon: 'ri-spy-line',             gradient: 'from-gray-600 to-gray-800' },
//   'adventure':      { label: 'Adventure',  icon: 'ri-sword-line',           gradient: 'from-green-500 to-emerald-500' },
//   'historical':     { label: 'Historical', icon: 'ri-ancient-gate-line',    gradient: 'from-amber-500 to-yellow-600' },
//   'fiction':        { label: 'Fiction',    icon: 'ri-book-2-line',          gradient: 'from-blue-500 to-violet-500' },
//   'other':          { label: 'Other',      icon: 'ri-more-line',            gradient: 'from-gray-400 to-gray-500' },
// };

// const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80';

// export const Stories: React.FC = () => {
//   const { user, logout } = useAuth();
//   const { socket } = useSocket();
//   const navigate = useNavigate();

//   /* ── Global data (never affected by filter) ── */
//   const [globalStories, setGlobalStories] = useState<Story[]>([]);
//   const [globalLoading, setGlobalLoading] = useState(true);

//   /* ── Filtered stories (affected by search/category/sort) ── */
//   const [stories, setStories]     = useState<Story[]>([]);
//   const [topWriters, setTopWriters] = useState<Writer[]>([]);
//   const [loading, setLoading]     = useState(true);
//   const [error, setError]         = useState<string | null>(null);

//   const [search, setSearch]       = useState('');
//   const [category, setCategory]   = useState('');
//   const [sortBy, setSortBy]       = useState('newest');

//   const [profileOpen, setProfileOpen] = useState(false);
//   const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
//   const [unreadNotif, setUnreadNotif] = useState(0);
//   const [unreadMsg, setUnreadMsg]   = useState(0);

//   /* ── Featured story rotation index (for hero rotator) ── */
//   const [featuredIndex, setFeaturedIndex] = useState(0);
//   const isFirstLoad = useRef(true);

//   /* ────────── API CALLS ────────── */
//   const checkBadges = async () => {
//     if (!user) return;
//     try {
//       const [nr, cr] = await Promise.all([
//         api.get('/users/notifications/unread-count'),
//         api.get('/chat/conversations'),
//       ]);
//       if (nr.data.success) setUnreadNotif(nr.data.unreadCount || 0);
//       if (cr.data.success) {
//         const total = cr.data.conversations.reduce(
//           (a: number, c: any) => a + (c.unreadCount || 0), 0);
//         setUnreadMsg(total);
//       }
//     } catch {}
//   };

//   /* Load global stories ONCE — used by hero and sidebar (never changes with filters) */
//   const fetchGlobalStories = async () => {
//     try {
//       setGlobalLoading(true);
//       const res = await api.get('/stories', { params: { sort: 'popular' } });
//       if (res.data.success) {
//         setGlobalStories(res.data.stories);
//         if (res.data.topFiveWriters) setTopWriters(res.data.topFiveWriters);
//       }
//     } catch {} finally { setGlobalLoading(false); }
//   };

//   /* Load filtered stories — affected by search/category/sort */
//   const fetchStories = async () => {
//     try {
//       setLoading(true); setError(null);
//       const res = await api.get('/stories', {
//         params: { search, category: category || undefined, sort: sortBy },
//       });
//       if (res.data.success) {
//         setStories(res.data.stories);
//       }
//     } catch (e: any) {
//       setError(e.message || 'Failed to load stories.');
//       toast.error('Failed to load stories.');
//     } finally { setLoading(false); }
//   };

//   /* ────────── EFFECTS ────────── */
//   useEffect(() => { fetchGlobalStories(); }, []);
//   useEffect(() => { fetchStories(); }, [search, category, sortBy]);

//   useEffect(() => {
//     checkBadges();
//     const id = setInterval(checkBadges, 8000);
//     return () => clearInterval(id);
//   }, [user]);

//   useEffect(() => {
//     if (!socket || !user) return;
//     const onN = () => setUnreadNotif(p => p + 1);
//     const onM = () => setUnreadMsg(p => p + 1);
//     socket.on('newNotification', onN);
//     socket.on('newMessage', onM);
//     return () => { socket.off('newNotification', onN); socket.off('newMessage', onM); };
//   }, [socket, user]);

//   /* ────────── DERIVED DATA (LOGIC-CORRECT) ────────── */

//   /* Editor's Picks — top 5 stories with images from GLOBAL data (never filtered) */
//   const editorPicks = useMemo(
//     () => globalStories.filter(s => s.image?.url).slice(0, 5),
//     [globalStories]
//   );

//   /* Currently featured story in hero rotator */
//   const featuredStory = editorPicks[featuredIndex] || editorPicks[0];

//   /* Auto-rotate hero every 6s */
//   useEffect(() => {
//     if (editorPicks.length <= 1) return;
//     const id = setInterval(() => {
//       setFeaturedIndex(i => (i + 1) % editorPicks.length);
//     }, 6000);
//     return () => clearInterval(id);
//   }, [editorPicks.length]);

//   /* Reset featured index when picks refresh */
//   useEffect(() => { setFeaturedIndex(0); }, [editorPicks.length]);

//   /* Filtered results — reflects current search/category/sort */
//   const recentlyAdded = useMemo(
//     () => [...stories].sort((a, b) =>
//       new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime()
//     ).slice(0, 6),
//     [stories]
//   );

//   const mostPopular = useMemo(
//     () => [...stories].sort((a, b) => b.views.length - a.views.length).slice(0, 6),
//     [stories]
//   );

//   /* Whether user has any active filter */
//   const hasFilter = category !== '' || search !== '';

//   /* Human-readable status message */
//   const filterLabel = useMemo(() => {
//     if (search && category) return `"${search}" in ${CATEGORY_META[category]?.label}`;
//     if (search) return `Results for "${search}"`;
//     if (category) return `${CATEGORY_META[category]?.label} Stories`;
//     return null;
//   }, [search, category]);

//   const handleLogout = async () => { await logout(); navigate('/login'); };

//   /* ────────── RENDER ────────── */
//   return (
//     <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
//       <div className="w-full">
//         <div className="bg-white dark:bg-[#0F0F0F] min-h-screen">

//           {/* ═══════════════ HEADER ═══════════════ */}
//           <header className="border-b border-gray-100 dark:border-gray-900 px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-40 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-xl">
//             <div className="flex items-center gap-8">
//               <Link to="/stories" className="flex items-center gap-2">
//                 <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center -rotate-6">
//                   <i className="ri-quill-pen-line text-white dark:text-black text-lg"></i>
//                 </div>
//                 <span className="font-black text-lg tracking-tight hidden sm:block">Diary.</span>
//               </Link>

//               <nav className="hidden md:flex items-center gap-6 text-[13px] font-bold text-gray-500 tracking-wider uppercase">
//                 <Link to="/stories" className="text-black dark:text-white">Discover</Link>
//                 <Link to="/writers" className="hover:text-black dark:hover:text-white transition-colors">Writers</Link>
//                 <Link to="/write" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
//                   Write
//                   <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center">+</span>
//                 </Link>
//               </nav>
//             </div>

//             <div className="flex items-center gap-2">
//               {!user ? (
//                 <Link to="/login" className="font-bold text-sm px-5 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black">
//                   Log in
//                 </Link>
//               ) : (
//                 <>
//                   <Link to="/chat"
//                     className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
//                     title="Messages">
//                     <i className="ri-chat-1-line text-xl"></i>
//                     {unreadMsg > 0 && (
//                       <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-blue-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-[#0F0F0F]">
//                         {unreadMsg > 99 ? '99+' : unreadMsg}
//                       </span>
//                     )}
//                   </Link>

//                   <Link to="/notifications"
//                     className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
//                     title="Notifications">
//                     <i className="ri-notification-3-line text-xl"></i>
//                     {unreadNotif > 0 && (
//                       <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-[#0F0F0F]">
//                         {unreadNotif > 99 ? '99+' : unreadNotif}
//                       </span>
//                     )}
//                   </Link>

//                   <div className="relative ml-1">
//                     <button onClick={() => setProfileOpen(o => !o)}
//                       className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
//                       <img src={user.image?.url || DEFAULT_AVATAR}
//                         className="w-8 h-8 rounded-full object-cover" alt={user.username} />
//                       <div className="hidden sm:block text-left">
//                         <p className="text-xs font-black leading-tight">{user.name || user.username}</p>
//                         <p className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
//                           <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Active
//                         </p>
//                       </div>
//                     </button>

//                     {profileOpen && (
//                       <>
//                         <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
//                         <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-1.5 z-20">
//                           <Link to={`/profile/${user.username}`} onClick={() => setProfileOpen(false)}
//                             className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900">
//                             <i className="ri-user-line text-gray-400"></i> Profile
//                           </Link>
//                           <Link to="/settings" onClick={() => setProfileOpen(false)}
//                             className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900">
//                             <i className="ri-settings-line text-gray-400"></i> Settings
//                           </Link>
//                           <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
//                             <button onClick={() => { setProfileOpen(false); handleLogout(); }}
//                               className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
//                               <i className="ri-logout-box-line"></i> Log out
//                             </button>
//                           </div>
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>
//           </header>

//           {/* ═══════════════ BODY ═══════════════ */}
//           <div className="flex pb-20 lg:pb-0">

//             {/* ─── MAIN ─── */}
//             <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8">

//               {/* ═══════════════ HERO — EDITOR'S PICKS (GLOBAL, NOT FILTERED) ═══════════════ */}
//               {/* Only shows when NO filter active — clear separation of "browse" vs "search" modes */}
//               {!hasFilter && (
//                 <section className="mb-8">
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex items-center gap-2">
//                       <span className="text-xl">✨</span>
//                       <h2 className="text-[13px] font-black text-gray-400 tracking-widest uppercase">Editor's Picks</h2>
//                     </div>
//                     <span className="text-xs font-bold text-gray-400 hidden sm:block">
//                       Handpicked stories from our community
//                     </span>
//                   </div>

//                   {globalLoading ? (
//                     <div className="h-[240px] md:h-[300px] bg-gray-100 dark:bg-gray-900 rounded-3xl animate-pulse"></div>
//                   ) : !featuredStory ? (
//                     <div className="h-[240px] bg-gray-50 dark:bg-gray-900 rounded-3xl flex flex-col items-center justify-center">
//                       <span className="text-4xl mb-2">📖</span>
//                       <p className="font-black">No featured stories yet</p>
//                       <p className="text-xs text-gray-500 mt-1">Be the first to write one!</p>
//                     </div>
//                   ) : (
//                     <Link to={`/stories/${featuredStory._id}`}
//                       className="block relative bg-gray-900 rounded-2xl md:rounded-3xl overflow-hidden group">
//                       <div className="absolute inset-0">
//                         {featuredStory.image?.url && (
//                           <img src={featuredStory.image.url} alt={featuredStory.title}
//                             key={featuredStory._id}
//                             className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-all duration-700" />
//                         )}
//                         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20"></div>
//                       </div>

//                       <div className="relative p-6 md:p-10 flex items-center min-h-[240px] md:min-h-[300px]">
//                         <div className="flex-1 max-w-lg">
//                           <div className="flex items-center gap-2 mb-3">
//                             <span className="inline-block px-2.5 py-1 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest">
//                               Featured
//                             </span>
//                             <span className="inline-block px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest">
//                               <i className={`${CATEGORY_META[featuredStory.category]?.icon} mr-1`}></i>
//                               {CATEGORY_META[featuredStory.category]?.label || featuredStory.category}
//                             </span>
//                           </div>

//                           <h1 className="text-white text-2xl md:text-4xl font-black leading-tight mb-3 line-clamp-2">
//                             {featuredStory.title}
//                           </h1>

//                           <div className="flex items-center gap-2 mb-4">
//                             <img src={featuredStory.owner?.image?.url || DEFAULT_AVATAR}
//                               className="w-6 h-6 rounded-full object-cover border border-white/20"
//                               alt={featuredStory.owner?.username} />
//                             <p className="text-gray-300 text-sm">
//                               by <span className="font-bold text-white">@{featuredStory.owner?.username || 'author'}</span>
//                             </p>
//                             <span className="text-gray-500">·</span>
//                             <span className="text-xs text-gray-400 font-semibold">
//                               {moment(featuredStory.timeStamp).fromNow()}
//                             </span>
//                           </div>

//                           <div className="flex items-center gap-4 mb-5 text-xs text-gray-300 font-semibold">
//                             <span className="flex items-center gap-1.5">
//                               <i className="ri-eye-line text-blue-400"></i>
//                               {featuredStory.views.length} {featuredStory.views.length === 1 ? 'view' : 'views'}
//                             </span>
//                             <span className="flex items-center gap-1.5">
//                               <i className="ri-heart-line text-red-400"></i>
//                               {featuredStory.likedBy.length} {featuredStory.likedBy.length === 1 ? 'like' : 'likes'}
//                             </span>
//                           </div>

//                           <div className="flex items-center gap-2">
//                             <span className="bg-white text-black text-sm font-black px-5 py-2.5 rounded-full transition-transform group-hover:scale-105">
//                               <i className="ri-book-open-line mr-1"></i> Read Story
//                             </span>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Rotator dots */}
//                       {editorPicks.length > 1 && (
//                         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
//                           {editorPicks.map((_, i) => (
//                             <button key={i}
//                               onClick={(e) => { e.preventDefault(); setFeaturedIndex(i); }}
//                               className={`h-1 rounded-full transition-all ${
//                                 i === featuredIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/60'
//                               }`}></button>
//                           ))}
//                         </div>
//                       )}
//                     </Link>
//                   )}
//                 </section>
//               )}

//               {/* ═══════════════ CATEGORY PILLS ═══════════════ */}
//               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
//                 <button onClick={() => setCategory('')}
//                   className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
//                     category === ''
//                       ? 'bg-black text-white dark:bg-white dark:text-black'
//                       : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
//                   }`}>
//                   <i className="ri-compass-3-line"></i> All Stories
//                 </button>
//                 {Object.entries(CATEGORY_META).map(([val, m]) => (
//                   <button key={val} onClick={() => setCategory(val)}
//                     className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
//                       category === val
//                         ? 'bg-black text-white dark:bg-white dark:text-black'
//                         : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
//                     }`}>
//                     <i className={m.icon}></i> {m.label}
//                   </button>
//                 ))}
//               </div>

//               {/* Filter status bar — SHOWS WHAT USER IS VIEWING */}
//               {hasFilter && (
//                 <div className="flex items-center justify-between mb-6 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-2xl">
//                   <div className="flex items-center gap-2 min-w-0">
//                     <i className="ri-filter-3-line text-blue-500 shrink-0"></i>
//                     <p className="text-sm font-bold text-blue-900 dark:text-blue-200 truncate">
//                       Showing: <span className="font-black">{filterLabel}</span>
//                     </p>
//                   </div>
//                   <button onClick={() => { setCategory(''); setSearch(''); }}
//                     className="shrink-0 ml-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
//                     <i className="ri-close-line"></i> Clear
//                   </button>
//                 </div>
//               )}

//               {/* ═══════════════ ERROR STATE ═══════════════ */}
//               {error && <ErrorCard message={error} onRetry={fetchStories} />}

//               {/* ═══════════════ LOADING STATE ═══════════════ */}
//               {!error && loading && (
//                 <>
//                   <div className="mb-8">
//                     <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-4 animate-pulse"></div>
//                     <div className="flex gap-3 overflow-x-auto no-scrollbar">
//                       {[1,2,3,4,5].map(i => (
//                         <div key={i} className="shrink-0 w-32 md:w-40 animate-pulse">
//                           <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-2xl mb-2"></div>
//                           <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-1"></div>
//                           <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </>
//               )}

//               {/* ═══════════════ EMPTY STATE ═══════════════ */}
//               {!error && !loading && stories.length === 0 && (
//                 <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
//                   <span className="text-5xl block mb-3">
//                     {search ? '🔍' : category ? '📂' : '📚'}
//                   </span>
//                   <h3 className="text-lg font-black mb-1">
//                     {search ? `No results for "${search}"` :
//                      category ? `No ${CATEGORY_META[category]?.label} stories yet` :
//                      'No stories yet'}
//                   </h3>
//                   <p className="text-sm text-gray-500 mb-4">
//                     {search ? 'Try different keywords or clear the search' :
//                      category ? 'Be the first to write in this category!' :
//                      'Start your writing journey today'}
//                   </p>
//                   {hasFilter ? (
//                     <button onClick={() => { setSearch(''); setCategory(''); }}
//                       className="inline-flex items-center gap-1 text-sm font-black text-blue-500 hover:underline">
//                       <i className="ri-arrow-left-line"></i> View all stories
//                     </button>
//                   ) : (
//                     <Link to="/write"
//                       className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black text-sm font-bold px-5 py-2.5 rounded-full">
//                       <i className="ri-edit-line"></i> Write Story
//                     </Link>
//                   )}
//                 </div>
//               )}

//               {/* ═══════════════ RECENTLY ADDED (from FILTERED results) ═══════════════ */}
//               {!error && !loading && stories.length > 0 && (
//                 <section className="mb-8">
//                   <div className="flex items-center justify-between mb-4">
//                     <div>
//                       <h3 className="text-[13px] font-black text-gray-400 tracking-widest uppercase">
//                         {hasFilter ? 'Latest in this filter' : 'Recently Added'}
//                       </h3>
//                       <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
//                         {hasFilter
//                           ? `Newest ${category ? CATEGORY_META[category]?.label : 'matching'} stories`
//                           : 'Fresh stories from the past few days'}
//                       </p>
//                     </div>
//                     <select value={sortBy} onChange={e => setSortBy(e.target.value)}
//                       className="text-xs font-bold bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5 outline-none cursor-pointer text-gray-600 dark:text-gray-400">
//                       <option value="newest">Newest first</option>
//                       <option value="oldest">Oldest first</option>
//                       <option value="popular">Most popular</option>
//                     </select>
//                   </div>

//                   <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar -mx-4 md:mx-0 px-4 md:px-0">
//                     {recentlyAdded.map(story => (
//                       <Link key={story._id} to={`/stories/${story._id}`}
//                         className="shrink-0 w-36 md:w-44 group">
//                         <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-2.5">
//                           {story.image?.url ? (
//                             <img src={story.image.url} alt={story.title}
//                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
//                           ) : (
//                             <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${CATEGORY_META[story.category]?.gradient}`}>
//                               <i className={`${CATEGORY_META[story.category]?.icon} text-white text-3xl`}></i>
//                             </div>
//                           )}
//                           <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

//                           {/* Category tag — always visible */}
//                           <span className="absolute top-2 left-2 bg-white/90 dark:bg-black/80 backdrop-blur text-black dark:text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
//                             {CATEGORY_META[story.category]?.label}
//                           </span>

//                           {/* Time badge — bottom */}
//                           <span className="absolute bottom-2 left-2 text-[10px] text-white font-bold flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-0.5 rounded-full">
//                             <i className="ri-time-line"></i> {moment(story.timeStamp).fromNow(true)}
//                           </span>
//                         </div>
//                         <h4 className="text-sm font-black text-black dark:text-white line-clamp-2 leading-tight mb-1">
//                           {story.title}
//                         </h4>
//                         <p className="text-xs text-gray-500 font-medium truncate">
//                           @{story.owner?.username || 'author'}
//                         </p>
//                       </Link>
//                     ))}
//                   </div>
//                 </section>
//               )}

//               {/* ═══════════════ MOST POPULAR (from FILTERED results) ═══════════════ */}
//               {!error && !loading && stories.length > 1 && (
//                 <section className="mb-8">
//                   <div className="flex items-center justify-between mb-4">
//                     <div>
//                       <h3 className="text-[13px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-1.5">
//                         🔥 Most Popular
//                       </h3>
//                       <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
//                         {hasFilter
//                           ? `Trending ${category ? CATEGORY_META[category]?.label : 'matching'} stories by views`
//                           : 'Stories readers loved the most'}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     {mostPopular.map((story, idx) => (
//                       <Link key={story._id} to={`/stories/${story._id}`}
//                         className="flex items-center gap-3 p-2.5 pr-4 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">

//                         {/* Rank number */}
//                         <span className="shrink-0 w-6 text-center text-2xl font-black text-gray-300 dark:text-gray-700">
//                           {idx + 1}
//                         </span>

//                         <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
//                           {story.image?.url ? (
//                             <img src={story.image.url} alt={story.title}
//                               className="w-full h-full object-cover" />
//                           ) : (
//                             <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${CATEGORY_META[story.category]?.gradient}`}>
//                               <i className={`${CATEGORY_META[story.category]?.icon} text-white text-xl`}></i>
//                             </div>
//                           )}
//                         </div>

//                         <div className="flex-1 min-w-0">
//                           <h4 className="text-sm font-black text-black dark:text-white truncate mb-0.5">
//                             {story.title}
//                           </h4>
//                           <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
//                             <span className="truncate">@{story.owner?.username || 'author'}</span>
//                             <span className="text-gray-300 dark:text-gray-700">·</span>
//                             <span className="flex items-center gap-0.5 shrink-0">
//                               <i className="ri-eye-line"></i> {story.views.length}
//                             </span>
//                           </div>
//                         </div>

//                         <div className="w-9 h-9 rounded-full bg-white dark:bg-black text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm">
//                           <i className="ri-arrow-right-line text-sm"></i>
//                         </div>
//                       </Link>
//                     ))}
//                   </div>
//                 </section>
//               )}

//               {/* ═══════════════ ALL STORIES GRID (main filtered list) ═══════════════ */}
//               {!error && !loading && stories.length > 0 && (
//                 <section>
//                   <div className="flex items-center justify-between mb-4">
//                     <div>
//                       <h3 className="text-[13px] font-black text-gray-400 tracking-widest uppercase">
//                         {hasFilter ? 'All matching stories' : 'Browse All Stories'}
//                       </h3>
//                       <p className="text-xs text-gray-500 mt-0.5">
//                         {stories.length} {stories.length === 1 ? 'story' : 'stories'} available
//                       </p>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
//                     {stories.map(story => (
//                       <Link key={story._id} to={`/stories/${story._id}`} className="group">
//                         <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-2.5">
//                           {story.image?.url ? (
//                             <img src={story.image.url} alt={story.title}
//                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
//                           ) : (
//                             <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${CATEGORY_META[story.category]?.gradient}`}>
//                               <i className={`${CATEGORY_META[story.category]?.icon} text-white text-4xl`}></i>
//                             </div>
//                           )}
//                           <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

//                           <span className="absolute top-2 left-2 bg-white/90 dark:bg-black/80 backdrop-blur text-black dark:text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
//                             {CATEGORY_META[story.category]?.label}
//                           </span>

//                           <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px] font-bold">
//                             <span className="flex items-center gap-1">
//                               <i className="ri-eye-line"></i> {story.views.length}
//                             </span>
//                             <span className="flex items-center gap-1">
//                               <i className="ri-heart-line"></i> {story.likedBy.length}
//                             </span>
//                           </div>
//                         </div>

//                         <h4 className="text-sm font-black text-black dark:text-white line-clamp-2 leading-tight mb-1.5">
//                           {story.title}
//                         </h4>
//                         <div className="flex items-center gap-1.5">
//                           <img src={story.owner?.image?.url || DEFAULT_AVATAR}
//                             className="w-4 h-4 rounded-full object-cover shrink-0"
//                             alt={story.owner?.username} />
//                           <span className="text-[11px] font-semibold text-gray-500 truncate">
//                             {story.owner?.username || 'deleted_user'}
//                           </span>
//                           <span className="text-gray-300 dark:text-gray-700 text-[10px] shrink-0">·</span>
//                           <span className="text-[10px] text-gray-400 shrink-0">
//                             {moment(story.timeStamp).fromNow(true)}
//                           </span>
//                         </div>
//                       </Link>
//                     ))}
//                   </div>
//                 </section>
//               )}
//             </main>

//             {/* ─── RIGHT SIDEBAR ─── */}
//             <aside className="hidden xl:block w-80 shrink-0 border-l border-gray-100 dark:border-gray-900 py-8 px-6">

//               {/* Search — desktop only */}
//               <div className="mb-8">
//                 <h3 className="text-[13px] font-black text-gray-400 tracking-widest uppercase mb-3">Quick Search</h3>
//                 <div className="relative">
//                   <input type="text" placeholder="Search stories..."
//                     value={search} onChange={e => setSearch(e.target.value)}
//                     className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-900 rounded-full outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all" />
//                   <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors">
//                     <i className="ri-search-line text-sm"></i>
//                   </button>
//                 </div>
//               </div>

//               {/* Top Writers — GLOBAL (never filtered) */}
//               <div className="mb-8">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-[13px] font-black text-gray-400 tracking-widest uppercase">Top Writers</h3>
//                   <Link to="/writers" className="text-xs font-bold text-blue-500 hover:underline">See all</Link>
//                 </div>
//                 <div className="space-y-3">
//                   {globalLoading ? (
//                     [1,2,3].map(i => (
//                       <div key={i} className="flex items-center gap-3 animate-pulse">
//                         <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800"></div>
//                         <div className="flex-1">
//                           <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-1.5"></div>
//                           <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
//                         </div>
//                       </div>
//                     ))
//                   ) : topWriters.length === 0 ? (
//                     <p className="text-xs text-gray-500 py-2">No writers yet</p>
//                   ) : (
//                     topWriters.slice(0, 5).map((w, idx) => (
//                       <div key={w._id} className="flex items-center gap-3">
//                         <Link to={`/profile/${w.username}`} className="relative shrink-0">
//                           <img src={w.image?.url || DEFAULT_AVATAR}
//                             className="w-11 h-11 rounded-full object-cover" alt={w.username} />
//                           <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black border border-white dark:border-[#0F0F0F]
//                             ${idx === 0 ? 'bg-yellow-400 text-yellow-900'
//                               : idx === 1 ? 'bg-gray-300 text-gray-700'
//                               : idx === 2 ? 'bg-amber-600 text-white'
//                               : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
//                             {idx + 1}
//                           </span>
//                         </Link>
//                         <Link to={`/profile/${w.username}`} className="flex-1 min-w-0">
//                           <p className="text-sm font-black text-black dark:text-white truncate">
//                             {w.name || w.username}
//                           </p>
//                           <p className="text-xs text-gray-500 font-medium">
//                             {w.followers?.length || 0} followers · {w.storiesCount || 0} stories
//                           </p>
//                         </Link>
//                         <button className="px-3 py-1.5 rounded-full text-[11px] font-black text-blue-500 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors shrink-0">
//                           Follow
//                         </button>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>

//               {/* Featured mini-card — GLOBAL editor's pick (never affected by filter) */}
//               {featuredStory && !globalLoading && (
//                 <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-5 text-white overflow-hidden relative">
//                   <div className="flex items-center justify-between mb-4">
//                     <span className="text-xs font-bold uppercase tracking-widest opacity-70">Editor's Pick</span>
//                     <i className="ri-star-fill opacity-70"></i>
//                   </div>

//                   <div className="flex justify-center mb-4">
//                     <div className="relative w-32 h-32">
//                       {featuredStory.image?.url ? (
//                         <img src={featuredStory.image.url}
//                           className="w-full h-full rounded-full object-cover border-4 border-white/20"
//                           alt={featuredStory.title} />
//                       ) : (
//                         <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
//                           <i className={`${CATEGORY_META[featuredStory.category]?.icon} text-4xl`}></i>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <h4 className="text-center font-black text-base mb-1 line-clamp-2">{featuredStory.title}</h4>
//                   <p className="text-center text-xs text-white/70 font-semibold mb-4 truncate">
//                     by @{featuredStory.owner?.username || 'author'}
//                   </p>

//                   <div className="flex items-center justify-between text-[11px] font-bold mb-3">
//                     <span className="flex items-center gap-1">
//                       <i className="ri-eye-line"></i> {featuredStory.views.length}
//                     </span>
//                     <span className="flex items-center gap-1">
//                       <i className="ri-heart-line"></i> {featuredStory.likedBy.length}
//                     </span>
//                     <span>{moment(featuredStory.timeStamp).fromNow(true)}</span>
//                   </div>

//                   <Link to={`/stories/${featuredStory._id}`}
//                     className="flex items-center justify-center gap-2 bg-white text-blue-600 font-black text-sm py-2.5 rounded-full hover:scale-105 transition-transform">
//                     <i className="ri-book-open-line"></i> Read Now
//                   </Link>
//                 </div>
//               )}
//             </aside>
//           </div>
//         </div>
//       </div>

//       {/* ═══════════════ MOBILE BOTTOM NAV ═══════════════ */}
//       {user && (
//         <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-900">
//           <div className="flex items-center justify-around px-2 h-16 max-w-md mx-auto">
//             <Link to="/stories" className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 text-black dark:text-white">
//               <i className="ri-compass-3-fill text-xl"></i>
//               <span className="text-[9px] font-black">Discover</span>
//             </Link>
//             <button onClick={() => setMobileSearchOpen(true)}
//               className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 text-gray-500">
//               <i className="ri-search-line text-xl"></i>
//               <span className="text-[9px] font-bold">Search</span>
//             </button>
//             <Link to="/write"
//               className="flex items-center justify-center w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-2xl -translate-y-4 hover:scale-105 active:scale-95 transition-transform">
//               <i className="ri-edit-line text-2xl"></i>
//             </Link>
//             <Link to="/notifications" className="relative flex flex-col items-center justify-center gap-0.5 w-12 h-12 text-gray-500">
//               <i className="ri-notification-3-line text-xl"></i>
//               <span className="text-[9px] font-bold">Alerts</span>
//               {unreadNotif > 0 && (
//                 <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-black">
//                   {unreadNotif > 99 ? '99+' : unreadNotif}
//                 </span>
//               )}
//             </Link>
//             <Link to={`/profile/${user.username}`} className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 text-gray-500">
//               <img src={user.image?.url || DEFAULT_AVATAR}
//                 className="w-7 h-7 rounded-xl object-cover" alt={user.username} />
//               <span className="text-[9px] font-bold">Profile</span>
//             </Link>
//           </div>
//         </nav>
//       )}

//       {/* Mobile Search Modal */}
//       {mobileSearchOpen && (
//         <div className="lg:hidden fixed inset-0 z-[70] bg-white dark:bg-black p-4">
//           <div className="flex items-center gap-2 mb-4">
//             <button onClick={() => setMobileSearchOpen(false)}
//               className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
//               <i className="ri-arrow-left-line text-xl"></i>
//             </button>
//             <div className="relative flex-1">
//               <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
//               <input type="text" placeholder="Search stories..." autoFocus
//                 value={search} onChange={e => setSearch(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 rounded-full outline-none text-sm font-medium" />
//             </div>
//           </div>
//           <p className="text-xs font-black text-gray-400 tracking-widest uppercase mb-3">
//             {search ? `${stories.length} Results` : 'Suggestions'}
//           </p>
//           <div className="space-y-2">
//             {stories.slice(0, 8).map(story => (
//               <Link key={story._id} to={`/stories/${story._id}`} onClick={() => setMobileSearchOpen(false)}
//                 className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-xl">
//                 <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0">
//                   {story.image?.url ? <img src={story.image.url} className="w-full h-full object-cover" alt="" /> :
//                     <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${CATEGORY_META[story.category]?.gradient}`}>
//                       <i className={`${CATEGORY_META[story.category]?.icon} text-white`}></i>
//                     </div>}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-black truncate">{story.title}</p>
//                   <p className="text-xs text-gray-500 truncate">@{story.owner?.username} · {CATEGORY_META[story.category]?.label}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };



import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';
import { ErrorCard } from '../components/ErrorCard';

interface Story {
  _id: string;
  title: string;
  story: string;
  category: 'fantasy' | 'random-thoughts' | 'poetry' | 'letter' | 'mystery' | 'adventure' | 'historical' | 'fiction' | 'other';
  image?: { url: string };
  owner: {
    _id: string; username: string; name: string;
    image?: { url: string };
  };
  views: string[];
  likedBy: string[];
  timeStamp: string;
}

interface Writer {
  _id: string; username: string; name: string;
  image?: { url: string };
  followers: string[];
  storiesCount: number;
}

const CATEGORY_META: Record<string, { label: string; icon: string; gradient: string }> = {
  'fantasy':        { label: 'Fantasy',    icon: 'ri-magic-line',           gradient: 'from-purple-500 to-indigo-500' },
  'random-thoughts':{ label: 'Thoughts',   icon: 'ri-lightbulb-flash-line', gradient: 'from-yellow-400 to-orange-400' },
  'poetry':         { label: 'Poetry',     icon: 'ri-quill-pen-line',       gradient: 'from-pink-500 to-rose-500' },
  'letter':         { label: 'Letter',     icon: 'ri-mail-open-line',       gradient: 'from-sky-400 to-cyan-400' },
  'mystery':        { label: 'Mystery',    icon: 'ri-spy-line',             gradient: 'from-gray-600 to-gray-800' },
  'adventure':      { label: 'Adventure',  icon: 'ri-sword-line',           gradient: 'from-green-500 to-emerald-500' },
  'historical':     { label: 'Historical', icon: 'ri-ancient-gate-line',    gradient: 'from-amber-500 to-yellow-600' },
  'fiction':        { label: 'Fiction',    icon: 'ri-book-2-line',          gradient: 'from-blue-500 to-violet-500' },
  'other':          { label: 'Other',      icon: 'ri-more-line',            gradient: 'from-gray-400 to-gray-500' },
};

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80';

export const Stories: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  /* ── Global data (never affected by filter) ── */
  const [globalStories, setGlobalStories] = useState<Story[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  /* ── Filtered stories (affected by search/category/sort) ── */
  const [stories, setStories]     = useState<Story[]>([]);
  const [topWriters, setTopWriters] = useState<Writer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [sortBy, setSortBy]       = useState('newest');

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg]   = useState(0);

  /* ── Featured story rotation index (for hero rotator) ── */
  const [featuredIndex, setFeaturedIndex] = useState(0);

  /* ────────── API CALLS ────────── */
  const checkBadges = async () => {
    if (!user) return;
    try {
      const [nr, cr] = await Promise.all([
        api.get('/users/notifications/unread-count'),
        api.get('/chat/conversations'),
      ]);
      if (nr.data.success) setUnreadNotif(nr.data.unreadCount || 0);
      if (cr.data.success) {
        const total = cr.data.conversations.reduce(
          (a: number, c: any) => a + (c.unreadCount || 0), 0);
        setUnreadMsg(total);
      }
    } catch {}
  };

  const fetchGlobalStories = async () => {
    try {
      setGlobalLoading(true);
      const res = await api.get('/stories', { params: { sort: 'popular' } });
      if (res.data.success) {
        setGlobalStories(res.data.stories);
        if (res.data.topFiveWriters) setTopWriters(res.data.topFiveWriters);
      }
    } catch {} finally { setGlobalLoading(false); }
  };

  const fetchStories = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/stories', {
        params: { search, category: category || undefined, sort: sortBy },
      });
      if (res.data.success) {
        setStories(res.data.stories);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load stories.');
      toast.error('Failed to load stories.');
    } finally { setLoading(false); }
  };

  /* ────────── EFFECTS ────────── */
  useEffect(() => { fetchGlobalStories(); }, []);
  useEffect(() => { fetchStories(); }, [search, category, sortBy]);

  useEffect(() => {
    checkBadges();
    const id = setInterval(checkBadges, 8000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;
    const onN = () => setUnreadNotif(p => p + 1);
    const onM = () => setUnreadMsg(p => p + 1);
    socket.on('newNotification', onN);
    socket.on('newMessage', onM);
    return () => { socket.off('newNotification', onN); socket.off('newMessage', onM); };
  }, [socket, user]);

  /* ────────── DERIVED DATA ────────── */

  /* Hero Rotator: Top Liked Stories (Sorted globally by likes) */
  const topLikedStories = useMemo(() => {
    return [...globalStories]
      .sort((a, b) => b.likedBy.length - a.likedBy.length)
      .slice(0, 5); // Takes top 5 regardless of image, but prefers highest likes
  }, [globalStories]);

  const featuredStory = topLikedStories[featuredIndex] || topLikedStories[0];

  /* Auto-rotate hero every 6s */
  useEffect(() => {
    if (topLikedStories.length <= 1) return;
    const id = setInterval(() => {
      setFeaturedIndex(i => (i + 1) % topLikedStories.length);
    }, 6000);
    return () => clearInterval(id);
  }, [topLikedStories.length]);

  /* Reset featured index when list changes */
  useEffect(() => { setFeaturedIndex(0); }, [topLikedStories.length]);

  /* Filtered results — Recently added row */
  const recentlyAdded = useMemo(() => {
    return [...stories]
      .sort((a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime())
      .slice(0, 6);
  }, [stories]);

  /* Whether user has any active filter */
  const hasFilter = category !== '' || search !== '';

  const filterLabel = useMemo(() => {
    if (search && category) return `"${search}" in ${CATEGORY_META[category]?.label}`;
    if (search) return `Results for "${search}"`;
    if (category) return `${CATEGORY_META[category]?.label} Stories`;
    return null;
  }, [search, category]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  /* ────────── RENDER ────────── */
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
      <div className="w-full">
        <div className="bg-white dark:bg-[#0F0F0F] min-h-screen">

          {/* ═══════════════ HEADER ═══════════════ */}
          <header className="border-b border-gray-100 dark:border-gray-900 px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-40 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-xl">
            <div className="flex items-center gap-8">
              <Link to="/stories" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center -rotate-6">
                  <i className="ri-quill-pen-line text-white dark:text-black text-lg"></i>
                </div>
                <span className="font-black text-lg tracking-tight hidden sm:block">Diary.</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-[13px] font-bold text-gray-500 tracking-wider uppercase">
                <Link to="/stories" className="text-black dark:text-white">Discover</Link>
                <Link to="/writers" className="hover:text-black dark:hover:text-white transition-colors">Writers</Link>
                <Link to="/write" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                  Write
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center">+</span>
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {!user ? (
                <Link to="/login" className="font-bold text-sm px-5 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black">
                  Log in
                </Link>
              ) : (
                <>
                  <Link to="/chat"
                    className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                    title="Messages">
                    <i className="ri-chat-1-line text-xl"></i>
                    {unreadMsg > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-blue-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-[#0F0F0F]">
                        {unreadMsg > 99 ? '99+' : unreadMsg}
                      </span>
                    )}
                  </Link>

                  <Link to="/notifications"
                    className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                    title="Notifications">
                    <i className="ri-notification-3-line text-xl"></i>
                    {unreadNotif > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-[#0F0F0F]">
                        {unreadNotif > 99 ? '99+' : unreadNotif}
                      </span>
                    )}
                  </Link>

                  <div className="relative ml-1">
                    <button onClick={() => setProfileOpen(o => !o)}
                      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                      <img src={user.image?.url || DEFAULT_AVATAR}
                        className="w-8 h-8 rounded-full object-cover" alt={user.username} />
                      <div className="hidden sm:block text-left">
                        <p className="text-xs font-black leading-tight">{user.name || user.username}</p>
                        <p className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Active
                        </p>
                      </div>
                    </button>

                    {profileOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-1.5 z-20">
                          <Link to={`/profile/${user.username}`} onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900">
                            <i className="ri-user-line text-gray-400"></i> Profile
                          </Link>
                          <Link to="/settings" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900">
                            <i className="ri-settings-line text-gray-400"></i> Settings
                          </Link>
                          <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                            <button onClick={() => { setProfileOpen(false); handleLogout(); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <i className="ri-logout-box-line"></i> Log out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </header>

          {/* ═══════════════ BODY ═══════════════ */}
          <div className="flex pb-20 lg:pb-0">

            {/* ─── MAIN ─── */}
            <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8">

              {/* ═══════════════ CATEGORY PILLS ═══════════════ */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
                <button onClick={() => setCategory('')}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    category === ''
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}>
                  <i className="ri-compass-3-line"></i> All Stories
                </button>
                {Object.entries(CATEGORY_META).map(([val, m]) => (
                  <button key={val} onClick={() => setCategory(val)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      category === val
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}>
                    <i className={m.icon}></i> {m.label}
                  </button>
                ))}
              </div>

              {/* Filter status bar */}
              {hasFilter && (
                <div className="flex items-center justify-between mb-6 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-2xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <i className="ri-filter-3-line text-blue-500 shrink-0"></i>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-200 truncate">
                      Showing: <span className="font-black">{filterLabel}</span>
                    </p>
                  </div>
                  <button onClick={() => { setCategory(''); setSearch(''); }}
                    className="shrink-0 ml-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    <i className="ri-close-line"></i> Clear
                  </button>
                </div>
              )}

              {/* ═══════════════ HERO — TOP LIKED STORIES (HIDDEN ON SEARCH) ═══════════════ */}
              {!hasFilter && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <h2 className="text-[13px] font-black text-gray-400 tracking-widest uppercase">Top Liked Stories</h2>
                    </div>
                  </div>

                  {globalLoading ? (
                    <div className="h-[240px] md:h-[320px] bg-gray-100 dark:bg-gray-900 rounded-3xl animate-pulse"></div>
                  ) : !featuredStory ? (
                    <div className="h-[240px] bg-gray-50 dark:bg-gray-900 rounded-3xl flex flex-col items-center justify-center">
                      <span className="text-4xl mb-2">📖</span>
                      <p className="font-black">No stories yet</p>
                    </div>
                  ) : (
                    <Link to={`/stories/${featuredStory._id}`}
                      className="block relative bg-gray-900 rounded-2xl md:rounded-3xl overflow-hidden group shadow-lg">
                      <div className="absolute inset-0">
                        {featuredStory.image?.url ? (
                          <img src={featuredStory.image.url} alt={featuredStory.title}
                            key={featuredStory._id}
                            className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-all duration-700" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_META[featuredStory.category]?.gradient} opacity-60`}></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/10"></div>
                      </div>

                      <div className="relative p-6 md:p-10 flex items-center min-h-[240px] md:min-h-[320px]">
                        <div className="flex-1 max-w-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest">
                              <i className="ri-fire-fill"></i> Trending
                            </span>
                            <span className="inline-block px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest">
                              <i className={`${CATEGORY_META[featuredStory.category]?.icon} mr-1`}></i>
                              {CATEGORY_META[featuredStory.category]?.label || featuredStory.category}
                            </span>
                          </div>

                          <h1 className="text-white text-2xl md:text-4xl font-black leading-tight mb-3 line-clamp-2">
                            {featuredStory.title}
                          </h1>

                          <div className="flex items-center gap-2 mb-4">
                            <img src={featuredStory.owner?.image?.url || DEFAULT_AVATAR}
                              className="w-6 h-6 rounded-full object-cover border border-white/20"
                              alt={featuredStory.owner?.username} />
                            <p className="text-gray-300 text-sm">
                              by <span className="font-bold text-white">@{featuredStory.owner?.username || 'author'}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-4 mb-6 text-xs text-gray-300 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <i className="ri-eye-line text-blue-400"></i>
                              {featuredStory.views.length} Views
                            </span>
                            <span className="flex items-center gap-1.5">
                              <i className="ri-heart-fill text-red-400"></i>
                              {featuredStory.likedBy.length} Likes
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="bg-white text-black text-sm font-black px-6 py-3 rounded-full transition-transform group-hover:scale-105 shadow-md">
                              <i className="ri-book-open-line mr-1"></i> Read Story
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rotator dots */}
                      {topLikedStories.length > 1 && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                          {topLikedStories.map((_, i) => (
                            <button key={i}
                              onClick={(e) => { e.preventDefault(); setFeaturedIndex(i); }}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === featuredIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/80'
                              }`}></button>
                          ))}
                        </div>
                      )}
                    </Link>
                  )}
                </section>
              )}

              {/* ═══════════════ ERROR / LOADING STATES ═══════════════ */}
              {error && <ErrorCard message={error} onRetry={fetchStories} />}

              {!error && loading && (
                <div className="mb-8">
                  <div className="flex gap-4 overflow-x-auto no-scrollbar">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="shrink-0 w-40 md:w-48 animate-pulse">
                        <div className="aspect-[4/5] bg-gray-200 dark:bg-gray-800 rounded-2xl mb-3"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════ EMPTY STATE ═══════════════ */}
              {!error && !loading && stories.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 mt-4">
                  <span className="text-5xl block mb-4">
                    {search ? '🔍' : category ? '📂' : '📚'}
                  </span>
                  <h3 className="text-lg font-black mb-2">
                    {search ? `No results for "${search}"` :
                     category ? `No ${CATEGORY_META[category]?.label} stories yet` :
                     'No stories yet'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {search ? 'Try different keywords or clear the search' :
                     category ? 'Be the first to write in this category!' :
                     'Start your writing journey today'}
                  </p>
                  {hasFilter ? (
                    <button onClick={() => { setSearch(''); setCategory(''); }}
                      className="inline-flex items-center gap-1 text-sm font-black text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">
                      <i className="ri-arrow-left-line"></i> View all stories
                    </button>
                  ) : (
                    <Link to="/write"
                      className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black text-sm font-bold px-6 py-3 rounded-full shadow-lg">
                      <i className="ri-edit-line"></i> Write Story
                    </Link>
                  )}
                </div>
              )}

              {/* ═══════════════ RECENTLY ADDED (HIDDEN ON SEARCH) ═══════════════ */}
              {!error && !loading && !hasFilter && stories.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-black text-gray-400 tracking-widest uppercase">
                      Fresh Reads
                    </h3>
                  </div>

                  <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 md:mx-0 px-4 md:px-0 pb-4">
                    {recentlyAdded.map(story => (
                      <Link key={story._id} to={`/stories/${story._id}`}
                        className="shrink-0 w-36 md:w-44 group">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-3 shadow-sm group-hover:shadow-md transition-all">
                          {story.image?.url ? (
                            <img src={story.image.url} alt={story.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${CATEGORY_META[story.category]?.gradient}`}>
                              <i className={`${CATEGORY_META[story.category]?.icon} text-white text-3xl`}></i>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <span className="absolute top-2 left-2 bg-white/90 dark:bg-black/80 backdrop-blur text-black dark:text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                            {CATEGORY_META[story.category]?.label}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-black dark:text-white line-clamp-2 leading-tight mb-1 group-hover:text-blue-500 transition-colors">
                          {story.title}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium truncate">
                          @{story.owner?.username || 'author'}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* ═══════════════ MAIN STORIES GRID ═══════════════ */}
              {/* Removed Most Popular section here to avoid heavy repetition since Hero handles trending stories */}
              {!error && !loading && stories.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-black text-gray-400 tracking-widest uppercase">
                      {hasFilter ? 'Results' : 'Explore All'}
                    </h3>
                    
                    {/* Sort dropdown only shows when browsing main grid */}
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                      className="text-xs font-bold bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5 outline-none cursor-pointer text-gray-600 dark:text-gray-400">
                      <option value="newest">Newest first</option>
                      <option value="popular">Most popular</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {stories.map(story => (
                      <Link key={story._id} to={`/stories/${story._id}`} className="group flex flex-col">
                        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-3 shadow-sm group-hover:shadow-md transition-all">
                          {story.image?.url ? (
                            <img src={story.image.url} alt={story.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${CATEGORY_META[story.category]?.gradient}`}>
                              <i className={`${CATEGORY_META[story.category]?.icon} text-white text-4xl`}></i>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

                          <span className="absolute top-2 left-2 bg-white/90 dark:bg-black/80 backdrop-blur text-black dark:text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                            {CATEGORY_META[story.category]?.label}
                          </span>

                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              <i className="ri-eye-line"></i> {story.views.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-heart-line"></i> {story.likedBy.length}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <h4 className="text-sm font-black text-black dark:text-white line-clamp-2 leading-tight mb-2 group-hover:text-blue-500 transition-colors">
                            {story.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <img src={story.owner?.image?.url || DEFAULT_AVATAR}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                              alt={story.owner?.username} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">
                                {story.owner?.username || 'deleted_user'}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                {moment(story.timeStamp).fromNow()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </main>

            {/* ─── RIGHT SIDEBAR ─── */}
            <aside className="hidden xl:block w-80 shrink-0 border-l border-gray-100 dark:border-gray-900 py-8 px-6">
              {/* Search — desktop only */}
              <div className="mb-10">
                <h3 className="text-[13px] font-black text-gray-400 tracking-widest uppercase mb-3">Quick Search</h3>
                <div className="relative">
                  <input type="text" placeholder="Search stories..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-900 rounded-full outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all border border-transparent focus:border-blue-200 dark:focus:border-blue-900" />
                  <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full flex items-center justify-center text-white dark:text-black transition-colors">
                    <i className="ri-search-line text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Top Writers */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-black text-gray-400 tracking-widest uppercase">Top Writers</h3>
                  <Link to="/writers" className="text-xs font-bold text-blue-500 hover:underline">See all</Link>
                </div>
                <div className="space-y-4">
                  {globalLoading ? (
                    [1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-1.5"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))
                  ) : topWriters.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2 text-center bg-gray-50 dark:bg-gray-900 rounded-xl">No writers yet</p>
                  ) : (
                    topWriters.slice(0, 5).map((w, idx) => (
                      <div key={w._id} className="flex items-center gap-3">
                        <Link to={`/profile/${w.username}`} className="relative shrink-0">
                          <img src={w.image?.url || DEFAULT_AVATAR}
                            className="w-12 h-12 rounded-full object-cover shadow-sm" alt={w.username} />
                          <span className={`absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black border-2 border-white dark:border-[#0F0F0F] shadow-sm
                            ${idx === 0 ? 'bg-yellow-400 text-yellow-900'
                              : idx === 1 ? 'bg-gray-300 text-gray-700'
                              : idx === 2 ? 'bg-amber-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            {idx + 1}
                          </span>
                        </Link>
                        <Link to={`/profile/${w.username}`} className="flex-1 min-w-0">
                          <p className="text-sm font-black text-black dark:text-white truncate hover:text-blue-500 transition-colors">
                            {w.name || w.username}
                          </p>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {w.followers?.length || 0} followers
                          </p>
                        </Link>
                        <button className="px-3 py-1.5 rounded-full text-[11px] font-black text-blue-500 border border-blue-100 dark:border-blue-900 hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all shrink-0">
                          Follow
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Removed redundant sidebar feature-card widget to keep layout lean and clean */}
            </aside>
          </div>
        </div>
      </div>

      {/* ═══════════════ MOBILE BOTTOM NAV ═══════════════ */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-900">
          <div className="flex items-center justify-around px-2 h-16 max-w-md mx-auto">
            <Link to="/stories" className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 text-black dark:text-white">
              <i className="ri-compass-3-fill text-xl"></i>
              <span className="text-[9px] font-black">Discover</span>
            </Link>
            <button onClick={() => setMobileSearchOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
              <i className="ri-search-line text-xl"></i>
              <span className="text-[9px] font-bold">Search</span>
            </button>
            <Link to="/write"
              className="flex items-center justify-center w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-xl -translate-y-4 hover:scale-105 active:scale-95 transition-transform">
              <i className="ri-edit-line text-2xl"></i>
            </Link>
            <Link to="/notifications" className="relative flex flex-col items-center justify-center gap-0.5 w-12 h-12 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
              <i className="ri-notification-3-line text-xl"></i>
              <span className="text-[9px] font-bold">Alerts</span>
              {unreadNotif > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-black">
                  {unreadNotif > 99 ? '99+' : unreadNotif}
                </span>
              )}
            </Link>
            <Link to={`/profile/${user.username}`} className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
              <img src={user.image?.url || DEFAULT_AVATAR}
                className="w-7 h-7 rounded-full object-cover border border-transparent" alt={user.username} />
              <span className="text-[9px] font-bold">Profile</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Mobile Search Modal */}
      {mobileSearchOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] bg-white dark:bg-black p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setMobileSearchOpen(false)}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input type="text" placeholder="Search stories..." autoFocus
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-900 rounded-full outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>
          <p className="text-xs font-black text-gray-400 tracking-widest uppercase mb-3">
            {search ? `${stories.length} Results` : 'Suggestions'}
          </p>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-20">
            {stories.slice(0, 10).map(story => (
              <Link key={story._id} to={`/stories/${story._id}`} onClick={() => setMobileSearchOpen(false)}
                className="flex items-center gap-4 p-2 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-2xl transition-colors">
                <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0 shadow-sm">
                  {story.image?.url ? <img src={story.image.url} className="w-full h-full object-cover" alt="" /> :
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${CATEGORY_META[story.category]?.gradient}`}>
                      <i className={`${CATEGORY_META[story.category]?.icon} text-white`}></i>
                    </div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate text-black dark:text-white mb-0.5">{story.title}</p>
                  <p className="text-xs text-gray-500 truncate font-medium">@{story.owner?.username} · {CATEGORY_META[story.category]?.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};