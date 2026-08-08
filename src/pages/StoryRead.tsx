
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import moment from "moment";
import { ErrorCard } from "../components/ErrorCard";

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
}

interface Story {
  _id: string;
  title: string;
  story: string;
  category: string;
  image?: { url: string; filename: string };
  owner: {
    _id: string;
    username: string;
    name: string;
    image?: { url: string };
  };
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

// ─── Languages ────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", name: "English",    flag: "🇺🇸" },
  { code: "es", name: "Spanish",    flag: "🇪🇸" },
  { code: "fr", name: "French",     flag: "🇫🇷" },
  { code: "de", name: "German",     flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "it", name: "Italian",    flag: "🇮🇹" },
  { code: "hi", name: "Hindi",      flag: "🇮🇳" },
  { code: "ar", name: "Arabic",     flag: "🇸🇦" },
  { code: "ja", name: "Japanese",   flag: "🇯🇵" },
  { code: "zh", name: "Chinese",    flag: "🇨🇳" },
];

// ─── Global Styles ────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .font-serif  { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; }
  .font-sans   { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

  html { scroll-behavior: smooth; }

  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* ── Reading Progress ── */
  .read-progress-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #f97316, #ef4444);
    transform-origin: left;
    z-index: 9999;
    transition: width .1s linear;
  }

  /* ── Story Rich Content ──────────────────────────────────────────────────── */
  /*
    This targets the actual HTML output from your rich text editor (Quill/TipTap/etc).
    Every element is carefully styled to match what the editor produces.
  */
  .story-content {
    font-family: 'Inter', system-ui, sans-serif;
    color: #1a1a2e;
    line-height: 1.92;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .dark .story-content { color: #e2e8f0; }

  /* Paragraphs */
  .story-content p {
    margin: 0 0 1.5em 0;
    line-height: 1.92;
  }
  .story-content p:last-child { margin-bottom: 0; }
  .story-content p:empty { display: none; }

  /* Headings */
  .story-content h1,
  .story-content h2,
  .story-content h3,
  .story-content h4,
  .story-content h5,
  .story-content h6 {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 700;
    color: #0f0f1a;
    line-height: 1.2;
    margin: 2em 0 .6em;
    letter-spacing: -.01em;
  }
  .dark .story-content h1,
  .dark .story-content h2,
  .dark .story-content h3,
  .dark .story-content h4,
  .dark .story-content h5,
  .dark .story-content h6 { color: #f8fafc; }

  .story-content h1 { font-size: 2em; }
  .story-content h2 { font-size: 1.55em; }
  .story-content h3 { font-size: 1.3em; }
  .story-content h4 { font-size: 1.1em; }

  /* Inline */
  .story-content strong, .story-content b { font-weight: 700; color: #0f0f1a; }
  .dark .story-content strong, .dark .story-content b { color: #f1f5f9; }
  .story-content em, .story-content i { font-style: italic; }
  .story-content u  { text-decoration: underline; text-underline-offset: 3px; }
  .story-content s  { text-decoration: line-through; opacity: .65; }
  .story-content mark { background: #fef08a; color: #713f12; border-radius: 2px; padding: 0 2px; }
  .dark .story-content mark { background: #854d0e; color: #fef9c3; }

  /* Links */
  .story-content a {
    color: #f97316;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color .15s;
  }
  .story-content a:hover { color: #ea580c; }

  /* Lists */
  .story-content ul,
  .story-content ol {
    margin: 1em 0 1.5em;
    padding-left: 1.75rem;
  }
  .story-content ul { list-style-type: disc; }
  .story-content ol { list-style-type: decimal; }
  .story-content li {
    margin-bottom: .5em;
    line-height: 1.8;
  }
  .story-content li > ul,
  .story-content li > ol { margin: .35em 0; }

  /* Quill specific list classes */
  .story-content .ql-indent-1 { padding-left: 2em; }
  .story-content .ql-indent-2 { padding-left: 4em; }
  .story-content .ql-indent-3 { padding-left: 6em; }

  /* Blockquote */
  .story-content blockquote {
    margin: 2em 0;
    padding: 1rem 1.25rem;
    border-left: 4px solid #f97316;
    background: #fff7ed;
    border-radius: 0 12px 12px 0;
    font-style: italic;
    color: #7c3516;
    line-height: 1.8;
    position: relative;
  }
  .dark .story-content blockquote {
    background: rgba(249,115,22,.08);
    color: #fed7aa;
    border-left-color: #f97316;
  }
  .story-content blockquote::before {
    content: '"';
    position: absolute;
    top: -10px; left: 14px;
    font-size: 4rem;
    color: #f97316;
    opacity: .2;
    font-family: Georgia, serif;
    line-height: 1;
  }

  /* Code */
  .story-content code {
    font-family: 'Fira Code', 'Cascadia Code', 'Courier New', monospace;
    background: #f1f5f9;
    color: #be123c;
    padding: .1em .4em;
    border-radius: 5px;
    font-size: .875em;
  }
  .dark .story-content code { background: #1e293b; color: #fb7185; }

  .story-content pre {
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    overflow-x: auto;
    margin: 1.5em 0;
    font-size: .875em;
    line-height: 1.7;
  }
  .story-content pre code { background: none; color: inherit; padding: 0; font-size: inherit; }

  /* Images */
  .story-content img {
    max-width: 100%;
    height: auto;
    border-radius: 14px;
    margin: 1.5em auto;
    display: block;
    box-shadow: 0 4px 24px rgba(0,0,0,.08);
  }

  /* HR */
  .story-content hr {
    border: none;
    border-top: 2px solid #f3f4f6;
    margin: 2.5em 0;
  }
  .dark .story-content hr { border-top-color: #1f2937; }

  /* Tables */
  .story-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: .9em;
    overflow: hidden;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
  }
  .dark .story-content table { border-color: #374151; }
  .story-content th {
    background: #f9fafb;
    font-weight: 700;
    padding: .75rem 1rem;
    text-align: left;
    border-bottom: 2px solid #e5e7eb;
  }
  .dark .story-content th { background: #1f2937; border-bottom-color: #374151; }
  .story-content td {
    padding: .65rem 1rem;
    border-bottom: 1px solid #f3f4f6;
  }
  .dark .story-content td { border-bottom-color: #1f2937; }

  /* Text align (Quill classes) */
  .story-content .ql-align-center  { text-align: center; }
  .story-content .ql-align-right   { text-align: right; }
  .story-content .ql-align-justify { text-align: justify; }

  /* Quill video embed */
  .story-content .ql-video {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 14px;
    border: none;
    margin: 1.5em 0;
    display: block;
  }

  /* Font sizes */
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

  /* ── Waveform ── */
  @keyframes waveBar {
    0%,100% { transform: scaleY(1);   }
    50%      { transform: scaleY(1.7); }
  }
  .wave-anim { animation: waveBar 0.65s ease-in-out infinite; transform-origin: center; }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(.93); }
    to   { opacity: 1; transform: scale(1);   }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes likePop {
    0%   { transform: scale(1);    }
    35%  { transform: scale(1.45); }
    65%  { transform: scale(.88);  }
    100% { transform: scale(1);    }
  }

  .anim-fade-up  { animation: fadeUp  .5s cubic-bezier(.16,1,.3,1) both; }
  .anim-scale-in { animation: scaleIn .22s cubic-bezier(.16,1,.3,1) both; }
  .anim-slide-up { animation: slideUp .3s cubic-bezier(.16,1,.3,1) both;  }
  .like-pop      { animation: likePop .38s cubic-bezier(.36,.07,.19,.97);  }

  /* ── Press effect ── */
  .press { transition: transform .12s ease, box-shadow .12s ease; cursor: pointer; }
  .press:hover  { transform: translateY(-1px); }
  .press:active { transform: scale(.96); }

  /* ── Textarea auto-grow ── */
  textarea { field-sizing: content; }
`;

// ─── Reading Progress ─────────────────────────────────────────────────────────
const ReadingProgress: React.FC = () => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el  = document.documentElement;
      const top = el.scrollTop || document.body.scrollTop;
      const h   = el.scrollHeight - el.clientHeight;
      setW(h > 0 ? Math.min(100, (top / h) * 100) : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return <div className="read-progress-bar" style={{ width: `${w}%` }} />;
};

// ─── Voice picker ─────────────────────────────────────────────────────────────
function getBestVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const priority = [
    /google.*english/i,
    /microsoft.*aria/i,
    /microsoft.*jenny/i,
    /microsoft.*guy/i,
    /microsoft.*zira/i,
    /samantha/i,
    /karen/i,
    /daniel/i,
    /moira/i,
    /ava/i,
    /natural/i,
    /neural/i,
    /premium/i,
  ];
  const en   = all.filter((v) => v.lang.startsWith("en"));
  const good = en.filter((v) => priority.some((rx) => rx.test(v.name)));
  return good.length ? good : en.slice(0, 6);
}

// ─── Waveform ─────────────────────────────────────────────────────────────────
const Waveform: React.FC<{
  progress: number;
  playing: boolean;
  onSeek: (p: number) => void;
}> = ({ progress, playing, onSeek }) => {
  const bars = useMemo(
    () => Array.from({ length: 52 }, () => 4 + Math.random() * 24),
    []
  );
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="flex-1 h-10 flex items-center gap-[1.5px] cursor-pointer select-none overflow-hidden"
    >
      {bars.map((h, i) => {
        const frac   = i / bars.length;
        const active = frac <= progress;
        const near   = playing && Math.abs(frac - progress) < 0.045;
        return (
          <span
            key={i}
            className={near ? "wave-anim" : ""}
            style={{
              display: "inline-block",
              width: 3,
              flexShrink: 0,
              height: h,
              borderRadius: 3,
              background: active ? "#f97316" : "#d1d5db",
              opacity: active ? 1 : 0.4,
              transformOrigin: "center",
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Audio Player ─────────────────────────────────────────────────────────────
const AudioPlayer: React.FC<{ text: string }> = ({ text }) => {
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [curTime,   setCurTime]   = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [rate,      setRate]      = useState(1);
  const [showSet,   setShowSet]   = useState(false);
  const [voices,    setVoices]    = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [supported, setSupported] = useState(true);

  const startRef   = useRef(0);
  const elapsedRef = useRef(0);
  const rafRef     = useRef<number>();

  useEffect(() => {
    if (!("speechSynthesis" in window)) { setSupported(false); return; }
    const load = () => {
      const all  = window.speechSynthesis.getVoices();
      if (!all.length) return;
      const best = getBestVoices(all);
      setVoices(best);
      setVoiceName((p) => {
        if (p && best.find((v) => v.name === p)) return p;
        return best[0]?.name ?? "";
      });
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.cancel();
      cancelAnimationFrame(rafRef.current!);
    };
  }, []);

  useEffect(() => {
    const words = text.trim().split(/\s+/).length;
    setDuration(Math.max((words / 155) * 60 / rate, 1));
  }, [text, rate]);

  useEffect(() => () => { window.speechSynthesis.cancel(); cancelAnimationFrame(rafRef.current!); }, []);

  const fmt = (s: number) =>
    !isFinite(s) || s < 0
      ? "0:00"
      : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const stopAll = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlaying(false); setProgress(0); setCurTime(0);
    elapsedRef.current = 0;
    cancelAnimationFrame(rafRef.current!);
  }, []);

  const tick = useCallback(() => {
    const elapsed = elapsedRef.current + (Date.now() - startRef.current) / 1000;
    const capped  = Math.min(elapsed, duration);
    setCurTime(capped);
    setProgress(Math.min(elapsed / duration, 1));
    if (elapsed >= duration) { stopAll(); return; }
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, stopAll]);

  const speak = useCallback(
    (startChar = 0) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const slice = text.substring(startChar).trim();
      if (!slice) return;
      const utt    = new SpeechSynthesisUtterance(slice);
      utt.rate     = rate; utt.pitch = 1; utt.volume = 1;
      const voice  = voices.find((v) => v.name === voiceName);
      if (voice) utt.voice = voice;
      utt.onend    = stopAll;
      utt.onerror  = stopAll;
      window.speechSynthesis.speak(utt);
      startRef.current = Date.now();
      setPlaying(true);
      cancelAnimationFrame(rafRef.current!);
      rafRef.current = requestAnimationFrame(tick);
    },
    [supported, text, rate, voices, voiceName, tick, stopAll]
  );

  const handlePlay = () => {
    if (!supported) { toast.error("Text-to-speech not supported on this browser"); return; }
    if (playing) {
      window.speechSynthesis.pause();
      elapsedRef.current += (Date.now() - startRef.current) / 1000;
      setPlaying(false);
      cancelAnimationFrame(rafRef.current!);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      startRef.current = Date.now();
      setPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      elapsedRef.current = 0; setProgress(0); setCurTime(0);
      speak(0);
    }
  };

  const handleSeek = (p: number) => {
    const words     = text.split(/\s+/);
    const wordIdx   = Math.floor(p * words.length);
    const startChar = words.slice(0, wordIdx).join(" ").length;
    elapsedRef.current = p * duration;
    setProgress(p); setCurTime(p * duration);
    if (playing) speak(startChar);
  };

  if (!supported) return (
    <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900 px-4 py-3 text-center text-xs text-neutral-400">
      Audio not supported in this browser
    </div>
  );

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Play/Pause */}
        <button
          onClick={handlePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center shadow-md press"
          style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}
        >
          {playing
            ? <i className="ri-pause-fill text-xl text-white" />
            : <i className="ri-play-fill text-xl text-white" style={{ marginLeft: 2 }} />
          }
        </button>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[.08em] text-neutral-400 uppercase">
              Listen to story
            </span>
            <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">
              {playing || progress > 0 ? fmt(curTime) : fmt(duration)}
            </span>
          </div>
          <Waveform progress={progress} playing={playing} onSeek={handleSeek} />
        </div>

        <button
          onClick={() => setShowSet((s) => !s)}
          aria-label="Settings"
          className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-colors press ${
            showSet
              ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <i className="ri-equalizer-2-line text-sm" />
        </button>
      </div>

      {showSet && (
        <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3 space-y-3 anim-slide-up">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Speed</span>
            <div className="flex gap-1.5">
              {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => { setRate(r); if (playing) stopAll(); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    rate === r
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {r}×
                </button>
              ))}
            </div>
          </div>
          {voices.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex-shrink-0">
                Voice
              </span>
              <select
                value={voiceName}
                onChange={(e) => { setVoiceName(e.target.value); if (playing) stopAll(); }}
                className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-1.5 outline-none flex-1 max-w-[220px] text-neutral-700 dark:text-neutral-200"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name.length > 30 ? v.name.slice(0, 30) + "…" : v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Translate Modal ──────────────────────────────────────────────────────────
const TranslateModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  currentLang: string;
}> = ({ open, onClose, onSelect, currentLang }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 anim-slide-up max-h-[88vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Translate</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Read in your preferred language</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 press"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { onSelect(lang.code); onClose(); }}
              className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 transition-all text-left press ${
                currentLang === lang.code
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10"
                  : "border-transparent bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate flex-1">
                {lang.name}
              </span>
              {currentLang === lang.code && (
                <i className="ri-check-line text-orange-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Font Size Modal ──────────────────────────────────────────────────────────
const FONT_OPTIONS = [
  { key: "sm"   as FontSize, label: "Small",       desc: "Compact reading",  size: "15px" },
  { key: "base" as FontSize, label: "Default",     desc: "Balanced & clear", size: "17px" },
  { key: "lg"   as FontSize, label: "Large",       desc: "Easy on the eyes", size: "20px" },
  { key: "xl"   as FontSize, label: "Extra Large", desc: "Maximum comfort",  size: "24px" },
];

const FontSizeModal: React.FC<{
  open: boolean;
  onClose: () => void;
  size: FontSize;
  onChange: (s: FontSize) => void;
}> = ({ open, onClose, size, onChange }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 w-full sm:max-w-sm rounded-t-[28px] sm:rounded-[28px] p-6 anim-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Text Size</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 press">
            <i className="ri-close-line text-lg" />
          </button>
        </div>
        <div className="space-y-2">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); onClose(); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all press ${
                size === opt.key
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10"
                  : "border-transparent bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
              }`}
            >
              <span className="font-serif font-bold text-neutral-800 dark:text-white w-10 text-center flex-shrink-0"
                style={{ fontSize: opt.size }}>
                Ag
              </span>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-sm text-neutral-900 dark:text-white">{opt.label}</p>
                <p className="text-xs text-neutral-400">{opt.desc}</p>
              </div>
              {size === opt.key && <i className="ri-check-line text-orange-500 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Translate helper ─────────────────────────────────────────────────────────
async function translateText(text: string, target: string): Promise<string> {
  const sentences = text.split(/(?<=[.!?।؟])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).length > 420) { if (cur) chunks.push(cur.trim()); cur = s; }
    else cur += (cur ? " " : "") + s;
  }
  if (cur) chunks.push(cur.trim());

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const r = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${target}`
        );
        const d = await r.json();
        return d.responseStatus === 200 ? (d.responseData?.translatedText ?? chunk) : chunk;
      } catch { return chunk; }
    })
  );
  return results.join(" ");
}

// ─── Comment Input ────────────────────────────────────────────────────────────
const CommentInput: React.FC<{
  onSubmit: (text: string) => Promise<void>;
  onGifOpen: () => void;
  gifOpen: boolean;
}> = ({ onSubmit, onGifOpen, gifOpen }) => {
  const [text,    setText]    = useState("");
  const [posting, setPosting] = useState(false);
  const { user }  = useAuth();

  const submit = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    await onSubmit(text.trim());
    setText("");
    setPosting(false);
  };

  return (
    <div className="flex gap-3 items-start">
      <img
        src={
          user?.image?.url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username ?? "U")}&background=f97316&color=fff&size=80`
        }
        className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-1 ring-2 ring-white dark:ring-neutral-950"
        alt={user?.username}
      />
      <div className="flex-1 min-w-0">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl rounded-tl-md overflow-hidden focus-within:border-orange-300 dark:focus-within:border-orange-500/50 transition-colors shadow-sm">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder="Write a reflection…"
            rows={2}
            className="w-full px-4 pt-3 pb-1 bg-transparent outline-none resize-none text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 leading-relaxed min-h-[64px] max-h-[160px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onGifOpen}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors press ${
                  gifOpen
                    ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                <i className="ri-file-gif-line text-sm" /> GIF
              </button>
              <span className="text-[10px] text-neutral-300 dark:text-neutral-700 hidden sm:block">
                ⌘↩ to post
              </span>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim() || posting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs disabled:opacity-40 press"
            >
              {posting ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-send-plane-fill" />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Comment Card ─────────────────────────────────────────────────────────────
const CommentCard: React.FC<{
  comment: Comment;
  canDelete: boolean;
  onDelete: (id: string) => void;
}> = ({ comment, canDelete, onDelete }) => {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="flex gap-3 group">
      <Link to={`/profile/${comment.author.username}`} className="flex-shrink-0 mt-0.5">
        <img
          src={
            comment.author.image?.url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.username)}&background=f97316&color=fff&size=80`
          }
          className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-neutral-950"
          alt={comment.author.username}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-baseline gap-2 flex-wrap min-w-0">
              <Link
                to={`/profile/${comment.author.username}`}
                className="font-semibold text-sm text-neutral-900 dark:text-white hover:text-orange-500 transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {comment.author.name || comment.author.username}
              </Link>
              <span className="text-[11px] text-neutral-400 flex-shrink-0">
                {moment(comment.timeStamp).fromNow()}
              </span>
            </div>

            {canDelete && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {confirm ? (
                  <>
                    <button
                      onClick={() => { onDelete(comment._id); setConfirm(false); }}
                      className="text-[11px] font-bold text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                    <span className="text-neutral-300">·</span>
                    <button
                      onClick={() => setConfirm(false)}
                      className="text-[11px] font-bold text-neutral-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirm(true)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-7 h-7 rounded-full flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    title="Delete"
                  >
                    <i className="ri-delete-bin-line text-xs" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          {comment.comment && comment.comment !== "Attached GIF" && (
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed break-words"
              style={{ fontFamily: "Inter, sans-serif" }}>
              {comment.comment}
            </p>
          )}
          {comment.gif && (
            <div className="mt-2">
              <img
                src={comment.gif}
                alt="GIF"
                className="rounded-xl max-w-[200px] w-full"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── GIF Picker ───────────────────────────────────────────────────────────────
const GifPicker: React.FC<{
  onSelect: (url: string) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const [query,   setQuery]   = useState("");
  const [gifs,    setGifs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get("/stories/search-gif", { params: { q: query } });
      setGifs(res.data || []);
    } catch { toast.error("Failed to load GIFs"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl rounded-tl-md p-3 shadow-sm anim-slide-up">
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
            placeholder="Search GIFs…"
            className="w-full bg-neutral-50 dark:bg-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-orange-400/30 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
          />
        </div>
        <button
          onClick={search}
          className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold flex-shrink-0 press"
        >
          {loading ? <i className="ri-loader-4-line animate-spin" /> : "Go"}
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0 press"
        >
          <i className="ri-close-line" />
        </button>
      </div>

      {gifs.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
          {gifs.map((g) => (
            <img
              key={g.id}
              src={g.images.fixed_height.url}
              onClick={() => onSelect(g.images.fixed_height.url)}
              className="w-full h-20 object-cover rounded-xl cursor-pointer hover:opacity-75 transition-opacity"
              loading="lazy"
              alt="gif"
            />
          ))}
        </div>
      )}

      {!loading && gifs.length === 0 && query && (
        <p className="text-center text-xs text-neutral-400 py-4">No GIFs found</p>
      )}
      {!query && !gifs.length && (
        <p className="text-center text-xs text-neutral-400 py-4">
          <i className="ri-image-line mr-1" />
          Search for GIFs to attach
        </p>
      )}
    </div>
  );
};

// ─── Liked-By Popover ────────────────────────────────────────────────────────
const LikedByPopover: React.FC<{
  users: LikedByUser[];
  loading: boolean;
  onClose: () => void;
}> = ({ users, loading, onClose }) => (
  <div className="absolute left-0 top-full mt-2 w-60 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-2xl z-50 anim-scale-in overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Liked by</span>
      <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 press">
        <i className="ri-close-line text-sm" />
      </button>
    </div>
    <div className="max-h-52 overflow-y-auto no-scrollbar p-1.5">
      {loading ? (
        <div className="py-6 flex justify-center">
          <i className="ri-loader-4-line animate-spin text-neutral-300 text-xl" />
        </div>
      ) : users.length === 0 ? (
        <p className="py-5 text-center text-xs text-neutral-400">No likes yet</p>
      ) : (
        users.map((u) => (
          <Link
            key={u._id}
            to={`/profile/${u.username}`}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <img
              src={u.image?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&size=80`}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              alt={u.username}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{u.name || u.username}</p>
              <p className="text-[11px] text-neutral-400 truncate">@{u.username}</p>
            </div>
          </Link>
        ))
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const StoryRead: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [story,       setStory]       = useState<Story | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [isLiked,     setIsLiked]     = useState(false);
  const [likesCount,  setLikesCount]  = useState(0);
  const [likeAnim,    setLikeAnim]    = useState(false);

  const [likedByOpen,    setLikedByOpen]    = useState(false);
  const [likedByUsers,   setLikedByUsers]   = useState<LikedByUser[]>([]);
  const [likedByLoading, setLikedByLoading] = useState(false);

  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [moreOpen,    setMoreOpen]    = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [gifOpen,     setGifOpen]     = useState(false);

  const [translateOpen,  setTranslateOpen]  = useState(false);
  const [currentLang,    setCurrentLang]    = useState("en");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating,    setTranslating]    = useState(false);

  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [fontSize,     setFontSize]     = useState<FontSize>("base");

  const moreRef    = useRef<HTMLDivElement>(null);
  const likedByRef = useRef<HTMLDivElement>(null);

  // Persist font size
  useEffect(() => {
    const s = localStorage.getItem("story_fontSize");
    if (s && ["sm","base","lg","xl"].includes(s)) setFontSize(s as FontSize);
  }, []);
  useEffect(() => { localStorage.setItem("story_fontSize", fontSize); }, [fontSize]);

  // Outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (moreRef.current    && !moreRef.current.contains(e.target as Node))    setMoreOpen(false);
      if (likedByRef.current && !likedByRef.current.contains(e.target as Node)) setLikedByOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Fetch
  const fetchStory = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get(`/stories/${id}`);
      if (res.data.success) {
        setStory(res.data.story);
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.story.likesCounts ?? res.data.story.likedBy?.length ?? 0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load story.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchStory(); }, [id]);

  // ── Like
  const handleLike = async () => {
    if (!story) return;
    const prev = isLiked;
    setIsLiked(!prev);
    setLikesCount((c) => prev ? c - 1 : c + 1);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    try {
      const res = await api.post(`/stories/${story._id}/likes`);
      if (res.data.success) {
        setIsLiked(res.data.liked);
        setLikesCount(res.data.likesCount);
      }
    } catch {
      setIsLiked(prev);
      setLikesCount((c) => prev ? c + 1 : c - 1);
      toast.error("Could not update like");
    }
  };

  // ── Liked-by
  const openLikedBy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!story) return;
    const opening = !likedByOpen;
    setLikedByOpen(opening);
    if (!opening) return;
    setLikedByLoading(true);
    try {
      const res = await api.get(`/stories/${story._id}/likedBy`);
      setLikedByUsers(res.data.likedBy || []);
    } catch { toast.error("Failed to load likes"); }
    finally { setLikedByLoading(false); }
  };

  // ── Share
  const handleShare = async () => {
    if (!story) return;
    if (navigator.share) {
      try { await navigator.share({ title: story.title, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  // ── Delete
  const handleDelete = async () => {
    if (!story) return;
    try {
      await api.delete(`/stories/${story._id}`);
      toast.success("Story deleted");
      navigate("/stories");
    } catch { toast.error("Failed to delete story"); }
  };

  // ── Download PDF
  const handleDownload = async () => {
    if (!story || downloading) return;
    setDownloading(true);
    const tid = toast.loading("Preparing PDF…");
    try {
      try {
        const res = await api.get(`/stories/download/${story._id}`, { responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const a   = document.createElement("a");
        a.href = url; a.download = `${story.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Downloaded!", { id: tid });
      } catch {
        const pw = window.open("", "_blank");
        if (!pw) { toast.error("Allow popups to download", { id: tid }); return; }
        const safe = story.story.replace(/<script[\s\S]*?<\/script>/gi, "");
        pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
          <title>${story.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:wght@700&display=swap');
            body{font-family:'Inter',sans-serif;max-width:680px;margin:40px auto;padding:24px;color:#1a1a2e;line-height:1.8;font-size:16px}
            h1{font-family:'Playfair Display',serif;font-size:36px;margin:0 0 8px;line-height:1.15}
            .meta{color:#f97316;font-weight:600;font-size:13px;margin-bottom:20px;text-transform:uppercase;letter-spacing:.06em}
            .divider{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
            .author{font-size:14px;color:#6b7280;margin-bottom:28px}
            .author strong{color:#1a1a2e}
            img{max-width:100%;border-radius:10px;margin:16px 0}
            blockquote{border-left:3px solid #f97316;padding:.5rem 1rem;margin:1.5rem 0;font-style:italic;color:#92400e;background:#fff7ed;border-radius:0 8px 8px 0}
            pre{background:#0f172a;color:#e2e8f0;border-radius:10px;padding:1rem;overflow:auto;font-size:.85em}
            @media print{body{margin:20px}}
          </style>
        </head><body>
          <p class="meta">${story.category} · ${moment(story.timeStamp).format("MMMM D, YYYY")}</p>
          <h1>${story.title}</h1>
          ${story.image?.url ? `<img src="${story.image.url}" alt="${story.title}" style="margin:16px 0;width:100%"/>` : ""}
          <hr class="divider"/>
          <p class="author">By <strong>${story.owner.name || story.owner.username}</strong> · @${story.owner.username}</p>
          <div>${safe}</div>
          <script>window.onload=()=>{setTimeout(()=>{window.print();window.onafterprint=()=>window.close();},700)}<\/script>
        </body></html>`);
        pw.document.close();
        toast.success("Print dialog opened", { id: tid });
      }
    } catch { toast.error("Download failed", { id: tid }); }
    finally { setDownloading(false); setMoreOpen(false); }
  };

  // ── Comment submit
  const handleCommentSubmit = async (text: string) => {
    try {
      const res = await api.post(`/stories/${id}/comments`, { comment: text });
      if (res.data.success) {
        setStory((p) => p ? { ...p, comments: [res.data.comment, ...p.comments] } : null);
        toast.success("Comment posted!");
      }
    } catch { toast.error("Failed to post comment"); }
  };

  // ── Comment delete
  const handleCommentDelete = async (cid: string) => {
    if (!story) return;
    try {
      await api.delete(`/stories/${story._id}/comments/${cid}`);
      setStory((p) => p ? { ...p, comments: p.comments.filter((c) => c._id !== cid) } : null);
      toast.success("Comment removed");
    } catch { toast.error("Failed to delete comment"); }
  };

  // ── GIF select
  const handleGifSelect = async (url: string) => {
    try {
      const res = await api.post(`/stories/${id}/comments`, { comment: "Attached GIF", gif: url });
      if (res.data.success) {
        setStory((p) => p ? { ...p, comments: [res.data.comment, ...p.comments] } : null);
        setGifOpen(false);
      }
    } catch { toast.error("Failed to attach GIF"); }
  };

  // ── Translate
  const handleTranslate = async (code: string) => {
    if (!story) return;
    setCurrentLang(code);
    if (code === "en") { setTranslatedText(null); return; }
    setTranslating(true);
    const tid = toast.loading("Translating…");
    try {
      const plain  = story.story.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const result = await translateText(plain, code);
      setTranslatedText(result);
      toast.success("Translation ready", { id: tid });
    } catch {
      toast.error("Translation failed", { id: tid });
      setCurrentLang("en");
    } finally { setTranslating(false); }
  };

  // ── Loading / Error states
  if (loading) return (
    <div className="min-h-screen bg-[#F8F7F5] dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-[3px] border-orange-100 border-t-orange-500 animate-spin" />
      <p className="text-sm text-neutral-400" style={{ fontFamily: "Inter,sans-serif" }}>
        Loading story…
      </p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#F8F7F5] dark:bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ErrorCard message={error} onRetry={fetchStory} />
      </div>
    </div>
  );

  if (!story) return null;

  const isOwner    = story.owner?._id === user?._id;
  const fsClass    = { sm: "fs-sm", base: "fs-base", lg: "fs-lg", xl: "fs-xl" }[fontSize];
  const readMin    = Math.max(1, Math.ceil(story.story.replace(/<[^>]*>/g, "").trim().split(/\s+/).length / 220));
  const langLabel  = LANGUAGES.find((l) => l.code === currentLang);
  const plainAudio = (translatedText || story.story).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <>
      <style>{globalStyles}</style>
      <ReadingProgress />

      <div
        className="min-h-screen bg-[#F8F7F5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* ── Modals ── */}
        <TranslateModal
          open={translateOpen}
          onClose={() => setTranslateOpen(false)}
          onSelect={handleTranslate}
          currentLang={currentLang}
        />
        <FontSizeModal
          open={fontSizeOpen}
          onClose={() => setFontSizeOpen(false)}
          size={fontSize}
          onChange={setFontSize}
        />

        {/* Delete Confirm */}
        {deleteOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteOpen(false)}
          >
            <div
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl anim-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                <i className="ri-delete-bin-2-line text-2xl text-red-500" />
              </div>
              <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white mb-1">
                Delete story?
              </h3>
              <p className="text-sm text-neutral-400 mb-6">
                This is permanent and cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 font-semibold text-sm text-neutral-700 dark:text-neutral-300 press"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm press"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Page ── */}
        <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-28">

          {/* Top bar */}
          <div className="flex items-center justify-between gap-2 mb-8">
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="w-11 h-11 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center justify-center text-neutral-700 dark:text-neutral-300 press"
            >
              <i className="ri-arrow-left-s-line text-xl" />
            </button>

            <div className="flex items-center gap-2">
              {/* Font size */}
              <button
                onClick={() => setFontSizeOpen(true)}
                aria-label="Text size"
                className="h-11 px-4 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center gap-1 text-neutral-700 dark:text-neutral-300 press"
              >
                <span className="font-serif font-bold leading-none" style={{ fontSize: 12 }}>A</span>
                <span className="font-serif font-bold leading-none" style={{ fontSize: 18 }}>A</span>
              </button>

              {/* Translate */}
              <button
                onClick={() => setTranslateOpen(true)}
                aria-label="Translate"
                className={`h-11 px-4 rounded-full border shadow-sm flex items-center gap-2 font-semibold text-sm press ${
                  currentLang !== "en"
                    ? "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400"
                    : "bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                <i className="ri-translate-2 text-base" />
                <span className="text-base leading-none">{langLabel?.flag ?? "🇺🇸"}</span>
              </button>

              {/* More */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMoreOpen((o) => !o); }}
                  aria-label="More"
                  className="w-11 h-11 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center justify-center text-neutral-700 dark:text-neutral-300 press"
                >
                  <i className="ri-more-fill text-lg" />
                </button>

                {moreOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-2xl py-1.5 z-50 anim-scale-in origin-top-right overflow-hidden">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {downloading
                        ? <i className="ri-loader-4-line animate-spin text-neutral-400" />
                        : <i className="ri-download-2-line text-neutral-400" />}
                      Download PDF
                    </button>
                    <button
                      onClick={() => { handleShare(); setMoreOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <i className="ri-share-forward-line text-neutral-400" />
                      Share Story
                    </button>
                    {isOwner && (
                      <>
                        <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1 mx-4" />
                        <Link
                          to={`/write?edit=${story._id}`}
                          onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <i className="ri-pencil-line text-neutral-400" />
                          Edit Story
                        </Link>
                        <button
                          onClick={() => { setDeleteOpen(true); setMoreOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <i className="ri-delete-bin-line" />
                          Delete Story
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Article ── */}
          <article className="anim-fade-up">

            {/* Meta chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {story.category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold capitalize tracking-wide">
                  <i className="ri-bookmark-fill text-[10px]" />
                  {story.category}
                </span>
              )}
              <span className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500">
                {moment(story.timeStamp).format("MMM D, YYYY")}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500">
                <i className="ri-time-line mr-1" />{readMin} min read
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500">
                <i className="ri-eye-line mr-1" />{story.views.length}
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-serif font-bold text-center text-neutral-900 dark:text-white leading-[1.18] break-words mb-7"
              style={{ fontSize: "clamp(28px, 5.5vw, 48px)", letterSpacing: "-0.02em" }}
            >
              {story.title}
            </h1>

            {/* Cover image */}
            {story.image?.url && (
              <div
                className="mb-8 rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 w-full"
                style={{ aspectRatio: "16/9" }}
              >
                <img
                  src={story.image.url}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Author */}
            <Link
              to={`/profile/${story.owner._id}`}
              className="flex items-center gap-3 mb-8 p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors group"
            >
              <img
                src={
                  story.owner.image?.url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(story.owner.username)}&background=f97316&color=fff&size=80`
                }
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900 flex-shrink-0"
                alt={story.owner.username}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-orange-500 transition-colors truncate">
                  {story.owner.name || story.owner.username}
                </p>
                <p className="text-xs text-neutral-400 truncate">@{story.owner.username}</p>
              </div>
              <i className="ri-arrow-right-s-line text-neutral-300 group-hover:text-orange-400 transition-colors flex-shrink-0 text-lg" />
            </Link>

            {/* Audio player */}
            <div className="mb-8">
              <AudioPlayer text={plainAudio} />
            </div>

            {/* Translation notice */}
            {translating && (
              <div className="mb-5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-blue-50 dark:bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <i className="ri-loader-4-line animate-spin" />
                Translating to {langLabel?.name}…
              </div>
            )}
            {translatedText && !translating && (
              <div className="mb-6 flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-blue-50 dark:bg-blue-500/10">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <i className="ri-translate-2" />
                  {langLabel?.flag} {langLabel?.name}
                </span>
                <button
                  onClick={() => { setTranslatedText(null); setCurrentLang("en"); }}
                  className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline flex-shrink-0"
                >
                  Show original
                </button>
              </div>
            )}

            {/* ── Story Body ──────────────────────────────────────────────────
                This is the CRITICAL section. We render the raw HTML exactly
                as stored in the database (from your rich text editor).
                All formatting, paragraphs, headings, images, lists, quotes
                are preserved via the .story-content CSS class above.
            ─────────────────────────────────────────────────────────────── */}
            <div className={`story-content ${fsClass}`}>
              {translatedText ? (
                // Translated: plain text, render as paragraphs
                <div>
                  {translatedText
                    .split(/\n\n+/)
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              ) : (
                // Original: render rich HTML exactly as stored
                <div dangerouslySetInnerHTML={{ __html: story.story }} />
              )}
            </div>

            {/* Divider */}
            <div className="mt-10 mb-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-neutral-300 dark:text-neutral-700 text-sm">✦</span>
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </div>

            {/* ── Action Bar ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">

              {/* Left: Like + Liked-by */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  aria-label={isLiked ? "Unlike" : "Like"}
                  className={`h-11 px-5 rounded-full flex items-center gap-2 font-semibold text-sm border transition-all press ${
                    isLiked
                      ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-500"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
                  }`}
                >
                  <i className={`${isLiked ? "ri-heart-3-fill" : "ri-heart-3-line"} text-base ${likeAnim ? "like-pop" : ""}`} />
                  <span>{likesCount}</span>
                </button>

                <div className="relative" ref={likedByRef}>
                  <button
                    onClick={openLikedBy}
                    className="h-11 px-3.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:border-neutral-300 press"
                  >
                    {likesCount > 0 ? "Who liked?" : "Be first ♡"}
                  </button>
                  {likedByOpen && (
                    <LikedByPopover
                      users={likedByUsers}
                      loading={likedByLoading}
                      onClose={() => setLikedByOpen(false)}
                    />
                  )}
                </div>
              </div>

              {/* Right: Share + Download */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  aria-label="Share"
                  className="h-11 px-4 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 press"
                >
                  <i className="ri-share-forward-line" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  aria-label="Download PDF"
                  className="h-11 px-4 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 press disabled:opacity-50"
                >
                  {downloading
                    ? <i className="ri-loader-4-line animate-spin" />
                    : <i className="ri-download-2-line" />}
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            </div>
          </article>

          {/* ── Comments Section ── */}
          <section className="mt-14">

            {/* Header */}
            <div className="flex items-baseline gap-2.5 mb-6">
              <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">
                Reflections
              </h2>
              {story.comments.length > 0 && (
                <span className="text-sm font-semibold text-neutral-400">
                  {story.comments.length}
                </span>
              )}
            </div>

            {/* Comment input */}
            <div className="mb-6">
              <CommentInput
                onSubmit={handleCommentSubmit}
                onGifOpen={() => setGifOpen((g) => !g)}
                gifOpen={gifOpen}
              />
            </div>

            {/* GIF picker */}
            {gifOpen && (
              <div className="mb-6 ml-12">
                <GifPicker
                  onSelect={handleGifSelect}
                  onClose={() => setGifOpen(false)}
                />
              </div>
            )}

            {/* Comment list */}
            <div className="space-y-4">
              {story.comments.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto mb-3 border border-neutral-200 dark:border-neutral-800">
                    <i className="ri-chat-1-line text-2xl text-neutral-300 dark:text-neutral-600" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-400">No reflections yet</p>
                  <p className="text-xs text-neutral-300 dark:text-neutral-700 mt-1">
                    Be the first to share your thoughts
                  </p>
                </div>
              ) : (
                story.comments.map((c) => (
                  <CommentCard
                    key={c._id}
                    comment={c}
                    canDelete={c.author._id === user?._id || isOwner}
                    onDelete={handleCommentDelete}
                  />
                ))
              )}
            </div>

            {story.comments.length >= 5 && (
              <p className="text-center text-xs text-neutral-400 mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                {story.comments.length} total reflections
              </p>
            )}
          </section>
        </main>
      </div>
    </>
  );
};