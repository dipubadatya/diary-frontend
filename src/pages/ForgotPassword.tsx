
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      const res = await api.post('/auth/forgot-password', data);
      toast.success(res.data.message || 'We sent a note to your email.');
      setIsSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'We had trouble sending the link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-[#FDFCF8] text-[#1A1A1A] font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      
      {/* Delicate Top Nav */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <Link 
          to="/login" 
          className="text-sm text-[#8B8985] hover:text-[#1A1A1A] transition-colors"
        >
          Return to sign in
        </Link>
      </header>

      {/* Main Centered Content */}
      <main className="w-full max-w-sm px-6 z-20 flex flex-col items-center -mt-20">
        
        {isSubmitted ? (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <h1 className="text-4xl md:text-5xl font-serif text-center mb-4 text-[#1A1A1A] tracking-tight leading-tight">
              Check your inbox.
            </h1>
            <p className="text-center text-[15px] text-[#8B8985] mb-10 leading-relaxed">
              We've sent a gentle reminder with a link to reset your password. It should arrive momentarily.
            </p>
            <Link
              to="/login"
              className="text-[15px] font-medium text-[#4A88FF] hover:text-[#3A78EF] transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {/* Editorial Heading */}
            <h1 className="text-4xl md:text-5xl font-serif text-center mb-4 text-[#1A1A1A] tracking-tight leading-tight">
              Let's find your<br />account.
            </h1>
            
            <p className="text-center text-[15px] text-[#8B8985] mb-10 leading-relaxed">
              Enter your email, and we'll send you a link to get back to your writing.
            </p>

            {/* Minimalist Form */}
            <form className="w-full space-y-3" onSubmit={handleSubmit(onSubmit)}>
              
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`w-full bg-white border rounded-full px-6 py-3.5 text-center text-[15px] placeholder:text-[#A19F9A] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-[#4A88FF]/20 transition-all ${
                    errors.email ? 'border-red-300 focus:border-red-400' : 'border-[#EAE7E0] hover:border-[#D1CEC6] focus:border-[#4A88FF]'
                  }`}
                  placeholder="Email address"
                />
              </div>

              {/* Validation Errors */}
              {errors.email && (
                <div className="text-center pb-2">
                  <p className="text-[13px] text-red-500">
                    {errors.email.message}
                  </p>
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
                    'Send link'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delicate Footer Text */}
        <div className="mt-12 flex flex-col items-center text-[13px] text-[#8B8985] gap-4">
          <p className="font-serif italic">handcrafted for writers</p>
        </div>
      </main>

      {/* 
        Bottom Nature Graphic
        Matches the Login page to keep the transition between pages seamless.
        If you have the exact image "2d6fcb9e17c9b6e40d36645a9b530b7e.jpg" saved in your public folder, 
        you can replace this entire SVG with:
        <img src="/2d6fcb9e17c9b6e40d36645a9b530b7e.jpg" alt="" className="absolute bottom-0 w-full h-48 md:h-64 object-cover object-top z-10 pointer-events-none" />
      */}
      <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none">
        <svg viewBox="0 0 1440 280" className="w-full h-auto block" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {/* Back layer grass */}
          <path fill="#2D5A27" d="M0,280 L0,150 C120,180 240,120 360,130 C480,140 600,210 720,200 C840,190 960,100 1080,110 C1200,120 1320,200 1440,180 L1440,280 Z" opacity="0.6"/>
          {/* Mid layer grass */}
          <path fill="#397332" d="M0,280 L0,200 C150,180 300,240 450,220 C600,200 750,140 900,160 C1050,180 1200,250 1440,220 L1440,280 Z" opacity="0.8"/>
          {/* Foreground layer grass */}
          <path fill="#1F421A" d="M0,280 L0,240 C200,270 400,210 600,230 C800,250 1000,280 1200,260 C1300,250 1370,240 1440,245 L1440,280 Z"/>
          
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