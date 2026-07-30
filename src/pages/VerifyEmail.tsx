import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShieldAlert, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Prevent duplicate runs in React 18/19 StrictMode
  const verifiedRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token was found in the link.');
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const performVerification = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        if (res.data.success) {
          setStatus('success');
          toast.success(res.data.message || 'Email verified successfully!');
          // Redirect to success view after 1.5 seconds
          setTimeout(() => {
            navigate('/verification-success');
          }, 1500);
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Email verification failed. The token may be expired.');
        toast.error(err.message || 'Verification failed');
      }
    };

    performVerification();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] dark:bg-slate-950 px-6 py-12 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-lg text-center relative z-10">
        
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-brand animate-spin" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              Verifying Your Email
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-serif leading-relaxed">
              We are confirming your storyteller details with our archives. Please wait a moment.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500"
              >
                <CheckCircle className="w-10 h-10" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              Verified!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-serif leading-relaxed">
              Your email has been verified. Preparing your library desk...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
                <ShieldAlert className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              Verification Failed
            </h2>
            <p className="text-sm text-red-500 font-serif leading-relaxed">
              {errorMsg}
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <Link
                to="/signup"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-xs font-black uppercase tracking-wider text-white bg-brand hover:opacity-95 transition-all shadow-md"
              >
                Register Again
              </Link>
              <Link
                to="/login"
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
