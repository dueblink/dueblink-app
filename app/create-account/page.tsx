'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function RegisterPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (fullName) {
        await updateProfile(user, { displayName: fullName });
      }

      await setDoc(doc(db, 'users', user.uid), {
  uid: user.uid,
  email: user.email,
  name: fullName,
  isPro: false,
  aiRemindersUsed: 0,
  createdAt: serverTimestamp(),
});

      
      // Send automated SaaS welcome email through the server API endpoint
      try {
        const emailResponse = await fetch("/api/send-welcome", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email || email,
            userName: fullName || "there",
          }),
        });

        if (!emailResponse.ok) {
          console.error("Failed to send welcome email.");
        }
      } catch (emailErr) {
        console.error("Welcome email request failed:", emailErr);
      }
      
      localStorage.setItem('has_created_account', 'true');
      localStorage.setItem('user_authenticated', 'true');
      
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please login instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters long.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] antialiased flex flex-col selection:bg-[#20B8BE]/20" suppressHydrationWarning={true}>
      
      {/* --- REFINED STICKY TOP NAV --- */}
      <nav className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-200 shadow-xs" suppressHydrationWarning={true}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between" suppressHydrationWarning={true}>
          
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#245B92] transition cursor-pointer group"
            suppressHydrationWarning={true}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-4" suppressHydrationWarning={true}>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">Already have an account?</span>
            <button 
              onClick={() => router.push('/login')} 
              className="text-xs sm:text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition cursor-pointer" 
              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
              suppressHydrationWarning={true}
            >
              Sign In
            </button>
          </div>

        </div>
      </nav>

      {/* --- MAIN SPLIT CONTAINER --- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        
        {/* LEFT SIDE: BRANDED HIGHLIGHT PANEL */}
        <div className="hidden lg:flex bg-gradient-to-br from-[#1C2E8F] via-[#245B92] to-[#2BB6A8] p-12 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#20B8BE]/20 blur-3xl pointer-events-none -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-teal-200 mb-6">
              <Zap size={13} className="fill-teal-300 text-teal-300" />
              <span>Zero-Spreadsheet Workspace</span>
            </div>
          </div>

          <div className="max-w-md my-auto space-y-6 text-left relative z-10">
            <h1 className="text-4xl xl:text-5xl font-black uppercase tracking-tight leading-[1.1]">
              KNOW WHO OWES YOU MONEY.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300">KNOW WHAT TO DO NEXT.</span>
            </h1>
            <p className="text-sm xl:text-base text-slate-100 font-medium leading-relaxed">
              Create your account today to recover delayed cash flow assets easily with AI-driven prioritization and automated follow-ups.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-200">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-teal-300">
                  <CheckCircle2 size={13} />
                </div>
                <span>Instant client portfolio tracking</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-200">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-teal-300">
                  <CheckCircle2 size={13} />
                </div>
                <span>Blink AI Assistant integration</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-white/70 tracking-wider relative z-10 pt-6 border-t border-white/10">
            <span>© 2026 DueBlink</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-teal-300" />
              <span>Secure Cloud Architecture</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: MODERN CARD FORM */}
        <div className="flex flex-col justify-center px-4 sm:px-12 lg:px-20 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="max-w-md w-full mx-auto bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50"
          >
            
            <div className="flex justify-center mb-4 cursor-pointer" onClick={() => router.push('/')}>
              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                <Image src="/icon.png" alt="DueBlink Icon" width={96} height={96} priority className="w-20 h-20 object-contain" />
              </div>
            </div>
            
            <div className="text-center mb-5">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Get Started Free</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Set up your workspace in seconds</p>
            </div>

            <form className="space-y-3.5" onSubmit={handleSignupSubmit}>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-2xl text-center shadow-2xs"
                >
                  {error}
                </motion.div>
              )}
              
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider text-left">Full Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-[#245B92] focus:bg-white focus:ring-4 focus:ring-[#245B92]/10 transition text-slate-900 placeholder:text-slate-400" 
                    placeholder="John Doe" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider text-left">Email Address</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-[#245B92] focus:bg-white focus:ring-4 focus:ring-[#245B92]/10 transition text-slate-900 placeholder:text-slate-400" 
                    placeholder="name@company.com" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider text-left">Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm font-medium focus:outline-none focus:border-[#245B92] focus:bg-white focus:ring-4 focus:ring-[#245B92]/10 transition text-slate-900 placeholder:text-slate-400" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg transition"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white text-sm font-bold rounded-xl hover:opacity-95 active:scale-[0.98] transition shadow-lg shadow-[#245B92]/20 cursor-pointer mt-1 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <div className="text-center text-xs font-semibold text-slate-500 mt-5 pt-4 border-t border-slate-100">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#245B92] hover:text-[#20B8BE] transition underline underline-offset-4">
                Login
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}