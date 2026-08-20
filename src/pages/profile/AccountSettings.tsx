
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  ArrowLeft, Loader2, User, Lock, Shield,
  Trash2, LogOut, Check, Eye, EyeOff,
  AlertTriangle, BadgeCheck, ExternalLink,
  X, CheckCircle2, XCircle, KeyRound,
} from 'lucide-react';

type TabKey = 'details' | 'password' | 'danger';

export const AccountSettings: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('details');

  // ── Profile fields ──
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialProfile, setInitialProfile] = useState({ name: '', username: '', bio: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimeout = useRef<any>(null);

  // ── Password fields ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Delete account ──
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Tracks whether the user has made changes to their profile
  const profileDirty =
    name !== initialProfile.name ||
    username !== initialProfile.username ||
    bio !== initialProfile.bio;

  // ── Auto-dismiss success and error messages ──
  useEffect(() => {
    if (!profileSuccess) return;
    const t = setTimeout(() => setProfileSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [profileSuccess]);

  useEffect(() => {
    if (!passwordSuccess) return;
    const t = setTimeout(() => setPasswordSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [passwordSuccess]);

  // Warn user before leaving the page with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (profileDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [profileDirty]);

  // ── Load profile data on mount ──
  const loadProfileData = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`/users/profile/${user.username}`);
      if (res.data.success) {
        const p = res.data.profile;
        const loaded = {
          name: p.name || '',
          username: p.username || '',
          bio: p.bio || '',
        };
        setName(loaded.name);
        setUsername(loaded.username);
        setBio(loaded.bio);
        setInitialProfile(loaded);
      }
    } catch {
      setProfileError('Could not load your profile. Please refresh the page.');
    }
  }, [user?.username]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // ── Username availability check (debounced) ──
  useEffect(() => {
    const trimmed = username.trim();

    if (trimmed === initialProfile.username) {
      setUsernameError('');
      setCheckingUsername(false);
      return;
    }
    if (!trimmed) {
      setUsernameError('Username is required');
      setCheckingUsername(false);
      return;
    }
    if (trimmed.length < 3) {
      setUsernameError('Must be at least 3 characters');
      setCheckingUsername(false);
      return;
    }
    if (trimmed.length > 30) {
      setUsernameError('Must be 30 characters or less');
      setCheckingUsername(false);
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) {
      setUsernameError('Only letters, numbers, dots and underscores');
      setCheckingUsername(false);
      return;
    }
    if (!/[a-zA-Z]/.test(trimmed)) {
      setUsernameError('Must contain at least one letter');
      setCheckingUsername(false);
      return;
    }

    setUsernameError('');
    setCheckingUsername(true);

    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);

    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const response = await api.get(`/users/check-username/${encodeURIComponent(trimmed)}`);
        if (response.data?.taken) setUsernameError('This username is already taken');
      } catch {
        // silently ignore network errors during availability check
      } finally {
        setCheckingUsername(false);
      }
    }, 600);

    return () => {
      if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    };
  }, [username, initialProfile.username]);

  // ── Save profile ──
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) { setProfileError('Please enter your full name.'); return; }
    if (!username.trim()) { setProfileError('Please enter a username.'); return; }
    if (usernameError) { setProfileError(usernameError); return; }
    if (updatingProfile) return;

    setUpdatingProfile(true);
    try {
      const res = await api.put('/users/profile', {
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
      });
      if (res.data.success) {
        const updated = {
          name: name.trim(),
          username: username.trim(),
          bio: bio.trim(),
        };
        setInitialProfile(updated);
        if (user) login({ ...user, ...updated });
        setProfileSuccess('Your changes have been saved.');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Could not save changes. Please try again.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    setName(initialProfile.name);
    setUsername(initialProfile.username);
    setBio(initialProfile.bio);
    setUsernameError('');
    setProfileError('');
    setProfileSuccess('');
  };

  // ── Password strength calculator ──
  const passwordStrength = (() => {
    if (!newPassword) return null;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;
    const levels = [
      { label: 'Very weak', color: 'bg-rose-400', text: 'text-rose-500', width: 20 },
      { label: 'Weak', color: 'bg-orange-400', text: 'text-orange-500', width: 40 },
      { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-500', width: 60 },
      { label: 'Good', color: 'bg-sky-400', text: 'text-sky-600', width: 80 },
      { label: 'Strong', color: 'bg-emerald-400', text: 'text-emerald-600', width: 100 },
    ];
    return levels[Math.min(score - 1, 4)] || levels[0];
  })();

  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword &&
    !changingPassword;

  // ── Change password ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) { setPasswordError('Enter your current password.'); return; }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    if (newPassword === currentPassword) { setPasswordError('New password must differ from current.'); return; }
    if (confirmPassword !== newPassword) { setPasswordError('Passwords do not match.'); return; }

    setChangingPassword(true);
    try {
      const res = await api.post('/users/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        setPasswordSuccess('Password updated successfully. Keep it safe.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      setPasswordError(
        msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')
          ? 'Current password is incorrect.'
          : msg || 'Could not update password.',
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ── Delete account ──
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') return;

    setDeletingAccount(true);
    try {
      const res = await api.delete('/users/account');
      if (res.data.success) {
        await logout();
        navigate('/login');
      }
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  // ── Sign out ──
  const handleLogout = async () => {
    if (profileDirty && !window.confirm('You have unsaved changes. Sign out anyway?')) return;
    await logout();
    navigate('/login');
  };

  // ── Tab switching ──
  const handleTabChange = (tab: TabKey) => {
    if (activeTab === 'details' && profileDirty) {
      if (!window.confirm('Discard unsaved changes?')) return;
      handleCancelProfile();
    }
    setPasswordError('');
    setPasswordSuccess('');
    setProfileError('');
    setProfileSuccess('');
    setActiveTab(tab);
  };

  const handleBack = () => {
    if (profileDirty && !window.confirm('You have unsaved changes. Leave anyway?')) return;
    navigate(-1);
  };

  if (!user) return null;

  const tabs: { key: TabKey; label: string; icon: React.FC<any> }[] = [
    { key: 'details', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'danger', label: 'Account', icon: Shield },
  ];

  const usernameAvailable =
    !checkingUsername &&
    !usernameError &&
    username !== initialProfile.username &&
    username.length >= 3;

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#18181B] font-sans">

      {/* ── Delete Account Modal ── */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => !deletingAccount && setDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-[24px] w-full max-w-[420px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-4.5 h-4.5" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold tracking-tight">Delete account</h2>
                  <p className="text-[12px] text-slate-400">This action is permanent</p>
                </div>
              </div>

              <p className="text-slate-500 text-[13px] leading-relaxed mb-5">
                Your profile, comments, and all data will be permanently erased.
              </p>

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-2">
                    Type{' '}
                    <span className="font-mono font-bold text-rose-500 text-[11px]">
                      DELETE MY ACCOUNT
                    </span>{' '}
                    to confirm
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={deleteConfirmText}
                    onChange={e => { setDeleteConfirmText(e.target.value); setDeleteError(''); }}
                    placeholder="Type the phrase exactly"
                    className="w-full px-4 py-3 bg-[#F4F6FB] border border-slate-200 rounded-xl text-[13px] outline-none focus:border-rose-300 transition-colors"
                  />
                </div>

                {deleteError && (
                  <InlineAlert type="error" message={deleteError} onDismiss={() => setDeleteError('')} />
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); setDeleteError(''); }}
                    className="py-2.5 bg-[#F4F6FB] rounded-xl font-semibold text-[13px] hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deletingAccount || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                    className="py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold text-[13px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    {deletingAccount
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
                      : <><Trash2 className="w-3.5 h-3.5" /> Delete</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="bg-white/92 backdrop-blur-xl rounded-full shadow-[0_1px_12px_-3px_rgba(15,23,42,0.08)] border border-slate-100/80 px-4 h-[52px] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={handleBack}
                aria-label="Go back"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>
              <span className="text-[14px] font-bold tracking-tight">Settings</span>
              {profileDirty && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Unsaved
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-[12px] font-semibold text-slate-400 hover:text-[#18181B] transition-colors px-3 py-1.5 rounded-full hover:bg-slate-50 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-24">

        {/* User info header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm flex-shrink-0">
            <img
              src={
                user.image?.url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f1f5f9&color=64748b&bold=true&size=200`
              }
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[16px] font-bold tracking-tight truncate">{user.name}</h2>
              <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" strokeWidth={0} />
            </div>
            <p className="text-[12px] text-slate-400 truncate">@{user.username}</p>
            <Link
              to={`/profile/${user.username}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-blue-500 transition-colors mt-1"
            >
              View profile <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 p-1 bg-white rounded-full shadow-[0_1px_8px_-2px_rgba(15,23,42,0.06)] border border-slate-100/80 mb-5 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#18181B] text-white shadow-sm'
                    : 'text-slate-400 hover:text-[#18181B] hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div className="space-y-4">

          {/* PROFILE TAB */}
          {activeTab === 'details' && (
            <div className="animate-fadeIn">
              <Section
                label="Personal info"
                title="Edit your profile"
                desc="How others see you on the platform."
              >
                {profileError && (
                  <div className="mb-4">
                    <InlineAlert type="error" message={profileError} onDismiss={() => setProfileError('')} />
                  </div>
                )}
                {profileSuccess && (
                  <div className="mb-4">
                    <InlineAlert type="success" message={profileSuccess} onDismiss={() => setProfileSuccess('')} />
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
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
                      onChange={v => setUsername(v.toLowerCase().replace(/\s/g, ''))}
                      placeholder="username"
                      prefix="@"
                      maxLength={30}
                      error={usernameError}
                      loading={checkingUsername}
                      success={usernameAvailable ? 'Available' : undefined}
                    />
                  </div>

                  {/* Email — read only, shown for reference */}
                  <div>
                    <label className="text-[12px] font-semibold text-slate-500 mb-1.5 block">
                      Email
                    </label>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F4F6FB] border border-transparent rounded-xl">
                      <span className="text-[13px] text-slate-400 flex-1 truncate">
                        {user.email}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                        <span className="text-[11px] font-semibold text-emerald-500">Verified</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Email cannot be changed.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-semibold text-slate-500">Bio</label>
                      <span className={`text-[11px] font-medium ${bio.length > 140 ? 'text-amber-500' : 'text-slate-300'}`}>
                        {bio.length}/160
                      </span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value.slice(0, 160))}
                      placeholder="Tell readers about yourself…"
                      rows={3}
                      className="w-full px-4 py-3 bg-[#F4F6FB] border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl text-[13px] outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Save / Cancel buttons — only visible when there are changes */}
                  <div className={`transition-all duration-200 overflow-hidden ${profileDirty ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelProfile}
                        className="px-4 py-2 text-[12px] font-semibold text-slate-400 hover:text-[#18181B] rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updatingProfile || !!usernameError || checkingUsername}
                        className="px-5 py-2 text-[12px] font-bold rounded-full bg-[#18181B] text-white disabled:opacity-40 flex items-center gap-1.5 transition-all hover:-translate-y-px"
                      >
                        {updatingProfile
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                          : <><Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Save</>}
                      </button>
                    </div>
                  </div>
                </form>
              </Section>
            </div>
          )}

          {/* PASSWORD TAB */}
          {activeTab === 'password' && (
            <div className="animate-fadeIn">
              <Section
                label="Security"
                title="Change password"
                desc="Use a strong password you don't reuse elsewhere."
              >
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

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                  <div>
                    <Field
                      label="Current password"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={v => { setCurrentPassword(v); setPasswordError(''); }}
                      placeholder="Enter current password"
                      endAdornment={
                        <ToggleEye show={showCurrent} onToggle={() => setShowCurrent(s => !s)} />
                      }
                    />
                    <div className="flex justify-end mt-1">
                      <Link
                        to="/forgot-password"
                        className="text-[11px] font-semibold text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" /> Forgot?
                      </Link>
                    </div>
                  </div>

                  <div>
                    <Field
                      label="New password"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={v => { setNewPassword(v); setPasswordError(''); }}
                      placeholder="Minimum 8 characters"
                      endAdornment={
                        <ToggleEye show={showNew} onToggle={() => setShowNew(s => !s)} />
                      }
                    />

                    {/* Password strength indicator */}
                    {passwordStrength && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-slate-300">Strength</span>
                          <span className={`text-[11px] font-semibold ${passwordStrength.text}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.width}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {[
                            { ok: newPassword.length >= 8, label: '8+ chars' },
                            { ok: /[A-Z]/.test(newPassword), label: 'Uppercase' },
                            { ok: /[0-9]/.test(newPassword), label: 'Number' },
                            { ok: /[^a-zA-Z0-9]/.test(newPassword), label: 'Symbol' },
                          ].map(req => (
                            <span
                              key={req.label}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                req.ok
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-50 text-slate-300'
                              }`}
                            >
                              {req.ok
                                ? <CheckCircle2 className="w-2.5 h-2.5" />
                                : <div className="w-2.5 h-2.5 rounded-full border border-slate-200" />}
                              {req.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Field
                    label="Confirm password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={v => { setConfirmPassword(v); setPasswordError(''); }}
                    placeholder="Re-enter new password"
                    error={confirmPassword && confirmPassword !== newPassword ? 'Does not match' : undefined}
                    success={confirmPassword && confirmPassword === newPassword ? 'Match' : undefined}
                    endAdornment={
                      <ToggleEye show={showConfirm} onToggle={() => setShowConfirm(s => !s)} />
                    }
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!canSubmitPassword}
                      className="px-5 py-2 text-[12px] font-bold rounded-full bg-[#18181B] text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all hover:-translate-y-px"
                    >
                      {changingPassword
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…</>
                        : <><Lock className="w-3.5 h-3.5" /> Update</>}
                    </button>
                  </div>
                </form>
              </Section>
            </div>
          )}

          {/* ACCOUNT / DANGER TAB */}
          {activeTab === 'danger' && (
            <div className="animate-fadeIn space-y-3">
              <Section label="Session" title="Sign out">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-slate-400 max-w-xs">
                    Sign out from this device. You can always sign back in.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="flex-shrink-0 px-4 py-2 text-[12px] font-bold border border-slate-200 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              </Section>

              <div className="rounded-[20px] border border-rose-100 bg-rose-50/50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" strokeWidth={2} />
                  <span className="text-[10px] font-bold tracking-[0.15em] text-rose-400 uppercase">
                    Danger zone
                  </span>
                </div>
                <h4 className="text-[14px] font-bold text-[#18181B]">Delete account</h4>
                <p className="text-[12px] text-slate-500 mt-1 leading-relaxed max-w-sm">
                  Permanently erase your profile, stories, and all data. This cannot be undone.
                </p>
                <button
                  onClick={() => { setDeleteModalOpen(true); setDeleteError(''); }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete account
                </button>
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
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────

const Section: React.FC<{
  label?: string;
  title: string;
  desc?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, title, desc, headerRight, children }) => (
  <div className="bg-white rounded-[20px] p-5 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.05)] border border-slate-100/80">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        {label && (
          <span className="text-[10px] font-bold tracking-[0.15em] text-slate-300 uppercase">
            {label}
          </span>
        )}
        <h3 className="text-[15px] font-bold tracking-tight mt-0.5">{title}</h3>
        {desc && <p className="text-[12px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {headerRight}
    </div>
    {children}
  </div>
);

const InlineAlert: React.FC<{
  type: 'error' | 'success' | 'warning';
  message: string;
  onDismiss?: () => void;
}> = ({ type, message, onDismiss }) => {
  const styles = {
    error: {
      wrap: 'bg-rose-50 text-rose-600',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" strokeWidth={2} />,
    },
    success: {
      wrap: 'bg-emerald-50 text-emerald-600',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={2} />,
    },
    warning: {
      wrap: 'bg-amber-50 text-amber-600',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={2} />,
    },
  }[type];

  return (
    <div className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-medium leading-relaxed ${styles.wrap}`}>
      {styles.icon}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
          <X className="w-3 h-3" strokeWidth={2.5} />
        </button>
      )}
    </div>
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
    <label className="text-[12px] font-semibold text-slate-500 mb-1.5 block">{label}</label>
    <div className={`flex items-center bg-[#F4F6FB] border rounded-xl transition-colors ${
      error
        ? 'border-rose-200 bg-rose-50/40'
        : success
        ? 'border-emerald-200 bg-emerald-50/30'
        : 'border-transparent focus-within:border-slate-200 focus-within:bg-white'
    }`}>
      {prefix && (
        <span className="pl-3.5 text-slate-300 text-[13px] select-none">{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`flex-1 py-2.5 bg-transparent outline-none text-[13px] min-w-0 ${
          prefix ? 'pl-0.5 pr-2' : 'px-3.5'
        }`}
      />
      <div className="pr-3 flex items-center gap-1">
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />}
        {!loading && success && !error && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
        )}
        {endAdornment}
      </div>
    </div>
    {(error || success) && (
      <p className={`text-[11px] mt-1 font-medium ${error ? 'text-rose-500' : 'text-emerald-500'}`}>
        {error || success}
      </p>
    )}
  </div>
);

const ToggleEye: React.FC<{ show: boolean; onToggle: () => void }> = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="text-slate-300 hover:text-slate-500 p-0.5"
    tabIndex={-1}
  >
    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
  </button>
);