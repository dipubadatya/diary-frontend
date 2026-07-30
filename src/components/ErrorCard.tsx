import React from 'react';

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ 
  message = 'Failed to load content. Please verify your connection.', 
  onRetry 
}) => {
  return (
    <div className="w-full flex items-center justify-center p-6 min-h-[300px]">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-8 text-center shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden font-sans">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-brand mx-auto mb-4">
          <i className="ri-error-warning-line text-2xl"></i>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Connection error</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-serif italic">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 px-5 py-2.5 bg-brand text-white font-bold text-xs uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-transform shadow-md shadow-orange-500/15"
          >
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
};
