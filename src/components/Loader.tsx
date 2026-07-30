import React from 'react';
import { motion } from 'framer-motion';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <div className="relative w-16 h-16">
        <motion.span
          className="absolute inset-0 border-4 border-indigo-200 rounded-full"
          style={{ borderTopColor: 'rgb(99, 102, 241)' }}
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: 'linear',
          }}
        />
        <motion.span
          className="absolute inset-2 border-4 border-cyan-100 rounded-full"
          style={{ borderBottomColor: 'rgb(6, 182, 212)' }}
          animate={{ rotate: -360 }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
        />
      </div>
      <motion.p
        className="text-sm font-medium text-slate-500 dark:text-slate-400 font-sans tracking-wide"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'easeInOut',
        }}
      >
        Loading your story...
      </motion.p>
    </div>
  );
};

export const FullPageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
      <Loader />
    </div>
  );
};
