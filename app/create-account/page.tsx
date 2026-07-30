'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function RegisterPage() {
  const router = useRouter();
  
  // New state variables for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Firebase Sign Up
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Mark user as authenticated
      localStorage.setItem('has_created_account', 'true');
      localStorage.setItem('user_authenticated', 'true');
      
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex grid grid-cols-1 lg:grid-cols-2 text-[#0F172A] antialiased">
      
      {/* LEFT SIDE: PREMIUM GRADIENT HIGHLIGHT */}
      <div className="hidden lg:flex min-h-screen bg-gradient-to-br from-[#1C2E8F] to-[#2BB6A8] p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-black/10 blur-3xl" />

        <div className="max-w-md my-auto space-y-4 text-left relative z-10">
          <h2 className="text-4xl font-black uppercase tracking-tight leading-tight">
            KNOW WHO OWES YOU MONEY.<br />KNOW WHAT TO DO NEXT.
          </h2>
          <p className="text-sm text-slate-100 font-semibold leading-relaxed">
            Create your zero-spreadsheet workspace today to recover delayed cash flow assets easily.
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
            <Image 
              src="/icon.png" 
              alt="DueBlink Icon" 
              width={144} 
              height={144} 
              priority 
              className="w-28 h-28 sm:w-32 sm:h-32 object-contain" 
            />
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-xl font-extrabold text-[#1C2E8F] uppercase tracking-tight">
              Get Started Free
            </h3>
          </div>

          <form className="space-y-4" onSubmit={handleSignupSubmit}>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            
            <div>
              <label className="block text-xs font-bold uppercase text-[#475569] mb-1.5 tracking-wide text-left">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/20 focus:bg-white text-[#0F172A]" placeholder="John Doe" />
              </div>
            </div>

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
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/20 focus:bg-white text-[#0F172A]" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] text-white text-sm font-bold rounded-xl hover:opacity-95 transition shadow-lg shadow-[#1C2E8F]/20 cursor-pointer mt-2 disabled:opacity-70"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs font-semibold text-slate-400 mt-6 pt-4 border-t border-slate-100">
            Already have an account?{' '}
            <Link href="/login" className="font-bold hover:underline bg-clip-text text-transparent bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8]">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}