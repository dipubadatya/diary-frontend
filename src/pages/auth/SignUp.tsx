import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import DiaryLogo from "../../components/DiaryLogo";

/* ------------------------------------------------------------------ */
/* Validation Schema                                                   */
/* ------------------------------------------------------------------ */
const signUpSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z
    .string()
    .min(1, "Please enter your email")
    .email("That doesn't look like a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

/* ------------------------------------------------------------------ */
/* Motion Presets — reused for consistency                             */
/* ------------------------------------------------------------------ */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const fieldErrorMotion = {
  initial: { opacity: 0, height: 0, y: -4 },
  animate: { opacity: 1, height: "auto", y: 0 },
  exit: { opacity: 0, height: 0, y: -4 },
  transition: { duration: 0.2, ease: EASE_OUT },
};

const cardMotion = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.28, ease: EASE_OUT },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // --- UI state ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Feedback state ---
  const [apiError, setApiError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // --- Refs ---
  const errorRef = useRef<HTMLDivElement>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  /* ---------------------------------------------------------------- */
  /* Side Effects                                                     */
  /* ---------------------------------------------------------------- */

  // Countdown for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Auto-dismiss transient resend feedback
  useEffect(() => {
    if (!resendMessage) return;
    const timer = setTimeout(() => setResendMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [resendMessage]);

  // Scroll the API error into view when it appears
  useEffect(() => {
    if (apiError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [apiError]);

  /* ---------------------------------------------------------------- */
  /* Error Parsing                                                    */
  /* ---------------------------------------------------------------- */
  const parseError = useCallback(
    (err: any, context: "signup" | "google" | "resend" = "signup"): string => {
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

      if (context === "signup") {
        if (lower.includes("email") && lower.includes("exists")) {
          return "An account with this email already exists.";
        }
        if (lower.includes("username") && lower.includes("taken")) {
          return "This username is already taken.";
        }
      }

      if (context === "google") {
        if (lower.includes("cancel")) return "Google sign-up was cancelled.";
        return serverMsg || "Google sign-up didn't work. Please try again.";
      }

      return serverMsg || "Something unexpected happened. Please try again.";
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /* Google Identity Services                                         */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const SRC = "https://accounts.google.com/gsi/client";

    // Handles the credential returned by Google
    const handleCredential = async (response: any) => {
      if (!response?.credential) return;
      setGoogleLoading(true);
      setApiError(null);
      try {
        const res = await api.post("/auth/google", {
          idToken: response.credential,
        });
        if (res.data.success) {
          login(res.data.user);
          navigate("/stories");
        }
      } catch (err: any) {
        setApiError(parseError(err, "google"));
      } finally {
        setGoogleLoading(false);
      }
    };

    // Renders the invisible GSI button that overlays our custom UI
    const renderButton = () => {
      const google = (window as any).google;
      if (!google || !googleBtnRef.current) return;

      try {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredential,
          ux_mode: "popup",
          auto_select: false,
          itp_support: true,
        });

        googleBtnRef.current.innerHTML = "";
        google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: googleBtnRef.current.offsetWidth || 380,
        });

        setGoogleReady(true);
      } catch (e) {
        console.error("Google integration error:", e);
      }
    };

    // Load SDK once, then render
    const existingScript = document.querySelector(`script[src="${SRC}"]`);
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = SRC;
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.body.appendChild(script);
    } else {
      renderButton();
    }

    // Re-render on resize so the invisible button always matches width
    const handleResize = () => {
      if ((window as any).google?.accounts?.id) renderButton();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [login, navigate, parseError]);

  /* ---------------------------------------------------------------- */
  /* Form                                                             */
  /* ---------------------------------------------------------------- */
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
  });

  const watchPassword = watch("password", "");
  const passwordStrength =
    watchPassword.length >= 10
      ? "Strong"
      : watchPassword.length >= 8
        ? "Good"
        : watchPassword.length >= 4
          ? "Fair"
          : "";

  // Clear API error while the user is editing
  const nameValue = watch("name");
  const usernameValue = watch("username");
  const emailValue = watch("email");
  const passwordValue = watch("password");
  useEffect(() => {
    if (apiError) setApiError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameValue, usernameValue, emailValue, passwordValue]);

  /* ---------------------------------------------------------------- */
  /* Handlers                                                         */
  /* ---------------------------------------------------------------- */
  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true);
      setUnverifiedEmail(null);
      setApiError(null);

      await api.post("/auth/signup", data);

      sessionStorage.setItem("pending_verification_email", data.email);
      navigate("/verify-email", { state: { email: data.email } });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "";
      if (message.toLowerCase().includes("not verified")) {
        setUnverifiedEmail(data.email);
      } else {
        setApiError(parseError(err, "signup"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail || cooldown > 0) return;
    try {
      setResending(true);
      setResendMessage(null);
      const res = await api.post("/auth/resend-verification", {
        email: unverifiedEmail,
      });
      setResendMessage({
        type: "success",
        text: res.data?.message || "Sent! Check your inbox in a few seconds.",
      });
      setCooldown(60);
    } catch (err: any) {
      setResendMessage({ type: "error", text: parseError(err, "resend") });
    } finally {
      setResending(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Small local helpers                                              */
  /* ---------------------------------------------------------------- */
  const inputBase =
    "w-full bg-white border-2 rounded-lg py-3.5 text-stone-900 text-[15px] placeholder:text-stone-400 focus:outline-none transition-colors duration-200";
  const inputOk = "border-transparent focus:border-sky-400";
  const inputErr = "border-red-400 focus:border-red-500";
  const iconBase =
    "absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200";

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-stone-900 selection:text-white flex flex-col">
      {/* Sky background */}
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

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-6 md:px-12 md:py-8">
        <DiaryLogo />
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="w-full max-w-[400px] sm:max-w-[440px]"
        >
          {/* Heading */}
          <div className="mb-7 text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              Create Account
            </h1>
            <p className="text-white/85 text-sm md:text-base">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-white font-semibold hover:underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Google button (custom UI + invisible GSI overlay) */}
          <div className="mb-6">
            <div className="relative w-full h-[52px] rounded-lg overflow-hidden bg-white/95 hover:bg-white border border-white/20 hover:border-sky-300 focus-within:border-sky-400 transition-colors duration-200 flex items-center justify-center shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] select-none active:scale-[0.99] group">
              {/* Visual layer */}
              <div className="flex items-center justify-center gap-3 w-full h-full pointer-events-none">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-stone-700 font-bold text-[15px] tracking-tight">
                  Sign up with Google
                </span>
              </div>

              {/* Invisible clickable Google button */}
              <div
                ref={googleBtnRef}
                className={`absolute inset-0 w-full h-full opacity-[0.01] z-10 scale-y-[1.4] scale-x-[1.05] cursor-pointer origin-center ${
                  googleReady ? "block" : "hidden"
                }`}
                aria-label="Sign up with Google"
              />

              {/* Initial load overlay */}
              {!googleReady && (
                <div className="absolute inset-0 bg-white/95 flex items-center justify-center gap-2 z-20">
                  <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                  <span className="text-sm font-semibold text-stone-500">
                    Connecting to Google...
                  </span>
                </div>
              )}

              {/* Post-click auth overlay */}
              {googleLoading && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center gap-2.5 z-30">
                  <Loader2 className="w-5 h-5 animate-spin text-stone-700" />
                  <span className="text-[14px] font-bold text-stone-700">
                    Creating your account...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider whitespace-nowrap">
              Or register with email
            </span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          {/* API error banner */}
          <AnimatePresence mode="wait">
            {apiError && (
              <motion.div
                ref={errorRef}
                key="api-error"
                {...cardMotion}
                className="mb-5"
                role="alert"
                aria-live="polite"
              >
                <div className="relative bg-rose-50/95 backdrop-blur-md border border-rose-100/80 rounded-xl px-4 py-3.5 flex items-start gap-3 shadow-[0_10px_30px_rgba(244,63,94,0.15)] overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                  <div className="flex-shrink-0 mt-0.5 bg-rose-100 p-1 rounded-lg">
                    <AlertCircle
                      className="w-4 h-4 text-rose-600"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <h5 className="text-[13px] font-bold text-rose-950 mb-0.5">
                      Registration Error
                    </h5>
                    <p className="text-[12.5px] text-rose-800 font-medium leading-relaxed">
                      {apiError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApiError(null)}
                    className="flex-shrink-0 p-1 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100/50 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unverified email card */}
          <AnimatePresence>
            {unverifiedEmail && (
              <motion.div {...cardMotion} className="mb-5">
                <div className="relative bg-amber-50/95 backdrop-blur-md border border-amber-100/80 rounded-xl p-4 shadow-[0_12px_30px_rgba(217,119,6,0.15)]">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                  <div className="flex items-start gap-3.5">
                    <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                      <Mail
                        className="w-4 h-4 text-amber-700"
                        strokeWidth={2}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13.5px] font-bold text-amber-950 mb-1 leading-snug">
                        Please verify your email
                      </h4>
                      <p className="text-[12.5px] text-amber-900 leading-relaxed font-medium mb-3">
                        We sent an activation link to{" "}
                        <span className="font-bold text-amber-950 underline decoration-amber-500/50 break-all">
                          {unverifiedEmail}
                        </span>
                        .
                      </p>

                      <div className="flex items-center gap-3.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resending || cooldown > 0}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200/80 disabled:text-stone-500 text-white text-[12px] font-bold rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
                        >
                          {resending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : cooldown > 0 ? (
                            <span>Resend in {cooldown}s</span>
                          ) : (
                            <span>Resend link</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnverifiedEmail(null)}
                          className="text-[12px] font-bold text-amber-800 hover:text-amber-950 px-2 py-1.5 rounded-lg hover:bg-amber-100/50 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>

                      {/* Resend feedback */}
                      <AnimatePresence mode="wait">
                        {resendMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            transition={{ duration: 0.22, ease: EASE_OUT }}
                            className="overflow-hidden"
                          >
                            <div
                              className={`mt-3 flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 py-1.5 rounded-lg border ${
                                resendMessage.type === "success"
                                  ? "text-emerald-800 bg-emerald-100/50 border-emerald-100"
                                  : "text-rose-800 bg-rose-100/50 border-rose-100"
                              }`}
                            >
                              {resendMessage.type === "success" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                              <span className="leading-tight">
                                {resendMessage.text}
                              </span>
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

          {/* Sign-up form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Name */}
            <div>
              <div className="relative group">
                <User
                  className={`${iconBase} ${
                    errors.name
                      ? "text-red-400"
                      : "text-stone-400 group-focus-within:text-sky-500"
                  }`}
                  style={{ width: 18, height: 18 }}
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Full name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  {...register("name")}
                  className={`${inputBase} pl-11 pr-4 ${errors.name ? inputErr : inputOk}`}
                />
              </div>
              <AnimatePresence>
                {errors.name && (
                  <motion.div
                    id="name-error"
                    {...fieldErrorMotion}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 mt-2 pl-1.5">
                      <div className="w-1 h-1 rounded-full bg-white shrink-0" />
                      <p className="text-[12.5px] text-white font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                        {errors.name.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Username */}
            <div>
              <div className="relative group">
                <AtSign
                  className={`${iconBase} ${
                    errors.username
                      ? "text-red-400"
                      : "text-stone-400 group-focus-within:text-sky-500"
                  }`}
                  style={{ width: 18, height: 18 }}
                />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Username"
                  aria-invalid={!!errors.username}
                  aria-describedby={
                    errors.username ? "username-error" : undefined
                  }
                  {...register("username")}
                  className={`${inputBase} pl-11 pr-4 ${errors.username ? inputErr : inputOk}`}
                />
              </div>
              <AnimatePresence>
                {errors.username && (
                  <motion.div
                    id="username-error"
                    {...fieldErrorMotion}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 mt-2 pl-1.5">
                      <div className="w-1 h-1 rounded-full bg-white shrink-0" />
                      <p className="text-[12.5px] text-white font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                        {errors.username.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Email */}
            <div>
              <div className="relative group">
                <Mail
                  className={`${iconBase} ${
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
                  placeholder="Email address"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                  className={`${inputBase} pl-11 pr-4 ${errors.email ? inputErr : inputOk}`}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.div
                    id="email-error"
                    {...fieldErrorMotion}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 mt-2 pl-1.5">
                      <div className="w-1 h-1 rounded-full bg-white shrink-0" />
                      <p className="text-[12.5px] text-white font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                        {errors.email.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <div className="relative group">
                <Lock
                  className={`${iconBase} ${
                    errors.password
                      ? "text-red-400"
                      : "text-stone-400 group-focus-within:text-sky-500"
                  }`}
                  style={{ width: 18, height: 18 }}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...register("password")}
                  className={`${inputBase} pl-11 pr-11 ${errors.password ? inputErr : inputOk}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Password strength meter */}
              {watchPassword && !errors.password && (
                <div className="mt-2.5 px-1.5 flex items-center gap-3">
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ease-out ${
                        passwordStrength === "Strong"
                          ? "w-full bg-[#C6F547]"
                          : passwordStrength === "Good"
                            ? "w-2/3 bg-amber-400"
                            : passwordStrength === "Fair"
                              ? "w-1/3 bg-red-400"
                              : "w-0"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                      passwordStrength === "Strong"
                        ? "text-[#C6F547]"
                        : passwordStrength === "Good"
                          ? "text-amber-300"
                          : passwordStrength === "Fair"
                            ? "text-red-300"
                            : "text-white/40"
                    }`}
                  >
                    {passwordStrength || "Weak"}
                  </span>
                </div>
              )}

              <AnimatePresence>
                {errors.password && (
                  <motion.div
                    id="password-error"
                    {...fieldErrorMotion}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 mt-2 pl-1.5">
                      <div className="w-1 h-1 rounded-full bg-white shrink-0" />
                      <p className="text-[12.5px] text-white font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                        {errors.password.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 mt-2 bg-[#C6F547] text-stone-900 rounded-lg font-bold text-[15px] tracking-wide hover:bg-[#b5e236] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-[#C6F547] flex items-center justify-center gap-2 shadow-lg shadow-black/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
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