

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import DiaryLogo from '../../components/DiaryLogo';

export const VerificationSuccess: React.FC = () => {
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center lg:text-left"
              >
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  Welcome to<br />
                  <span className="italic font-normal">the community.</span>
                </h1>
                <p className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed">
                  Your email is officially verified. You can now publish stories, leave comments, and connect with other writers on Diary.
                </p>

                <p className="hidden md:block text-[11px] md:text-xs text-white/80 font-medium tracking-wide uppercase">
                  Write · Share · Read · Connect
                </p>
              </motion.div>

              {/* ─── Right: Success Card ─── */}
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
                  {/* Success icon */}
                  <div className="flex justify-center mb-5">
                    <div className="w-14 h-14 bg-[#C6F547] rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-7 h-7 text-stone-900" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Header */}
                  <div className="text-center mb-6">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600 uppercase mb-2">
                      · Verification complete ·
                    </p>
                    <h2
                      className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      You're all<br />
                      <span className="italic font-normal">set to go.</span>
                    </h2>
                  </div>

                  {/* Confirmation box */}
                  <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4 mb-6 text-center">
                    <p className="text-sm text-emerald-900 leading-relaxed font-medium">
                      Your email has been successfully verified.
                    </p>
                  </div>

                  {/* What happens next */}
                  <div className="space-y-3 mb-8">
                    <div className="flex gap-3">
                      <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                        1
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed">
                        Sign in to your account.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                        2
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed">
                        Set up your profile.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                        3
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed">
                        Start writing your first entry.
                      </p>
                    </div>
                  </div>

                  {/* Go to sign in — primary lime CTA */}
                  <Link
                    to="/login"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group"
                  >
                    Go to Sign In
                    <span className="w-5 h-5 md:w-6 md:h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                      →
                    </span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};