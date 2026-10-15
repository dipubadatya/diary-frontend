
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import DiaryLogo from "../components/DiaryLogo";
/// ─── Floating Journal Cards ───────────────────────────────────────────────────
const JOURNALS = [
  {
    id: 1,
    bg: "bg-white",
    text: "text-stone-800",
    content: (
      <div className="w-full h-full flex flex-col p-3 md:p-4 relative overflow-hidden">
        <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0">
          Personal
        </span>
        <p
          className="text-[10px] md:text-sm mt-1 md:mt-2 leading-tight font-medium line-clamp-3 md:line-clamp-4"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          "Had a long day today. Didn't get everything done, but that's okay."
        </p>
        <span className="mt-auto pt-1 text-[7px] md:text-[10px] text-stone-500 shrink-0">
          — aisha
        </span>
      </div>
    ),
  },
  {
    id: 2,
    bg: "bg-[#C6F547]",
    text: "text-stone-900",
    content: (
      <div className="w-full h-full flex flex-col p-3 md:p-4 relative overflow-hidden">
        <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest shrink-0">
          Book Note
        </span>
        <h3
          className="text-sm md:text-lg font-bold leading-tight mt-1 md:mt-2 line-clamp-3 md:line-clamp-4"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          The Alchemist —<br />
          <span className="italic font-normal">still thinking about it.</span>
        </h3>
        <span className="mt-auto pt-1 text-[7px] md:text-[10px] font-semibold shrink-0">
          — rohan
        </span>
      </div>
    ),
  },
  {
    id: 3,
    bg: "bg-[#1A1A1A]",
    text: "text-white",
    content: (
      <div className="w-full h-full flex flex-col p-3 md:p-4 justify-between overflow-hidden">
        <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest text-white/50 shrink-0">
          Story
        </span>
        <p
          className="text-xs md:text-base leading-snug line-clamp-3"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          <em>
            I didn't realize how much I missed this place until I came back.
          </em>
        </p>
        <span className="text-[7px] md:text-[10px] text-white/60 shrink-0">
          — @nightreader
        </span>
      </div>
    ),
  },
  {
    id: 4,
    bg: "bg-[#F472B6]",
    text: "text-white",
    content: (
      <div className="w-full h-full p-3 md:p-4 flex flex-col relative overflow-hidden">
        <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest shrink-0">
          Thought
        </span>
        <h3
          className="text-sm md:text-lg font-bold leading-tight mt-1 md:mt-2 line-clamp-3 md:line-clamp-4"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Something I've been thinking about for a while, finally written down.
        </h3>
        <span className="mt-auto pt-1 text-[7px] md:text-[10px] opacity-80 shrink-0">
          — sam
        </span>
      </div>
    ),
  },
  {
    id: 5,
    bg: "bg-white",
    text: "text-stone-900",
    content: (
      <div className="w-full h-full flex flex-col p-3 md:p-4 overflow-hidden">
        <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1.5 md:mb-2 shrink-0">
          Reading
        </span>
        <div className="space-y-1 md:space-y-1.5 text-[9px] md:text-[11px] overflow-hidden">
          <div
            className="font-medium truncate"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Tomorrow, and Tomorrow
          </div>
          <div className="h-px bg-stone-100" />
          <div
            className="font-medium truncate"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            The Midnight Library
          </div>
          <div className="h-px bg-stone-100" />
          <div
            className="font-medium truncate"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Klara and the Sun
          </div>
        </div>
        <p className="text-[7px] md:text-[10px] font-medium mt-auto pt-1 text-stone-500 shrink-0">
          — maya's shelf
        </p>
      </div>
    ),
  },
  {
    id: 6,
    bg: "bg-[#FACC15]",
    text: "text-stone-900",
    content: (
      <div className="w-full h-full p-3 md:p-4 flex flex-col relative overflow-hidden">
        <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest shrink-0">
          Daily
        </span>
        <p
          className="text-[10px] md:text-sm leading-tight mt-1 md:mt-2 font-medium line-clamp-3 md:line-clamp-4"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          "Dad made chai this morning. We talked for ten minutes before he
          left."
        </p>
        <span className="mt-auto pt-1 text-[7px] md:text-[10px] font-semibold shrink-0">
          — arjun
        </span>
      </div>
    ),
  },
];
// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 1,
    icon: "✎",
    iconBg: "bg-sky-100 text-sky-600",
    title: "Write your way",
    description:
      "Write a story, share a thought, or put your day into words. Edit it whenever you need to.",
  },
  {
    id: 2,
    icon: "↗",
    iconBg: "bg-[#C6F547] text-stone-900",
    title: "Share your thoughts",
    description:
      "Publish your writing and let other people read, like, and respond to it.",
  },
  {
    id: 3,
    icon: "💬",
    iconBg: "bg-pink-100 text-pink-600",
    title: "Comment & reply",
    description:
      "Say something about a story, reply to someone, and keep the conversation going.",
  },
  {
    id: 4,
    icon: "⚡",
    iconBg: "bg-stone-900 text-yellow-300",
    title: "Message in real time",
    description:
      "Send messages and have conversations with other Diary users in real time.",
  },
  {
    id: 5,
    icon: "📚",
    iconBg: "bg-amber-100 text-amber-700",
    title: "Books & quotes",
    description:
      "Found a book you loved? Came across a line worth keeping? Save it and come back to it later.",
  },
  {
    id: 6,
    icon: "◎",
    iconBg: "bg-stone-100 text-stone-700",
    title: "Your profile",
    description:
      "Add your profile picture, update your details, and manage the stories you've shared.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Sky background */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-sky-500"
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
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-10 left-10 w-64 h-32 bg-white/40 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-40 bg-white/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-80 h-36 bg-white/50 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-1/4 w-72 h-32 bg-white/40 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* ── Navbar ── */}
          <nav className="flex items-center justify-between px-4 sm:px-6 md:px-10 lg:px-16 py-5 md:py-6">
            <header className=" px-6 py-4">
              {/* White logo on black bg */}
              <DiaryLogo />
            </header>

            {/* Nav links — "More" removed */}
            <div className="hidden md:flex items-center gap-8 lg:gap-10 text-white/90 text-xs lg:text-sm font-semibold tracking-widest uppercase">
              <a href="#home" className="hover:text-white transition">
                Home
              </a>
              <a href="#features" className="hover:text-white transition">
                Features
              </a>
              <a href="#about" className="hover:text-white transition">
                About
              </a>
            </div>

            {/* CTA */}
            <div>
              {isAuthenticated ? (
                <Link
                  to="/stories"
                  className="inline-flex items-center px-4 md:px-6 py-2 md:py-2.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all"
                >
                  Profile
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 md:px-6 py-2 md:py-2.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all"
                >
                  Start Writing
                </Link>
              )}
            </div>
          </nav>

          {/* ── Hero content ── */}
          <div className="px-4 sm:px-6 md:px-10 pt-8 md:pt-16 pb-8 text-center max-w-5xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              A place to write,
              <br />
              <span className="italic font-normal">share, and connect.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-sm md:text-base text-white/90 max-w-md md:max-w-xl mx-auto mb-6 md:mb-8 leading-relaxed"
            >
              Write about your day, share a story, or put a thought into words.
              Read what other people have written, leave a comment, and keep the
              conversation going.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-10 md:mb-16"
            >
              <Link
                to="/stories"
                className="px-5 md:px-6 py-2.5 md:py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-white/30 transition"
              >
                Explore Stories
              </Link>
              <Link
                to={isAuthenticated ? "/stories" : "/login"}
                className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group"
              >
                Start Writing
                <span className="w-5 h-5 md:w-6 md:h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                  →
                </span>
              </Link>
            </motion.div>

            {/* Floating cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative h-40 md:h-56 max-w-4xl mx-auto"
            >
              <div className="absolute inset-0 flex items-center justify-center gap-2 md:gap-3 perspective-1000">
                {JOURNALS.map((journal, i) => {
                  const positions = [
                    { rotate: -18, y: 15, x: 0, scale: 0.85 },
                    { rotate: -10, y: 5, x: 0, scale: 0.92 },
                    { rotate: -4, y: -5, x: 0, scale: 0.98 },
                    { rotate: 4, y: -5, x: 0, scale: 0.98 },
                    { rotate: 10, y: 5, x: 0, scale: 0.92 },
                    { rotate: 18, y: 15, x: 0, scale: 0.85 },
                  ];
                  const pos = positions[i] || {
                    rotate: 0,
                    y: 0,
                    x: 0,
                    scale: 1,
                  };
                  return (
                    <motion.div
                      key={journal.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{
                        opacity: 1,
                        y: pos.y,
                        rotate: pos.rotate,
                        scale: pos.scale,
                      }}
                      transition={{
                        delay: 0.6 + i * 0.08,
                        duration: 0.6,
                        ease: [0.25, 1, 0.5, 1],
                      }}
                      whileHover={{
                        y: pos.y - 15,
                        scale: pos.scale + 0.05,
                        rotate: 0,
                        zIndex: 50,
                      }}
                      className={`w-24 h-32 md:w-36 md:h-48 ${journal.bg} ${journal.text} rounded-lg md:rounded-xl shadow-2xl cursor-pointer flex-shrink-0`}
                      style={{ boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)" }}
                    >
                      {journal.content}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-6 md:mt-8 flex flex-col items-center gap-1"
            >
              <p className="text-[11px] md:text-xs text-white/80 font-medium tracking-wide uppercase">
                Write · Share · Read · Connect
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURE STRIP (marquee)
          — "Keep things private" removed
      ══════════════════════════════════════════ */}
      <section className="bg-white py-8 md:py-12 border-y border-stone-100 overflow-hidden">
        <div className="flex items-center gap-12 md:gap-20 animate-marquee whitespace-nowrap">
          {[
            { icon: "✎", label: "Write stories" },
            { icon: "↗", label: "Share your thoughts" },
            { icon: "👁", label: "Read & discover" },
            { icon: "💬", label: "Comment & reply" },
            { icon: "❤", label: "Like writing" },
            { icon: "📚", label: "Books & quotes" },
            { icon: "⚡", label: "Message in real time" },
            { icon: "◎", label: "Manage your profile" },
          ]
            .concat([
              { icon: "✎", label: "Write stories" },
              { icon: "↗", label: "Share your thoughts" },
              { icon: "👁", label: "Read & discover" },
              { icon: "💬", label: "Comment & reply" },
              { icon: "❤", label: "Like writing" },
              { icon: "📚", label: "Books & quotes" },
              { icon: "⚡", label: "Message in real time" },
              { icon: "◎", label: "Manage your profile" },
            ])
            .map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 md:gap-3 text-stone-500 flex-shrink-0"
              >
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-stone-200 flex items-center justify-center text-[10px] md:text-xs">
                  {item.icon}
                </div>
                <span className="text-sm md:text-base font-semibold tracking-tight">
                  {item.label}
                </span>
              </div>
            ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════ */}
      <section
        id="about"
        className="bg-[#FAFAFA] px-4 sm:px-6 md:px-10 lg:px-16 py-16 md:py-24"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 md:mb-16">
            <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-stone-500 mb-4 md:mb-6">
              · ABOUT ·
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-stone-900"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Write what you want
              <br className="hidden md:block" />
              <span className="text-stone-400"> to remember.</span>
            </h2>
            <p className="mt-6 md:mt-8 text-sm md:text-base text-stone-500 max-w-xl mx-auto leading-relaxed">
              Some things are worth writing down — something that happened
              today, a story you're working on, an idea you can't stop thinking
              about, or a moment you want to share. Diary gives those thoughts a
              place to be written, read, and talked about.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {/* Card 1 — Blue: Write */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl md:rounded-3xl p-5 md:p-6 min-h-[280px] md:min-h-[420px] flex flex-col overflow-hidden text-white"
            >
              <div className="flex items-start justify-between">
                <span
                  className="text-xl md:text-2xl font-black italic tracking-tight"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Diary°
                </span>
                <div className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-sky-500 text-sm">✎</span>
                </div>
              </div>
              <div className="mt-auto bg-white text-stone-900 rounded-xl p-4 md:p-5">
                <div
                  className="text-2xl md:text-3xl font-bold leading-tight"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  A simple space
                  <br />
                  to write.
                </div>
                <p className="text-[11px] md:text-xs text-stone-500 mt-2 leading-relaxed">
                  Write a story, share a thought, or put your day into words.
                  Keep your writing together in one place.
                </p>
              </div>
            </motion.div>

            {/* Card 2 — Stone: Share */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-stone-100 rounded-2xl md:rounded-3xl p-5 md:p-6 min-h-[280px] md:min-h-[420px] flex flex-col"
            >
              <p className="text-[11px] md:text-xs text-stone-500 font-medium mb-1">
                Put your thoughts into words.
              </p>
              <div
                className="text-3xl md:text-4xl font-bold text-stone-900 mb-6 leading-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Write it down.
                <br />
                Share it with people.
              </div>
              <div className="flex -space-x-2 mb-4">
                {[
                  "from-pink-400 to-red-500",
                  "from-amber-400 to-orange-500",
                  "from-emerald-400 to-teal-500",
                  "from-purple-400 to-indigo-500",
                ].map((grad, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${grad} border-2 border-stone-100`}
                  />
                ))}
              </div>
              <p className="text-xs md:text-sm text-stone-700 leading-relaxed mt-auto">
                Publish something you've written and let other people read it,
                respond to it, and start a conversation.
              </p>
            </motion.div>

            {/* Right column */}
            <div className="flex flex-col gap-4 md:gap-5">
              {/* Card 3 — Green: Read */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[#C6F547] rounded-2xl md:rounded-3xl p-5 md:p-6 flex-1 flex flex-col justify-between min-h-[180px] md:min-h-[260px]"
              >
                <div>
                  <p className="text-[11px] md:text-xs text-stone-800 font-semibold mb-2">
                    Read &amp; connect
                  </p>
                  <div
                    className="text-3xl md:text-4xl font-bold text-stone-900 leading-tight"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    Stories worth
                    <br />
                    reading.
                  </div>
                </div>
                <p className="text-[11px] md:text-xs text-stone-800 leading-relaxed">
                  Discover what other people are writing and join the
                  conversation when something catches your attention.
                </p>
              </motion.div>

              {/* Card 4 — Black: Messaging */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-stone-900 text-white rounded-2xl md:rounded-3xl p-5 md:p-6 flex items-center justify-between min-h-[80px] md:min-h-[130px]"
              >
                <span className="text-sm md:text-base font-medium leading-snug max-w-[60%]">
                  Talk in
                  <br className="hidden md:block" /> real time.
                </span>
                <span className="text-2xl md:text-3xl" aria-hidden="true">
                  ⚡
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section
        id="features"
        className="bg-white px-4 sm:px-6 md:px-10 lg:px-16 py-16 md:py-24 border-t border-stone-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-stone-500 mb-4 md:mb-6">
              · FEATURES ·
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-stone-900"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Everything you can do
              <br />
              <span className="text-stone-400">on Diary.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-[#FAFAFA] rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col gap-3"
              >
                <div
                  className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-base md:text-lg font-bold ${feature.iconBg}`}
                >
                  {feature.icon}
                </div>
                <h3
                  className="text-base md:text-lg font-bold text-stone-900"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-xs md:text-sm text-stone-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BOOKS & QUOTES
      ══════════════════════════════════════════ */}
      <section className="bg-[#FAFAFA] px-4 sm:px-6 md:px-10 lg:px-16 py-16 md:py-24 border-t border-stone-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-stone-500 mb-4 md:mb-6">
                · BOOKS &amp; QUOTES ·
              </p>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-stone-900 mb-4 md:mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                For the things
                <br />
                <span className="text-stone-400">you read and remember.</span>
              </h2>
              <p className="text-sm md:text-base text-stone-500 leading-relaxed">
                Found a book you loved? Came across a line worth keeping? Save
                it and come back to it later.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-col gap-3"
            >
              {/* Book card */}
              <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-stone-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-14 bg-[#C6F547] rounded-md flex-shrink-0" />
                  <div>
                    <p
                      className="font-bold text-sm md:text-base text-stone-900 leading-tight"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      The Midnight Library
                    </p>
                    <p className="text-[11px] md:text-xs text-stone-500 mt-0.5">
                      Matt Haig
                    </p>
                    <p className="text-[11px] md:text-xs text-stone-400 mt-2 italic leading-relaxed">
                      "Never underestimate the big importance of small things."
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote card */}
              <div className="bg-stone-900 text-white rounded-2xl p-4 md:p-5">
                <p
                  className="text-sm md:text-base italic leading-relaxed"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  "She was not made for the light things of the world."
                </p>
                <p className="text-[11px] md:text-xs text-white/50 mt-3">
                  — saved quote
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMMUNITY
      ══════════════════════════════════════════ */}
      <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-16 py-16 md:py-24 border-t border-stone-100">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-stone-500 mb-4 md:mb-6">
              · COMMUNITY ·
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-stone-900 mb-4 md:mb-8"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Read something.
              <br />
              <span className="text-stone-400">Say something.</span>
            </h2>
            <p className="text-sm md:text-base text-stone-500 max-w-xl mx-auto leading-relaxed">
              Diary isn't only about writing your own thoughts. Read stories
              from other people, leave a comment, reply to someone, or start a
              conversation about something you enjoyed.
            </p>
          </motion.div>

          {/* Example conversation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 md:mt-14 max-w-lg mx-auto flex flex-col gap-3 text-left"
          >
            <div className="bg-[#FAFAFA] rounded-2xl p-4 border border-stone-100">
              <p className="text-xs text-stone-500 font-semibold mb-1">
                rohan · on "The walk back home"
              </p>
              <p className="text-sm text-stone-800 leading-relaxed">
                "This reminded me of something I hadn't thought about in years.
                Really glad you wrote it."
              </p>
            </div>
            <div className="bg-[#FAFAFA] rounded-2xl p-4 border border-stone-100 ml-6 md:ml-10">
              <p className="text-xs text-stone-500 font-semibold mb-1">
                aisha · replying to rohan
              </p>
              <p className="text-sm text-stone-800 leading-relaxed">
                "That means a lot. I almost didn't post it."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
          — Auth section removed
          — Sign-in note added here instead
      ══════════════════════════════════════════ */}
      <section className="bg-stone-900 px-4 sm:px-6 md:px-10 lg:px-16 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Have something
              <br />
              <span className="italic font-normal text-stone-400">
                to write?
              </span>
            </h2>
            <p className="text-sm md:text-base text-stone-400 mb-3 leading-relaxed">
              Start with whatever is on your mind.
            </p>
            <p className="text-xs text-stone-600 mb-8 md:mb-10">
              Sign in with email or continue with Google.
            </p>
            <Link
              to={isAuthenticated ? "/stories" : "/login"}
              className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-[#C6F547] text-stone-900 rounded-full text-sm md:text-base font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group"
            >
              Start Writing
              <span className="w-6 h-6 md:w-7 md:h-7 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                →
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
          — Placeholder links removed
      ══════════════════════════════════════════ */}
      <footer className="bg-white border-t border-stone-100 px-4 sm:px-6 md:px-10 lg:px-16 py-10 md:py-14">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
            </div>
            <span className="font-bold text-base tracking-tight">Diary</span>
          </div>

          {/* Copyright */}
          <p className="text-[11px] md:text-xs text-stone-400">
            © {new Date().getFullYear()} Diary. 
          </p>
        </div>
      </footer>

      {/* Marquee animation */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};
