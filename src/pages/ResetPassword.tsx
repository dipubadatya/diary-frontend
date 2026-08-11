
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Check, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import DiaryLogo from '../components/DiaryLogo';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Your passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // UI Error State
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchPassword = watch('password', '');
  const watchConfirmPassword = watch('confirmPassword', '');

  /* Password requirement checks */
  const checks = {
    length: watchPassword.length >= 6,
    hasLetter: /[a-zA-Z]/.test(watchPassword),
    hasNumber: /\d/.test(watchPassword),
    matches: watchPassword.length > 0 && watchPassword === watchConfirmPassword,
  };

  const passwordStrength =
    watchPassword.length >= 10 && checks.hasNumber && checks.hasLetter ? 'Strong'
    : watchPassword.length >= 8 && (checks.hasNumber || checks.hasLetter) ? 'Good'
    : watchPassword.length >= 6 ? 'Fair'
    : '';

  /* Countdown redirect after success */
  useEffect(() => {
    if (!isSuccess) return;
    if (countdown <= 0) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  /* Handle missing/invalid token */
  if (!token) {
    return <InvalidLinkState />;
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      await api.post(`/auth/reset-password/${token}`, {
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const errorMsg = err.message || 'We had trouble saving your password. Please try again.';
      setApiError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 font-sans selection:bg-stone-900 selection:text-white overflow-hidden">

      {/* ═══════════ SKY HERO SECTION — matches Login/Signup/Forgot ═══════════ */}
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
                key={isSuccess ? 'success-copy' : 'form-copy'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center lg:text-left"
              >
                {!isSuccess ? (
                  <>
                    <h1
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      A fresh<br />
                      <span className="italic font-normal">start awaits.</span>
                    </h1>
                    <p className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed">
                      Almost done. Choose a new password below and you'll
                      be right back to your writing. Make it something
                      you'll remember.
                    </p>
                  </>
                ) : (
                  <>
                    <h1
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      You're all<br />
                      <span className="italic font-normal">set. Welcome back.</span>
                    </h1>
                    <p className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed">
                      Your password has been updated. You'll be taken to
                      the sign in page in a moment, or you can head there
                      right now.
                    </p>
                  </>
                )}

                <p className="hidden md:block text-[11px] md:text-xs text-white/80 font-medium tracking-wide uppercase">
                  Write · Share · Read · Connect
                </p>
              </motion.div>

              {/* ─── Right: White card ─── */}
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
                    {!isSuccess ? (
                      /* ═══ FORM STATE ═══ */
                      <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Header */}
                        <div className="mb-6">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-2">
                            · New password ·
                          </p>
                          <h2
                            className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900"
                            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                          >
                            Set your new<br />
                            <span className="italic font-normal">password.</span>
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

                          {/* Password */}
                          <div>
                            <label
                              htmlFor="password"
                              className="block text-[11px] font-bold tracking-widest uppercase text-stone-500 mb-2"
                            >
                              New password
                            </label>
                            <div className="relative">
                              <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                autoFocus
                                autoComplete="new-password"
                                {...register('password')}
                                placeholder="At least 6 characters"
                                className={`w-full bg-stone-50 border-2 rounded-2xl px-5 py-3 pr-12 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none transition-all ${
                                  errors.password
                                    ? 'border-red-300 focus:border-red-500'
                                    : 'border-stone-100 focus:border-sky-400'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {errors.password && (
                              <p className="text-[11px] text-red-500 mt-1.5 ml-1">
                                {errors.password.message}
                              </p>
                            )}

                            {/* Password strength meter */}
                            {watchPassword && !errors.password && (
                              <div className="mt-2 px-1 flex items-center gap-2">
                                <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      passwordStrength === 'Strong' ? 'w-full bg-emerald-500' :
                                      passwordStrength === 'Good' ? 'w-2/3 bg-lime-500' :
                                      passwordStrength === 'Fair' ? 'w-1/3 bg-amber-500' : 'w-0'
                                    }`}
                                  />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                  passwordStrength === 'Strong' ? 'text-emerald-600' :
                                  passwordStrength === 'Good' ? 'text-lime-600' :
                                  passwordStrength === 'Fair' ? 'text-amber-600' : 'text-stone-400'
                                }`}>
                                  {passwordStrength || 'Weak'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Confirm Password */}
                          <div>
                            <label
                              htmlFor="confirmPassword"
                              className="block text-[11px] font-bold tracking-widest uppercase text-stone-500 mb-2"
                            >
                              Confirm password
                            </label>
                            <div className="relative">
                              <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                {...register('confirmPassword')}
                                placeholder="Type it once more"
                                className={`w-full bg-stone-50 border-2 rounded-2xl px-5 py-3 pr-12 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none transition-all ${
                                  errors.confirmPassword
                                    ? 'border-red-300 focus:border-red-500'
                                    : checks.matches
                                      ? 'border-emerald-300 focus:border-emerald-500'
                                      : 'border-stone-100 focus:border-sky-400'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {errors.confirmPassword ? (
                              <p className="text-[11px] text-red-500 mt-1.5 ml-1">
                                {errors.confirmPassword.message}
                              </p>
                            ) : checks.matches ? (
                              <p className="text-[11px] text-emerald-600 mt-1.5 ml-1 flex items-center gap-1 font-semibold">
                                <Check className="w-3 h-3" /> Passwords match
                              </p>
                            ) : null}
                          </div>

                          {/* Requirements checklist */}
                          {watchPassword && (
                            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5 space-y-1.5">
                              <p className="text-[10px] font-bold tracking-widest uppercase text-sky-700 mb-2">
                                Your password should
                              </p>
                              <RequirementRow met={checks.length} label="Be at least 6 characters" />
                              <RequirementRow met={checks.hasLetter} label="Include a letter" />
                              <RequirementRow met={checks.hasNumber} label="Include a number (recommended)" />
                              <RequirementRow met={checks.matches} label="Match in both fields" />
                            </div>
                          )}

                          {/* Submit — lime green CTA */}
                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Updating password…
                                </>
                              ) : (
                                <>
                                  Save New Password
                                  <span className="w-5 h-5 md:w-6 md:h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                                    →
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>

                        {/* Expired link help */}
                        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
                          <p className="text-sm text-stone-600">
                            Link not working?{' '}
                            <Link
                              to="/forgot-password"
                              className="text-sky-600 hover:text-sky-800 font-bold transition-colors"
                            >
                              Request a new one
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
                            <ShieldCheck className="w-7 h-7 text-stone-900" strokeWidth={2.5} />
                          </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-6">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600 uppercase mb-2">
                            · Password updated ·
                          </p>
                          <h2
                            className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900"
                            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                          >
                            You're all<br />
                            <span className="italic font-normal">set to go.</span>
                          </h2>
                        </div>

                        {/* Confirmation box */}
                        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4 mb-5 text-center">
                          <p className="text-sm text-emerald-900 leading-relaxed">
                            Your password has been safely updated.
                            <br />
                            You can now sign in with your new password.
                          </p>
                        </div>

                        {/* What happens next */}
                        <div className="space-y-3 mb-6">
                          <div className="flex gap-3">
                            <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                              1
                            </div>
                            <p className="text-sm text-stone-700 leading-relaxed">
                              Head to the sign in page.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                              2
                            </div>
                            <p className="text-sm text-stone-700 leading-relaxed">
                              Enter your email and your{' '}
                              <span className="font-semibold">new password</span>.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <div className="shrink-0 w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-600">
                              3
                            </div>
                            <p className="text-sm text-stone-700 leading-relaxed">
                              Get back to writing.
                            </p>
                          </div>
                        </div>

                        {/* Auto-redirect notice */}
                        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 mb-5 text-center">
                          <p className="text-[12px] text-sky-800">
                            Taking you to sign in in{' '}
                            <span className="font-bold">{countdown}s</span>…
                          </p>
                        </div>

                        {/* Go to sign in — primary lime CTA */}
                        <Link
                          to="/login"
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group"
                        >
                          Go to Sign In
                          <span className="w-5 h-5 md:w-6 md:h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                            →
                          </span>
                        </Link>
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

/* ─── Small checklist row component ─── */
const RequirementRow: React.FC<{ met: boolean; label: string }> = ({ met, label }) => (
  <div className="flex items-center gap-2">
    <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
      met ? 'bg-emerald-500' : 'bg-stone-200'
    }`}>
      {met ? (
        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
      ) : (
        <X className="w-2.5 h-2.5 text-stone-400" strokeWidth={3} />
      )}
    </div>
    <span className={`text-xs transition-colors ${
      met ? 'text-stone-900 font-semibold' : 'text-stone-500'
    }`}>
      {label}
    </span>
  </div>
);

/* ─── Invalid link fallback ─── */
const InvalidLinkState: React.FC = () => (
  <div className="min-h-screen bg-[#FAFAFA] text-stone-900 font-sans overflow-hidden">
    <section className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
            linear-gradient(to bottom, #7DD3FC, #38BDF8, #0EA5E9)
          `,
        }}
      />
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <div className="absolute top-40 right-20 w-96 h-40 bg-white/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-36 bg-white/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
          style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <X className="w-7 h-7 text-amber-600" strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-amber-600 uppercase mb-2">
            · Invalid link ·
          </p>
          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 mb-3"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            This reset link<br />
            <span className="italic font-normal">isn't valid.</span>
          </h2>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            The link might be broken, expired, or already used.
            Please request a new one and try again.
          </p>
          <Link
            to="/forgot-password"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group"
          >
            Request New Link
            <span className="w-5 h-5 md:w-6 md:h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  </div>
);