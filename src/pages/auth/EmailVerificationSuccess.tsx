import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import DiaryLogo from "../../components/DiaryLogo";

/* ------------------------------------------------------------------ */
/* Motion Presets — shared structure for visual consistency          */
/* ------------------------------------------------------------------ */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const cardMotion = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.5, ease: EASE_OUT },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export const VerificationSuccess: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-stone-900 selection:text-white flex flex-col">
      {/* Visual Ambient Sky Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.5) 0%, transparent 60%),
            linear-gradient(to bottom, #7DD3FC, #38BDF8, #0EA5E9)
          `,
        }}
      />

      {/* Header View */}
      <header className="relative z-10 w-full px-6 py-6 md:px-12 md:py-8 flex items-center justify-between">
        <DiaryLogo />
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium hover:underline underline-offset-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </header>

      {/* Content Container */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pb-16">
        <motion.div
          {...cardMotion}
          className="w-full max-w-[400px] sm:max-w-[440px]"
        >
          {/* Header Block */}
          <div className="mb-7 text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              All Verified!
            </h1>
            <p className="text-white/85 text-sm md:text-base">
              Welcome to the community
            </p>
          </div>

          {/* Success Summary Card */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-[0_15px_35px_rgba(0,0,0,0.12)] border border-white/20">
            {/* Success Banner */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck
                  className="w-6 h-6 text-emerald-600"
                  strokeWidth={2.5}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Verification Complete
                </p>
                <h2 className="text-lg font-bold text-stone-900 leading-tight">
                  Your email is confirmed
                </h2>
              </div>
            </div>

            <p className="text-stone-600 text-[14px] leading-relaxed mb-6 font-medium">
              Your account is now fully active. You have unlocked complete
              access to writing, reading, and sharing stories on Diary.
            </p>

            {/* Step Checklist */}
            <div className="space-y-4 mb-8 border-t border-b border-stone-100 py-5">
              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                  1
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-stone-900 leading-tight mb-0.5">
                    Sign in to your account
                  </h4>
                  <p className="text-[12px] text-stone-500 font-semibold">
                    Access the portal using your credentials.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                  2
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-stone-900 leading-tight mb-0.5">
                    Set up your space
                  </h4>
                  <p className="text-[12px] text-stone-500 font-semibold">
                    Customize your profile bio and display avatar.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                  3
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-stone-900 leading-tight mb-0.5">
                    Start publishing
                  </h4>
                  <p className="text-[12px] text-stone-500 font-semibold">
                    Compose your thoughts or draft your very first story.
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Proceed CTA Button */}
            <Link
              to="/login"
              className="w-full py-3.5 bg-[#C6F547] hover:bg-[#b5e236] text-stone-900 rounded-lg font-bold text-[15px] tracking-wide active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Help & Support Footer Panel */}
          <div className="mt-8 text-left">
            <p className="text-[12px] text-white/70">
              Need help?{" "}
              <a
                href="mailto:diaryteam.official@gmail.com"
                className="text-white font-medium underline underline-offset-2 hover:text-white/90 transition-colors"
              >
                Contact us
              </a>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};