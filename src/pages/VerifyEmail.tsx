
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldAlert, ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import DiaryLogo from '../components/DiaryLogo';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Prevent duplicate runs in React 18/19 StrictMode
  const verifiedRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setErrorMsg("We couldn't find a verification token in this link.");
      return;
    }

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
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 font-sans selection:bg-stone-900 selection:text-white overflow-hidden">
      
      {/* ═══════════ SKY HERO SECTION — matches Auth Pages ═══════════ */}
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
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center lg:text-left"
              >
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
                      Everything is set. We are redirecting you to your dashboard now.
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
                    
                    {/* LOADING STATE */}
                    {status === 'loading' && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
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
                      </motion.div>
                    )}

                    {/* SUCCESS STATE */}
                    {status === 'success' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
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
                      </motion.div>
                    )}

                    {/* ERROR STATE */}
                    {status === 'error' && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
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

                        <div className="space-y-3">
                          <Link
                            to="/login"
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group"
                          >
                            Go to Sign In
                            <span className="w-5 h-5 md:w-6 md:h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                              →
                            </span>
                          </Link>
                          
                          <div className="pt-2 text-center">
                            <p className="text-xs text-stone-600 font-medium">
                              Need a new account?{' '}
                              <Link to="/signup" className="text-sky-600 hover:text-sky-800 font-bold transition-colors">
                                Sign up again
                              </Link>
                            </p>
                          </div>
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