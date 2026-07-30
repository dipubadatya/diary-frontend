import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Feather, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const VerificationSuccess: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] dark:bg-slate-950 px-6 py-12 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-lg text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <div className="absolute -bottom-1 -right-1 bg-brand text-white p-1 rounded-full border-2 border-white dark:border-slate-900">
              <Feather className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
          Email Verified
        </h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-serif leading-relaxed">
          Your storyteller quill has been unlocked! You can now log into your account, publish thoughts, upload cover imagery, comment, and engage with the community in real time.
        </p>

        <div className="mt-8">
          <Link
            to="/login"
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-black uppercase tracking-wider text-white bg-brand hover:opacity-95 transition-all group"
          >
            Log In to Your Desk
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
