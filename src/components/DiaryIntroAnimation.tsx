
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface DiaryIntroAnimationProps {
    onComplete: () => void;
}

const WORDS = [
    {
        text: "Diary.",
        lang: "en",
        font: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        size: "clamp(4rem, 13vw, 6.5rem)",
        tracking: "-0.04em",
    },
    {
        text: "डायरी",
        lang: "hi",
        font: "'Noto Sans Devanagari', sans-serif",
        size: "clamp(3.4rem, 11vw, 5.25rem)",
        tracking: "-0.01em",
    },
    {
        text: "ଡାଏରୀ",
        lang: "or",
        font: "'Noto Sans Oriya', sans-serif",
        size: "clamp(3.4rem, 11vw, 5.25rem)",
        tracking: "-0.01em",
    },
] as const;

/** Kinetic snap ease — fast whip-in, crisp settle */
const SNAP_EASE = [0.16, 1, 0.3, 1] as const;
const EXIT_EASE = [0.7, 0, 0.84, 0] as const;

const STEP_MS = 950;
const FINAL_HOLD_MS = 800;

const FONT_URL =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@800&family=Noto+Sans+Devanagari:wght@800&family=Noto+Sans+Oriya:wght@800&display=swap";

/** Lightweight sparks that pop along the kinetic sweep */
const SPARKS = [
    { x: "14%", y: "78%", size: 6, color: "#FF8800", dx: -10, dy: 12, delay: 0.06 },
    { x: "22%", y: "84%", size: 4, color: "#FF8800", dx: -6, dy: 16, delay: 0.1 },
    { x: "44%", y: "18%", size: 5, color: "#FF8800", dx: 8, dy: -14, delay: 0.14 },
    { x: "48%", y: "26%", size: 3.5, color: "#0A0A0A", dx: 12, dy: -10, delay: 0.17 },
    { x: "78%", y: "22%", size: 5.5, color: "#FF8800", dx: 14, dy: -12, delay: 0.22 },
    { x: "86%", y: "66%", size: 4, color: "#FF8800", dx: 16, dy: 8, delay: 0.26 },
] as const;

export const DiaryIntroAnimation: React.FC<DiaryIntroAnimationProps> = ({ onComplete }) => {
    const prefersReducedMotion = useReducedMotion();
    const [visible, setVisible] = useState(true);
    const [step, setStep] = useState(0);

    const finish = useCallback(() => {
        setVisible(false);
    }, []);

    // Non-blocking bold geometric font load
    useEffect(() => {
        const id = "diary-splash-kinetic-fonts";
        if (document.getElementById(id)) return;
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = FONT_URL;
        document.head.appendChild(link);
    }, []);

    // Snappy timeline with zero dead air
    useEffect(() => {
        if (!visible) return;

        if (prefersReducedMotion) {
            const t = window.setTimeout(finish, 900);
            return () => clearTimeout(t);
        }

        const timers: number[] = [];
        for (let i = 1; i < WORDS.length; i++) {
            timers.push(window.setTimeout(() => setStep(i), i * STEP_MS));
        }
        timers.push(
            window.setTimeout(finish, (WORDS.length - 1) * STEP_MS + FINAL_HOLD_MS)
        );

        return () => timers.forEach(clearTimeout);
    }, [visible, prefersReducedMotion, finish]);

    const current = WORDS[step];

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {visible && (
                <motion.div
                    role="button"
                    tabIndex={0}
                    aria-label="Skip intro"
                    onClick={finish}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                            finish();
                        }
                    }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none cursor-pointer outline-none bg-white"
                    style={{ willChange: "opacity, transform" }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.03 }}
                    transition={{ duration: 0.38, ease: SNAP_EASE }}
                >
                    <div className="relative flex items-center justify-center w-full max-w-[90vw] h-[160px] sm:h-[200px]">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={current.lang}
                                className="relative inline-flex items-center justify-center px-6 py-4"
                                initial={{ opacity: 1 }}
                                exit={
                                    prefersReducedMotion
                                        ? { opacity: 0 }
                                        : { opacity: 0, y: -18, scale: 0.96 }
                                }
                                transition={{ duration: 0.24, ease: EXIT_EASE }}
                            >
                                {/* Layer 1: Leading vibrant orange kinetic trail */}
                                <motion.span
                                    aria-hidden="true"
                                    className="pointer-events-none select-none leading-[1.15] text-[#FF8800]"
                                    style={{
                                        fontFamily: current.font,
                                        fontSize: current.size,
                                        fontWeight: 800,
                                        letterSpacing: current.tracking,
                                        willChange: "clip-path, transform",
                                    }}
                                    initial={
                                        prefersReducedMotion
                                            ? { opacity: 0 }
                                            : {
                                                clipPath: "inset(0% 100% 0% 0%)",
                                                x: -10,
                                            }
                                    }
                                    animate={
                                        prefersReducedMotion
                                            ? { opacity: 1 }
                                            : {
                                                clipPath: "inset(0% 0% 0% 0%)",
                                                x: 0,
                                            }
                                    }
                                    transition={{
                                        duration: 0.48,
                                        ease: SNAP_EASE,
                                    }}
                                >
                                    {current.text}
                                </motion.span>

                                {/* Layer 2: Solid geometric black fill chasing the orange trail */}
                                <motion.h1
                                    lang={current.lang}
                                    className="absolute inset-0 flex items-center justify-center m-0 leading-[1.15] text-[#0A0A0A]"
                                    style={{
                                        fontFamily: current.font,
                                        fontSize: current.size,
                                        fontWeight: 800,
                                        letterSpacing: current.tracking,
                                        willChange: "clip-path, transform",
                                    }}
                                    initial={
                                        prefersReducedMotion
                                            ? { opacity: 0 }
                                            : {
                                                clipPath: "inset(0% 100% 0% 0%)",
                                                x: -6,
                                            }
                                    }
                                    animate={
                                        prefersReducedMotion
                                            ? { opacity: 1 }
                                            : {
                                                clipPath: "inset(0% 0% 0% 0%)",
                                                x: 0,
                                            }
                                    }
                                    transition={{
                                        duration: 0.48,
                                        delay: 0.11,
                                        ease: SNAP_EASE,
                                    }}
                                >
                                    {current.text}
                                </motion.h1>

                                {/* Layer 3: Kinetic orange sweep arcs & spark dots */}
                                {!prefersReducedMotion && (
                                    <>
                                        {/* Top-right sweeping kinetic arc */}
                                        <svg
                                            className="pointer-events-none absolute -top-1 right-2 w-12 h-12 overflow-visible"
                                            viewBox="0 0 48 48"
                                            fill="none"
                                        >
                                            <motion.path
                                                d="M 6 30 A 20 20 0 0 1 38 14"
                                                stroke="#FF8800"
                                                strokeWidth="4.5"
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{
                                                    pathLength: [0, 1, 0],
                                                    opacity: [0, 1, 0],
                                                }}
                                                transition={{
                                                    duration: 0.55,
                                                    delay: 0.12,
                                                    ease: SNAP_EASE,
                                                }}
                                            />
                                        </svg>

                                        {/* Bottom-left sweeping kinetic streak */}
                                        <svg
                                            className="pointer-events-none absolute -bottom-1 left-2 w-12 h-12 overflow-visible"
                                            viewBox="0 0 48 48"
                                            fill="none"
                                        >
                                            <motion.path
                                                d="M 42 18 A 20 20 0 0 1 10 34"
                                                stroke="#FF8800"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{
                                                    pathLength: [0, 1, 0],
                                                    opacity: [0, 1, 0],
                                                }}
                                                transition={{
                                                    duration: 0.5,
                                                    delay: 0.04,
                                                    ease: SNAP_EASE,
                                                }}
                                            />
                                        </svg>

                                        {/* Flying spark particles */}
                                        {SPARKS.map((s, idx) => (
                                            <motion.span
                                                key={idx}
                                                className="pointer-events-none absolute rounded-full"
                                                style={{
                                                    left: s.x,
                                                    top: s.y,
                                                    width: s.size,
                                                    height: s.size,
                                                    backgroundColor: s.color,
                                                    willChange: "transform, opacity",
                                                }}
                                                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                                animate={{
                                                    opacity: [0, 1, 0],
                                                    scale: [0.4, 1.15, 0],
                                                    x: s.dx,
                                                    y: s.dy,
                                                }}
                                                transition={{
                                                    duration: 0.52,
                                                    delay: s.delay,
                                                    ease: SNAP_EASE,
                                                }}
                                            />
                                        ))}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};