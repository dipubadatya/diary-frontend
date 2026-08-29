import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  Check,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import DiaryLogo from "../../components/DiaryLogo";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Your passwords don't match",
    path: ["confirmPassword"],
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

  const [apiError, setApiError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSuccess) return;
    if (countdown <= 0) {
      navigate("/login");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  useEffect(() => {
    if (apiError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [apiError]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
  });

  const watchPassword = watch("password", "");
  const watchConfirmPassword = watch("confirmPassword", "");

  const checks = {
    length: watchPassword.length >= 8,
    matches: watchPassword.length > 0 && watchPassword === watchConfirmPassword,
  };

  const passwordStrength =
    watchPassword.length >= 10 && checks.matches
      ? "Strong"
      : watchPassword.length >= 8
        ? "Good"
        : watchPassword.length >= 1
          ? "Weak"
          : "";

  useEffect(() => {
    if (apiError) setApiError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPassword, watchConfirmPassword]);

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
      setApiError(
        err?.response?.data?.message ||
          err?.message ||
          "We had trouble saving your password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative font-sans selection:bg-stone-900 selection:text-white flex flex-col overflow-x-hidden">
      {/* Fixed background layer */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.5) 0%, transparent 60%),
            linear-gradient(to bottom, #7DD3FC, #38BDF8, #0EA5E9)
          `,
        }}
      />

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-5 md:px-12 md:py-6 shrink-0">
        <DiaryLogo />
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="reset-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Heading */}
                <div className="mb-6 text-left">
                  <h1 className="text-3xl md:text-[34px] font-bold text-white mb-1.5 tracking-tight leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
                    Reset Password
                  </h1>
                  <p className="text-white/90 text-sm md:text-[15px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    Need help?{" "}
                    <Link
                      to="/forgot-password"
                      className="text-white font-bold underline underline-offset-2 hover:text-white/95"
                    >
                      Request new link
                    </Link>
                  </p>
                </div>

                {/* API Error Box */}
                <AnimatePresence initial={false} mode="wait">
                  {apiError && (
                    <motion.div
                      ref={errorRef}
                      key="api-error"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4"
                      role="alert"
                      aria-live="polite"
                    >
                      <div className="relative bg-white rounded-lg pl-5 pr-3 py-3 flex items-start gap-3 shadow-lg border border-red-100">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg" />
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                            <AlertCircle
                              className="w-3 h-3 text-white"
                              strokeWidth={2.5}
                            />
                          </div>
                        </div>
                        <p className="flex-1 text-[13.5px] text-stone-800 font-medium leading-relaxed pt-0.5">
                          {apiError}
                        </p>
                        <button
                          type="button"
                          onClick={() => setApiError(null)}
                          className="flex-shrink-0 p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          aria-label="Dismiss error"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-3.5"
                  noValidate
                >
                  {/* Password Input */}
                  <div>
                    <div className="relative group">
                      <Lock
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                          errors.password
                            ? "text-red-400"
                            : "text-stone-400 group-focus-within:text-sky-500"
                        }`}
                        style={{ width: 18, height: 18 }}
                      />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoFocus
                        autoComplete="new-password"
                        placeholder="Choose a password"
                        aria-invalid={!!errors.password}
                        {...register("password")}
                        className={`w-full bg-white border-2 rounded-md pl-11 pr-11 py-3.5 text-stone-900 text-[15px] placeholder:text-stone-400 focus:outline-none transition-all shadow-sm ${
                          errors.password
                            ? "border-red-400 focus:border-red-500"
                            : "border-transparent focus:border-sky-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {watchPassword && !errors.password && (
                      <div className="mt-2.5 px-1 flex items-center  justify-between gap-3">
                        <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all  duration-300 rounded-full ${
                              passwordStrength === "Strong"
                                ? "w-full bg-[#C6F547]"
                                : passwordStrength === "Good"
                                  ? "w-2/3 bg-[#E3FF3B]"
                                  : passwordStrength === "Weak"
                                    ? "w-1/3 bg-red-400"
                                    : "w-0"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-sm shadow-sm ${
                            passwordStrength === "Strong"
                              ? "text-[#C6F547]"
                              : passwordStrength === "Good"
                                ? "text-amber-300"
                                : passwordStrength === "Weak"
                                  ? "text-red-400"
                                  : "text-white/40"
                          }`}
                        >
                          {passwordStrength || "Too Weak"}
                        </span>
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {errors.password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-1.5 mt-2 pl-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 shadow" />
                            <p className="text-[12.5px] text-white font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.3)]">
                              {errors.password.message}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <div className="relative group">
                      <Lock
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                          errors.confirmPassword
                            ? "text-red-400"
                            : checks.matches
                              ? "text-emerald-500"
                              : "text-stone-400 group-focus-within:text-sky-500"
                        }`}
                        style={{ width: 18, height: 18 }}
                      />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Confirm password"
                        aria-invalid={!!errors.confirmPassword}
                        {...register("confirmPassword")}
                        className={`w-full bg-white border-2 rounded-md pl-11 pr-11 py-3.5 text-stone-900 text-[15px] placeholder:text-stone-400 focus:outline-none transition-all shadow-sm ${
                          errors.confirmPassword
                            ? "border-red-400 focus:border-red-500"
                            : checks.matches
                              ? "border-emerald-400 focus:border-emerald-500"
                              : "border-transparent focus:border-sky-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {errors.confirmPassword ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-1.5 mt-2 pl-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 shadow" />
                            <p className="text-[12.5px] text-white font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.3)]">
                              {errors.confirmPassword.message}
                            </p>
                          </div>
                        </motion.div>
                      ) : checks.matches ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-[12.5px] text-white mt-2 pl-1 flex items-center gap-1.5 font-bold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.35)]">
                            <Check className="w-4 h-4 stroke-[3]" /> Passwords match
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  {/* High Contrast Password Checklist */}
                  <AnimatePresence initial={false}>
                    {watchPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-stone-900/90 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/10 space-y-3 mt-1">
                          <p className="text-[11px] font-extrabold tracking-widest uppercase text-white/40 mb-1">
                            Password Requirements:
                          </p>
                          <div className="flex items-center gap-3">
                            <div
                              className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                                checks.length
                                  ? "bg-[#C6F547] text-stone-900 shadow-lg shadow-[#C6F547]/20"
                                  : "bg-white/10 text-white/30"
                              }`}
                            >
                              {checks.length ? (
                                <Check className="w-3 h-3 stroke-[3]" />
                              ) : (
                                <X className="w-3 h-3 stroke-[2.5]" />
                              )}
                            </div>
                            <span
                              className={`text-[13px] transition-colors duration-300 ${
                                checks.length ? "text-[#C6F547] font-semibold" : "text-white/60"
                              }`}
                            >
                              Be at least 8 characters long
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                                checks.matches
                                  ? "bg-[#C6F547] text-stone-900 shadow-lg shadow-[#C6F547]/20"
                                  : "bg-white/10 text-white/30"
                              }`}
                            >
                              {checks.matches ? (
                                <Check className="w-3 h-3 stroke-[3]" />
                              ) : (
                                <X className="w-3 h-3 stroke-[2.5]" />
                              )}
                            </div>
                            <span
                              className={`text-[13px] transition-colors duration-300 ${
                                checks.matches ? "text-[#C6F547] font-semibold" : "text-white/60"
                              }`}
                            >
                              Passwords match in both fields
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 mt-1 bg-[#C6F547] text-stone-900 rounded-md font-bold text-[15px] hover:bg-[#b5e236] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-[#C6F547] flex items-center justify-center gap-2 shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Updating password...</span>
                      </>
                    ) : (
                      "Save New Password"
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              /* Success State */
              <motion.div
                key="reset-success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6 text-left">
                  <h1 className="text-3xl md:text-[34px] font-bold text-white mb-1.5 tracking-tight leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
                    Reset Complete
                  </h1>
                  <p className="text-white/85 text-sm md:text-[15px]">
                    Redirecting you in a few seconds...
                  </p>
                </div>

                <div className="relative bg-white rounded-lg p-5 shadow-lg border border-emerald-100">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-lg" />
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-200">
                      <ShieldCheck
                        className="w-4 h-4 text-emerald-600"
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14.5px] font-bold text-stone-900 mb-1">
                        Success! Password updated
                      </h4>
                      <p className="text-[13px] text-stone-600 leading-relaxed mb-4">
                        Your password has been successfully updated. You can now
                        log in securely with your new password.
                      </p>
                      <div className="bg-sky-50 border border-sky-100 rounded-md p-3 mb-4 text-center">
                        <p className="text-[12.5px] text-sky-800 font-medium">
                          Auto-redirecting to Sign In page in{" "}
                          <span className="font-bold">{countdown}s</span>...
                        </p>
                      </div>
                      <Link
                        to="/login"
                        className="w-full py-3.5 bg-[#C6F547] text-stone-900 rounded-md font-bold text-[14px] hover:bg-[#b5e236] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        Go to Sign In{" "}
                        <ArrowLeft size={16} className="rotate-180" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-left">
            <p className="text-[12px] text-white/80 font-medium">
              Need help?{" "}
              <a
                href="mailto:diaryteam.official@gmail.com"
                className="text-white font-bold underline underline-offset-2 hover:text-white/90 transition-colors"
              >
                Contact us
              </a>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

/* ─── Backup Checklist Component ─── */
const RequirementRow: React.FC<{ met: boolean; label: string }> = ({
  met,
  label,
}) => (
  <div className="flex items-center gap-2">
    <div
      className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
        met ? "bg-[#C6F547]" : "bg-white/10"
      }`}
    >
      {met ? (
        <Check className="w-2.5 h-2.5 text-stone-900" strokeWidth={4} />
      ) : (
        <X className="w-2.5 h-2.5 text-white/40" strokeWidth={3} />
      )}
    </div>
    <span
      className={`text-[12px] transition-colors ${
        met ? "text-[#C6F547] font-semibold" : "text-white/70"
      }`}
    >
      {label}
    </span>
  </div>
);

/* ─── Invalid Token Card ─── */
const InvalidLinkState: React.FC = () => (
  <div className="min-h-screen relative font-sans selection:bg-stone-900 selection:text-white flex flex-col">
    <div
      className="fixed inset-0 z-0"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
          linear-gradient(to bottom, #7DD3FC, #38BDF8, #0EA5E9)
        `,
      }}
    />
    <header className="relative z-10 w-full px-6 py-5 md:px-12 md:py-6 shrink-0">
      <DiaryLogo />
    </header>
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6">
      <div className="w-full max-w-[420px]">
        <div className="relative bg-white rounded-lg p-5 shadow-lg border border-amber-100 text-left">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-lg" />
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-200">
              <X className="w-4 h-4 text-amber-600" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[14.5px] font-bold text-stone-900 mb-1">
                Invalid Reset Token
              </h4>
              <p className="text-[13px] text-stone-600 leading-relaxed mb-4">
                This secure reset link has expired, is broken, or has already
                been used to change your password.
              </p>
              <Link
                to="/forgot-password"
                className="w-full py-3.5 bg-[#C6F547] text-stone-900 rounded-md font-bold text-[14px] hover:bg-[#b5e236] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);