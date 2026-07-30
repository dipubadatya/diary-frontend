


import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

// ─── Floating Journal Cards with Real Content ────────────────────────────────
// Same layout as before, but each card now has readable thoughts, quotes, 
// poetry, letters, book notes — real content people would actually write.

const JOURNALS = [
  {
    id: 1,
    bg: "bg-[#D1D1D1]", // Silver/Grey
    text: "text-stone-800",
    classes: "flex w-24 h-32 -top-6 -left-6 md:w-56 md:h-72 md:top-[5%] md:left-[15%]",
    rotate: -12,
    content: (
      <div className="w-full h-full flex flex-col p-2 md:p-5 relative">
        <span className="text-[6px] md:text-[9px] font-bold uppercase tracking-widest text-stone-600">Thoughts</span>
        <p className="text-[8px] md:text-sm mt-2 md:mt-4 leading-tight md:leading-snug font-medium" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          <span className="hidden md:inline">"Some days you write.<br/>Some days you just<br/>survive. Both count."</span>
          <span className="md:hidden">"Some days you write. Some days you survive."</span>
        </p>
        <span className="absolute bottom-2 right-2 md:bottom-3 md:right-4 text-[6px] md:text-[10px] text-stone-500">— aisha</span>
      </div>
    )
  },
  {
    id: 2,
    bg: "bg-[#4ADE80]", // Vibrant Green
    text: "text-stone-900",
    classes: "flex w-28 h-20 top-4 -right-8 md:w-64 md:h-48 md:top-[5%] md:right-[15%]",
    rotate: 15,
    content: (
      <div className="w-full h-full flex flex-col p-2 md:p-5 relative">
        <span className="text-[6px] md:text-[9px] font-bold uppercase tracking-widest">Book Note</span>
        <h3 className="text-xs md:text-xl font-bold leading-tight mt-1 md:mt-3" style={{ fontFamily: "'Fraunces', serif" }}>
          The Alchemist<br/><span className="italic font-normal">still hits.</span>
        </h3>
        <span className="absolute bottom-2 right-2 md:bottom-3 md:right-4 text-[6px] md:text-[10px] font-semibold">— rohan</span>
      </div>
    )
  },
  {
    id: 3,
    bg: "bg-[#1A1A1A]", // Black
    text: "text-white",
    classes: "hidden md:flex md:w-72 md:h-72 md:top-[35%] md:left-[8%]",
    rotate: -8,
    content: (
      <div className="w-full h-full flex flex-col p-6 justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Poetry</span>
        <div>
          <p className="text-xl leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
            <em>i met myself<br/>in a book once —<br/>we've been friends<br/>ever since.</em>
          </p>
        </div>
        <span className="text-[11px] text-white/60">— @nightreader</span>
      </div>
    )
  },
  {
    id: 4,
    bg: "bg-[#2A2A2A]", // Dark Grey
    text: "text-stone-300",
    classes: "hidden md:flex md:w-64 md:h-80 md:top-[30%] md:right-[5%]",
    rotate: 12,
    content: (
      <div className="w-full h-full flex flex-col p-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Letter</span>
        <h3 className="text-xl font-bold leading-tight text-white mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
          To the version<br/>of me at 19
        </h3>
        <p className="text-xs leading-relaxed opacity-70">
          You were right to leave. You were right to stay. You were right to be scared. Keep going.
        </p>
        <div className="mt-auto flex items-center justify-between text-[10px] text-stone-500">
          <span>— priya</span>
          <span>♡ 412</span>
        </div>
      </div>
    )
  },
  {
    id: 5,
    bg: "bg-[#F472B6]", // Pink
    text: "text-white",
    classes: "flex w-20 h-20 -bottom-4 -left-4 md:w-56 md:h-56 md:bottom-[5%] md:left-[15%]",
    rotate: -5,
    content: (
      <div className="w-full h-full p-2 md:p-5 flex flex-col relative">
        <span className="text-[6px] md:text-[9px] font-bold uppercase tracking-widest">Character</span>
        <h3 className="text-[10px] md:text-lg font-bold leading-tight mt-1 md:mt-3" style={{ fontFamily: "'Fraunces', serif" }}>
          <span className="hidden md:inline">Why Atticus<br/>Finch raised<br/>a generation</span>
          <span className="md:hidden">Atticus<br/>Finch.</span>
        </h3>
        <span className="mt-auto text-[6px] md:text-[10px] opacity-80">— sam · 8 min read</span>
      </div>
    )
  },
  {
    id: 6,
    bg: "bg-white", // White
    text: "text-stone-900",
    classes: "hidden md:flex md:bottom-[-10%] md:left-[45%] md:w-52 md:h-64",
    rotate: 6,
    content: (
      <div className="w-full h-full flex flex-col p-5 border border-stone-100">
        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-3">Currently Reading</span>
        <div className="space-y-2.5 text-[11px]">
          <div className="flex justify-between">
            <span className="font-medium" style={{ fontFamily: "'Fraunces', serif" }}>Tomorrow, and Tomorrow</span>
          </div>
          <div className="h-px bg-stone-100" />
          <div className="flex justify-between">
            <span className="font-medium" style={{ fontFamily: "'Fraunces', serif" }}>The Midnight Library</span>
          </div>
          <div className="h-px bg-stone-100" />
          <div className="flex justify-between">
            <span className="font-medium" style={{ fontFamily: "'Fraunces', serif" }}>Klara and the Sun</span>
          </div>
        </div>
        <p className="text-[10px] font-medium mt-auto leading-tight text-stone-500">— maya's shelf</p>
      </div>
    )
  },
  {
    id: 7,
    bg: "bg-[#FACC15]", // Yellow
    text: "text-stone-900",
    classes: "flex w-32 h-24 -bottom-6 -right-6 md:w-64 md:h-56 md:bottom-[5%] md:right-[22%]",
    rotate: -4,
    content: (
      <div className="w-full h-full p-3 md:p-5 flex flex-col relative">
        <span className="text-[6px] md:text-[9px] font-bold uppercase tracking-widest">Daily</span>
        <p className="text-[9px] md:text-base leading-tight md:leading-snug mt-1 md:mt-3 font-medium" style={{ fontFamily: "'Fraunces', serif" }}>
          <span className="hidden md:inline">"Made chai for dad today. He told the grandma story again. I let him."</span>
          <span className="md:hidden">"Made chai for dad today..."</span>
        </p>
        <span className="mt-auto text-[6px] md:text-[10px] font-semibold">— arjun · tuesday</span>
      </div>
    )
  }
];

// ─── Component ───────────────────────────────────────────────────────────────

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 font-sans overflow-hidden relative selection:bg-stone-900 selection:text-white flex flex-col">
      
      {/* ── Navbar (Minimalist) ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 w-full">
        {/* Left Spacer / Mobile Logo */}
        <div className="w-20 font-bold tracking-tighter text-lg md:hidden">D/S</div>
        <div className="w-20 hidden md:block" /> 
        
        {/* Center Branding */}
        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-stone-800 rounded-sm" />
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-stone-300 rounded-sm" />
          </div>
          <span className="hidden md:block text-[9px] font-semibold text-stone-400 mt-2 tracking-widest uppercase">
            Powered by DiaryStudio®
          </span>
        </div>

        {/* Right CTA */}
        <div className="flex items-center justify-end w-20 md:w-auto z-50">
          {isAuthenticated ? (
             <Link to="/stories" className="text-sm font-semibold md:font-medium hover:opacity-70 transition-opacity">
               Dashboard
             </Link>
          ) : (
            <Link to="/login" className="text-sm font-semibold md:font-medium hover:opacity-70 transition-opacity">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── Scattered Background Journals ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {JOURNALS.map((journal, i) => (
          <motion.div
            key={journal.id}
            initial={{ opacity: 0, y: 30, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: journal.rotate }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.25, 1, 0.5, 1] }}
            className={`absolute ${journal.classes} ${journal.bg} ${journal.text} rounded-sm md:rounded-md shadow-2xl pointer-events-auto hover:z-50 transition-transform duration-500 hover:scale-105 cursor-default`}
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 40px inset rgba(255,255,255,0.05)'
            }}
          >
            {journal.content}
          </motion.div>
        ))}
      </div>

      {/* ── Center Content (Hero) ── */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-6 pointer-events-none w-full">
        <div className="text-center max-w-[90%] md:max-w-3xl flex flex-col items-center pointer-events-auto">
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-[5.5rem] font-bold tracking-tighter leading-[1.1] md:leading-[1.05] text-stone-900 mb-4 md:mb-6"
          >
            One Stop Digital<br />
            Diary <span className="inline-block hover:rotate-12 transition-transform cursor-pointer origin-bottom">📙</span> for Thinkers.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-sm md:text-base font-medium text-stone-500 mb-8 md:mb-10 max-w-sm md:max-w-md mx-auto leading-relaxed"
          >
            A minimal sanctuary of thoughts chosen by creatives, for creatives. Clear your mind, beautifully.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link 
              to="/stories" 
              className="inline-block px-8 py-3.5 bg-stone-900 text-white rounded-full text-sm font-semibold hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md duration-200"
            >
              View Collections
            </Link>
          </motion.div>

        </div>
      </main>

    </div>
  );
};
