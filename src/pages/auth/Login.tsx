// import React, { useState, useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { Link, useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import { Loader2 } from 'lucide-react';
// import api from '../services/api';
// import { useAuth } from '../contexts/AuthContext';

// const loginSchema = z.object({
//   email: z.string().email('Please enter a valid email address'),
//   password: z.string().min(1, 'Password is required'),
// });

// type LoginFormData = z.infer<typeof loginSchema>;

// export const Login: React.FC = () => {
//   const navigate = useNavigate();
//   const { login } = useAuth();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
//   const [resending, setResending] = useState(false);

//   useEffect(() => {
//     const src = 'https://accounts.google.com/gsi/client';
//     const handleScriptLoad = () => {
//       if ((window as any).google) {
//         (window as any).google.accounts.id.initialize({
//           client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID ,
//           callback: async (response: any) => {
//             if (response && response.credential) {
//               setIsSubmitting(true);
//               try {
//                 const res = await api.post('/auth/google', { idToken: response.credential });
//                 if (res.data.success) {
//                   login(res.data.user);
//                   toast.success(res.data.message || 'Welcome back!');
//                   navigate('/stories');
//                 }
//               } catch (err: any) {
//                 toast.error(err.message || 'Google login failed.');
//               } finally {
//                 setIsSubmitting(false);
//               }
//             }
//           }
//         });

//         (window as any).google.accounts.id.renderButton(
//           document.getElementById('google-signin-btn'),
//           {
//             theme: 'outline',
//             size: 'large',
//             shape: 'pill',
//             text: 'continue_with',
//             width: 320
//           }
//         );
//       }
//     };

//     const existingScript = document.querySelector(`script[src="${src}"]`);
//     if (!existingScript) {
//       const script = document.createElement('script');
//       script.src = src;
//       script.async = true;
//       script.defer = true;
//       script.onload = handleScriptLoad;
//       document.body.appendChild(script);
//     } else {
//       handleScriptLoad();
//     }
//   }, []);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginFormData>({
//     resolver: zodResolver(loginSchema),
//   });

//   const onSubmit = async (data: LoginFormData) => {
//     try {
//       setIsSubmitting(true);
//       setUnverifiedEmail(null);
//       const res = await api.post('/auth/login', data);

//       if (res.data.success) {
//         login(res.data.user);
//         toast.success(res.data.message || 'Welcome back.');
//         navigate('/stories');
//       }
//     } catch (err: any) {
//       if (err.message && err.message.includes('not verified')) {
//         setUnverifiedEmail(data.email);
//         toast.error('Please verify your email to continue.');
//       } else {
//         toast.error(err.message || 'Login failed. Please check your details.');
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleResend = async () => {
//     if (!unverifiedEmail) return;
//     try {
//       setResending(true);
//       const res = await api.post('/auth/resend-verification', { email: unverifiedEmail });
//       toast.success(res.data.message || 'Verification link sent.');
//     } catch (err: any) {
//       toast.error(err.message || 'Unable to send link at this time.');
//     } finally {
//       setResending(false);
//     }
//   };

//   return (
//     <div className="min-h-screen relative flex flex-col items-center justify-center bg-[#FDFCF8] text-[#1A1A1A] font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-900">

//       {/* Delicate Top Nav */}
//       <header className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
//         <Link
//           to="/stories"
//           className="text-sm text-[#8B8985] hover:text-[#1A1A1A] transition-colors"
//         >
//           Return Home
//         </Link>
//       </header>

//       {/* Main Centered Content */}
//       <main className="w-full max-w-sm px-6 z-20 flex flex-col items-center -mt-20">

//         {/* Editorial Heading */}
//         <h1 className="text-4xl md:text-5xl font-serif text-center mb-10 text-[#1A1A1A] tracking-tight leading-tight">
//           Diary is under<br />active development.
//         </h1>

//         {/* Minimalist Form */}
//         <form className="w-full space-y-3" onSubmit={handleSubmit(onSubmit)}>

//           <div className="relative">
//             <input
//               id="email"
//               type="email"
//               autoComplete="email"
//               {...register('email')}
//               className={`w-full bg-white border rounded-full px-6 py-3.5 text-center text-[15px] placeholder:text-[#A19F9A] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-[#4A88FF]/20 transition-all ${errors.email ? 'border-red-300 focus:border-red-400' : 'border-[#EAE7E0] hover:border-[#D1CEC6] focus:border-[#4A88FF]'
//                 }`}
//               placeholder="Email address"
//             />
//           </div>

//           <div className="relative">
//             <input
//               id="password"
//               type="password"
//               autoComplete="current-password"
//               {...register('password')}
//               className={`w-full bg-white border rounded-full px-6 py-3.5 text-center text-[15px] placeholder:text-[#A19F9A] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-[#4A88FF]/20 transition-all ${errors.password ? 'border-red-300 focus:border-red-400' : 'border-[#EAE7E0] hover:border-[#D1CEC6] focus:border-[#4A88FF]'
//                 }`}
//               placeholder="Password"
//             />
//           </div>

//           {/* Validation Errors (Kept soft and centered) */}
//           {(errors.email || errors.password) && (
//             <div className="text-center pb-2">
//               <p className="text-[13px] text-red-500">
//                 {errors.email?.message || errors.password?.message}
//               </p>
//             </div>
//           )}

//           {/* Unverified Email State */}
//           {unverifiedEmail && (
//             <div className="flex flex-col items-center gap-2 pb-4">
//               <p className="text-[13px] text-[#D97706] text-center">
//                 Email verification pending.
//               </p>
//               <button
//                 type="button"
//                 onClick={handleResend}
//                 disabled={resending}
//                 className="text-[13px] text-[#4A88FF] hover:text-[#3A78EF] transition-colors flex items-center gap-1"
//               >
//                 {resending && <Loader2 className="w-3 h-3 animate-spin" />}
//                 Resend link
//               </button>
//             </div>
//           )}

//           <div className="pt-2">
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full flex justify-center items-center py-3.5 px-6 rounded-full text-[15px] font-medium text-white bg-[#4A88FF] hover:bg-[#3A78EF] shadow-md shadow-[#4A88FF]/20 focus:outline-none focus:ring-4 focus:ring-[#4A88FF]/20 disabled:opacity-50 transition-all"
//             >
//               {isSubmitting ? (
//                 <Loader2 className="w-5 h-5 animate-spin" />
//               ) : (
//                 'Sign In'
//               )}
//             </button>
//           </div>
//         </form>

//         {/* Divider */}
//         <div className="w-full flex items-center justify-center gap-3 my-5">
//           <div className="h-[1px] flex-1 bg-[#EAE7E0]"></div>
//           <span className="text-[12px] text-[#8B8985] uppercase tracking-wider font-medium select-none">or</span>
//           <div className="h-[1px] flex-1 bg-[#EAE7E0]"></div>
//         </div>

//         {/* Google Authentication Button */}
//         <div className="w-full flex justify-center py-1">
//           <div id="google-signin-btn" className="w-full flex justify-center"></div>
//         </div>

//         {/* Delicate Footer Links */}
//         <div className="mt-12 flex flex-col items-center text-[13px] text-[#8B8985] gap-4">
//           <p className="font-serif italic">handcrafted for writers</p>
//           <div className="flex gap-4">
//             <Link to="/signup" className="hover:text-[#1A1A1A] transition-colors">Create Account</Link>
//             <Link to="/forgot-password" className="hover:text-[#1A1A1A] transition-colors">Forgot Password</Link>
//           </div>
//         </div>
//       </main>

//       {/*
//         Bottom Nature Graphic
//         If you have the exact image "2d6fcb9e17c9b6e40d36645a9b530b7e.jpg" saved in your public folder,
//         you can replace this entire SVG with:
//         <img src="/2d6fcb9e17c9b6e40d36645a9b530b7e.jpg" alt="" className="absolute bottom-0 w-full h-48 md:h-64 object-cover object-top z-10 pointer-events-none" />
//       */}
//       <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none">
//         <svg viewBox="0 0 1440 280" className="w-full h-auto block" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
//           {/* Back layer grass */}
//           <path fill="#2D5A27" d="M0,280 L0,150 C120,180 240,120 360,130 C480,140 600,210 720,200 C840,190 960,100 1080,110 C1200,120 1320,200 1440,180 L1440,280 Z" opacity="0.6" />
//           {/* Mid layer grass */}
//           <path fill="#397332" d="M0,280 L0,200 C150,180 300,240 450,220 C600,200 750,140 900,160 C1050,180 1200,250 1440,220 L1440,280 Z" opacity="0.8" />
//           {/* Foreground layer grass */}
//           <path fill="#1F421A" d="M0,280 L0,240 C200,270 400,210 600,230 C800,250 1000,280 1200,260 C1300,250 1370,240 1440,245 L1440,280 Z" />

//           {/* Stylized Sunflowers */}
//           {/* Flower 1 */}
//           <g transform="translate(150, 180)">
//             <path d="M0,0 Q-10,-40 5,-80" stroke="#397332" strokeWidth="4" fill="none" />
//             <circle cx="5" cy="-80" r="12" fill="#EAB308" />
//             <circle cx="5" cy="-80" r="6" fill="#422006" />
//           </g>
//           {/* Flower 2 */}
//           <g transform="translate(450, 150)">
//             <path d="M0,0 Q10,-50 -5,-90" stroke="#2D5A27" strokeWidth="4" fill="none" />
//             <circle cx="-5" cy="-90" r="14" fill="#EAB308" />
//             <circle cx="-5" cy="-90" r="7" fill="#422006" />
//           </g>
//           {/* Flower 3 */}
//           <g transform="translate(850, 190)">
//             <path d="M0,0 Q-15,-30 0,-70" stroke="#397332" strokeWidth="4" fill="none" />
//             <circle cx="0" cy="-70" r="10" fill="#EAB308" />
//             <circle cx="0" cy="-70" r="5" fill="#422006" />
//           </g>
//           {/* Flower 4 */}
//           <g transform="translate(1250, 170)">
//             <path d="M0,0 Q20,-40 10,-85" stroke="#2D5A27" strokeWidth="4" fill="none" />
//             <circle cx="10" cy="-85" r="13" fill="#EAB308" />
//             <circle cx="10" cy="-85" r="6" fill="#422006" />
//           </g>
//         </svg>
//       </div>

//     </div>
//   );
// };


import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import DiaryLogo from "../../components/DiaryLogo";

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
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
      setResendMessage({ type: 'success', text: res.data.message || "Verification link sent." });
    } catch (err: any) {
      setResendMessage({ type: 'error', text: err.message || "Unable to send link at this time." });
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
                      <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                          <p className={`text-[11px] mt-2 font-semibold ${resendMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
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