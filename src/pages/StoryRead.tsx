

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import api from "../services/api";
import toast from "react-hot-toast";
import moment from "moment";
import { ErrorCard } from "../components/ErrorCard";

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