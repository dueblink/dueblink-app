'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        setError("Invalid email or password.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to sign in. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased flex flex-col selection:bg-[#20B8BE]/20" suppressHydrationWarning={true}>
      
      {/* --- CLEAN TOP BAR WITH BACK BUTTON --- */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-200" suppressHydrationWarning={true}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between" suppressHydrationWarning={true}>
          
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#245B92] transition cursor-pointer"
            suppressHydrationWarning={true}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-4" suppressHydrationWarning={true}>
            <button 
              onClick={() => router.push('/create-account')} 
              className="text-xs sm:text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition cursor-pointer" 
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
        
        {/* LEFT SIDE: PREMIUM GRADIENT HIGHLIGHT */}
        <div className="hidden lg:flex bg-gradient-to-br from-[#1C2E8F] to-[#2BB6A8] p-12 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          </div>
          <div className="max-w-md my-auto space-y-4 text-left relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-tight leading-tight">
              STOP CHASING CLIENTS.<br />GET PAID FASTER.
            </h2>
            <p className="text-sm text-slate-100 font-semibold leading-relaxed">
              Log back in to track your unpaid clients, generate professional reminders, and protect your cash flow.
            </p>
          </div>
          <div className="text-xs font-bold text-white/60 uppercase tracking-wider text-left relative z-10">
            © 2026 DueBlink
          </div>
        </div>

        {/* RIGHT SIDE: CLEAN FORM SCREEN */}
        <div className="flex flex-col justify-center px-4 sm:px-12 lg:px-20 bg-slate-50/50 py-12">
          <div className="max-w-md w-full mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-100/50">
            
            <div className="flex justify-center mb-6 cursor-pointer" onClick={() => router.push('/')}>
              <Image src="/icon.png" alt="DueBlink Icon" width={144} height={144} priority className="w-28 h-28 object-contain" />
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-extrabold text-[#1C2E8F] uppercase tracking-wide">Login to Workspace</h3>
            </div>

            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>}
              
              <div>
                <label className="block text-xs font-bold uppercase text-[#475569] mb-1.5 tracking-wide text-left">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/20 focus:bg-white text-[#0F172A]" 
                    placeholder="name@company.com" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#475569] mb-1.5 tracking-wide text-left">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/20 focus:bg-white text-[#0F172A]" 
                    placeholder="••••••••" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] text-white text-sm font-bold rounded-xl hover:opacity-95 transition shadow-lg shadow-[#1C2E8F]/20 cursor-pointer mt-2 disabled:opacity-70"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="text-center text-xs font-semibold text-slate-400 mt-6 pt-4 border-t border-slate-100">
              New to DueBlink?{' '}
              <Link href="/create-account" className="bg-clip-text text-transparent bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}