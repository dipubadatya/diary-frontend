import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';
import {
  ArrowLeft, Camera, Loader2, User, Lock, BookOpen, Shield,
  Trash2, LogOut, Check, Eye, EyeOff, Pencil, Plus,
  AlertTriangle, BadgeCheck, Sparkles, ExternalLink, Feather,
  Search, X, Info, CheckCircle2, Clock, XCircle, KeyRound,
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

  /* ── Profile ── */
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialProfile, setInitialProfile] = useState({ name: '', username: '', bio: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');          // ← inline profile error
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimeout = useRef<any>(null);

  /* ── Stories ── */
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storySearch, setStorySearch] = useState('');
  const [storySortBy, setStorySortBy] = useState<'recent' | 'title'>('recent');

  /* ── Avatar ── */
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Password ── */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');        // ← inline password error
  const [passwordSuccess, setPasswordSuccess] = useState('');    // ← inline password success
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Delete ── */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const profileDirty =
    name !== initialProfile.name ||
    username !== initialProfile.username ||
    bio !== initialProfile.bio;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (profileDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [profileDirty]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setStoriesLoading(true);
      const res = await api.get(`/users/profile/${user.username}`);
      if (res.data.success) {
        const p = res.data.profile;
        const loaded = { name: p.name || '', username: p.username || '', bio: p.bio || '' };
        setName(loaded.name); setUsername(loaded.username); setBio(loaded.bio);
        setInitialProfile(loaded);
        setStories(res.data.stories || []);
      }
    } catch {
      // show inline error instead of toast for data loading
      setProfileError('Could not load your profile. Please refresh the page.');
    }
    finally { setStoriesLoading(false); }
  }, [user?.username]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  /* ── Username validation ── */
useEffect(() => {
  const trimmedUsername = username.trim();

  if (trimmedUsername === initialProfile.username) {
    setUsernameError('');
    setCheckingUsername(false);
    return;
  }

  if (!trimmedUsername) {
    setUsernameError('Username is required');
    setCheckingUsername(false);
    return;
  }

  if (trimmedUsername.length < 3) {
    setUsernameError('Username must be at least 3 characters');
    setCheckingUsername(false);
    return;
  }

  if (trimmedUsername.length > 30) {
    setUsernameError('Username must be 30 characters or less');
    setCheckingUsername(false);
    return;
  }

  if (!/^[a-zA-Z0-9_.]+$/.test(trimmedUsername)) {
    setUsernameError(
      'Only letters, numbers, dots and underscores are allowed'
    );
    setCheckingUsername(false);
    return;
  }

  if (!/[a-zA-Z]/.test(trimmedUsername)) {
    setUsernameError('Username must contain at least one letter');
    setCheckingUsername(false);
    return;
  }

  setUsernameError('');
  setCheckingUsername(true);

  if (usernameCheckTimeout.current) {
    clearTimeout(usernameCheckTimeout.current);
  }

  usernameCheckTimeout.current = setTimeout(async () => {
    try {
      const response = await api.get(
        `/users/check-username/${encodeURIComponent(trimmedUsername)}`
      );

      if (response.data?.taken) {
        setUsernameError(
          'This username is already taken — try another'
        );
      }
    } catch {
      // Ignore availability-check errors.
    } finally {
      setCheckingUsername(false);
    }
  }, 600);

  return () => {
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }
  };
}, [username, initialProfile.username]);

  /* ── Save profile ── */
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProfileError('');
    if (!name.trim()) { setProfileError('Please enter your full name.'); return; }
    if (!username.trim()) { setProfileError('Please enter a username.'); return; }
    if (usernameError) { setProfileError(usernameError); return; }
    if (updatingProfile) return;
    setUpdatingProfile(true);
    try {
      const res = await api.put('/users/profile', {
        name: name.trim(), username: username.trim(), bio: bio.trim()
      });
      if (res.data.success) {
        const updated = { name: name.trim(), username: username.trim(), bio: bio.trim() };
        setInitialProfile(updated);
        if (user) login({ ...user, ...updated });
        // subtle success toast (non-error toasts are fine UX)
        toast.success('Your changes have been saved.');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Could not save changes. Please try again.');
    }
    finally { setUpdatingProfile(false); }
  };

  const handleCancelProfile = () => {
    setName(initialProfile.name); setUsername(initialProfile.username);
    setBio(initialProfile.bio); setUsernameError(''); setProfileError('');
  };

  /* ── Avatar ── */
  const uploadAvatar = async (file: File) => {
    setAvatarError('');
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file (JPG, PNG, etc.)'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 5 MB.'); return;
    }
    const formData = new FormData();
    formData.append('image', file);
    setAvatarUploading(true);
    try {
      const res = await api.put('/users/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Profile photo updated.');
        if (user) login({ ...user, image: { url: res.data.imageUrl, filename: 'avatar' } });
      }
    } catch {
      setAvatarError('Upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Password strength ── */
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
      { label: 'Weak', color: 'bg-orange-400', text: 'text-orange-400', width: 40 },
      { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-400', width: 60 },
      { label: 'Good', color: 'bg-sky-500', text: 'text-sky-500', width: 80 },
      { label: 'Strong', color: 'bg-[#D9F26B]', text: 'text-emerald-600', width: 100 },
    ];
    return levels[Math.min(score - 1, 4)] || levels[0];
  })();

  const canSubmitPassword =
    currentPassword.length > 0 && newPassword.length >= 6 &&
    confirmPassword === newPassword && !changingPassword;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // inline validation
    if (!currentPassword) { setPasswordError('Please enter your current password.'); return; }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    if (newPassword === currentPassword) { setPasswordError('New password must be different from your current password.'); return; }
    if (confirmPassword !== newPassword) { setPasswordError('Passwords do not match. Please re-enter.'); return; }
    if (!canSubmitPassword) return;

    setChangingPassword(true);
    try {
      const res = await api.post('/users/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        setPasswordSuccess('Password updated successfully! Keep it safe.');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')) {
        setPasswordError('Your current password is incorrect. Please try again.');
      } else {
        setPasswordError(msg || 'Could not update password. Please try again.');
      }
    }
    finally { setChangingPassword(false); }
  };

  const filteredStories = stories
    .filter(s => s.title.toLowerCase().includes(storySearch.toLowerCase()))
    .sort((a, b) => {
      if (storySortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.editedAt || b.timeStamp).getTime() - new Date(a.editedAt || a.timeStamp).getTime();
    });

  const handleDeleteStory = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const backup = stories;
    setStories(prev => prev.filter(s => s._id !== id));
    try {
      const res = await api.delete(`/stories/${id}`);
      if (!res.data.success) throw new Error();
      toast.success('Story deleted.');
    } catch { toast.error('Failed to delete story.'); setStories(backup); }
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') return;
    setDeletingAccount(true);
    try {
      const res = await api.delete('/users/account');
      if (res.data.success) {
        toast.success('Account deleted.');
        await logout();
        navigate('/login');
      }
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account. Please try again.');
    }
    finally { setDeletingAccount(false); }
  };

  const handleLogout = async () => {
    if (profileDirty && !window.confirm('You have unsaved changes. Sign out anyway?')) return;
    await logout(); navigate('/login');
  };

  const handleTabChange = (tab: TabKey) => {
    if (activeTab === 'details' && profileDirty) {
      if (!window.confirm('Discard unsaved changes?')) return;
      handleCancelProfile();
    }
    // clear stale error states on tab switch
    setPasswordError('');
    setPasswordSuccess('');
    setProfileError('');
    setActiveTab(tab);
  };

  const handleBack = () => {
    if (profileDirty && !window.confirm('You have unsaved changes. Leave anyway?')) return;
    navigate(-1);
  };

  if (!user) return null;

  const tabs: { key: TabKey; label: string; icon: React.FC<any>; badge?: number }[] = [
    { key: 'details', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'stories', label: 'Stories', icon: BookOpen, badge: stories.length },
    { key: 'danger', label: 'Account', icon: Shield },
  ];

  /* ─── username status helpers ─── */
  const usernameAvailable =
    !checkingUsername &&
    !usernameError &&
    username !== initialProfile.username &&
    username.length >= 3;

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0A0A0A] font-sans">

      {/* ── Delete Modal ─────────────────────────────────────── */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 bg-[#0A0A0A]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          onClick={() => !deletingAccount && setDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-7">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" strokeWidth={2} />
              </div>
              <h2 className="text-[17px] font-bold tracking-tight mb-1.5">Delete your account?</h2>
              <p className="text-slate-500 text-[13px] leading-relaxed mb-5">
                This will permanently erase your profile,{' '}
                <span className="font-bold text-[#0A0A0A]">{stories.length}</span>{' '}
                {stories.length === 1 ? 'story' : 'stories'}, comments, and messages.
                There's no way to undo this.
              </p>
              <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-2">
                    Type{' '}
                    <span className="font-mono font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                      DELETE MY ACCOUNT
                    </span>{' '}
                    to confirm
                  </label>
                  <input
                    autoFocus type="text"
                    value={deleteConfirmText}
                    onChange={e => { setDeleteConfirmText(e.target.value); setDeleteError(''); }}
                    placeholder="Type the phrase exactly"
                    className="w-full px-4 py-3 bg-[#F4F6FB] border border-slate-200 rounded-xl text-[13.5px] outline-none focus:border-rose-300 transition-colors"
                  />
                </div>

                {/* Inline delete error */}
                {deleteError && (
                  <InlineAlert type="error" message={deleteError} />
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); setDeleteError(''); }}
                    disabled={deletingAccount}
                    className="py-3 bg-[#F4F6FB] rounded-xl font-semibold text-[13px] hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Keep account
                  </button>
                  <button
                    type="submit"
                    disabled={deletingAccount || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                    className="py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-semibold text-[13px] transition-colors flex items-center justify-center gap-2"
                  >
                    {deletingAccount
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
                      : <><Trash2 className="w-4 h-4" /> Delete forever</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 pt-3">
          <div className="bg-white/90 backdrop-blur-xl rounded-full shadow-[0_2px_16px_-4px_rgba(15,23,42,0.10)] border border-slate-100 px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={handleBack}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#D9F26B]/40 active:scale-95 transition-all"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              <div>
                <span className="text-[14px] font-bold tracking-tight">Settings</span>
                {profileDirty && (
                  <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Unsaved
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-[#0A0A0A] transition-colors px-3 py-1.5 rounded-full hover:bg-[#F4F6FB]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">

        {/* ── Hero Card ── */}
        <div
          className="rounded-[32px] overflow-hidden shadow-[0_2px_24px_-4px_rgba(15,23,42,0.10)]"
          style={{ background: 'linear-gradient(135deg,#38bdf8 0%,#3b82f6 60%,#6366f1 100%)' }}
        >
          <div className="relative h-28 sm:h-32 flex items-center px-6 overflow-hidden">
            <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute top-4 right-12 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-4 right-4 w-32 h-32 rounded-full bg-indigo-400/20 blur-2xl" />
            <div className="relative z-10">
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">· ACCOUNT ·</span>
              <h2 className="text-white text-[22px] font-extrabold tracking-tight leading-tight mt-0.5">Your Profile</h2>
            </div>
          </div>

          <div className="bg-white mx-3 mb-3 rounded-[24px] px-5 sm:px-7 py-5">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative -mt-14 flex flex-col items-start">
                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white bg-slate-100 shadow-lg">
                  {avatarUploading
                    ? <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      </div>
                    : <img
                        src={user.image?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=dbeafe&color=2563eb&bold=true&size=200`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                  }
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#0A0A0A] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                  title="Change photo"
                >
                  <Camera className="w-3.5 h-3.5" strokeWidth={2.2} />
                </button>
                <input
                  ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
                />
              </div>

              <div className="pb-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[17px] font-bold tracking-tight truncate">{user.name}</h3>
                  <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" strokeWidth={0} />
                </div>
                <p className="text-[12.5px] text-slate-400 truncate">@{user.username}</p>
              </div>

              <Link
                to={`/profile/${user.username}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 hover:text-blue-600 transition-colors pb-1"
              >
                View profile <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Avatar error */}
            {avatarError && (
              <div className="mt-3">
                <InlineAlert type="error" message={avatarError} onDismiss={() => setAvatarError('')} />
              </div>
            )}

            {/* Stats */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl px-4 py-3" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                <div className="text-[20px] font-extrabold text-white leading-tight">{stories.length}</div>
                <div className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mt-0.5">Stories</div>
              </div>
              <Link to={`/profile/${user.username}`} className="rounded-2xl px-4 py-3 hover:opacity-90 transition-opacity" style={{ background: '#D9F26B' }}>
                <div className="text-[20px] font-extrabold text-[#0A0A0A] leading-tight">{user.followersCount || 0}</div>
                <div className="text-[10px] font-bold text-[#0A0A0A]/60 uppercase tracking-wider mt-0.5">Followers</div>
              </Link>
              <Link to={`/profile/${user.username}`} className="rounded-2xl px-4 py-3 hover:opacity-90 transition-opacity" style={{ background: '#0A0A0A' }}>
                <div className="text-[20px] font-extrabold text-white leading-tight">{user.followingCount || 0}</div>
                <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mt-0.5">Following</div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Pill Tab Bar ─────────────────────────────────── */}
        <div className="mt-5 flex gap-1.5 p-1.5 bg-white rounded-full shadow-[0_2px_16px_-4px_rgba(15,23,42,0.06)] border border-slate-100 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#0A0A0A] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-[#F4F6FB] hover:text-[#0A0A0A]'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${
                    isActive ? 'bg-[#D9F26B] text-[#0A0A0A]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ──────────────────────────────────── */}
        <div className="mt-5">

          {/* ══ PROFILE ══════════════════════════════════════ */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-fadeIn">
              <SoftCard>
                <div className="mb-5">
                  <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">· PERSONAL INFO ·</span>
                  <h3 className="text-[16px] font-extrabold tracking-tight mt-1">Profile Details</h3>
                  <p className="text-[12.5px] text-slate-400 mt-0.5">This is how others see you on the platform.</p>
                </div>

                {/* Inline profile-level error */}
                {profileError && (
                  <div className="mb-4">
                    <InlineAlert type="error" message={profileError} onDismiss={() => setProfileError('')} />
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AelineField
                      label="Full name" value={name} onChange={setName}
                      placeholder="Your name" maxLength={50}
                    />
                    {/* Username field with availability badge */}
                    <div>
                      <AelineField
                        label="Username" value={username}
                        onChange={v => setUsername(v.toLowerCase().replace(/\s/g, ''))}
                        placeholder="username" prefix="@" maxLength={30}
                        error={usernameError}
                        loading={checkingUsername}
                        success={usernameAvailable ? '✓ Available' : undefined}
                      />
                      {/* Rich username availability strip */}
                      {!checkingUsername && username && username !== initialProfile.username && (
                        <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-[11.5px] font-semibold ${
                          usernameError
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {usernameError
                            ? <XCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                            : <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                          }
                          {usernameError
                            ? `@${username} is unavailable`
                            : `@${username} is available`
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-bold text-slate-700">Bio</label>
                      <span className={`text-[11px] font-semibold ${bio.length > 140 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {bio.length}/160
                      </span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value.slice(0, 160))}
                      placeholder="Tell readers a little about yourself…"
                      rows={3}
                      className="w-full px-4 py-3 bg-[#F4F6FB] border border-transparent focus:border-blue-200 rounded-2xl text-[13.5px] outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Animated save bar */}
                  <div className={`transition-all duration-300 overflow-hidden ${profileDirty ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button" onClick={handleCancelProfile}
                        className="px-4 py-2.5 text-[13px] font-bold text-slate-500 hover:bg-[#F4F6FB] rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updatingProfile || !!usernameError || checkingUsername}
                        className="px-5 py-2.5 text-[13px] font-bold rounded-full transition-all flex items-center gap-2 disabled:opacity-50"
                        style={{ background: '#D9F26B', color: '#0A0A0A' }}
                      >
                        {updatingProfile
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                          : <><Check className="w-4 h-4" strokeWidth={2.5} /> Save changes</>}
                      </button>
                    </div>
                  </div>
                </form>
              </SoftCard>
            </div>
          )}

          {/* ══ PASSWORD ═════════════════════════════════════ */}
          {activeTab === 'password' && (
            <div className="animate-fadeIn space-y-4">
              <SoftCard>
                <div className="mb-5">
                  <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">· SECURITY ·</span>
                  <h3 className="text-[16px] font-extrabold tracking-tight mt-1">Change Password</h3>
                  <p className="text-[12.5px] text-slate-400 mt-0.5">Use a strong, unique password you don't reuse anywhere else.</p>
                </div>

                {/* Inline password feedback */}
                {passwordError && (
                  <div className="mb-4">
                    <InlineAlert type="error" message={passwordError} onDismiss={() => setPasswordError('')} />
                  </div>
                )}
                {passwordSuccess && (
                  <div className="mb-4">
                    <InlineAlert type="success" message={passwordSuccess} onDismiss={() => setPasswordSuccess('')} />
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <AelineField
                      label="Current password"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={v => { setCurrentPassword(v); setPasswordError(''); }}
                      placeholder="Enter your current password"
                      endAdornment={
                        <button type="button" onClick={() => setShowCurrent(s => !s)}
                          className="text-slate-400 hover:text-slate-600 p-1" tabIndex={-1}>
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                    {/* Forgot password link sits right below current password */}
                    <div className="flex justify-end mt-1.5">
                      <Link
                        to="/forgot-password"
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        <KeyRound className="w-3 h-3" strokeWidth={2} />
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <div>
                    <AelineField
                      label="New password"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={v => { setNewPassword(v); setPasswordError(''); }}
                      placeholder="Minimum 8 characters"
                      endAdornment={
                        <button type="button" onClick={() => setShowNew(s => !s)}
                          className="text-slate-400 hover:text-slate-600 p-1" tabIndex={-1}>
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                    {/* Password strength meter */}
                    {passwordStrength && (
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-slate-400">Strength</span>
                          <span className={`text-[11px] font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.width}%` }}
                          />
                        </div>
                        {/* Requirement chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {[
                            { ok: newPassword.length >= 8, label: '8+ chars' },
                            { ok: /[A-Z]/.test(newPassword), label: 'Uppercase' },
                            { ok: /[0-9]/.test(newPassword), label: 'Number' },
                            { ok: /[^a-zA-Z0-9]/.test(newPassword), label: 'Symbol' },
                          ].map(req => (
                            <span key={req.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-colors ${
                              req.ok
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {req.ok
                                ? <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.5} />
                                : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />
                              }
                              {req.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <AelineField
                    label="Confirm new password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={v => { setConfirmPassword(v); setPasswordError(''); }}
                    placeholder="Re-enter new password"
                    error={confirmPassword && confirmPassword !== newPassword ? 'Passwords do not match' : undefined}
                    success={confirmPassword && confirmPassword === newPassword ? 'Passwords match' : undefined}
                    endAdornment={
                      <button type="button" onClick={() => setShowConfirm(s => !s)}
                        className="text-slate-400 hover:text-slate-600 p-1" tabIndex={-1}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Tip */}
                  <div className="bg-blue-50 rounded-2xl p-3.5 flex gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                    <p className="text-[11.5px] text-slate-500 leading-relaxed">
                      Mix upper/lowercase, numbers, and symbols. Aim for at least 12 characters.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Forgot password — secondary link */}
                    <Link
                      to="/forgot-password"
                      className="text-[12px] font-semibold text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      Reset via email instead
                    </Link>
                    <button
                      type="submit" disabled={!canSubmitPassword}
                      className="px-5 py-2.5 text-[13px] font-bold rounded-full transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: canSubmitPassword ? '#0A0A0A' : '#e2e8f0',
                        color: canSubmitPassword ? 'white' : '#94a3b8'
                      }}
                    >
                      {changingPassword
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                        : <><Lock className="w-4 h-4" strokeWidth={2.2} /> Update password</>}
                    </button>
                  </div>
                </form>
              </SoftCard>

              {/* Standalone forgot-password card */}
              <div className="rounded-[24px] border border-slate-100 bg-white p-5 flex items-center justify-between gap-4 shadow-[0_2px_16px_-4px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="w-4 h-4 text-blue-500" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold">Don't know your current password?</p>
                    <p className="text-[11.5px] text-slate-400 mt-0.5">
                      We'll send a reset link to your email address.
                    </p>
                  </div>
                </div>
                <Link
                  to="/forgot-password"
                  className="flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  Reset password
                </Link>
              </div>
            </div>
          )}

          {/* ══ STORIES ══════════════════════════════════════ */}
          {activeTab === 'stories' && (
            <div className="animate-fadeIn space-y-4">
              <SoftCard>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">· YOUR WORK ·</span>
                    <h3 className="text-[16px] font-extrabold tracking-tight mt-1">
                      {stories.length === 0 ? 'No stories yet' : `${stories.length} ${stories.length === 1 ? 'Story' : 'Stories'}`}
                    </h3>
                  </div>
                  <Link
                    to="/write"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-[12.5px] font-bold transition-all hover:opacity-90"
                    style={{ background: '#D9F26B', color: '#0A0A0A' }}
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} /> New story
                  </Link>
                </div>

                {stories.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text" placeholder="Search your stories…"
                        value={storySearch} onChange={e => setStorySearch(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 bg-[#F4F6FB] border border-transparent focus:border-blue-100 rounded-full text-[13px] outline-none transition-colors"
                      />
                      {storySearch && (
                        <button onClick={() => setStorySearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300">
                          <X className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1 bg-[#F4F6FB] p-1 rounded-full">
                      {(['recent', 'title'] as const).map(opt => (
                        <button key={opt}
                          onClick={() => setStorySortBy(opt)}
                          className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all ${storySortBy === opt ? 'bg-[#0A0A0A] text-white' : 'text-slate-500 hover:text-[#0A0A0A]'}`}>
                          {opt === 'recent' ? 'Recent' : 'A–Z'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {storiesLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-[#F4F6FB] rounded-2xl animate-pulse" />)}
                  </div>
                ) : stories.length === 0 ? (
                  <div className="text-center py-14">
                    <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4" style={{ background: '#D9F26B' }}>
                      <Feather className="w-7 h-7 text-[#0A0A0A]" strokeWidth={1.5} />
                    </div>
                    <h4 className="text-[15px] font-extrabold">Your first story awaits</h4>
                    <p className="text-[12.5px] text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                      Share your thoughts, ideas, and experiences with the world.
                    </p>
                    <Link to="/write"
                      className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-full text-[13px] font-bold hover:opacity-90 transition-opacity"
                      style={{ background: '#0A0A0A', color: 'white' }}>
                      <Sparkles className="w-4 h-4" /> Start writing
                    </Link>
                  </div>
                ) : filteredStories.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-[13px] font-bold text-slate-500">No matches found</p>
                    <p className="text-[12px] text-slate-400 mt-1">Try a different search term.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredStories.map(story => (
                      <div key={story._id}
                        className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-[#F4F6FB] transition-colors">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#D9F26B' }}>
                          <BookOpen className="w-4 h-4 text-[#0A0A0A]" strokeWidth={2} />
                        </div>
                        <Link to={`/stories/${story._id}`} className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-bold truncate hover:text-blue-600 transition-colors">{story.title}</h4>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {moment(story.editedAt || story.timeStamp).fromNow()}
                          </p>
                        </Link>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Link to={`/stories/${story._id}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                            <Eye className="w-4 h-4" strokeWidth={1.8} />
                          </Link>
                          <Link to={`/write?edit=${story._id}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0A0A0A] hover:bg-[#F4F6FB] transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" strokeWidth={1.8} />
                          </Link>
                          <button onClick={() => handleDeleteStory(story._id, story.title)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SoftCard>
            </div>
          )}

          {/* ══ DANGER / ACCOUNT ═════════════════════════════ */}
          {activeTab === 'danger' && (
            <div className="animate-fadeIn space-y-4">
              <SoftCard>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">· SESSION ·</span>
                    <h4 className="text-[15px] font-extrabold mt-1">Sign out</h4>
                    <p className="text-[12.5px] text-slate-400 mt-1 leading-relaxed">
                      You'll be signed out from this device. You can always come back.
                    </p>
                  </div>
                  <button onClick={handleLogout}
                    className="flex-shrink-0 px-4 py-2 text-[12.5px] font-bold border border-slate-200 rounded-full hover:bg-[#F4F6FB] transition-colors flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              </SoftCard>

              <div className="rounded-[28px] p-6 relative overflow-hidden" style={{ background: '#0A0A0A' }}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-rose-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-rose-400" strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">· DANGER ZONE ·</span>
                  </div>
                  <h4 className="text-[16px] font-extrabold text-white">Delete account</h4>
                  <p className="text-[12.5px] text-white/50 mt-1.5 leading-relaxed max-w-sm">
                    Permanently erase your profile, stories, and all data. This cannot be undone.
                  </p>
                  <button onClick={() => { setDeleteModalOpen(true); setDeleteError(''); }}
                    className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all hover:opacity-90"
                    style={{ background: '#D9F26B', color: '#0A0A0A' }}>
                    <Trash2 className="w-4 h-4" strokeWidth={2} /> Delete my account
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
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.28s ease-out; }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   DESIGN-SYSTEM ATOMS
═══════════════════════════════════════════════════ */

const SoftCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_2px_16px_-4px_rgba(15,23,42,0.06)] border border-slate-100">
    {children}
  </div>
);

/** Reusable inline alert — replaces most toast error usage */
const InlineAlert: React.FC<{
  type: 'error' | 'success' | 'warning';
  message: string;
  onDismiss?: () => void;
}> = ({ type, message, onDismiss }) => {
  const styles = {
    error:   { wrap: 'bg-rose-50 border-rose-100 text-rose-700', icon: <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" strokeWidth={2} /> },
    success: { wrap: 'bg-emerald-50 border-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} /> },
    warning: { wrap: 'bg-amber-50 border-amber-100 text-amber-700', icon: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} /> },
  }[type];

  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl border text-[12.5px] font-semibold leading-relaxed ${styles.wrap}`}>
      {styles.icon}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity ml-1 flex-shrink-0 mt-0.5">
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

const AelineField: React.FC<{
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
    <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">{label}</label>
    <div className={`flex items-center bg-[#F4F6FB] border rounded-2xl transition-colors ${
      error   ? 'border-rose-300 bg-rose-50/50' :
      success ? 'border-emerald-200 bg-emerald-50/30' :
                'border-transparent focus-within:border-blue-200 focus-within:bg-white'
    }`}>
      {prefix && <span className="pl-4 text-slate-400 text-[13.5px] font-medium select-none">{prefix}</span>}
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        className={`flex-1 py-3 bg-transparent outline-none text-[13.5px] min-w-0 ${prefix ? 'pl-1 pr-2' : 'px-4'}`}
      />
      <div className="pr-3 flex items-center gap-1">
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        {!loading && success && !error && <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />}
        {endAdornment}
      </div>
    </div>
    {(error || success) && (
      <p className={`text-[11.5px] mt-1.5 font-semibold ${error ? 'text-rose-500' : 'text-emerald-600'}`}>
        {error || success}
      </p>
    )}
  </div>
);