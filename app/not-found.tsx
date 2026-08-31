'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Home, 
  HelpCircle, 
  Search, 
  LayoutDashboard, 
  ChevronDown, 
  Menu, 
  X,
  FileText
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function NotFoundPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem('user_authenticated', 'true');
      } else {
        localStorage.removeItem('user_authenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('has_created_account');
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased selection:bg-[#20B8BE]/20 flex flex-col justify-between" suppressHydrationWarning={true}>
      
      {/* --- GLOBAL STICKY HEADER BAR --- */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 shadow-3xs" suppressHydrationWarning={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-32 flex items-center justify-between" suppressHydrationWarning={true}>
          
          {/* LOGO */}
          <motion.div 
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex items-center justify-start cursor-pointer h-28 w-[380px] sm:w-[500px] relative select-none" 
            onClick={() => router.push('/')} 
            suppressHydrationWarning={true}
          >
            <img src="/logo.png" alt="DueBlink Logo" className="h-full w-full object-contain object-left" suppressHydrationWarning={true} />
          </motion.div>

          {/* DESKTOP NAV LINKS & AUTH BUTTONS */}
          <div className="hidden md:flex items-center gap-8" suppressHydrationWarning={true}>
            
            {/* Center Navigation Links */}
            <div className="flex items-center gap-6 text-sm font-bold text-slate-600" suppressHydrationWarning={true}>
              
              {/* Pricing Link */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative py-2 px-3 cursor-pointer transition-colors duration-200 group ${pathname === '/pricing' ? 'text-[#245B92]' : 'hover:text-[#245B92]'}`} 
                onClick={() => router.push('/pricing')} 
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Pricing</span>
                {pathname === '/pricing' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.25, ease: "easeInOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.div>

              {/* Contact Link */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative py-2 px-3 cursor-pointer transition-colors duration-200 group ${pathname === '/contact' ? 'text-[#245B92]' : 'hover:text-[#245B92]'}`} 
                onClick={() => router.push('/contact')} 
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Contact</span>
                {pathname === '/contact' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.25, ease: "easeInOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.div>

            </div>

            {/* DYNAMIC AUTH BUTTONS */}
            <div className="flex items-center gap-4" suppressHydrationWarning={true}>
              {pathname === '/login' ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} onClick={() => router.push('/create-account')} className="text-xs sm:text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>Create Account</motion.button>
              ) : !mounted ? (
                <div className="h-9 w-32" suppressHydrationWarning={true} />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => router.push('/dashboard')} 
                    className="px-4 py-2 text-sm font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 text-white hover:opacity-95"
                    style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                    suppressHydrationWarning={true}
                  >
                    Dashboard
                  </motion.button>
                  <div className="relative group py-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-[#245B92] transition cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-50" suppressHydrationWarning={true}>
                      Account <ChevronDown size={14} />
                    </motion.button>
                    <div className="absolute right-0 top-full w-40 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 hidden group-hover:block z-50">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer" suppressHydrationWarning={true}>Logout</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} onClick={() => router.push('/login')} className={`text-sm font-bold transition cursor-pointer px-3 py-2 rounded-xl ${pathname === '/login' ? 'bg-[#245B92]/10 text-[#245B92]' : 'text-slate-600 hover:text-[#245B92] hover:bg-slate-50'}`} suppressHydrationWarning={true}>Login</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} onClick={() => router.push('/create-account')} className="text-xs sm:text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>Create Account</motion.button>
                </>
              )}
            </div>

          </div>

          {/* MOBILE HAMBURGER TOGGLE */}
          <div className="flex md:hidden items-center">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>

        </div>

        {/* MOBILE DROPDOWN MENU */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-slate-100 bg-white px-6 py-6 space-y-4 shadow-xl overflow-hidden"
            >
              <div className="flex flex-col space-y-3 font-bold text-slate-700">
                <button onClick={() => { router.push('/pricing'); setMobileMenuOpen(false); }} className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/pricing' ? 'bg-slate-50 text-[#1C2E8F]' : 'text-[#1E293B] hover:bg-slate-50'}`}>Pricing</button>
                <button onClick={() => { router.push('/contact'); setMobileMenuOpen(false); }} className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/contact' ? 'bg-slate-50 text-[#1C2E8F]' : 'text-[#1E293B] hover:bg-slate-50'}`}>Contact</button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                {user ? (
                  <>
                    <button onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }} className="w-full py-3 text-center font-bold text-white bg-[#0F172A] rounded-xl shadow-xs hover:bg-[#245B92] transition">Dashboard</button>
                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full py-3 text-center font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition">Logout</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { router.push('/login'); setMobileMenuOpen(false); }} className="w-full py-3 text-center font-bold text-slate-700 bg-slate-50 rounded-xl hover:bg-slate-100 transition">Login</button>
                    <button onClick={() => { router.push('/create-account'); setMobileMenuOpen(false); }} className="w-full py-3 text-center font-bold text-white rounded-xl shadow-xs transition" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}>Create Account</button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- MAIN HERO SECTION --- */}
      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden bg-white py-16 sm:py-24 px-4 text-center my-auto"
        suppressHydrationWarning={true}
      >
        {/* Glow Effects */}
        <div className="absolute top-[10%] left-[10%] -z-10 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-[#1C2E8F]/10 to-transparent blur-3xl opacity-70" suppressHydrationWarning={true} />
        <div className="absolute bottom-[10%] right-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#2BB6A8]/10 to-transparent blur-3xl opacity-60" suppressHydrationWarning={true} />

        <div className="max-w-4xl mx-auto space-y-8" suppressHydrationWarning={true}>
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-3xs mx-auto select-none" suppressHydrationWarning={true}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="text-[#0F172A] font-bold">Error 404</span>
          </div>

          {/* Heading with Brand Gradient */}
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-8xl font-black tracking-tight bg-gradient-to-r from-[#1C2E8F] via-[#245B92] to-[#2BB6A8] bg-clip-text text-transparent select-none">
              404
            </h1>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#0F172A] uppercase leading-[1.2]" suppressHydrationWarning={true}>
              Page <span className="bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] bg-clip-text text-transparent">Not Found</span>
            </h2>
          </div>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-lg mx-auto leading-relaxed" suppressHydrationWarning={true}>
            The page you’re looking for doesn’t exist, has been removed, or may have been relocated.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-8 py-3.5 text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
            >
              <ArrowLeft size={16} />
              Back to Home
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(user ? '/dashboard' : '/contact')}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-[#245B92] transition cursor-pointer shadow-3xs flex items-center justify-center gap-2"
            >
              {user ? <LayoutDashboard size={16} /> : <HelpCircle size={16} />}
              {user ? 'Go to Dashboard' : 'Contact Support'}
            </motion.button>
          </div>

          {/* Quick Helpful Links Grid */}
          <div className="pt-12 max-w-2xl mx-auto">
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-3xl p-6 sm:p-8 space-y-4 text-left shadow-3xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                Where would you like to go instead?
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl hover:border-[#245B92] transition text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#245B92] flex items-center justify-center shrink-0">
                    <Home size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#245B92]">Home</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Main Landing Page</p>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/pricing')}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl hover:border-[#245B92] transition text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#20B8BE] flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#245B92]">Pricing</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Plans & Subscriptions</p>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/contact')}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl hover:border-[#245B92] transition text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <HelpCircle size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#245B92]">Contact</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Get Support</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
      </motion.main>

      {/* --- GLOBAL FOOTER --- */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-white py-12 border-t border-slate-200 px-6"
        suppressHydrationWarning={true}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left" suppressHydrationWarning={true}>
            
          <div className="flex flex-col items-center md:items-start gap-2" suppressHydrationWarning={true}>
            <div className="h-24 sm:h-32 w-[380px] flex items-center justify-center md:justify-start" suppressHydrationWarning={true}>
              <img src="/logo.png" alt="DueBlink Logo" className="h-full w-full object-contain object-left" suppressHydrationWarning={true} />
            </div>
            <div className="text-xs font-bold text-slate-500 leading-relaxed" suppressHydrationWarning={true}>
              Know who owes you money.<br />Know exactly what to do next.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold uppercase tracking-wider text-slate-500" suppressHydrationWarning={true}>
            <a href="/privacy" className="text-slate-500 hover:text-black transition-colors" suppressHydrationWarning={true}>Privacy</a>
            <a href="/terms" className="text-slate-500 hover:text-black transition-colors" suppressHydrationWarning={true}>Terms</a>
            <a href="/refund-policy" className="text-slate-500 hover:text-black transition-colors" suppressHydrationWarning={true}>Refunds</a>
            <a href="/contact" className="text-slate-500 hover:text-black transition-colors" suppressHydrationWarning={true}>Contact</a>
          </div>
            
          <div className="flex flex-col items-center md:items-end gap-1 text-xs font-bold uppercase tracking-wider text-slate-400" suppressHydrationWarning={true}>
            <a href="mailto:support@dueblink.com" className="text-slate-500 hover:text-black transition-colors normal-case lowercase font-medium" suppressHydrationWarning={true}>
              support@dueblink.com
            </a>
            <span suppressHydrationWarning={true}>© 2026 DueBlink</span>
          </div>
            
        </div>
      </motion.footer>

    </div>
  );
}