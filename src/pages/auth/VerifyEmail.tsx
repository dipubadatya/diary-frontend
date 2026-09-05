
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  useSearchParams,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Mail,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import DiaryLogo from "../../components/DiaryLogo";

/* ------------------------------------------------------------------ */
/* Motion Presets — shared with Login page for consistency            */
/* ------------------------------------------------------------------ */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;



const cardMotion = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.28, ease: EASE_OUT },
};

/* ------------------------------------------------------------------ */
/* Email validation                                                    */
/* ------------------------------------------------------------------ */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const token = searchParams.get("token");

  // --- Token verification state ---
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState<string>("");
  const verifiedRef = useRef(false);

  // --- Email + resend state ---
  const [email, setEmail] = useState<string>(() => {
    return (
      location.state?.email ||
      searchParams.get("email") ||
      sessionStorage.getItem("pending_verification_email") ||
      ""
    );
  });

  const [isEmailInputVisible, setIsEmailInputVisible] = useState(!email);
  const [emailInput, setEmailInput] = useState(email);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const [resendStatus, setResendStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  /* ---------------------------------------------------------------- */
  /* Error Parser — mirrors Login page pattern                        */
  /* ---------------------------------------------------------------- */
  const parseError = useCallback(
    (err: any, context: "verify" | "resend" | "change" = "verify"): string => {
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

      if (context === "verify") {
        if (lower.includes("expired")) {
          return "This verification link has expired. Please request a new one.";
        }
        if (lower.includes("invalid") || lower.includes("used")) {
          return "This verification link is invalid or has already been used.";
        }
        return serverMsg || "This verification link is invalid or has expired.";
      }

      if (context === "resend") {
        if (lower.includes("not found") || lower.includes("no user")) {
          return "We couldn't find an account with that email.";
        }
        if (lower.includes("already verified")) {
          return "This email is already verified. You can sign in now.";
        }
      }

      if (context === "change") {
        if (lower.includes("exists") || lower.includes("taken")) {
          return "This email is already in use by another account.";
        }
      }

      return serverMsg || "Something unexpected happened. Please try again.";
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /* Cooldown timer                                                    */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  /* ---------------------------------------------------------------- */
  /* Auto-dismiss transient messages                                   */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (resendStatus !== "success" && resendStatus !== "error") return;
    if (!resendMessage) return;
    const timer = setTimeout(() => {
      setResendMessage("");
      setResendStatus("idle");
    }, 6000);
    return () => clearTimeout(timer);
  }, [resendStatus, resendMessage]);

  /* ---------------------------------------------------------------- */
  /* Token Verification                                                */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!token) return;
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const performVerification = async () => {
      try {
        const res = await api.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`,
        );
        if (res.data.success) {
          setStatus("success");
          // Clear stored pending email
          sessionStorage.removeItem("pending_verification_email");
          setTimeout(() => {
            navigate("/verification-success");
          }, 1500);
        } else {
          setStatus("error");
          setErrorMsg(
            res.data.message ||
              "This verification link is invalid or has expired.",
          );
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(parseError(err, "verify"));
      }
    };

    performVerification();
  }, [token, navigate, parseError]);

  /* ---------------------------------------------------------------- */
  /* Handlers                                                          */
  /* ---------------------------------------------------------------- */
  const handleResend = async () => {
    if (!email || cooldown > 0 || resendStatus === "loading") return;
    try {
      setResendStatus("loading");
      setResendMessage("");
      const res = await api.post("/auth/resend-verification", { email });
      setResendStatus("success");
      setResendMessage(
        res.data?.message || "Sent! Check your inbox in a few seconds.",
      );
      setCooldown(60);
    } catch (err: any) {
      setResendStatus("error");
      setResendMessage(parseError(err, "resend"));
    }
  };

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNewEmail = newEmail.trim();

    if (!cleanNewEmail) {
      setResendStatus("error");
      setResendMessage("Please enter an email address.");
      return;
    }
    if (cleanNewEmail.toLowerCase() === email.toLowerCase()) {
      setResendStatus("error");
      setResendMessage("Please enter a different email address.");
      return;
    }
    if (!EMAIL_REGEX.test(cleanNewEmail)) {
      setResendStatus("error");
      setResendMessage("That doesn't look like a valid email.");
      return;
    }

    try {
      setResendStatus("loading");
      setResendMessage("");
      const res = await api.post("/auth/change-email", {
        oldEmail: email,
        newEmail: cleanNewEmail,
      });

      setEmail(cleanNewEmail);
      sessionStorage.setItem("pending_verification_email", cleanNewEmail);
      setIsChangingEmail(false);
      setNewEmail("");
      setResendStatus("success");
      setResendMessage(
        res.data?.message || "Email updated and new verification link sent.",
      );
      setCooldown(60);
    } catch (err: any) {
      setResendStatus("error");
      setResendMessage(parseError(err, "change"));
    }
  };

  const handleManualEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();

    if (!cleanEmail) {
      setResendStatus("error");
      setResendMessage("Please enter your email address.");
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setResendStatus("error");
      setResendMessage("That doesn't look like a valid email.");
      return;
    }

    try {
      setResendStatus("loading");
      setResendMessage("");
      const res = await api.post("/auth/resend-verification", {
        email: cleanEmail,
      });

      setEmail(cleanEmail);
      sessionStorage.setItem("pending_verification_email", cleanEmail);
      setIsEmailInputVisible(false);
      setResendStatus("success");
      setResendMessage(
        res.data?.message || "Verification link has been sent.",
      );
      setCooldown(60);
    } catch (err: any) {
      setResendStatus("error");
      setResendMessage(parseError(err, "resend"));
    }
  };

  /* ---------------------------------------------------------------- */
  /* Class Helpers (shared with Login)                                */
  /* ---------------------------------------------------------------- */
  const inputBase =
    "w-full bg-white border-2 rounded-lg py-3.5 text-stone-900 text-[15px] placeholder:text-stone-400 focus:outline-none transition-colors duration-200";
  const inputOk = "border-transparent focus:border-sky-400";
  const iconBase =
    "absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200";

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-stone-900 selection:text-white flex flex-col">
      {/* Ambient Sky Background */}
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
      <header className="relative z-10 w-full px-6 py-6 md:px-12 md:py-8 flex items-center justify-between">
        <DiaryLogo />
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium hover:underline underline-offset-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="w-full max-w-[400px] sm:max-w-[440px]"
        >
          {/* ═══════════ TOKEN VERIFICATION FLOW ═══════════ */}
          {token && (
            <AnimatePresence mode="wait">
              {status === "loading" && (
                <motion.div key="loading" {...cardMotion} className="text-left">
                  <div className="mb-7">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                      Verifying your email
                    </h1>
                    <p className="text-white/85 text-sm md:text-base">
                      Please wait while we confirm your address...
                    </p>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex flex-col items-center">
                    <div className="w-14 h-14 bg-stone-50 border border-stone-100 rounded-full flex items-center justify-center mb-4">
                      <Loader2
                        className="w-6 h-6 text-sky-500 animate-spin"
                        strokeWidth={2.5}
                      />
                    </div>
                    <p className="text-[13px] text-stone-600 font-semibold">
                      Connecting to secure servers...
                    </p>
                  </div>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div key="success" {...cardMotion} className="text-left">
                  <div className="mb-7">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                      You're verified!
                    </h1>
                    <p className="text-white/85 text-sm md:text-base">
                      Redirecting you now...
                    </p>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex flex-col items-center">
                    <div className="w-14 h-14 bg-[#C6F547] rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck
                        className="w-7 h-7 text-stone-900"
                        strokeWidth={2.5}
                      />
                    </div>
                    <p className="text-[13px] text-emerald-700 font-bold text-center">
                      All set! Taking you to your account.
                    </p>
                  </div>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div key="error" {...cardMotion} className="text-left">
                  <div className="mb-7">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                      Verification failed
                    </h1>
                    <p className="text-white/85 text-sm md:text-base">
                      This link may have expired or already been used.
                    </p>
                  </div>

                  {/* Error message card */}
                  <div className="mb-5">
                    <div className="relative bg-rose-50/95 backdrop-blur-md border border-rose-100/80 rounded-xl px-4 py-3.5 flex items-start gap-3 shadow-[0_10px_30px_rgba(244,63,94,0.15)] overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                      <div className="flex-shrink-0 mt-0.5 bg-rose-100 p-1 rounded-lg">
                        <AlertCircle
                          className="w-4 h-4 text-rose-600"
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[13px] font-bold text-rose-950 mb-0.5">
                          Link invalid
                        </h5>
                        <p className="text-[12.5px] text-rose-800 font-medium leading-relaxed">
                          {errorMsg}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/verify-email");
                        setStatus("loading");
                        verifiedRef.current = false;
                        setIsEmailInputVisible(true);
                      }}
                      className="w-full py-3.5 bg-[#C6F547] text-stone-900 rounded-lg font-bold text-[15px] tracking-wide hover:bg-[#b5e236] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                    >
                      <span>Request new link</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <Link
                      to="/login"
                      className="w-full py-3.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-lg font-semibold text-[14px] hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to sign in
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* ═══════════ REQUEST / STATUS FLOW (no token) ═══════════ */}
          {!token && (
            <AnimatePresence mode="wait">
              {isEmailInputVisible ? (
                /* --- Manual Email Entry --- */
                <motion.div
                  key="manual-entry"
                  {...cardMotion}
                  className="text-left"
                >
                  <div className="mb-7">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                      Verify your email
                    </h1>
                    <p className="text-white/85 text-sm md:text-base">
                      Enter your email and we'll send a fresh verification link.
                    </p>
                  </div>

                  {/* Error / success feedback */}
                  <AnimatePresence>
                    {resendMessage && (
                      <motion.div {...cardMotion} className="mb-5">
                        <div
                          className={`relative backdrop-blur-md border rounded-xl px-4 py-3.5 flex items-start gap-3 shadow-lg overflow-hidden ${
                            resendStatus === "success"
                              ? "bg-emerald-50/95 border-emerald-100/80"
                              : "bg-rose-50/95 border-rose-100/80"
                          }`}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              resendStatus === "success"
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                            }`}
                          />
                          <div
                            className={`flex-shrink-0 mt-0.5 p-1 rounded-lg ${
                              resendStatus === "success"
                                ? "bg-emerald-100"
                                : "bg-rose-100"
                            }`}
                          >
                            {resendStatus === "success" ? (
                              <CheckCircle2
                                className="w-4 h-4 text-emerald-600"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <AlertCircle
                                className="w-4 h-4 text-rose-600"
                                strokeWidth={2.5}
                              />
                            )}
                          </div>
                          <p
                            className={`flex-1 text-[12.5px] font-medium leading-relaxed pr-2 ${
                              resendStatus === "success"
                                ? "text-emerald-900"
                                : "text-rose-800"
                            }`}
                          >
                            {resendMessage}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setResendMessage("");
                              setResendStatus("idle");
                            }}
                            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                              resendStatus === "success"
                                ? "text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100/50"
                                : "text-rose-400 hover:text-rose-700 hover:bg-rose-100/50"
                            }`}
                            aria-label="Dismiss"
                          >
                            <X className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form
                    onSubmit={handleManualEmailSubmit}
                    className="space-y-4"
                    noValidate
                  >
                    <div className="relative group">
                      <Mail
                        className={`${iconBase} text-stone-400 group-focus-within:text-sky-500`}
                        style={{ width: 18, height: 18 }}
                      />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Email address"
                        autoComplete="email"
                        autoFocus
                        className={`${inputBase} pl-11 pr-4 ${inputOk}`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resendStatus === "loading"}
                      className="w-full py-3.5 bg-[#C6F547] text-stone-900 rounded-lg font-bold text-[15px] tracking-wide hover:bg-[#b5e236] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                    >
                      {resendStatus === "loading" ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send verification link</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {email && (
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setIsEmailInputVisible(false)}
                        className="text-white/80 hover:text-white text-sm font-medium hover:underline underline-offset-2 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* --- Details / Resend view --- */
                <motion.div
                  key="details-view"
                  {...cardMotion}
                  className="text-left"
                >
                  <div className="mb-7">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                      Check your inbox
                    </h1>
                    <p className="text-white/85 text-sm md:text-base">
                      We sent a verification link to your email.
                    </p>
                  </div>

                  {/* Email display card */}
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 mb-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 bg-sky-50 rounded-full flex items-center justify-center shrink-0">
                        <Mail
                          className="w-5 h-5 text-sky-500"
                          strokeWidth={2}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">
                          Sent to
                        </p>
                        <p className="text-[14px] font-bold text-stone-900 break-all">
                          {email}
                        </p>
                      </div>
                    </div>
                    <p className="text-[12.5px] text-stone-600 leading-relaxed font-medium">
                      Click the link in the email to activate your account. If
                      you don't see it, check your spam folder.
                    </p>
                  </div>

                  {/* Feedback message */}
                  <AnimatePresence>
                    {resendMessage && (
                      <motion.div {...cardMotion} className="mb-5">
                        <div
                          className={`relative backdrop-blur-md border rounded-xl px-4 py-3.5 flex items-start gap-3 shadow-lg overflow-hidden ${
                            resendStatus === "success"
                              ? "bg-emerald-50/95 border-emerald-100/80"
                              : "bg-rose-50/95 border-rose-100/80"
                          }`}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              resendStatus === "success"
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                            }`}
                          />
                          <div
                            className={`flex-shrink-0 mt-0.5 p-1 rounded-lg ${
                              resendStatus === "success"
                                ? "bg-emerald-100"
                                : "bg-rose-100"
                            }`}
                          >
                            {resendStatus === "success" ? (
                              <CheckCircle2
                                className="w-4 h-4 text-emerald-600"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <AlertCircle
                                className="w-4 h-4 text-rose-600"
                                strokeWidth={2.5}
                              />
                            )}
                          </div>
                          <p
                            className={`flex-1 text-[12.5px] font-medium leading-relaxed pr-2 ${
                              resendStatus === "success"
                                ? "text-emerald-900"
                                : "text-rose-800"
                            }`}
                          >
                            {resendMessage}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setResendMessage("");
                              setResendStatus("idle");
                            }}
                            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                              resendStatus === "success"
                                ? "text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100/50"
                                : "text-rose-400 hover:text-rose-700 hover:bg-rose-100/50"
                            }`}
                            aria-label="Dismiss"
                          >
                            <X className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Change email inline form */}
                  <AnimatePresence>
                    {isChangingEmail && (
                      <motion.div {...cardMotion} className="mb-5">
                        <form
                          onSubmit={handleChangeEmailSubmit}
                          className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-[11px] font-bold tracking-wider uppercase text-stone-500">
                              Change email address
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsChangingEmail(false);
                                setNewEmail("");
                              }}
                              className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors"
                              aria-label="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="relative group mb-3">
                            <Mail
                              className={`${iconBase} text-stone-400 group-focus-within:text-sky-500`}
                              style={{ width: 18, height: 18 }}
                            />
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="New email address"
                              autoFocus
                              className={`${inputBase} pl-11 pr-4 ${inputOk}`}
                              required
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={resendStatus === "loading"}
                              className="flex-1 py-3 bg-stone-900 text-white rounded-lg font-bold text-[13px] hover:bg-stone-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                              {resendStatus === "loading" ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <span>Save & resend</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsChangingEmail(false);
                                setNewEmail("");
                              }}
                              className="px-4 py-3 border-2 border-stone-200 rounded-lg text-[13px] font-bold text-stone-600 hover:bg-stone-50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  {!isChangingEmail && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldown > 0 || resendStatus === "loading"}
                        className="w-full py-3.5 bg-[#C6F547] text-stone-900 rounded-lg font-bold text-[15px] tracking-wide hover:bg-[#b5e236] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#C6F547] flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                      >
                        {resendStatus === "loading" ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : cooldown > 0 ? (
                          <span>Resend link in {cooldown}s</span>
                        ) : (
                          <>
                            <span>Resend verification link</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingEmail(true);
                          setNewEmail("");
                          setResendMessage("");
                          setResendStatus("idle");
                        }}
                        className="w-full py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-lg font-semibold text-[13.5px] hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Wrong email? Change it</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Footer help link */}
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