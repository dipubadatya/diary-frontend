// src/pages/Dashboard.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ErrorCard } from '../components/ErrorCard';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

/* ═══════════════════════════════════════════════════════════════════════════ */
/* TYPES                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
interface Story {
  _id: string;
  title: string;
  story: string;
  category: string;
  image?: { url: string };
  views: string[];
  likedBy: string[];
  timeStamp: string;
}

interface Profile {
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/* CONSTANTS                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
const PROFILE_FILTERS = [
  { name: 'Original', value: 'none' },
  { name: 'Classic', value: 'contrast(130%) brightness(100%) saturate(120%)' },
  { name: 'Cinema', value: 'contrast(150%) saturate(100%) brightness(90%) sepia(20%)' },
  { name: 'Golden', value: 'hue-rotate(60deg) saturate(120%) brightness(110%)' },
  { name: 'Noir', value: 'grayscale(100%) contrast(180%) brightness(75%)' },
  { name: 'Moody', value: 'contrast(150%) brightness(80%) saturate(140%)' },
  { name: 'Warmth', value: 'sepia(40%) saturate(130%) contrast(110%) brightness(100%)' },
  { name: 'Cool', value: 'hue-rotate(210deg) brightness(95%) saturate(140%)' },
  { name: 'Retro', value: 'grayscale(60%) sepia(50%) contrast(120%)' },
  { name: 'Vivid', value: 'contrast(140%) brightness(140%) saturate(130%)' },
  { name: 'Crisp', value: 'contrast(200%) brightness(120%) saturate(100%)' },
  { name: 'Dreamy', value: 'blur(1px) contrast(90%) brightness(110%)' },
];

const BANNER_FILTERS = [
  { name: 'Original', value: 'none' },
  { name: 'Classic', value: 'contrast(130%)' },
  { name: 'Film', value: 'grayscale(100%)' },
  { name: 'Warm', value: 'sepia(50%)' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/* HELPERS                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
const timeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const avatarUrl = (username: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366f1&color=fff&bold=true&size=200`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
export const Dashboard: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, login } = useAuth();
  const navigate = useNavigate();

  // ── State ──
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'writings' | 'about'>('writings');

  // Modals
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<FollowUser[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [bannerViewOpen, setBannerViewOpen] = useState(false);
  const [profileViewOpen, setProfileViewOpen] = useState(false);

  // Profile image edit
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileFilter, setProfileFilter] = useState('none');
  const profilePreviewRef = useRef<HTMLImageElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const profileCropperRef = useRef<Cropper | null>(null);

  // Banner edit
  const [bannerEditOpen, setBannerEditOpen] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerFilter, setBannerFilter] = useState('none');
  const [bannerSelected, setBannerSelected] = useState(false);
  const bannerPreviewRef = useRef<HTMLImageElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bannerCropperRef = useRef<Cropper | null>(null);

  // ── Computed ──
  const isSelf = profile?._id === currentUser?._id;
  const reversedStories = useMemo(() => [...stories].reverse(), [stories]);
  const totalViews = useMemo(
    () => stories.reduce((a, s) => a + (s.views?.length || 0), 0),
    [stories]
  );
  const totalLikes = useMemo(
    () => stories.reduce((a, s) => a + (s.likedBy?.length || 0), 0),
    [stories]
  );

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* DATA FETCHING                                                             */
  /* ═════════════════════════════════════════════════════════════════════════ */
  const fetchProfile = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/users/profile/${username}`);
      if (res.data.success) {
        setProfile(res.data.profile);
        setStories(res.data.stories || []);
        setIsFollowing(res.data.isFollowing);
        setFollowsMe(res.data.followsMe);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong loading this profile.');
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProfile]);

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* FOLLOW TOGGLE                                                             */
  /* ═════════════════════════════════════════════════════════════════════════ */
  const handleFollowToggle = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const res = await api.post(`/users/follow/${profile._id}`);
      if (res.data.success) {
        setIsFollowing(res.data.isFollowing);
        setProfile((p) =>
          p ? { ...p, followersCount: res.data.followersCount } : null
        );
        toast.success(
          res.data.isFollowing
            ? `You're now following @${profile.username}`
            : `Unfollowed @${profile.username}`
        );
      }
    } catch {
      toast.error('Could not update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* FOLLOWERS / FOLLOWING MODAL                                               */
  /* ═════════════════════════════════════════════════════════════════════════ */
  const openFollowsModal = async (type: 'followers' | 'following') => {
    if (!profile) return;
    setModalType(type);
    setModalLoading(true);
    try {
      const res = await api.get(`/users/${type}/${profile._id}`);
      if (res.data.success) setModalUsers(res.data[type] || []);
    } catch {
      toast.error(`Failed to load ${type}.`);
      setModalType(null);
    } finally {
      setModalLoading(false);
    }
  };

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* PROFILE IMAGE — CROP & UPLOAD                                             */
  /* ═════════════════════════════════════════════════════════════════════════ */
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
    setProfileFilter('none');
    setProfileEditOpen(true);
    setTimeout(initProfileCropper, 200);
  };

  const closeProfileEdit = () => {
    setProfileEditOpen(false);
    profileCropperRef.current?.destroy();
    profileCropperRef.current = null;
    setProfileFilter('none');
    if (profileInputRef.current) profileInputRef.current.value = '';
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!profilePreviewRef.current || !ev.target?.result) return;
      profilePreviewRef.current.src = ev.target.result as string;
      setProfileFilter('none');
      profileCropperRef.current?.destroy();
      profileCropperRef.current = null;
      setTimeout(initProfileCropper, 100);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileFilterClick = (val: string) => {
    setProfileFilter(val);
    if (profilePreviewRef.current)
      profilePreviewRef.current.style.filter = val === 'none' ? '' : val;
    const vb = document.querySelector(
      '.profile-edit-modal .cropper-view-box'
    ) as HTMLElement | null;
    if (vb) vb.style.filter = val === 'none' ? '' : val;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileCropperRef.current || !profile) {
      toast.error('Please select and crop an image first.');
      return;
    }
    setProfileUploading(true);
    try {
      const canvas = profileCropperRef.current.getCroppedCanvas({
        width: 300,
        height: 300,
      });
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const ctx = tmp.getContext('2d')!;
      if (profileFilter !== 'none') ctx.filter = profileFilter;
      ctx.drawImage(canvas, 0, 0);

      const blob = await new Promise<Blob>((r) =>
        tmp.toBlob((b) => r(b!), 'image/png', 0.9)
      );
      const fd = new FormData();
      fd.append('image', blob, 'profile.png');

      const res = await api.put('/users/profile/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Profile picture updated!');
        const url = res.data.imageUrl || res.data.image?.url;
        setProfile((p) =>
          p ? { ...p, image: { url, filename: 'profile_image' } } : null
        );
        if (currentUser && url)
          login({
            ...currentUser,
            image: { url, filename: 'profile_image' },
          });
        closeProfileEdit();
      }
    } catch {
      toast.error('Failed to upload profile picture.');
    } finally {
      setProfileUploading(false);
    }
  };

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* BANNER — CROP & UPLOAD                                                    */
  /* ═════════════════════════════════════════════════════════════════════════ */
  const openBannerEdit = () => {
    setBannerFilter('none');
    setBannerSelected(false);
    setBannerEditOpen(true);
  };

  const closeBannerEdit = () => {
    setBannerEditOpen(false);
    bannerCropperRef.current?.destroy();
    bannerCropperRef.current = null;
    setBannerFilter('none');
    setBannerSelected(false);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerSelected(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!bannerPreviewRef.current || !ev.target?.result) return;
      bannerCropperRef.current?.destroy();
      bannerCropperRef.current = null;
      bannerPreviewRef.current.src = ev.target.result as string;
      setBannerFilter('none');
      setTimeout(() => {
        if (!bannerPreviewRef.current) return;
        bannerCropperRef.current = new Cropper(bannerPreviewRef.current, {
          aspectRatio: 16 / 9,
          viewMode: 1,
        });
      }, 200);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFilterClick = (val: string) => {
    setBannerFilter(val);
    if (bannerPreviewRef.current)
      bannerPreviewRef.current.style.filter = val === 'none' ? '' : val;
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerCropperRef.current || !profile) {
      toast.error('Please select a banner image first.');
      return;
    }
    setBannerUploading(true);
    try {
      const canvas = bannerCropperRef.current.getCroppedCanvas({ width: 800 });
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const ctx = tmp.getContext('2d')!;
      if (bannerFilter !== 'none') ctx.filter = bannerFilter;
      ctx.drawImage(canvas, 0, 0);

      const blob = await new Promise<Blob>((r) =>
        tmp.toBlob((b) => r(b!), 'image/png', 0.9)
      );
      const fd = new FormData();
      fd.append('image', blob, 'banner.png');

      const res = await api.put('/users/profile/banner', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Cover photo updated!');
        const url = res.data.bannerUrl || res.data.banner?.url;
        setProfile((p) =>
          p ? { ...p, banner: { url, filename: 'banner_image' } } : null
        );
        if (currentUser && url)
          login({
            ...currentUser,
            banner: { url, filename: 'banner_image' },
          });
        closeBannerEdit();
      }
    } catch {
      toast.error('Failed to upload banner.');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!profile) return;
    try {
      await api.delete('/users/profile/banner');
      toast.success('Cover photo removed.');
      setProfile((p) =>
        p ? { ...p, banner: { url: '', filename: '' } } : null
      );
      closeBannerEdit();
    } catch {
      toast.error('Failed to remove banner.');
    }
  };

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* LOADING STATE                                                             */
  /* ═════════════════════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0a0a] dark:to-[#111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-[2.5px] border-indigo-100 dark:border-indigo-900/30" />
            <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-indigo-500 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-pulse" />
          </div>
          <p className="text-[13px] text-slate-400 dark:text-slate-600 font-medium tracking-wide">
            Loading profile…
          </p>
        </div>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* ERROR STATE                                                               */
  /* ═════════════════════════════════════════════════════════════════════════ */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0a0a] dark:to-[#111] text-slate-900 dark:text-slate-100">
        <div className="sticky top-0 z-50 px-4 py-3 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <i className="ri-arrow-left-line text-lg" />
            </button>
            <span className="text-sm font-semibold text-slate-500">Profile</span>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-5 mt-12">
          <ErrorCard message={error} onRetry={fetchProfile} />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* RENDER                                                                    */
  /* ═════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] text-slate-900 dark:text-slate-100 transition-colors duration-500">

      {/* ─── TOP BAR ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#0f0f0f]/70 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800/40">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              aria-label="Go back"
            >
              <i className="ri-arrow-left-s-line text-xl" />
            </button>
            <div className="leading-none">
              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                {profile.name}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {stories.length} {stories.length === 1 ? 'story' : 'stories'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isSelf && (
              <Link
                to="/settings"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Settings"
              >
                <i className="ri-settings-3-line text-[17px]" />
              </Link>
            )}
            {!isSelf && currentUser && (
              <button
                onClick={() => navigate(`/chat?user=${profile._id}`)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Message"
              >
                <i className="ri-chat-3-line text-[17px]" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-0 sm:px-4 pb-20">

        {/* ═══ BANNER ═══ */}
        <div className="relative w-full aspect-[2.8/1] sm:aspect-[3/1] bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/40 sm:rounded-b-3xl overflow-hidden group">
          {profile.banner?.url ? (
            <img
              src={profile.banner.url}
              alt="Cover"
              className="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-[1.02]"
              onClick={() => setBannerViewOpen(true)}
            />
          ) : (
            <div className="w-full h-full relative">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-8 -left-8 w-40 h-40 bg-indigo-200/50 dark:bg-indigo-800/20 rounded-full blur-3xl" />
                <div className="absolute top-4 right-12 w-32 h-32 bg-purple-200/40 dark:bg-purple-800/15 rounded-full blur-3xl" />
                <div className="absolute -bottom-6 left-1/3 w-48 h-24 bg-pink-200/40 dark:bg-pink-800/15 rounded-full blur-3xl" />
                <div className="absolute bottom-2 right-8 w-20 h-20 bg-amber-200/30 dark:bg-amber-800/15 rounded-full blur-2xl" />
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {isSelf && (
            <button
              onClick={openBannerEdit}
              className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-black/25 hover:bg-black/40 backdrop-blur-xl text-white/90 hover:text-white pl-2.5 pr-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 border border-white/10"
            >
              <i className="ri-camera-line text-xs" />
              Edit
            </button>
          )}
        </div>

        {/* ═══ AVATAR + INFO ═══ */}
        <div className="px-5 sm:px-6 relative">
          {/* Avatar */}
          <div className="relative -mt-14 sm:-mt-16 mb-3 inline-block">
            <div className="relative group">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[1.6rem] ring-[3px] ring-white dark:ring-[#0f0f0f] overflow-hidden shadow-lg shadow-black/10 dark:shadow-black/40 cursor-pointer bg-white dark:bg-slate-900"
                onClick={() => profile.image?.url && setProfileViewOpen(true)}
              >
                <img
                  src={profile.image?.url || avatarUrl(profile.username)}
                  alt={profile.username}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              {isSelf && (
                <button
                  onClick={openProfileEdit}
                  className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-[#0f0f0f] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-90 transition-all z-10"
                >
                  <i className="ri-camera-fill text-xs" />
                </button>
              )}
            </div>
          </div>

          {/* Name & Username */}
          <div className="mb-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {profile.name}
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              @{profile.username}
            </p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-4 max-w-lg">
              {profile.bio}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-[12px] text-slate-400 dark:text-slate-500 mb-5 flex-wrap">
            <span className="flex items-center gap-1.5">
              <i className="ri-calendar-line text-sm" />
              Joined {formatJoinDate(profile.createdAt)}
            </span>
            {stories.length > 0 && (
              <span className="flex items-center gap-1.5">
                <i className="ri-quill-pen-line text-sm" />
                {stories.length} {stories.length === 1 ? 'writing' : 'writings'}
              </span>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-5 mb-5">
            <button
              onClick={() => openFollowsModal('followers')}
              className="group flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <span className="text-[15px] font-bold text-slate-900 dark:text-white">
                {formatNumber(profile.followersCount)}
              </span>
              <span className="text-[13px] text-slate-400 dark:text-slate-500">
                Followers
              </span>
            </button>
            <button
              onClick={() => openFollowsModal('following')}
              className="group flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <span className="text-[15px] font-bold text-slate-900 dark:text-white">
                {formatNumber(profile.followingCount)}
              </span>
              <span className="text-[13px] text-slate-400 dark:text-slate-500">
                Following
              </span>
            </button>
            {totalViews > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold text-slate-900 dark:text-white">
                  {formatNumber(totalViews)}
                </span>
                <span className="text-[13px] text-slate-400 dark:text-slate-500">
                  Views
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isSelf && currentUser && (
            <div className="flex items-center gap-2.5 mb-6">
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 ${
                  isFollowing
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm'
                }`}
              >
                {followLoading ? (
                  <i className="ri-loader-4-line animate-spin text-sm" />
                ) : isFollowing ? (
                  'Following'
                ) : followsMe ? (
                  'Follow Back'
                ) : (
                  'Follow'
                )}
              </button>

              <button
                onClick={() => navigate(`/chat?user=${profile._id}`)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all active:scale-[0.97]"
              >
                <i className="ri-chat-3-line text-sm" />
                Message
              </button>
            </div>
          )}

          {isSelf && (
            <div className="flex items-center gap-2.5 mb-6">
              <Link
                to="/settings"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all active:scale-[0.97]"
              >
                <i className="ri-edit-line text-sm" />
                Edit Profile
              </Link>
              <Link
                to="/write"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all active:scale-[0.97]"
              >
                <i className="ri-quill-pen-line text-sm" />
                Write
              </Link>
            </div>
          )}
        </div>

        {/* ═══ TABS ═══ */}
        <div className="sticky top-12 z-40 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800/40">
          <div className="px-5 sm:px-6 flex items-center">
            {(['writings', 'about'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-3 text-[13px] font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-slate-900 dark:bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ TAB CONTENT ═══ */}
        <div className="px-4 sm:px-5 pt-5">

          {/* ─── WRITINGS TAB ────────────────────────────────────────────── */}
          {activeTab === 'writings' && (
            <>
              {reversedStories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-4">
                    <i className="ri-quill-pen-line text-2xl text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-[15px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    {isSelf ? 'Start writing your first story' : 'No stories yet'}
                  </p>
                  <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                    {isSelf
                      ? 'Your thoughts and stories will appear here once you publish them.'
                      : `@${profile.username} hasn't published any stories yet. Check back later.`}
                  </p>
                  {isSelf && (
                    <Link
                      to="/write"
                      className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all active:scale-95"
                    >
                      <i className="ri-add-line" />
                      Write a Story
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {reversedStories.map((story) => (
                    <StoryItem
                      key={story._id}
                      story={story}
                      profile={profile}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── ABOUT TAB ───────────────────────────────────────────────── */}
          {activeTab === 'about' && (
            <div className="space-y-5 pb-6">

              {/* Bio Section */}
              <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  About
                </h3>
                <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {profile.bio || 'No bio added yet.'}
                </p>
              </div>

              {/* Details */}
              <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                  Details
                </h3>
                <div className="space-y-3.5">
                  <DetailRow icon="ri-calendar-line" label="Joined" value={formatJoinDate(profile.createdAt)} />
                  <DetailRow icon="ri-quill-pen-line" label="Stories" value={`${stories.length} published`} />
                  <DetailRow icon="ri-eye-line" label="Total Views" value={formatNumber(totalViews)} />
                  <DetailRow icon="ri-heart-3-line" label="Total Likes" value={formatNumber(totalLikes)} />
                </div>
              </div>

              {/* Network */}
              <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                  Network
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openFollowsModal('followers')}
                    className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors active:scale-[0.98]"
                  >
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatNumber(profile.followersCount)}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      Followers
                    </p>
                  </button>
                  <button
                    onClick={() => openFollowsModal('following')}
                    className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors active:scale-[0.98]"
                  >
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatNumber(profile.followingCount)}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      Following
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* ── View Banner ── */}
      {bannerViewOpen && profile.banner?.url && (
        <ImageViewModal onClose={() => setBannerViewOpen(false)}>
          <img
            src={profile.banner.url}
            alt="Banner"
            className="w-full max-h-[80vh] object-contain rounded-xl sm:rounded-2xl"
          />
        </ImageViewModal>
      )}

      {/* ── View Profile Image ── */}
      {profileViewOpen && profile.image?.url && (
        <ImageViewModal onClose={() => setProfileViewOpen(false)}>
          <img
            src={profile.image.url}
            alt={profile.username}
            className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-3xl shadow-2xl"
          />
        </ImageViewModal>
      )}

      {/* ── Edit Profile Image ── */}
      {profileEditOpen && (
        <EditImageModal
          title="Update Photo"
          onClose={closeProfileEdit}
          className="profile-edit-modal"
        >
          <div className="p-5">
            <div
              className="mx-auto w-56 h-56 sm:w-64 sm:h-64 overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700"
              style={{ borderRadius: '50%' }}
            >
              <img
                ref={profilePreviewRef}
                src={profile.image?.url || avatarUrl(profile.username)}
                className="block max-w-full"
                alt="Preview"
              />
            </div>

            {/* Filters */}
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Filters
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                {PROFILE_FILTERS.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => handleProfileFilterClick(f.value)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
                      profileFilter === f.value
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <input
                ref={profileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleProfileFileChange}
              />
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors active:scale-95"
                >
                  <i className="ri-image-add-line text-sm" />
                  Choose
                </button>
                <button
                  type="submit"
                  disabled={profileUploading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {profileUploading && (
                    <i className="ri-loader-4-line animate-spin text-sm" />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </EditImageModal>
      )}

      {/* ── Edit Banner ── */}
      {bannerEditOpen && (
        <EditImageModal
          title="Update Cover"
          onClose={closeBannerEdit}
          maxW="max-w-xl"
          headerExtra={
            profile.banner?.url ? (
              <button
                onClick={handleDeleteBanner}
                className="text-red-500 hover:text-red-600 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Remove
              </button>
            ) : null
          }
        >
          <div className="p-5">
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <img
                ref={bannerPreviewRef}
                src={
                  profile.banner?.url ||
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2VsZWN0IGFuIGltYWdlPC90ZXh0Pjwvc3ZnPg=='
                }
                className="max-h-full max-w-full block"
                alt="Banner preview"
              />
            </div>

            {bannerSelected && (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                  Filters
                </p>
                <div className="flex gap-1.5">
                  {BANNER_FILTERS.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => handleBannerFilterClick(f.value)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
                        bannerFilter === f.value
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleBannerSubmit}>
              <input
                ref={bannerInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleBannerFileChange}
              />
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors active:scale-95"
                >
                  <i className="ri-image-add-line text-sm" />
                  Choose
                </button>
                <button
                  type="submit"
                  disabled={bannerUploading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {bannerUploading && (
                    <i className="ri-loader-4-line animate-spin text-sm" />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </EditImageModal>
      )}

      {/* ── Followers / Following Modal ── */}
      {modalType && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && setModalType(null)
          }
        >
          <div className="bg-white dark:bg-[#141414] w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl max-h-[75vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800/60 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex-shrink-0">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white capitalize">
                  {modalType}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {modalUsers.length}{' '}
                  {modalUsers.length === 1 ? 'person' : 'people'}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Drag indicator — mobile */}
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mt-2 sm:hidden flex-shrink-0" />

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5 overscroll-contain">
              {modalLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-700 border-t-slate-500 dark:border-t-slate-400 rounded-full animate-spin" />
                </div>
              ) : modalUsers.length === 0 ? (
                <div className="py-14 text-center">
                  <i className="ri-user-line text-3xl text-slate-200 dark:text-slate-700 block mb-3" />
                  <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                    No one here yet
                  </p>
                </div>
              ) : (
                modalUsers.map((u) => (
                  <Link
                    key={u._id}
                    to={`/profile/${u.username}`}
                    onClick={() => setModalType(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <img
                      src={u.image?.url || avatarUrl(u.username)}
                      alt={u.username}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-100 dark:border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        @{u.username}
                      </p>
                    </div>
                    <i className="ri-arrow-right-s-line text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors text-lg" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SUB-COMPONENTS                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

// ── Story Item ──
const StoryItem: React.FC<{ story: Story; profile: Profile }> = ({
  story,
  profile,
}) => (
  <Link
    to={`/stories/${story._id}`}
    className="group block bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden hover:shadow-md hover:shadow-slate-100/80 dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.995]"
  >
    <div className="flex flex-col sm:flex-row">
      {/* Image */}
      {story.image?.url && (
        <div className="sm:w-40 sm:h-32 w-full h-44 overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
          <img
            src={story.image.url}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          {/* Category + Time */}
          <div className="flex items-center gap-2 mb-2">
            {story.category && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                {story.category}
              </span>
            )}
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {timeAgo(story.timeStamp)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[14px] sm:text-[15px] font-bold leading-snug line-clamp-2 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {story.title}
          </h3>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <i className="ri-eye-line text-xs" />
            {formatNumber(story.views?.length || 0)}
          </span>
          <span className="flex items-center gap-1">
            <i className="ri-heart-3-line text-xs" />
            {formatNumber(story.likedBy?.length || 0)}
          </span>
        </div>
      </div>
    </div>
  </Link>
);

// ── Detail Row ──
const DetailRow: React.FC<{
  icon: string;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center flex-shrink-0">
      <i className={`${icon} text-sm text-slate-400 dark:text-slate-500`} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        {label}
      </p>
      <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 truncate">
        {value}
      </p>
    </div>
  </div>
);

// ── Image View Modal ──
const ImageViewModal: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
}> = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-11 right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <i className="ri-close-line text-lg" />
      </button>
      {children}
    </div>
  </div>
);

// ── Edit Image Modal ──
const EditImageModal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxW?: string;
  headerExtra?: React.ReactNode;
  className?: string;
}> = ({ title, onClose, children, maxW = 'max-w-md', headerExtra, className = '' }) => (
  <div
    className={`fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className={`bg-white dark:bg-[#141414] w-full ${maxW} sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800/60`}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {headerExtra}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>
      </div>
      {/* Drag indicator — mobile */}
      <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mt-2 sm:hidden" />
      {children}
    </div>
  </div>
);

export default Dashboard;