

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import DiaryLogo from "../components/DiaryLogo";


const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // New UI Error/Success States
  const [apiError, setApiError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      await api.post('/auth/forgot-password', data);
      
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      startCooldown();
    } catch (err: any) {
      setApiError(err.message || 'We had trouble sending the link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !submittedEmail) return;
    try {
      setIsSubmitting(true);
      setResendMessage(null);
      const res = await api.post('/auth/forgot-password', { email: submittedEmail });
      
      setResendMessage({ type: 'success', text: res.data.message || 'Another reset link has been sent.' });
      startCooldown();
    } catch (err: any) {
      setResendMessage({ type: 'error', text: err.message || "We couldn't resend the link right now." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryDifferentEmail = () => {
    setIsSubmitted(false);
    setSubmittedEmail('');
    setResendCooldown(0);
    setApiError(null);
    setResendMessage(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 font-sans selection:bg-stone-900 selection:text-white overflow-hidden">

      {/* ═══════════ SKY HERO SECTION — matches Login/Signup ═══════════ */}
      <section className="relative min-h-screen overflow-hidden">

        {/* Sky Background */}
        <div
          className="absolute inset-0"
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
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-32 bg-white/40 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-40 bg-white/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-80 h-36 bg-white/50 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-1/4 w-72 h-32 bg-white/40 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">

          {/* ─── Navbar ─── */}
          <nav className="flex items-center justify-between px-4 sm:px-6 md:px-10 lg:px-16 py-5 md:py-6">
          <DiaryLogo></DiaryLogo>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-white/30 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </nav>

          {/* ─── Main content ─── */}
          <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-10 py-8 md:py-12">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

              {/* ─── Left: Contextual copy ─── */}
              <motion.div
                key={isSubmitted ? 'sent-copy' : 'form-copy'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center lg:text-left"
              >
                {!isSubmitted ? (
                  <>
                    <h1
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Forgot your<br />
                      <span className="italic font-normal">password?</span>
                    </h1>
                    <p className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed">
                      No worries — it happens. Enter the email you used to
                      sign up, and we'll send you a link to create a new password.
                    </p>
                  </>
                ) : (
                  <>
                    <h1
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Check your<br />
                      <span className="italic font-normal">inbox.</span>
                    </h1>
                    <p className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed">
                      We just sent a reset link to your email.
                      Open it and click the link inside to set a new password.
                    </p>
                  </>
                )}

                <p className="hidden md:block text-[11px] md:text-xs text-white/80 font-medium tracking-wide uppercase">
                  Write · Share · Read · Connect
                </p>
              </motion.div>

              {/* ─── Right: Card ─── */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
              >
                <div
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl"
                  style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                >
                  <AnimatePresence mode="wait">
                    {!isSubmitted ? (
                      /* ═══ FORM STATE ═══ */
                      <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Card header */}
                        <div className="mb-6">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-2">
                            · Reset password ·
                          </p>
                          <h2
                            className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900"
                            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                          >
                            Let's find<br />
                            <span className="italic font-normal">your account.</span>
                          </h2>
                        </div>

                        {/* UI Error Message Display */}
                        {apiError && (
                          <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[13px] text-red-600 font-medium leading-relaxed">
                              {apiError}
                            </p>
                          </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                          {/* Email */}
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-[11px] font-bold tracking-widest uppercase text-stone-500 mb-2"
                            >
                              Your email address
                            </label>
                            <input
                              id="email"
                              type="email"
                              autoComplete="email"
                              autoFocus
                              {...register('email')}
                              placeholder="you@example.com"
                              className={`w-full bg-stone-50 border-2 rounded-2xl px-5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none transition-all ${
                                errors.email
                                  ? 'border-red-300 focus:border-red-500'
                                  : 'border-stone-100 focus:border-sky-400'
                              }`}
                            />
                            {errors.email ? (
                              <p className="text-[11px] text-red-500 mt-1.5 ml-1">
                                {errors.email.message}
                              </p>
                            ) : (
                              <p className="text-[11px] text-stone-500 mt-1.5 ml-1">
                                Use the email you signed up with.
                              </p>
                            )}
                          </div>

                          {/* Submit */}
                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Sending link…
                                </>
                              ) : (
                                <>
                                  Send Reset Link
                                  <span className="w-5 h-5 md:w-6 md:h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                                    →
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>

                        {/* Back to sign in */}
                        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
                          <p className="text-sm text-stone-600">
                            Remember your password?{' '}
                            <Link
                              to="/login"
                              className="text-sky-600 hover:text-sky-800 font-bold transition-colors"
                            >
                              Sign in
                            </Link>
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      /* ═══ SUCCESS STATE ═══ */
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        {/* Success icon */}
                        <div className="flex justify-center mb-5">
                          <div className="w-14 h-14 bg-[#C6F547] rounded-full flex items-center justify-center">
                            <Mail className="w-6 h-6 text-stone-900" strokeWidth={2.5} />
                          </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-6">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600 uppercase mb-2">
                            · Link sent ·
                          </p>
                          <h2
                            className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900"
                            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                          >
                            Check your<br />
                            <span className="italic font-normal">email inbox.</span>
                          </h2>
                        </div>

                        {/* Email address highlight */}
                        <div className="bg-sky-50 border-2 border-sky-100 rounded-2xl p-4 mb-5">
                          <p className="text-[10px] font-bold tracking-widest uppercase text-sky-700 mb-1">
                            We sent the link to
                          </p>
                          <p className="text-sm font-bold text-stone-900 break-all">
                            {submittedEmail}
                          </p>
                        </div>

                        {/* What to do next */}
                        <div className="space-y-3 mb-6">
                          <div className="flex gap-3">
                            <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                              1
                            </div>
                            <p className="text-sm text-stone-700 leading-relaxed">
                              Open your inbox and look for an email from{' '}
                              <span className="font-semibold">Diary</span>.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                              2
                            </div>
                            <p className="text-sm text-stone-700 leading-relaxed">
                              Click the reset link inside — it's valid for the next{' '}
                              <span className="font-semibold">30 minutes</span>.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                              3
                            </div>
                            <p className="text-sm text-stone-700 leading-relaxed">
                              Set your new password and you're back in.
                            </p>
                          </div>
                        </div>

                        {/* Spam folder note */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
                          <p className="text-[12px] text-amber-800 leading-relaxed">
                            <span className="font-bold">Can't find it?</span> Check your{' '}
                            <span className="font-semibold">Spam</span> or{' '}
                            <span className="font-semibold">Promotions</span> folder.
                            The email can sometimes take a minute or two to arrive.
                          </p>
                        </div>

                        {/* Resend Status UI Alert */}
                        {resendMessage && (
                          <div className={`mb-4 p-3 border rounded-2xl flex items-start gap-2.5 ${resendMessage.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <p className={`text-[12px] font-medium leading-relaxed ${resendMessage.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                              {resendMessage.text}
                            </p>
                          </div>
                        )}

                        {/* Resend button */}
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resendCooldown > 0 || isSubmitting}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-full text-xs font-bold tracking-wide uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : resendCooldown > 0 ? (
                            <>Resend in {resendCooldown}s</>
                          ) : (
                            <>Resend Link</>
                          )}
                        </button>

                        {/* Try different email */}
                        <button
                          type="button"
                          onClick={handleTryDifferentEmail}
                          className="w-full text-center text-sm text-sky-600 hover:text-sky-800 font-bold transition-colors py-2"
                        >
                          Use a different email address
                        </button>

                        {/* Back to sign in */}
                        <div className="mt-4 pt-5 border-t border-stone-100 text-center">
                          <Link
                            to="/login"
                            className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 font-medium transition-colors"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to sign in
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};