import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import DiaryLogo from "../components/DiaryLogo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // New states for UI messages
  const [apiError, setApiError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const src = "https://accounts.google.com/gsi/client";
    const handleScriptLoad = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (response && response.credential) {
              setIsSubmitting(true);
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
                setApiError(err.message || "Google login failed.");
              } finally {
                setIsSubmitting(false);
              }
            }
          },
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          {
            theme: "outline",
            size: "large",
            shape: "pill",
            text: "continue_with",
            width: 320,
          },
        );
      }
    };

    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = handleScriptLoad;
      document.body.appendChild(script);
    } else {
      handleScriptLoad();
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setUnverifiedEmail(null);
      setApiError(null);

      const res = await api.post("/auth/login", data);
      if (res.data.success) {
        login(res.data.user);
        navigate("/stories");
      }
    } catch (err: any) {
      if (err.message && err.message.includes("not verified")) {
        setUnverifiedEmail(data.email);
        setApiError("Please verify your email to continue.");
      } else {
        setApiError(err.message || "Login failed. Please check your details.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    try {
      setResending(true);
      setResendMessage(null);
      const res = await api.post("/auth/resend-verification", {
        email: unverifiedEmail,
      });
      setResendMessage({
        type: "success",
        text: res.data.message || "Verification link sent.",
      });
    } catch (err: any) {
      setResendMessage({
        type: "error",
        text: err.message || "Unable to send link at this time.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 font-sans selection:bg-stone-900 selection:text-white overflow-hidden">
      {/* ═══════════ SKY HERO SECTION ═══════════ */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Sky Background — matches landing */}
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
              to="/signup"
              className="inline-flex items-center px-4 md:px-6 py-2 md:py-2.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all"
            >
              Sign Up
            </Link>
          </nav>

          {/* ─── Main content ─── */}
          <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-10 py-8 md:py-12">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* ─── Left: Welcome copy ─── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center lg:text-left"
              >
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  Welcome
                  <br />
                  <span className="italic font-normal">back to Diary</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-sm md:text-base text-white/90 max-w-md mx-auto lg:mx-0 mb-6 md:mb-8 leading-relaxed"
                >
                  Sign in to pick up where you left off — your stories, your
                  thoughts, and the writing you've been meaning to come back to.
                </motion.p>

                {/* Rating strip — matches landing style */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="hidden md:flex flex-col items-center lg:items-start gap-1"
                >
                  <p className="text-[11px] md:text-xs text-white/80 font-medium tracking-wide uppercase">
                    Write · Share · Read · Connect
                  </p>
                </motion.div>
              </motion.div>

              {/* ─── Right: Login card ─── */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
              >
                <div
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl"
                  style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
                >
                  {/* Card header */}
                  <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-2">
                      · Sign in ·
                    </p>
                    <h2
                      className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Good to see
                      <br />
                      <span className="italic font-normal">you again.</span>
                    </h2>
                  </div>

                  {/* UI Error Message Display */}
                  {apiError && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-[13px] text-red-600 font-medium leading-relaxed">
                        {apiError}
                      </p>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[11px] font-bold tracking-widest uppercase text-stone-500 mb-2"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                        placeholder="you@example.com"
                        className={`w-full bg-stone-50 border-2 rounded-2xl px-5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none transition-all ${
                          errors.email
                            ? "border-red-300 focus:border-red-500"
                            : "border-stone-100 focus:border-sky-400"
                        }`}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-red-500 mt-1.5 ml-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label
                          htmlFor="password"
                          className="text-[11px] font-bold tracking-widest uppercase text-stone-500"
                        >
                          Password
                        </label>
                        <Link
                          to="/forgot-password"
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-800 transition-colors"
                        >
                          Forgot?
                        </Link>
                      </div>
                      <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        {...register("password")}
                        placeholder="••••••••"
                        className={`w-full bg-stone-50 border-2 rounded-2xl px-5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none transition-all ${
                          errors.password
                            ? "border-red-300 focus:border-red-500"
                            : "border-stone-100 focus:border-sky-400"
                        }`}
                      />
                      {errors.password && (
                        <p className="text-[11px] text-red-500 mt-1.5 ml-1">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Unverified email Block */}
                    {unverifiedEmail && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <p className="text-xs text-amber-800 font-medium mb-1.5">
                          It looks like your email is not verified yet.
                        </p>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resending}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition-colors"
                        >
                          {resending && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                          Resend verification link →
                        </button>

                        {/* Inline Resend Status Message */}
                        {resendMessage && (
                          <p
                            className={`text-[11px] mt-2 font-semibold ${resendMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
                          >
                            {resendMessage.text}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submit — lime green CTA matching landing */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C6F547] text-stone-900 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase hover:bg-[#b5e236] transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Sign In
                            <span className="w-5 h-5 md:w-6 md:h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform">
                              →
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-stone-100"></div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                      Or
                    </span>
                    <div className="flex-1 h-px bg-stone-100"></div>
                  </div>

                  {/* Google button */}
                  <div className="w-full flex justify-center">
                    <div
                      id="google-signin-btn"
                      className="w-full flex justify-center"
                    ></div>
                  </div>

                  {/* Sign up prompt */}
                  <div className="mt-6 pt-5 border-t border-stone-100 text-center">
                    <p className="text-sm text-stone-600">
                      New to Diary?{" "}
                      <Link
                        to="/signup"
                        className="text-sky-600 hover:text-sky-800 font-bold transition-colors"
                      >
                        Create an account
                      </Link>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};
