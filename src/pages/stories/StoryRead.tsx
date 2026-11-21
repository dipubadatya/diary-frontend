


import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
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

const FONT_OPTIONS: { key: FontSize; label: string; desc: string; preview: string }[] = [
  { key: "sm", label: "Compact", desc: " tighter spacing for quick scanning", preview: "15px" },
  { key: "base", label: "Default", desc: "Balanced editorial reading size", preview: "17px" },
  { key: "lg", label: "Relaxed", desc: "Larger type for long-form comfort", preview: "19px" },
  { key: "xl", label: "Spacious", desc: "Maximum legibility and air", preview: "22px" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap');

  :root {
    --bg: #FAFAFA;
    --card: #FFFFFF;
    --card-dark: #111317;
    --border: #EAEAEB;
    --border-hover: #DCDCE0;
    --text: #111317;
    --text-main: #111317;
    --text-mid: #525866;
    --text-soft: #868C98;
    --text-muted: #C2C6CE;
    --accent-red: #E5484D;
    --accent-purple: #5E6AD2;
    --accent-green: #2E9F6E;
    --shadow-sm: 0 1px 2px rgba(17, 19, 23, 0.04);
    --shadow-md: 0 4px 14px rgba(17, 19, 23, 0.06);
    --shadow-lg: 0 12px 32px rgba(17, 19, 23, 0.09);
    --shadow-xl: 0 24px 56px rgba(17, 19, 23, 0.14);
    --radius-sm: 10px;
    --radius-md: 14px;
    --radius-lg: 18px;
    --radius-xl: 24px;
    --radius-full: 9999px;
    --font: 'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .dark {
    --bg: #0B0C0E;
    --card: #131519;
    --card-dark: #F5F6F8;
    --border: #22252B;
    --border-hover: #2E323B;
    --text: #F3F4F6;
    --text-main: #F3F4F6;
    --text-mid: #9EA4B0;
    --text-soft: #6E7480;
    --text-muted: #454A54;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.35);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.45);
    --shadow-lg: 0 12px 36px rgba(0, 0, 0, 0.55);
    --shadow-xl: 0 24px 60px rgba(0, 0, 0, 0.7);
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* ── Reading Progress Bar ── */
  .progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 2.5px;
    background: var(--text);
    transform-origin: left;
    z-index: 9999;
    transition: width 0.12s ease-out;
  }

  /* ── Story Editorial Body ── */
  .body-content {
    font-family: var(--font);
    color: var(--text);
    line-height: 1.85;
    letter-spacing: -0.011em;
    word-break: break-word;
  }
  .body-content p { margin: 0 0 1.45em; }
  .body-content p:last-child { margin-bottom: 0; }
  .body-content p:empty { display: none; }
  .body-content h1, .body-content h2, .body-content h3,
  .body-content h4, .body-content h5, .body-content h6 {
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: -0.022em;
    color: var(--text);
    margin: 1.9em 0 0.6em;
  }
  .body-content h1 { font-size: 1.8em; }
  .body-content h2 { font-size: 1.5em; }
  .body-content h3 { font-size: 1.25em; }
  .body-content strong { font-weight: 700; color: var(--text); }
  .body-content em { font-style: italic; }
  .body-content a {
    color: var(--text);
    text-decoration: underline;
    text-decoration-color: var(--border-hover);
    text-underline-offset: 3px;
    transition: text-decoration-color 0.15s;
  }
  .body-content a:hover {
    text-decoration-color: var(--text);
  }

  /* ── Synchronized Audio Sentence Highlighting ── */
  mark.tts-highlight {
    background: rgba(94, 106, 210, 0.16) !important;
    color: inherit !important;
    border-bottom: 2px solid var(--accent-purple);
    border-radius: 3px;
    padding: 1px 2px;
    transition: background 0.2s ease;
  }

  .body-content ul, .body-content ol { margin: 1em 0 1.5em; padding-left: 1.5rem; }
  .body-content ul { list-style: disc; }
  .body-content ol { list-style: decimal; }
  .body-content li { margin-bottom: 0.45em; }
  .body-content blockquote {
    margin: 1.75em 0;
    padding: 1rem 1.35rem;
    background: var(--card);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    border-left: 3px solid var(--text);
    font-style: italic;
    color: var(--text-mid);
  }
  .body-content code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    background: var(--card);
    border: 1px solid var(--border);
    padding: 0.15em 0.4em;
    border-radius: 6px;
    font-size: 0.86em;
  }
  .body-content pre {
    background: #111317;
    color: #F3F4F6;
    border-radius: var(--radius-md);
    padding: 1.15rem 1.35rem;
    overflow-x: auto;
    margin: 1.5em 0;
    font-size: 0.86em;
    line-height: 1.65;
    border: 1px solid var(--border);
  }
  .body-content pre code { background: none; border: none; padding: 0; color: inherit; }
  .body-content img {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-md);
    margin: 1.75em auto;
    display: block;
    border: 1px solid var(--border);
  }
  .body-content hr { border: none; height: 1px; background: var(--border); margin: 2.25em 0; }
  .body-content .ql-align-center { text-align: center; }
  .body-content .ql-align-right { text-align: right; }
  .body-content .ql-align-justify { text-align: justify; }
  .body-content .ql-video {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: var(--radius-md);
    border: none;
    margin: 1.5em 0;
  }

  .fs-sm   { font-size: 15px !important; }
  .fs-base { font-size: 17px !important; }
  .fs-lg   { font-size: 19px !important; }
  .fs-xl   { font-size: 22px !important; }
  @media (max-width: 640px) {
    .fs-sm   { font-size: 14.5px !important; }
    .fs-base { font-size: 16px !important; }
    .fs-lg   { font-size: 18px !important; }
    .fs-xl   { font-size: 20px !important; }
  }

  /* ── Reusable Surfaces & Controls ── */
  .card {
    background: var(--card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }
  .pill-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    background: var(--card);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-family: var(--font);
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .pill-btn:hover { border-color: var(--border-hover); }
  .pill-btn:active { transform: scale(0.97); }
  .pill-btn-dark {
    background: var(--text);
    color: var(--card);
    border-color: transparent;
  }
  .pill-btn-dark:hover { opacity: 0.92; }

  .tap { transition: transform 0.12s ease, opacity 0.15s ease; cursor: pointer; }
  .tap:active { transform: scale(0.96); }

  /* ── Animations ── */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heartPop {
    0%   { transform: scale(1); }
    30%  { transform: scale(1.35); }
    60%  { transform: scale(0.92); }
    100% { transform: scale(1); }
  }
  @keyframes wave {
    0%, 100% { transform: scaleY(1); }
    50%      { transform: scaleY(1.55); }
  }
  .fade-in   { animation: fadeIn 0.4s cubic-bezier(.16,1,.3,1) both; }
  .scale-in  { animation: scaleIn 0.18s cubic-bezier(.16,1,.3,1) both; }
  .slide-up  { animation: slideUp 0.25s cubic-bezier(.16,1,.3,1) both; }
  .heart-pop { animation: heartPop 0.38s cubic-bezier(.36,.07,.19,.97); }
  .wave-bar  { animation: wave 0.65s ease-in-out infinite; transform-origin: center; }
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
const Avatar: React.FC<{
  src?: string;
  name: string;
  size?: number;
  className?: string;
}> = ({ src, name, size = 36, className = "" }) => (
  <img
    src={
      src ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "U",
      )}&background=111317&color=FFF&size=96&bold=true`
    }
    alt={name}
    loading="lazy"
    style={{ width: size, height: size }}
    className={`rounded-full object-cover flex-shrink-0 border border-[var(--border)] ${className}`}
  />
);

// ─── Sentence Timing Interface ───────────────────────────────────────────────
export interface SentenceTiming {
  index: number;
  text: string;
  start: number;
  end: number;
}

// ─── Supported TTS Languages ──────────────────────────────────────────────────
const TTS_LANGUAGES: {
  code: "en" | "hi" | "or";
  name: string;
  native: string;
  flag: string;
}[] = [
    { code: "en", name: "English", native: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  ];

function detectTextLanguage(str: string): "en" | "hi" | "or" {
  let or = 0;
  let hi = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c >= 0x0b00 && c <= 0x0b7f) or++;
    else if (c >= 0x0900 && c <= 0x097f) hi++;
  }
  if (or > 5) return "or";
  if (hi > 5) return "hi";
  return "en";
}

// ─── Waveform Scrubber ───────────────────────────────────────────────────────
const Waveform: React.FC<{
  progress: number;
  playing: boolean;
  onSeek: (p: number) => void;
}> = ({ progress, playing, onSeek }) => {
  const bars = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => {
        const seed = Math.sin(i * 0.55) * 0.5 + 0.5;
        return Math.round(6 + seed * 18);
      }),
    [],
  );
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="flex-1 h-8 flex items-center justify-between gap-[2px] cursor-pointer overflow-hidden select-none py-1 group"
      title="Click anywhere to seek"
    >
      {bars.map((h, i) => {
        const f = i / bars.length;
        const active = f <= progress;
        const near = playing && Math.abs(f - progress) < 0.035;
        return (
          <span
            key={i}
            className={`transition-all duration-150 ${near ? "wave-bar" : "group-hover:opacity-90"
              }`}
            style={{
              display: "inline-block",
              width: 2.5,
              flexShrink: 0,
              height: near ? Math.min(28, h * 1.3) : h,
              borderRadius: 99,
              background: active ? "var(--text)" : "var(--border-hover)",
              transformOrigin: "center",
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Production Story Audio Player ───────────────────────────────────────────
interface StoryAudioPlayerProps {
  text: string;
  storyId?: string;
  activeSentenceIndex: number;
  onSentenceChange: (index: number) => void;
  onSentencesLoaded: (sentences: SentenceTiming[]) => void;
}

const StoryAudioPlayer: React.FC<StoryAudioPlayerProps> = ({
  text,
  storyId,
  activeSentenceIndex,
  onSentenceChange,
  onSentencesLoaded,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [lang, setLang] = useState<"en" | "hi" | "or">(() =>
    detectTextLanguage(text),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sentences, setSentences] = useState<SentenceTiming[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    setLang(detectTextLanguage(text));
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioUrl(null);
    setSentences([]);
    onSentenceChange(-1);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [text]);

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, "0");
    return `${m}:${sec}`;
  };

  const fetchAudio = async (
    targetLang: "en" | "hi" | "or",
    autoPlay = false,
  ) => {
    setIsLoading(true);
    try {
      const res = await api.post("/tts/synthesize", {
        text,
        lang: targetLang,
        storyId,
      });
      if (res.data.success) {
        const serverBase = import.meta.env.VITE_SERVER_URL || "";
        const fullUrl = res.data.audioUrl.startsWith("http")
          ? res.data.audioUrl
          : `${serverBase}${res.data.audioUrl}`;
        setAudioUrl(fullUrl);
        setDuration(res.data.duration);
        setSentences(res.data.sentences || []);
        onSentencesLoaded(res.data.sentences || []);
        if (audioRef.current) {
          audioRef.current.src = fullUrl;
          audioRef.current.playbackRate = rate;
          audioRef.current.volume = isMuted ? 0 : volume;
          if (autoPlay) {
            try {
              await audioRef.current.play();
              setIsPlaying(true);
            } catch (playErr) {
              console.warn("Autoplay was blocked or interrupted:", playErr);
            }
          }
        }
      } else {
        toast.error(res.data.error || "Failed to generate story audio.");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ||
        "Could not generate speech for this story.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const t = audioRef.current.currentTime;
    setCurrentTime(t);
    if (sentences.length > 0) {
      const idx = sentences.findIndex((s) => t >= s.start && t < s.end);
      if (idx !== -1 && idx !== activeSentenceIndex) {
        onSentenceChange(idx);
      } else if (
        idx === -1 &&
        t >= (sentences[sentences.length - 1]?.end || 0)
      ) {
        onSentenceChange(-1);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (
      audioRef.current &&
      audioRef.current.duration &&
      !isNaN(audioRef.current.duration)
    ) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onSentenceChange(-1);
  };

  const togglePlay = async () => {
    if (!audioUrl) {
      await fetchAudio(lang, true);
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        toast.error("Playback error. Please try again.");
      }
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    onSentenceChange(-1);
  };

  const seek = (p: number) => {
    if (!duration) return;
    const target = p * duration;
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
      if (!isPlaying) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => { });
      }
    }
  };

  const jumpToSentence = (idx: number) => {
    if (idx < 0 || idx >= sentences.length) return;
    const target = sentences[idx].start;
    setCurrentTime(target);
    onSentenceChange(idx);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
      if (!isPlaying) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => { });
      }
    }
  };

  const prevSentence = () => {
    if (sentences.length === 0) return;
    const targetIdx = activeSentenceIndex > 0 ? activeSentenceIndex - 1 : 0;
    jumpToSentence(targetIdx);
  };

  const nextSentence = () => {
    if (sentences.length === 0) return;
    const targetIdx =
      activeSentenceIndex >= 0 && activeSentenceIndex < sentences.length - 1
        ? activeSentenceIndex + 1
        : 0;
    jumpToSentence(targetIdx);
  };

  const rewind10 = () => {
    if (!audioRef.current) return;
    const target = Math.max(0, audioRef.current.currentTime - 10);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const forward10 = () => {
    if (!audioRef.current) return;
    const target = Math.min(duration, audioRef.current.currentTime + 10);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const changeSpeed = (newRate: number) => {
    setRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  const handleLanguageSelect = (newLang: "en" | "hi" | "or") => {
    if (newLang === lang && audioUrl) return;
    setLang(newLang);
    stopPlayback();
    fetchAudio(newLang, isPlaying);
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const currentSentence =
    activeSentenceIndex >= 0 && sentences[activeSentenceIndex]
      ? sentences[activeSentenceIndex]
      : null;

  return (
    <div className="card overflow-hidden">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Top Row: Play Trigger + Scrubber + Language & Settings */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isPlaying ? " animate-pulse" : ""
                }`}
              style={{
                background: isPlaying
                  ? "var(--accent-green)"
                  : "var(--text-soft)",
              }}
            />
            <span
              className="text-[11.5px] font-bold uppercase tracking-wider"
              style={{ color: "var(--text)" }}
            >
              Listen to story
            </span>
            {rate !== 1 && (
              <span
                className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--bg)",
                  color: "var(--text-mid)",
                  border: "1px solid var(--border)",
                }}
              >
                {rate}×
              </span>
            )}
          </div>

          {/* Language Switcher Pills */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-lg"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            {TTS_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLanguageSelect(l.code)}
                disabled={isLoading}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all tap"
                style={{
                  background: lang === l.code ? "var(--card)" : "transparent",
                  color: lang === l.code ? "var(--text)" : "var(--text-soft)",
                  boxShadow: lang === l.code ? "var(--shadow-sm)" : "none",
                }}
                title={`Listen in ${l.name}`}
              >
                <span className="text-[11px]">{l.flag}</span>
                <span>{l.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Player Row */}
        <div className="flex items-center gap-3">
          {/* Play / Pause Primary Button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 tap transition-transform"
            style={{
              background: "var(--text)",
              color: "var(--card)",
            }}
            title={isPlaying ? "Pause" : "Play story narration"}
            aria-label={isPlaying ? "Pause" : "Play story narration"}
          >
            {isLoading ? (
              <i className="ri-loader-4-line text-lg animate-spin" />
            ) : (
              <i
                className={`${isPlaying ? "ri-pause-fill" : "ri-play-fill"
                  } text-lg`}
                style={isPlaying ? undefined : { marginLeft: 2 }}
              />
            )}
          </button>

          {/* Waveform + Timestamps */}
          <div className="flex-1 min-w-0">
            <Waveform progress={progress} playing={isPlaying} onSeek={seek} />
            <div
              className="flex items-center justify-between text-[11px] font-medium tabular-nums mt-0.5"
              style={{ color: "var(--text-soft)" }}
            >
              <span>{fmt(currentTime)}</span>
              <span>
                {isLoading
                  ? "Generating audio…"
                  : duration > 0
                    ? fmt(duration)
                    : "Tap play to listen"}
              </span>
            </div>
          </div>

          {/* Transport Controls (Desktop & Mobile) */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={prevSentence}
              disabled={isLoading || sentences.length === 0}
              className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center tap disabled:opacity-35"
              style={{ color: "var(--text-mid)" }}
              title="Previous sentence"
            >
              <i className="ri-skip-back-line text-sm" />
            </button>
            <button
              onClick={rewind10}
              disabled={isLoading || !audioUrl}
              className="w-8 h-8 rounded-lg flex items-center justify-center tap disabled:opacity-35"
              style={{ color: "var(--text-mid)" }}
              title="Rewind 10 seconds"
            >
              <i className="ri-replay-10-line text-base" />
            </button>
            <button
              onClick={forward10}
              disabled={isLoading || !audioUrl}
              className="w-8 h-8 rounded-lg flex items-center justify-center tap disabled:opacity-35"
              style={{ color: "var(--text-mid)" }}
              title="Forward 10 seconds"
            >
              <i className="ri-forward-10-line text-base" />
            </button>
            <button
              onClick={nextSentence}
              disabled={isLoading || sentences.length === 0}
              className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center tap disabled:opacity-35"
              style={{ color: "var(--text-mid)" }}
              title="Next sentence"
            >
              <i className="ri-skip-forward-line text-sm" />
            </button>
            {isPlaying && (
              <button
                onClick={stopPlayback}
                className="w-8 h-8 rounded-lg flex items-center justify-center tap"
                style={{ color: "var(--accent-red)" }}
                title="Stop"
              >
                <i className="ri-stop-fill text-sm" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-8 h-8 rounded-lg flex items-center justify-center tap ml-0.5"
              style={{
                background: showSettings ? "var(--text)" : "var(--bg)",
                color: showSettings ? "var(--card)" : "var(--text-mid)",
                border: "1px solid var(--border)",
              }}
              title="Speed & Volume"
            >
              <i className="ri-equalizer-line text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Sentence Live Caption */}
      {currentSentence && (
        <div
          className="px-3.5 sm:px-4 py-2.5 flex items-start gap-2.5 slide-up"
          style={{
            background: "var(--bg)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
            style={{
              background: "var(--card)",
              color: "var(--text-mid)",
              border: "1px solid var(--border)",
            }}
          >
            {currentSentence.index + 1}/{sentences.length}
          </span>
          <p
            className="text-[12.5px] leading-relaxed line-clamp-2 flex-1"
            style={{ color: "var(--text-mid)" }}
          >
            {currentSentence.text}
          </p>
        </div>
      )}

      {/* Expandable Speed & Volume Drawer */}
      {showSettings && (
        <div
          className="px-3.5 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 slide-up"
          style={{
            background: "var(--bg)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {/* Speed */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span
              className="text-[11px] font-semibold"
              style={{ color: "var(--text-soft)" }}
            >
              Speed
            </span>
            <div className="flex items-center gap-1">
              {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => changeSpeed(r)}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold tap"
                  style={{
                    background: rate === r ? "var(--text)" : "var(--card)",
                    color: rate === r ? "var(--card)" : "var(--text-mid)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {r}×
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <button
              onClick={toggleMute}
              className="w-7 h-7 rounded-md flex items-center justify-center tap"
              style={{ color: "var(--text-mid)" }}
              title={isMuted ? "Unmute" : "Mute"}
            >
              <i
                className={
                  isMuted || volume === 0
                    ? "ri-volume-mute-line text-sm text-red-500"
                    : volume < 0.5
                      ? "ri-volume-down-line text-sm"
                      : "ri-volume-up-line text-sm"
                }
              />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-28 sm:w-32 accent-[var(--text)] h-1.5 rounded-lg cursor-pointer"
            />
            <span
              className="text-[11px] font-semibold tabular-nums w-8 text-right"
              style={{ color: "var(--text-soft)" }}
            >
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Translate Helper ────────────────────────────────────────────────────────
async function translateText(text: string, target: string): Promise<string> {
  const sentences = text.split(/(?<=[.!?।؟])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).length > 420) {
      if (cur) chunks.push(cur.trim());
      cur = s;
    } else cur += (cur ? " " : "") + s;
  }
  if (cur) chunks.push(cur.trim());
  const results = await Promise.all(
    chunks.map(async (c) => {
      try {
        const r = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            c,
          )}&langpair=en|${target}`,
        );
        const d = await r.json();
        return d.responseStatus === 200
          ? (d.responseData?.translatedText ?? c)
          : c;
      } catch {
        return c;
      }
    }),
  );
  return results.join(" ");
}

// ─── Modal / Bottom Sheet ────────────────────────────────────────────────────
const Sheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 slide-up max-h-[85vh] overflow-y-auto no-scrollbar"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xl)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mb-4 sm:hidden"
          style={{ background: "var(--border-hover)" }}
        />
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--text)" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center tap"
            style={{ background: "var(--bg)", color: "var(--text-mid)" }}
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── Translate Sheet ─────────────────────────────────────────────────────────
const TranslateSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelect: (c: string) => void;
  current: string;
}> = ({ open, onClose, onSelect, current }) => (
  <Sheet open={open} onClose={onClose} title="Translate story">
    <div className="grid grid-cols-2 gap-2">
      {LANGUAGES.map((l) => {
        const active = current === l.code;
        return (
          <button
            key={l.code}
            onClick={() => {
              onSelect(l.code);
              onClose();
            }}
            className="flex items-center gap-2.5 p-2.5 rounded-xl text-left tap transition-colors"
            style={{
              background: active ? "var(--text)" : "var(--bg)",
              color: active ? "var(--card)" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="text-lg leading-none">{l.flag}</span>
            <span className="text-[13px] font-semibold truncate flex-1">
              {l.name}
            </span>
            {active && <i className="ri-check-line text-sm flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  </Sheet>
);

// ─── Font Sheet ──────────────────────────────────────────────────────────────
const FontSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  size: FontSize;
  onChange: (s: FontSize) => void;
}> = ({ open, onClose, size, onChange }) => (
  <Sheet open={open} onClose={onClose} title="Reading typography">
    <div className="space-y-2">
      {FONT_OPTIONS.map((o) => {
        const active = size === o.key;
        return (
          <button
            key={o.key}
            onClick={() => {
              onChange(o.key);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left tap"
            style={{
              background: active ? "var(--text)" : "var(--bg)",
              color: active ? "var(--card)" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="w-9 text-center flex-shrink-0 font-bold"
              style={{ fontSize: o.preview }}
            >
              Aa
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold leading-tight">
                {o.label}
              </p>
              <p
                className="text-[11.5px] opacity-75 truncate mt-0.5"
              >
                {o.desc}
              </p>
            </div>
            {active && <i className="ri-check-line text-base flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  </Sheet>
);

// ─── GIF Picker ──────────────────────────────────────────────────────────────
const GifPicker: React.FC<{
  onSelect: (url: string) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await api.get("/stories/search-gif", { params: { q } });
      setGifs(r.data.gifs || []);
    } catch {
      toast.error("Failed to load GIFs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-3 slide-up">
      <div className="flex gap-1.5 mb-2.5">
        <div className="relative flex-1 min-w-0">
          <i
            className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "var(--text-soft)" }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="Search GIFs…"
            autoFocus
            className="w-full rounded-lg pl-8 pr-3 py-2 text-[13px] outline-none"
            style={{
              background: "var(--bg)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
        <button
          type="button"
          onClick={search}
          className="px-3 h-9 rounded-lg flex items-center justify-center tap flex-shrink-0 text-xs font-semibold"
          style={{ background: "var(--text)", color: "var(--card)" }}
        >
          {loading ? (
            <i className="ri-loader-4-line animate-spin" />
          ) : (
            "Search"
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-lg flex items-center justify-center tap flex-shrink-0"
          style={{
            background: "var(--bg)",
            color: "var(--text-mid)",
            border: "1px solid var(--border)",
          }}
        >
          <i className="ri-close-line" />
        </button>
      </div>

      {gifs.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto no-scrollbar rounded-lg">
          {gifs.map((g) => (
            <img
              key={g.id}
              src={g.images.fixed_height.url}
              onClick={() => onSelect(g.images.fixed_height.url)}
              className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
              loading="lazy"
              alt="GIF"
            />
          ))}
        </div>
      ) : (
        !loading && (
          <p
            className="text-center text-xs py-5"
            style={{ color: "var(--text-soft)" }}
          >
            {q ? "No GIFs found" : "Type a keyword and press Enter"}
          </p>
        )
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
}> = ({
  onSubmit,
  placeholder = "Add a comment…",
  autoFocus = false,
  onCancel,
  compact = false,
}) => {
    const [text, setText] = useState("");
    const [gif, setGif] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);
    const [gifOpen, setGifOpen] = useState(false);
    const [focused, setFocused] = useState(Boolean(autoFocus));

    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { user } = useAuth();

    const hasContent = Boolean(text.trim() || gif);
    const isExpanded = focused || hasContent || gifOpen || Boolean(autoFocus);

    const syncHeight = () => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, compact ? 140 : 180)}px`;
    };

    useEffect(() => {
      if (autoFocus && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [autoFocus]);

    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          if (!text.trim() && !gif && !gifOpen) {
            setFocused(false);
          }
        }
      };
      if (focused || gifOpen) {
        document.addEventListener("mousedown", handleOutsideClick);
      }
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [focused, text, gif, gifOpen]);

    const submit = async () => {
      if (!hasContent || posting) return;
      setPosting(true);
      try {
        await onSubmit(text.trim(), gif || undefined);
        setText("");
        setGif(null);
        setGifOpen(false);
        setFocused(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      } finally {
        setPosting(false);
      }
    };

    return (
      <div ref={containerRef} className="w-full">
        <div className="flex gap-2.5 sm:gap-3 items-start">
          {!compact && (
            <div className="flex-shrink-0 pt-0.5">
              <Avatar
                src={user?.image?.url}
                name={user?.username || "U"}
                size={36}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div
              onClick={() => textareaRef.current?.focus()}
              className="rounded-2xl transition-colors cursor-text"
              style={{
                background: compact ? "var(--bg)" : "var(--card)",
                border: `1px solid ${focused ? "var(--text-soft)" : "var(--border)"
                  }`,
              }}
            >
              {gif && (
                <div
                  className="px-3.5 pt-3 pb-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="relative inline-block rounded-xl overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <img
                      src={gif}
                      className="max-w-[180px] sm:max-w-[220px] max-h-[140px] object-cover block"
                      alt="Selected GIF"
                    />
                    <button
                      type="button"
                      onClick={() => setGif(null)}
                      aria-label="Remove GIF"
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-transform active:scale-90"
                      style={{
                        background: "rgba(0, 0, 0, 0.75)",
                        color: "#fff",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <i className="ri-close-line text-sm" />
                    </button>
                  </div>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  syncHeight();
                }}
                onFocus={() => setFocused(true)}
                placeholder={placeholder}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submit();
                  }
                  if (e.key === "Escape") {
                    if (gifOpen) {
                      setGifOpen(false);
                    } else if (onCancel) {
                      onCancel();
                    } else if (!hasContent) {
                      setFocused(false);
                      textareaRef.current?.blur();
                    }
                  }
                }}
                className={`w-full bg-transparent outline-none resize-none text-[14px] leading-[1.5] block ${compact
                  ? "px-3.5 py-2.5 min-h-[40px]"
                  : "px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px]"
                  }`}
                style={{
                  color: "var(--text)",
                  fontFamily: "var(--font)",
                }}
              />

              {isExpanded && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between gap-2 px-2.5 sm:px-3 pb-2.5 pt-1"
                >
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setGifOpen(!gifOpen)}
                      className="h-8 px-2.5 rounded-lg text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors tap"
                      style={{
                        background: gifOpen ? "var(--text)" : "var(--bg)",
                        color: gifOpen ? "var(--card)" : "var(--text-mid)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <i className="ri-file-gif-line text-[14px]" />
                      <span>GIF</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {(onCancel || (!compact && hasContent)) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onCancel) {
                            onCancel();
                          } else {
                            setText("");
                            setGif(null);
                            setGifOpen(false);
                            setFocused(false);
                            if (textareaRef.current) {
                              textareaRef.current.style.height = "auto";
                            }
                          }
                        }}
                        disabled={posting}
                        className="h-8 px-3 rounded-lg text-[12px] font-medium transition-opacity hover:opacity-80 tap"
                        style={{ color: "var(--text-soft)" }}
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={submit}
                      disabled={!hasContent || posting}
                      className="pill-btn pill-btn-dark inline-flex items-center justify-center gap-1.5 transition-opacity"
                      style={{
                        height: 32,
                        padding: "0 14px",
                        fontSize: 12.5,
                        opacity: hasContent && !posting ? 1 : 0.4,
                      }}
                    >
                      {posting ? (
                        <>
                          <i className="ri-loader-4-line animate-spin text-sm" />
                          <span>Posting</span>
                        </>
                      ) : (
                        <span>{compact ? "Reply" : "Post"}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {gifOpen && (
              <div className="mt-2 slide-up">
                <GifPicker
                  onSelect={(u) => {
                    setGif(u);
                    setGifOpen(false);
                    textareaRef.current?.focus();
                  }}
                  onClose={() => setGifOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

// ─── Single Comment (Social Thread Layout) ───────────────────────────────────
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
  c,
  replies,
  storyOwnerId,
  currentUserId,
  isStoryOwner,
  onDelete,
  onLike,
  onEdit,
  onReply,
  replyTo,
  setReplyTo,
  depth = 0,
}) => {
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(c.comment);
    const [isSaving, setIsSaving] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [delConfirm, setDelConfirm] = useState(false);
    const [likeAnim, setLikeAnim] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const editInputRef = useRef<HTMLTextAreaElement>(null);

    const authorId = typeof c.author === "string" ? c.author : c.author?._id;
    const isMine = Boolean(currentUserId && authorId === currentUserId);
    const canDelete = isMine || isStoryOwner;
    const isStoryAuthor = authorId === storyOwnerId;
    const isReply = depth > 0;
    const hasReplies = replies.length > 0;

    const hasLiked =
      c.likes?.some(
        (id) =>
          (typeof id === "string" ? id : (id as any)?._id) === currentUserId,
      ) || false;

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setMenuOpen(false);
          setDelConfirm(false);
        }
      };
      if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    useEffect(() => {
      if (editing && editInputRef.current) {
        const el = editInputRef.current;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    }, [editing]);

    const handleSaveEdit = async () => {
      const trimmed = editText.trim();
      if (!trimmed || trimmed === c.comment || isSaving) {
        if (trimmed === c.comment) setEditing(false);
        return;
      }
      try {
        setIsSaving(true);
        await onEdit(c._id, trimmed);
        setEditing(false);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div
        className={`group relative ${!isReply ? "py-4" : "pt-3 pb-1"}`}
        style={
          !isReply ? { borderBottom: "1px solid var(--border)" } : undefined
        }
      >
        <div className="flex gap-3">
          {/* Left Column: Avatar + Vertical Thread Spine */}
          <div className="flex flex-col items-center flex-shrink-0">
            <Link
              to={`/profile/${c.author.username}`}
              className="rounded-full transition-opacity hover:opacity-85"
            >
              <Avatar
                src={c.author.image?.url}
                name={c.author.username}
                size={isReply ? 28 : 36}
              />
            </Link>

            {(hasReplies || replyTo === c._id) && !isReply && (
              <div
                className="w-[1.5px] flex-1 mt-2 rounded-full"
                style={{ background: "var(--border)" }}
              />
            )}
          </div>

          {/* Right Column: Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 leading-none">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <Link
                  to={`/profile/${c.author.username}`}
                  className="text-[13.5px] font-semibold hover:underline truncate"
                  style={{ color: "var(--text)" }}
                >
                  {c.author.name || c.author.username}
                </Link>

                {c.author.name && c.author.username && (
                  <Link
                    to={`/profile/${c.author.username}`}
                    className="text-[12px] truncate hidden sm:inline"
                    style={{ color: "var(--text-soft)" }}
                  >
                    @{c.author.username}
                  </Link>
                )}

                {isStoryAuthor && (
                  <span
                    className="px-1.5 py-[2px] rounded text-[10px] font-semibold tracking-tight flex-shrink-0"
                    style={{
                      background: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Author
                  </span>
                )}

                <span
                  className="text-[11px] select-none"
                  style={{ color: "var(--text-soft)" }}
                >
                  ·
                </span>

                <time
                  title={moment(c.timeStamp).format("MMM D, YYYY • h:mm A")}
                  className="text-[12px] flex-shrink-0"
                  style={{ color: "var(--text-soft)" }}
                >
                  {moment(c.timeStamp).fromNow(true)}
                </time>

                {c.editedAt && (
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-soft)" }}
                  >
                    (edited)
                  </span>
                )}
              </div>

              {canDelete && !editing && (
                <div className="relative flex-shrink-0 -mr-1" ref={menuRef}>
                  <button
                    onClick={() => {
                      setMenuOpen(!menuOpen);
                      setDelConfirm(false);
                    }}
                    aria-label="Comment options"
                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity tap"
                    style={{ color: "var(--text-soft)" }}
                  >
                    <i className="ri-more-fill text-[16px]" />
                  </button>

                  {menuOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 w-40 rounded-xl p-1 z-50 scale-in"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-lg)",
                      }}
                    >
                      {isMine && !delConfirm && (
                        <button
                          onClick={() => {
                            setEditText(c.comment);
                            setEditing(true);
                            setMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors hover:opacity-80 text-left tap"
                          style={{ color: "var(--text)" }}
                        >
                          <i className="ri-pencil-line text-[14px]" />
                          Edit comment
                        </button>
                      )}

                      {canDelete && !delConfirm && (
                        <button
                          onClick={() => setDelConfirm(true)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors hover:opacity-80 text-left tap"
                          style={{ color: "var(--accent-red)" }}
                        >
                          <i className="ri-delete-bin-6-line text-[14px]" />
                          Delete
                        </button>
                      )}

                      {delConfirm && (
                        <div className="p-2 space-y-2">
                          <p
                            className="text-[11.5px] font-medium leading-tight"
                            style={{ color: "var(--text)" }}
                          >
                            Delete this comment permanently?
                          </p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                onDelete(c._id);
                                setMenuOpen(false);
                                setDelConfirm(false);
                              }}
                              className="flex-1 py-1.5 rounded-lg text-[11.5px] font-semibold tap"
                              style={{
                                background: "var(--accent-red)",
                                color: "#fff",
                              }}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDelConfirm(false)}
                              className="flex-1 py-1.5 rounded-lg text-[11.5px] font-medium tap"
                              style={{
                                background: "var(--bg)",
                                color: "var(--text-mid)",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment Body / Inline Editor */}
            {editing ? (
              <div
                className="mt-2 rounded-xl p-2.5"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                }}
              >
                <textarea
                  ref={editInputRef}
                  value={editText}
                  onChange={(e) => {
                    setEditText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                    if (e.key === "Escape") {
                      setEditing(false);
                      setEditText(c.comment);
                    }
                  }}
                  rows={1}
                  className="w-full bg-transparent text-[14px] leading-relaxed outline-none resize-none max-h-[240px]"
                  style={{
                    color: "var(--text)",
                    fontFamily: "var(--font)",
                  }}
                />
                <div
                  className="flex items-center justify-between pt-2 mt-1.5"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span
                    className="text-[11px] hidden sm:inline"
                    style={{ color: "var(--text-soft)" }}
                  >
                    Esc to cancel · ⌘+Enter to save
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setEditText(c.comment);
                      }}
                      disabled={isSaving}
                      className="px-2.5 py-1 rounded-lg text-[12px] font-medium tap"
                      style={{ color: "var(--text-mid)" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={
                        isSaving ||
                        !editText.trim() ||
                        editText.trim() === c.comment
                      }
                      className="pill-btn pill-btn-dark disabled:opacity-40"
                      style={{ height: 28, padding: "0 12px", fontSize: 12 }}
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                {c.comment && c.comment !== "Attached GIF" && (
                  <p
                    className="text-[14px] leading-[1.55] whitespace-pre-wrap break-words"
                    style={{ color: "var(--text)" }}
                  >
                    {c.comment}
                  </p>
                )}

                {c.gif && (
                  <div
                    className="mt-2 inline-block overflow-hidden rounded-xl"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <img
                      src={c.gif}
                      alt="Comment GIF"
                      className="max-w-[220px] max-h-[200px] object-cover block"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            {!editing && (
              <div className="flex items-center gap-4 mt-2 -ml-1.5">
                <button
                  onClick={() => {
                    setLikeAnim(true);
                    setTimeout(() => setLikeAnim(false), 420);
                    onLike(c._id);
                  }}
                  className="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[12px] font-medium transition-colors tap"
                  style={{
                    color: hasLiked ? "var(--accent-red)" : "var(--text-soft)",
                  }}
                >
                  <i
                    className={`${hasLiked ? "ri-heart-3-fill" : "ri-heart-3-line"
                      } text-[15px] ${likeAnim ? "heart-pop" : ""}`}
                  />
                  {(c.likesCount || 0) > 0 && (
                    <span className="tabular-nums">{c.likesCount}</span>
                  )}
                </button>

                <button
                  onClick={() => setReplyTo(replyTo === c._id ? null : c._id)}
                  className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[12px] font-medium transition-colors tap"
                  style={{
                    color:
                      replyTo === c._id ? "var(--text)" : "var(--text-soft)",
                  }}
                >
                  <i className="ri-chat-1-line text-[14px]" />
                  <span>Reply</span>
                </button>
              </div>
            )}

            {/* Inline Reply Box */}
            {replyTo === c._id && (
              <div className="mt-3 slide-up">
                <CommentBox
                  onSubmit={async (t, g) => {
                    await onReply(c.parentId || c._id, t, g);
                    setReplyTo(null);
                    setShowReplies(true);
                  }}
                  placeholder={`Reply to ${c.author.name || c.author.username}…`}
                  autoFocus
                  compact
                  onCancel={() => setReplyTo(null)}
                />
              </div>
            )}

            {/* Nested Replies */}
            {hasReplies && (
              <div className="mt-2">
                {!showReplies ? (
                  <button
                    onClick={() => setShowReplies(true)}
                    className="inline-flex items-center gap-2 py-1 text-[12px] font-semibold tap"
                    style={{ color: "var(--text-mid)" }}
                  >
                    <span
                      className="w-4 h-[1.5px] rounded-full"
                      style={{ background: "var(--border)" }}
                    />
                    View {replies.length}{" "}
                    {replies.length === 1 ? "reply" : "replies"}
                  </button>
                ) : (
                  <div className="space-y-1">
                    {replies.map((r) => (
                      <Comment
                        key={r._id}
                        c={r}
                        replies={[]}
                        storyOwnerId={storyOwnerId}
                        currentUserId={currentUserId}
                        isStoryOwner={isStoryOwner}
                        onDelete={onDelete}
                        onLike={onLike}
                        onEdit={onEdit}
                        onReply={onReply}
                        replyTo={replyTo}
                        setReplyTo={setReplyTo}
                        depth={depth + 1}
                      />
                    ))}

                    {replies.length > 2 && (
                      <button
                        onClick={() => setShowReplies(false)}
                        className="inline-flex items-center gap-1.5 pt-1 text-[11.5px] font-medium tap"
                        style={{ color: "var(--text-soft)" }}
                      >
                        <i className="ri-subtract-line text-[13px]" />
                        Hide replies
                      </button>
                    )}
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
const LikedByPopover: React.FC<{
  users: LikedByUser[];
  loading: boolean;
  onClose: () => void;
}> = ({ users, loading, onClose }) => (
  <div
    className="absolute left-0 bottom-full mb-2 w-64 rounded-2xl z-50 scale-in overflow-hidden"
    style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-lg)",
    }}
  >
    <div
      className="flex items-center justify-between px-3.5 py-2.5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: "var(--text-soft)" }}
      >
        Liked by
      </span>
      <button
        onClick={onClose}
        className="w-6 h-6 rounded-md flex items-center justify-center tap"
        style={{ color: "var(--text-soft)" }}
      >
        <i className="ri-close-line text-sm" />
      </button>
    </div>
    <div className="max-h-56 overflow-y-auto no-scrollbar p-1.5">
      {loading ? (
        <div className="py-7 flex justify-center">
          <i
            className="ri-loader-4-line animate-spin text-lg"
            style={{ color: "var(--text-soft)" }}
          />
        </div>
      ) : users.length === 0 ? (
        <p
          className="py-7 text-center text-xs"
          style={{ color: "var(--text-soft)" }}
        >
          No likes yet
        </p>
      ) : (
        users.map((u) => (
          <Link
            key={u._id}
            to={`/profile/${u.username}`}
            onClick={onClose}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl tap hover:opacity-80"
          >
            <Avatar src={u.image?.url} name={u.username} size={30} />
            <div className="min-w-0">
              <p
                className="text-[13px] font-semibold truncate leading-tight"
                style={{ color: "var(--text)" }}
              >
                {u.name || u.username}
              </p>
              <p
                className="text-[11px] truncate"
                style={{ color: "var(--text-soft)" }}
              >
                @{u.username}
              </p>
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

  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);
  const [ttsSentences, setTtsSentences] = useState<SentenceTiming[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [showLikeAuthPrompt, setShowLikeAuthPrompt] = useState(false);
  const likePromptRef = useRef<HTMLDivElement>(null);

  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"new" | "top">("new");

  const moreRef = useRef<HTMLDivElement>(null);
  const likedByRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLElement>(null);

  const mainComments = useMemo(
    () => story?.comments.filter((c) => !c.parentId) || [],
    [story?.comments],
  );

  const repliesMap = useMemo(() => {
    const m: Record<string, Comment[]> = {};
    story?.comments.forEach((c) => {
      if (c.parentId) {
        (m[c.parentId] ??= []).push(c);
      }
    });
    Object.values(m).forEach((arr) =>
      arr.sort(
        (a, b) =>
          new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime(),
      ),
    );
    return m;
  }, [story?.comments]);

  const sorted = useMemo(() => {
    const l = [...mainComments];
    return sortBy === "top"
      ? l.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
      : l.sort(
        (a, b) =>
          new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime(),
      );
  }, [mainComments, sortBy]);

  useEffect(() => {
    const s = localStorage.getItem("story_fs");
    if (s && ["sm", "base", "lg", "xl"].includes(s)) setFontSize(s as FontSize);
  }, []);

  useEffect(() => {
    localStorage.setItem("story_fs", fontSize);
  }, [fontSize]);

  // Synchronized Sentence Highlighting in Story Body
  useEffect(() => {
    if (!bodyRef.current) return;
    const root = bodyRef.current;

    const oldMarks = root.querySelectorAll("mark.tts-highlight");
    oldMarks.forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        while (m.firstChild) {
          parent.insertBefore(m.firstChild, m);
        }
        parent.removeChild(m);
        parent.normalize();
      }
    });

    if (activeSentenceIndex < 0 || !ttsSentences[activeSentenceIndex]) return;
    const sentenceText = ttsSentences[activeSentenceIndex].text.trim();
    if (!sentenceText) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node: Text | null;
    const searchPrefix = sentenceText.slice(
      0,
      Math.min(sentenceText.length, 30),
    );
    while ((node = walker.nextNode() as Text | null)) {
      const content = node.textContent || "";
      const idx = content.indexOf(searchPrefix);
      if (idx !== -1) {
        const matchLength = Math.min(
          content.length - idx,
          sentenceText.length,
        );
        try {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + matchLength);
          const mark = document.createElement("mark");
          mark.className = "tts-highlight";
          range.surroundContents(mark);
          mark.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch { }
        break;
      }
    }
  }, [activeSentenceIndex, ttsSentences]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node))
        setMoreOpen(false);
      if (likedByRef.current && !likedByRef.current.contains(e.target as Node))
        setLikedByOpen(false);
      if (
        likePromptRef.current &&
        !likePromptRef.current.contains(e.target as Node)
      )
        setShowLikeAuthPrompt(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!showLikeAuthPrompt) return;
    const timer = setTimeout(() => setShowLikeAuthPrompt(false), 6000);
    return () => clearTimeout(timer);
  }, [showLikeAuthPrompt]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("joinStory", id);
    const onCreated = (nc: Comment) =>
      setStory((p) =>
        p && !p.comments.some((c) => c._id === nc._id)
          ? { ...p, comments: [nc, ...p.comments] }
          : p,
      );
    const onDeleted = ({ commentId }: { commentId: string }) =>
      setStory((p) =>
        p
          ? {
            ...p,
            comments: p.comments.filter(
              (c) => c._id !== commentId && c.parentId !== commentId,
            ),
          }
          : p,
      );
    const onUpdated = (uc: Comment) =>
      setStory((p) =>
        p
          ? {
            ...p,
            comments: p.comments.map((c) => (c._id === uc._id ? uc : c)),
          }
          : p,
      );
    const onLiked = ({ commentId, likesCount, likes }: any) =>
      setStory((p) =>
        p
          ? {
            ...p,
            comments: p.comments.map((c) =>
              c._id === commentId ? { ...c, likesCount, likes } : c,
            ),
          }
          : p,
      );
    socket.on("commentCreated", onCreated);
    socket.on("commentDeleted", onDeleted);
    socket.on("commentUpdated", onUpdated);
    socket.on("commentLiked", onLiked);
    return () => {
      socket.emit("leaveStory", id);
      socket.off("commentCreated", onCreated);
      socket.off("commentDeleted", onDeleted);
      socket.off("commentUpdated", onUpdated);
      socket.off("commentLiked", onLiked);
    };
  }, [socket, id]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await api.get(`/stories/${id}`);
      if (r.data.success) {
        setStory(r.data.story);
        setIsLiked(r.data.isLiked);
        setLikesCount(
          r.data.story.likesCounts ?? r.data.story.likedBy?.length ?? 0,
        );
      }
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStory();
  }, [id]);

  const handleLike = async () => {
    if (!story) return;
    if (!user) {
      setShowLikeAuthPrompt(true);
      return;
    }
    setShowLikeAuthPrompt(false);
    const prev = isLiked;
    setIsLiked(!prev);
    setLikesCount((c) => (prev ? c - 1 : c + 1));
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 420);
    try {
      const r = await api.post(`/stories/${story._id}/likes`);
      if (r.data.success) {
        setIsLiked(r.data.liked);
        setLikesCount(r.data.likesCount);
      }
    } catch {
      setIsLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : c - 1));
      toast.error("Failed");
    }
  };

  const openLikedBy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!story) return;
    const o = !likedByOpen;
    setLikedByOpen(o);
    if (!o) return;
    setLikedByLoading(true);
    try {
      const r = await api.get(`/stories/${story._id}/likedBy`);
      setLikedByUsers(r.data.likedBy || []);
    } catch {
      toast.error("Failed");
    } finally {
      setLikedByLoading(false);
    }
  };

  const handleShare = async () => {
    if (!story) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: story.title, url: location.href });
      } catch { }
    } else {
      await navigator.clipboard.writeText(location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleDelete = async () => {
    if (!story) return;
    try {
      await api.delete(`/stories/${story._id}`);
      toast.success("Story deleted");
      navigate("/stories");
    } catch {
      toast.error("Failed to delete story");
    }
  };

  const handleDownload = async () => {
    if (!story || downloading) return;
    setDownloading(true);
    const tid = toast.loading("Preparing PDF…");
    try {
      try {
        const r = await api.get(`/stories/download/${story._id}`, {
          responseType: "blob",
        });
        const u = URL.createObjectURL(
          new Blob([r.data], { type: "application/pdf" }),
        );
        const a = document.createElement("a");
        a.href = u;
        a.download = `${story.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(u);
        toast.success("Downloaded", { id: tid });
      } catch {
        const pw = window.open("", "_blank");
        if (!pw) {
          toast.error("Please allow popups to print", { id: tid });
          return;
        }
        pw.document.write(
          `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${story.title}</title>
          <style>body{font-family:system-ui;max-width:660px;margin:40px auto;padding:24px;line-height:1.85}h1{font-size:32px;margin:0 0 12px}img{max-width:100%;border-radius:12px;margin:16px 0}@media print{body{margin:20px}}</style>
        </head><body><h1>${story.title}</h1>${story.image?.url ? `<img src="${story.image.url}"/>` : ""
          }<p style="color:#666;font-size:14px">By ${story.owner.name || story.owner.username
          } · ${moment(story.timeStamp).format("MMMM D, YYYY")}</p><div>${story.story.replace(
            /<script[\s\S]*?<\/script>/gi,
            "",
          )}</div><script>window.onload=()=>setTimeout(()=>{window.print();window.onafterprint=()=>window.close()},600)<\/script></body></html>`,
        );
        pw.document.close();
        toast.success("Print view opened", { id: tid });
      }
    } catch {
      toast.error("Failed", { id: tid });
    } finally {
      setDownloading(false);
      setMoreOpen(false);
    }
  };

  const handleComment = async (t: string, g?: string) => {
    try {
      const r = await api.post(`/stories/${id}/comments`, {
        comment: t,
        gif: g,
      });
      if (r.data.success) {
        setStory((p) =>
          p && !p.comments.some((c) => c._id === r.data.comment._id)
            ? { ...p, comments: [r.data.comment, ...p.comments] }
            : p,
        );
        toast.success("Comment posted");
      }
    } catch {
      toast.error("Failed to post comment");
    }
  };

  const handleReply = async (pid: string, t: string, g?: string) => {
    try {
      const r = await api.post(`/stories/${id}/comments`, {
        comment: t,
        gif: g,
        parentId: pid,
      });
      if (r.data.success) {
        setStory((p) =>
          p && !p.comments.some((c) => c._id === r.data.comment._id)
            ? { ...p, comments: [r.data.comment, ...p.comments] }
            : p,
        );
        toast.success("Reply posted");
      }
    } catch {
      toast.error("Failed to reply");
    }
  };

  const handleEditComment = async (cid: string, t: string) => {
    try {
      const r = await api.put(`/stories/${id}/comments/${cid}`, { comment: t });
      if (r.data.success) {
        setStory((p) =>
          p
            ? {
              ...p,
              comments: p.comments.map((c) =>
                c._id === cid ? r.data.comment : c,
              ),
            }
            : p,
        );
        toast.success("Comment updated");
      }
    } catch {
      toast.error("Failed to update comment");
    }
  };

  const handleLikeComment = async (cid: string) => {
    try {
      const r = await api.post(`/stories/${id}/comments/${cid}/like`);
      if (r.data.success) {
        setStory((p) =>
          p
            ? {
              ...p,
              comments: p.comments.map((c) =>
                c._id === cid
                  ? {
                    ...c,
                    likesCount: r.data.likesCount,
                    likes: r.data.likes,
                  }
                  : c,
              ),
            }
            : p,
        );
      }
    } catch {
      toast.error("Failed");
    }
  };

  const handleDeleteComment = async (cid: string) => {
    if (!story) return;
    try {
      await api.delete(`/stories/${story._id}/comments/${cid}`);
      setStory((p) =>
        p
          ? {
            ...p,
            comments: p.comments.filter(
              (c) => c._id !== cid && c.parentId !== cid,
            ),
          }
          : p,
      );
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const handleTranslate = async (code: string) => {
    if (!story) return;
    setCurrentLang(code);
    if (code === "en") {
      setTranslatedText(null);
      return;
    }
    setTranslating(true);
    const tid = toast.loading("Translating story…");
    try {
      const p = story.story
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      setTranslatedText(await translateText(p, code));
      toast.success("Translated", { id: tid });
    } catch {
      toast.error("Translation failed", { id: tid });
      setCurrentLang("en");
    } finally {
      setTranslating(false);
    }
  };

  if (loading)
    return (
      <>
        <style>{css}</style>
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-3"
          style={{ background: "var(--bg)", fontFamily: "var(--font)" }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--text)",
            }}
          />
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-soft)" }}
          >
            Loading story…
          </p>
        </div>
      </>
    );

  if (error) {
    const isNotFound =
      error.toLowerCase().includes("not found") ||
      error.toLowerCase().includes("not exist");
    return (
      <>
        <style>{css}</style>
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "var(--bg)", fontFamily: "var(--font)" }}
        >
          <div className="w-full max-w-md">
            <ErrorCard
              variant="centered"
              title={isNotFound ? "Story not found" : "Failed to load story"}
              message={error}
              actionLabel="Try again"
              onAction={fetchStory}
              secondaryActionLabel="Back to stories"
              onSecondaryAction={() => navigate("/stories")}
            />
          </div>
        </div>
      </>
    );
  }

  if (!story) {
    return (
      <>
        <style>{css}</style>
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "var(--bg)", fontFamily: "var(--font)" }}
        >
          <div className="w-full max-w-md">
            <ErrorCard
              variant="centered"
              title="Story not found"
              message="This story does not exist or may have been removed."
              secondaryActionLabel="Back to stories"
              onSecondaryAction={() => navigate("/stories")}
            />
          </div>
        </div>
      </>
    );
  }

  const isOwner = story.owner?._id === user?._id;
  const fsClass = `fs-${fontSize}`;
  const readMin = Math.max(
    1,
    Math.ceil(
      story.story
        .replace(/<[^>]*>/g, "")
        .trim()
        .split(/\s+/).length / 220,
    ),
  );
  const langInfo = LANGUAGES.find((l) => l.code === currentLang);
  const audioText = (translatedText || story.story)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const total = story.comments.length;

  return (
    <>
      <style>{css}</style>
      <Progress />
      <div
        className="min-h-screen"
        style={{ background: "var(--bg)", fontFamily: "var(--font)" }}
      >
        <TranslateSheet
          open={translateOpen}
          onClose={() => setTranslateOpen(false)}
          onSelect={handleTranslate}
          current={currentLang}
        />
        <FontSheet
          open={fontOpen}
          onClose={() => setFontOpen(false)}
          size={fontSize}
          onChange={setFontSize}
        />

        {/* Delete Story Confirmation Modal */}
        {deleteOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setDeleteOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
            <div
              className="relative rounded-2xl p-6 max-w-sm w-full scale-in"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-xl)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: "rgba(229, 72, 77, 0.12)",
                  color: "var(--accent-red)",
                }}
              >
                <i className="ri-delete-bin-6-line text-xl" />
              </div>
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: "var(--text)" }}
              >
                Delete this story?
              </h3>
              <p
                className="text-[13.5px] mb-5 leading-relaxed"
                style={{ color: "var(--text-mid)" }}
              >
                This action is permanent and will remove the story and all of
                its comments.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-[13px] tap"
                  style={{
                    background: "var(--bg)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-[13px] text-white tap"
                  style={{ background: "var(--accent-red)" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Sticky Editorial Reader Topbar ── */}
        <div className="sticky top-0 z-50 w-full pt-3 px-3 sm:px-6 pointer-events-none">
          <header
            className="pointer-events-auto max-w-[720px] mx-auto h-13 rounded-full flex items-center justify-between gap-2 px-2.5 sm:px-3.5 backdrop-blur-md transition-all"
            style={{
              background: "color-mix(in srgb, var(--card) 88%, transparent)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Left: Back + Compact Story Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full flex items-center justify-center tap flex-shrink-0"
                style={{ color: "var(--text)" }}
                aria-label="Go back"
              >
                <i className="ri-arrow-left-line text-lg" />
              </button>

              <div
                className="h-4 w-[1px] flex-shrink-0"
                style={{ background: "var(--border)" }}
              />

              <p
                className="text-[13px] font-semibold truncate"
                style={{ color: "var(--text)" }}
              >
                {story.title}
              </p>
            </div>

            {/* Right: Reader Utilities */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Typography Size */}
              <button
                onClick={() => setFontOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center tap"
                style={{ color: "var(--text-mid)" }}
                aria-label="Reading typography"
                title="Reading size"
              >
                <span className="font-serif font-bold text-[13px]">Aa</span>
              </button>

              {/* Translate */}
              <button
                onClick={() => setTranslateOpen(true)}
                className="h-8 px-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 tap"
                style={
                  currentLang !== "en"
                    ? {
                      background: "var(--text)",
                      color: "var(--card)",
                    }
                    : {
                      background: "var(--bg)",
                      color: "var(--text-mid)",
                      border: "1px solid var(--border)",
                    }
                }
                aria-label="Translate story"
                title="Translate"
              >
                <span className="text-sm leading-none">
                  {langInfo?.flag || <i className="ri-translate-2" />}
                </span>
                <span className="text-[11px] uppercase hidden sm:inline">
                  {currentLang}
                </span>
              </button>

              {/* Share Quick Button */}
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full hidden sm:flex items-center justify-center tap"
                style={{ color: "var(--text-mid)" }}
                title="Share story"
              >
                <i className="ri-share-forward-line text-base" />
              </button>

              {/* More Menu */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoreOpen(!moreOpen);
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center tap"
                  style={{
                    background: moreOpen ? "var(--bg)" : "transparent",
                    color: "var(--text)",
                  }}
                  aria-label="More options"
                >
                  <i className="ri-more-fill text-lg" />
                </button>

                {moreOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 z-50 w-48 rounded-2xl p-1.5 scale-in"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-lg)",
                    }}
                  >
                    <button
                      role="menuitem"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-left tap disabled:opacity-50"
                      style={{ color: "var(--text)" }}
                    >
                      <i
                        className={
                          downloading
                            ? "ri-loader-4-line animate-spin text-sm"
                            : "ri-download-2-line text-sm"
                        }
                      />
                      <span>
                        {downloading ? "Preparing PDF…" : "Download PDF"}
                      </span>
                    </button>

                    <button
                      role="menuitem"
                      onClick={() => {
                        handleShare();
                        setMoreOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-left tap"
                      style={{ color: "var(--text)" }}
                    >
                      <i className="ri-share-line text-sm" />
                      <span>Copy / Share link</span>
                    </button>

                    {isOwner && (
                      <>
                        <div
                          className="h-px my-1 mx-1.5"
                          style={{ background: "var(--border)" }}
                        />
                        <Link
                          to={`/write?edit=${story._id}`}
                          role="menuitem"
                          onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium tap"
                          style={{ color: "var(--text)" }}
                        >
                          <i className="ri-pencil-line text-sm" />
                          <span>Edit story</span>
                        </Link>
                        <button
                          role="menuitem"
                          onClick={() => {
                            setDeleteOpen(true);
                            setMoreOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-left tap"
                          style={{ color: "var(--accent-red)" }}
                        >
                          <i className="ri-delete-bin-6-line text-sm" />
                          <span>Delete story</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* ── Main Reader Container ── */}
        <main className="max-w-[680px] mx-auto px-4 sm:px-6 pt-7 sm:pt-10 pb-24">
          <article className="fade-in">
            {/* Category & Reading Meta */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {story.category && (
                <span
                  className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
                  style={{
                    background: "var(--card)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {story.category}
                </span>
              )}
              <span
                className="text-[12.5px] font-medium"
                style={{ color: "var(--text-soft)" }}
              >
                {moment(story.timeStamp).format("MMM D, YYYY")}
              </span>
              <span
                className="text-[12px]"
                style={{ color: "var(--text-soft)" }}
              >
                ·
              </span>
              <span
                className="text-[12.5px] font-medium"
                style={{ color: "var(--text-soft)" }}
              >
                {readMin} min read
              </span>
            </div>

            {/* Story Title */}
            <h1
              className="mb-6 break-words"
              style={{
                fontWeight: 800,
                fontSize: "clamp(28px, 5vw, 42px)",
                lineHeight: 1.15,
                letterSpacing: "-0.028em",
                color: "var(--text)",
              }}
            >
              {story.title}
            </h1>

            {/* Editorial Author Byline Bar */}
            <div
              className="flex items-center justify-between gap-3 py-3.5 mb-7"
              style={{
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Link
                to={`/profile/${story.owner._id}`}
                className="flex items-center gap-3 min-w-0 group"
              >
                <Avatar
                  src={story.owner.image?.url}
                  name={story.owner.username}
                  size={40}
                />
                <div className="min-w-0">
                  <p
                    className="text-[14px] font-bold truncate group-hover:underline"
                    style={{ color: "var(--text)" }}
                  >
                    {story.owner.name || story.owner.username}
                  </p>
                  <p
                    className="text-[12px] truncate"
                    style={{ color: "var(--text-soft)" }}
                  >
                    @{story.owner.username}
                  </p>
                </div>
              </Link>

              {/* Quick Engagement Summary in Header */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleLike}
                  className="h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 tap"
                  style={{
                    background: isLiked
                      ? "rgba(229, 72, 77, 0.1)"
                      : "var(--card)",
                    color: isLiked ? "var(--accent-red)" : "var(--text-mid)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <i
                    className={`${isLiked ? "ri-heart-3-fill" : "ri-heart-3-line"
                      } text-sm ${likeAnim ? "heart-pop" : ""}`}
                  />
                  <span className="tabular-nums">{likesCount}</span>
                </button>

                <button
                  onClick={() =>
                    commentsRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 tap"
                  style={{
                    background: "var(--card)",
                    color: "var(--text-mid)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <i className="ri-chat-1-line text-sm" />
                  <span className="tabular-nums">{total}</span>
                </button>
              </div>
            </div>

            {/* Cover Image */}
            {story.image?.url && (
              <figure
                className="mb-7 rounded-2xl overflow-hidden"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <img
                  src={story.image.url}
                  alt={story.title}
                  className="w-full max-h-[460px] object-cover block"
                  loading="lazy"
                />
              </figure>
            )}

            {/* Neural Audio Player */}
            <div className="mb-8">
              <StoryAudioPlayer
                text={audioText}
                storyId={story._id}
                activeSentenceIndex={activeSentenceIndex}
                onSentenceChange={(idx) => setActiveSentenceIndex(idx)}
                onSentencesLoaded={(s) => setTtsSentences(s)}
              />
            </div>

            {/* Translation Status Banner */}
            {translating && (
              <div
                className="card mb-6 flex items-center gap-2.5 px-4 py-3 text-xs font-semibold"
                style={{ color: "var(--text-mid)" }}
              >
                <i className="ri-loader-4-line animate-spin text-sm" />
                <span>Translating story…</span>
              </div>
            )}

            {translatedText && !translating && (
              <div className="card mb-6 flex items-center justify-between px-4 py-2.5">
                <span
                  className="flex items-center gap-2 text-xs font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  <span className="text-base">{langInfo?.flag}</span>
                  <span>Translated to {langInfo?.name}</span>
                </span>
                <button
                  onClick={() => {
                    setTranslatedText(null);
                    setCurrentLang("en");
                  }}
                  className="text-xs font-semibold underline tap"
                  style={{ color: "var(--text-mid)" }}
                >
                  Show original
                </button>
              </div>
            )}

            {/* Story Body */}
            <div ref={bodyRef} className={`body-content ${fsClass}`}>
              {translatedText ? (
                <div>
                  {translatedText
                    .split(/\n\n+/)
                    .filter(Boolean)
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: story.story }} />
              )}
            </div>

            {/* End-of-Story Engagement Bar */}
            <div
              className="mt-12 pt-6 flex items-center justify-between flex-wrap gap-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {/* Left: Unified Like + LikedBy Control */}
              <div className="flex items-center gap-2">
                <div
                  className="relative inline-flex items-center rounded-full"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                  ref={likePromptRef}
                >
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-semibold tap transition-colors"
                    style={{
                      color: isLiked ? "var(--accent-red)" : "var(--text)",
                    }}
                  >
                    <i
                      className={`${isLiked ? "ri-heart-3-fill" : "ri-heart-3-line"
                        } text-base ${likeAnim ? "heart-pop" : ""}`}
                    />
                    <span className="tabular-nums">{likesCount}</span>
                  </button>

                  {likesCount > 0 && (
                    <div className="relative" ref={likedByRef}>
                      <button
                        onClick={openLikedBy}
                        className="h-10 pr-3.5 pl-2 text-[12px] font-medium tap flex items-center gap-1"
                        style={{
                          color: "var(--text-soft)",
                          borderLeft: "1px solid var(--border)",
                        }}
                        title="See who liked this story"
                      >
                        <span>Likes</span>
                        <i className="ri-arrow-up-s-line text-xs" />
                      </button>
                      {likedByOpen && (
                        <LikedByPopover
                          users={likedByUsers}
                          loading={likedByLoading}
                          onClose={() => setLikedByOpen(false)}
                        />
                      )}
                    </div>
                  )}

                  {/* Unauthenticated Like Prompt Tooltip */}
                  {showLikeAuthPrompt && (
                    <div
                      className="absolute left-0 bottom-full mb-2.5 z-40 scale-in flex items-center gap-2.5 px-3.5 py-2 rounded-xl border whitespace-nowrap"
                      style={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                        boxShadow: "var(--shadow-lg)",
                      }}
                      role="tooltip"
                    >
                      <span
                        className="text-xs font-medium select-none"
                        style={{ color: "var(--text)" }}
                      >
                        Sign in to like this story
                      </span>
                      <Link
                        to="/login"
                        state={{ from: `/stories/${story._id}` }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold tap"
                        style={{
                          background: "var(--text)",
                          color: "var(--card)",
                        }}
                      >
                        Log in
                      </Link>
                    </div>
                  )}
                </div>

                {/* Comment Count Button */}
                <button
                  onClick={() =>
                    commentsRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="pill-btn h-10 px-4"
                >
                  <i className="ri-chat-1-line text-base" />
                  <span className="tabular-nums">{total}</span>
                </button>
              </div>

              {/* Right: Share & Download */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="pill-btn h-10 px-3.5"
                  title="Download PDF"
                >
                  <i
                    className={
                      downloading
                        ? "ri-loader-4-line animate-spin text-sm"
                        : "ri-download-2-line text-sm"
                    }
                  />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={handleShare}
                  className="pill-btn pill-btn-dark h-10 px-4"
                >
                  <i className="ri-share-forward-line text-sm" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </article>

          {/* ── Comments Section ── */}
          <section ref={commentsRef} className="mt-12 pt-8 scroll-mt-16" style={{ borderTop: "1px solid var(--border)" }}>
            {/* Section Header + Sort Switcher */}
            <div className="flex items-center justify-between mb-6 gap-3">
              <div className="flex items-center gap-2">
                <h2
                  className="text-lg font-bold tracking-tight"
                  style={{ color: "var(--text)" }}
                >
                  Responses
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums"
                  style={{
                    background: "var(--card)",
                    color: "var(--text-mid)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {total}
                </span>
              </div>

              {mainComments.length > 1 && (
                <div
                  className="flex items-center p-0.5 rounded-xl"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {(["new", "top"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold tap transition-all"
                      style={{
                        background:
                          sortBy === s ? "var(--text)" : "transparent",
                        color: sortBy === s ? "var(--card)" : "var(--text-mid)",
                      }}
                    >
                      {s === "new" ? "Newest" : "Top"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top-Level Comment Composer */}
            <div className="mb-6">
              <CommentBox
                onSubmit={handleComment}
                placeholder="Write a response…"
              />
            </div>

            {/* Thread List */}
            <div>
              {sorted.length === 0 ? (
                <div
                  className="rounded-2xl py-12 px-4 text-center"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <i
                    className="ri-chat-1-line text-2xl block mb-2"
                    style={{ color: "var(--text-soft)" }}
                  />
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    No responses yet
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-soft)" }}
                  >
                    Start the conversation by sharing your thoughts above.
                  </p>
                </div>
              ) : (
                sorted.map((c) => (
                  <Comment
                    key={c._id}
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
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};