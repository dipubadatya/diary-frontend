// import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import { useSocket } from "../contexts/SocketContext";
// import api from "../services/api";
// import toast from "react-hot-toast";
// import moment from "moment";
// import { ErrorCard } from "../components/ErrorCard";

// interface Comment {
//   _id: string;
//   comment: string;
//   gif?: string;
//   author: {
//     _id: string;
//     username: string;
//     name: string;
//     image?: { url: string };
//   };
//   timeStamp: string;
//   parentId?: string | null;
//   likes?: string[];
//   likesCount?: number;
//   editedAt?: string;
// }

// interface Story {
//   _id: string;
//   title: string;
//   story: string;
//   category: string;
//   image?: { url: string; filename: string };
//   owner: {
//     _id: string;
//     username: string;
//     name: string;
//     image?: { url: string };
//   };
//   views: string[];
//   likedBy: string[];
//   likesCounts: number;
//   comments: Comment[];
//   timeStamp: string;
// }

// interface LikedByUser {
//   _id: string;
//   username: string;
//   name?: string;
//   image?: { url: string };
// }

// type FontSize = "sm" | "base" | "lg" | "xl";

// // ─── Languages ────────────────────────────────────────────────────────────────
// const LANGUAGES = [
//   { code: "en", name: "English", flag: "🇺🇸" },
//   { code: "es", name: "Spanish", flag: "🇪🇸" },
//   { code: "fr", name: "French", flag: "🇫🇷" },
//   { code: "de", name: "German", flag: "🇩🇪" },
//   { code: "pt", name: "Portuguese", flag: "🇵🇹" },
//   { code: "it", name: "Italian", flag: "🇮🇹" },
//   { code: "hi", name: "Hindi", flag: "🇮🇳" },
//   { code: "ar", name: "Arabic", flag: "🇸🇦" },
//   { code: "ja", name: "Japanese", flag: "🇯🇵" },
//   { code: "zh", name: "Chinese", flag: "🇨🇳" },
// ];

// // ─── Global Styles ────────────────────────────────────────────────────────────
// const globalStyles = `
//   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap');

//   *, *::before, *::after { box-sizing: border-box; }

//   .font-serif  { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; }
//   .font-sans   { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

//   html { scroll-behavior: smooth; }

//   .no-scrollbar::-webkit-scrollbar { display: none; }
//   .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

//   /* ── Reading Progress ── */
//   .read-progress-bar {
//     position: fixed;
//     top: 0; left: 0; right: 0;
//     height: 3px;
//     background: linear-gradient(90deg, #f97316, #ef4444);
//     transform-origin: left;
//     z-index: 9999;
//     transition: width .1s linear;
//   }

//   /* ── Story Rich Content ──────────────────────────────────────────────────── */
//   /*
//     This targets the actual HTML output from your rich text editor (Quill/TipTap/etc).
//     Every element is carefully styled to match what the editor produces.
//   */
//   .story-content {
//     font-family: 'Inter', system-ui, sans-serif;
//     color: #1a1a2e;
//     line-height: 1.92;
//     word-break: break-word;
//     overflow-wrap: break-word;
//   }

//   .dark .story-content { color: #e2e8f0; }

//   /* Paragraphs */
//   .story-content p {
//     margin: 0 0 1.5em 0;
//     line-height: 1.92;
//   }
//   .story-content p:last-child { margin-bottom: 0; }
//   .story-content p:empty { display: none; }

//   /* Headings */
//   .story-content h1,
//   .story-content h2,
//   .story-content h3,
//   .story-content h4,
//   .story-content h5,
//   .story-content h6 {
//     font-family: 'Playfair Display', Georgia, serif;
//     font-weight: 700;
//     color: #0f0f1a;
//     line-height: 1.2;
//     margin: 2em 0 .6em;
//     letter-spacing: -.01em;
//   }
//   .dark .story-content h1,
//   .dark .story-content h2,
//   .dark .story-content h3,
//   .dark .story-content h4,
//   .dark .story-content h5,
//   .dark .story-content h6 { color: #f8fafc; }

//   .story-content h1 { font-size: 2em; }
//   .story-content h2 { font-size: 1.55em; }
//   .story-content h3 { font-size: 1.3em; }
//   .story-content h4 { font-size: 1.1em; }

//   /* Inline */
//   .story-content strong, .story-content b { font-weight: 700; color: #0f0f1a; }
//   .dark .story-content strong, .dark .story-content b { color: #f1f5f9; }
//   .story-content em, .story-content i { font-style: italic; }
//   .story-content u  { text-decoration: underline; text-underline-offset: 3px; }
//   .story-content s  { text-decoration: line-through; opacity: .65; }
//   .story-content mark { background: #fef08a; color: #713f12; border-radius: 2px; padding: 0 2px; }
//   .dark .story-content mark { background: #854d0e; color: #fef9c3; }

//   /* Links */
//   .story-content a {
//     color: #f97316;
//     text-decoration: underline;
//     text-underline-offset: 3px;
//     transition: color .15s;
//   }
//   .story-content a:hover { color: #ea580c; }

//   /* Lists */
//   .story-content ul,
//   .story-content ol {
//     margin: 1em 0 1.5em;
//     padding-left: 1.75rem;
//   }
//   .story-content ul { list-style-type: disc; }
//   .story-content ol { list-style-type: decimal; }
//   .story-content li {
//     margin-bottom: .5em;
//     line-height: 1.8;
//   }
//   .story-content li > ul,
//   .story-content li > ol { margin: .35em 0; }

//   /* Quill specific list classes */
//   .story-content .ql-indent-1 { padding-left: 2em; }
//   .story-content .ql-indent-2 { padding-left: 4em; }
//   .story-content .ql-indent-3 { padding-left: 6em; }

//   /* Blockquote */
//   .story-content blockquote {
//     margin: 2em 0;
//     padding: 1rem 1.25rem;
//     border-left: 4px solid #f97316;
//     background: #fff7ed;
//     border-radius: 0 12px 12px 0;
//     font-style: italic;
//     color: #7c3516;
//     line-height: 1.8;
//     position: relative;
//   }
//   .dark .story-content blockquote {
//     background: rgba(249,115,22,.08);
//     color: #fed7aa;
//     border-left-color: #f97316;
//   }
//   .story-content blockquote::before {
//     content: '"';
//     position: absolute;
//     top: -10px; left: 14px;
//     font-size: 4rem;
//     color: #f97316;
//     opacity: .2;
//     font-family: Georgia, serif;
//     line-height: 1;
//   }

//   /* Code */
//   .story-content code {
//     font-family: 'Fira Code', 'Cascadia Code', 'Courier New', monospace;
//     background: #f1f5f9;
//     color: #be123c;
//     padding: .1em .4em;
//     border-radius: 5px;
//     font-size: .875em;
//   }
//   .dark .story-content code { background: #1e293b; color: #fb7185; }

//   .story-content pre {
//     background: #0f172a;
//     color: #e2e8f0;
//     border-radius: 12px;
//     padding: 1.25rem 1.5rem;
//     overflow-x: auto;
//     margin: 1.5em 0;
//     font-size: .875em;
//     line-height: 1.7;
//   }
//   .story-content pre code { background: none; color: inherit; padding: 0; font-size: inherit; }

//   /* Images */
//   .story-content img {
//     max-width: 100%;
//     height: auto;
//     border-radius: 14px;
//     margin: 1.5em auto;
//     display: block;
//     box-shadow: 0 4px 24px rgba(0,0,0,.08);
//   }

//   /* HR */
//   .story-content hr {
//     border: none;
//     border-top: 2px solid #f3f4f6;
//     margin: 2.5em 0;
//   }
//   .dark .story-content hr { border-top-color: #1f2937; }

//   /* Tables */
//   .story-content table {
//     width: 100%;
//     border-collapse: collapse;
//     margin: 1.5em 0;
//     font-size: .9em;
//     overflow: hidden;
//     border-radius: 10px;
//     border: 1px solid #e5e7eb;
//   }
//   .dark .story-content table { border-color: #374151; }
//   .story-content th {
//     background: #f9fafb;
//     font-weight: 700;
//     padding: .75rem 1rem;
//     text-align: left;
//     border-bottom: 2px solid #e5e7eb;
//   }
//   .dark .story-content th { background: #1f2937; border-bottom-color: #374151; }
//   .story-content td {
//     padding: .65rem 1rem;
//     border-bottom: 1px solid #f3f4f6;
//   }
//   .dark .story-content td { border-bottom-color: #1f2937; }

//   /* Text align (Quill classes) */
//   .story-content .ql-align-center  { text-align: center; }
//   .story-content .ql-align-right   { text-align: right; }
//   .story-content .ql-align-justify { text-align: justify; }

//   /* Quill video embed */
//   .story-content .ql-video {
//     width: 100%;
//     aspect-ratio: 16/9;
//     border-radius: 14px;
//     border: none;
//     margin: 1.5em 0;
//     display: block;
//   }

//   /* Font sizes */
//   .fs-sm   { font-size: 15px !important; }
//   .fs-base { font-size: 17px !important; }
//   .fs-lg   { font-size: 19px !important; }
//   .fs-xl   { font-size: 22px !important; }

//   @media (max-width: 640px) {
//     .fs-sm   { font-size: 14px !important; }
//     .fs-base { font-size: 16px !important; }
//     .fs-lg   { font-size: 18px !important; }
//     .fs-xl   { font-size: 20px !important; }
//   }

//   /* ── Waveform ── */
//   @keyframes waveBar {
//     0%,100% { transform: scaleY(1);   }
//     50%      { transform: scaleY(1.7); }
//   }
//   .wave-anim { animation: waveBar 0.65s ease-in-out infinite; transform-origin: center; }

//   /* ── Animations ── */
//   @keyframes fadeUp {
//     from { opacity: 0; transform: translateY(16px); }
//     to   { opacity: 1; transform: translateY(0);    }
//   }
//   @keyframes scaleIn {
//     from { opacity: 0; transform: scale(.93); }
//     to   { opacity: 1; transform: scale(1);   }
//   }
//   @keyframes slideUp {
//     from { opacity: 0; transform: translateY(24px); }
//     to   { opacity: 1; transform: translateY(0);    }
//   }
//   @keyframes likePop {
//     0%   { transform: scale(1);    }
//     35%  { transform: scale(1.45); }
//     65%  { transform: scale(.88);  }
//     100% { transform: scale(1);    }
//   }

//   .anim-fade-up  { animation: fadeUp  .5s cubic-bezier(.16,1,.3,1) both; }
//   .anim-scale-in { animation: scaleIn .22s cubic-bezier(.16,1,.3,1) both; }
//   .anim-slide-up { animation: slideUp .3s cubic-bezier(.16,1,.3,1) both;  }
//   .like-pop      { animation: likePop .38s cubic-bezier(.36,.07,.19,.97);  }

//   /* ── Press effect ── */
//   .press { transition: transform .12s ease, box-shadow .12s ease; cursor: pointer; }
//   .press:hover  { transform: translateY(-1px); }
//   .press:active { transform: scale(.96); }

//   /* ── Textarea auto-grow ── */
//   textarea { field-sizing: content; }
// `;

// // ─── Reading Progress ─────────────────────────────────────────────────────────
// const ReadingProgress: React.FC = () => {
//   const [w, setW] = useState(0);
//   useEffect(() => {
//     const fn = () => {
//       const el = document.documentElement;
//       const top = el.scrollTop || document.body.scrollTop;
//       const h = el.scrollHeight - el.clientHeight;
//       setW(h > 0 ? Math.min(100, (top / h) * 100) : 0);
//     };
//     window.addEventListener("scroll", fn, { passive: true });
//     return () => window.removeEventListener("scroll", fn);
//   }, []);
//   return <div className="read-progress-bar" style={{ width: `${w}%` }} />;
// };

// // ─── Voice picker ─────────────────────────────────────────────────────────────
// function getBestVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
//   const priority = [
//     /google.*english/i,
//     /microsoft.*aria/i,
//     /microsoft.*jenny/i,
//     /microsoft.*guy/i,
//     /microsoft.*zira/i,
//     /samantha/i,
//     /karen/i,
//     /daniel/i,
//     /moira/i,
//     /ava/i,
//     /natural/i,
//     /neural/i,
//     /premium/i,
//   ];
//   const en = all.filter((v) => v.lang.startsWith("en"));
//   const good = en.filter((v) => priority.some((rx) => rx.test(v.name)));
//   return good.length ? good : en.slice(0, 6);
// }

// // ─── Waveform ─────────────────────────────────────────────────────────────────
// const Waveform: React.FC<{
//   progress: number;
//   playing: boolean;
//   onSeek: (p: number) => void;
// }> = ({ progress, playing, onSeek }) => {
//   const bars = useMemo(
//     () => Array.from({ length: 52 }, () => 4 + Math.random() * 24),
//     []
//   );
//   const ref = useRef<HTMLDivElement>(null);

//   const handleClick = (e: React.MouseEvent) => {
//     if (!ref.current) return;
//     const rect = ref.current.getBoundingClientRect();
//     onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
//   };

//   return (
//     <div
//       ref={ref}
//       onClick={handleClick}
//       className="flex-1 h-10 flex items-center gap-[1.5px] cursor-pointer select-none overflow-hidden"
//     >
//       {bars.map((h, i) => {
//         const frac = i / bars.length;
//         const active = frac <= progress;
//         const near = playing && Math.abs(frac - progress) < 0.045;
//         return (
//           <span
//             key={i}
//             className={near ? "wave-anim" : ""}
//             style={{
//               display: "inline-block",
//               width: 3,
//               flexShrink: 0,
//               height: h,
//               borderRadius: 3,
//               background: active ? "#f97316" : "#d1d5db",
//               opacity: active ? 1 : 0.4,
//               transformOrigin: "center",
//             }}
//           />
//         );
//       })}
//     </div>
//   );
// };

// // ─── Audio Player ─────────────────────────────────────────────────────────────
// const AudioPlayer: React.FC<{ text: string }> = ({ text }) => {
//   const [playing, setPlaying] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [curTime, setCurTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [rate, setRate] = useState(1);
//   const [showSet, setShowSet] = useState(false);
//   const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
//   const [voiceName, setVoiceName] = useState("");
//   const [supported, setSupported] = useState(true);

//   const startRef = useRef(0);
//   const elapsedRef = useRef(0);
//   const rafRef = useRef<number>();

//   useEffect(() => {
//     if (!("speechSynthesis" in window)) { setSupported(false); return; }
//     const load = () => {
//       const all = window.speechSynthesis.getVoices();
//       if (!all.length) return;
//       const best = getBestVoices(all);
//       setVoices(best);
//       setVoiceName((p) => {
//         if (p && best.find((v) => v.name === p)) return p;
//         return best[0]?.name ?? "";
//       });
//     };
//     load();
//     window.speechSynthesis.onvoiceschanged = load;
//     return () => {
//       window.speechSynthesis.cancel();
//       cancelAnimationFrame(rafRef.current!);
//     };
//   }, []);

//   useEffect(() => {
//     const words = text.trim().split(/\s+/).length;
//     setDuration(Math.max((words / 155) * 60 / rate, 1));
//   }, [text, rate]);

//   useEffect(() => () => { window.speechSynthesis.cancel(); cancelAnimationFrame(rafRef.current!); }, []);

//   const fmt = (s: number) =>
//     !isFinite(s) || s < 0
//       ? "0:00"
//       : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

//   const stopAll = useCallback(() => {
//     window.speechSynthesis.cancel();
//     setPlaying(false); setProgress(0); setCurTime(0);
//     elapsedRef.current = 0;
//     cancelAnimationFrame(rafRef.current!);
//   }, []);

//   const tick = useCallback(() => {
//     const elapsed = elapsedRef.current + (Date.now() - startRef.current) / 1000;
//     const capped = Math.min(elapsed, duration);
//     setCurTime(capped);
//     setProgress(Math.min(elapsed / duration, 1));
//     if (elapsed >= duration) { stopAll(); return; }
//     rafRef.current = requestAnimationFrame(tick);
//   }, [duration, stopAll]);

//   const speak = useCallback(
//     (startChar = 0) => {
//       if (!supported || !text) return;
//       window.speechSynthesis.cancel();
//       const slice = text.substring(startChar).trim();
//       if (!slice) return;
//       const utt = new SpeechSynthesisUtterance(slice);
//       utt.rate = rate; utt.pitch = 1; utt.volume = 1;
//       const voice = voices.find((v) => v.name === voiceName);
//       if (voice) utt.voice = voice;
//       utt.onend = stopAll;
//       utt.onerror = stopAll;
//       window.speechSynthesis.speak(utt);
//       startRef.current = Date.now();
//       setPlaying(true);
//       cancelAnimationFrame(rafRef.current!);
//       rafRef.current = requestAnimationFrame(tick);
//     },
//     [supported, text, rate, voices, voiceName, tick, stopAll]
//   );

//   const handlePlay = () => {
//     if (!supported) { toast.error("Text-to-speech not supported on this browser"); return; }
//     if (playing) {
//       window.speechSynthesis.pause();
//       elapsedRef.current += (Date.now() - startRef.current) / 1000;
//       setPlaying(false);
//       cancelAnimationFrame(rafRef.current!);
//     } else if (window.speechSynthesis.paused) {
//       window.speechSynthesis.resume();
//       startRef.current = Date.now();
//       setPlaying(true);
//       rafRef.current = requestAnimationFrame(tick);
//     } else {
//       elapsedRef.current = 0; setProgress(0); setCurTime(0);
//       speak(0);
//     }
//   };

//   const handleSeek = (p: number) => {
//     const words = text.split(/\s+/);
//     const wordIdx = Math.floor(p * words.length);
//     const startChar = words.slice(0, wordIdx).join(" ").length;
//     elapsedRef.current = p * duration;
//     setProgress(p); setCurTime(p * duration);
//     if (playing) speak(startChar);
//   };

//   if (!supported) return (
//     <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900 px-4 py-3 text-center text-xs text-neutral-400">
//       Audio not supported in this browser
//     </div>
//   );

//   return (
//     <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
//       <div className="flex items-center gap-3 px-4 py-3.5">
//         {/* Play/Pause */}
//         <button
//           onClick={handlePlay}
//           aria-label={playing ? "Pause" : "Play"}
//           className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center shadow-md press"
//           style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}
//         >
//           {playing
//             ? <i className="ri-pause-fill text-xl text-white" />
//             : <i className="ri-play-fill text-xl text-white" style={{ marginLeft: 2 }} />
//           }
//         </button>

//         <div className="flex flex-col flex-1 min-w-0 gap-1">
//           <div className="flex items-center justify-between">
//             <span className="text-[10px] font-bold tracking-[.08em] text-neutral-400 uppercase">
//               Listen to story
//             </span>
//             <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">
//               {playing || progress > 0 ? fmt(curTime) : fmt(duration)}
//             </span>
//           </div>
//           <Waveform progress={progress} playing={playing} onSeek={handleSeek} />
//         </div>

//         <button
//           onClick={() => setShowSet((s) => !s)}
//           aria-label="Settings"
//           className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-colors press ${showSet
//               ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500"
//               : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
//             }`}
//         >
//           <i className="ri-equalizer-2-line text-sm" />
//         </button>
//       </div>

//       {showSet && (
//         <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3 space-y-3 anim-slide-up">
//           <div className="flex items-center justify-between gap-2 flex-wrap">
//             <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Speed</span>
//             <div className="flex gap-1.5">
//               {[0.75, 1, 1.25, 1.5, 2].map((r) => (
//                 <button
//                   key={r}
//                   onClick={() => { setRate(r); if (playing) stopAll(); }}
//                   className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${rate === r
//                       ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
//                       : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
//                     }`}
//                 >
//                   {r}×
//                 </button>
//               ))}
//             </div>
//           </div>
//           {voices.length > 0 && (
//             <div className="flex items-center justify-between gap-3">
//               <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex-shrink-0">
//                 Voice
//               </span>
//               <select
//                 value={voiceName}
//                 onChange={(e) => { setVoiceName(e.target.value); if (playing) stopAll(); }}
//                 className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-1.5 outline-none flex-1 max-w-[220px] text-neutral-700 dark:text-neutral-200"
//               >
//                 {voices.map((v) => (
//                   <option key={v.name} value={v.name}>
//                     {v.name.length > 30 ? v.name.slice(0, 30) + "…" : v.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// // ─── Translate Modal ──────────────────────────────────────────────────────────
// const TranslateModal: React.FC<{
//   open: boolean;
//   onClose: () => void;
//   onSelect: (code: string) => void;
//   currentLang: string;
// }> = ({ open, onClose, onSelect, currentLang }) => {
//   if (!open) return null;
//   return (
//     <div
//       className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white dark:bg-neutral-900 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 anim-slide-up max-h-[88vh] overflow-y-auto no-scrollbar"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mb-5 sm:hidden" />
//         <div className="flex items-center justify-between mb-5">
//           <div>
//             <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Translate</h3>
//             <p className="text-xs text-neutral-400 mt-0.5">Read in your preferred language</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 press"
//           >
//             <i className="ri-close-line text-lg" />
//           </button>
//         </div>
//         <div className="grid grid-cols-2 gap-2">
//           {LANGUAGES.map((lang) => (
//             <button
//               key={lang.code}
//               onClick={() => { onSelect(lang.code); onClose(); }}
//               className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 transition-all text-left press ${currentLang === lang.code
//                   ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10"
//                   : "border-transparent bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
//                 }`}
//             >
//               <span className="text-2xl">{lang.flag}</span>
//               <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate flex-1">
//                 {lang.name}
//               </span>
//               {currentLang === lang.code && (
//                 <i className="ri-check-line text-orange-500 flex-shrink-0" />
//               )}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── Font Size Modal ──────────────────────────────────────────────────────────
// const FONT_OPTIONS = [
//   { key: "sm" as FontSize, label: "Small", desc: "Compact reading", size: "15px" },
//   { key: "base" as FontSize, label: "Default", desc: "Balanced & clear", size: "17px" },
//   { key: "lg" as FontSize, label: "Large", desc: "Easy on the eyes", size: "20px" },
//   { key: "xl" as FontSize, label: "Extra Large", desc: "Maximum comfort", size: "24px" },
// ];

// const FontSizeModal: React.FC<{
//   open: boolean;
//   onClose: () => void;
//   size: FontSize;
//   onChange: (s: FontSize) => void;
// }> = ({ open, onClose, size, onChange }) => {
//   if (!open) return null;
//   return (
//     <div
//       className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white dark:bg-neutral-900 w-full sm:max-w-sm rounded-t-[28px] sm:rounded-[28px] p-6 anim-slide-up"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mb-5 sm:hidden" />
//         <div className="flex items-center justify-between mb-5">
//           <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Text Size</h3>
//           <button onClick={onClose} className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 press">
//             <i className="ri-close-line text-lg" />
//           </button>
//         </div>
//         <div className="space-y-2">
//           {FONT_OPTIONS.map((opt) => (
//             <button
//               key={opt.key}
//               onClick={() => { onChange(opt.key); onClose(); }}
//               className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all press ${size === opt.key
//                   ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10"
//                   : "border-transparent bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
//                 }`}
//             >
//               <span className="font-serif font-bold text-neutral-800 dark:text-white w-10 text-center flex-shrink-0"
//                 style={{ fontSize: opt.size }}>
//                 Ag
//               </span>
//               <div className="text-left flex-1 min-w-0">
//                 <p className="font-semibold text-sm text-neutral-900 dark:text-white">{opt.label}</p>
//                 <p className="text-xs text-neutral-400">{opt.desc}</p>
//               </div>
//               {size === opt.key && <i className="ri-check-line text-orange-500 flex-shrink-0" />}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── Translate helper ─────────────────────────────────────────────────────────
// async function translateText(text: string, target: string): Promise<string> {
//   const sentences = text.split(/(?<=[.!?।؟])\s+/);
//   const chunks: string[] = [];
//   let cur = "";
//   for (const s of sentences) {
//     if ((cur + " " + s).length > 420) { if (cur) chunks.push(cur.trim()); cur = s; }
//     else cur += (cur ? " " : "") + s;
//   }
//   if (cur) chunks.push(cur.trim());

//   const results = await Promise.all(
//     chunks.map(async (chunk) => {
//       try {
//         const r = await fetch(
//           `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${target}`
//         );
//         const d = await r.json();
//         return d.responseStatus === 200 ? (d.responseData?.translatedText ?? chunk) : chunk;
//       } catch { return chunk; }
//     })
//   );
//   return results.join(" ");
// }

// // ─── GIF Picker ───────────────────────────────────────────────────────────────
// const GifPicker: React.FC<{
//   onSelect: (url: string) => void;
//   onClose: () => void;
// }> = ({ onSelect, onClose }) => {
//   const [query, setQuery] = useState("");
//   const [gifs, setGifs] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const search = async () => {
//     if (!query.trim()) return;
//     setLoading(true);
//     try {
//       const res = await api.get("/stories/search-gif", { params: { q: query } });
//       setGifs(res.data || []);
//     } catch {
//       toast.error("Failed to load GIFs");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl rounded-tl-md p-3 shadow-md anim-slide-up">
//       <div className="flex gap-2 mb-3">
//         <div className="relative flex-1 min-w-0">
//           <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none" />
//           <input
//             type="text"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
//             placeholder="Search GIFs…"
//             className="w-full bg-neutral-50 dark:bg-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-orange-400/30 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
//           />
//         </div>
//         <button
//           onClick={search}
//           className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold flex-shrink-0 press"
//         >
//           {loading ? <i className="ri-loader-4-line animate-spin" /> : "Go"}
//         </button>
//         <button
//           onClick={onClose}
//           className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0 press"
//         >
//           <i className="ri-close-line" />
//         </button>
//       </div>

//       {gifs.length > 0 && (
//         <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
//           {gifs.map((g) => (
//             <img
//               key={g.id}
//               src={g.images.fixed_height.url}
//               onClick={() => onSelect(g.images.fixed_height.url)}
//               className="w-full h-20 object-cover rounded-xl cursor-pointer hover:opacity-75 transition-opacity"
//               loading="lazy"
//               alt="gif"
//             />
//           ))}
//         </div>
//       )}

//       {!loading && gifs.length === 0 && query && (
//         <p className="text-center text-xs text-neutral-400 py-4">No GIFs found</p>
//       )}
//       {!query && !gifs.length && (
//         <p className="text-center text-xs text-neutral-400 py-4">
//           <i className="ri-image-line mr-1" />
//           Search for GIFs to attach
//         </p>
//       )}
//     </div>
//   );
// };

// // ─── Comment Input ────────────────────────────────────────────────────────────
// const CommentInput: React.FC<{
//   onSubmit: (text: string, gifUrl?: string) => Promise<void>;
// }> = ({ onSubmit }) => {
//   const [text, setText] = useState("");
//   const [gifUrl, setGifUrl] = useState<string | null>(null);
//   const [posting, setPosting] = useState(false);
//   const [gifOpen, setGifOpen] = useState(false);
//   const { user } = useAuth();

//   const submit = async () => {
//     if ((!text.trim() && !gifUrl) || posting) return;
//     setPosting(true);
//     await onSubmit(text.trim(), gifUrl || undefined);
//     setText("");
//     setGifUrl(null);
//     setGifOpen(false);
//     setPosting(false);
//   };

//   return (
//     <div className="flex gap-3 items-start">
//       <img
//         src={
//           user?.image?.url ||
//           `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username ?? "U")}&background=f97316&color=fff&size=80`
//         }
//         className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-1 ring-2 ring-white dark:ring-neutral-950"
//         alt={user?.username}
//       />
//       <div className="flex-1 min-w-0">
//         <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl rounded-tl-md overflow-hidden focus-within:border-orange-300 dark:focus-within:border-orange-500/50 transition-colors shadow-sm">
//           {gifUrl ? (
//             <div className="p-3 relative">
//               <img src={gifUrl} className="rounded-xl max-w-[200px]" alt="GIF" />
//               <button
//                 onClick={() => setGifUrl(null)}
//                 className="absolute top-4 left-4 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
//               >
//                 <i className="ri-close-line" />
//               </button>
//             </div>
//           ) : (
//             <textarea
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
//               }}
//               placeholder="Write a reflection…"
//               rows={2}
//               className="w-full px-4 pt-3 pb-1 bg-transparent outline-none resize-none text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 leading-relaxed min-h-[64px] max-h-[160px]"
//               style={{ fontFamily: "Inter, sans-serif" }}
//             />
//           )}
//           <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-2">
//             <div className="flex items-center gap-1">
//               <button
//                 type="button"
//                 onClick={() => setGifOpen((g) => !g)}
//                 className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors press ${
//                   gifOpen
//                     ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500"
//                     : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
//                 }`}
//               >
//                 <i className="ri-file-gif-line text-sm" /> GIF
//               </button>
//               <span className="text-[10px] text-neutral-300 dark:text-neutral-700 hidden sm:block">
//                 ⌘↩ to post
//               </span>
//             </div>
//             <button
//               type="button"
//               onClick={submit}
//               disabled={(!text.trim() && !gifUrl) || posting}
//               className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs disabled:opacity-40 press"
//             >
//               {posting ? (
//                 <i className="ri-loader-4-line animate-spin" />
//               ) : (
//                 <i className="ri-send-plane-fill" />
//               )}
//               Post
//             </button>
//           </div>
//         </div>
//         {gifOpen && (
//           <div className="mt-2">
//             <GifPicker
//               onSelect={(u) => {
//                 setGifUrl(u);
//                 setGifOpen(false);
//               }}
//               onClose={() => setGifOpen(false)}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // ─── Comment Card ─────────────────────────────────────────────────────────────
// const CommentCard: React.FC<{
//   comment: Comment;
//   replies: Comment[];
//   canDelete: boolean;
//   onDelete: (id: string) => void;
//   onLike: (id: string) => void;
//   onEdit: (id: string, text: string) => Promise<void>;
//   onReplySubmit: (parentId: string, text: string, gifUrl?: string) => Promise<void>;
//   currentUserId?: string;
//   isOwner: boolean;
//   replyToId: string | null;
//   setReplyToId: (id: string | null) => void;
//   gifOpenForId: string | null;
//   setGifOpenForId: (id: string | null) => void;
// }> = ({
//   comment,
//   replies,
//   canDelete,
//   onDelete,
//   onLike,
//   onEdit,
//   onReplySubmit,
//   currentUserId,
//   isOwner,
//   replyToId,
//   setReplyToId,
//   gifOpenForId,
//   setGifOpenForId,
// }) => {
//   const [confirm, setConfirm] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editText, setEditText] = useState(comment.comment);
//   const [replyText, setReplyText] = useState("");
//   const [showReplies, setShowReplies] = useState(true);
//   const [posting, setPosting] = useState(false);
//   const [likeAnim, setLikeAnim] = useState(false);

//   const hasLiked =
//     comment.likes?.some(
//       (id) => (typeof id === "string" ? id : (id as any)?._id) === currentUserId
//     ) || false;

//   const handleLikeClick = () => {
//     setLikeAnim(true);
//     setTimeout(() => setLikeAnim(false), 400);
//     onLike(comment._id);
//   };

//   const handleEditSubmit = async () => {
//     if (!editText.trim()) return;
//     await onEdit(comment._id, editText.trim());
//     setIsEditing(false);
//   };

//   const handleReplyPost = async () => {
//     if (!replyText.trim()) return;
//     setPosting(true);
//     const targetParentId = comment.parentId || comment._id;
//     await onReplySubmit(targetParentId, replyText.trim());
//     setReplyText("");
//     setReplyToId(null);
//     setPosting(false);
//     setShowReplies(true);
//   };

//   const handleGifSelect = async (url: string) => {
//     const targetParentId = comment.parentId || comment._id;
//     await onReplySubmit(targetParentId, "Attached GIF", url);
//     setGifOpenForId(null);
//     setReplyToId(null);
//     setShowReplies(true);
//   };

//   const isReply = !!comment.parentId;
//   const authorUserId = typeof comment.author === "string" ? comment.author : comment.author?._id;

//   return (
//     <div className={`flex gap-3 group/card ${isReply ? "pl-4 border-l-2 border-neutral-100 dark:border-neutral-800" : ""}`}>
//       {/* Avatar */}
//       <Link to={`/profile/${comment.author.username}`} className="flex-shrink-0 mt-1">
//         <img
//           src={
//             comment.author.image?.url ||
//             `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.username)}&background=f97316&color=fff&size=80`
//           }
//           className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-neutral-950 shadow-sm"
//           alt={comment.author.username}
//         />
//       </Link>

//       <div className="flex-1 min-w-0">
//         <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
//           {/* Header */}
//           <div className="flex items-start justify-between gap-2 mb-1.5">
//             <div className="flex items-baseline gap-2 flex-wrap min-w-0">
//               <Link
//                 to={`/profile/${comment.author.username}`}
//                 className="font-semibold text-sm text-neutral-900 dark:text-white hover:text-orange-500 transition-colors"
//                 style={{ fontFamily: "Inter, sans-serif" }}
//               >
//                 {comment.author.name || comment.author.username}
//               </Link>
//               <span className="text-[10px] text-neutral-400 flex-shrink-0">
//                 {moment(comment.timeStamp).fromNow()}
//               </span>
//               {comment.editedAt && (
//                 <span className="text-[9px] text-neutral-400 italic font-medium bg-neutral-50 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">
//                   edited
//                 </span>
//               )}
//             </div>

//             {canDelete && (
//               <div className="flex items-center gap-1 flex-shrink-0">
//                 {confirm ? (
//                   <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-100 dark:border-red-500/20">
//                     <button
//                       onClick={() => {
//                         onDelete(comment._id);
//                         setConfirm(false);
//                       }}
//                       className="text-[10px] font-bold text-red-500 hover:underline"
//                     >
//                       Delete
//                     </button>
//                     <span className="text-neutral-300 dark:text-neutral-700 text-xs">·</span>
//                     <button
//                       onClick={() => setConfirm(false)}
//                       className="text-[10px] font-bold text-neutral-400 hover:underline"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 ) : (
//                   <button
//                     onClick={() => setConfirm(true)}
//                     className="opacity-0 group-hover/card:opacity-100 focus:opacity-100 w-7 h-7 rounded-full flex items-center justify-center text-neutral-300 dark:text-neutral-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
//                     title="Delete reflection"
//                   >
//                     <i className="ri-delete-bin-line text-xs" />
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Body or Inline Editing form */}
//           {isEditing ? (
//             <div className="mt-1 space-y-2">
//               <textarea
//                 value={editText}
//                 onChange={(e) => setEditText(e.target.value)}
//                 className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 ring-orange-500/20"
//                 rows={2}
//                 autoFocus
//               />
//               <div className="flex justify-end gap-1.5">
//                 <button
//                   onClick={() => {
//                     setIsEditing(false);
//                     setEditText(comment.comment);
//                   }}
//                   className="px-3 py-1 text-xs font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleEditSubmit}
//                   disabled={!editText.trim()}
//                   className="px-3 py-1 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
//                 >
//                   Save
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <>
//               {comment.comment && comment.comment !== "Attached GIF" && (
//                 <p
//                   className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed break-words"
//                   style={{ fontFamily: "Inter, sans-serif" }}
//                 >
//                   {comment.comment}
//                 </p>
//               )}
//               {comment.gif && (
//                 <div className="mt-2">
//                   <img
//                     src={comment.gif}
//                     alt="GIF"
//                     className="rounded-xl max-w-[200px] w-full border border-neutral-100 dark:border-neutral-800"
//                     loading="lazy"
//                   />
//                 </div>
//               )}
//             </>
//           )}

//           {/* Actions: Like, Reply, Edit */}
//           {!isEditing && (
//             <div className="flex items-center gap-4 mt-2.5 pt-1.5 border-t border-neutral-50 dark:border-neutral-800/30">
//               {/* Like Button */}
//               <button
//                 onClick={handleLikeClick}
//                 className={`flex items-center gap-1 text-[11px] font-semibold transition-colors press ${
//                   hasLiked ? "text-red-500" : "text-neutral-400 hover:text-red-500"
//                 }`}
//               >
//                 <i
//                   className={`${hasLiked ? "ri-heart-3-fill" : "ri-heart-3-line"} text-xs ${
//                     likeAnim ? "like-pop" : ""
//                   }`}
//                 />
//                 <span>{comment.likesCount || 0}</span>
//               </button>

//               {/* Reply Button */}
//               <button
//                 onClick={() => {
//                   setReplyToId(replyToId === comment._id ? null : comment._id);
//                   setReplyText(`@${comment.author.username} `);
//                 }}
//                 className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-orange-500 transition-colors"
//               >
//                 <i className="ri-reply-line text-xs" />
//                 <span>Reply</span>
//               </button>

//               {/* Edit Button */}
//               {authorUserId === currentUserId && (
//                 <button
//                   onClick={() => setIsEditing(true)}
//                   className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-blue-500 transition-colors ml-auto"
//                 >
//                   <i className="ri-pencil-line text-xs" />
//                   <span>Edit</span>
//                 </button>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Inline Reply input field */}
//         {replyToId === comment._id && (
//           <div className="mt-3 ml-2 flex gap-3 items-start anim-slide-up">
//             <img
//               src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.username)}&background=f97316&color=fff&size=80`}
//               className="w-7 h-7 rounded-full object-cover mt-1 opacity-70"
//               alt="Avatar"
//             />
//             <div className="flex-1 min-w-0">
//               <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 focus-within:border-orange-300 dark:focus-within:border-orange-500/30 transition-all shadow-inner">
//                 <textarea
//                   value={replyText}
//                   onChange={(e) => setReplyText(e.target.value)}
//                   placeholder={`Reply to @${comment.author.username}...`}
//                   rows={2}
//                   className="w-full px-3 py-1 bg-transparent outline-none resize-none text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 leading-relaxed min-h-[50px]"
//                   style={{ fontFamily: "Inter, sans-serif" }}
//                   autoFocus
//                 />
//                 <div className="flex items-center justify-between px-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/50">
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setGifOpenForId(gifOpenForId === comment._id ? null : comment._id)
//                     }
//                     className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors press ${
//                       gifOpenForId === comment._id
//                         ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500"
//                         : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
//                     }`}
//                   >
//                     <i className="ri-file-gif-line" /> GIF
//                   </button>
//                   <div className="flex gap-1.5">
//                     <button
//                       type="button"
//                       onClick={() => setReplyToId(null)}
//                       className="px-3 py-1 rounded-lg text-[10px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-850 hover:bg-neutral-200"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="button"
//                       onClick={handleReplyPost}
//                       disabled={!replyText.trim() || posting}
//                       className="px-3 py-1 rounded-lg bg-orange-500 text-white font-semibold text-[10px] disabled:opacity-40"
//                     >
//                       {posting ? "Posting..." : "Reply"}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//               {/* GIF picker for inline reply */}
//               {gifOpenForId === comment._id && (
//                 <div className="mt-2">
//                   <GifPicker
//                     onSelect={handleGifSelect}
//                     onClose={() => setGifOpenForId(null)}
//                   />
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Threaded Nested Comments List */}
//         {replies.length > 0 && (
//           <div className="mt-3 space-y-3">
//             {/* Collapse/Expand toggle */}
//             <button
//               onClick={() => setShowReplies((s) => !s)}
//               className="ml-4 text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors select-none"
//             >
//               <i className={showReplies ? "ri-subtract-line" : "ri-add-line"} />
//               <span>
//                 {showReplies
//                   ? `Hide replies`
//                   : `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
//               </span>
//             </button>

//             {showReplies && (
//               <div className="ml-4 pl-2 space-y-3 border-l-2 border-orange-100 dark:border-neutral-850">
//                 {replies.map((reply) => (
//                   <CommentCard
//                     key={reply._id}
//                     comment={reply}
//                     replies={[]} // Replies cannot have nested replies (one level deep)
//                     canDelete={
//                       (typeof reply.author === "string" ? reply.author : reply.author?._id) ===
//                         currentUserId || isOwner
//                     }
//                     onDelete={onDelete}
//                     onLike={onLike}
//                     onEdit={onEdit}
//                     onReplySubmit={onReplySubmit}
//                     currentUserId={currentUserId}
//                     isOwner={isOwner}
//                     replyToId={replyToId}
//                     setReplyToId={setReplyToId}
//                     gifOpenForId={gifOpenForId}
//                     setGifOpenForId={setGifOpenForId}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };


// // ─── Liked-By Popover ────────────────────────────────────────────────────────
// const LikedByPopover: React.FC<{
//   users: LikedByUser[];
//   loading: boolean;
//   onClose: () => void;
// }> = ({ users, loading, onClose }) => (
//   <div className="absolute left-0 top-full mt-2 w-60 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-2xl z-50 anim-scale-in overflow-hidden">
//     <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
//       <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Liked by</span>
//       <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 press">
//         <i className="ri-close-line text-sm" />
//       </button>
//     </div>
//     <div className="max-h-52 overflow-y-auto no-scrollbar p-1.5">
//       {loading ? (
//         <div className="py-6 flex justify-center">
//           <i className="ri-loader-4-line animate-spin text-neutral-300 text-xl" />
//         </div>
//       ) : users.length === 0 ? (
//         <p className="py-5 text-center text-xs text-neutral-400">No likes yet</p>
//       ) : (
//         users.map((u) => (
//           <Link
//             key={u._id}
//             to={`/profile/${u.username}`}
//             onClick={onClose}
//             className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
//           >
//             <img
//               src={u.image?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&size=80`}
//               className="w-8 h-8 rounded-full object-cover flex-shrink-0"
//               alt={u.username}
//             />
//             <div className="min-w-0">
//               <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{u.name || u.username}</p>
//               <p className="text-[11px] text-neutral-400 truncate">@{u.username}</p>
//             </div>
//           </Link>
//         ))
//       )}
//     </div>
//   </div>
// );

// // ─── Main Component ───────────────────────────────────────────────────────────
// export const StoryRead: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const { socket } = useSocket();

//   const [replyToId, setReplyToId] = useState<string | null>(null);
//   const [gifOpenForId, setGifOpenForId] = useState<string | null>(null);
//   const [sortBy, setSortBy] = useState<"newest" | "likes">("newest");

//   const [story, setStory] = useState<Story | null>(null);

//   const mainComments = useMemo(() => {
//     if (!story) return [];
//     return story.comments.filter((c) => !c.parentId);
//   }, [story?.comments]);

//   const repliesByParent = useMemo(() => {
//     if (!story) return {};
//     const map: { [key: string]: Comment[] } = {};
//     story.comments.forEach((c) => {
//       if (c.parentId) {
//         if (!map[c.parentId]) map[c.parentId] = [];
//         map[c.parentId].push(c);
//       }
//     });
//     Object.keys(map).forEach((key) => {
//       map[key].sort((a, b) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime());
//     });
//     return map;
//   }, [story?.comments]);

//   const sortedMainComments = useMemo(() => {
//     const list = [...mainComments];
//     if (sortBy === "likes") {
//       return list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
//     }
//     return list.sort((a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime());
//   }, [mainComments, sortBy]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isLiked, setIsLiked] = useState(false);
//   const [likesCount, setLikesCount] = useState(0);
//   const [likeAnim, setLikeAnim] = useState(false);

//   const [likedByOpen, setLikedByOpen] = useState(false);
//   const [likedByUsers, setLikedByUsers] = useState<LikedByUser[]>([]);
//   const [likedByLoading, setLikedByLoading] = useState(false);

//   const [deleteOpen, setDeleteOpen] = useState(false);
//   const [moreOpen, setMoreOpen] = useState(false);
//   const [downloading, setDownloading] = useState(false);

//   const [gifOpen, setGifOpen] = useState(false);

//   const [translateOpen, setTranslateOpen] = useState(false);
//   const [currentLang, setCurrentLang] = useState("en");
//   const [translatedText, setTranslatedText] = useState<string | null>(null);
//   const [translating, setTranslating] = useState(false);

//   const [fontSizeOpen, setFontSizeOpen] = useState(false);
//   const [fontSize, setFontSize] = useState<FontSize>("base");

//   const moreRef = useRef<HTMLDivElement>(null);
//   const likedByRef = useRef<HTMLDivElement>(null);

//   // Persist font size
//   useEffect(() => {
//     const s = localStorage.getItem("story_fontSize");
//     if (s && ["sm", "base", "lg", "xl"].includes(s)) setFontSize(s as FontSize);
//   }, []);
//   useEffect(() => { localStorage.setItem("story_fontSize", fontSize); }, [fontSize]);

//   // Outside click
//   useEffect(() => {
//     const fn = (e: MouseEvent) => {
//       if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
//       if (likedByRef.current && !likedByRef.current.contains(e.target as Node)) setLikedByOpen(false);
//     };
//     document.addEventListener("mousedown", fn);
//     return () => document.removeEventListener("mousedown", fn);
//   }, []);

//   // ── Socket Room Listeners & Sync
//   useEffect(() => {
//     if (!socket || !id) return;

//     socket.emit("joinStory", id);

//     const handleCommentCreated = (newComment: Comment) => {
//       setStory((prev) => {
//         if (!prev) return null;
//         const exists = prev.comments.some((c) => c._id === newComment._id);
//         if (exists) return prev;
//         return { ...prev, comments: [newComment, ...prev.comments] };
//       });
//     };

//     const handleCommentDeleted = ({ commentId }: { commentId: string }) => {
//       setStory((prev) => {
//         if (!prev) return null;
//         return {
//           ...prev,
//           comments: prev.comments.filter((c) => c._id !== commentId && c.parentId !== commentId),
//         };
//       });
//     };

//     const handleCommentUpdated = (updatedComment: Comment) => {
//       setStory((prev) => {
//         if (!prev) return null;
//         return {
//           ...prev,
//           comments: prev.comments.map((c) =>
//             c._id === updatedComment._id ? updatedComment : c
//           ),
//         };
//       });
//     };

//     const handleCommentLiked = ({
//       commentId,
//       likesCount,
//       likes,
//     }: {
//       commentId: string;
//       likesCount: number;
//       likes: string[];
//     }) => {
//       setStory((prev) => {
//         if (!prev) return null;
//         return {
//           ...prev,
//           comments: prev.comments.map((c) =>
//             c._id === commentId ? { ...c, likesCount, likes } : c
//           ),
//         };
//       });
//     };

//     socket.on("commentCreated", handleCommentCreated);
//     socket.on("commentDeleted", handleCommentDeleted);
//     socket.on("commentUpdated", handleCommentUpdated);
//     socket.on("commentLiked", handleCommentLiked);

//     return () => {
//       socket.emit("leaveStory", id);
//       socket.off("commentCreated", handleCommentCreated);
//       socket.off("commentDeleted", handleCommentDeleted);
//       socket.off("commentUpdated", handleCommentUpdated);
//       socket.off("commentLiked", handleCommentLiked);
//     };
//   }, [socket, id]);

//   // ── Fetch
//   const fetchStory = async () => {
//     try {
//       setLoading(true); setError(null);
//       const res = await api.get(`/stories/${id}`);
//       if (res.data.success) {
//         setStory(res.data.story);
//         setIsLiked(res.data.isLiked);
//         setLikesCount(res.data.story.likesCounts ?? res.data.story.likedBy?.length ?? 0);
//       }
//     } catch (err: any) {
//       setError(err.message || "Failed to load story.");
//     } finally { setLoading(false); }
//   };

//   useEffect(() => { if (id) fetchStory(); }, [id]);

//   // ── Like
//   const handleLike = async () => {
//     if (!story) return;
//     const prev = isLiked;
//     setIsLiked(!prev);
//     setLikesCount((c) => prev ? c - 1 : c + 1);
//     setLikeAnim(true);
//     setTimeout(() => setLikeAnim(false), 400);
//     try {
//       const res = await api.post(`/stories/${story._id}/likes`);
//       if (res.data.success) {
//         setIsLiked(res.data.liked);
//         setLikesCount(res.data.likesCount);
//       }
//     } catch {
//       setIsLiked(prev);
//       setLikesCount((c) => prev ? c + 1 : c - 1);
//       toast.error("Could not update like");
//     }
//   };

//   // ── Liked-by
//   const openLikedBy = async (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (!story) return;
//     const opening = !likedByOpen;
//     setLikedByOpen(opening);
//     if (!opening) return;
//     setLikedByLoading(true);
//     try {
//       const res = await api.get(`/stories/${story._id}/likedBy`);
//       setLikedByUsers(res.data.likedBy || []);
//     } catch { toast.error("Failed to load likes"); }
//     finally { setLikedByLoading(false); }
//   };

//   // ── Share
//   const handleShare = async () => {
//     if (!story) return;
//     if (navigator.share) {
//       try { await navigator.share({ title: story.title, url: window.location.href }); } catch { }
//     } else {
//       await navigator.clipboard.writeText(window.location.href);
//       toast.success("Link copied!");
//     }
//   };

//   // ── Delete
//   const handleDelete = async () => {
//     if (!story) return;
//     try {
//       await api.delete(`/stories/${story._id}`);
//       toast.success("Story deleted");
//       navigate("/stories");
//     } catch { toast.error("Failed to delete story"); }
//   };

//   // ── Download PDF
//   const handleDownload = async () => {
//     if (!story || downloading) return;
//     setDownloading(true);
//     const tid = toast.loading("Preparing PDF…");
//     try {
//       try {
//         const res = await api.get(`/stories/download/${story._id}`, { responseType: "blob" });
//         const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
//         const a = document.createElement("a");
//         a.href = url; a.download = `${story.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
//         document.body.appendChild(a); a.click(); document.body.removeChild(a);
//         window.URL.revokeObjectURL(url);
//         toast.success("Downloaded!", { id: tid });
//       } catch {
//         const pw = window.open("", "_blank");
//         if (!pw) { toast.error("Allow popups to download", { id: tid }); return; }
//         const safe = story.story.replace(/<script[\s\S]*?<\/script>/gi, "");
//         pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
//           <title>${story.title}</title>
//           <style>
//             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:wght@700&display=swap');
//             body{font-family:'Inter',sans-serif;max-width:680px;margin:40px auto;padding:24px;color:#1a1a2e;line-height:1.8;font-size:16px}
//             h1{font-family:'Playfair Display',serif;font-size:36px;margin:0 0 8px;line-height:1.15}
//             .meta{color:#f97316;font-weight:600;font-size:13px;margin-bottom:20px;text-transform:uppercase;letter-spacing:.06em}
//             .divider{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
//             .author{font-size:14px;color:#6b7280;margin-bottom:28px}
//             .author strong{color:#1a1a2e}
//             img{max-width:100%;border-radius:10px;margin:16px 0}
//             blockquote{border-left:3px solid #f97316;padding:.5rem 1rem;margin:1.5rem 0;font-style:italic;color:#92400e;background:#fff7ed;border-radius:0 8px 8px 0}
//             pre{background:#0f172a;color:#e2e8f0;border-radius:10px;padding:1rem;overflow:auto;font-size:.85em}
//             @media print{body{margin:20px}}
//           </style>
//         </head><body>
//           <p class="meta">${story.category} · ${moment(story.timeStamp).format("MMMM D, YYYY")}</p>
//           <h1>${story.title}</h1>
//           ${story.image?.url ? `<img src="${story.image.url}" alt="${story.title}" style="margin:16px 0;width:100%"/>` : ""}
//           <hr class="divider"/>
//           <p class="author">By <strong>${story.owner.name || story.owner.username}</strong> · @${story.owner.username}</p>
//           <div>${safe}</div>
//           <script>window.onload=()=>{setTimeout(()=>{window.print();window.onafterprint=()=>window.close();},700)}<\/script>
//         </body></html>`);
//         pw.document.close();
//         toast.success("Print dialog opened", { id: tid });
//       }
//     } catch { toast.error("Download failed", { id: tid }); }
//     finally { setDownloading(false); setMoreOpen(false); }
//   };

//   // ── Comment submit
//   const handleCommentSubmit = async (text: string, gifUrl?: string) => {
//     try {
//       const res = await api.post(`/stories/${id}/comments`, { comment: text, gif: gifUrl });
//       if (res.data.success) {
//         setStory((p) => {
//           if (!p) return null;
//           const exists = p.comments.some((c) => c._id === res.data.comment._id);
//           if (exists) return p;
//           return { ...p, comments: [res.data.comment, ...p.comments] };
//         });
//         toast.success("Reflection posted!");
//       }
//     } catch {
//       toast.error("Failed to post reflection");
//     }
//   };

//   // ── Reply submit
//   const handleReplySubmit = async (parentId: string, text: string, gifUrl?: string) => {
//     try {
//       const res = await api.post(`/stories/${id}/comments`, {
//         comment: text,
//         gif: gifUrl,
//         parentId,
//       });
//       if (res.data.success) {
//         setStory((p) => {
//           if (!p) return null;
//           const exists = p.comments.some((c) => c._id === res.data.comment._id);
//           if (exists) return p;
//           return { ...p, comments: [res.data.comment, ...p.comments] };
//         });
//         toast.success("Reply posted!");
//       }
//     } catch {
//       toast.error("Failed to post reply");
//     }
//   };

//   // ── Comment edit
//   const handleCommentEdit = async (cid: string, text: string) => {
//     try {
//       const res = await api.put(`/stories/${id}/comments/${cid}`, { comment: text });
//       if (res.data.success) {
//         setStory((p) => {
//           if (!p) return null;
//           return {
//             ...p,
//             comments: p.comments.map((c) => (c._id === cid ? res.data.comment : c)),
//           };
//         });
//         toast.success("Reflection updated!");
//       }
//     } catch {
//       toast.error("Failed to update reflection");
//     }
//   };

//   // ── Comment Like Toggle
//   const handleCommentLike = async (cid: string) => {
//     try {
//       const res = await api.post(`/stories/${id}/comments/${cid}/like`);
//       if (res.data.success) {
//         setStory((p) => {
//           if (!p) return null;
//           return {
//             ...p,
//             comments: p.comments.map((c) =>
//               c._id === cid
//                 ? { ...c, likesCount: res.data.likesCount, likes: res.data.likes }
//                 : c
//             ),
//           };
//         });
//       }
//     } catch {
//       toast.error("Failed to toggle like");
//     }
//   };

//   // ── Comment delete
//   const handleCommentDelete = async (cid: string) => {
//     if (!story) return;
//     try {
//       await api.delete(`/stories/${story._id}/comments/${cid}`);
//       setStory((p) => {
//         if (!p) return null;
//         return {
//           ...p,
//           comments: p.comments.filter((c) => c._id !== cid && c.parentId !== cid),
//         };
//       });
//       toast.success("Reflection removed");
//     } catch {
//       toast.error("Failed to delete reflection");
//     }
//   };

//   // ── Translate
//   const handleTranslate = async (code: string) => {
//     if (!story) return;
//     setCurrentLang(code);
//     if (code === "en") { setTranslatedText(null); return; }
//     setTranslating(true);
//     const tid = toast.loading("Translating…");
//     try {
//       const plain = story.story.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
//       const result = await translateText(plain, code);
//       setTranslatedText(result);
//       toast.success("Translation ready", { id: tid });
//     } catch {
//       toast.error("Translation failed", { id: tid });
//       setCurrentLang("en");
//     } finally { setTranslating(false); }
//   };

//   // ── Loading / Error states
//   if (loading) return (
//     <div className="min-h-screen bg-[#F8F7F5] dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
//       <div className="w-10 h-10 rounded-full border-[3px] border-orange-100 border-t-orange-500 animate-spin" />
//       <p className="text-sm text-neutral-400" style={{ fontFamily: "Inter,sans-serif" }}>
//         Loading story…
//       </p>
//     </div>
//   );

//   if (error) return (
//     <div className="min-h-screen bg-[#F8F7F5] dark:bg-neutral-950 flex items-center justify-center p-6">
//       <div className="w-full max-w-md">
//         <ErrorCard message={error} onRetry={fetchStory} />
//       </div>
//     </div>
//   );

//   if (!story) return null;

//   const isOwner = story.owner?._id === user?._id;
//   const fsClass = { sm: "fs-sm", base: "fs-base", lg: "fs-lg", xl: "fs-xl" }[fontSize];
//   const readMin = Math.max(1, Math.ceil(story.story.replace(/<[^>]*>/g, "").trim().split(/\s+/).length / 220));
//   const langLabel = LANGUAGES.find((l) => l.code === currentLang);
//   const plainAudio = (translatedText || story.story).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

//   return (
//     <>
//       <style>{globalStyles}</style>
//       <ReadingProgress />

//       <div
//         className="min-h-screen bg-[#F8F7F5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
//         style={{ fontFamily: "Inter, system-ui, sans-serif" }}
//       >
//         {/* ── Modals ── */}
//         <TranslateModal
//           open={translateOpen}
//           onClose={() => setTranslateOpen(false)}
//           onSelect={handleTranslate}
//           currentLang={currentLang}
//         />
//         <FontSizeModal
//           open={fontSizeOpen}
//           onClose={() => setFontSizeOpen(false)}
//           size={fontSize}
//           onChange={setFontSize}
//         />

//         {/* Delete Confirm */}
//         {deleteOpen && (
//           <div
//             className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
//             onClick={() => setDeleteOpen(false)}
//           >
//             <div
//               className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl anim-scale-in"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
//                 <i className="ri-delete-bin-2-line text-2xl text-red-500" />
//               </div>
//               <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white mb-1">
//                 Delete story?
//               </h3>
//               <p className="text-sm text-neutral-400 mb-6">
//                 This is permanent and cannot be undone.
//               </p>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setDeleteOpen(false)}
//                   className="flex-1 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 font-semibold text-sm text-neutral-700 dark:text-neutral-300 press"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleDelete}
//                   className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm press"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── Page ── */}
//         <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-28">

//           {/* Top bar */}
//           <div className="flex items-center justify-between gap-2 mb-8">
//             <button
//               onClick={() => navigate(-1)}
//               aria-label="Back"
//               className="w-11 h-11 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center justify-center text-neutral-700 dark:text-neutral-300 press"
//             >
//               <i className="ri-arrow-left-s-line text-xl" />
//             </button>

//             <div className="flex items-center gap-2">
//               {/* Font size */}
//               <button
//                 onClick={() => setFontSizeOpen(true)}
//                 aria-label="Text size"
//                 className="h-11 px-4 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center gap-1 text-neutral-700 dark:text-neutral-300 press"
//               >
//                 <span className="font-serif font-bold leading-none" style={{ fontSize: 12 }}>A</span>
//                 <span className="font-serif font-bold leading-none" style={{ fontSize: 18 }}>A</span>
//               </button>

//               {/* Translate */}
//               <button
//                 onClick={() => setTranslateOpen(true)}
//                 aria-label="Translate"
//                 className={`h-11 px-4 rounded-full border shadow-sm flex items-center gap-2 font-semibold text-sm press ${currentLang !== "en"
//                     ? "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400"
//                     : "bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
//                   }`}
//               >
//                 <i className="ri-translate-2 text-base" />
//                 <span className="text-base leading-none">{langLabel?.flag ?? "🇺🇸"}</span>
//               </button>

//               {/* More */}
//               <div className="relative" ref={moreRef}>
//                 <button
//                   onClick={(e) => { e.stopPropagation(); setMoreOpen((o) => !o); }}
//                   aria-label="More"
//                   className="w-11 h-11 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center justify-center text-neutral-700 dark:text-neutral-300 press"
//                 >
//                   <i className="ri-more-fill text-lg" />
//                 </button>

//                 {moreOpen && (
//                   <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-2xl py-1.5 z-50 anim-scale-in origin-top-right overflow-hidden">
//                     <button
//                       onClick={handleDownload}
//                       disabled={downloading}
//                       className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
//                     >
//                       {downloading
//                         ? <i className="ri-loader-4-line animate-spin text-neutral-400" />
//                         : <i className="ri-download-2-line text-neutral-400" />}
//                       Download PDF
//                     </button>
//                     <button
//                       onClick={() => { handleShare(); setMoreOpen(false); }}
//                       className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
//                     >
//                       <i className="ri-share-forward-line text-neutral-400" />
//                       Share Story
//                     </button>
//                     {isOwner && (
//                       <>
//                         <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1 mx-4" />
//                         <Link
//                           to={`/write?edit=${story._id}`}
//                           onClick={() => setMoreOpen(false)}
//                           className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
//                         >
//                           <i className="ri-pencil-line text-neutral-400" />
//                           Edit Story
//                         </Link>
//                         <button
//                           onClick={() => { setDeleteOpen(true); setMoreOpen(false); }}
//                           className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
//                         >
//                           <i className="ri-delete-bin-line" />
//                           Delete Story
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* ── Article ── */}
//           <article className="anim-fade-up">

//             {/* Meta chips */}
//             <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
//               {story.category && (
//                 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold capitalize tracking-wide">
//                   <i className="ri-bookmark-fill text-[10px]" />
//                   {story.category}
//                 </span>
//               )}
//               <span className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500">
//                 {moment(story.timeStamp).format("MMM D, YYYY")}
//               </span>
//               <span className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500">
//                 <i className="ri-time-line mr-1" />{readMin} min read
//               </span>
//               <span className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500">
//                 <i className="ri-eye-line mr-1" />{story.views.length}
//               </span>
//             </div>

//             {/* Title */}
//             <h1
//               className="font-serif font-bold text-center text-neutral-900 dark:text-white leading-[1.18] break-words mb-7"
//               style={{ fontSize: "clamp(28px, 5.5vw, 48px)", letterSpacing: "-0.02em" }}
//             >
//               {story.title}
//             </h1>

//             {/* Cover image */}
//             {story.image?.url && (
//               <div
//                 className="mb-8 rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 w-full"
//                 style={{ aspectRatio: "16/9" }}
//               >
//                 <img
//                   src={story.image.url}
//                   alt={story.title}
//                   className="w-full h-full object-cover"
//                   loading="lazy"
//                 />
//               </div>
//             )}

//             {/* Author */}
//             <Link
//               to={`/profile/${story.owner._id}`}
//               className="flex items-center gap-3 mb-8 p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors group"
//             >
//               <img
//                 src={
//                   story.owner.image?.url ||
//                   `https://ui-avatars.com/api/?name=${encodeURIComponent(story.owner.username)}&background=f97316&color=fff&size=80`
//                 }
//                 className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900 flex-shrink-0"
//                 alt={story.owner.username}
//               />
//               <div className="flex-1 min-w-0">
//                 <p className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-orange-500 transition-colors truncate">
//                   {story.owner.name || story.owner.username}
//                 </p>
//                 <p className="text-xs text-neutral-400 truncate">@{story.owner.username}</p>
//               </div>
//               <i className="ri-arrow-right-s-line text-neutral-300 group-hover:text-orange-400 transition-colors flex-shrink-0 text-lg" />
//             </Link>

//             {/* Audio player */}
//             <div className="mb-8">
//               <AudioPlayer text={plainAudio} />
//             </div>

//             {/* Translation notice */}
//             {translating && (
//               <div className="mb-5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-blue-50 dark:bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400">
//                 <i className="ri-loader-4-line animate-spin" />
//                 Translating to {langLabel?.name}…
//               </div>
//             )}
//             {translatedText && !translating && (
//               <div className="mb-6 flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-blue-50 dark:bg-blue-500/10">
//                 <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
//                   <i className="ri-translate-2" />
//                   {langLabel?.flag} {langLabel?.name}
//                 </span>
//                 <button
//                   onClick={() => { setTranslatedText(null); setCurrentLang("en"); }}
//                   className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline flex-shrink-0"
//                 >
//                   Show original
//                 </button>
//               </div>
//             )}

//             {/* ── Story Body ──────────────────────────────────────────────────
//                 This is the CRITICAL section. We render the raw HTML exactly
//                 as stored in the database (from your rich text editor).
//                 All formatting, paragraphs, headings, images, lists, quotes
//                 are preserved via the .story-content CSS class above.
//             ─────────────────────────────────────────────────────────────── */}
//             <div className={`story-content ${fsClass}`}>
//               {translatedText ? (
//                 // Translated: plain text, render as paragraphs
//                 <div>
//                   {translatedText
//                     .split(/\n\n+/)
//                     .filter(Boolean)
//                     .map((para, i) => (
//                       <p key={i}>{para}</p>
//                     ))}
//                 </div>
//               ) : (
//                 // Original: render rich HTML exactly as stored
//                 <div dangerouslySetInnerHTML={{ __html: story.story }} />
//               )}
//             </div>

//             {/* Divider */}
//             <div className="mt-10 mb-8 flex items-center gap-4">
//               <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
//               <span className="text-neutral-300 dark:text-neutral-700 text-sm">✦</span>
//               <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
//             </div>

//             {/* ── Action Bar ── */}
//             <div className="flex items-center justify-between gap-3 flex-wrap">

//               {/* Left: Like + Liked-by */}
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={handleLike}
//                   aria-label={isLiked ? "Unlike" : "Like"}
//                   className={`h-11 px-5 rounded-full flex items-center gap-2 font-semibold text-sm border transition-all press ${isLiked
//                       ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-500"
//                       : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
//                     }`}
//                 >
//                   <i className={`${isLiked ? "ri-heart-3-fill" : "ri-heart-3-line"} text-base ${likeAnim ? "like-pop" : ""}`} />
//                   <span>{likesCount}</span>
//                 </button>

//                 <div className="relative" ref={likedByRef}>
//                   <button
//                     onClick={openLikedBy}
//                     className="h-11 px-3.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:border-neutral-300 press"
//                   >
//                     {likesCount > 0 ? "Who liked?" : "Be first ♡"}
//                   </button>
//                   {likedByOpen && (
//                     <LikedByPopover
//                       users={likedByUsers}
//                       loading={likedByLoading}
//                       onClose={() => setLikedByOpen(false)}
//                     />
//                   )}
//                 </div>
//               </div>

//               {/* Right: Share + Download */}
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={handleShare}
//                   aria-label="Share"
//                   className="h-11 px-4 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 press"
//                 >
//                   <i className="ri-share-forward-line" />
//                   <span className="hidden sm:inline">Share</span>
//                 </button>
//                 <button
//                   onClick={handleDownload}
//                   disabled={downloading}
//                   aria-label="Download PDF"
//                   className="h-11 px-4 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 press disabled:opacity-50"
//                 >
//                   {downloading
//                     ? <i className="ri-loader-4-line animate-spin" />
//                     : <i className="ri-download-2-line" />}
//                   <span className="hidden sm:inline">PDF</span>
//                 </button>
//               </div>
//             </div>
//           </article>

//           {/* ── Comments Section ── */}
//           <section className="mt-14">

//             {/* Header */}
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-baseline gap-2.5">
//                 <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">
//                   Reflections
//                 </h2>
//                 {story.comments.length > 0 && (
//                   <span className="text-sm font-semibold text-neutral-400">
//                     {story.comments.length}
//                   </span>
//                 )}
//               </div>
//               {story.comments.length > 0 && (
//                 <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1.5 rounded-xl border border-neutral-200/50 dark:border-neutral-850">
//                   <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1 select-none">Sort:</span>
//                   <button
//                     onClick={() => setSortBy("newest")}
//                     className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors press ${
//                       sortBy === "newest"
//                         ? "bg-white dark:bg-neutral-800 text-orange-500 shadow-sm border border-neutral-200/20"
//                         : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
//                     }`}
//                   >
//                     Newest
//                   </button>
//                   <button
//                     onClick={() => setSortBy("likes")}
//                     className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors press ${
//                       sortBy === "likes"
//                         ? "bg-white dark:bg-neutral-800 text-orange-500 shadow-sm border border-neutral-200/20"
//                         : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
//                     }`}
//                   >
//                     Top Liked
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Comment input */}
//             <div className="mb-6">
//               <CommentInput onSubmit={handleCommentSubmit} />
//             </div>

//             {/* Comment list */}
//             <div className="space-y-4">
//               {sortedMainComments.length === 0 ? (
//                 <div className="text-center py-14">
//                   <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto mb-3 border border-neutral-200 dark:border-neutral-800">
//                     <i className="ri-chat-1-line text-2xl text-neutral-300 dark:text-neutral-600" />
//                   </div>
//                   <p className="text-sm font-semibold text-neutral-400">No reflections yet</p>
//                   <p className="text-xs text-neutral-300 dark:text-neutral-700 mt-1">
//                     Be the first to share your thoughts
//                   </p>
//                 </div>
//               ) : (
//                 sortedMainComments.map((c) => (
//                   <CommentCard
//                     key={c._id}
//                     comment={c}
//                     replies={repliesByParent[c._id] || []}
//                     canDelete={
//                       (typeof c.author === "string" ? c.author : c.author?._id) === user?._id ||
//                       isOwner
//                     }
//                     onDelete={handleCommentDelete}
//                     onLike={handleCommentLike}
//                     onEdit={handleCommentEdit}
//                     onReplySubmit={handleReplySubmit}
//                     currentUserId={user?._id}
//                     isOwner={isOwner}
//                     replyToId={replyToId}
//                     setReplyToId={setReplyToId}
//                     gifOpenForId={gifOpenForId}
//                     setGifOpenForId={setGifOpenForId}
//                   />
//                 ))
//               )}
//             </div>

//             {story.comments.length >= 5 && (
//               <p className="text-center text-xs text-neutral-400 mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
//                 {story.comments.length} total reflections
//               </p>
//             )}
//           </section>
//         </main>
//       </div>
//     </>
//   );
// };


import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import api from "../../services/api";
import toast from "react-hot-toast";
import moment from "moment";
import { ErrorCard } from "../../components/ErrorCard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Comment {
  _id: string;
  comment: string;
  gif?: string;
  author: {
    _id: string;
    username: string;
    name: string;
    image?: { url: string };
  };
  timeStamp: string;
  parentId?: string | null;
  likes?: string[];
  likesCount?: number;
  editedAt?: string;
}

interface Story {
  _id: string;
  title: string;
  story: string;
  category: string;
  image?: { url: string; filename: string };
  owner: { _id: string; username: string; name: string; image?: { url: string } };
  views: string[];
  likedBy: string[];
  likesCounts: number;
  comments: Comment[];
  timeStamp: string;
}

interface LikedByUser {
  _id: string;
  username: string;
  name?: string;
  image?: { url: string };
}

type FontSize = "sm" | "base" | "lg" | "xl";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
];

const FONT_OPTIONS: { key: FontSize; label: string; preview: string }[] = [
  { key: "sm", label: "Compact", preview: "15px" },
  { key: "base", label: "Default", preview: "17px" },
  { key: "lg", label: "Relaxed", preview: "20px" },
  { key: "xl", label: "Spacious", preview: "24px" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap');

  :root {
    /* Reference palette — soft lavender bg, pure white cards, deep black accents */
    --bg: #F5F4F8;
    --card: #FFFFFF;
    --card-dark: #0F1114;
    --border: #EEEDF2;
    --border-hover: #E4E3E9;

    --text: #14151A;
    --text-mid: #6B7280;
    --text-soft: #9CA3AF;
    --text-muted: #C4C6CC;

    --accent-red: #F56565;
    --accent-purple: #7B7FE8;
    --accent-green: #4AD990;

    --shadow-sm: 0 1px 2px rgba(20, 21, 26, 0.04);
    --shadow-md: 0 4px 16px rgba(20, 21, 26, 0.06);
    --shadow-lg: 0 12px 40px rgba(20, 21, 26, 0.08);
    --shadow-xl: 0 20px 60px rgba(20, 21, 26, 0.10);

    --radius-sm: 12px;
    --radius-md: 16px;
    --radius-lg: 20px;
    --radius-xl: 24px;
    --radius-full: 9999px;

    --font: 'Manrope', 'Inter', system-ui, sans-serif;
  }

  .dark {
    --bg: #0A0B0F;
    --card: #14161B;
    --card-dark: #FFFFFF;
    --border: #22252C;
    --border-hover: #2C3038;
    --text: #F5F6F8;
    --text-mid: #A8ABB4;
    --text-soft: #737680;
    --text-muted: #4A4D55;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
    --shadow-xl: 0 20px 60px rgba(0,0,0,0.6);
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* ── Progress ── */
  .progress {
    position: fixed; top: 0; left: 0; right: 0; height: 3px;
    background: var(--text); transform-origin: left; z-index: 9999;
    transition: width 0.1s;
  }

  /* ── Story Body ── */
  .body-content {
    font-family: var(--font);
    color: var(--text);
    line-height: 1.85;
    letter-spacing: -0.011em;
  }
  .body-content p { margin: 0 0 1.5em; }
  .body-content p:last-child { margin-bottom: 0; }
  .body-content p:empty { display: none; }
  .body-content h1, .body-content h2, .body-content h3,
  .body-content h4, .body-content h5, .body-content h6 {
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: -0.02em;
    color: var(--text);
    margin: 2em 0 0.6em;
  }
  .body-content h1 { font-size: 1.9em; }
  .body-content h2 { font-size: 1.55em; }
  .body-content h3 { font-size: 1.3em; }
  .body-content strong { font-weight: 700; color: var(--text); }
  .body-content em { font-style: italic; }
  .body-content a { color: var(--accent-purple); text-decoration: underline; text-underline-offset: 3px; }
  .body-content ul, .body-content ol { margin: 1em 0 1.5em; padding-left: 1.5rem; }
  .body-content ul { list-style: disc; }
  .body-content ol { list-style: decimal; }
  .body-content li { margin-bottom: .4em; }
  .body-content blockquote {
    margin: 1.75em 0;
    padding: 1.2rem 1.4rem;
    background: var(--bg);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--text);
    font-style: italic;
    color: var(--text-mid);
  }
  .body-content code {
    font-family: 'JetBrains Mono', monospace;
    background: var(--bg);
    padding: .15em .4em;
    border-radius: 6px;
    font-size: .88em;
  }
  .body-content pre {
    background: var(--card-dark);
    color: #F5F6F8;
    border-radius: var(--radius-md);
    padding: 1.25rem 1.5rem;
    overflow-x: auto;
    margin: 1.5em 0;
    font-size: .88em;
    line-height: 1.7;
  }
  .body-content pre code { background: none; padding: 0; }
  .body-content img { max-width: 100%; height: auto; border-radius: var(--radius-md); margin: 1.5em auto; display: block; }
  .body-content hr { border: none; height: 1px; background: var(--border); margin: 2em 0; }
  .body-content .ql-align-center { text-align: center; }
  .body-content .ql-align-right { text-align: right; }
  .body-content .ql-align-justify { text-align: justify; }
  .body-content .ql-video {
    width: 100%; aspect-ratio: 16/9;
    border-radius: var(--radius-md); border: none; margin: 1.5em 0;
  }

  .fs-sm   { font-size: 15px !important; }
  .fs-base { font-size: 17px !important; }
  .fs-lg   { font-size: 19px !important; }
  .fs-xl   { font-size: 22px !important; }
  @media (max-width: 640px) {
    .fs-sm   { font-size: 14px !important; }
    .fs-base { font-size: 16px !important; }
    .fs-lg   { font-size: 18px !important; }
    .fs-xl   { font-size: 20px !important; }
  }

  /* ── Reusable primitives ── */
  .card {
    background: var(--card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
  }
  .card-flat {
    background: var(--card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
  }

  .pill-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px;
    background: var(--card);
    color: var(--text);
    border-radius: var(--radius-full);
    font-family: var(--font);
    font-weight: 600;
    font-size: 13px;
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;
  }
  .pill-btn:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
  .pill-btn:active { transform: scale(0.97); }

  .pill-btn-dark {
    background: var(--card-dark);
    color: var(--card);
  }
  .dark .pill-btn-dark { color: var(--text); }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--card);
    color: var(--text);
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all 0.18s ease;
  }
  .icon-btn:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
  .icon-btn:active { transform: scale(0.94); }

  .icon-btn-dark {
    background: var(--card-dark);
    color: var(--card);
  }
  .dark .icon-btn-dark { color: var(--text); }

  .tap { transition: transform 0.12s, opacity 0.15s; cursor: pointer; }
  .tap:active { transform: scale(0.96); opacity: 0.85; }

  /* ── Animations ── */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heartPop {
    0% { transform: scale(1); }
    30% { transform: scale(1.4); }
    60% { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
  @keyframes wave {
    0%,100% { transform: scaleY(1); }
    50%     { transform: scaleY(1.7); }
  }
  .fade-in   { animation: fadeIn 0.5s cubic-bezier(.16,1,.3,1) both; }
  .scale-in  { animation: scaleIn 0.22s cubic-bezier(.16,1,.3,1) both; }
  .slide-up  { animation: slideUp 0.32s cubic-bezier(.16,1,.3,1) both; }
  .heart-pop { animation: heartPop 0.42s cubic-bezier(.36,.07,.19,.97); }
  .wave-bar  { animation: wave 0.65s ease-in-out infinite; transform-origin: center; }

  textarea { field-sizing: content; resize: none; }
`;

// ─── Reading Progress ────────────────────────────────────────────────────────
const Progress: React.FC = () => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const t = el.scrollTop || document.body.scrollTop;
      const h = el.scrollHeight - el.clientHeight;
      setW(h > 0 ? Math.min(100, (t / h) * 100) : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return <div className="progress" style={{ width: `${w}%` }} />;
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ src?: string; name: string; size?: number; className?: string }> = ({
  src, name, size = 36, className = ""
}) => (
  <img
    src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=14151A&color=FFF&size=80&bold=true`}
    alt=""
    loading="lazy"
    style={{ width: size, height: size }}
    className={`rounded-full object-cover flex-shrink-0 ${className}`}
  />
);

// ─── Voice Helper ────────────────────────────────────────────────────────────
function getBestVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const rx = [/google.*english/i, /samantha/i, /karen/i, /daniel/i, /natural/i, /neural/i];
  const en = all.filter((v) => v.lang.startsWith("en"));
  const good = en.filter((v) => rx.some((r) => r.test(v.name)));
  return good.length ? good : en.slice(0, 5);
}

// ─── Waveform ────────────────────────────────────────────────────────────────
const Waveform: React.FC<{ progress: number; playing: boolean; onSeek: (p: number) => void }> = ({
  progress, playing, onSeek
}) => {
  const bars = useMemo(() => Array.from({ length: 42 }, () => 4 + Math.random() * 20), []);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onClick={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
      }}
      className="flex-1 h-9 flex items-center gap-[2px] cursor-pointer overflow-hidden"
    >
      {bars.map((h, i) => {
        const f = i / bars.length;
        const active = f <= progress;
        const near = playing && Math.abs(f - progress) < 0.04;
        return (
          <span key={i} className={near ? "wave-bar" : ""} style={{
            display: "inline-block", width: 3, flexShrink: 0, height: h, borderRadius: 3,
            background: active ? "var(--text)" : "var(--border-hover)",
            transformOrigin: "center",
          }} />
        );
      })}
    </div>
  );
};

// ─── Audio Player Card ───────────────────────────────────────────────────────
const AudioCard: React.FC<{ text: string }> = ({ text }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [supported, setSupported] = useState(true);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!("speechSynthesis" in window)) { setSupported(false); return; }
    const load = () => {
      const a = window.speechSynthesis.getVoices();
      if (!a.length) return;
      const b = getBestVoices(a); setVoices(b);
      setVoiceName((p) => (p && b.find((v) => v.name === p) ? p : b[0]?.name ?? ""));
    };
    load(); window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.cancel(); cancelAnimationFrame(rafRef.current!); };
  }, []);

  useEffect(() => { setDuration(Math.max((text.trim().split(/\s+/).length / 155) * 60 / rate, 1)); }, [text, rate]);
  useEffect(() => () => { window.speechSynthesis.cancel(); cancelAnimationFrame(rafRef.current!); }, []);

  const fmt = (s: number) => !isFinite(s) || s < 0 ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const stop = useCallback(() => {
    window.speechSynthesis.cancel(); setPlaying(false); setProgress(0); setCurTime(0);
    elapsedRef.current = 0; cancelAnimationFrame(rafRef.current!);
  }, []);

  const tick = useCallback(() => {
    const e = elapsedRef.current + (Date.now() - startRef.current) / 1000;
    setCurTime(Math.min(e, duration)); setProgress(Math.min(e / duration, 1));
    if (e >= duration) { stop(); return; }
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, stop]);

  const speak = useCallback((sc = 0) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const sl = text.substring(sc).trim(); if (!sl) return;
    const u = new SpeechSynthesisUtterance(sl);
    u.rate = rate; u.pitch = 1; u.volume = 1;
    const v = voices.find((v) => v.name === voiceName); if (v) u.voice = v;
    u.onend = stop; u.onerror = stop;
    window.speechSynthesis.speak(u);
    startRef.current = Date.now(); setPlaying(true);
    cancelAnimationFrame(rafRef.current!); rafRef.current = requestAnimationFrame(tick);
  }, [supported, text, rate, voices, voiceName, tick, stop]);

  const toggle = () => {
    if (!supported) { toast.error("Not supported"); return; }
    if (playing) {
      window.speechSynthesis.pause();
      elapsedRef.current += (Date.now() - startRef.current) / 1000;
      setPlaying(false); cancelAnimationFrame(rafRef.current!);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume(); startRef.current = Date.now(); setPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    } else { elapsedRef.current = 0; setProgress(0); setCurTime(0); speak(0); }
  };

  const seek = (p: number) => {
    const w = text.split(/\s+/), wi = Math.floor(p * w.length);
    elapsedRef.current = p * duration; setProgress(p); setCurTime(p * duration);
    if (playing) speak(w.slice(0, wi).join(" ").length);
  };

  if (!supported) return null;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <button
          onClick={toggle}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 tap"
          style={{ background: "var(--card-dark)", color: "var(--card)" }}
        >
          <i className={`${playing ? "ri-pause-fill" : "ri-play-fill"} text-lg`} style={playing ? {} : { marginLeft: 2 }} />
        </button>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
              Audio
            </span>
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--text-mid)" }}>
              {playing || progress > 0 ? fmt(curTime) : fmt(duration)}
            </span>
          </div>
          <Waveform progress={progress} playing={playing} onSeek={seek} />
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-9 h-9 rounded-full flex items-center justify-center tap"
          style={{
            background: showSettings ? "var(--card-dark)" : "var(--bg)",
            color: showSettings ? "var(--card)" : "var(--text-mid)"
          }}
        >
          <i className="ri-equalizer-3-line text-sm" />
        </button>
      </div>
      {showSettings && (
        <div className="px-4 sm:px-5 py-4 space-y-3 slide-up" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>Speed</span>
            <div className="flex gap-1">
              {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => { setRate(r); if (playing) stop(); }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold tap"
                  style={{
                    background: rate === r ? "var(--text)" : "var(--bg)",
                    color: rate === r ? "var(--card)" : "var(--text-mid)"
                  }}
                >
                  {r}×
                </button>
              ))}
            </div>
          </div>
          {voices.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "var(--text-soft)" }}>Voice</span>
              <select
                value={voiceName}
                onChange={(e) => { setVoiceName(e.target.value); if (playing) stop(); }}
                className="text-xs font-semibold rounded-lg px-3 py-1.5 outline-none flex-1 max-w-[200px]"
                style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
              >
                {voices.map((v) => <option key={v.name} value={v.name}>{v.name.length > 28 ? v.name.slice(0, 28) + "…" : v.name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Translate Helper ────────────────────────────────────────────────────────
async function translateText(text: string, target: string): Promise<string> {
  const sentences = text.split(/(?<=[.!?।؟])\s+/);
  const chunks: string[] = []; let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).length > 420) { if (cur) chunks.push(cur.trim()); cur = s; }
    else cur += (cur ? " " : "") + s;
  }
  if (cur) chunks.push(cur.trim());
  const results = await Promise.all(chunks.map(async (c) => {
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(c)}&langpair=en|${target}`);
      const d = await r.json();
      return d.responseStatus === 200 ? (d.responseData?.translatedText ?? c) : c;
    } catch { return c; }
  }));
  return results.join(" ");
}

// ─── Bottom Sheet ────────────────────────────────────────────────────────────
const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
  open, onClose, title, children
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full sm:max-w-md rounded-t-[28px] sm:rounded-[24px] p-6 slide-up max-h-[85vh] overflow-y-auto no-scrollbar"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-xl)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: "var(--border-hover)" }} />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center tap"
            style={{ background: "var(--bg)", color: "var(--text-mid)" }}
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── Translate Sheet ─────────────────────────────────────────────────────────
const TranslateSheet: React.FC<{ open: boolean; onClose: () => void; onSelect: (c: string) => void; current: string }> = ({
  open, onClose, onSelect, current
}) => (
  <Sheet open={open} onClose={onClose} title="Translate">
    <div className="grid grid-cols-2 gap-2">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => { onSelect(l.code); onClose(); }}
          className="flex items-center gap-2.5 p-3 rounded-2xl text-left tap"
          style={{
            background: current === l.code ? "var(--text)" : "var(--bg)",
            color: current === l.code ? "var(--card)" : "var(--text)"
          }}
        >
          <span className="text-xl">{l.flag}</span>
          <span className="text-sm font-semibold truncate flex-1">{l.name}</span>
          {current === l.code && <i className="ri-check-line flex-shrink-0" />}
        </button>
      ))}
    </div>
  </Sheet>
);

// ─── Font Sheet ──────────────────────────────────────────────────────────────
const FontSheet: React.FC<{ open: boolean; onClose: () => void; size: FontSize; onChange: (s: FontSize) => void }> = ({
  open, onClose, size, onChange
}) => (
  <Sheet open={open} onClose={onClose} title="Reading Size">
    <div className="space-y-2">
      {FONT_OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => { onChange(o.key); onClose(); }}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left tap"
          style={{
            background: size === o.key ? "var(--text)" : "var(--bg)",
            color: size === o.key ? "var(--card)" : "var(--text)"
          }}
        >
          <span className="w-10 text-center flex-shrink-0 font-bold" style={{ fontSize: o.preview }}>Ag</span>
          <span className="text-sm font-semibold">{o.label}</span>
          {size === o.key && <i className="ri-check-line ml-auto flex-shrink-0" />}
        </button>
      ))}
    </div>
  </Sheet>
);

// ─── GIF Picker ──────────────────────────────────────────────────────────────
const GifPicker: React.FC<{ onSelect: (url: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => {
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!q.trim()) return; setLoading(true);
    try { const r = await api.get("/stories/search-gif", { params: { q } }); setGifs(r.data || []); }
    catch { toast.error("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="card p-3 slide-up">
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-soft)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search GIFs…"
            autoFocus
            className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--bg)", color: "var(--text)" }}
          />
        </div>
        <button
          onClick={search}
          className="w-10 h-10 rounded-xl flex items-center justify-center tap flex-shrink-0"
          style={{ background: "var(--card-dark)", color: "var(--card)" }}
        >
          {loading ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-search-line" />}
        </button>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center tap flex-shrink-0"
          style={{ background: "var(--bg)", color: "var(--text-mid)" }}
        >
          <i className="ri-close-line" />
        </button>
      </div>
      {gifs.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto no-scrollbar rounded-xl">
          {gifs.map((g) => (
            <img
              key={g.id}
              src={g.images.fixed_height.url}
              onClick={() => onSelect(g.images.fixed_height.url)}
              className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              loading="lazy"
              alt=""
            />
          ))}
        </div>
      )}
      {!loading && !gifs.length && (
        <p className="text-center text-xs py-6" style={{ color: "var(--text-soft)" }}>
          {q ? `Nothing found` : "Search for GIFs"}
        </p>
      )}
    </div>
  );
};

// ─── Comment Box ─────────────────────────────────────────────────────────────
const CommentBox: React.FC<{
  onSubmit: (t: string, g?: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  compact?: boolean;
}> = ({ onSubmit, placeholder = "Add a comment…", autoFocus, onCancel, compact }) => {
  const [text, setText] = useState("");
  const [gif, setGif] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const { user } = useAuth();
  const has = text.trim() || gif;
  const expanded = focused || has || autoFocus;

  const submit = async () => {
    if (!has || posting) return;
    setPosting(true);
    try {
      await onSubmit(text.trim(), gif || undefined);
      setText(""); setGif(null); setGifOpen(false); setFocused(false);
    } finally { setPosting(false); }
  };

  return (
    <div className="flex gap-3 items-start">
      {!compact && <Avatar src={user?.image?.url} name={user?.username || "U"} size={36} />}
      <div className="flex-1 min-w-0">
        <div
          className="card overflow-hidden transition-all"
          style={{ boxShadow: expanded ? "var(--shadow-md)" : "var(--shadow-sm)" }}
        >
          {gif && (
            <div className="p-3 pb-0">
              <div className="relative inline-block">
                <img src={gif} className="rounded-xl max-w-[160px] max-h-[100px] object-cover" alt="" />
                <button
                  onClick={() => setGif(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: "var(--card-dark)", color: "var(--card)" }}
                >
                  <i className="ri-close-line" />
                </button>
              </div>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            rows={1}
            autoFocus={autoFocus}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              if (e.key === "Escape" && onCancel) onCancel();
            }}
            className={`w-full bg-transparent outline-none text-sm leading-relaxed ${
              compact ? "px-4 py-2.5 min-h-[42px] max-h-[120px]" : "px-4 pt-3.5 pb-2 min-h-[52px] max-h-[160px]"
            }`}
            style={{ color: "var(--text)", fontFamily: "var(--font)" }}
          />
          {expanded && (
            <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
              <button
                onClick={() => setGifOpen(!gifOpen)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold tap flex items-center gap-1"
                style={{
                  background: gifOpen ? "var(--text)" : "transparent",
                  color: gifOpen ? "var(--card)" : "var(--text-soft)"
                }}
              >
                <i className="ri-file-gif-line text-sm" /> GIF
              </button>
              <div className="flex gap-2">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold tap"
                    style={{ color: "var(--text-mid)" }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={submit}
                  disabled={!has || posting}
                  className="pill-btn pill-btn-dark"
                  style={{ height: 34, padding: "0 14px", fontSize: 12, opacity: has ? 1 : 0.4 }}
                >
                  {posting ? <i className="ri-loader-4-line animate-spin" /> : (
                    <>
                      <span>{compact ? "Reply" : "Post"}</span>
                      <i className="ri-arrow-right-up-line text-sm" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        {gifOpen && (
          <div className="mt-2">
            <GifPicker onSelect={(u) => { setGif(u); setGifOpen(false); }} onClose={() => setGifOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Single Comment ──────────────────────────────────────────────────────────
const Comment: React.FC<{
  c: Comment;
  replies: Comment[];
  storyOwnerId: string;
  currentUserId?: string;
  isStoryOwner: boolean;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onEdit: (id: string, t: string) => Promise<void>;
  onReply: (pid: string, t: string, g?: string) => Promise<void>;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  depth?: number;
}> = ({
  c, replies, storyOwnerId, currentUserId, isStoryOwner,
  onDelete, onLike, onEdit, onReply, replyTo, setReplyTo, depth = 0
}) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(c.comment);
  const [showReplies, setShowReplies] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const authorId = typeof c.author === "string" ? c.author : c.author?._id;
  const isMine = authorId === currentUserId;
  const canDelete = isMine || isStoryOwner;
  const isStoryAuthor = authorId === storyOwnerId;
  const hasLiked = c.likes?.some((id) => (typeof id === "string" ? id : (id as any)?._id) === currentUserId) || false;
  const isReply = depth > 0;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); setDelConfirm(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [menuOpen]);

  return (
    <div>
      <div className="flex gap-2.5 group">
        <Link to={`/profile/${c.author.username}`} className="flex-shrink-0">
          <Avatar src={c.author.image?.url} name={c.author.username} size={isReply ? 30 : 36} />
        </Link>

        <div className="flex-1 min-w-0">
          <div
            className={`rounded-2xl px-4 py-3 ${isReply ? "" : "card"}`}
            style={isReply ? { background: "var(--bg)" } : {}}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Link
                to={`/profile/${c.author.username}`}
                className="text-[13px] font-bold hover:underline truncate"
                style={{ color: "var(--text)" }}
              >
                {c.author.name || c.author.username}
              </Link>

              {isStoryAuthor && (
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                  style={{ background: "var(--text)", color: "var(--card)" }}
                >
                  Author
                </span>
              )}

              <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-soft)" }}>
                {moment(c.timeStamp).fromNow()}
                {c.editedAt && <span className="italic ml-1">· edited</span>}
              </span>

              {canDelete && !editing && (
                <div className="relative ml-auto flex-shrink-0" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 tap"
                    style={{ color: "var(--text-soft)" }}
                  >
                    <i className="ri-more-2-fill text-sm" />
                  </button>
                  {menuOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 w-36 rounded-xl py-1 z-50 scale-in overflow-hidden"
                      style={{ background: "var(--card)", boxShadow: "var(--shadow-lg)" }}
                    >
                      {isMine && (
                        <button
                          onClick={() => { setEditing(true); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold tap"
                          style={{ color: "var(--text-mid)" }}
                        >
                          <i className="ri-edit-line text-sm" /> Edit
                        </button>
                      )}
                      {canDelete && !delConfirm && (
                        <button
                          onClick={() => setDelConfirm(true)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold tap"
                          style={{ color: "var(--accent-red)" }}
                        >
                          <i className="ri-delete-bin-6-line text-sm" /> Delete
                        </button>
                      )}
                      {delConfirm && (
                        <div className="px-3 py-2 space-y-1.5">
                          <p className="text-[11px] font-semibold" style={{ color: "var(--accent-red)" }}>Confirm?</p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => { onDelete(c._id); setMenuOpen(false); setDelConfirm(false); }}
                              className="flex-1 px-2 py-1 rounded-lg text-[11px] font-bold tap"
                              style={{ background: "var(--accent-red)", color: "#fff" }}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDelConfirm(false)}
                              className="flex-1 px-2 py-1 rounded-lg text-[11px] font-bold tap"
                              style={{ background: "var(--bg)", color: "var(--text-mid)" }}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            {editing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      onEdit(c._id, editText.trim()); setEditing(false);
                    }
                    if (e.key === "Escape") { setEditing(false); setEditText(c.comment); }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none min-h-[56px] max-h-[200px]"
                  style={{
                    background: "var(--card)", color: "var(--text)",
                    border: "1px solid var(--border)", fontFamily: "var(--font)"
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setEditing(false); setEditText(c.comment); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold tap"
                    style={{ color: "var(--text-mid)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (editText.trim() && editText.trim() !== c.comment) await onEdit(c._id, editText.trim());
                      setEditing(false);
                    }}
                    disabled={!editText.trim() || editText.trim() === c.comment}
                    className="pill-btn pill-btn-dark"
                    style={{ height: 32, padding: "0 12px", fontSize: 11 }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {c.comment && c.comment !== "Attached GIF" && (
                  <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: "var(--text-mid)" }}>
                    {c.comment}
                  </p>
                )}
                {c.gif && <img src={c.gif} alt="" className="mt-2 rounded-xl max-w-[180px]" loading="lazy" />}
              </>
            )}
          </div>

          {/* Actions */}
          {!editing && (
            <div className="flex items-center gap-4 mt-1.5 ml-1">
              <button
                onClick={() => { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 420); onLike(c._id); }}
                className="inline-flex items-center gap-1 text-[12px] font-semibold tap"
                style={{ color: hasLiked ? "var(--accent-red)" : "var(--text-soft)" }}
              >
                <i className={`${hasLiked ? "ri-heart-3-fill" : "ri-heart-3-line"} text-[14px] ${likeAnim ? "heart-pop" : ""}`} />
                {(c.likesCount || 0) > 0 && <span>{c.likesCount}</span>}
              </button>
              <button
                onClick={() => setReplyTo(replyTo === c._id ? null : c._id)}
                className="text-[12px] font-semibold tap"
                style={{ color: replyTo === c._id ? "var(--text)" : "var(--text-soft)" }}
              >
                Reply
              </button>
            </div>
          )}

          {/* Reply box */}
          {replyTo === c._id && (
            <div className="mt-3 slide-up">
              <CommentBox
                onSubmit={async (t, g) => {
                  await onReply(c.parentId || c._id, t, g);
                  setReplyTo(null); setShowReplies(true);
                }}
                placeholder={`Reply to ${c.author.name || c.author.username}…`}
                autoFocus
                compact
                onCancel={() => setReplyTo(null)}
              />
            </div>
          )}

          {/* Nested */}
          {replies.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-[12px] font-bold mb-2 tap flex items-center gap-1"
                style={{ color: "var(--text)" }}
              >
                <i className={`text-[11px] ${showReplies ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}`} />
                {showReplies ? "Hide" : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
              </button>
              {showReplies && (
                <div className="ml-1 pl-3 space-y-3" style={{ borderLeft: "2px solid var(--border)" }}>
                  {replies.map((r, i) => (
                    <div key={r._id} className="fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <Comment
                        c={r} replies={[]} storyOwnerId={storyOwnerId} currentUserId={currentUserId}
                        isStoryOwner={isStoryOwner} onDelete={onDelete} onLike={onLike} onEdit={onEdit}
                        onReply={onReply} replyTo={replyTo} setReplyTo={setReplyTo} depth={depth + 1}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Liked By Popover ────────────────────────────────────────────────────────
const LikedByPopover: React.FC<{ users: LikedByUser[]; loading: boolean; onClose: () => void }> = ({
  users, loading, onClose
}) => (
  <div
    className="absolute left-0 top-full mt-2 w-64 rounded-2xl z-50 scale-in overflow-hidden"
    style={{ background: "var(--card)", boxShadow: "var(--shadow-lg)" }}
  >
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>Liked by</span>
      <button onClick={onClose} className="tap" style={{ color: "var(--text-soft)" }}>
        <i className="ri-close-line text-sm" />
      </button>
    </div>
    <div className="max-h-56 overflow-y-auto no-scrollbar p-1.5">
      {loading ? (
        <div className="py-8 flex justify-center">
          <i className="ri-loader-4-line animate-spin text-xl" style={{ color: "var(--border-hover)" }} />
        </div>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-xs" style={{ color: "var(--text-soft)" }}>No likes yet</p>
      ) : (
        users.map((u) => (
          <Link
            key={u._id}
            to={`/profile/${u.username}`}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl tap hover:opacity-80"
          >
            <Avatar src={u.image?.url} name={u.username} size={32} />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{u.name || u.username}</p>
              <p className="text-[11px] truncate" style={{ color: "var(--text-soft)" }}>@{u.username}</p>
            </div>
          </Link>
        ))
      )}
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export const StoryRead: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeAnim, setLikeAnim] = useState(false);

  const [likedByOpen, setLikedByOpen] = useState(false);
  const [likedByUsers, setLikedByUsers] = useState<LikedByUser[]>([]);
  const [likedByLoading, setLikedByLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [translateOpen, setTranslateOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const [fontOpen, setFontOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("base");

  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"new" | "top">("new");

  const moreRef = useRef<HTMLDivElement>(null);
  const likedByRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLElement>(null);

  const mainComments = useMemo(() => story?.comments.filter((c) => !c.parentId) || [], [story?.comments]);
  const repliesMap = useMemo(() => {
    const m: Record<string, Comment[]> = {};
    story?.comments.forEach((c) => { if (c.parentId) { (m[c.parentId] ??= []).push(c); } });
    Object.values(m).forEach((arr) => arr.sort((a, b) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime()));
    return m;
  }, [story?.comments]);
  const sorted = useMemo(() => {
    const l = [...mainComments];
    return sortBy === "top"
      ? l.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
      : l.sort((a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime());
  }, [mainComments, sortBy]);

  useEffect(() => {
    const s = localStorage.getItem("story_fs");
    if (s && ["sm", "base", "lg", "xl"].includes(s)) setFontSize(s as FontSize);
  }, []);
  useEffect(() => { localStorage.setItem("story_fs", fontSize); }, [fontSize]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (likedByRef.current && !likedByRef.current.contains(e.target as Node)) setLikedByOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("joinStory", id);
    const onCreated = (nc: Comment) => setStory((p) => p && !p.comments.some((c) => c._id === nc._id) ? { ...p, comments: [nc, ...p.comments] } : p);
    const onDeleted = ({ commentId }: { commentId: string }) => setStory((p) => p ? { ...p, comments: p.comments.filter((c) => c._id !== commentId && c.parentId !== commentId) } : p);
    const onUpdated = (uc: Comment) => setStory((p) => p ? { ...p, comments: p.comments.map((c) => c._id === uc._id ? uc : c) } : p);
    const onLiked = ({ commentId, likesCount, likes }: any) => setStory((p) => p ? { ...p, comments: p.comments.map((c) => c._id === commentId ? { ...c, likesCount, likes } : c) } : p);
    socket.on("commentCreated", onCreated); socket.on("commentDeleted", onDeleted);
    socket.on("commentUpdated", onUpdated); socket.on("commentLiked", onLiked);
    return () => { socket.emit("leaveStory", id); socket.off("commentCreated", onCreated); socket.off("commentDeleted", onDeleted); socket.off("commentUpdated", onUpdated); socket.off("commentLiked", onLiked); };
  }, [socket, id]);

  const fetchStory = async () => {
    try {
      setLoading(true); setError(null);
      const r = await api.get(`/stories/${id}`);
      if (r.data.success) {
        setStory(r.data.story);
        setIsLiked(r.data.isLiked);
        setLikesCount(r.data.story.likesCounts ?? r.data.story.likedBy?.length ?? 0);
      }
    } catch (e: any) { setError(e.message || "Failed to load"); } finally { setLoading(false); }
  };
  useEffect(() => { if (id) fetchStory(); }, [id]);

  const handleLike = async () => {
    if (!story) return; const prev = isLiked;
    setIsLiked(!prev); setLikesCount((c) => prev ? c - 1 : c + 1);
    setLikeAnim(true); setTimeout(() => setLikeAnim(false), 420);
    try {
      const r = await api.post(`/stories/${story._id}/likes`);
      if (r.data.success) { setIsLiked(r.data.liked); setLikesCount(r.data.likesCount); }
    } catch {
      setIsLiked(prev); setLikesCount((c) => prev ? c + 1 : c - 1);
      toast.error("Failed");
    }
  };

  const openLikedBy = async (e: React.MouseEvent) => {
    e.stopPropagation(); if (!story) return;
    const o = !likedByOpen; setLikedByOpen(o); if (!o) return;
    setLikedByLoading(true);
    try { const r = await api.get(`/stories/${story._id}/likedBy`); setLikedByUsers(r.data.likedBy || []); }
    catch { toast.error("Failed"); } finally { setLikedByLoading(false); }
  };

  const handleShare = async () => {
    if (!story) return;
    if (navigator.share) { try { await navigator.share({ title: story.title, url: location.href }); } catch { } }
    else { await navigator.clipboard.writeText(location.href); toast.success("Link copied"); }
  };

  const handleDelete = async () => {
    if (!story) return;
    try { await api.delete(`/stories/${story._id}`); toast.success("Deleted"); navigate("/stories"); }
    catch { toast.error("Failed"); }
  };

  const handleDownload = async () => {
    if (!story || downloading) return;
    setDownloading(true);
    const tid = toast.loading("Preparing…");
    try {
      try {
        const r = await api.get(`/stories/download/${story._id}`, { responseType: "blob" });
        const u = URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = u; a.download = `${story.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(u); toast.success("Downloaded", { id: tid });
      } catch {
        const pw = window.open("", "_blank");
        if (!pw) { toast.error("Allow popups", { id: tid }); return; }
        pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${story.title}</title>
          <style>body{font-family:system-ui;max-width:660px;margin:40px auto;padding:24px;line-height:1.85}h1{font-size:32px;margin:0 0 12px}img{max-width:100%;border-radius:12px;margin:16px 0}@media print{body{margin:20px}}</style>
        </head><body><h1>${story.title}</h1>${story.image?.url ? `<img src="${story.image.url}"/>` : ""}<p style="color:#666;font-size:14px">By ${story.owner.name || story.owner.username} · ${moment(story.timeStamp).format("MMMM D, YYYY")}</p><div>${story.story.replace(/<script[\s\S]*?<\/script>/gi, "")}</div><script>window.onload=()=>setTimeout(()=>{window.print();window.onafterprint=()=>window.close()},600)<\/script></body></html>`);
        pw.document.close(); toast.success("Print opened", { id: tid });
      }
    } catch { toast.error("Failed", { id: tid }); } finally { setDownloading(false); setMoreOpen(false); }
  };

  const handleComment = async (t: string, g?: string) => {
    try {
      const r = await api.post(`/stories/${id}/comments`, { comment: t, gif: g });
      if (r.data.success) {
        setStory((p) => p && !p.comments.some((c) => c._id === r.data.comment._id) ? { ...p, comments: [r.data.comment, ...p.comments] } : p);
        toast.success("Posted");
      }
    } catch { toast.error("Failed"); }
  };

  const handleReply = async (pid: string, t: string, g?: string) => {
    try {
      const r = await api.post(`/stories/${id}/comments`, { comment: t, gif: g, parentId: pid });
      if (r.data.success) {
        setStory((p) => p && !p.comments.some((c) => c._id === r.data.comment._id) ? { ...p, comments: [r.data.comment, ...p.comments] } : p);
        toast.success("Replied");
      }
    } catch { toast.error("Failed"); }
  };

  const handleEditComment = async (cid: string, t: string) => {
    try {
      const r = await api.put(`/stories/${id}/comments/${cid}`, { comment: t });
      if (r.data.success) {
        setStory((p) => p ? { ...p, comments: p.comments.map((c) => c._id === cid ? r.data.comment : c) } : p);
        toast.success("Updated");
      }
    } catch { toast.error("Failed"); }
  };

  const handleLikeComment = async (cid: string) => {
    try {
      const r = await api.post(`/stories/${id}/comments/${cid}/like`);
      if (r.data.success) {
        setStory((p) => p ? { ...p, comments: p.comments.map((c) => c._id === cid ? { ...c, likesCount: r.data.likesCount, likes: r.data.likes } : c) } : p);
      }
    } catch { toast.error("Failed"); }
  };

  const handleDeleteComment = async (cid: string) => {
    if (!story) return;
    try {
      await api.delete(`/stories/${story._id}/comments/${cid}`);
      setStory((p) => p ? { ...p, comments: p.comments.filter((c) => c._id !== cid && c.parentId !== cid) } : p);
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const handleTranslate = async (code: string) => {
    if (!story) return; setCurrentLang(code);
    if (code === "en") { setTranslatedText(null); return; }
    setTranslating(true); const tid = toast.loading("Translating…");
    try {
      const p = story.story.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      setTranslatedText(await translateText(p, code));
      toast.success("Done", { id: tid });
    } catch { toast.error("Failed", { id: tid }); setCurrentLang("en"); }
    finally { setTranslating(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "var(--bg)" }}>
      <div className="w-9 h-9 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-hover)", borderTopColor: "var(--text)" }} />
      <p className="text-sm font-medium" style={{ color: "var(--text-soft)" }}>Loading…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md"><ErrorCard message={error} onRetry={fetchStory} /></div>
    </div>
  );

  if (!story) return null;

  const isOwner = story.owner?._id === user?._id;
  const fsClass = `fs-${fontSize}`;
  const readMin = Math.max(1, Math.ceil(story.story.replace(/<[^>]*>/g, "").trim().split(/\s+/).length / 220));
  const langInfo = LANGUAGES.find((l) => l.code === currentLang);
  const audioText = (translatedText || story.story).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const total = story.comments.length;

  return (
    <>
      <style>{css}</style>
      <Progress />

      <div className="min-h-screen" style={{ background: "var(--bg)", fontFamily: "var(--font)" }}>

        <TranslateSheet open={translateOpen} onClose={() => setTranslateOpen(false)} onSelect={handleTranslate} current={currentLang} />
        <FontSheet open={fontOpen} onClose={() => setFontOpen(false)} size={fontSize} onChange={setFontSize} />

        {/* Delete Modal */}
        {deleteOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setDeleteOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="relative rounded-3xl p-6 max-w-sm w-full scale-in"
              style={{ background: "var(--card)", boxShadow: "var(--shadow-xl)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#FEE2E2" }}>
                <i className="ri-delete-bin-6-line text-2xl" style={{ color: "var(--accent-red)" }} />
              </div>
              <h3 className="text-xl font-extrabold mb-1" style={{ color: "var(--text)" }}>Delete story?</h3>
              <p className="text-sm mb-6" style={{ color: "var(--text-soft)" }}>This can't be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteOpen(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm tap"
                  style={{ background: "var(--bg)", color: "var(--text)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm text-white tap"
                  style={{ background: "var(--accent-red)" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <main className="max-w-[720px] mx-auto px-4 sm:px-6 pt-5 pb-24">

          {/* Toolbar */}
          <nav className="flex items-center justify-between mb-8">
            <button onClick={() => navigate(-1)} className="icon-btn">
              <i className="ri-arrow-left-line text-lg" />
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setFontOpen(true)} className="icon-btn">
                <span className="font-bold text-sm">Aa</span>
              </button>
              <button
                onClick={() => setTranslateOpen(true)}
                className="pill-btn"
                style={currentLang !== "en" ? { background: "var(--card-dark)", color: "var(--card)" } : {}}
              >
                <span className="text-base leading-none">{langInfo?.flag}</span>
              </button>
              <div className="relative" ref={moreRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMoreOpen(!moreOpen); }}
                  className="icon-btn icon-btn-dark"
                >
                  <i className="ri-more-2-fill text-lg" />
                </button>
                {moreOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl py-1.5 z-50 scale-in origin-top-right overflow-hidden"
                    style={{ background: "var(--card)", boxShadow: "var(--shadow-lg)" }}
                  >
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold tap"
                      style={{ color: "var(--text-mid)" }}
                    >
                      {downloading ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-download-line" />}
                      Download
                    </button>
                    <button
                      onClick={() => { handleShare(); setMoreOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold tap"
                      style={{ color: "var(--text-mid)" }}
                    >
                      <i className="ri-share-line" /> Share
                    </button>
                    {isOwner && (
                      <>
                        <div className="h-px my-1 mx-4" style={{ background: "var(--border)" }} />
                        <Link
                          to={`/write?edit=${story._id}`}
                          onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold tap"
                          style={{ color: "var(--text-mid)" }}
                        >
                          <i className="ri-edit-line" /> Edit
                        </Link>
                        <button
                          onClick={() => { setDeleteOpen(true); setMoreOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold tap"
                          style={{ color: "var(--accent-red)" }}
                        >
                          <i className="ri-delete-bin-6-line" /> Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Article */}
          <article className="fade-in">

            {/* Meta row */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {story.category && (
                <span
                  className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full"
                  style={{ background: "var(--text)", color: "var(--card)" }}
                >
                  {story.category}
                </span>
              )}
              <span className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>
                {moment(story.timeStamp).format("MMM D, YYYY")}
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--text-muted)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>{readMin} min read</span>
            </div>

            {/* Title */}
            <h1
              className="mb-8 break-words"
              style={{
                fontWeight: 800,
                fontSize: "clamp(30px, 5.5vw, 46px)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "var(--text)",
              }}
            >
              {story.title}
            </h1>

            {/* Author card */}
            <Link to={`/profile/${story.owner._id}`} className="card flex items-center gap-3 p-3 mb-8 hover:opacity-90 tap">
              <Avatar src={story.owner.image?.url} name={story.owner.username} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>
                  {story.owner.name || story.owner.username}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-soft)" }}>@{story.owner.username}</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg)" }}>
                <i className="ri-arrow-right-up-line text-sm" style={{ color: "var(--text-mid)" }} />
              </div>
            </Link>

            {/* Cover */}
            {story.image?.url && (
              <div className="mb-8 rounded-3xl overflow-hidden" style={{ aspectRatio: "16/9", background: "var(--border)" }}>
                <img src={story.image.url} alt={story.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}

            {/* Audio */}
            <div className="mb-8"><AudioCard text={audioText} /></div>

            {/* Translation notice */}
            {translating && (
              <div className="card mb-6 flex items-center gap-2.5 px-4 py-3 text-sm font-semibold" style={{ color: "var(--text-mid)" }}>
                <i className="ri-loader-4-line animate-spin" /> Translating…
              </div>
            )}
            {translatedText && !translating && (
              <div className="card mb-6 flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--text)" }}>
                  <span className="text-base">{langInfo?.flag}</span> {langInfo?.name}
                </span>
                <button
                  onClick={() => { setTranslatedText(null); setCurrentLang("en"); }}
                  className="text-xs font-bold tap"
                  style={{ color: "var(--text-mid)" }}
                >
                  Show original
                </button>
              </div>
            )}

            {/* Body */}
            <div className={`body-content ${fsClass}`}>
              {translatedText
                ? <div>{translatedText.split(/\n\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>
                : <div dangerouslySetInnerHTML={{ __html: story.story }} />
              }
            </div>

            {/* Divider */}
            <div className="my-10 flex justify-center">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--border-hover)" }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--border-hover)" }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--border-hover)" }} />
              </div>
            </div>

            {/* Actions Card */}
            <div className="card p-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold tap transition-all"
                  style={{
                    background: isLiked ? "#FEE2E2" : "transparent",
                    color: isLiked ? "var(--accent-red)" : "var(--text)",
                  }}
                >
                  <i className={`${isLiked ? "ri-heart-3-fill" : "ri-heart-3-line"} text-base ${likeAnim ? "heart-pop" : ""}`} />
                  {likesCount}
                </button>
                <div className="relative" ref={likedByRef}>
                  <button
                    onClick={openLikedBy}
                    className="h-10 px-3 rounded-full text-xs font-semibold tap"
                    style={{ color: "var(--text-soft)" }}
                  >
                    Who?
                  </button>
                  {likedByOpen && <LikedByPopover users={likedByUsers} loading={likedByLoading} onClose={() => setLikedByOpen(false)} />}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => commentsRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold tap"
                  style={{ color: "var(--text)" }}
                >
                  <i className="ri-chat-3-line text-base" />
                  {total}
                </button>
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full flex items-center justify-center tap"
                  style={{ background: "var(--text)", color: "var(--card)" }}
                >
                  <i className="ri-share-line text-sm" />
                </button>
              </div>
            </div>
          </article>

          {/* ── Comments Section ── */}
          <section ref={commentsRef} className="mt-16 scroll-mt-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-extrabold" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                  Comments
                </h2>
                {total > 0 && (
                  <span className="text-sm font-semibold" style={{ color: "var(--text-soft)" }}>
                    ({total})
                  </span>
                )}
              </div>
              {mainComments.length > 1 && (
                <div className="card flex items-center p-1">
                  {(["new", "top"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold tap capitalize transition-all"
                      style={{
                        background: sortBy === s ? "var(--text)" : "transparent",
                        color: sortBy === s ? "var(--card)" : "var(--text-mid)",
                      }}
                    >
                      {s === "new" ? "Newest" : "Top"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="mb-8">
              <CommentBox onSubmit={handleComment} placeholder="Share your thoughts…" />
            </div>

            {/* List */}
            <div className="space-y-5">
              {sorted.length === 0 ? (
                <div className="card p-12 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "var(--bg)" }}
                  >
                    <i className="ri-chat-3-line text-2xl" style={{ color: "var(--text-soft)" }} />
                  </div>
                  <p className="text-base font-bold mb-1" style={{ color: "var(--text)" }}>No comments yet</p>
                  <p className="text-sm" style={{ color: "var(--text-soft)" }}>Be the first to comment</p>
                </div>
              ) : (
                sorted.map((c, i) => (
                  <div key={c._id} className="fade-in" style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}>
                    <Comment
                      c={c}
                      replies={repliesMap[c._id] || []}
                      storyOwnerId={story.owner._id}
                      currentUserId={user?._id}
                      isStoryOwner={isOwner}
                      onDelete={handleDeleteComment}
                      onLike={handleLikeComment}
                      onEdit={handleEditComment}
                      onReply={handleReply}
                      replyTo={replyTo}
                      setReplyTo={setReplyTo}
                    />
                  </div>
                ))
              )}
            </div>

            {total >= 5 && (
              <div className="mt-10 pt-6 text-center" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>
                  End of conversation
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
};