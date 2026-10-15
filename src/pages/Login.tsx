// import React, { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { Link, useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import { motion } from 'framer-motion';
// import { Mail, Lock, Feather, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
// import api from '../services/api';
// import { useAuth } from '../contexts/AuthContext';
// import { ThemeToggle } from '../components/ThemeToggle';

// const loginSchema = z.object({
//   email: z.string().email('Invalid email address'),
//   password: z.string().min(1, 'Password is required'),
// });

// type LoginFormData = z.infer<typeof loginSchema>;

// export const Login: React.FC = () => {
//   const navigate = useNavigate();
//   const { login } = useAuth();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
//   const [resending, setResending] = useState(false);

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
//         toast.success(res.data.message || 'Welcome back!');
//         navigate('/stories');
//       }
//     } catch (err: any) {
//       if (err.message && err.message.includes('not verified')) {
//         setUnverifiedEmail(data.email);
//         toast.error('Account unverified. Please check your inbox or resend the verification email.');
//       } else {
//         toast.error(err.message || 'Login failed');
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
//       toast.success(res.data.message || 'Verification email resent!');
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to resend verification email');
//     } finally {
//       setResending(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#fcfaf7] dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
//       {/* Decorative Ink Spots */}
//       <div className="absolute w-96 h-96 -top-20 -left-20 bg-brand/5 blur-3xl rounded-full pointer-events-none" />
//       <div className="absolute w-80 h-80 bottom-20 -right-10 bg-brand/5 blur-3xl rounded-full pointer-events-none" />

//       {/* Floating Theme Toggle */}
//       <div className="absolute top-6 right-6 z-50">
//         <ThemeToggle />
//       </div>

//       <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
//         <Link to="/stories" className="flex justify-center items-center gap-2 group mb-6">
//           <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
//           <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
//             Back to Home
//           </span>
//         </Link>
//         <div className="flex justify-center">
//           <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-md shadow-brand/20">
//             <Feather className="w-6 h-6" />
//           </div>
//         </div>
//         <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
//           Welcome back
//         </h2>
//         <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 font-serif">
//           Log in to continue writing your thoughts
//         </p>
//       </div>

//       <motion.div
//         initial={{ opacity: 0, y: 15 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
//       >
//         <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md py-8 px-4 border border-slate-100 dark:border-slate-800/80 shadow-md sm:rounded-3xl sm:px-10">

//           {unverifiedEmail && (
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex flex-col space-y-3"
//             >
//               <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
//                 <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
//                 <div className="text-sm font-medium">
//                   Your account is registered but email verification is pending. Please verify your email.
//                 </div>
//               </div>
//               <button
//                 type="button"
//                 onClick={handleResend}
//                 disabled={resending}
//                 className="w-full flex justify-center items-center py-2 px-3 border border-transparent rounded-lg text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-200 disabled:opacity-50 transition-all"
//               >
//                 {resending ? (
//                   <>
//                     <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
//                     Resending link...
//                   </>
//                 ) : (
//                   'Resend Verification Link'
//                 )}
//               </button>
//             </motion.div>
//           )}

//           <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
//             {/* Email Input */}
//             <div>
//               <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
//                 Email Address
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
//                   <Mail className="w-4 h-4" />
//                 </div>
//                 <input
//                   id="email"
//                   type="email"
//                   {...register('email')}
//                   className={`pl-10 block w-full rounded-xl border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm py-3 px-4 focus:ring-2 focus:ring-brand/20 focus:border-brand focus:outline-none transition-all ${
//                     errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800'
//                   }`}
//                   placeholder="john@example.com"
//                 />
//               </div>
//               {errors.email && (
//                 <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>
//               )}
//             </div>

//             {/* Password Input */}
//             <div>
//               <div className="flex justify-between items-center mb-2">
//                 <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
//                   Password
//                 </label>
//                 <Link to="/forgot-password" className="text-xs font-bold text-brand hover:underline">
//                   Forgot Password?
//                 </Link>
//               </div>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
//                   <Lock className="w-4 h-4" />
//                 </div>
//                 <input
//                   id="password"
//                   type="password"
//                   {...register('password')}
//                   className={`pl-10 block w-full rounded-xl border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm py-3 px-4 focus:ring-2 focus:ring-brand/20 focus:border-brand focus:outline-none transition-all ${
//                     errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800'
//                   }`}
//                   placeholder="••••••••"
//                 />
//               </div>
//               {errors.password && (
//                 <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password.message}</p>
//               )}
//             </div>

//             {/* Submit Button */}
//             <div>
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-black uppercase tracking-wider text-white bg-brand hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 className="w-4 h-4 animate-spin mr-2" />
//                     Logging in...
//                   </>
//                 ) : (
//                   'Sign In'
//                 )}
//               </button>
//             </div>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-sm text-slate-500 dark:text-slate-400 font-serif">
//               New to Diary?{' '}
//               <Link to="/signup" className="font-sans font-bold text-brand hover:underline">
//                 Create an account
//               </Link>
//             </p>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };


import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

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
      const res = await api.post('/auth/login', data);

      if (res.data.success) {
        login(res.data.user);
        toast.success(res.data.message || 'Welcome back.');
        navigate('/stories');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('not verified')) {
        setUnverifiedEmail(data.email);
        toast.error('Please verify your email to continue.');
      } else {
        toast.error(err.message || 'Login failed. Please check your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    try {
      setResending(true);
      const res = await api.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success(res.data.message || 'Verification link sent.');
    } catch (err: any) {
      toast.error(err.message || 'Unable to send link at this time.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-[#FDFCF8] text-[#1A1A1A] font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-900">

      {/* Delicate Top Nav */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <Link
          to="/stories"
          className="text-sm text-[#8B8985] hover:text-[#1A1A1A] transition-colors"
        >
          Return Home
        </Link>
      </header>

      {/* Main Centered Content */}
      <main className="w-full max-w-sm px-6 z-20 flex flex-col items-center -mt-20">

        {/* Editorial Heading */}
        <h1 className="text-4xl md:text-5xl font-serif text-center mb-10 text-[#1A1A1A] tracking-tight leading-tight">
          Diary is under<br />active development.
        </h1>

        {/* Minimalist Form */}
        <form className="w-full space-y-3" onSubmit={handleSubmit(onSubmit)}>

          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full bg-white border rounded-full px-6 py-3.5 text-center text-[15px] placeholder:text-[#A19F9A] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-[#4A88FF]/20 transition-all ${errors.email ? 'border-red-300 focus:border-red-400' : 'border-[#EAE7E0] hover:border-[#D1CEC6] focus:border-[#4A88FF]'
                }`}
              placeholder="Email address"
            />
          </div>

          <div className="relative">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className={`w-full bg-white border rounded-full px-6 py-3.5 text-center text-[15px] placeholder:text-[#A19F9A] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-[#4A88FF]/20 transition-all ${errors.password ? 'border-red-300 focus:border-red-400' : 'border-[#EAE7E0] hover:border-[#D1CEC6] focus:border-[#4A88FF]'
                }`}
              placeholder="Password"
            />
          </div>

          {/* Validation Errors (Kept soft and centered) */}
          {(errors.email || errors.password) && (
            <div className="text-center pb-2">
              <p className="text-[13px] text-red-500">
                {errors.email?.message || errors.password?.message}
              </p>
            </div>
          )}

          {/* Unverified Email State */}
          {unverifiedEmail && (
            <div className="flex flex-col items-center gap-2 pb-4">
              <p className="text-[13px] text-[#D97706] text-center">
                Email verification pending.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[13px] text-[#4A88FF] hover:text-[#3A78EF] transition-colors flex items-center gap-1"
              >
                {resending && <Loader2 className="w-3 h-3 animate-spin" />}
                Resend link
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3.5 px-6 rounded-full text-[15px] font-medium text-white bg-[#4A88FF] hover:bg-[#3A78EF] shadow-md shadow-[#4A88FF]/20 focus:outline-none focus:ring-4 focus:ring-[#4A88FF]/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Delicate Footer Links */}
        <div className="mt-12 flex flex-col items-center text-[13px] text-[#8B8985] gap-4">
          <p className="font-serif italic">handcrafted for writers</p>
          <div className="flex gap-4">
            <Link to="/signup" className="hover:text-[#1A1A1A] transition-colors">Create Account</Link>
            <Link to="/forgot-password" className="hover:text-[#1A1A1A] transition-colors">Forgot Password</Link>
          </div>
        </div>
      </main>

      {/* 
        Bottom Nature Graphic
        If you have the exact image "2d6fcb9e17c9b6e40d36645a9b530b7e.jpg" saved in your public folder, 
        you can replace this entire SVG with:
        <img src="/2d6fcb9e17c9b6e40d36645a9b530b7e.jpg" alt="" className="absolute bottom-0 w-full h-48 md:h-64 object-cover object-top z-10 pointer-events-none" />
      */}
      <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none">
        <svg viewBox="0 0 1440 280" className="w-full h-auto block" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {/* Back layer grass */}
          <path fill="#2D5A27" d="M0,280 L0,150 C120,180 240,120 360,130 C480,140 600,210 720,200 C840,190 960,100 1080,110 C1200,120 1320,200 1440,180 L1440,280 Z" opacity="0.6" />
          {/* Mid layer grass */}
          <path fill="#397332" d="M0,280 L0,200 C150,180 300,240 450,220 C600,200 750,140 900,160 C1050,180 1200,250 1440,220 L1440,280 Z" opacity="0.8" />
          {/* Foreground layer grass */}
          <path fill="#1F421A" d="M0,280 L0,240 C200,270 400,210 600,230 C800,250 1000,280 1200,260 C1300,250 1370,240 1440,245 L1440,280 Z" />

          {/* Stylized Sunflowers */}
          {/* Flower 1 */}
          <g transform="translate(150, 180)">
            <path d="M0,0 Q-10,-40 5,-80" stroke="#397332" strokeWidth="4" fill="none" />
            <circle cx="5" cy="-80" r="12" fill="#EAB308" />
            <circle cx="5" cy="-80" r="6" fill="#422006" />
          </g>
          {/* Flower 2 */}
          <g transform="translate(450, 150)">
            <path d="M0,0 Q10,-50 -5,-90" stroke="#2D5A27" strokeWidth="4" fill="none" />
            <circle cx="-5" cy="-90" r="14" fill="#EAB308" />
            <circle cx="-5" cy="-90" r="7" fill="#422006" />
          </g>
          {/* Flower 3 */}
          <g transform="translate(850, 190)">
            <path d="M0,0 Q-15,-30 0,-70" stroke="#397332" strokeWidth="4" fill="none" />
            <circle cx="0" cy="-70" r="10" fill="#EAB308" />
            <circle cx="0" cy="-70" r="5" fill="#422006" />
          </g>
          {/* Flower 4 */}
          <g transform="translate(1250, 170)">
            <path d="M0,0 Q20,-40 10,-85" stroke="#2D5A27" strokeWidth="4" fill="none" />
            <circle cx="10" cy="-85" r="13" fill="#EAB308" />
            <circle cx="10" cy="-85" r="6" fill="#422006" />
          </g>
        </svg>
      </div>

    </div>
  );
};