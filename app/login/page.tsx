'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // signInWithPopup works the same whether this Google account has
      // used DueBlink before or not. If there's no Firestore profile for
      // them yet, this is effectively their first sign-up — create it the
      // same way the email/password flow does, so they don't land on the
      // dashboard with no user document behind them.
      const userRef = doc(db, 'users', user.uid);
      const existingDoc = await getDoc(userRef);

      if (!existingDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || '',
          isPro: false,
          aiRemindersUsed: 0,
          createdAt: serverTimestamp(),
        });
      }

      localStorage.setItem('has_created_account', 'true');
      localStorage.setItem('user_authenticated', 'true');

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error("Google Login Error:", err);
      // Closing the Google popup isn't a real error — don't show anything for it.
      if (
        err.code !== 'auth/popup-closed-by-user' &&
        err.code !== 'auth/cancelled-popup-request'
      ) {
        setError("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetError('');
    setResetSuccess(false);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setResetError('Enter your email address above first.');
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error || 'Failed to send password reset email.'
        );
      }

      setResetSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setResetError('Failed to send password reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('has_created_account', 'true');
      localStorage.setItem('user_authenticated', 'true');
      router.push('/dashboard');
      router.refresh(); 
    } catch (err: any) {
      console.error("Login Error:", err.code);
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please verify your credentials.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many unsuccessful login attempts. Please try again later.");
      } else {
        setError("Failed to sign in. Please check your internet connection.");
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
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">Don't have an account?</span>
            <button 
              onClick={() => router.push('/create-account')} 
              className="text-xs sm:text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition cursor-pointer" 
              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
              suppressHydrationWarning={true}
            >
              Create Account
            </button>
          </div>

        </div>
      </nav>

      {/* --- MAIN SPLIT CONTAINER --- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        
        {/* LEFT SIDE: BRANDED HIGHLIGHT PANEL MATCHING LANDING PAGE AESTHETIC */}
        <div className="hidden lg:flex bg-gradient-to-br from-[#1C2E8F] via-[#245B92] to-[#2BB6A8] p-12 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#20B8BE]/20 blur-3xl pointer-events-none -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-teal-200 mb-6">
              <Zap size={13} className="fill-teal-300 text-teal-300" />
              <span>Secure Workspace Sign-In</span>
            </div>
          </div>

          <div className="max-w-md my-auto space-y-6 text-left relative z-10">
            <h1 className="text-4xl xl:text-5xl font-black uppercase tracking-tight leading-[1.1]">
              STOP CHASING CLIENTS.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300">GET PAID FASTER.</span>
            </h1>
            <p className="text-sm xl:text-base text-slate-100 font-medium leading-relaxed">
              Log back into your command center to monitor active portfolios, automate smart reminders, and protect your cash flow.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-200">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-teal-300">
                  <CheckCircle2 size={13} />
                </div>
                <span>Real-time client synchronization</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-200">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-teal-300">
                  <CheckCircle2 size={13} />
                </div>
                <span>Pro AI Recovery Assistant ready</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-white/70 tracking-wider relative z-10 pt-6 border-t border-white/10">
            <span>© 2026 DueBlink</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-teal-300" />
              <span>Encrypted Authentication</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: MODERN CARD FORM - OPTIMIZED PADDING TO MATCH CREATE ACCOUNT */}
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
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Enter your credentials to access your workspace</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-2xl text-center shadow-2xs mb-3.5"
              >
                {error}
              </motion.div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-60 cursor-pointer"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.48c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.65z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09C3.26 21.3 7.3 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.31 14.32c-.24-.72-.38-1.49-.38-2.32s.14-1.6.38-2.32V6.59H1.3A11.97 11.97 0 0 0 0 12c0 1.93.46 3.76 1.3 5.41l4.01-3.09z"/>
                  <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.3 6.59l4.01 3.09c.94-2.82 3.58-4.93 6.69-4.93z"/>
                </svg>
              )}
              <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-3 py-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Or continue with email</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form className="space-y-3.5" onSubmit={handleLoginSubmit}>
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
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider text-left">Password</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[11px] font-bold text-[#245B92] hover:text-[#20B8BE] transition cursor-pointer disabled:opacity-60"
                  >
                    {resetLoading ? 'Sending...' : 'Forgot password?'}
                  </button>
                </div>
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

                {resetError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] font-bold text-red-600 pt-1"
                  >
                    {resetError}
                  </motion.p>
                )}

                {resetSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs">
                        ✓
                      </div>
                      <p className="text-[11px] font-bold text-emerald-700">
                        Reset email sent — check your inbox.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading || googleLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white text-sm font-bold rounded-xl hover:opacity-95 active:scale-[0.98] transition shadow-lg shadow-[#245B92]/20 cursor-pointer mt-1 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In to Workspace</span>
                )}
              </button>
            </form>

            <div className="text-center text-xs font-semibold text-slate-500 mt-5 pt-4 border-t border-slate-100">
              New to DueBlink?{' '}
              <Link href="/create-account" className="font-bold text-[#245B92] hover:text-[#20B8BE] transition underline underline-offset-4">
                Create an account
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
