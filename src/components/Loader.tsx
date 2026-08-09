// import React from 'react';
// import { motion } from 'framer-motion';

// export const Loader: React.FC = () => {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
//       <div className="relative w-16 h-16">
//         <motion.span
//           className="absolute inset-0 border-4 border-indigo-200 rounded-full"
//           style={{ borderTopColor: 'rgb(99, 102, 241)' }}
//           animate={{ rotate: 360 }}
//           transition={{
//             repeat: Infinity,
//             duration: 1,
//             ease: 'linear',
//           }}
//         />
//         <motion.span
//           className="absolute inset-2 border-4 border-cyan-100 rounded-full"
//           style={{ borderBottomColor: 'rgb(6, 182, 212)' }}
//           animate={{ rotate: -360 }}
//           transition={{
//             repeat: Infinity,
//             duration: 1.5,
//             ease: 'linear',
//           }}
//         />
//       </div>
//       <motion.p
//         className="text-sm font-medium text-slate-500 dark:text-slate-400 font-sans tracking-wide"
//         animate={{ opacity: [0.4, 1, 0.4] }}
//         transition={{
//           repeat: Infinity,
//           duration: 1.5,
//           ease: 'easeInOut',
//         }}
//       >
//         Loading your story...
//       </motion.p>
//     </div>
//   );
// };

// export const FullPageLoader: React.FC = () => {
//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
//       <Loader />
//     </div>
//   );
// };
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const Loader: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const ease = [0.4, 0, 0.2, 1] as const;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="flex min-h-[260px] flex-col items-center justify-center gap-5 px-4 sm:px-6"
    >
      <span className="sr-only">Drafting your story</span>

      <div className="relative aspect-[340/220] w-[min(88vw,340px)]">
        {/* soft ambient tint */}
        <motion.div
          className="absolute inset-x-[18%] top-[10%] bottom-[26%] rounded-full bg-gradient-to-r from-indigo-200/35 via-sky-200/30 to-violet-200/35 blur-2xl dark:from-indigo-500/10 dark:via-sky-500/10 dark:to-violet-500/10"
          animate={
            reduceMotion
              ? {}
              : {
                  opacity: [0.5, 0.75, 0.5],
                  scale: [1, 1.03, 1],
                }
          }
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* shadow */}
        <motion.div
          className="absolute bottom-[8%] left-1/2 h-[7%] w-[56%] -translate-x-1/2 rounded-full bg-slate-900/10 blur-xl dark:bg-black/25"
          animate={
            reduceMotion
              ? {}
              : {
                  scaleX: [0.96, 1.04, 0.96],
                  opacity: [0.14, 0.22, 0.14],
                }
          }
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="absolute inset-0 transform-gpu"
          style={{ willChange: 'transform' }}
          animate={reduceMotion ? {} : { y: [0, -4, 0] }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* paper */}
          <div className="absolute left-[10%] right-[10%] top-[16%] bottom-[20%] overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-white/95 to-slate-50/95 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:from-slate-900/95 dark:to-slate-950/95">
            <div className="absolute inset-x-0 top-0 h-px bg-white/70 dark:bg-white/10" />
            <div className="absolute left-[12%] top-[18%] bottom-[18%] w-px bg-rose-200/70 dark:bg-rose-400/25" />

            {/* guide lines */}
            <div className="absolute left-[24%] right-[18%] top-[38%] h-px bg-slate-200 dark:bg-slate-700" />
            <div className="absolute left-[24%] right-[16%] top-[54%] h-px bg-slate-200 dark:bg-slate-700" />
            <div className="absolute left-[24%] right-[30%] top-[70%] h-px bg-slate-200 dark:bg-slate-700" />

            {/* smooth writing stroke */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="loader-ink" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              <motion.path
                d="M24 54 C 35 53, 47 55, 59 54 S 73 53, 82 54"
                fill="none"
                stroke="url(#loader-ink)"
                strokeWidth="1.8"
                strokeLinecap="round"
                initial={false}
                animate={
                  reduceMotion
                    ? { pathLength: 1, opacity: 0.9 }
                    : {
                        pathLength: [0.02, 1, 1, 0.02],
                        opacity: [0.15, 1, 1, 0],
                      }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 2.8,
                        repeat: Infinity,
                        repeatDelay: 0.12,
                        ease,
                        times: [0, 0.72, 0.84, 1],
                      }
                }
              />
            </svg>

            {/* pencil */}
            <motion.div
              className="absolute left-[24%] top-[47.5%] h-[14%] w-[39%] origin-left transform-gpu"
              style={{ willChange: 'transform, opacity' }}
              animate={
                reduceMotion
                  ? { x: 0, y: 0, rotate: -8, opacity: 1 }
                  : {
                      x: ['0%', '116%', '116%', '0%'],
                      y: [0, -1, -1, 0],
                      rotate: [-8, -6, -6, -8],
                      opacity: [1, 1, 0, 0],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 2.8,
                      repeat: Infinity,
                      repeatDelay: 0.12,
                      ease,
                      times: [0, 0.72, 0.84, 1],
                    }
              }
            >
              {/* eraser */}
              <div className="absolute left-[2%] top-1/2 h-[56%] w-[12%] -translate-y-1/2 rounded-l-full rounded-r-[4px] bg-rose-400" />

              {/* metal band */}
              <div className="absolute left-[13.5%] top-1/2 h-[56%] w-[7%] -translate-y-1/2 bg-slate-300 dark:bg-slate-500" />

              {/* body */}
              <div className="absolute left-[20%] top-1/2 h-[56%] w-[60%] -translate-y-1/2 rounded-[4px] bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 shadow-[0_10px_18px_-14px_rgba(234,179,8,0.85)]" />

              {/* shine */}
              <div className="absolute left-[40%] top-[28%] h-[10%] w-[28%] rounded-full bg-white/35" />

              {/* wooden tip */}
              <div className="absolute left-[80%] top-1/2 -translate-y-1/2 border-y-[10px] border-l-[14px] border-y-transparent border-l-amber-200 dark:border-l-amber-100" />

              {/* graphite tip */}
              <div className="absolute left-[91%] top-1/2 -translate-y-1/2 border-y-[5px] border-l-[8px] border-y-transparent border-l-slate-700 dark:border-l-slate-200" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.p
        className="text-sm font-medium tracking-[0.02em] text-slate-600 dark:text-slate-300"
        animate={reduceMotion ? {} : { opacity: [0.55, 1, 0.55] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        Drafting your story
      </motion.p>
    </motion.div>
  );
};

export const FullPageLoader: React.FC = () => {
  const ease = [0.4, 0, 0.2, 1] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-md dark:bg-slate-950/80"
    >
      <Loader />
    </motion.div>
  );
};