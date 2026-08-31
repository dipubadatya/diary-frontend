import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DiarySplashProps {
  onComplete: () => void;
}

const WORDS = [
  {
    text: "Diary.",
    font: "'Dancing Script', cursive",
    size: "clamp(4.25rem, 13vw, 6.5rem)",
    bg: "#1E3A8A", // Deep Cinematic Blue
  },
  {
    text: "डायरी",
    font: "'Noto Sans Devanagari', sans-serif",
    size: "clamp(3.5rem, 11vw, 5.25rem)",
    bg: "#581C87", // Deep Purple
  },
  {
    text: "ଡାୟରୀ",
    font: "'Noto Sans Oriya', sans-serif",
    size: "clamp(3.5rem, 11vw, 5.25rem)",
    bg: "#92400E", // Cinematic Amber
  },
] as const;

/** Shared easing — snappy but soft */
const EASE = [0.22, 1, 0.36, 1] as const;

/** How long each word stays fully visible (ms) */
const HOLD = 1200;
/** Crossfade overlap — next word starts before previous fully gone */
const FADE = 600;
/** Time from step start → next step (hold + partial fade) */
const STEP = HOLD + FADE * 0.45;

export const DiarySplash: React.FC<DiarySplashProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  const finish = useCallback(() => {
    setVisible(false);
  }, []);

  // Dynamically load required fonts
  useEffect(() => {
    const id = "diary-splash-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Noto+Sans+Devanagari:wght@700&family=Noto+Sans+Oriya:wght@700&display=swap";
    document.head.appendChild(link);
  }, []);

  // Continuous step ladder — no dead air between languages
  useEffect(() => {
    if (!visible) return;

    const timers: number[] = [];
    for (let i = 1; i < WORDS.length; i++) {
      timers.push(window.setTimeout(() => setStep(i), i * STEP));
    }
    
    // After last word holds, trigger the exit callback
    timers.push(
      window.setTimeout(finish, WORDS.length * STEP + HOLD * 0.5)
    );

    return () => timers.forEach(clearTimeout);
  }, [visible, finish]);

  const current = WORDS[step];

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
          initial={{ opacity: 1 }}
          animate={{ backgroundColor: current.bg }}
          exit={{ opacity: 0 }}
          transition={{
            backgroundColor: { duration: 1, ease: EASE },
            opacity: { duration: 0.6, ease: EASE },
          }}
        >
          {/* Cinematic Light wash background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 32% 42%, rgba(255,255,255,0.15) 0%, transparent 52%),
                radial-gradient(ellipse at 78% 68%, rgba(255,255,255,0.08) 0%, transparent 48%)
              `,
            }}
          />

          {/* Soft center glow */}
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none"
            animate={{
              opacity: 0.25,
              scale: [0.9, 1.1, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            style={{ background: "rgba(255,255,255,0.6)" }}
          />

          {/* Language stage: stacked absolute so crossfade is seamless */}
          <div className="relative z-10 w-full max-w-[90vw] h-[140px] flex items-center justify-center">
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={step}
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0, y: 15, filter: "blur(12px)", scale: 0.95 }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, y: -15, filter: "blur(12px)", scale: 1.05 }}
                transition={{
                  duration: FADE / 1000,
                  ease: EASE,
                }}
              >
                <h1
                  className="text-white text-center leading-none px-4"
                  style={{
                    fontFamily: current.font,
                    fontSize: current.size,
                    fontWeight: 700,
                    textShadow: "0 8px 40px rgba(0,0,0,0.25)",
                  }}
                >
                  {current.text}
                </h1>

                {/* Underline accent that changes width based on the word */}
                <motion.div
                  className="mt-4 h-[2px] rounded-full bg-white/80"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: step === 0 ? 120 : 90, opacity: 1 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Loading progress bars synced to the word hold time */}
          <div className="relative z-10 mt-16 flex items-center gap-3">
            {WORDS.map((_, i) => (
              <div
                key={i}
                className="h-[3px] w-10 rounded-full bg-white/20 overflow-hidden"
              >
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{ transformOrigin: "left center" }}
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: i < step ? 1 : i === step ? 1 : 0,
                  }}
                  transition={
                    i === step
                      ? { duration: STEP / 1000, ease: "linear" }
                      : { duration: 0.3, ease: EASE }
                  }
                />
              </div>
            ))}
          </div>

          <motion.p
            className="relative z-10 mt-8 text-white/60 text-xs uppercase tracking-[0.2em] font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Opening your diary
          </motion.p>

          {/* Skip Button */}
          <button
            type="button"
            onClick={finish}
            className="absolute bottom-8 right-8 z-50 text-white/40 hover:text-white text-xs uppercase font-semibold tracking-wider transition-colors"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
