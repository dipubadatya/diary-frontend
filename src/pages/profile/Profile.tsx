
// src/pages/Profile.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import {
  ArrowLeft, Settings, MessageCircle, Camera, X, Check,
  Eye, Heart, Calendar, BookOpen, Users,
  Loader2, Plus, Feather, ChevronRight, AlertCircle,
  CheckCircle2, Image as ImageIcon, Trash2, Grid3X3,
  List,
} from 'lucide-react';

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
];

const BANNER_FILTERS = [
  { name: 'Original', value: 'none' },
  { name: 'Classic', value: 'contrast(130%)' },
  { name: 'Film', value: 'grayscale(100%)' },
  { name: 'Warm', value: 'sepia(50%)' },
  { name: 'Vivid', value: 'contrast(140%) saturate(130%)' },
];

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_PROFILE_IMAGE_MB = 5;
const MAX_BANNER_IMAGE_MB = 5;
const MAX_PROFILE_BYTES = MAX_PROFILE_IMAGE_MB * 1024 * 1024;
const MAX_BANNER_BYTES = MAX_BANNER_IMAGE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const timeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

const formatJoinDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch { return ''; }
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

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=475569&bold=true&size=200`;

// ─── File Validation ──────────────────────────────────────────────────────────
const validateImageFile = (
  file: File,
  maxBytes: number,
  allowGif = false
): string | null => {
  const allowed = allowGif
    ? ACCEPTED_IMAGE_TYPES
    : ACCEPTED_IMAGE_TYPES.filter(t => t !== 'image/gif');

  if (!allowed.includes(file.type)) {
    return allowGif
      ? 'Invalid file type. Please choose a JPG, PNG, WEBP, or GIF image.'
      : 'Invalid file type. Please choose a JPG, PNG, or WEBP image.';
  }

  if (file.size > maxBytes) {
    const actual = formatBytes(file.size);
    const limit = formatBytes(maxBytes);
    return `File is too large (${actual}). Maximum allowed size is ${limit}.`;
  }

  return null;
};

// ─── Alert ───────────────────────────────────────────────────────────────────
type AlertState = { type: 'success' | 'error' | 'info'; message: string } | null;

const InlineAlert: React.FC<{ alert: AlertState; onDismiss: () => void }> = ({ alert, onDismiss }) => {
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const cfg = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
      text: 'text-emerald-800',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
      text: 'text-red-700',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />,
      text: 'text-blue-700',
    },
  }[alert.type];

  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${cfg.bg} mb-3 animate-fadeIn`}>
      {cfg.icon}
      <p className={`text-[13px] font-medium flex-1 ${cfg.text}`}>{alert.message}</p>
      <button onClick={onDismiss} className="opacity-40 hover:opacity-70 transition-opacity ml-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Inline Field Error ───────────────────────────────────────────────────────
const FieldError: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-[12.5px] text-red-600 font-medium leading-relaxed">{message}</p>
    </div>
  );
};

// ─── Size hint shown before upload ────────────────────────────────────────────
const SizeHint: React.FC<{ mb: number }> = ({ mb }) => (
  <p className="text-[10.5px] text-gray-400 text-center">
    Max file size: <span className="font-semibold">{mb}MB</span> · JPG, PNG, WEBP
  </p>
);

const BannerSizeHint: React.FC<{ mb: number }> = ({ mb }) => (
  <p className="text-[10.5px] text-gray-400 text-center">
    Max file size: <span className="font-semibold">{mb}MB</span> · JPG, PNG, WEBP, GIF
  </p>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, login } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'writings' | 'about'>('writings');
  const [storiesView, setStoriesView] = useState<'grid' | 'list'>('grid');

  const [alert, setAlert] = useState<AlertState>(null);
  const showAlert = useCallback((type: 'success' | 'error' | 'info', message: string) =>
    setAlert({ type, message }), []);

  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<FollowUser[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [bannerViewOpen, setBannerViewOpen] = useState(false);
  const [profileViewOpen, setProfileViewOpen] = useState(false);

  // ── Profile Image Edit ──
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileFilter, setProfileFilter] = useState('none');
  const [profileEditError, setProfileEditError] = useState<string | null>(null);
  const [profileHasImage, setProfileHasImage] = useState(false);
  const [profileFileInfo, setProfileFileInfo] = useState<{ name: string; size: string } | null>(null);
  const profilePreviewRef = useRef<HTMLImageElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const profileCropperRef = useRef<Cropper | null>(null);

  // ── Banner Edit ──
  const [bannerEditOpen, setBannerEditOpen] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerFilter, setBannerFilter] = useState('none');
  const [bannerSelected, setBannerSelected] = useState(false);
  const [bannerEditError, setBannerEditError] = useState<string | null>(null);
  const [bannerIsGif, setBannerIsGif] = useState(false);
  const [bannerGifFile, setBannerGifFile] = useState<File | null>(null);
  const [bannerGifPreviewUrl, setBannerGifPreviewUrl] = useState<string | null>(null);
  const [bannerFileInfo, setBannerFileInfo] = useState<{ name: string; size: string } | null>(null);
  const bannerPreviewRef = useRef<HTMLImageElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bannerCropperRef = useRef<Cropper | null>(null);

  const isSelf = !!currentUser && !!profile && profile._id === currentUser._id;
  const reversedStories = useMemo(() => [...stories].reverse(), [stories]);
  const totalViews = useMemo(() => stories.reduce((a, s) => a + (s.views?.length || 0), 0), [stories]);
  const totalLikes = useMemo(() => stories.reduce((a, s) => a + (s.likedBy?.length || 0), 0), [stories]);

  // ── Fetch ──
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
      } else {
        setPageError('This profile could not be loaded.');
      }
    } catch (err: any) {
      const msg = err.response?.status === 404
        ? 'This user does not exist.'
        : err.response?.data?.error || 'Something went wrong loading this profile.';
      setPageError(msg);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProfile]);

  // ── Follow ──
  const handleFollowToggle = async () => {
    if (!profile || !currentUser) return;
    setFollowLoading(true);
    const prevFollowing = isFollowing;
    const prevCount = profile.followersCount;
    setIsFollowing(!prevFollowing);
    setProfile(p => p ? {
      ...p,
      followersCount: prevFollowing ? p.followersCount - 1 : p.followersCount + 1,
    } : null);
    try {
      const res = await api.post(`/users/follow/${profile._id}`);
      if (res.data.success) {
        setIsFollowing(res.data.isFollowing);
        setProfile(p => p ? { ...p, followersCount: res.data.followersCount } : null);
        showAlert('success', res.data.isFollowing
          ? `You're now following @${profile.username}`
          : `Unfollowed @${profile.username}`);
      } else throw new Error();
    } catch {
      setIsFollowing(prevFollowing);
      setProfile(p => p ? { ...p, followersCount: prevCount } : null);
      showAlert('error', 'Could not update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Followers / Following Modal ──
  const openFollowsModal = async (type: 'followers' | 'following') => {
    if (!profile) return;
    setModalType(type);
    setModalUsers([]);
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

  // ── Profile Image Cropper ──
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
    setProfileFilter('none');
    setProfileEditError(null);
    setProfileHasImage(false);
    setProfileFileInfo(null);
    if (profileInputRef.current) profileInputRef.current.value = '';
  }, []);

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected after error
    if (profileInputRef.current) profileInputRef.current.value = '';

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
      setProfileFilter('none');
      profileCropperRef.current?.destroy();
      profileCropperRef.current = null;
      setTimeout(initProfileCropper, 150);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileFilterClick = (val: string) => {
    setProfileFilter(val);
    const viewBox = document.querySelector('.profile-edit-modal .cropper-view-box img') as HTMLElement | null;
    const canvas = document.querySelector('.profile-edit-modal .cropper-canvas img') as HTMLElement | null;
    [viewBox, canvas].forEach(el => {
      if (el) el.style.filter = val === 'none' ? '' : val;
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileEditError(null);
    if (!profileCropperRef.current) {
      setProfileEditError('Please select and position an image first.');
      return;
    }
    setProfileUploading(true);
    try {
      const canvas = profileCropperRef.current.getCroppedCanvas({ width: 400, height: 400 });
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const ctx = tmp.getContext('2d')!;
      if (profileFilter !== 'none') ctx.filter = profileFilter;
      ctx.drawImage(canvas, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        tmp.toBlob(b => b ? resolve(b) : reject(new Error('Canvas error')), 'image/jpeg', 0.88)
      );

      // Guard: cropped output should never realistically exceed 5 MB
      // but we check anyway for safety
      if (blob.size > MAX_PROFILE_BYTES) {
        setProfileEditError(
          `Processed image is ${formatBytes(blob.size)}, which exceeds the ${MAX_PROFILE_IMAGE_MB}MB limit. ` +
          `Try a smaller source image.`
        );
        setProfileUploading(false);
        return;
      }

      const fd = new FormData();
      fd.append('image', blob, 'profile.jpg');
      const res = await api.put('/users/profile/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        const url = res.data.imageUrl || res.data.image?.url;
        setProfile(p => p ? { ...p, image: { url, filename: 'profile_image' } } : null);
        if (currentUser) login({ ...currentUser, image: { url, filename: 'profile_image' } });
        closeProfileEdit();
        showAlert('success', 'Profile picture updated successfully!');
      } else {
        setProfileEditError('Upload failed. Please try again.');
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.error;
      // Surface a friendly message if server also enforces size
      if (err.response?.status === 413 || serverMsg?.toLowerCase().includes('size') || serverMsg?.toLowerCase().includes('large')) {
        setProfileEditError(`File too large. Please use an image under ${MAX_PROFILE_IMAGE_MB}MB.`);
      } else {
        setProfileEditError(serverMsg || 'Upload failed. Check your connection and try again.');
      }
    } finally {
      setProfileUploading(false);
    }
  };

  // ── Banner Edit ──
  const openBannerEdit = () => {
    setBannerFilter('none');
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
    setBannerFilter('none');
    setBannerSelected(false);
    setBannerEditError(null);
    setBannerIsGif(false);
    setBannerGifFile(null);
    setBannerFileInfo(null);
    setBannerGifPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  }, []);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset so same file can be re-selected after an error
    if (bannerInputRef.current) bannerInputRef.current.value = '';

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

    const isGif = file.type === 'image/gif';
    setBannerIsGif(isGif);

    if (isGif) {
      bannerCropperRef.current?.destroy();
      bannerCropperRef.current = null;
      setBannerGifFile(file);
      setBannerFilter('none');
      setBannerGifPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      return;
    }

    setBannerGifFile(null);
    setBannerGifPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

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
    const viewBox = document.querySelector('.banner-edit-modal .cropper-view-box img') as HTMLElement | null;
    if (viewBox) viewBox.style.filter = val === 'none' ? '' : val;
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerEditError(null);

    if (bannerIsGif) {
      if (!bannerGifFile) {
        setBannerEditError('Please select a GIF file first.');
        return;
      }
      setBannerUploading(true);
      try {
        const fd = new FormData();
        fd.append('image', bannerGifFile, 'banner.gif');
        const res = await api.put('/users/profile/banner', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          const url = res.data.bannerUrl || res.data.banner?.url;
          setProfile(p => p ? { ...p, banner: { url, filename: 'banner_image' } } : null);
          if (currentUser) login({ ...currentUser, banner: { url, filename: 'banner_image' } });
          closeBannerEdit();
          showAlert('success', 'Cover photo updated!');
        } else {
          setBannerEditError('Upload failed. Please try again.');
        }
      } catch (err: any) {
        const serverMsg = err.response?.data?.error;
        if (err.response?.status === 413 || serverMsg?.toLowerCase().includes('size') || serverMsg?.toLowerCase().includes('large')) {
          setBannerEditError(`File too large. Please use an image under ${MAX_BANNER_IMAGE_MB}MB.`);
        } else {
          setBannerEditError(serverMsg || 'Upload failed. Check your connection and try again.');
        }
      } finally {
        setBannerUploading(false);
      }
      return;
    }

    if (!bannerCropperRef.current) {
      setBannerEditError('Please select a banner image first.');
      return;
    }
    setBannerUploading(true);
    try {
      const canvas = bannerCropperRef.current.getCroppedCanvas({ width: 1200, height: 375 });
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const ctx = tmp.getContext('2d')!;
      if (bannerFilter !== 'none') ctx.filter = bannerFilter;
      ctx.drawImage(canvas, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        tmp.toBlob(b => b ? resolve(b) : reject(new Error('Canvas error')), 'image/jpeg', 0.88)
      );

      if (blob.size > MAX_BANNER_BYTES) {
        setBannerEditError(
          `Processed image is ${formatBytes(blob.size)}, which exceeds the ${MAX_BANNER_IMAGE_MB}MB limit. ` +
          `Try a smaller source image.`
        );
        setBannerUploading(false);
        return;
      }

      const fd = new FormData();
      fd.append('image', blob, 'banner.jpg');
      const res = await api.put('/users/profile/banner', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        const url = res.data.bannerUrl || res.data.banner?.url;
        setProfile(p => p ? { ...p, banner: { url, filename: 'banner_image' } } : null);
        if (currentUser) login({ ...currentUser, banner: { url, filename: 'banner_image' } });
        closeBannerEdit();
        showAlert('success', 'Cover photo updated!');
      } else {
        setBannerEditError('Upload failed. Please try again.');
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.error;
      if (err.response?.status === 413 || serverMsg?.toLowerCase().includes('size') || serverMsg?.toLowerCase().includes('large')) {
        setBannerEditError(`File too large. Please use an image under ${MAX_BANNER_IMAGE_MB}MB.`);
      } else {
        setBannerEditError(serverMsg || 'Upload failed. Check your connection and try again.');
      }
    } finally {
      setBannerUploading(false);
    }
  };

  const handleDeleteBanner = async () => {
    setBannerEditError(null);
    try {
      await api.delete('/users/profile/banner');
      setProfile(p => p ? { ...p, banner: undefined } : null);
      closeBannerEdit();
      showAlert('success', 'Cover photo removed.');
    } catch (err: any) {
      setBannerEditError(err.response?.data?.error || 'Failed to remove cover photo. Try again.');
    }
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-gray-500 font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-8 text-[13px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" strokeWidth={1.8} />
            </div>
            <h2 className="text-[17px] font-bold mb-2 text-gray-900">Profile not found</h2>
            <p className="text-[13px] text-gray-500 mb-6 leading-relaxed max-w-xs mx-auto">{pageError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Go back
              </button>
              <button
                onClick={fetchProfile}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top nav */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            </button>
            <div>
              <p className="text-[14px] font-bold text-gray-900 leading-tight truncate max-w-[160px] sm:max-w-xs">
                {profile.name}
              </p>
              <p className="text-[11px] text-gray-400">@{profile.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isSelf && (
              <Link
                to="/settings"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" strokeWidth={1.8} />
              </Link>
            )}
            {!isSelf && currentUser && (
              <button
                onClick={() => navigate(`/chat?user=${profile._id}`)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Message"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global alert */}
      {alert && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
        </div>
      )}

      <main className="max-w-2xl mx-auto pb-20">

        {/* Banner */}
        <div className="relative w-full overflow-hidden bg-gray-200" style={{ aspectRatio: '16/5' }}>
          {profile.banner?.url ? (
            <img
              src={profile.banner.url}
              alt="Cover"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setBannerViewOpen(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
          )}
          {isSelf && (
            <button
              onClick={openBannerEdit}
              className="absolute bottom-2.5 right-3 flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
            >
              <Camera className="w-3 h-3" strokeWidth={2.5} />
              Edit cover
            </button>
          )}
        </div>

        {/* Profile Header */}
        <div className="px-4 sm:px-5 bg-white border-b border-gray-100 pb-5">

          {/* Avatar + Actions */}
          <div className="flex items-start justify-between mt-3 mb-4">
            <div className="relative -mt-12 sm:-mt-14">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-4 ring-white overflow-hidden shadow-md bg-gray-100 cursor-pointer flex-shrink-0"
                onClick={() => profile.image?.url && setProfileViewOpen(true)}
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
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-md border-2 border-white active:scale-90 transition-all"
                  title="Change photo"
                >
                  <Camera className="w-3 h-3" strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              {!isSelf && currentUser ? (
                <>
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97] disabled:opacity-60 ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {followLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isFollowing ? 'Following'
                      : followsMe ? 'Follow back'
                      : 'Follow'}
                  </button>
                  <button
                    onClick={() => navigate(`/chat?user=${profile._id}`)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors active:scale-95 border border-gray-200"
                    title="Message"
                  >
                    <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </>
              ) : isSelf ? (
                <>
                  <Link
                    to="/settings"
                    className="px-3 py-2 rounded-xl text-[13px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 flex items-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span className="hidden sm:inline">Edit profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Link>
                  <Link
                    to="/write"
                    className="px-3 py-2 rounded-xl text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                  >
                    <Feather className="w-3.5 h-3.5" strokeWidth={2} />
                    Write
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          {/* Name & bio */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-[18px] sm:text-[20px] font-bold text-gray-900">{profile.name}</h1>
              {followsMe && !isSelf && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                  Follows you
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-gray-400 mb-3">@{profile.username}</p>
            {profile.bio && (
              <p className="text-[13.5px] text-gray-600 leading-relaxed whitespace-pre-wrap max-w-lg">
                {profile.bio}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
                <Calendar className="w-3.5 h-3.5" strokeWidth={1.8} />
                Joined {formatJoinDate(profile.createdAt)}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => openFollowsModal('followers')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <span className="text-[15px] font-bold text-gray-900">{formatNumber(profile.followersCount)}</span>
              <span className="text-[12px] text-gray-400 group-hover:text-gray-600 transition-colors">
                {profile.followersCount === 1 ? 'Follower' : 'Followers'}
              </span>
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button
              onClick={() => openFollowsModal('following')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <span className="text-[15px] font-bold text-gray-900">{formatNumber(profile.followingCount)}</span>
              <span className="text-[12px] text-gray-400 group-hover:text-gray-600 transition-colors">Following</span>
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="text-[15px] font-bold text-gray-900">{profile.storiesCount || stories.length}</span>
              <span className="text-[12px] text-gray-400">
                {(profile.storiesCount || stories.length) === 1 ? 'Story' : 'Stories'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky z-40 bg-white border-b border-gray-100" style={{ top: '56px' }}>
          <div className="max-w-2xl mx-auto flex">
            {(['writings', 'about'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-semibold capitalize transition-colors relative ${
                  activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'writings' ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
                    Writings
                    {stories.length > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === 'writings' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {stories.length}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" strokeWidth={2} />
                    About
                  </>
                )}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-900 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-5 pt-4">

          {activeTab === 'writings' && (
            <div className="animate-fadeIn">
              {reversedStories.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center mt-2">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Feather className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">
                    {isSelf ? 'Write your first story' : 'No stories yet'}
                  </h3>
                  <p className="text-[12.5px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                    {isSelf
                      ? 'Your published stories will appear here.'
                      : `@${profile.username} hasn't published any stories yet.`}
                  </p>
                  {isSelf && (
                    <Link
                      to="/write"
                      className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                      Write a story
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] text-gray-400 font-medium">
                      {reversedStories.length} {reversedStories.length === 1 ? 'story' : 'stories'}
                    </p>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setStoriesView('grid')}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                          storiesView === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setStoriesView('list')}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                          storiesView === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        aria-label="List view"
                      >
                        <List className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {storiesView === 'grid' ? (
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      {reversedStories.map(story => (
                        <GridStoryCard key={story._id} story={story} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {reversedStories.map(story => (
                        <ListStoryCard key={story._id} story={story} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="animate-fadeIn space-y-3 pb-6 mt-1">
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</p>
                <div className="grid grid-cols-2 gap-3">
                  <StatBlock
                    icon={<Eye className="w-4 h-4 text-gray-400" strokeWidth={1.8} />}
                    label="Total reads"
                    value={formatNumber(totalViews)}
                  />
                  <StatBlock
                    icon={<Heart className="w-4 h-4 text-gray-400" strokeWidth={1.8} />}
                    label="Total likes"
                    value={formatNumber(totalLikes)}
                  />
                  <StatBlock
                    icon={<BookOpen className="w-4 h-4 text-gray-400" strokeWidth={1.8} />}
                    label="Published"
                    value={`${profile.storiesCount || stories.length} stories`}
                  />
                  <StatBlock
                    icon={<Users className="w-4 h-4 text-gray-400" strokeWidth={1.8} />}
                    label="Followers"
                    value={formatNumber(profile.followersCount)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Details</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.8} />
                    <div>
                      <p className="text-[11px] text-gray-400">Member since</p>
                      <p className="text-[13px] font-semibold text-gray-800">{formatJoinDate(profile.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {isSelf && (
                <Link
                  to="/write"
                  className="flex items-center justify-between bg-gray-900 text-white rounded-2xl p-4 hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <Feather className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">Start writing</p>
                      <p className="text-[11px] text-gray-400">Share your story with the world</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── View Banner ── */}
      {bannerViewOpen && profile.banner?.url && (
        <LightboxModal onClose={() => setBannerViewOpen(false)}>
          <img src={profile.banner.url} alt="Banner" className="w-full max-h-[80vh] object-contain rounded-xl" />
        </LightboxModal>
      )}

      {/* ── View Profile Image ── */}
      {profileViewOpen && profile.image?.url && (
        <LightboxModal onClose={() => setProfileViewOpen(false)}>
          <img
            src={profile.image.url}
            alt={profile.name}
            className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-2xl shadow-2xl"
          />
        </LightboxModal>
      )}

      {/* ── Edit Profile Image ── */}
      {profileEditOpen && (
        <BottomSheetModal
          title="Update profile photo"
          onClose={closeProfileEdit}
          className="profile-edit-modal"
        >
          <div className="p-5 space-y-4">
            {/* Circular crop area */}
            <div
              className="relative mx-auto overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200"
              style={{ width: 200, height: 200, borderRadius: '50%' }}
            >
              <img
                ref={profilePreviewRef}
                src={profile.image?.url || avatarUrl(profile.name)}
                alt="Preview"
                className="block max-w-full"
              />
              {!profileHasImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-full pointer-events-none">
                  <ImageIcon className="w-7 h-7 text-white/80 mb-1" strokeWidth={1.5} />
                  <span className="text-[11px] text-white/80 font-medium">Choose photo</span>
                </div>
              )}
            </div>

            {/* File info badge */}
            {profileFileInfo && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full truncate max-w-[220px]">
                  {profileFileInfo.name} · {profileFileInfo.size}
                </span>
              </div>
            )}

            {/* Filters */}
            {profileHasImage && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Filters</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {PROFILE_FILTERS.map(f => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => handleProfileFilterClick(f.value)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all whitespace-nowrap border ${
                        profileFilter === f.value
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size hint */}
            <SizeHint mb={MAX_PROFILE_IMAGE_MB} />

            {/* Error */}
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[13px] font-semibold text-gray-600 transition-colors border border-gray-200"
                >
                  <ImageIcon className="w-4 h-4" strokeWidth={2} />
                  {profileHasImage ? 'Change photo' : 'Choose photo'}
                </button>
                <button
                  type="submit"
                  disabled={profileUploading || !profileHasImage}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileUploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Check className="w-4 h-4" strokeWidth={2.5} /> Save photo</>}
                </button>
              </div>
            </form>
          </div>
        </BottomSheetModal>
      )}

      {/* ── Edit Banner ── */}
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
            {/* Crop area */}
            <div
              className="relative w-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 rounded-xl"
              style={{ aspectRatio: '16/5' }}
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
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+'
                  }
                  alt="Banner preview"
                  className="block max-w-full max-h-full w-full"
                />
              )}
              {!bannerSelected && !profile.banner?.url && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <ImageIcon className="w-7 h-7 text-gray-300 mb-1.5" strokeWidth={1.5} />
                  <p className="text-[12px] text-gray-400 font-medium">Choose a cover photo</p>
                  <p className="text-[10.5px] text-gray-300 mt-0.5">Recommended: 1200 × 375px · GIF supported</p>
                </div>
              )}
            </div>

            {/* File info badge */}
            {bannerFileInfo && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full truncate max-w-[260px]">
                  {bannerFileInfo.name} · {bannerFileInfo.size}
                </span>
              </div>
            )}

            {/* GIF notice */}
            {bannerIsGif && bannerSelected && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
                <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-black text-white leading-none">GIF</span>
                </div>
                <p className="text-[12px] text-blue-700 font-medium">
                  Animated GIF — saved as-is to keep the animation.
                </p>
              </div>
            )}

            {/* Filters (static images only) */}
            {!bannerIsGif && bannerSelected && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Filters</p>
                <div className="flex gap-1.5 flex-wrap">
                  {BANNER_FILTERS.map(f => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => handleBannerFilterClick(f.value)}
                      className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all border ${
                        bannerFilter === f.value
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size hint */}
            <BannerSizeHint mb={MAX_BANNER_IMAGE_MB} />

            {/* Error */}
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[13px] font-semibold text-gray-600 transition-colors border border-gray-200"
                >
                  <ImageIcon className="w-4 h-4" strokeWidth={2} />
                  {bannerSelected ? 'Change image' : 'Choose image'}
                </button>
                <button
                  type="submit"
                  disabled={bannerUploading || !bannerSelected}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bannerUploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Check className="w-4 h-4" strokeWidth={2.5} /> Save cover</>}
                </button>
              </div>
            </form>
          </div>
        </BottomSheetModal>
      )}

      {/* ── Followers / Following Modal ── */}
      {modalType && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setModalType(null)}
        >
          <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl max-h-[75vh] flex flex-col shadow-xl border border-gray-100 animate-slideUp">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 capitalize">{modalType}</h3>
                {!modalLoading && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {modalUsers.length} {modalUsers.length === 1 ? 'person' : 'people'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {modalLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin" />
                </div>
              ) : modalError ? (
                <div className="p-5">
                  <FieldError message={modalError} />
                  <button
                    onClick={() => openFollowsModal(modalType!)}
                    className="w-full mt-3 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              ) : modalUsers.length === 0 ? (
                <div className="py-14 text-center px-5">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-5 h-5 text-gray-300" strokeWidth={1.8} />
                  </div>
                  <p className="text-[14px] font-bold text-gray-800">No one here yet</p>
                  <p className="text-[12px] text-gray-400 mt-1">
                    {modalType === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-0.5">
                  {modalUsers.map(u => (
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
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{u.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">@{u.username}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0" strokeWidth={2} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
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
      `}</style>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const GridStoryCard: React.FC<{ story: Story }> = ({ story }) => (
  <Link
    to={`/stories/${story._id}`}
    className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 active:scale-[0.98]"
  >
    <div className="relative w-full bg-gray-100 overflow-hidden" style={{ aspectRatio: '4/3' }}>
      {story.image?.url ? (
        <img
          src={story.image.url}
          alt={story.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <Feather className="w-7 h-7 text-gray-200" strokeWidth={1.5} />
        </div>
      )}
      {story.category && (
        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-gray-600 backdrop-blur-sm">
          {story.category}
        </span>
      )}
    </div>
    <div className="p-3">
      <h3 className="text-[12.5px] font-bold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-gray-600 transition-colors">
        {story.title}
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">{timeAgo(story.timeStamp)}</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <Eye className="w-3 h-3" strokeWidth={1.8} />
            {formatNumber(story.views?.length || 0)}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <Heart className="w-3 h-3" strokeWidth={1.8} />
            {formatNumber(story.likedBy?.length || 0)}
          </span>
        </div>
      </div>
    </div>
  </Link>
);

const ListStoryCard: React.FC<{ story: Story }> = ({ story }) => (
  <Link
    to={`/stories/${story._id}`}
    className="group flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-sm transition-all duration-200 active:scale-[0.99]"
  >
    <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
      {story.image?.url ? (
        <img
          src={story.image.url}
          alt={story.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Feather className="w-5 h-5 text-gray-200" strokeWidth={1.5} />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        {story.category && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{story.category}</span>
        )}
        <span className="text-[9px] text-gray-300">·</span>
        <span className="text-[10px] text-gray-400">{timeAgo(story.timeStamp)}</span>
      </div>
      <h3 className="text-[13px] font-bold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-gray-600 transition-colors">
        {story.title}
      </h3>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-[10.5px] text-gray-400">
          <Eye className="w-3 h-3" strokeWidth={1.8} />
          {formatNumber(story.views?.length || 0)}
        </span>
        <span className="flex items-center gap-1 text-[10.5px] text-gray-400">
          <Heart className="w-3 h-3" strokeWidth={1.8} />
          {formatNumber(story.likedBy?.length || 0)}
        </span>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0" strokeWidth={2} />
  </Link>
);

const StatBlock: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
    <div className="flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      <p className="text-[13px] font-bold text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

const LightboxModal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
    onClick={onClose}
  >
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-11 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
        style={{ background: 'rgba(255,255,255,0.15)' }}
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
}> = ({ title, onClose, children, maxW = 'max-w-md', headerExtra, className = '' }) => (
  <div
    className={`fixed inset-0 z-[110] flex items-end sm:items-center justify-center ${className}`}
    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    <div className={`bg-white w-full ${maxW} sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-xl border border-gray-100 animate-slideUp`}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          {headerExtra}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="w-8 h-1 rounded-full bg-gray-200 mx-auto mt-2 sm:hidden" />
      {children}
    </div>
  </div>
);

export default Profile;