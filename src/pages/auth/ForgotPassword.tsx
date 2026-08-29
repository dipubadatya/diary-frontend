
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  ArrowLeft,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import api from "../../services/api";
import DiaryLogo from "../../components/DiaryLogo";

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter your email")
    .email("That doesn't look like a valid email"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const ForgotPassword: React.FC = () => {
  // Form flow state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Feedback state
  const [apiError, setApiError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const errorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
  });

  const emailValue = watch("email");

  // Countdown for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Auto-hide resend feedback after 5s
  useEffect(() => {
    if (!resendMessage) return;
    const timer = setTimeout(() => setResendMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [resendMessage]);

  // Bring error banner into view on mobile
  useEffect(() => {
    if (apiError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [apiError]);

  // Clear the banner as soon as the user edits their email
  useEffect(() => {
    if (apiError) setApiError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailValue]);

  // Turn any error (network, 4xx, 5xx) into a friendly message
  const parseError = (
    err: any,
    context: "forgot" | "resend" = "forgot",
  ): string => {
    if (!navigator.onLine) {
      return "You appear to be offline. Check your internet connection.";
    }

    if (
      err?.code === "ERR_NETWORK" ||
      err?.message?.toLowerCase().includes("network")
    ) {
      return "Can't reach our servers right now. Please try again in a moment.";
    }

    const status = err?.response?.status;
    const serverMsg = err?.response?.data?.message || err?.message || "";
    const lower = serverMsg.toLowerCase();

    if (status === 429) {
      return "Too many attempts. Please wait a minute before trying again.";
    }
    if (status && status >= 500) {
      return "Our servers are having a moment. Please try again shortly.";
    }

    if (context === "forgot") {
      const notFound =
        status === 404 ||
        lower.includes("not found") ||
        lower.includes("no user");

      if (notFound) return "We couldn't find an account with that email.";
    }

    return serverMsg || "Something unexpected happened. Please try again.";
  };

  // ─── Handlers ───

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      await api.post("/auth/forgot-password", data);

      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      setCooldown(30);
    } catch (err) {
      setApiError(parseError(err, "forgot"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !submittedEmail) return;

    try {
      setIsSubmitting(true);
      setResendMessage(null);

      const res = await api.post("/auth/forgot-password", {
        email: submittedEmail,
      });

      setResendMessage({
        type: "success",
        text:
          res.data?.message ||
          "Another reset link has been sent to your inbox.",
      });
      setCooldown(30);
    } catch (err) {
      setResendMessage({ type: "error", text: parseError(err, "resend") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryDifferentEmail = () => {
    setIsSubmitted(false);
    setSubmittedEmail("");
    setCooldown(0);
    setApiError(null);
    setResendMessage(null);
    reset();
  };

  // ─── Render ───

  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-stone-900 selection:text-white flex flex-col">
      {/* Sky-blue background with soft light spots */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.5) 0%, transparent 60%),
            linear-gradient(to bottom, #7DD3FC, #38BDF8, #0EA5E9)
          `,
        }}
      />

      <header className="relative z-10 w-full px-6 py-6 md:px-12 md:py-8">
        <DiaryLogo />
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px] sm:max-w-[440px]"
        >
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              // ═══════════════════════════════════════════
              // Form state — ask for email
              // ═══════════════════════════════════════════
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Heading */}
                <div className="mb-7 text-left">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                    Reset Password
                  </h1>
                  <p className="text-white/85 text-sm md:text-base">
                    Remembered?{" "}
                    <Link
                      to="/login"
                      className="text-white font-semibold underline underline-offset-2"
                    >
                      Back to sign in
                    </Link>
                  </p>
                </div>

                {/* Server error banner */}
                <AnimatePresence initial={false} mode="wait">
                  {apiError && (
                    <motion.div
                      ref={errorRef}
                      key="api-error"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="mb-4"
                      role="alert"
                      aria-live="polite"
                    >
                      <div className="relative bg-white rounded-lg px-4 py-3 flex items-start gap-3 shadow-lg shadow-red-900/10 border border-red-100">
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
                          className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          aria-label="Dismiss error"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                  noValidate
                >
                  {/* Email field */}
                  <div>
                    <div className="relative group">
                      <Mail
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                          errors.email
                            ? "text-red-400"
                            : "text-stone-400 group-focus-within:text-sky-500"
                        }`}
                        style={{ width: 18, height: 18 }}
                      />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Your email address"
                        aria-invalid={!!errors.email}
                        aria-describedby={
                          errors.email ? "email-error" : undefined
                        }
                        {...register("email")}
                        className={`w-full bg-white border-2 rounded-md pl-11 pr-4 py-3.5 text-stone-900 text-[15px] placeholder:text-stone-400 focus:outline-none transition-all ${
                          errors.email
                            ? "border-red-400 focus:border-red-500"
                            : "border-transparent focus:border-sky-400"
                        }`}
                      />
                    </div>

                    {/* Either show validation error, or the helper hint */}
                    <AnimatePresence initial={false}>
                      {errors.email ? (
                        <motion.div
                          id="email-error"
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-1.5 mt-2 pl-1">
                            <div className="w-1 h-1 rounded-full bg-white shrink-0" />
                            <p className="text-[12.5px] text-white font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                              {errors.email.message}
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <p className="text-[12px] text-white mt-2 pl-1 font-medium">
                          Enter your email and we'll send you a link to reset
                          your password.
                        </p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 mt-2 bg-[#C6F547] text-stone-900 rounded-md font-bold text-[15px] hover:bg-[#b5e236] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-[#C6F547] flex items-center justify-center gap-2 shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending reset link...</span>
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              // ═══════════════════════════════════════════
              // Success state — link sent
              // ═══════════════════════════════════════════
              <motion.div
                key="forgot-success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Heading */}
                <div className="mb-7 text-left">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                    Check Your Inbox
                  </h1>
                  <button
                    onClick={handleTryDifferentEmail}
                    className="text-white font-semibold hover:underline underline-offset-2 text-sm md:text-base flex items-center gap-1"
                  >
                    <ArrowLeft size={16} /> Use a different email
                  </button>
                </div>

                {/* Success card */}
                <div className="relative bg-white rounded-lg p-5 shadow-lg border border-emerald-100">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-lg" />

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Mail
                        className="w-4 h-4 text-emerald-600"
                        strokeWidth={2.5}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14.5px] font-bold text-stone-900 mb-1">
                        Reset link successfully sent
                      </h4>
                      <p className="text-[13px] text-stone-600 leading-relaxed mb-4">
                        We sent a secure password reset link to{" "}
                        <span className="font-semibold text-stone-800 break-all">
                          {submittedEmail}
                        </span>
                        . Please check your inbox and click on the link to
                        proceed.
                      </p>

                      {/* Small tips */}
                      <div className="space-y-2.5 mb-4 text-[12.5px] text-stone-500 leading-normal">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-emerald-600">•</span>
                          <span>The link expires in 30 minutes.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-emerald-600">•</span>
                          <span>
                            Check your Spam or Promotions folder if it doesn't
                            arrive soon.
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 flex-wrap border-t border-stone-100 pt-4">
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={isSubmitting || cooldown > 0}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold rounded-md transition-colors disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Resending...
                            </>
                          ) : cooldown > 0 ? (
                            `Resend in ${cooldown}s`
                          ) : (
                            "Resend link"
                          )}
                        </button>

                        <Link
                          to="/login"
                          className="text-[12px] font-semibold text-stone-500 hover:text-stone-800 transition-colors"
                        >
                          Back to Sign In
                        </Link>
                      </div>

                      {/* Resend feedback */}
                      <AnimatePresence initial={false}>
                        {resendMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div
                              className={`mt-3 flex items-center gap-1.5 text-[12px] font-semibold ${
                                resendMessage.type === "success"
                                  ? "text-emerald-700"
                                  : "text-red-600"
                              }`}
                            >
                              {resendMessage.type === "success" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span>{resendMessage.text}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer support link */}
          <div className="mt-8 text-left">
            <p className="text-[12px] text-white/70">
              Need help?{" "}
              <a
                href="mailto:diaryteam.official@gmail.com"
                className="text-white font-medium underline underline-offset-2 hover:text-white/90 transition-colors"
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