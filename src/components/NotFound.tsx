import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import DiaryLogo from "../components/DiaryLogo";

/* ------------------------------------------------------------------ */
/* Motion                                                             */
/* ------------------------------------------------------------------ */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Water animation variants
const WATER_COLORS = [
  "rgba(14, 165, 233, 0.55)", // sky-500
  "rgba(6, 182, 212, 0.55)",  // cyan-500
  "rgba(2, 132, 199, 0.55)",  // light-blue-600
  "rgba(14, 165, 233, 0.55)", // back to sky-500
];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Safe back-navigation:
   * - In-app history exists -> navigate(-1)
   * - Direct hit / empty stack -> /stories with replace
   */
  const handleGoBack = useCallback(() => {
    const state = window.history.state as { idx?: number } | null;
    const hasAppHistory =
      state != null && typeof state.idx === "number" && state.idx > 0;

    if (hasAppHistory) {
      navigate(-1);
      return;
    }
    navigate("/stories", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-stone-900 selection:text-white flex flex-col">
      {/* Ambient sky */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.45) 0%, transparent 60%),
            linear-gradient(to bottom, #7DD3FC 0%, #38BDF8 42%, #0EA5E9 100%)
          `,
        }}
      />

      {/* Soft water band + wave */}
      <div className="absolute bottom-0 left-0 w-full h-[48%] z-[1] pointer-events-none">
        {/* Animated Water Base Color */}
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundColor: WATER_COLORS }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Animated Wave Color & Gentle Bobbing */}
        <motion.svg
          viewBox="0 0 1440 200"
          className="absolute bottom-full left-0 w-full h-[72px] sm:h-[100px] md:h-[128px] origin-bottom"
          preserveAspectRatio="none"
          aria-hidden
          animate={{ scaleY: [1, 1.15, 0.9, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.path
            d="M0,96 C240,96 420,168 720,168 C1020,168 1200,96 1440,96 L1440,200 L0,200 Z"
            animate={{ fill: WATER_COLORS }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.svg>
      </div>

      {/* Header */}
      <header className="relative z-20 w-full px-6 py-6 md:px-12 md:py-8">
        <DiaryLogo />
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-16 -mt-6 md:-mt-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="w-full max-w-3xl flex flex-col items-center text-center"
        >
          {/* 404 graphic */}
          <div
            className="relative flex items-end justify-center select-none text-[100px] sm:text-[140px] md:text-[190px] lg:text-[220px] font-black leading-none tracking-tighter text-stone-800/90"
            aria-hidden
          >
            {/* Sun disc behind the 0 */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.08 }}
              className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[0.52em] h-[0.52em] rounded-full z-0 bg-[#C6F547] shadow-[0_0_60px_rgba(198,245,71,0.45)]"
            />

            {/* Explorer silhouette */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.16 }}
              className="absolute top-[-0.22em] left-1/2 -translate-x-[46%] w-[0.28em] h-[0.28em] z-20 text-stone-800"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                <path d="M48 20c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6z" />
                <path d="M52 24l14 3v4l-14-2z" />
                <path d="M46 34c-10 3-12 13-8 23l3 28h5l-1-25 5 25h6l-4-35c-1-5 2-10 2-10l7 3 3-4s-8-7-18-5z" />
                <path d="M46 34l10-1 1 4-8 2z" />
              </svg>
            </motion.div>

            <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
              4
            </span>
            <span className="relative z-10 mx-[0.04em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
              0
            </span>
            <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
              4
            </span>
          </div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.12 }}
            className="mt-2 sm:mt-4 flex flex-col items-center max-w-md"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-sm">
              Page not found
            </h1>
            <p className="mt-3 text-white/90 text-sm sm:text-base leading-relaxed max-w-sm">
              The page you’re looking for doesn’t exist, was removed, or the link might be broken.
            </p>
          </motion.div>

          {/* CTA Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.2 }}
            className="mt-8 sm:mt-10 flex flex-col items-center"
          >
            <button
              type="button"
              onClick={handleGoBack}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 min-w-[170px] bg-[#C6F547] text-stone-900 rounded-full font-bold text-[15px] tracking-wide shadow-lg shadow-black/10 hover:bg-[#b5e236] hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 transition-all duration-200"
              aria-label="Go back to previous page"
            >
              <ArrowLeft
                className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1"
                strokeWidth={2.5}
              />
              <span>Go Back</span>
            </button>

            <p className="mt-5 text-sm text-white/80">
              Or return to{" "}
              <button
                type="button"
                onClick={() => navigate("/stories", { replace: true })}
                className="text-white font-semibold underline underline-offset-4 hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm transition-colors"
              >
                Stories
              </button>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFound;