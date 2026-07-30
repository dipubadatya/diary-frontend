
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';
import {
  ArrowLeft,
  Camera,
  Loader2,
  User,
  Lock,
  BookOpen,
  Shield,
  Trash2,
  LogOut,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  UploadCloud,
  AlertTriangle,
  BadgeCheck,
  Sparkles,
  ExternalLink,
  Feather,
  Search,
  X,
  Info,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface Story {
  _id: string;
  title: string;
  editedAt?: string;
  timeStamp: string;
}

type TabKey = 'details' | 'password' | 'stories' | 'danger';

export const AccountSettings: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('details');

  // ---------- Profile State ----------
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialProfile, setInitialProfile] = useState({ name: '', username: '', bio: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Validation state
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimeout = useRef<any>(null);

  // ---------- Stories State ----------
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storySearch, setStorySearch] = useState('');
  const [storySortBy, setStorySortBy] = useState<'recent' | 'title'>('recent');

  // ---------- Avatar ----------
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- Password ----------
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ---------- Delete ----------
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // ---------- Unsaved changes guard ----------
  const profileDirty =
    name !== initialProfile.name ||
    username !== initialProfile.username ||
    bio !== initialProfile.bio;

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (profileDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [profileDirty]);

  // ---------- Load initial data ----------
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setStoriesLoading(true);
      const res = await api.get(`/users/profile/${user.username}`);
      if (res.data.success) {
        const profile = res.data.profile;
        const loaded = {
          name: profile.name || '',
          username: profile.username || '',
          bio: profile.bio || '',
        };
        setName(loaded.name);
        setUsername(loaded.username);
        setBio(loaded.bio);
        setInitialProfile(loaded);
        setStories(res.data.stories || []);
      }
    } catch {
      toast.error('Could not load your profile.');
    } finally {
      setStoriesLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ---------- Username live validation ----------
  useEffect(() => {
    if (username === initialProfile.username) {
      setUsernameError('');
      setCheckingUsername(false);
      return;
    }
    if (!username.trim()) {
      setUsernameError('Username is required');
      return;
    }
    if (username.length < 3) {
      setUsernameError('Must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      setUsernameError('Only letters, numbers, dots and underscores');
      return;
    }
    // Debounced availability check
    setUsernameError('');
    setCheckingUsername(true);
    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/check-username/${username}`);
        if (res.data && res.data.taken) {
          setUsernameError('This username is already taken');
        }
      } catch {
        // silent — server may not have this endpoint
      } finally {
        setCheckingUsername(false);
      }
    }, 600);

    return () => {
      if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    };
  }, [username, initialProfile.username]);

  // ---------- Save profile ----------
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name.');
    if (!username.trim()) return toast.error('Please enter a username.');
    if (usernameError) return toast.error(usernameError);
    if (updatingProfile) return;

    setUpdatingProfile(true);
    try {
      const res = await api.put('/users/profile', { name: name.trim(), username: username.trim(), bio: bio.trim() });
      if (res.data.success) {
        toast.success('Your changes have been saved.');
        const updated = { name: name.trim(), username: username.trim(), bio: bio.trim() };
        setInitialProfile(updated);
        if (user) login({ ...user, ...updated });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    setName(initialProfile.name);
    setUsername(initialProfile.username);
    setBio(initialProfile.bio);
    setUsernameError('');
  };

  // ---------- Avatar upload ----------
  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return toast.error('Please choose an image file.');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be smaller than 5MB.');
    }

    const formData = new FormData();
    formData.append('image', file);
    setAvatarUploading(true);
    try {
      const res = await api.put('/users/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Profile photo updated.');
        if (user) {
          login({ ...user, image: { url: res.data.imageUrl, filename: 'avatar' } });
        }
      }
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadAvatar(file);
  };

  // ---------- Password strength ----------
  const passwordStrength = (() => {
    if (!newPassword) return null;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;

    const levels = [
      { label: 'Very weak', color: 'bg-rose-500', text: 'text-rose-500', width: 20 },
      { label: 'Weak', color: 'bg-orange-500', text: 'text-orange-500', width: 40 },
      { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500', width: 60 },
      { label: 'Good', color: 'bg-sky-500', text: 'text-sky-500', width: 80 },
      { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500', width: 100 },
    ];
    return levels[Math.min(score - 1, 4)] || levels[0];
  })();

  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword === newPassword &&
    !changingPassword;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPassword) return;

    setChangingPassword(true);
    try {
      const res = await api.post('/users/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        toast.success('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  // ---------- Stories ----------
  const handleDeleteStory = async (storyId: string, storyTitle: string) => {
    if (!window.confirm(`Delete "${storyTitle}"? This cannot be undone.`)) return;
    const backup = stories;
    setStories(prev => prev.filter(s => s._id !== storyId));
    try {
      const res = await api.delete(`/stories/${storyId}`);
      if (!res.data.success) throw new Error();
      toast.success('Story deleted.');
    } catch {
      toast.error('Failed to delete story.');
      setStories(backup);
    }
  };

  const filteredStories = stories
    .filter(s => s.title.toLowerCase().includes(storySearch.toLowerCase()))
    .sort((a, b) => {
      if (storySortBy === 'title') return a.title.localeCompare(b.title);
      const aTime = new Date(a.editedAt || a.timeStamp).getTime();
      const bTime = new Date(b.editedAt || b.timeStamp).getTime();
      return bTime - aTime;
    });

  // ---------- Delete account ----------
  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') return;

    setDeletingAccount(true);
    try {
      const res = await api.delete('/users/account');
      if (res.data.success) {
        toast.success('Your account has been deleted.');
        await logout();
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    if (profileDirty && !window.confirm('You have unsaved changes. Sign out anyway?')) return;
    await logout();
    navigate('/login');
  };

  const handleTabChange = (tab: TabKey) => {
    if (activeTab === 'details' && profileDirty) {
      if (!window.confirm('Discard unsaved changes?')) return;
      handleCancelProfile();
    }
    setActiveTab(tab);
  };

  const handleBack = () => {
    if (profileDirty && !window.confirm('You have unsaved changes. Leave anyway?')) return;
    navigate(-1);
  };

  if (!user) return null;

  const tabs: { key: TabKey; label: string; icon: any; badge?: number | string }[] = [
    { key: 'details', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'stories', label: 'Stories', icon: BookOpen, badge: stories.length },
    { key: 'danger', label: 'Account', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* ============ DELETE MODAL ============ */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => !deletingAccount && setDeleteModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-7">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-bold tracking-tight mb-1.5">Delete your account?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed mb-5">
                This will permanently erase your profile, {stories.length} {stories.length === 1 ? 'story' : 'stories'}, comments, and messages. There's no way to undo this.
              </p>

              <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Type{' '}
                    <span className="font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded text-[11px]">
                      DELETE MY ACCOUNT
                    </span>{' '}
                    to confirm
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type the phrase exactly"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13.5px] outline-none focus:border-rose-400 dark:focus:border-rose-600 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={deletingAccount}
                    className="py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold text-[13px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Keep account
                  </button>
                  <button
                    type="submit"
                    disabled={deletingAccount || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                    className="py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl font-semibold text-[13px] transition-colors flex items-center justify-center gap-2"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete forever
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============ STICKY TOP BAR ============ */}
      <div className="sticky top-0 z-40 bg-[#F5F6FA]/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBack}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 active:scale-95 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight leading-tight">
                Settings
              </h1>
              {profileDirty && (
                <p className="text-[10.5px] font-medium text-amber-600 dark:text-amber-500 leading-tight flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-500" />
                  Unsaved changes
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* ============ MAIN ============ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
          <div className="h-24 sm:h-28 bg-gradient-to-br from-orange-300 via-rose-300 to-fuchsia-300 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_60%)]" />
          </div>

          <div className="px-5 sm:px-7 pb-5 -mt-12">
            <div className="flex items-end gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 shadow-md">
                  {avatarUploading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    </div>
                  ) : (
                    <img
                      src={
                        user.image?.url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e0e7ff&color=4f46e5&bold=true&size=200`
                      }
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                  title="Change photo"
                >
                  <Camera className="w-3.5 h-3.5" strokeWidth={2.2} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="pb-2 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[17px] font-bold tracking-tight truncate">{user.name}</h2>
                  <BadgeCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="currentColor" strokeWidth={0} />
                </div>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 truncate">
                  @{user.username}
                </p>
              </div>

              <Link
                to={`/profile/${user.username}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors pb-2"
              >
                View profile
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Stats strip */}
            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Stat label="Stories" value={stories.length} />
              <Stat label="Followers" value={user.followersCount || 0} to={`/profile/${user.username}`} />
              <Stat label="Following" value={user.followingCount || 0} to={`/profile/${user.username}`} />
            </div>
          </div>
        </div>

        {/* ============ TABS ============ */}
        <div className="mt-6 flex gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" strokeWidth={2} />
                {tab.label}
                {tab.badge !== undefined && Number(tab.badge) > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-900/20'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============ TAB CONTENT ============ */}
        <div className="mt-6">
          {/* ---------- PROFILE ---------- */}
          {activeTab === 'details' && (
            <div className="space-y-6 animate-fadeIn">
              <Card>
                <CardHeader
                  title="Personal information"
                  description="This is how others will see you on the platform."
                />

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Full name"
                      value={name}
                      onChange={setName}
                      placeholder="Your name"
                      maxLength={50}
                    />
                    <Field
                      label="Username"
                      value={username}
                      onChange={(v) => setUsername(v.toLowerCase().trim())}
                      placeholder="username"
                      prefix="@"
                      maxLength={30}
                      error={usernameError}
                      loading={checkingUsername}
                      success={
                        !checkingUsername &&
                        !usernameError &&
                        username !== initialProfile.username &&
                        username.length >= 3
                          ? 'Available'
                          : undefined
                      }
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                        Bio
                      </label>
                      <span className={`text-[11px] font-medium ${bio.length > 140 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {bio.length}/160
                      </span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 160))}
                      placeholder="Tell readers a little about yourself..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13.5px] outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors resize-none"
                    />
                  </div>

                  {/* Save/Cancel action bar */}
                  <div
                    className={`flex justify-end gap-2 pt-2 transition-all duration-300 ${
                      profileDirty ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden pt-0'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleCancelProfile}
                      className="px-4 py-2.5 text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingProfile || !!usernameError || checkingUsername}
                      className="px-5 py-2.5 text-[13px] font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
                    >
                      {updatingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                          Save changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Card>

             
            </div>
          )}

          {/* ---------- PASSWORD ---------- */}
          {activeTab === 'password' && (
            <div className="animate-fadeIn">
              <Card>
                <CardHeader
                  title="Change password"
                  description="Use a strong, unique password you don't reuse anywhere else."
                />

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <Field
                    label="Current password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="Enter your current password"
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowCurrent(s => !s)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        tabIndex={-1}
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <div>
                    <Field
                      label="New password"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Minimum 8 characters"
                      endAdornment={
                        <button
                          type="button"
                          onClick={() => setShowNew(s => !s)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          tabIndex={-1}
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                    {passwordStrength && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-slate-500">Password strength</span>
                          <span className={`text-[11px] font-semibold ${passwordStrength.text}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.width}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Field
                    label="Confirm new password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Re-enter new password"
                    error={
                      confirmPassword && confirmPassword !== newPassword
                        ? 'Passwords do not match'
                        : undefined
                    }
                    success={
                      confirmPassword && confirmPassword === newPassword
                        ? 'Passwords match'
                        : undefined
                    }
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowConfirm(s => !s)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Tips */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 flex gap-2.5">
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                    <div className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      For a strong password, mix upper and lowercase letters, numbers, and symbols. Aim for at least 12 characters.
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!canSubmitPassword}
                      className="px-5 py-2.5 text-[13px] font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" strokeWidth={2.2} />
                          Update password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* ---------- STORIES ---------- */}
          {activeTab === 'stories' && (
            <div className="animate-fadeIn space-y-4">
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-[15px] font-bold">Your stories</h2>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {stories.length === 0
                        ? 'Nothing published yet.'
                        : `You have ${stories.length} ${stories.length === 1 ? 'story' : 'stories'}.`}
                    </p>
                  </div>
                  <Link
                    to="/write"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    New story
                  </Link>
                </div>

                {/* Search & sort */}
                {stories.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search your stories..."
                        value={storySearch}
                        onChange={(e) => setStorySearch(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 rounded-xl text-[13px] outline-none transition-colors"
                      />
                      {storySearch && (
                        <button
                          onClick={() => setStorySearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300"
                        >
                          <X className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    <select
                      value={storySortBy}
                      onChange={(e) => setStorySortBy(e.target.value as any)}
                      className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-[12.5px] font-medium outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <option value="recent">Recent</option>
                      <option value="title">A–Z</option>
                    </select>
                  </div>
                )}

                {storiesLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : stories.length === 0 ? (
                  <div className="text-center py-14">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-white dark:from-indigo-500/20 dark:to-slate-800 flex items-center justify-center mx-auto mb-4">
                      <Feather className="w-6 h-6 text-indigo-500" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[14px] font-bold">Your first story awaits</h3>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                      Share your thoughts, ideas, and experiences with readers.
                    </p>
                    <Link
                      to="/write"
                      className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Sparkles className="w-4 h-4" />
                      Start writing
                    </Link>
                  </div>
                ) : filteredStories.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-[13px] font-semibold text-slate-600">No matches found</p>
                    <p className="text-[12px] text-slate-400 mt-1">Try a different search term.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredStories.map(story => (
                      <div
                        key={story._id}
                        className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-500/20 dark:to-indigo-500/5 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-indigo-500" strokeWidth={2} />
                        </div>

                        <Link to={`/stories/${story._id}`} className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold truncate hover:text-indigo-600 transition-colors">
                            {story.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {moment(story.editedAt || story.timeStamp).fromNow()}
                          </p>
                        </Link>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Link
                            to={`/stories/${story._id}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" strokeWidth={1.8} />
                          </Link>
                          <Link
                            to={`/write?edit=${story._id}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" strokeWidth={1.8} />
                          </Link>
                          <button
                            onClick={() => handleDeleteStory(story._id, story.title)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ---------- DANGER / ACCOUNT ---------- */}
          {activeTab === 'danger' && (
            <div className="animate-fadeIn space-y-4">
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold">Sign out</h3>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      You'll be signed out from this device. You can always come back later.
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex-shrink-0 px-4 py-2 text-[12.5px] font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </Card>

              <div className="bg-white dark:bg-slate-900 border-2 border-rose-100 dark:border-rose-500/20 rounded-3xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" strokeWidth={2} />
                      <h3 className="text-[14px] font-bold text-rose-500">Delete account</h3>
                    </div>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Permanently erase your account and everything associated with it. This cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="flex-shrink-0 px-4 py-2 text-[12.5px] font-semibold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

/* ============ HELPER COMPONENTS ============ */

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
    {children}
  </div>
);

const CardHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="mb-5">
    <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>
    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
      {description}
    </p>
  </div>
);

const Stat: React.FC<{ label: string; value: number; to?: string }> = ({ label, value, to }) => {
  const content = (
    <div>
      <div className="text-[17px] font-bold leading-tight">{value}</div>
      <div className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="hover:opacity-70 transition-opacity">
      {content}
    </Link>
  ) : (
    content
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  prefix?: string;
  maxLength?: number;
  endAdornment?: React.ReactNode;
  error?: string;
  success?: string;
  loading?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, prefix, maxLength, endAdornment, error, success, loading }) => (
  <div>
    <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
      {label}
    </label>
    <div
      className={`flex items-center bg-white dark:bg-slate-900 border rounded-xl transition-colors ${
        error
          ? 'border-rose-300 dark:border-rose-500/50'
          : success
            ? 'border-emerald-300 dark:border-emerald-500/50'
            : 'border-slate-200 dark:border-slate-800 focus-within:border-slate-400 dark:focus-within:border-slate-600'
      }`}
    >
      {prefix && (
        <span className="pl-4 text-slate-400 text-[13.5px] font-medium select-none">{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`flex-1 py-3 bg-transparent outline-none text-[13.5px] min-w-0 ${
          prefix ? 'pl-1 pr-2' : 'px-4'
        }`}
      />
      <div className="pr-3 flex items-center gap-1">
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        {!loading && success && !error && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
        )}
        {endAdornment}
      </div>
    </div>
    {(error || success) && (
      <p className={`text-[11.5px] mt-1.5 font-medium ${error ? 'text-rose-500' : 'text-emerald-500'}`}>
        {error || success}
      </p>
    )}
  </div>
);