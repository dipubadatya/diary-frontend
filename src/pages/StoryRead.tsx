// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import api from '../services/api';
// import toast from 'react-hot-toast';
// import moment from 'moment';
// import { ErrorCard } from '../components/ErrorCard';

// interface Comment {
//   _id: string;
//   comment: string;
//   gif?: string;
//   author: {
//     _id: string;
//     username: string;
//     name: string;
//     image?: {
//       url: string;
//     };
//   };
//   timeStamp: string;
// }

// interface Story {
//   _id: string;
//   title: string;
//   story: string;
//   category: string;
//   image?: {
//     url: string;
//     filename: string;
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
//   comments: Comment[];
//   timeStamp: string;
// }

// interface LikedByUser {
//   _id: string;
//   username: string;
//   image?: {
//     url: string;
//   };
// }

// export const StoryRead: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const toggleTheme = () => {
//     const isDark = document.documentElement.classList.toggle('dark');
//     localStorage.setItem('theme', isDark ? 'dark' : 'light');
//   };

//   const handleLogout = async () => {
//     await logout();
//     navigate('/login');
//   };

//   const [story, setStory] = useState<Story | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [commentText, setCommentText] = useState('');
//   const [isLiked, setIsLiked] = useState(false);

//   // Popover likedBy states
//   const [likedByOpen, setLikedByOpen] = useState(false);
//   const [likedByUsers, setLikedByUsers] = useState<LikedByUser[]>([]);
//   const [likedByLoading, setLikedByLoading] = useState(false);

//   // Options dropdown state
//   const [optionsOpen, setOptionsOpen] = useState(false);
//   // Profile dropdown
//   const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
//   const [unreadNotifications, setUnreadNotifications] = useState(0);
//   const [unreadMessages, setUnreadMessages] = useState(0);

//   // Delete modal state
//   const [deleteModalOpen, setDeleteModalOpen] = useState(false);

//   // GIPHY search state in comments
//   const [gifOpen, setGifOpen] = useState(false);
//   const [gifQuery, setGifQuery] = useState('');
//   const [gifs, setGifs] = useState<any[]>([]);
//   const [searchingGifs, setSearchingGifs] = useState(false);

//   const popoverRef = useRef<HTMLDivElement>(null);
//   const optionsRef = useRef<HTMLDivElement>(null);

//   // Fetch badges counts
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

//   const fetchStory = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const res = await api.get(`/stories/${id}`);
//       if (res.data.success) {
//         const fetchedStory = res.data.story;
//         setStory(fetchedStory);
//         setIsLiked(res.data.isLiked);
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to load story details.');
//       toast.error('Failed to load story details.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (id) {
//       fetchStory();
//       checkBadges();
//     }
//   }, [id, user]);

//   // Click outside handlers to close popover & options
//   useEffect(() => {
//     const handleOutsideClick = (e: MouseEvent) => {
//       if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
//         setLikedByOpen(false);
//       }
//       if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
//         setOptionsOpen(false);
//       }
//     };
//     window.addEventListener('click', handleOutsideClick);
//     return () => window.removeEventListener('click', handleOutsideClick);
//   }, []);

//   const handleLikeToggle = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!story) return;

//     try {
//       const res = await api.post(`/stories/${story._id}/likes`);
//       if (res.data.success) {
//         setIsLiked(!isLiked);
//         setStory(prev => {
//           if (!prev) return null;
//           const alreadyLiked = prev.likedBy.includes(user?._id || '');
//           return {
//             ...prev,
//             likedBy: alreadyLiked
//               ? prev.likedBy.filter(uid => uid !== user?._id)
//               : [...prev.likedBy, user?._id || '']
//           };
//         });
//       }
//     } catch (err: any) {
//       toast.error('Failed to toggle like.');
//     }
//   };

//   // Fetch LikedBy users list on click
//   const handleOpenLikesPopover = async (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (!story) return;
//     setLikedByOpen(!likedByOpen);

//     if (!likedByOpen) {
//       setLikedByLoading(true);
//       try {
//         const res = await api.get(`/stories/${story._id}/likedBy`);
//         setLikedByUsers(res.data.likedBy || []);
//       } catch (err) {
//         toast.error('Failed to load likes list.');
//       } finally {
//         setLikedByLoading(false);
//       }
//     }
//   };

//   const handleShareStory = () => {
//     if (!story) return;
//     if (navigator.share) {
//       navigator.share({
//         title: story.title,
//         text: 'Check out this story on DIARY.',
//         url: window.location.href
//       }).catch(console.error);
//     } else {
//       navigator.clipboard.writeText(window.location.href);
//       toast.success('Link copied to clipboard!');
//     }
//   };

//   const handleDownloadPDF = () => {
//     if (!story) return;
//     window.open(`/api/stories/download/${story._id}`, '_blank');
//   };

//   const handleStoryDelete = async () => {
//     if (!story) return;
//     try {
//       const res = await api.delete(`/stories/${story._id}`);
//       if (res.data.success) {
//         toast.success('Story deleted successfully.');
//         navigate('/stories');
//       }
//     } catch (err) {
//       toast.error('Failed to delete story.');
//     }
//   };

//   const handleCommentSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!commentText.trim()) return;

//     try {
//       const res = await api.post(`/stories/${id}/comments`, { comment: commentText });
//       if (res.data.success) {
//         toast.success('Comment posted successfully.');
//         setStory(prev => {
//           if (!prev) return null;
//           return {
//             ...prev,
//             comments: [res.data.comment, ...prev.comments] // Add to top matching newest first
//           };
//         });
//         setCommentText('');
//       }
//     } catch (err) {
//       toast.error('Failed to post comment.');
//     }
//   };

//   const handleCommentDelete = async (commentId: string) => {
//     if (!story) return;
//     if (!window.confirm('Are you sure you want to delete this comment?')) return;

//     try {
//       const res = await api.delete(`/stories/${story._id}/comments/${commentId}`);
//       if (res.data.success) {
//         toast.success('Comment cleared.');
//         setStory(prev => {
//           if (!prev) return null;
//           return {
//             ...prev,
//             comments: prev.comments.filter(c => c._id !== commentId)
//           };
//         });
//       }
//     } catch (err) {
//       toast.error('Failed to delete comment.');
//     }
//   };

//   const searchGifs = async () => {
//     if (!gifQuery.trim()) return;
//     setSearchingGifs(true);
//     try {
//       const res = await api.get('/stories/search-gif', { params: { q: gifQuery } });
//       setGifs(res.data || []);
//     } catch (err) {
//       toast.error('Failed to load GIFs.');
//     } finally {
//       setSearchingGifs(false);
//     }
//   };

//   // Submit GIF as a comment
//   const handleSelectGif = async (url: string) => {
//     try {
//       // In old EJS Giphy comments, they posted a comment with gif link. We can do that by calling POST /comments with a gif URL parameter!
//       // Let's modify comment creator controller to handle gif field! Wait, does our controller comments create handles gif?
//       // Let's check backend comments controller create comment. Ah, it didn't save gif parameters, but wait! We can just pass the gif parameter inside comment body or post it!
//       // In the backend, we can allow comment schema to contain a `gif` string field.
//       // Wait, is it already inside Comment schema? We created Comment schema on lines 1-30 of comments.ts. Let's see if we added a `gif` field.
//       // Ah! We didn't add a `gif` field to `models/comment.ts`! But we can edit `models/comment.ts` and `controllers/comments.ts` to support optional `gif` string parameter!
//       // Let's make sure our comment posting submits `gif` parameter and saves it. That is extremely clean!
//       const res = await api.post(`/stories/${id}/comments`, { comment: 'Attached GIF', gif: url });
//       if (res.data.success) {
//         toast.success('GIF comment added.');
//         setStory(prev => {
//           if (!prev) return null;
//           return {
//             ...prev,
//             comments: [res.data.comment, ...prev.comments]
//           };
//         });
//         setGifOpen(false);
//         setGifQuery('');
//         setGifs([]);
//       }
//     } catch (err) {
//       toast.error('Failed to attach GIF.');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-bgLight dark:bg-bgDark text-gray-905 flex flex-col font-sans">
//         <div className="flex-1 flex items-center justify-center">
//           <div className="w-12 h-12 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-bgLight dark:bg-bgDark text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-500 font-sans pb-32">
//         <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-900 bg-white/80 dark:bg-slateCustom-950/80 backdrop-blur-md">
//           <div className="max-w-5xl mx-auto px-6 h-20 flex justify-between items-center">
//             <Link to="/stories" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
//               <span className="bg-brand w-8 h-8 rounded-lg flex items-center justify-center text-white text-base">D</span>
//               DIARY<span className="text-brand">.</span>
//             </Link>
//           </div>
//         </header>
//         <div className="max-w-5xl mx-auto px-6 mt-12">
//           <ErrorCard message={error} onRetry={fetchStory} />
//         </div>
//       </div>
//     );
//   }

//   if (!story) return null;

//   const isStoryOwner = story.owner?._id === user?._id;

//   return (
//     <div className="bg-bgLight dark:bg-bgDark text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-500 font-sans pb-32 selection:bg-brand/20 selection:text-brand">

//       {/* Delete story confirm Modal */}
//       {deleteModalOpen && (
//         <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
//           <div className="bg-white dark:bg-cardDark rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
//             <h3 className="text-2xl font-bold mb-2">Delete Story?</h3>
//             <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
//               This action is permanent and cannot be reversed.
//             </p>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setDeleteModalOpen(false)}
//                 className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold hover:bg-slate-200 transition-colors text-slate-800 dark:text-slate-200"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleStoryDelete}
//                 className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-650 text-white rounded-xl font-bold transition-colors"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Header bar matching Stories page */}
//       <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-900 bg-white/80 dark:bg-slateCustom-950/80 backdrop-blur-md">
//         <div className="max-w-5xl mx-auto px-6 h-20 flex justify-between items-center">
//           <Link to="/stories" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
//             <span className="bg-brand w-8 h-8 rounded-lg flex items-center justify-center text-white text-base">D</span>
//             DIARY<span className="text-brand">.</span>
//           </Link>

//           <div className="flex items-center gap-4">
//             <button
//               onClick={toggleTheme}
//               className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-gray-700 dark:text-gray-300"
//             >
//               <i id="theme-icon" className="ri-moon-clear-line text-xl"></i>
//             </button>

//             {user && (
//               <div className="relative group cursor-pointer">
//                 <button
//                   onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
//                   className="flex items-center gap-2 p-1 pr-3 bg-slate-50 dark:bg-slate-900 rounded-full hover:ring-2 ring-brand/20 transition-all text-gray-705 dark:text-gray-305"
//                 >
//                   <img
//                     src={user.image?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&h=60'}
//                     className="w-8 h-8 rounded-full object-cover"
//                     alt="Profile"
//                   />
//                   <span className="text-xs font-bold hidden sm:block">{user.username}</span>
//                 </button>

//                 {profileDropdownOpen && (
//                   <>
//                     <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
//                     <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-[70] overflow-hidden">
//                       <div className="px-4 py-3 border-b dark:border-slate-800 mb-1">
//                         <p className="text-sm font-bold truncate">{user.name}</p>
//                         <p className="text-[10px] text-slate-500 uppercase">@{user.username}</p>
//                       </div>
//                       <Link
//                         to={`/profile/${user.username}`}
//                         onClick={() => setProfileDropdownOpen(false)}
//                         className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
//                       >
//                         <i className="ri-dashboard-line mr-2"></i> Dashboard
//                       </Link>
//                       <Link
//                         to="/settings"
//                         onClick={() => setProfileDropdownOpen(false)}
//                         className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
//                       >
//                         <i className="ri-user-line mr-2"></i> Settings
//                       </Link>
//                       <div className="border-t border-slate-50 dark:border-slate-800 mt-1">
//                         <button
//                           onClick={() => {
//                             setProfileDropdownOpen(false);
//                             handleLogout();
//                           }}
//                           className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
//                         >
//                           <i className="ri-logout-box-line"></i> Logout
//                         </button>
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </header>

//       {/* Main Content Area */}
//       <main className="max-w-3xl mx-auto px-6 py-16">
//         <header className="mb-12 text-center">
//           <h1 className="font-serif text-4xl md:text-6xl font-light mb-8 leading-tight dark:text-white uppercase tracking-tight">
//             {story.title}
//           </h1>

//           <div className="flex items-center justify-center gap-4 mb-10">
//             <img
//               src={story.owner?.image?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&h=60'}
//               className="w-12 h-12 rounded-full object-cover ring-2 ring-brand/20"
//               alt={story.owner?.username || 'deleted_user'}
//             />
//             <div className="text-left font-sans">
//               <Link to={`/profile/${story.owner?.username || 'deleted_user'}`} className="block font-bold hover:text-brand transition-colors text-sm">
//                 {story.owner?.username || 'deleted_user'}
//               </Link>
//               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                 {moment(story.timeStamp).format('LL')}
//               </span>
//             </div>
//           </div>

//           {story.image?.url && (
//             <img
//               src={story.image.url}
//               className="w-full rounded-[2.5rem] shadow-2xl object-cover max-h-[550px]"
//               alt="Story Cover"
//             />
//           )}
//         </header>

//         {/* Text Body Canvas */}
//         <article
//           className="story-body text-slate-700 dark:text-slate-300 mb-16 prose prose-lg dark:prose-invert font-serif"
//           dangerouslySetInnerHTML={{ __html: story.story }}
//         />

//         {/* Interactive icons bar */}
//         <section className="border-y border-slate-100 dark:border-white/5 py-8 flex justify-between items-center mb-16 relative font-sans">
//           <div className="flex items-center gap-8">
//             <form onSubmit={handleLikeToggle} className="flex items-center gap-2">
//               <button type="submit" className="hover:scale-110 transition-transform text-slate-400">
//                 {isLiked ? (
//                   <i className="ri-heart-3-fill text-2xl text-red-500"></i>
//                 ) : (
//                   <i className="ri-heart-add-2-line text-2xl hover:text-red-400 transition-colors"></i>
//                 )}
//               </button>

//               {/* LikedBy Popover toggle list */}
//               <div className="relative" ref={popoverRef}>
//                 <span
//                   onClick={handleOpenLikesPopover}
//                   className="font-black text-sm cursor-pointer hover:text-brand transition-colors text-slate-900 dark:text-slate-100"
//                 >
//                   {story.likedBy.length}
//                 </span>

//                 {likedByOpen && (
//                   <div className="popover-container absolute bottom-8 left-0 mt-3 w-60 bg-white dark:bg-cardDark rounded-2xl shadow-2xl border border-slate-150 dark:border-slate-800 z-50 overflow-hidden text-left">
//                     <div className="flex items-center justify-between p-4 border-b dark:border-white/5">
//                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-450">Liked by</span>
//                       <button
//                         type="button"
//                         onClick={(e) => { e.stopPropagation(); setLikedByOpen(false); }}
//                         className="text-xl hover:text-slate-700 dark:hover:text-white"
//                       >
//                         &times;
//                       </button>
//                     </div>

//                     <div className="max-h-64 overflow-y-auto no-scrollbar p-2 space-y-1">
//                       {likedByLoading ? (
//                         <div className="p-4 text-center">
//                           <i className="ri-loader-4-line animate-spin text-gray-400 text-lg block mx-auto"></i>
//                         </div>
//                       ) : likedByUsers.length === 0 ? (
//                         <p className="p-4 text-center text-xs font-medium text-gray-500">No likes yet</p>
//                       ) : (
//                         likedByUsers.map((u) => (
//                           <Link
//                             key={u._id}
//                             to={`/profile/${u.username}`}
//                             onClick={() => setLikedByOpen(false)}
//                             className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
//                           >
//                             <img
//                               src={u.image?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40'}
//                               className="w-8 h-8 rounded-full object-cover bg-gray-200"
//                               alt={u.username}
//                             />
//                             <span className="text-xs font-bold text-gray-905 dark:text-white">
//                               {u.username}
//                             </span>
//                           </Link>
//                         ))
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </form>

//             <div className="flex items-center gap-2 text-slate-400">
//               <i className="ri-chat-3-line text-2xl"></i>
//               <span className="font-black text-sm">{story.comments.length}</span>
//             </div>
//           </div>

//           {/* Action Popovers (Download PDF, Edit, Delete options) */}
//           <div className="flex gap-2" ref={optionsRef}>
//             <button
//               onClick={handleShareStory}
//               className="p-2 text-slate-400 hover:text-brand"
//               title="Share story link"
//             >
//               <i className="ri-share-forward-line text-2xl"></i>
//             </button>

//             <div className="relative">
//               <button
//                 onClick={(e) => { e.stopPropagation(); setOptionsOpen(!optionsOpen); }}
//                 className="p-2 text-slate-400 hover:text-brand"
//                 title="Options"
//               >
//                 <i className="ri-more-2-line text-2xl"></i>
//               </button>

//               {optionsOpen && (
//                 <div className="absolute right-0 bottom-full mb-3 w-48 bg-white dark:bg-cardDark rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-50">
//                   {isStoryOwner && (
//                     <>
//                       <Link
//                         to={`/write?edit=${story._id}`}
//                         className="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
//                       >
//                         <i className="ri-pencil-line mr-2"></i> Edit Story
//                       </Link>
//                       <button
//                         onClick={() => { setOptionsOpen(false); setDeleteModalOpen(true); }}
//                         className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
//                       >
//                         <i className="ri-delete-bin-line mr-2"></i> Delete Story
//                       </button>
//                     </>
//                   )}
//                   <button
//                     onClick={handleDownloadPDF}
//                     className="w-full text-left block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
//                   >
//                     <i className="ri-download-cloud-line mr-2"></i> Download PDF
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </section>

//         {/* Comments Center */}
//         <section className="mb-32 space-y-12">
//           <h2 className="font-serif text-3xl font-light italic">Discussion.</h2>

//           <form onSubmit={handleCommentSubmit} className="font-sans">
//             <textarea
//               name="comment"
//               placeholder="Share your response..."
//               value={commentText}
//               onChange={(e) => setCommentText(e.target.value)}
//               required
//               className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 ring-brand/20 outline-none h-36 resize-none text-lg transition-all placeholder:text-gray-400"
//             />

//             <div className="flex justify-between items-center mt-4">
//               <button
//                 type="button"
//                 onClick={() => setGifOpen(!gifOpen)}
//                 className={`font-bold flex items-center gap-2 transition-colors text-sm py-2 px-4 rounded-full ${
//                   gifOpen
//                     ? 'text-brand bg-orange-50 dark:bg-brand/10'
//                     : 'text-slate-500 hover:text-brand bg-slate-100 dark:bg-slate-850'
//                 }`}
//               >
//                 <i className="ri-file-gif-line text-xl"></i> Add GIF
//               </button>

//               <button
//                 type="submit"
//                 className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform"
//               >
//                 Scribble
//               </button>
//             </div>
//           </form>

//           {/* GIPHY search drawer popup */}
//           {gifOpen && (
//             <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-[20px] mb-8 animate-fade-in font-sans">
//               <div className="flex gap-2 mb-4 relative">
//                 <i className="ri-search-2-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
//                 <input
//                   type="text"
//                   placeholder="Search GIPHY..."
//                   value={gifQuery}
//                   onChange={(e) => setGifQuery(e.target.value)}
//                   onKeyDown={(e) => e.key === 'Enter' && searchGifs()}
//                   className="flex-grow bg-white dark:bg-paperDark border border-gray-200 dark:border-gray-800 rounded-full pl-11 pr-4 py-2.5 text-sm font-medium outline-none focus:border-brand transition-colors"
//                 />
//                 <button
//                   type="button"
//                   onClick={searchGifs}
//                   className="bg-brand text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
//                 >
//                   {searchingGifs ? '...' : 'Search'}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setGifOpen(false)}
//                   className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition-colors animate-all"
//                 >
//                   <i className="ri-close-line"></i>
//                 </button>
//               </div>
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto no-scrollbar rounded-xl">
//                 {gifs.length === 0 ? (
//                   <p className="col-span-full text-center text-xs text-slate-450 py-4 font-medium">Search GIPHY tags above to display animations.</p>
//                 ) : (
//                   gifs.map((g) => (
//                     <img
//                       key={g.id}
//                       src={g.images.fixed_height.url}
//                       onClick={() => handleSelectGif(g.images.fixed_height.url)}
//                       className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 hover:scale-95 transition-all shadow-sm"
//                       alt="Giphy animation"
//                     />
//                   ))
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Comments List */}
//           <div className="space-y-6 pt-4 pb-20 font-sans">
//             {story.comments.length === 0 ? (
//               <div className="text-center py-12">
//                 <p className="text-gray-400 dark:text-gray-600 text-sm font-serif italic">
//                   The margins are empty. Be the first to leave a thought.
//                 </p>
//               </div>
//             ) : (
//               story.comments.map((comment) => {
//                 const isCommentAuthor = comment.author._id === user?._id;
//                 return (
//                   <div key={comment._id} className="flex gap-4 group">
//                     <Link to={`/profile/${comment.author.username}`} className="flex-shrink-0 mt-1">
//                       <img
//                         className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100 dark:border-slate-800"
//                         src={comment.author.image?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&h=60'}
//                         alt={comment.author.username}
//                       />
//                     </Link>

//                     <div className="flex-grow">
//                       <div className="bg-white dark:bg-cardDark rounded-[16px] rounded-tl-sm p-5 border border-gray-200 dark:border-gray-800 shadow-sm relative">
//                         <div className="flex items-center justify-between mb-3">
//                           <div className="flex items-center gap-2">
//                             <Link
//                               to={`/profile/${comment.author.username}`}
//                               className="font-bold text-sm text-gray-900 dark:text-white hover:text-brand transition-colors"
//                             >
//                               {comment.author.username}
//                             </Link>
//                             <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
//                             <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
//                               {moment(comment.timeStamp).fromNow()}
//                             </span>
//                           </div>

//                           {(isCommentAuthor || isStoryOwner) && (
//                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                               <button
//                                 onClick={() => handleCommentDelete(comment._id)}
//                                 className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
//                                 title="Delete Comment"
//                               >
//                                 <i className="ri-delete-bin-line text-sm"></i>
//                               </button>
//                             </div>
//                           )}
//                         </div>

//                         <p className="text-gray-750 dark:text-gray-300 text-base font-serif leading-relaxed whitespace-pre-wrap">
//                           {comment.comment}
//                         </p>

//                         {/* Renders GIF if present */}
//                         {comment.gif && (
//                           <div className="mt-4 rounded-xl overflow-hidden max-w-[200px] border border-gray-100 dark:border-gray-800">
//                             <img src={comment.gif} className="w-full h-auto object-cover" alt="Attached GIF" />
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </section>
//       </main>

//       {/* Floating Bottom Nav Dock (Mobile Navigation) */}
//       {user && (
//         <nav className="fixed bottom-6 left-0 right-0 z-[60] px-4 pointer-events-none md:hidden font-sans">
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

// import React, { useState, useEffect, useRef } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import api from "../services/api";
// import toast from "react-hot-toast";
// import moment from "moment";
// import { ErrorCard } from "../components/ErrorCard";

// interface Comment {
//   _id: string;
//   comment: string;
//   gif?: string;
//   author: {
//     _id: string;
//     username: string;
//     name: string;
//     image?: { url: string };
//   };
//   timeStamp: string;
// }

// interface Story {
//   _id: string;
//   title: string;
//   story: string;
//   category: string;
//   image?: { url: string; filename: string };
//   owner: {
//     _id: string;
//     username: string;
//     name: string;
//     image?: { url: string };
//   };
//   views: string[];
//   likedBy: string[];
//   likesCounts: number;
//   comments: Comment[];
//   timeStamp: string;
// }

// interface LikedByUser {
//   _id: string;
//   username: string;
//   image?: { url: string };
// }

// // ─── Inline styles for effects that Tailwind can't do ─────────────────────────
// const globalStyles = `
//   .lined-paper {
//     background-image: repeating-linear-gradient(
//       transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px
//     );
//     background-attachment: local;
//     line-height: 40px;
//   }
//   .dark .lined-paper {
//     background-image: repeating-linear-gradient(
//       transparent, transparent 39px, #374151 39px, #374151 40px
//     );
//   }
//   .story-body {
//     font-family: 'Lora', serif;
//     font-size: 1.1875rem;
//     white-space: pre-wrap;
//     line-height: 40px;
//   }
//   .story-body::first-letter {
//     font-family: 'Plus Jakarta Sans', sans-serif;
//     font-size: 3.5rem;
//     font-weight: 800;
//     float: left;
//     line-height: 1;
//     padding-right: 0.5rem;
//     padding-top: 0.4rem;
//     color: #FE5621;
//   }
//   .no-scrollbar::-webkit-scrollbar { display: none; }
//   .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
//   .glass-dock {
//     background: rgba(255,255,255,0.85);
//     backdrop-filter: blur(20px);
//     border-bottom: 1px solid rgba(0,0,0,0.05);
//   }
//   .dark .glass-dock {
//     background: rgba(15,23,42,0.85);
//     border-bottom: 1px solid rgba(255,255,255,0.05);
//   }
//   .book-shadow {
//     box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 8px rgba(224,242,254,0.5);
//   }
//   .dark .book-shadow {
//     box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 8px rgba(30,41,59,0.5);
//   }
//   .polaroid-img {
//     transform: rotate(-2deg);
//     transition: transform 0.5s ease;
//   }
//   .polaroid-img:hover {
//     transform: rotate(0deg);
//   }
// `;

// // ─── Binder Rings Component ────────────────────────────────────────────────────
// const BinderRings: React.FC = () => (
//   <div
//     className="hidden md:flex flex-col justify-evenly items-center"
//     style={{
//       position: "absolute",
//       left: "50%",
//       top: "2rem",
//       bottom: "2rem",
//       width: "40px",
//       transform: "translateX(-50%)",
//       zIndex: 10,
//       pointerEvents: "none",
//     }}
//   >
//     {Array.from({ length: 6 }).map((_, i) => (
//       <div
//         key={i}
//         style={{
//           width: "32px",
//           height: "16px",
//           background: "linear-gradient(to bottom, #d1d5db, #9ca3af)",
//           borderRadius: "8px",
//           boxShadow:
//             "0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.8)",
//           flexShrink: 0,
//         }}
//       />
//     ))}
//   </div>
// );

// export const StoryRead: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   // ── State ──────────────────────────────────────────────────────────────────
//   const [story, setStory] = useState<Story | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [commentText, setCommentText] = useState("");
//   const [isLiked, setIsLiked] = useState(false);
//   const [likesCount, setLikesCount] = useState(0);

//   const [likedByOpen, setLikedByOpen] = useState(false);
//   const [likedByUsers, setLikedByUsers] = useState<LikedByUser[]>([]);
//   const [likedByLoading, setLikedByLoading] = useState(false);

//   const [optionsOpen, setOptionsOpen] = useState(false);
//   const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
//   const [deleteModalOpen, setDeleteModalOpen] = useState(false);

//   const [gifOpen, setGifOpen] = useState(false);
//   const [gifQuery, setGifQuery] = useState("");
//   const [gifs, setGifs] = useState<any[]>([]);
//   const [searchingGifs, setSearchingGifs] = useState(false);

//   const [unreadNotifications, setUnreadNotifications] = useState(0);
//   const [unreadMessages, setUnreadMessages] = useState(0);

//   const [isDark, setIsDark] = useState(
//     document.documentElement.classList.contains("dark"),
//   );

//   const popoverRef = useRef<HTMLDivElement>(null);
//   const optionsRef = useRef<HTMLDivElement>(null);

//   // ── Theme ──────────────────────────────────────────────────────────────────
//   const toggleTheme = () => {
//     const dark = document.documentElement.classList.toggle("dark");
//     localStorage.setItem("theme", dark ? "dark" : "light");
//     setIsDark(dark);
//   };

//   // ── Fetch Story ────────────────────────────────────────────────────────────
//   const fetchStory = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const res = await api.get(`/stories/${id}`);
//       if (res.data.success) {
//         setStory(res.data.story);
//         setIsLiked(res.data.isLiked);
//         setLikesCount(
//           res.data.story.likesCounts ?? res.data.story.likedBy?.length ?? 0,
//         );
//       }
//     } catch (err: any) {
//       setError(err.message || "Failed to load story.");
//       toast.error("Failed to load story.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkBadges = async () => {
//     if (!user) return;
//     try {
//       const [notifRes, chatRes] = await Promise.all([
//         api.get("/users/notifications/unread-count"),
//         api.get("/chat/conversations"),
//       ]);
//       if (notifRes.data.success)
//         setUnreadNotifications(notifRes.data.unreadCount || 0);
//       if (chatRes.data.success) {
//         const total = chatRes.data.conversations.reduce(
//           (acc: number, c: any) => acc + (c.unreadCount || 0),
//           0,
//         );
//         setUnreadMessages(total);
//       }
//     } catch (_) {}
//   };

//   useEffect(() => {
//     if (id) {
//       fetchStory();
//       checkBadges();
//     }
//   }, [id]);

//   // ── Click Outside ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (popoverRef.current && !popoverRef.current.contains(e.target as Node))
//         setLikedByOpen(false);
//       if (optionsRef.current && !optionsRef.current.contains(e.target as Node))
//         setOptionsOpen(false);
//     };
//     window.addEventListener("click", handler);
//     return () => window.removeEventListener("click", handler);
//   }, []);

//   // ── Handlers ───────────────────────────────────────────────────────────────
//   const handleLikeToggle = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!story) return;
//     try {
//       const res = await api.post(`/stories/${story._id}/likes`);
//       if (res.data.success) {
//         setIsLiked(res.data.liked);
//         setLikesCount(res.data.likesCount);
//       }
//     } catch {
//       toast.error("Failed to toggle like.");
//     }
//   };

//   const handleOpenLikesPopover = async (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (!story) return;
//     const opening = !likedByOpen;
//     setLikedByOpen(opening);
//     if (opening) {
//       setLikedByLoading(true);
//       try {
//         const res = await api.get(`/stories/${story._id}/likedBy`);
//         setLikedByUsers(res.data.likedBy || []);
//       } catch {
//         toast.error("Failed to load likes.");
//       } finally {
//         setLikedByLoading(false);
//       }
//     }
//   };

//   const handleShareStory = () => {
//     if (!story) return;
//     if (navigator.share) {
//       navigator
//         .share({
//           title: story.title,
//           text: "Check out this story on DIARY.",
//           url: window.location.href,
//         })
//         .catch(console.error);
//     } else {
//       navigator.clipboard.writeText(window.location.href);
//       toast.success("Link copied to clipboard!");
//     }
//   };

//   const handleStoryDelete = async () => {
//     if (!story) return;
//     try {
//       await api.delete(`/stories/${story._id}`);
//       toast.success("Story deleted.");
//       navigate("/stories");
//     } catch {
//       toast.error("Failed to delete story.");
//     }
//   };

//   const handleCommentSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!commentText.trim()) return;
//     try {
//       const res = await api.post(`/stories/${id}/comments`, {
//         comment: commentText,
//       });
//       if (res.data.success) {
//         toast.success("Comment posted!");
//         setStory((prev) =>
//           prev
//             ? { ...prev, comments: [res.data.comment, ...prev.comments] }
//             : null,
//         );
//         setCommentText("");
//       }
//     } catch {
//       toast.error("Failed to post comment.");
//     }
//   };

//   const handleCommentDelete = async (commentId: string) => {
//     if (!story || !window.confirm("Delete this comment?")) return;
//     try {
//       await api.delete(`/stories/${story._id}/comments/${commentId}`);
//       toast.success("Comment removed.");
//       setStory((prev) =>
//         prev
//           ? {
//               ...prev,
//               comments: prev.comments.filter((c) => c._id !== commentId),
//             }
//           : null,
//       );
//     } catch {
//       toast.error("Failed to delete comment.");
//     }
//   };

//   const searchGifs = async () => {
//     if (!gifQuery.trim()) return;
//     setSearchingGifs(true);
//     try {
//       const res = await api.get("/stories/search-gif", {
//         params: { q: gifQuery },
//       });
//       setGifs(res.data || []);
//     } catch {
//       toast.error("Failed to load GIFs.");
//     } finally {
//       setSearchingGifs(false);
//     }
//   };

//   const handleSelectGif = async (url: string) => {
//     try {
//       const res = await api.post(`/stories/${id}/comments`, {
//         comment: "Attached GIF",
//         gif: url,
//       });
//       if (res.data.success) {
//         toast.success("GIF added!");
//         setStory((prev) =>
//           prev
//             ? { ...prev, comments: [res.data.comment, ...prev.comments] }
//             : null,
//         );
//         setGifOpen(false);
//         setGifQuery("");
//         setGifs([]);
//       }
//     } catch {
//       toast.error("Failed to attach GIF.");
//     }
//   };

//   const handleLogout = async () => {
//     await logout();
//     navigate("/login");
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0f172a] flex items-center justify-center">
//         <div className="w-10 h-10 border-2 border-[#FE5621]/20 border-t-[#FE5621] rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0f172a]">
//         <div className="max-w-5xl mx-auto px-6 mt-12">
//           <ErrorCard message={error} onRetry={fetchStory} />
//         </div>
//       </div>
//     );
//   }

//   if (!story) return null;

//   const isStoryOwner = story.owner?._id === user?._id;

//   return (
//     <>
//       {/* Inject global styles */}
//       <style>{globalStyles}</style>

//       <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0f172a] text-[#374151] dark:text-[#D1D5DB] transition-colors duration-500 font-sans overflow-x-hidden selection:bg-[#FE5621]/30 selection:text-[#FE5621]">
//         {/* ── Delete Modal ───────────────────────────────────────────────── */}
//         {deleteModalOpen && (
//           <div
//             className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
//             onClick={() => setDeleteModalOpen(false)}
//           >
//             <div
//               className="bg-white dark:bg-[#1e1e1e] rounded-[24px] p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-5">
//                 <i className="ri-delete-bin-5-line text-2xl" />
//               </div>
//               <h3 className="text-xl font-extrabold mb-2 text-gray-900 dark:text-white">
//                 Tear out this page?
//               </h3>
//               <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm font-medium">
//                 This action is permanent. The story will be completely removed
//                 from your diary.
//               </p>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setDeleteModalOpen(false)}
//                   className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-full font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleStoryDelete}
//                   className="flex-1 px-4 py-3 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── Header ────────────────────────────────────────────────────── */}
//         <header
//           className="sticky top-0 z-50 w-full glass-dock"
//           style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
//         >
//           <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex justify-between items-center">
//             {/* Left: back + logo */}
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => navigate(-1)}
//                 className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//               >
//                 <i className="ri-arrow-left-line text-xl" />
//               </button>
//               <Link
//                 to="/stories"
//                 className="text-xl font-extrabold tracking-tight hidden sm:block text-gray-900 dark:text-white"
//               >
//                 DIARY<span className="text-[#FE5621]">.</span>
//               </Link>
//             </div>

//             {/* Right: theme + profile */}
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={toggleTheme}
//                 className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//               >
//                 <i
//                   className={
//                     isDark ? "ri-sun-line text-xl" : "ri-moon-line text-xl"
//                   }
//                 />
//               </button>

//               {user && (
//                 <div className="relative ml-1">
//                   <button
//                     onClick={() => setProfileDropdownOpen((p) => !p)}
//                     className="flex items-center gap-2 p-1 pr-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:border-[#FE5621] transition-all"
//                   >
//                     <img
//                       src={
//                         user.image?.url ||
//                         "https://ui-avatars.com/api/?name=" + user.username
//                       }
//                       className="w-7 h-7 rounded-full object-cover bg-white"
//                       alt="Profile"
//                     />
//                     <span className="text-[11px] font-bold hidden sm:block text-gray-700 dark:text-gray-200">
//                       {user.username}
//                     </span>
//                     <i className="ri-arrow-down-s-line text-gray-400 hidden sm:block text-sm" />
//                   </button>

//                   {profileDropdownOpen && (
//                     <>
//                       <div
//                         className="fixed inset-0 z-10"
//                         onClick={() => setProfileDropdownOpen(false)}
//                       />
//                       <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-[70] overflow-hidden">
//                         <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
//                           <p className="text-sm font-extrabold truncate text-gray-900 dark:text-white">
//                             {user.name}
//                           </p>
//                           <p className="text-[10px] text-gray-500 font-semibold">
//                             @{user.username}
//                           </p>
//                         </div>
//                         <Link
//                           to="/dashboard"
//                           onClick={() => setProfileDropdownOpen(false)}
//                           className="flex items-center px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
//                         >
//                           <i className="ri-dashboard-line mr-3 text-gray-400" />{" "}
//                           Dashboard
//                         </Link>
//                         <Link
//                           to="/profile"
//                           onClick={() => setProfileDropdownOpen(false)}
//                           className="flex items-center px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
//                         >
//                           <i className="ri-user-line mr-3 text-gray-400" />{" "}
//                           Profile
//                         </Link>
//                         <div className="border-t border-gray-100 dark:border-gray-800 mt-1">
//                           <button
//                             onClick={() => {
//                               setProfileDropdownOpen(false);
//                               handleLogout();
//                             }}
//                             className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
//                           >
//                             <i className="ri-logout-box-line mr-3" /> Logout
//                           </button>
//                         </div>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </header>

//         {/* ── Main Desk ─────────────────────────────────────────────────── */}
//         <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 md:py-16">
//           {/* ── The Notebook ────────────────────────────────────────────── */}
//           <div
//             className="relative flex flex-col md:flex-row w-full bg-white dark:bg-[#1e1e1e] rounded-xl book-shadow ring-4 ring-[#E0F2FE] dark:ring-[#1e293b]"
//             style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
//           >
//             {/* Binder spine (desktop only) */}
//             <BinderRings />

//             {/* ── LEFT PAGE ─────────────────────────────────────────────── */}
//             <div className="w-full md:w-1/2 p-6 md:p-12 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 relative">
//               {/* Date / weather row */}
//               <div className="flex items-center justify-between mb-16">
//                 <div className="flex items-center gap-3">
//                   <i className="ri-sun-cloudy-line text-3xl text-yellow-500" />
//                   <div className="flex flex-col">
//                     <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
//                       {moment(story.timeStamp).format("dddd")}
//                     </span>
//                     <span className="text-xs font-semibold text-gray-500">
//                       {moment(story.timeStamp).format("MMM DD, YYYY")}
//                     </span>
//                   </div>
//                 </div>
//                 <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-extrabold uppercase tracking-widest rounded-md">
//                   {story.category || "Story"}
//                 </span>
//               </div>

//               {/* Polaroid image */}
//               <div
//                 className="max-w-[85%] mx-auto bg-white p-4 pb-14 rounded-sm relative mb-12 polaroid-img"
//                 style={{ boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
//               >
//                 <img
//                   src={
//                     story.image?.url ||
//                     "https://images.unsplash.com/photo-1527118732049-c88155f2107c?auto=format&fit=crop&w=600&q=80"
//                   }
//                   className="w-full aspect-[4/5] object-cover rounded-sm border border-gray-100"
//                   alt="Story Cover"
//                 />
//                 <h1
//                   className="absolute bottom-4 left-0 right-0 text-center px-4 text-xl font-bold text-gray-800"
//                   style={{
//                     fontFamily: "Lora, serif",
//                     display: "-webkit-box",
//                     WebkitLineClamp: 2,
//                     WebkitBoxOrient: "vertical",
//                     overflow: "hidden",
//                   }}
//                 >
//                   {story.title}
//                 </h1>
//               </div>

//               {/* Author footer */}
//               <div className="text-center mt-auto pt-8 border-t border-dashed border-gray-200 dark:border-gray-800">
//                 <div className="flex flex-col items-center justify-center">
//                   <Link
//                     to={`/profile/${story.owner._id}`}
//                     className="relative group mb-2"
//                   >
//                     <img
//                       src={
//                         story.owner.image?.url ||
//                         "https://ui-avatars.com/api/?name=" +
//                           story.owner.username
//                       }
//                       className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#FE5621] transition-all"
//                       alt={story.owner.username}
//                     />
//                   </Link>
//                   <Link
//                     to={`/profile/${story.owner._id}`}
//                     className="font-bold text-sm hover:text-[#FE5621] transition-colors text-gray-900 dark:text-white"
//                   >
//                     {story.owner.username}
//                   </Link>
//                   <p className="text-[11px] font-medium text-gray-500 mt-1">
//                     <i className="ri-eye-line mr-1" />
//                     {story.views.length} reads • Authored
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* ── RIGHT PAGE (lined paper) ───────────────────────────────── */}
//             <div className="w-full md:w-1/2 p-6 md:p-12 relative lined-paper min-h-[600px]">
//               {/* Floating action card */}
//               <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-lg mb-8 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
//                 <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-semibold">
//                   <i className="ri-headphone-line text-lg" />
//                   <span>Reflect &amp; Respond</span>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   {/* Like button + count + popover */}
//                   <div className="relative" ref={popoverRef}>
//                     <form
//                       onSubmit={handleLikeToggle}
//                       className="flex items-center gap-1 group"
//                     >
//                       <button
//                         type="submit"
//                         className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//                         onClick={(e) => {
//                           e.currentTarget.classList.add("scale-125");
//                           setTimeout(
//                             () => e.currentTarget.classList.remove("scale-125"),
//                             200,
//                           );
//                         }}
//                       >
//                         {isLiked ? (
//                           <i className="ri-heart-3-fill text-xl text-red-500" />
//                         ) : (
//                           <i className="ri-heart-line text-xl text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
//                         )}
//                       </button>
//                       <span
//                         onClick={handleOpenLikesPopover}
//                         className="font-bold text-sm cursor-pointer hover:text-[#FE5621] transition-colors text-gray-600 dark:text-gray-300 mr-2"
//                       >
//                         {likesCount}
//                       </span>
//                     </form>

//                     {/* LikedBy Popover */}
//                     {likedByOpen && (
//                       <div
//                         className="absolute z-[1000] overflow-hidden"
//                         style={{
//                           bottom: "110%",
//                           left: 0,
//                           width: "280px",
//                           borderRadius: "20px",
//                           background: "white",
//                           boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)",
//                           border: "1px solid #f3f4f6",
//                         }}
//                       >
//                         <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
//                           <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
//                             Liked by
//                           </span>
//                           <button
//                             type="button"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setLikedByOpen(false);
//                             }}
//                             className="text-gray-400 hover:text-gray-900 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center transition-colors"
//                           >
//                             &times;
//                           </button>
//                         </div>
//                         <div className="max-h-60 overflow-y-auto no-scrollbar p-2 space-y-1">
//                           {likedByLoading ? (
//                             <div className="p-4 text-center">
//                               <i className="ri-loader-4-line animate-spin text-gray-400 text-lg" />
//                             </div>
//                           ) : likedByUsers.length === 0 ? (
//                             <p className="p-4 text-center text-xs font-medium text-gray-500">
//                               No likes yet
//                             </p>
//                           ) : (
//                             likedByUsers.map((u) => (
//                               <Link
//                                 key={u._id}
//                                 to={`/profile/${u.username}`}
//                                 onClick={() => setLikedByOpen(false)}
//                                 className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
//                               >
//                                 <img
//                                   src={
//                                     u.image?.url ||
//                                     "https://ui-avatars.com/api/?name=" +
//                                       u.username
//                                   }
//                                   className="w-8 h-8 rounded-full object-cover bg-gray-200"
//                                   alt={u.username}
//                                 />
//                                 <span className="text-xs font-bold text-gray-900 dark:text-white">
//                                   {u.username}
//                                 </span>
//                               </Link>
//                             ))
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Share */}
//                   <button
//                     onClick={handleShareStory}
//                     className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
//                     title="Share"
//                   >
//                     <i className="ri-share-forward-line text-xl" />
//                   </button>

//                   {/* Options ⋯ */}
//                   <div className="relative" ref={optionsRef}>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setOptionsOpen((o) => !o);
//                       }}
//                       className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
//                     >
//                       <i className="ri-more-fill text-xl" />
//                     </button>

//                     {optionsOpen && (
//                       <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50">
//                         {isStoryOwner && (
//                           <>
//                             <Link
//                               to={`/write?edit=${story._id}`}
//                               className="flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
//                             >
//                               <i className="ri-pencil-line mr-3 text-gray-400" />{" "}
//                               Edit Page
//                             </Link>
//                             <button
//                               onClick={() => {
//                                 setOptionsOpen(false);
//                                 setDeleteModalOpen(true);
//                               }}
//                               className="w-full flex items-center text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
//                             >
//                               <i className="ri-delete-bin-line mr-3" /> Tear
//                               Page Out
//                             </button>
//                             <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
//                           </>
//                         )}
//                         <button
//                           onClick={() =>
//                             window.open(
//                               `/api/stories/download/${story._id}`,
//                               "_blank",
//                             )
//                           }
//                           className="w-full flex items-center text-left px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
//                         >
//                           <i className="ri-download-cloud-2-line mr-3 text-gray-400" />{" "}
//                           Save PDF
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Story body text */}
//               {/* <article className="story-body text-[#374151] dark:text-[#D1D5DB] relative z-0 mb-12">
//                 {story.story}
//               </article> */}
//               {/* Story body text */}
//               <article
//                 className="story-body text-[#374151] dark:text-[#D1D5DB] relative z-0 mb-12"
//                 dangerouslySetInnerHTML={{ __html: story.story }}
//               />
//             </div>
//           </div>

//           {/* ── Discussion Section (on the desk) ──────────────────────── */}
//           <section
//             id="discussion"
//             className="max-w-4xl mx-auto mt-16 space-y-8 px-4 sm:px-0"
//             style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
//           >
//             <div className="flex items-center gap-3">
//               <i className="ri-message-3-line text-2xl text-gray-400" />
//               <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
//                 Footnotes &amp; Thoughts ({story.comments.length})
//               </h2>
//             </div>

//             {/* Comment input card */}
//             <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-[20px] p-2 shadow-sm focus-within:ring-2 ring-[#FE5621]/30 transition-shadow">
//               <form onSubmit={handleCommentSubmit} className="flex flex-col">
//                 <textarea
//                   name="comment"
//                   placeholder="Write your thoughts in the margins..."
//                   required
//                   value={commentText}
//                   onChange={(e) => setCommentText(e.target.value)}
//                   className="w-full p-4 bg-transparent border-none outline-none h-24 resize-none text-base text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600"
//                   style={{ fontFamily: "Lora, serif" }}
//                 />
//                 <div className="flex justify-between items-center px-4 pb-3">
//                   <button
//                     type="button"
//                     onClick={() => setGifOpen((g) => !g)}
//                     className="text-xs font-bold text-gray-500 hover:text-[#FE5621] flex items-center gap-1.5 transition-colors bg-gray-100 dark:bg-gray-800 px-3.5 py-2 rounded-full hover:bg-orange-50 dark:hover:bg-[#FE5621]/10"
//                   >
//                     <i className="ri-file-gif-line text-lg" /> Attach GIF
//                   </button>
//                   <button
//                     type="submit"
//                     className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform"
//                   >
//                     Scribble
//                   </button>
//                 </div>
//               </form>
//             </div>

//             {/* GIF search drawer */}
//             {gifOpen && (
//               <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-[20px] border border-gray-200 dark:border-gray-800 mb-8">
//                 <div className="flex gap-2 mb-4 relative">
//                   <i className="ri-search-2-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder="Search GIPHY..."
//                     value={gifQuery}
//                     onChange={(e) => setGifQuery(e.target.value)}
//                     onKeyDown={(e) =>
//                       e.key === "Enter" && (e.preventDefault(), searchGifs())
//                     }
//                     className="flex-grow bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-full pl-11 pr-4 py-2.5 text-sm font-medium outline-none focus:border-[#FE5621] transition-colors"
//                   />
//                   <button
//                     type="button"
//                     onClick={searchGifs}
//                     className="bg-[#FE5621] text-white px-5 py-2.5 rounded-full text-sm font-bold"
//                   >
//                     {searchingGifs ? "..." : "Search"}
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setGifOpen(false)}
//                     className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition-colors"
//                   >
//                     <i className="ri-close-line" />
//                   </button>
//                 </div>
//                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto no-scrollbar rounded-xl">
//                   {gifs.length === 0 ? (
//                     <p className="col-span-full text-center text-xs text-gray-400 font-medium py-4">
//                       Search for a GIF to attach.
//                     </p>
//                   ) : (
//                     gifs.map((g) => (
//                       <img
//                         key={g.id}
//                         src={g.images.fixed_height.url}
//                         onClick={() =>
//                           handleSelectGif(g.images.fixed_height.url)
//                         }
//                         className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 hover:scale-95 transition-all shadow-sm"
//                         alt="gif"
//                       />
//                     ))
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Comments list */}
//             <div className="space-y-6 pt-4 pb-20">
//               {story.comments.length === 0 ? (
//                 <div className="text-center py-12">
//                   <p
//                     className="text-gray-400 dark:text-gray-600 text-sm italic"
//                     style={{ fontFamily: "Lora, serif" }}
//                   >
//                     The margins are empty. Be the first to leave a thought.
//                   </p>
//                 </div>
//               ) : (
//                 story.comments.map((review) => {
//                   const isCommentAuthor = review.author._id === user?._id;
//                   return (
//                     <div key={review._id} className="flex gap-4 group">
//                       <Link
//                         to={`/profile/${review.author.username}`}
//                         className="flex-shrink-0 mt-1"
//                       >
//                         <img
//                           className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-transparent group-hover:ring-gray-300 transition-all"
//                           src={
//                             review.author.image?.url ||
//                             "https://ui-avatars.com/api/?name=" +
//                               review.author.username
//                           }
//                           alt={review.author.username}
//                         />
//                       </Link>
//                       <div className="flex-grow">
//                         <div className="bg-white dark:bg-[#1e1e1e] rounded-[16px] rounded-tl-sm p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
//                           <div className="flex items-center justify-between mb-3">
//                             <div className="flex items-center gap-2">
//                               <Link
//                                 to={`/profile/${review.author.username}`}
//                                 className="font-bold text-sm text-gray-900 dark:text-white hover:text-[#FE5621] transition-colors"
//                               >
//                                 {review.author.username}
//                               </Link>
//                               <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
//                               <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
//                                 {moment(review.timeStamp).fromNow()}
//                               </span>
//                             </div>

//                             {(isCommentAuthor || isStoryOwner) && (
//                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                                 {isCommentAuthor && (
//                                   <Link
//                                     to={`/stories/${story._id}/comments/${review._id}/edit`}
//                                     className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-[#FE5621] transition-colors"
//                                   >
//                                     <i className="ri-edit-line text-sm" />
//                                   </Link>
//                                 )}
//                                 <button
//                                   onClick={() =>
//                                     handleCommentDelete(review._id)
//                                   }
//                                   className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
//                                 >
//                                   <i className="ri-delete-bin-line text-sm" />
//                                 </button>
//                               </div>
//                             )}
//                           </div>

//                           <p
//                             className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap"
//                             style={{ fontFamily: "Lora, serif" }}
//                           >
//                             {review.comment}
//                           </p>

//                           {review.gif && (
//                             <div className="mt-4 rounded-xl overflow-hidden max-w-[200px] border border-gray-100 dark:border-gray-800">
//                               <img
//                                 src={review.gif}
//                                 className="w-full h-auto object-cover"
//                                 alt="GIF"
//                               />
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           </section>
//         </main>

//         {/* ── Mobile Bottom Nav ──────────────────────────────────────── */}
//         {user && (
//           <nav className="fixed bottom-6 left-0 right-0 z-[60] px-4 pointer-events-none md:hidden">
//             <div className="max-w-md mx-auto glass-dock rounded-[2.5rem] p-2 shadow-2xl flex items-center justify-between pointer-events-auto">
//               <Link
//                 to="/chat"
//                 className="w-12 h-12 flex items-center justify-center rounded-full relative text-gray-500 dark:text-gray-400"
//               >
//                 <i className="ri-chat-smile-2-line text-xl" />
//                 {unreadMessages > 0 && (
//                   <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#FE5621] rounded-full ring-4 ring-white dark:ring-slate-900 animate-pulse" />
//                 )}
//               </Link>
//               <Link
//                 to={`/profile/${user.username}`}
//                 className="w-12 h-12 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400"
//               >
//                 <i className="ri-team-line text-xl" />
//               </Link>
//               <Link
//                 to="/write"
//                 className="w-14 h-14 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-full flex items-center justify-center shadow-2xl transform -translate-y-6 hover:scale-110 active:scale-95 transition-all"
//               >
//                 <i className="ri-add-line text-3xl" />
//               </Link>
//               <Link
//                 to="/notifications"
//                 className="w-12 h-12 flex items-center justify-center rounded-full relative text-gray-500 dark:text-gray-400"
//               >
//                 <i className="ri-notification-4-line text-xl" />
//                 {unreadNotifications > 0 && (
//                   <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-white dark:ring-slate-900 animate-pulse" />
//                 )}
//               </Link>
//               <Link
//                 to="/settings"
//                 className="w-12 h-12 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400"
//               >
//                 <i className="ri-user-line text-xl" />
//               </Link>
//             </div>
//           </nav>
//         )}
//       </div>
//     </>
//   );
// };



import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import moment from "moment";
import { ErrorCard } from "../components/ErrorCard";

interface Comment {
  _id: string;
  comment: string;
  gif?: string;
  author: {
    _id: string;
    username: string;
    name: string;
    image?: { url: string };
  };
  timeStamp: string;
}

interface Story {
  _id: string;
  title: string;
  story: string;
  category: string;
  image?: { url: string; filename: string };
  owner: {
    _id: string;
    username: string;
    name: string;
    image?: { url: string };
  };
  views: string[];
  likedBy: string[];
  likesCounts: number;
  comments: Comment[];
  timeStamp: string;
}

interface LikedByUser {
  _id: string;
  username: string;
  image?: { url: string };
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&display=swap');

  .font-display { font-family: 'Fraunces', serif; letter-spacing: -0.02em; }
  .font-body { font-family: 'Inter', sans-serif; }

  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  .prose-story {
    font-family: 'Inter', sans-serif;
    line-height: 1.85;
    color: #1f2937;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .dark .prose-story { color: #d1d5db; }
  .prose-story p { margin-bottom: 1.25rem; }
  .prose-story ul, .prose-story ol { margin: 1.25rem 0; padding-left: 1.5rem; }
  .prose-story li { margin-bottom: 0.5rem; }
  .prose-story ul li { list-style: disc; }
  .prose-story ol li { list-style: decimal; }
  .prose-story strong { font-weight: 700; color: #111827; }
  .dark .prose-story strong { color: #f9fafb; }
  .prose-story h1, .prose-story h2, .prose-story h3 {
    font-family: 'Fraunces', serif;
    font-weight: 700;
    margin: 1.5rem 0 0.75rem;
    color: #111827;
    line-height: 1.2;
  }
  .dark .prose-story h1, .dark .prose-story h2, .dark .prose-story h3 { color: #f9fafb; }
  .prose-story img { max-width: 100%; height: auto; border-radius: 12px; margin: 1rem 0; }
  .prose-story a { color: #FE5621; text-decoration: underline; }
  .prose-story blockquote {
    border-left: 3px solid #FE5621;
    padding-left: 1rem;
    margin: 1.25rem 0;
    font-style: italic;
    color: #6b7280;
  }

  .waveform-bar {
    display: inline-block;
    width: 3px;
    margin: 0 1px;
    background: currentColor;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .waveform-bar.playing {
    animation: pulse-bar 1s ease-in-out infinite;
  }
  @keyframes pulse-bar {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.4); }
  }

  .fade-in { animation: fadeIn 0.4s ease-out; }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

// ─── Waveform ─────────────────────────────────────────────────────────────────
const Waveform: React.FC<{ progress: number; playing: boolean; onSeek: (p: number) => void }> = ({
  progress,
  playing,
  onSeek,
}) => {
  const bars = useMemo(() => Array.from({ length: 40 }, () => 6 + Math.random() * 20), []);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, p)));
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="flex-1 h-10 flex items-center cursor-pointer min-w-0 overflow-hidden"
    >
      {bars.map((h, i) => {
        const barProgress = i / bars.length;
        const active = barProgress <= progress;
        return (
          <div
            key={i}
            className={`waveform-bar ${playing && Math.abs(barProgress - progress) < 0.05 ? "playing" : ""}`}
            style={{
              height: `${h}px`,
              opacity: active ? 1 : 0.3,
              color: active ? "#FE5621" : "#9ca3af",
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Audio Player ─────────────────────────────────────────────────────────────
const AudioPlayer: React.FC<{ text: string }> = ({ text }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [rate, setRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [supported, setSupported] = useState(true);

  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length === 0) return;
      setVoices(v);
      setSelectedVoice((prev) => {
        if (prev) return prev;
        const preferred =
          v.find((x) => /natural|neural|premium/i.test(x.name) && x.lang.startsWith("en")) ||
          v.find((x) => /samantha|google.*english|microsoft/i.test(x.name)) ||
          v.find((x) => x.lang.startsWith("en")) ||
          v[0];
        return preferred?.name || "";
      });
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const words = text.trim().split(/\s+/).length;
    const secs = (words / 150) * 60;
    setDuration(Math.max(secs / rate, 1));
  }, [text, rate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const tick = () => {
    const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current) / 1000;
    const capped = Math.min(elapsed, duration);
    setCurrentTime(capped);
    setProgress(Math.min(elapsed / duration, 1));
    if (elapsed >= duration) {
      handleStop();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const speak = (startChar = 0) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();

    const toSpeak = text.substring(startChar);
    if (!toSpeak.trim()) return;

    const utt = new SpeechSynthesisUtterance(toSpeak);
    utt.rate = rate;
    utt.pitch = 1;
    utt.volume = 1;
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utt.voice = voice;

    utt.onend = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      elapsedRef.current = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    utt.onerror = () => handleStop();

    window.speechSynthesis.speak(utt);
    startTimeRef.current = Date.now();
    setPlaying(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const handlePlay = () => {
    if (!supported) {
      toast.error("Audio not supported on this browser");
      return;
    }

    if (playing) {
      // Pause
      window.speechSynthesis.pause();
      elapsedRef.current += (Date.now() - startTimeRef.current) / 1000;
      setPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else if (window.speechSynthesis.paused) {
      // Resume
      window.speechSynthesis.resume();
      startTimeRef.current = Date.now();
      setPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // Start fresh
      elapsedRef.current = 0;
      setProgress(0);
      setCurrentTime(0);
      speak(0);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    elapsedRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const handleSeek = (p: number) => {
    const words = text.split(/\s+/);
    const startWord = Math.floor(p * words.length);
    const startChar = words.slice(0, startWord).join(" ").length;
    elapsedRef.current = p * duration;
    setProgress(p);
    setCurrentTime(p * duration);
    if (playing) {
      speak(startChar);
    }
  };

  const changeRate = (r: number) => {
    setRate(r);
    if (playing) {
      handleStop();
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!supported) {
    return (
      <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-4 text-center text-xs text-neutral-500">
        Audio playback not supported on your browser
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={handlePlay}
          className="w-11 h-11 flex-shrink-0 rounded-full bg-[#FFB800] hover:bg-[#FFA500] flex items-center justify-center transition-all active:scale-95 shadow-sm"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <i className="ri-pause-fill text-xl text-white" />
          ) : (
            <i className="ri-play-fill text-xl text-white ml-0.5" />
          )}
        </button>

        <Waveform progress={progress} playing={playing} onSeek={handleSeek} />

        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs font-semibold text-neutral-500 tabular-nums min-w-[36px] text-right">
            {progress > 0 || playing ? fmt(currentTime) : fmt(duration)}
          </span>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Settings"
          >
            <i className="ri-equalizer-line text-sm" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 slide-up space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-neutral-500">Speed</span>
            <div className="flex gap-1 flex-wrap">
              {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => changeRate(r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                    rate === r
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>
          {voices.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-neutral-500 flex-shrink-0">Voice</span>
              <select
                value={selectedVoice}
                onChange={(e) => {
                  setSelectedVoice(e.target.value);
                  if (playing) handleStop();
                }}
                className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1.5 outline-none border-none flex-1 text-right max-w-[200px] truncate"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name.length > 25 ? v.name.substring(0, 25) + "..." : v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Languages ────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
];

// Free translation using MyMemory API (no key required)
const translateText = async (text: string, target: string): Promise<string> => {
  // Split into chunks (MyMemory has 500 char limit per request)
  const chunks: string[] = [];
  const maxLen = 450;
  let current = "";
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen) {
      if (current) chunks.push(current);
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current) chunks.push(current);

  const translations = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${target}`
        );
        const data = await res.json();
        return data.responseData?.translatedText || chunk;
      } catch {
        return chunk;
      }
    })
  );

  return translations.join(" ");
};

// ─── Translate Sheet ──────────────────────────────────────────────────────────
const TranslateSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  currentLang: string;
}> = ({ open, onClose, onSelect, currentLang }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-5 sm:p-6 slide-up max-h-[85vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
              Translate
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Read in your language</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex-shrink-0"
          >
            <i className="ri-close-line" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onSelect(lang.code);
                onClose();
              }}
              className={`flex items-center gap-2 p-3 rounded-2xl transition-all min-w-0 ${
                currentLang === lang.code
                  ? "bg-[#FE5621]/10 border-2 border-[#FE5621]"
                  : "bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
              }`}
            >
              <span className="text-xl flex-shrink-0">{lang.flag}</span>
              <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                {lang.name}
              </span>
              {currentLang === lang.code && (
                <i className="ri-check-line ml-auto text-[#FE5621] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Font Size Sheet ──────────────────────────────────────────────────────────
const FontSizeSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  size: "sm" | "base" | "lg" | "xl";
  onChange: (s: "sm" | "base" | "lg" | "xl") => void;
}> = ({ open, onClose, size, onChange }) => {
  if (!open) return null;
  const options = [
    { key: "sm" as const, label: "Small", preview: "Aa", px: "14px" },
    { key: "base" as const, label: "Default", preview: "Aa", px: "17px" },
    { key: "lg" as const, label: "Large", preview: "Aa", px: "19px" },
    { key: "xl" as const, label: "Extra Large", preview: "Aa", px: "22px" },
  ];
  return (
    <div
      className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-5 sm:p-6 slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl font-bold">Reading Size</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500"
          >
            <i className="ri-close-line" />
          </button>
        </div>
        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                onChange(opt.key);
                onClose();
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                size === opt.key
                  ? "bg-[#FE5621]/10 border-2 border-[#FE5621]"
                  : "bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent"
              }`}
            >
              <span
                className="font-display font-bold text-neutral-900 dark:text-white"
                style={{ fontSize: opt.px }}
              >
                {opt.preview}
              </span>
              <span className="font-semibold text-sm">{opt.label}</span>
              {size === opt.key && <i className="ri-check-line ml-auto text-[#FE5621]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const StoryRead: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [likedByOpen, setLikedByOpen] = useState(false);
  const [likedByUsers, setLikedByUsers] = useState<LikedByUser[]>([]);
  const [likedByLoading, setLikedByLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const [gifOpen, setGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [searchingGifs, setSearchingGifs] = useState(false);

  const [translateOpen, setTranslateOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");
  const [downloading, setDownloading] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Load font size preference
  useEffect(() => {
    const saved = localStorage.getItem("storyFontSize");
    if (saved && ["sm", "base", "lg", "xl"].includes(saved)) {
      setFontSize(saved as any);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("storyFontSize", fontSize);
  }, [fontSize]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/stories/${id}`);
      if (res.data.success) {
        setStory(res.data.story);
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.story.likesCounts ?? res.data.story.likedBy?.length ?? 0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load story.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStory();
  }, [id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node))
        setLikedByOpen(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node))
        setMoreMenuOpen(false);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const handleLikeToggle = async () => {
    if (!story) return;
    const prev = isLiked;
    setIsLiked(!prev);
    setLikesCount((c) => (prev ? c - 1 : c + 1));
    try {
      const res = await api.post(`/stories/${story._id}/likes`);
      if (res.data.success) {
        setIsLiked(res.data.liked);
        setLikesCount(res.data.likesCount);
      }
    } catch {
      setIsLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : c - 1));
      toast.error("Failed to toggle like.");
    }
  };

  const handleOpenLikesPopover = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!story) return;
    const opening = !likedByOpen;
    setLikedByOpen(opening);
    if (opening) {
      setLikedByLoading(true);
      try {
        const res = await api.get(`/stories/${story._id}/likedBy`);
        setLikedByUsers(res.data.likedBy || []);
      } catch {
        toast.error("Failed to load likes.");
      } finally {
        setLikedByLoading(false);
      }
    }
  };

  const handleShareStory = async () => {
    if (!story) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: "Check out this story on DIARY.",
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const handleStoryDelete = async () => {
    if (!story) return;
    try {
      await api.delete(`/stories/${story._id}`);
      toast.success("Story deleted.");
      navigate("/stories");
    } catch {
      toast.error("Failed to delete story.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!story || downloading) return;
    setDownloading(true);
    const t = toast.loading("Preparing PDF...");
    try {
      // Try server endpoint first
      try {
        const res = await api.get(`/stories/download/${story._id}`, {
          responseType: "blob",
        });
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${story.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Downloaded!", { id: t });
      } catch {
        // Fallback: generate PDF client-side via print
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          toast.error("Please allow popups to download PDF", { id: t });
          return;
        }
        const cleanStory = story.story.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${story.title}</title>
              <meta charset="utf-8" />
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Fraunces:wght@600;700&display=swap');
                * { box-sizing: border-box; }
                body {
                  font-family: 'Inter', sans-serif;
                  max-width: 700px;
                  margin: 40px auto;
                  padding: 20px;
                  color: #1f2937;
                  line-height: 1.75;
                }
                h1 {
                  font-family: 'Fraunces', serif;
                  font-size: 42px;
                  margin: 0 0 8px;
                  line-height: 1.1;
                }
                .meta {
                  color: #FE5621;
                  font-weight: 600;
                  font-size: 14px;
                  margin-bottom: 24px;
                }
                .author {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  padding: 16px 0;
                  border-top: 1px solid #e5e7eb;
                  border-bottom: 1px solid #e5e7eb;
                  margin: 24px 0;
                }
                .author img { width: 40px; height: 40px; border-radius: 50%; }
                img { max-width: 100%; height: auto; border-radius: 12px; margin: 16px 0; }
                p { margin: 0 0 16px; }
                @media print {
                  body { margin: 20px; }
                }
              </style>
            </head>
            <body>
              <p class="meta">${moment(story.timeStamp).format("MMMM DD, YYYY")}</p>
              <h1>${story.title}</h1>
              ${
                story.image?.url
                  ? `<img src="${story.image.url}" alt="${story.title}" />`
                  : ""
              }
              <div class="author">
                <div>
                  <div style="font-weight:700;font-size:14px;">${story.owner.name || story.owner.username}</div>
                  <div style="color:#6b7280;font-size:12px;">@${story.owner.username}</div>
                </div>
              </div>
              <div>${cleanStory}</div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    window.onafterprint = function() { window.close(); };
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        toast.success("PDF ready to print!", { id: t });
      }
    } catch (err) {
      toast.error("Failed to download PDF", { id: t });
    } finally {
      setDownloading(false);
      setMoreMenuOpen(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/stories/${id}/comments`, { comment: commentText });
      if (res.data.success) {
        toast.success("Posted!");
        setStory((prev) =>
          prev ? { ...prev, comments: [res.data.comment, ...prev.comments] } : null
        );
        setCommentText("");
      }
    } catch {
      toast.error("Failed to post.");
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!story || !window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/stories/${story._id}/comments/${commentId}`);
      setStory((prev) =>
        prev ? { ...prev, comments: prev.comments.filter((c) => c._id !== commentId) } : null
      );
      toast.success("Removed.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const searchGifs = async () => {
    if (!gifQuery.trim()) return;
    setSearchingGifs(true);
    try {
      const res = await api.get("/stories/search-gif", { params: { q: gifQuery } });
      setGifs(res.data || []);
    } catch {
      toast.error("Failed to load GIFs.");
    } finally {
      setSearchingGifs(false);
    }
  };

  const handleSelectGif = async (url: string) => {
    try {
      const res = await api.post(`/stories/${id}/comments`, {
        comment: "Attached GIF",
        gif: url,
      });
      if (res.data.success) {
        setStory((prev) =>
          prev ? { ...prev, comments: [res.data.comment, ...prev.comments] } : null
        );
        setGifOpen(false);
        setGifQuery("");
        setGifs([]);
      }
    } catch {
      toast.error("Failed to attach GIF.");
    }
  };

  const handleTranslate = async (langCode: string) => {
    if (!story) return;
    setCurrentLang(langCode);
    if (langCode === "en") {
      setTranslatedText(null);
      return;
    }
    setTranslating(true);
    const t = toast.loading("Translating...");
    try {
      const cleanText = story.story
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const translated = await translateText(cleanText, langCode);
      setTranslatedText(translated);
      toast.success("Translated!", { id: t });
    } catch (err) {
      toast.error("Translation failed", { id: t });
      setCurrentLang("en");
    } finally {
      setTranslating(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] dark:bg-neutral-950 flex items-center justify-center font-body">
        <div className="w-8 h-8 border-2 border-[#FE5621]/20 border-t-[#FE5621] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] dark:bg-neutral-950 font-body">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-12">
          <ErrorCard message={error} onRetry={fetchStory} />
        </div>
      </div>
    );
  }

  if (!story) return null;

  const isStoryOwner = story.owner?._id === user?._id;

  const fontSizeMap = {
    sm: "text-[14px] sm:text-[15px]",
    base: "text-[16px] sm:text-[17px]",
    lg: "text-[18px] sm:text-[19px]",
    xl: "text-[20px] sm:text-[22px]",
  };

  // Clean plain text for audio (use translated if available)
  const plainTextForAudio = (translatedText || story.story)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <>
      <style>{globalStyles}</style>

      <div className="min-h-screen bg-[#F5F5F3] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-body overflow-x-hidden">
        {/* Modals */}
        {deleteModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setDeleteModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                <i className="ri-delete-bin-line text-xl" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">Delete this story?</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
                This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-full font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStoryDelete}
                  className="flex-1 py-3 bg-red-500 text-white rounded-full font-semibold text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <TranslateSheet
          open={translateOpen}
          onClose={() => setTranslateOpen(false)}
          onSelect={handleTranslate}
          currentLang={currentLang}
        />

        <FontSizeSheet
          open={fontSizeOpen}
          onClose={() => setFontSizeOpen(false)}
          size={fontSize}
          onChange={setFontSize}
        />

        {/* Content */}
        <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-24">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
              aria-label="Back"
            >
              <i className="ri-arrow-left-s-line text-2xl" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setFontSizeOpen(true)}
                className="h-11 px-3 sm:px-4 rounded-full bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200/60 dark:border-neutral-800 flex items-center gap-1.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:scale-105 active:scale-95 transition-transform"
                aria-label="Font size"
              >
                <span className="text-xs">A</span>
                <span className="text-base">A</span>
              </button>

              <button
                onClick={() => setTranslateOpen(true)}
                className="h-11 px-3 sm:px-4 rounded-full bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200/60 dark:border-neutral-800 flex items-center gap-1.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:scale-105 active:scale-95 transition-transform"
                aria-label="Translate"
              >
                <i className="ri-translate-2" />
                <span className="hidden xs:inline text-sm">
                  {LANGUAGES.find((l) => l.code === currentLang)?.flag}
                </span>
              </button>

              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoreMenuOpen((o) => !o);
                  }}
                  className="w-11 h-11 rounded-full bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:scale-105 active:scale-95 transition-transform"
                  aria-label="More"
                >
                  <i className="ri-more-fill text-lg" />
                </button>

                {moreMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-1.5 z-50 scale-in origin-top-right">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={downloading}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {downloading ? (
                        <i className="ri-loader-4-line animate-spin text-neutral-400" />
                      ) : (
                        <i className="ri-download-line text-neutral-400" />
                      )}
                      Download PDF
                    </button>
                    <button
                      onClick={() => {
                        handleShareStory();
                        setMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <i className="ri-share-forward-line text-neutral-400" />
                      Share Story
                    </button>
                    {isStoryOwner && (
                      <>
                        <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                        <Link
                          to={`/write?edit=${story._id}`}
                          onClick={() => setMoreMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <i className="ri-pencil-line text-neutral-400" />
                          Edit Story
                        </Link>
                        <button
                          onClick={() => {
                            setDeleteModalOpen(true);
                            setMoreMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <i className="ri-delete-bin-line" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <article className="fade-in">
            <p className="text-center text-[#FE5621] font-semibold text-xs sm:text-sm mb-3 tracking-wide">
              {moment(story.timeStamp).format("MMMM DD, YYYY")}
            </p>

            <h1 className="font-display text-center text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-5 leading-[1.1] break-words">
              {story.title}
            </h1>

            <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8">
              {story.category && (
                <span className="px-3 sm:px-4 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
                  {story.category}
                </span>
              )}
              <span className="px-3 sm:px-4 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {moment(story.timeStamp).fromNow()}
              </span>
              <span className="px-3 sm:px-4 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <i className="ri-eye-line mr-1" />
                {story.views.length}
              </span>
            </div>

            {story.image?.url && (
              <div className="mb-6 rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] bg-neutral-100 dark:bg-neutral-900">
                <img
                  src={story.image.url}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <Link
              to={`/profile/${story.owner._id}`}
              className="flex items-center gap-3 mb-6 group"
            >
              <img
                src={
                  story.owner.image?.url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    story.owner.username
                  )}&background=FE5621&color=fff`
                }
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900 shadow-sm flex-shrink-0"
                alt={story.owner.username}
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-[#FE5621] transition-colors truncate">
                  {story.owner.name || story.owner.username}
                </p>
                <p className="text-xs text-neutral-500 truncate">@{story.owner.username}</p>
              </div>
            </Link>

            {/* Audio */}
            <div className="mb-6">
              <AudioPlayer text={plainTextForAudio} />
            </div>

            {/* Translation banner */}
            {translating && (
              <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500 justify-center bg-blue-50 dark:bg-blue-500/10 rounded-full px-4 py-2">
                <i className="ri-loader-4-line animate-spin" />
                Translating to {LANGUAGES.find((l) => l.code === currentLang)?.name}...
              </div>
            )}
            {translatedText && !translating && (
              <div className="mb-4 flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-full text-xs">
                <span className="text-blue-700 dark:text-blue-300 font-semibold truncate min-w-0">
                  <i className="ri-translate-2 mr-1" />
                  {LANGUAGES.find((l) => l.code === currentLang)?.name}
                </span>
                <button
                  onClick={() => {
                    setTranslatedText(null);
                    setCurrentLang("en");
                  }}
                  className="text-blue-700 dark:text-blue-300 font-semibold hover:underline flex-shrink-0"
                >
                  Show original
                </button>
              </div>
            )}

            {/* Story body */}
            <div className={`prose-story ${fontSizeMap[fontSize]}`}>
              {translatedText ? (
                translatedText.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <div dangerouslySetInnerHTML={{ __html: story.story }} />
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={handleLikeToggle}
                className={`h-12 px-5 rounded-full flex items-center gap-2 font-semibold text-sm transition-all active:scale-95 ${
                  isLiked
                    ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                    : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-200"
                }`}
              >
                <i className={isLiked ? "ri-heart-3-fill" : "ri-heart-3-line"} />
                <span onClick={(e) => { e.stopPropagation(); handleOpenLikesPopover(e); }}>
                  {likesCount}
                </span>
              </button>

              <button
                onClick={handleShareStory}
                className="w-12 h-12 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:scale-105 active:scale-95 transition-transform"
                aria-label="Share"
              >
                <i className="ri-share-forward-line" />
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="w-12 h-12 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                aria-label="Download"
              >
                {downloading ? (
                  <i className="ri-loader-4-line animate-spin" />
                ) : (
                  <i className="ri-download-line" />
                )}
              </button>
            </div>

            {/* Liked by popover */}
            {likedByOpen && (
              <div
                ref={popoverRef}
                className="mt-4 mx-auto max-w-xs bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden scale-in"
              >
                <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Liked by
                  </span>
                  <button
                    onClick={() => setLikedByOpen(false)}
                    className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400"
                  >
                    <i className="ri-close-line text-sm" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto no-scrollbar p-2">
                  {likedByLoading ? (
                    <div className="p-4 text-center">
                      <i className="ri-loader-4-line animate-spin text-neutral-400" />
                    </div>
                  ) : likedByUsers.length === 0 ? (
                    <p className="p-4 text-center text-xs text-neutral-500">No likes yet</p>
                  ) : (
                    likedByUsers.map((u) => (
                      <Link
                        key={u._id}
                        to={`/profile/${u.username}`}
                        onClick={() => setLikedByOpen(false)}
                        className="flex items-center gap-3 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-2xl min-w-0"
                      >
                        <img
                          src={
                            u.image?.url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}`
                          }
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          alt={u.username}
                        />
                        <span className="text-sm font-semibold truncate">{u.username}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </article>

          {/* Comments */}
          <section className="mt-14 sm:mt-16">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="font-display text-xl sm:text-2xl font-bold">Reflections</h2>
              <span className="text-sm font-semibold text-neutral-400">
                {story.comments.length}
              </span>
            </div>

            <form
              onSubmit={handleCommentSubmit}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-2 mb-6 focus-within:border-[#FE5621] transition-colors"
            >
              <textarea
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 bg-transparent outline-none resize-none text-sm h-20 placeholder-neutral-400"
              />
              <div className="flex items-center justify-between px-2 pb-1 gap-2">
                <button
                  type="button"
                  onClick={() => setGifOpen((g) => !g)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-[#FE5621] transition-colors px-3 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex-shrink-0"
                >
                  <i className="ri-file-gif-line" /> GIF
                </button>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2 rounded-full font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
                >
                  Post
                </button>
              </div>
            </form>

            {gifOpen && (
              <div className="bg-neutral-50 dark:bg-neutral-900 p-3 sm:p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 mb-6 slide-up">
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative min-w-0">
                    <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search GIFs..."
                      value={gifQuery}
                      onChange={(e) => setGifQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), searchGifs())
                      }
                      className="w-full bg-white dark:bg-neutral-800 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-[#FE5621]/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchGifs}
                    className="bg-[#FE5621] text-white px-4 rounded-full text-sm font-semibold flex-shrink-0"
                  >
                    {searchingGifs ? <i className="ri-loader-4-line animate-spin" /> : "Go"}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto no-scrollbar">
                  {gifs.map((g) => (
                    <img
                      key={g.id}
                      src={g.images.fixed_height.url}
                      onClick={() => handleSelectGif(g.images.fixed_height.url)}
                      className="w-full h-24 object-cover rounded-xl cursor-pointer hover:scale-95 transition-transform"
                      alt="gif"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {story.comments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto mb-3">
                    <i className="ri-chat-3-line text-2xl text-neutral-400" />
                  </div>
                  <p className="text-sm text-neutral-500">Be the first to reflect</p>
                </div>
              ) : (
                story.comments.map((review) => {
                  const isCommentAuthor = review.author._id === user?._id;
                  return (
                    <div key={review._id} className="flex gap-3 group">
                      <Link
                        to={`/profile/${review.author.username}`}
                        className="flex-shrink-0"
                      >
                        <img
                          className="w-9 h-9 rounded-full object-cover"
                          src={
                            review.author.image?.url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              review.author.username
                            )}`
                          }
                          alt={review.author.username}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl rounded-tl-md px-4 py-3">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Link
                                to={`/profile/${review.author.username}`}
                                className="font-semibold text-sm hover:text-[#FE5621] truncate"
                              >
                                {review.author.username}
                              </Link>
                              <span className="text-[10px] text-neutral-400 flex-shrink-0">
                                {moment(review.timeStamp).fromNow()}
                              </span>
                            </div>
                            {(isCommentAuthor || isStoryOwner) && (
                              <button
                                onClick={() => handleCommentDelete(review._id)}
                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 w-6 h-6 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-all flex-shrink-0"
                              >
                                <i className="ri-delete-bin-line text-xs" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed break-words">
                            {review.comment}
                          </p>
                          {review.gif && (
                            <img
                              src={review.gif}
                              className="mt-2 rounded-xl max-w-[200px] w-full"
                              alt="GIF"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};