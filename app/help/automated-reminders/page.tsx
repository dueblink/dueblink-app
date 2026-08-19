'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Zap, Menu, X, ChevronDown, ArrowRight, ShieldCheck, Clock, BellRing } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AutomatedRemindersPage() {
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
    <div className="min-h-screen bg-white text-[#0F172A] antialiased selection:bg-[#20B8BE]/20" suppressHydrationWarning={true}>
      
      {/* --- GLOBAL STICKY HEADER BAR WITH ANIMATED ACTIVE INDICATOR --- */}
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

      {/* --- HERO SECTION --- */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden bg-white pt-16 pb-12 border-b border-slate-50 text-center"
        suppressHydrationWarning={true}
      >
        <div className="absolute top-[-10%] left-[5%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#1C2E8F]/10 to-transparent blur-3xl opacity-70" suppressHydrationWarning={true}></div>
        <div className="absolute bottom-[10%] right-[-5%] -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#2BB6A8]/10 to-transparent blur-3xl opacity-60" suppressHydrationWarning={true}></div>

        <div className="max-w-4xl mx-auto px-4 space-y-6" suppressHydrationWarning={true}>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-3xs mx-auto select-none" suppressHydrationWarning={true}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2BB6A8] animate-pulse shrink-0" />
            <span className="text-[#0F172A] font-bold">Automated Reminders</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] uppercase leading-[1.2]" suppressHydrationWarning={true}>
            How Automated Reminders <span className="bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] bg-clip-text text-transparent">Work</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto leading-relaxed" suppressHydrationWarning={true}>
            Set up your client once and let DueBlink handle the follow-up automatically in the background.
          </p>
        </div>
      </motion.section>

      {/* --- THE PROCESS (HOW IT WORKS) --- */}
      <section className="bg-white py-16 sm:py-20 border-b border-slate-100 px-4" suppressHydrationWarning={true}>
        <div className="max-w-6xl mx-auto space-y-12" suppressHydrationWarning={true}>
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#20B8BE]">The Process</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight uppercase">How It Works</h2>
            <p className="text-sm text-slate-500 font-medium">From adding a client to receiving payment, DueBlink manages the process seamlessly.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              { num: "01", title: "Add Your Client", desc: "Enter your client's name, amount, and due date into your dashboard." },
              { num: "02", title: "Enable Automation", desc: "Turn on Automated Reminders with a single toggle switch." },
              { num: "03", title: "DueBlink Follows Up", desc: "Our system checks automatically and sends the appropriate reminder on schedule." }
            ].map((step, idx) => (
              <div key={idx} className="bg-[#FAFBFD] border border-slate-200/70 rounded-2xl p-6 space-y-4 shadow-3xs flex flex-col justify-between">
                <span className="text-sm font-black text-[#20B8BE]">{step.num}</span>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#0F172A]">{step.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- REMINDER SCHEDULE --- */}
      <section className="bg-slate-50/50 py-16 sm:py-20 border-b border-slate-100 px-4" suppressHydrationWarning={true}>
        <div className="max-w-6xl mx-auto space-y-12 text-center" suppressHydrationWarning={true}>
          <div className="space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#20B8BE]">Reminder Schedule</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight uppercase">Three Reminders. One Simple Sequence.</h2>
            <p className="text-sm text-slate-500 font-medium">Each reminder is sent separately according to its structured timeline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { day: "DAY 0", title: "First Reminder", desc: "Sent on the client's due date when the payment reminder becomes eligible." },
              { day: "DAY +3", title: "Follow-up", desc: "Sent three days after the due date if the invoice is still pending." },
              { day: "DAY +7", title: "Final Reminder", desc: "Sent seven days after the due date with a firm, professional tone." }
            ].map((sch, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-3xs space-y-3">
                <span className="inline-block px-3 py-1 bg-teal-50 text-[#20B8BE] text-[10px] font-black rounded-full uppercase tracking-wider">{sch.day}</span>
                <h4 className="text-lg font-bold text-[#0F172A]">{sch.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{sch.desc}</p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto bg-white border border-[#20B8BE]/20 rounded-2xl p-4 text-xs font-medium text-slate-600 shadow-3xs">
            <strong className="text-[#0F172A]">Example:</strong> If a due date is August 20, reminders are scheduled for August 20, August 23, and August 27.
          </div>
        </div>
      </section>

      {/* --- TIMING & BACKGROUND AUTOMATION --- */}
      <section className="bg-white py-16 sm:py-20 border-b border-slate-100 px-4" suppressHydrationWarning={true}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left" suppressHydrationWarning={true}>
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#20B8BE]">Timing & Background</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight uppercase">You Don't Need to Keep DueBlink Open</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Once automated reminders are enabled, they run in the background. You can close your browser, leave your dashboard, or turn off your computer entirely.
            </p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              DueBlink automatically checks for due reminders and dispatches them securely via our email delivery infrastructure within seconds.
            </p>
          </div>

          <div className="bg-[#FAFBFD] border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-3xs">
            {[
              { title: "Automatic Checking", desc: "Our background cron jobs continuously monitor pending client due dates." },
              { title: "Smart Stage Tracking", desc: "The system ensures duplicate emails are never sent for the same stage." },
              { title: "Instant Delivery", desc: "Emails arrive in your client's inbox cleanly formatted with payment links." }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20B8BE]" /> {item.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium pl-3">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PAYMENT & IMPORTANT DETAILS --- */}
      <section className="bg-slate-50/40 py-16 sm:py-20 border-b border-slate-100 px-4" suppressHydrationWarning={true}>
        <div className="max-w-6xl mx-auto space-y-12 text-left" suppressHydrationWarning={true}>
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#20B8BE]">Payments & Rules</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight uppercase">What Happens When You Get Paid?</h2>
            <p className="text-sm text-slate-500 font-medium">As soon as a client pays, mark them as Paid and reminders stop instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-3">
              <h4 className="text-base font-bold text-[#0F172A]">Mark Paid from Dashboard</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Open your dashboard, locate the client, and mark the status as Paid. All future automated reminder sequences for that client halt immediately.
              </p>
            </div>

            <div className="bg-white border border-[#20B8BE]/30 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-3 relative">
              <span className="absolute top-6 right-6 px-2.5 py-0.5 bg-teal-50 text-[#20B8BE] text-[10px] font-black rounded-md uppercase tracking-wider">Pro</span>
              <h4 className="text-base font-bold text-[#0F172A]">One-Click Payment Update</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Summary status notifications sent to business owners include secure action tokens, allowing you to update payment status directly from your email notifications.
              </p>
            </div>
          </div>

          {/* Important Rules Grid */}
          <div className="pt-8 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">Important Things to Know</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Only clients with active automated reminders are included.",
                "Paid clients are automatically excluded from future runs.",
                "Reminders are sent sequentially, never all at once.",
                "Including a payment link in client profiles is optional.",
                "Automated reminders are securely dispatched via email.",
                "The automated sequence ends cleanly after the final reminder."
              ].map((rule, idx) => (
                <div key={idx} className="bg-white border border-slate-200/70 rounded-2xl p-4 text-xs font-medium text-slate-600 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#20B8BE] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA SECTION --- */}
      <section className="bg-white py-16 sm:py-20 px-4" suppressHydrationWarning={true}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#245B92] to-[#20B8BE] rounded-[32px] p-6 sm:p-12 text-center text-white relative shadow-lg overflow-hidden" suppressHydrationWarning={true}>
            <div className="text-4xl mb-6">⚡</div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
              Stop Chasing. Let DueBlink Follow Up.
            </h2>
            <p className="text-sm sm:text-base font-medium text-white/90 max-w-xl mx-auto leading-relaxed mb-8">
              Automate your payment follow-ups today and spend less time remembering who needs to be contacted.
            </p>
            <button 
              onClick={() => router.push('/create-account')} 
              className="inline-flex items-center gap-2 bg-white text-[#245B92] px-8 py-3.5 rounded-xl font-black text-sm hover:bg-slate-50 transition cursor-pointer shadow-3xs"
            >
              Get Started Free <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* --- GLOBAL FOOTER WITH ANIMATION --- */}
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