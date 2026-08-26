import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldAlert, ShieldCheck, ArrowLeft, Mail, Edit2, X } from 'lucide-react';
import api from '../../services/api';
import DiaryLogo from '../../components/DiaryLogo';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const token = searchParams.get('token');
  
  // ─── Token Verification States ───
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const verifiedRef = useRef(false);

  // ─── Info/Resend Page States ───
  const [email, setEmail] = useState<string>(() => {
    return (
      location.state?.email ||
      searchParams.get('email') ||
      sessionStorage.getItem('pending_verification_email') ||
      ''
    );
  });
  
  const [isEmailInputVisible, setIsEmailInputVisible] = useState(!email);
  const [emailInput, setEmailInput] = useState(email);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Automatic token verification (when token exists in URL)
  useEffect(() => {
    if (!token) return;

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const performVerification = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        if (res.data.success) {
          setStatus('success');
          // Redirect to success view after 1.5 seconds for a smooth transition
          setTimeout(() => {
            navigate('/verification-success');
          }, 1500);
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'This verification link is invalid or has expired.');
      }
    };

    performVerification();
  }, [token, navigate]);

  // Resend verification link handler
  const handleResend = async () => {
    if (!email) return;
    try {
      setResendStatus('loading');
      setResendMessage('');
      const res = await api.post('/auth/resend-verification', { email });
      setResendStatus('success');
      setResendMessage(res.data.message || 'Verification link has been resent.');
      setCooldown(60);
    } catch (err: any) {
      setResendStatus('error');
      setResendMessage(err.message || 'Failed to resend. Please try again.');
    }
  };

  // Change email handler
  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNewEmail = newEmail.trim();
    if (!cleanNewEmail || cleanNewEmail.toLowerCase() === email.toLowerCase()) {
      setResendStatus('error');
      setResendMessage('Please enter a different email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNewEmail)) {
      setResendStatus('error');
      setResendMessage('Please enter a valid email address.');
      return;
    }

    try {
      setResendStatus('loading');
      setResendMessage('');
      const res = await api.post('/auth/change-email', {
        oldEmail: email,
        newEmail: cleanNewEmail
      });
      
      setEmail(cleanNewEmail);
      sessionStorage.setItem('pending_verification_email', cleanNewEmail);
      setIsChangingEmail(false);
      setNewEmail('');
      setResendStatus('success');
      setResendMessage(res.data.message || 'Email updated and new verification link sent.');
      setCooldown(60);
    } catch (err: any) {
      setResendStatus('error');
      setResendMessage(err.message || 'Failed to change email address.');
    }
  };

  // Direct manual email entry handler
  const handleManualEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setResendStatus('error');
      setResendMessage('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setResendStatus('error');
      setResendMessage('Please enter a valid email address.');
      return;
    }

    try {
      setResendStatus('loading');
      setResendMessage('');
      const res = await api.post('/auth/resend-verification', { email: cleanEmail });
      
      setEmail(cleanEmail);
      sessionStorage.setItem('pending_verification_email', cleanEmail);
      setIsEmailInputVisible(false);
      setResendStatus('success');
      setResendMessage(res.data.message || 'Verification link has been sent.');
      setCooldown(60);
    } catch (err: any) {
      setResendStatus('error');
      setResendMessage(err.message || 'Failed to send verification link.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 font-sans selection:bg-stone-900 selection:text-white overflow-hidden">
      
      {/* ═══════════ SKY HERO SECTION ═══════════ */}
      <section className="relative min-h-screen overflow-hidden">
        
        {/* Sky Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.5) 0%, transparent 60%),
              linear-gradient(to bottom, #7DD3FC, #38BDF8, #0EA5E9)
            `,
          }}
        />

        {/* Cloud overlays */}
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-32 bg-white/40 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-40 bg-white/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-80 h-36 bg-white/50 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-1/4 w-72 h-32 bg-white/40 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          
          {/* ─── Navbar ─── */}
          <nav className="flex items-center justify-between px-4 sm:px-6 md:px-10 lg:px-16 py-5 md:py-6">
            <DiaryLogo></DiaryLogo>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-white/30 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go to sign in
            </Link>
          </nav>

          {/* ─── Main content ─── */}
          <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-10 py-8 md:py-12">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

              {/* ─── Left: Contextual copy ─── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center lg:text-left"
              >
                {token ? (
                  // Token verification layouts
                  <>
                    {status === 'loading' && (
                      <>
                        <h1
                          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                        >
                          Verifying<br />
                          <span className="italic font-normal">your email.</span>
                        </h1>
                        <p className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed">
                          Please wait a moment while we securely confirm your email address.
                        </p>
                      </>
                    )}

                    {status === 'success' && (
                      <>
                        <h1
                          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                        >
                          Verification<br />
                          <span className="italic font-normal">successful.</span>
                        </h1>
                        <p className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed">
                          Everything is set. We are redirecting you to your Profile now.
                        </p>
                      </>
                    )}

                    {status === 'error' && (
                      <>
                        <h1
                          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                        >
                          Verification<br />
                          <span className="italic font-normal">failed.</span>
                        </h1>
                        <p className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed">
                          We couldn't verify your email address. The link may have already been used, or it might be expired.
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  // Dedicated Check Email layout
                  <>
                    <h1
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Verify your<br />
                      <span className="italic font-normal">email address.</span>
                    </h1>
                    <p className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed">
                      To keep your account secure, we need to verify your email. Access to writing, reading, and commenting on Diary will unlock once verified.
                    </p>
                  </>
                )}

                <p className="hidden md:block text-[11px] md:text-xs text-white/80 font-medium tracking-wide uppercase">
                  Write · Share · Read · Connect
                </p>
              </motion.div>

              {/* ─── Right: Status Card ─── */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
              >
                <div
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl"
                  style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                >
                  <AnimatePresence mode="wait">
                    
                    {/* TOKEN VERIFY FLOW */}
                    {token && (
                      <motion.div
                        key="token-flow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {status === 'loading' && (
                          <div>
                            <div className="flex justify-center mb-6">
                              <div className="w-14 h-14 bg-stone-50 border border-stone-100 rounded-full flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-stone-400 animate-spin" strokeWidth={2.5} />
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-2">
                                · Processing ·
                              </p>
                              <h2
                                className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 mb-6"
                                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                              >
                                Checking link...
                              </h2>
                              <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4">
                                <p className="text-xs text-stone-500 font-medium">
                                  Connecting to secure servers
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {status === 'success' && (
                          <div>
                            <div className="flex justify-center mb-6">
                              <div className="w-14 h-14 bg-[#C6F547] rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7 text-stone-900" strokeWidth={2.5} />
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600 uppercase mb-2">
                                · Verified ·
                              </p>
                              <h2
                                className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 mb-6"
                                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                              >
                                All set.
                              </h2>
                              <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4">
                                <p className="text-sm text-emerald-900 font-medium">
                                  Redirecting you automatically...
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {status === 'error' && (
                          <div>
                            <div className="flex justify-center mb-6">
                              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
                                <ShieldAlert className="w-7 h-7 text-red-500" strokeWidth={2.5} />
                              </div>
                            </div>
                            <div className="text-center mb-6">
                              <p className="text-[10px] font-bold tracking-[0.2em] text-red-600 uppercase mb-2">
                                · Error ·
                              </p>
                              <h2
                                className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900"
                                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                              >
                                Invalid link.
                              </h2>
                            </div>

                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
                              <p className="text-[13px] text-red-700 leading-relaxed font-medium text-center">
                                {errorMsg}
                              </p>
                            </div>

                            <div className="space-y-4">
                              <button
                                onClick={() => {
                                  // Strip token to switch to email request layout
                                  navigate('/verify-email');
                                  setIsEmailInputVisible(true);
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group"
                              >
                                Request New Verification Link
                                <span className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                                  →
                                </span>
                              </button>
                              
                              <div className="text-center">
                                <Link to="/login" className="text-xs font-bold text-stone-500 hover:text-stone-700 transition-colors uppercase tracking-widest">
                                  Back to Sign In
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* DEDICATED VERIFY EMAIL LANDING FLOW */}
                    {!token && (
                      <motion.div
                        key="info-flow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {isEmailInputVisible ? (
                          // Manual email entry form
                          <form onSubmit={handleManualEmailSubmit}>
                            <div className="mb-5">
                              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-2">
                                · Request Verification ·
                              </p>
                              <h2
                                className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900"
                                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                              >
                                Enter your email
                              </h2>
                              <p className="text-xs text-stone-500 mt-2">
                                Please type the email address linked to your account. We will send a link to verify your ownership.
                              </p>
                            </div>

                            <div className="mb-4">
                              <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-sky-400 focus:outline-none transition-all"
                              />
                            </div>

                            {resendMessage && (
                              <div className={`mb-4 p-3.5 border rounded-2xl flex items-start gap-2.5 ${
                                resendStatus === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                              }`}>
                                <p className="text-xs font-semibold leading-relaxed">
                                  {resendMessage}
                                </p>
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={resendStatus === 'loading'}
                              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group disabled:opacity-60"
                            >
                              {resendStatus === 'loading' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  Send Link
                                  <span className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                                    →
                                  </span>
                                </>
                              )}
                            </button>
                          </form>
                        ) : (
                          // Details view (registered email, instructions, resend, edit email)
                          <div>
                            <div className="mb-5">
                              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-2">
                                · Verification Sent ·
                              </p>
                              <h2
                                className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900"
                                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                              >
                                Check your inbox
                              </h2>
                            </div>

                            <div className="flex justify-center mb-5">
                              <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-sky-500">
                                <Mail className="w-5.5 h-5.5" />
                              </div>
                            </div>

                            <p className="text-xs text-stone-500 text-center mb-2 font-medium">
                              We sent a verification link to:
                            </p>

                            <div className="bg-stone-50 border border-stone-100 rounded-2xl py-3 px-4 font-bold text-center text-stone-955 text-sm break-all mb-5 select-all flex items-center justify-center gap-2 shadow-inner">
                              {email}
                            </div>

                            <p className="text-xs text-stone-500 leading-relaxed text-center mb-6">
                              Please click the verification link in the email to activate your account. If you don't see it within a few minutes, check your spam folder.
                            </p>

                            {/* Status Notifications */}
                            {resendMessage && (
                              <div className={`mb-5 p-3.5 border rounded-2xl flex items-start gap-2.5 ${
                                resendStatus === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                              }`}>
                                <p className="text-xs font-semibold leading-relaxed">
                                  {resendMessage}
                                </p>
                              </div>
                            )}

                            {/* Change Email Form Inline */}
                            {isChangingEmail ? (
                              <form onSubmit={handleChangeEmailSubmit} className="bg-stone-50 border border-stone-100 rounded-2xl p-4 mb-6">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                                    Change Email Address
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsChangingEmail(false);
                                      setNewEmail('');
                                    }}
                                    className="text-stone-400 hover:text-stone-600 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <input
                                  type="email"
                                  value={newEmail}
                                  onChange={(e) => setNewEmail(e.target.value)}
                                  placeholder="newemail@example.com"
                                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-sky-400 focus:outline-none transition-all mb-3"
                                  required
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    disabled={resendStatus === 'loading'}
                                    className="flex-1 bg-stone-900 text-white rounded-full py-2 text-xs font-bold hover:bg-stone-850 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                  >
                                    {resendStatus === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Save & Resend
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsChangingEmail(false);
                                      setNewEmail('');
                                    }}
                                    className="px-4 py-2 border border-stone-200 rounded-full text-xs font-bold text-stone-500 hover:text-stone-700 transition-all bg-white"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              // Actions Row
                              <div className="space-y-4 mb-6">
                                <button
                                  type="button"
                                  onClick={handleResend}
                                  disabled={cooldown > 0 || resendStatus === 'loading'}
                                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {resendStatus === 'loading' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : cooldown > 0 ? (
                                    `Resend link in ${cooldown}s`
                                  ) : (
                                    <>
                                      Resend verification link
                                      <span className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                                        →
                                      </span>
                                    </>
                                  )}
                                </button>

                                <div className="text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsChangingEmail(true);
                                      setNewEmail(email);
                                      setResendMessage('');
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-bold transition-all"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Entered wrong email? Change it
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Always show back to login at the card footer */}
                        <div className="pt-4 border-t border-stone-100 text-center">
                          <Link
                            to="/login"
                            className="inline-flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-stone-700 transition-colors uppercase tracking-widest"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            Back to Sign In
                          </Link>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};