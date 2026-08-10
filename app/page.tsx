'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Users, TrendingUp, Check, Sparkles, Clock, X,
  Mail, MessageCircle, RefreshCw, Send, Copy, AlertTriangle, Brain, FileSpreadsheet, FileText,
  Target, Clipboard, Zap, Briefcase, HelpCircle, ChevronDown, Activity, Bot, CheckCircle2, ArrowRight, Menu
} from 'lucide-react';
// IMPORT FIREBASE
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import FloatingRobot from '@/components/FloatingRobot';

export default function LandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Auth & Pro State
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync pro status from localStorage and event listeners
  useEffect(() => {
    setMounted(true);
    
    const checkProStatus = () => {
      const isAuthed = localStorage.getItem('user_authenticated') === 'true' || auth.currentUser !== null;
      if (!isAuthed) {
        setIsPro(false);
        return;
      }

      const isProActive = 
        localStorage.getItem('dueblink_is_pro') === 'true' || 
        localStorage.getItem('dueblink_pro_active') === 'true';
      setIsPro(isProActive);
    };
    
    checkProStatus();

    const handleProUpdate = () => {
      checkProStatus();
    };

    window.addEventListener('pro-status-updated', handleProUpdate);
    window.addEventListener('storage', handleProUpdate);

    return () => {
      window.removeEventListener('pro-status-updated', handleProUpdate);
      window.removeEventListener('storage', handleProUpdate);
    };
  }, []);

  // App Tracker Memory State
  const [reminderCount, setReminderCount] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Dynamic limit: 15 for logged-in users, 5 for non-logged-in/guests. Unlimited if Pro.
  const maxLimit = isPro ? 999999 : (user ? 15 : 5);
  const limitReached = !isPro && reminderCount >= maxLimit;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  // Interactive local generator variables
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('₹ INR');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [daysOverdue, setDaysOverdue] = useState('7');
  const [tone, setTone] = useState('professional');

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ email_subject: string; email_body: string; whatsapp_message: string; sms_text: string; psychology_note: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'sms' | 'strategy'>('email');
  const [copied, setCopied] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const generatorSectionRef = useRef<HTMLDivElement>(null);

  const [isAtTop, setIsAtTop] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  const titles = [
    "AI Payment Recovery Assistant",
    "Smart Invoice Tracking",
    "Automated Client Reminders",
    "Zero-Spreadsheet Workflow"
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Close mobile menu on route change or resize
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Effect: Auth listener with immediate state syncing & cross-tab updates + Monthly 15-reminder cycle reset logic
  useEffect(() => {
    const checkAuth = () => {
      const currentAuthUser = auth.currentUser;
      setUser(currentAuthUser);
      if (!currentAuthUser && localStorage.getItem('user_authenticated') !== 'true') {
        setIsPro(false);
        localStorage.removeItem('dueblink_is_pro');
        localStorage.removeItem('dueblink_pro_active');
      }
    };
    checkAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem('user_authenticated', 'true');
      } else {
        localStorage.removeItem('user_authenticated');
        localStorage.removeItem('dueblink_is_pro');
        localStorage.removeItem('dueblink_pro_active');
        setIsPro(false);
      }
    });

    // Monthly Cycle Refill Logic Check
    const currentMonthKey = new Date().toISOString().slice(0, 7); // Format: 'YYYY-MM'
    const savedMonthKey = localStorage.getItem('dueblink_reminder_month');

    if (savedMonthKey !== currentMonthKey) {
      localStorage.setItem('dueblink_reminder_month', currentMonthKey);
      localStorage.setItem('dueblink_free_reminders', '0');
      setReminderCount(0);
    }

    const handleStorageChange = () => {
      checkAuth();
      const isAuthed = auth.currentUser !== null || localStorage.getItem('user_authenticated') === 'true';
      if (!isAuthed) {
        setIsPro(false);
        return;
      }

      if (localStorage.getItem('dueblink_is_pro') === 'true' || localStorage.getItem('dueblink_pro_active') === 'true') {
        setIsPro(true);
      } else {
        setIsPro(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('dueblink_is_pro');
      localStorage.removeItem('dueblink_pro_active');
      setUser(null);
      setIsPro(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Effect: Scroll Tracking & Active Section detection with clean boundary checks
  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 100);

      if (window.scrollY < 200) {
        setActiveSection('');
        return;
      }

      const sections = ['features', 'faq'];
      const scrollPosition = window.scrollY + 250;

      let currentActive = '';
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentActive = sectionId;
            break;
          }
        }
      }
      setActiveSection(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect: Hero Typing Animation
  useEffect(() => {
    const i = loopNum % titles.length;
    const fullText = titles[i];
    const handleType = () => {
      setDisplayedText(prev => 
        isDeleting
          ? fullText.substring(0, prev.length - 1) 
          : fullText.substring(0, prev.length + 1)
      );
      if (!isDeleting && displayedText === fullText) setTimeout(() => setIsDeleting(true), 2000);
      else if (isDeleting && displayedText === "") { setIsDeleting(false); setLoopNum(prev => prev + 1); }
    };
    const timer = setTimeout(handleType, isDeleting ? 30 : 80);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, loopNum, titles]);

  // Effect: Local Storage Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCount = localStorage.getItem('dueblink_free_reminders');
      if (savedCount) setReminderCount(parseInt(savedCount, 10));
    }
  }, []);

  const getStageLabel = () => {
    if (tone === 'gentle') return 'Stage 1 · Gentle Reminder';
    if (tone === 'firm') return 'Stage 3 · Firm Reminder';
    return 'Stage 2 · Professional Follow-Up';
  };

  const handleAssistantCta = () => {
    if (isPro || user) {
      router.push('/dashboard');
    } else {
      router.push('/pricing');
    }
  };

  const handleToneChange = (selectedTone: string) => {
    setTone(selectedTone);
    if (selectedTone === 'gentle') setDaysOverdue('7');
    else if (selectedTone === 'professional') setDaysOverdue('14');
    else if (selectedTone === 'firm') setDaysOverdue('21');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !amount) {
      alert("Please fill in Client Name and Amount Due!"); 
      return;
    }
    if (limitReached) { handleOpenActionModal(user ? 'Member Limit Reached' : 'Free Limit Reached'); return; }
     
    setIsGenerating(true);
    setResult(null);
     
    try {
      const response = await fetch('/api/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientName, 
          amount, 
          currency, 
          invoiceRef: invoiceRef || 'INV-2026-042', 
          daysOverdue, 
          tone 
        }),
      });
       
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${data.details || 'Unknown error'}`);
      }

      setResult(data);
      if (!isPro) {
        const nextCount = reminderCount + 1;
        setReminderCount(nextCount);
        localStorage.setItem('dueblink_free_reminders', nextCount.toString());
      }
    } catch (error) {
      console.error("AI GENERATION ERROR:", error);
      alert("AI generation failed. Check F12 console for the specific error.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleScrollToGenerator = () => { generatorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const handleOpenActionModal = (title: string) => { setModalTitle(title); setIsModalOpen(true); };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (pathname !== '/') {
          router.push(`/#${id}`);
          return;
        }
        const element = document.getElementById(id);
        if (element) {
          const yOffset = -90;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50);
    });
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased selection:bg-[#20B8BE]/20" suppressHydrationWarning={true}>
       
      {/* --- GLOBAL STICKY HEADER BAR WITH FEATURES, FAQ, CONTACT, PRICING & INDEPENDENT ACTIVE INDICATORS --- */}
      <nav className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-200 shadow-3xs" suppressHydrationWarning={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-32 flex items-center justify-between" suppressHydrationWarning={true}>
            
          {/* LOGO */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center justify-start cursor-pointer h-28 w-[380px] sm:w-[500px] relative select-none" 
            onClick={() => router.push('/')} 
            suppressHydrationWarning={true}
          >
            <img src="/logo.png" alt="DueBlink Logo" className="h-full w-full object-contain object-left" suppressHydrationWarning={true} />
          </motion.div>

          {/* DESKTOP NAV LINKS & AUTH BUTTONS */}
          <div className="hidden md:flex items-center gap-8" suppressHydrationWarning={true}>
            <div className="flex items-center gap-6 text-sm font-bold" suppressHydrationWarning={true}>
               
              {/* Features Link */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollToSection('features')} 
                className={`relative py-2 px-3 transition-colors duration-150 cursor-pointer font-bold group ${activeSection === 'features' && pathname === '/' ? 'text-[#245B92]' : 'text-slate-600 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Features</span>
                {activeSection === 'features' && pathname === '/' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.2, ease: "easeOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-150 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.button>

              {/* FAQ Link */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollToSection('faq')} 
                className={`relative py-2 px-3 transition-colors duration-150 cursor-pointer font-bold group ${activeSection === 'faq' && pathname === '/' ? 'text-[#245B92]' : 'text-slate-600 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>FAQ</span>
                {activeSection === 'faq' && pathname === '/' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.2, ease: "easeOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-150 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.button>

              {/* Pricing Link */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/pricing')} 
                className={`relative py-2 px-3 transition-colors duration-150 cursor-pointer font-bold group ${pathname === '/pricing' ? 'text-[#245B92]' : 'text-slate-600 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Pricing</span>
                {pathname === '/pricing' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.2, ease: "easeOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-150 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.button>

              {/* Contact Link */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/contact')} 
                className={`relative py-2 px-3 transition-colors duration-150 cursor-pointer font-bold group ${pathname === '/contact' ? 'text-[#245B92]' : 'text-slate-600 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Contact</span>
                {pathname === '/contact' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.2, ease: "easeOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-150 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.button>
          </div>

          <div className="flex items-center gap-4" suppressHydrationWarning={true}>
            {pathname === '/login' ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} onClick={() => router.push('/create-account')} className="text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>Create Account</motion.button>
            ) : !mounted ? (
              <div className="h-9 w-32" suppressHydrationWarning={true} />
            ) : user ? (
              <div className="flex items-center gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => router.push('/dashboard')} 
                  className="relative px-4 py-2 text-sm font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 text-white hover:opacity-95"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                  suppressHydrationWarning={true}
                >
                  Open Dashboard 
                  {isPro && <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider ml-1">PRO</span>}
                </motion.button>
                <div className="relative group py-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} className={`flex items-center gap-1.5 text-sm font-bold transition cursor-pointer px-3 py-2 rounded-xl ${pathname === '/account' ? 'bg-[#245B92]/10 text-[#245B92]' : 'text-slate-700 hover:text-[#245B92] hover:bg-slate-50'}`} suppressHydrationWarning={true}>
                    Account <ChevronDown size={14} />
                    {pathname === '/account' && (
                      <div className="absolute bottom-1 left-3 right-3 h-0.5 bg-[#245B92] rounded-full" />
                    )}
                  </motion.button>
                  <div className="absolute right-0 top-full w-40 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 hidden group-hover:block z-50">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer" suppressHydrationWarning={true}>Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} onClick={() => router.push('/login')} className={`text-sm font-bold transition cursor-pointer px-3 py-2 rounded-xl ${pathname === '/login' ? 'bg-[#245B92]/10 text-[#245B92]' : 'text-slate-600 hover:text-[#245B92] hover:bg-slate-50'}`} suppressHydrationWarning={true}>Login</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} onClick={() => router.push('/create-account')} className="text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>Create Account</motion.button>
              </>
          )}
          </div>
        </div>

        {/* MOBILE HAMBURGER TOGGLE BUTTON */}
      <div className="flex md:hidden items-center">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer focus:outline-none"
            aria-label="Toggle Menu"
            suppressHydrationWarning={true}
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden border-t border-slate-100 bg-white px-6 py-6 space-y-4 shadow-xl overflow-hidden"
            suppressHydrationWarning={true}
          >
            <div className="flex flex-col space-y-3 font-bold text-slate-700">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-left py-2 px-3 rounded-lg transition hover:bg-slate-50 font-bold text-[#1E293B]"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-left py-2 px-3 rounded-lg transition hover:bg-slate-50 font-bold text-[#1E293B]"
              >
                FAQ
              </button>
              <button 
                onClick={() => { router.push('/pricing'); setMobileMenuOpen(false); }}
                className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/pricing' ? 'bg-slate-50 text-[#1C2E8F]' : 'text-[#1E293B] hover:bg-slate-50'}`}
              >
                Pricing
              </button>
              <button 
                onClick={() => { router.push('/contact'); setMobileMenuOpen(false); }}
                className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/contact' ? 'bg-slate-50 text-[#1C2E8F]' : 'text-[#1E293B] hover:bg-slate-50'}`}
              >
                Contact
              </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {user ? (
              <>
                <button 
                  onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }}
                  className="w-full py-3 text-center font-bold text-white bg-[#0F172A] rounded-xl shadow-xs hover:bg-[#245B92] transition flex items-center justify-center gap-2"
                >
                  Open Dashboard {isPro && <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider">PRO</span>}
                </button>
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full py-3 text-center font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { router.push('/login'); setMobileMenuOpen(false); }}
                  className="w-full py-3 text-center font-bold text-slate-700 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                >
                  Login
                </button>
                <button 
                  onClick={() => { router.push('/create-account'); setMobileMenuOpen(false); }}
                  className="w-full py-3 text-center font-bold text-white rounded-xl shadow-xs transition"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </nav>

    {/* --- SECTION 1: HERO ZONE WITH SMOOTH REVEAL --- */}
<motion.section
  id="hero"
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
  className="relative overflow-hidden bg-white pt-12 sm:pt-16 pb-20 sm:pb-24 border-b border-slate-50 px-4"
  suppressHydrationWarning={true}
>
  <div
    className="absolute top-[-10%] left-[5%] -z-10 h-[300px] sm:h-[500px] w-[300px] sm:w-[500px] rounded-full bg-gradient-to-tr from-[#1C2E8F]/10 to-transparent blur-3xl opacity-70"
    suppressHydrationWarning={true}
  />

  <div
    className="absolute bottom-[10%] right-[-5%] -z-10 h-[350px] sm:h-[600px] w-[350px] sm:w-[600px] rounded-full bg-gradient-to-br from-[#2BB6A8]/10 to-transparent blur-3xl opacity-60"
    suppressHydrationWarning={true}
  />

  <div
    className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8"
    suppressHydrationWarning={true}
  >

    {/* HERO BADGE */}
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-3xs mx-auto select-none min-h-[36px] max-w-full overflow-hidden"
      suppressHydrationWarning={true}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-[#2BB6A8] animate-pulse shrink-0"
        suppressHydrationWarning={true}
      />

      <span
        className="text-[#0F172A] font-bold whitespace-nowrap"
        suppressHydrationWarning={true}
      >
        🚀 DueBlink ·
      </span>

      <span
        className="text-[#2BB6A8] font-bold truncate max-w-[180px] sm:max-w-none text-left"
        suppressHydrationWarning={true}
      >
        {displayedText}

        <span
          className="animate-pulse ml-0.5 border-r-2 border-[#2BB6A8] h-3 inline-block"
          suppressHydrationWarning={true}
        />
      </span>
    </div>

    {/* HERO HEADING */}
    <h1
      className="text-3xl sm:text-5xl lg:text-7xl font-[800] tracking-[-0.025em] text-[#0F172A] uppercase leading-[1.05] sm:leading-[0.98]"
      suppressHydrationWarning={true}
    >
      STOP CHASING CLIENTS. <br />

      <span
        className="bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] bg-clip-text text-transparent"
        suppressHydrationWarning={true}
      >
        GET PAID FASTER.
      </span>
    </h1>

    {/* SUPPORTING HEADLINE */}
    <div
      className="max-w-2xl mx-auto space-y-1 sm:space-y-2 pt-2 text-sm sm:text-base font-semibold text-slate-600"
      suppressHydrationWarning={true}
    >
      <p
        className="text-slate-400 font-medium lowercase"
        suppressHydrationWarning={true}
      >
        Stop using spreadsheets. Stop forgetting follow-ups.
      </p>

      <p
        className="text-base sm:text-lg text-[#1C2E8F] font-bold"
        suppressHydrationWarning={true}
      >
        Start getting paid faster.
      </p>
    </div>

    {/* DESCRIPTION */}
    <p
      className="text-sm sm:text-lg text-[#475569] font-medium max-w-xl mx-auto leading-relaxed px-2"
      suppressHydrationWarning={true}
    >
      Generate professional payment reminders, track unpaid invoices, and recover payments faster with AI.
    </p>

    {/* CTA */}
    <div
      className="pt-2 sm:pt-4 flex flex-col items-center justify-center gap-4 px-4"
      suppressHydrationWarning={true}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() =>
          (isPro || user)
            ? router.push("/dashboard")
            : handleScrollToGenerator()
        }
        style={{
          background: "linear-gradient(to right, #245B92, #20B8BE)",
        }}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 hover:opacity-95 text-white font-bold text-sm sm:text-base px-8 sm:px-10 py-4 rounded-xl transition shadow-xs cursor-pointer"
        suppressHydrationWarning={true}
      >
        {isPro ? (
          <>
            Open Dashboard

            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs uppercase font-extrabold tracking-wider ml-1">
              PRO
            </span>
          </>
        ) : user ? (
          "Open Dashboard"
        ) : (
          "Try 5 AI Reminders Free"
        )}
      </motion.button>

      {/* TRUST POINTS */}
      {!user && (
        <div
          className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-8 pt-2 text-xs font-bold text-[#475569] uppercase tracking-wider"
          suppressHydrationWarning={true}
        >
          <span
            className="flex items-center gap-1.5"
            suppressHydrationWarning={true}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#2BB6A8]"
              suppressHydrationWarning={true}
            />
            No Credit Card Required
          </span>

          <span
            className="flex items-center gap-1.5"
            suppressHydrationWarning={true}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#2BB6A8]"
              suppressHydrationWarning={true}
            />
            5 Free AI Reminders
          </span>

          <span
            className="flex items-center gap-1.5"
            suppressHydrationWarning={true}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#2BB6A8]"
              suppressHydrationWarning={true}
            />
            Email + WhatsApp
          </span>
        </div>
      )}
  </div>
  </div>
</motion.section>

    {/* --- SECTION 2: EXPLAINER PAIN POINTS WITH PREMIUM ANIMATION --- */}
<motion.section 
  id="late-payments"
  initial={{ opacity: 0, y: 15 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.3, ease: "easeOut" }}
  className="bg-white py-16 sm:py-20 border-b border-slate-100 px-4"
  suppressHydrationWarning={true}
>
  <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-10" suppressHydrationWarning={true}>
        
    <div className="space-y-3" suppressHydrationWarning={true}>
      <div className="text-4xl select-none" suppressHydrationWarning={true}>💡</div>

      <h2
        className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight uppercase"
        suppressHydrationWarning={true}
      >
        Late Payments Don't Just Delay Money.<br />
        <span
          className="bg-gradient-to-r from-red-600 to-amber-600 bg-clip-text text-transparent"
          suppressHydrationWarning={true}
        >
          They Kill Cash Flow.
        </span>
      </h2>

      <p className="text-sm sm:text-base text-slate-500 font-medium max-w-2xl mx-auto px-2" suppressHydrationWarning={true}>
        You finished the work. You delivered the project. You sent the invoice. Now you're wondering...
      </p>
    </div>

    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
      }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left"
      suppressHydrationWarning={true}
    >
      {[
        "Did I already follow up?", 
        "Which clients haven't paid?", 
        "How much am I still owed?", 
        "What should I do next?"
      ].map((question, qIdx) => (
        <motion.div 
          key={qIdx}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
          }}
          className="flex items-center gap-3.5 bg-white border border-slate-200/85 rounded-2xl p-4 shadow-3xs transition hover:border-amber-300 hover:shadow-xs group"
          suppressHydrationWarning={true}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-100/60 transition" suppressHydrationWarning={true}>
            <AlertTriangle className="w-4 h-4" suppressHydrationWarning={true} />
          </div>
          <span className="text-sm font-semibold text-slate-700 tracking-wide" suppressHydrationWarning={true}>{question}</span>
        </motion.div>
      ))}
    </motion.div>

    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="max-w-3xl mx-auto border border-slate-100 rounded-3xl p-6 sm:p-8 bg-slate-50/40 space-y-6"
      suppressHydrationWarning={true}
    >
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest" suppressHydrationWarning={true}>
        Most Freelancers and Agencies Manage This With:
      </p>
        
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" suppressHydrationWarning={true}>
        {["Excel", "WhatsApp", "Email", "Memory"].map((tool, i) => (
          <motion.span 
            key={tool}
            whileHover={{ scale: 1.02 }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-3xs text-xs font-bold text-slate-600 flex items-center gap-2 cursor-default"
            suppressHydrationWarning={true}
          >
            {i === 0 && <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" suppressHydrationWarning={true} />}
            {i === 1 && <MessageCircle className="w-3.5 h-3.5 text-green-500" suppressHydrationWarning={true} />}
            {i === 2 && <Mail className="w-3.5 h-3.5 text-blue-500" suppressHydrationWarning={true} />}
            {i === 3 && <Brain className="w-3.5 h-3.5 text-purple-500" suppressHydrationWarning={true} />}
            {tool}
          </motion.span>
        ))}
      </div>
        
      <div className="space-y-3 pt-4 text-sm font-semibold text-slate-600 border-t border-slate-200/60 max-w-xl mx-auto" suppressHydrationWarning={true}>
        <p className="text-slate-700 font-medium" suppressHydrationWarning={true}>
          Small follow-up mistakes become big cash flow problems.
        </p>
        <p className="text-[#0F172A] font-medium leading-relaxed" suppressHydrationWarning={true}>
          DueBlink keeps every payment organized, every reminder on time, and every client accounted for.
        </p>
        <div className="pt-4 flex flex-col items-center justify-center gap-3 text-xs font-bold" suppressHydrationWarning={true}>
          <div className="w-full max-w-md px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 shadow-3xs flex items-center justify-center gap-2" suppressHydrationWarning={true}>
            <span>Excel + WhatsApp + Memory = Confusion</span>
          </div>
          <div className="text-[#2BB6A8] text-base font-black" suppressHydrationWarning={true}>↓</div>
          <div className="w-full max-w-md px-4 py-3 rounded-xl bg-white border border-[#2BB6A8]/40 text-[#245B92] shadow-3xs flex items-center justify-center gap-2 text-center" suppressHydrationWarning={true}>
            <span>One place to track clients, reminders, and payments.</span>
          </div>
        </div>
      </div>
    </motion.div>
        
  </div>
</motion.section>


    {/* --- SECTION 3: VALUE PROP 6-GRID WITH PREMIUM ANIMATION --- */}
    <motion.section 
    id="features"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3 }}
    className="bg-white py-16 sm:py-20 border-b border-slate-100 px-4 scroll-mt-24"
    suppressHydrationWarning={true}
    >
    <div className="max-w-6xl mx-auto text-center space-y-10 sm:space-y-12" suppressHydrationWarning={true}>
          
      <div className="space-y-3" suppressHydrationWarning={true}>
        <div className="text-4xl select-none" suppressHydrationWarning={true}>💡</div>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight" suppressHydrationWarning={true}>One place to recover payments.</h2>
        <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto leading-relaxed px-2" suppressHydrationWarning={true}>
          DueBlink is your Payment Recovery Assistant. Instead of manually chasing clients, DueBlink helps you:
        </p>
      </div>

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
            visible: { transition: { staggerChildren: 0.05 } }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
        suppressHydrationWarning={true}
      >
        {[
        { title: "Track Unpaid Clients", desc: "Know exactly who owes you money.", icon: <Users className="w-5 h-5 text-white" suppressHydrationWarning={true} /> },
        { title: "AI Reminder Generator", desc: "Generate professional Email & WhatsApp reminders instantly.", icon: <Sparkles className="w-5 h-5 text-white" suppressHydrationWarning={true} /> },
        { title: "Payment Tracking", desc: "Track Pending → Reminder Sent → Paid.", icon: <Activity className="w-5 h-5 text-white" suppressHydrationWarning={true} /> },
        { title: "AI Recovery Assistant (Pro)", desc: "AI recommends who to contact next and helps recover payments faster.", icon: <Bot className="w-5 h-5 text-white" suppressHydrationWarning={true} /> },
        { title: "Smart Follow-ups", desc: "Generate AI follow-up reminders in one click.", icon: <RefreshCw className="w-5 h-5 text-white" suppressHydrationWarning={true} /> },
        { title: "Recover Payments Faster", desc: "Recover payments sooner with AI-powered recommendations.", icon: <Zap className="w-5 h-5 text-white" suppressHydrationWarning={true} /> }
        ].map((card, cIdx) => (
        <motion.div 
          key={cIdx}
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
          }}
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-3xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow duration-150"
          suppressHydrationWarning={true}
        >
          <div style={{ background: 'linear-gradient(to bottom right, #245B92, #20B8BE)' }} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-3xs" suppressHydrationWarning={true}>
            {card.icon}
          </div>
          <div className="space-y-1" suppressHydrationWarning={true}>
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight" suppressHydrationWarning={true}>{card.title}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed" suppressHydrationWarning={true}>{card.desc}</p>
          </div>
        </motion.div>
        ))}
      </motion.div>

      <div className="pt-4" suppressHydrationWarning={true}>
        <p className="text-sm font-medium text-slate-400 italic" suppressHydrationWarning={true}>Everything you need to manage overdue payments in one place.</p>
      </div>
    </div>
    </motion.section>

    {/* --- DEDICATED AI RECOVERY ASSISTANT SECTION --- */}
    <section id="ai-recovery-assistant" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-100 relative overflow-hidden px-4" suppressHydrationWarning={true}>
    <div className="max-w-5xl mx-auto" suppressHydrationWarning={true}>
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-14 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" suppressHydrationWarning={true}>
            
      <div className="space-y-6" suppressHydrationWarning={true}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-[#2BB6A8] text-xs font-bold uppercase tracking-wider shadow-3xs" suppressHydrationWarning={true}>
          <Bot size={14} /> AI RECOVERY ASSISTANT (PRO)
        </div>

        <div className="space-y-2" suppressHydrationWarning={true}>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight" suppressHydrationWarning={true}>
            AI Recovery Assistant
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium" suppressHydrationWarning={true}>
            Your AI assistant that analyzes payments, recommends who to contact, and helps you recover money faster.
          </p>
        </div>

        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1" suppressHydrationWarning={true}>
          What it can do
        </p>

        <div className="space-y-3 pt-1" suppressHydrationWarning={true}>
          {[
            "Recommending who to contact today",
            "Generating AI follow-up reminders",
            "Rewriting reminders professionally",
            "Finding overdue clients",
            "Summarizing outstanding payments",
            "Suggesting the next best action"
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm font-semibold text-slate-700" suppressHydrationWarning={true}>
              <CheckCircle2 size={16} className="text-[#2BB6A8] shrink-0" suppressHydrationWarning={true} />
              <span suppressHydrationWarning={true}>{item}</span>
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold text-slate-400 italic pt-1" suppressHydrationWarning={true}>
          Available with DueBlink Pro.
        </p>

        <div className="pt-2" suppressHydrationWarning={true}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAssistantCta}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white text-sm shadow-xs transition hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
            suppressHydrationWarning={true}
          >
            {isPro ? 'Open Dashboard' : !user ? 'Create Free Account' : 'Upgrade to Pro'} <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl border border-slate-800 space-y-6" suppressHydrationWarning={true}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4" suppressHydrationWarning={true}>
          <div className="flex items-center gap-2.5" suppressHydrationWarning={true}>
            <div className="w-3 h-3 rounded-full bg-[#2BB6A8] animate-pulse" suppressHydrationWarning={true} />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400" suppressHydrationWarning={true}>DueBlink AI Engine</span>
          </div>
          <span className="text-[10px] font-bold text-[#20B8BE] bg-[#20B8BE]/10 px-2.5 py-1 rounded-md" suppressHydrationWarning={true}>Pro Active</span>
        </div>

        <div className="space-y-4 text-xs font-medium text-slate-300" suppressHydrationWarning={true}>
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 space-y-2" suppressHydrationWarning={true}>
            <p className="text-[#20B8BE] font-bold uppercase text-[10px]" suppressHydrationWarning={true}>Today's Priority</p>
            <p className="text-white font-bold" suppressHydrationWarning={true}>ABC Agency</p>
            <p className="text-amber-400 font-semibold" suppressHydrationWarning={true}>₹25,000 Due · 15 Days Overdue</p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 space-y-2" suppressHydrationWarning={true}>
            <p className="text-[#20B8BE] font-bold uppercase text-[10px]" suppressHydrationWarning={true}>AI Recommendation</p>
            <p suppressHydrationWarning={true}>Send a Professional Follow-up</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="w-full py-2.5 bg-[#20B8BE] text-white font-black rounded-lg text-xs text-center uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-3xs">
            <Sparkles size={13} /> Generate Follow-up
          </div>
        </div>
      </div>

    </div>
  </div>
  </section>

    {/* --- SECTION 4: WORKSPACE DASHBOARD VIEW WITH ANIMATION --- */}
    <motion.section 
    id="dashboard-preview"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3 }}
    className="bg-slate-50/40 py-16 sm:py-20 border-b border-slate-100 px-4"
    suppressHydrationWarning={true}
    >
    <div className="max-w-6xl mx-auto text-center space-y-10" suppressHydrationWarning={true}>
      <div className="space-y-2" suppressHydrationWarning={true}>
        <div className="text-3xl sm:text-4xl select-none mb-1" suppressHydrationWarning={true}>💻</div>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight" suppressHydrationWarning={true}>Everything You Need to Recover Payments</h2>
        <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto px-2" suppressHydrationWarning={true}>Track clients, generate reminders, monitor payments, and recover money faster—all from one dashboard.</p>
      </div>

      <div className="max-w-5xl mx-auto space-y-6" suppressHydrationWarning={true}>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
         visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
          suppressHydrationWarning={true}
        >
          {[
        { label: "Outstanding Amount", val: "₹85,000", border: "#245B92", icon: <Layers className="w-3.5 h-3.5 text-slate-400" suppressHydrationWarning={true} /> },
        { label: "Clients Awaiting Payment", val: "4", border: "#F59E0B", icon: <Users className="w-3.5 h-3.5 text-slate-400" suppressHydrationWarning={true} /> },
        { label: "Recovered This Month", val: "₹25,000", border: "#20B8BE", icon: <TrendingUp className="w-3.5 h-3.5 text-slate-400" suppressHydrationWarning={true} /> }
          ].map((stat, i) => (
        <motion.div 
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
          }}
          style={{ borderTop: `4px solid ${stat.border}` }} 
          className="bg-white border-x border-b border-slate-200/80 rounded-2xl p-6 shadow-3xs"
          suppressHydrationWarning={true}
        >
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1" suppressHydrationWarning={true}>
            {stat.icon} {stat.label}
          </div>
          <p className="text-3xl font-black text-[#0F172A] tracking-tight" suppressHydrationWarning={true}>{stat.val}</p>
        </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-3xs text-left overflow-x-auto"
          suppressHydrationWarning={true}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4" suppressHydrationWarning={true}>
        <h3 className="text-sm font-bold text-slate-800 tracking-tight" suppressHydrationWarning={true}>Client List</h3>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => user ? router.push('/dashboard') : handleScrollToGenerator()} 
          style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
          className="text-xs font-bold text-white px-3.5 py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-95 transition cursor-pointer shadow-3xs"
          suppressHydrationWarning={true}
        >
          <Sparkles className="w-3.5 h-3.5" suppressHydrationWarning={true} /> 
          <span>Open Dashboard</span>
        </motion.button>
        </div>
              
        <div className="divide-y divide-slate-100 min-w-[300px]" suppressHydrationWarning={true}>
        <div className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0" suppressHydrationWarning={true}>
          <div className="flex items-center gap-3" suppressHydrationWarning={true}>
            <div style={{ background: 'linear-gradient(to bottom right, #245B92, #20B8BE)' }} className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0" suppressHydrationWarning={true}>AA</div>
            <div suppressHydrationWarning={true}><h4 className="text-sm font-bold text-slate-800" suppressHydrationWarning={true}>ABC Agency</h4><p className="text-xs text-slate-400 font-medium" suppressHydrationWarning={true}>₹15,000</p></div>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0" suppressHydrationWarning={true}><span className="w-1 h-1 rounded-full bg-amber-500" suppressHydrationWarning={true} /> Pending</span>
        </div>
        <div className="py-4 flex items-center justify-between gap-4" suppressHydrationWarning={true}>
          <div className="flex items-center gap-3" suppressHydrationWarning={true}>
            <div style={{ background: 'linear-gradient(to bottom right, #245B92, #20B8BE)' }} className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0" suppressHydrationWarning={true}>GS</div>
            <div suppressHydrationWarning={true}><h4 className="text-sm font-bold text-slate-800" suppressHydrationWarning={true}>Growthify Solutions</h4><p className="text-xs text-slate-400 font-medium" suppressHydrationWarning={true}>₹25,000</p></div>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0" suppressHydrationWarning={true}><span className="w-1 h-1 rounded-full bg-blue-500" suppressHydrationWarning={true} /> Reminder Sent</span>
        </div>
        <div className="py-4 flex items-center justify-between gap-4" suppressHydrationWarning={true}>
          <div className="flex items-center gap-3" suppressHydrationWarning={true}>
            <div style={{ background: 'linear-gradient(to bottom right, #245B92, #20B8BE)' }} className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0" suppressHydrationWarning={true}>B</div>
            <div suppressHydrationWarning={true}><h4 className="text-sm font-bold text-slate-800" suppressHydrationWarning={true}>BrightLabs</h4><p className="text-xs text-slate-400 font-medium" suppressHydrationWarning={true}>₹45,000</p></div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0" suppressHydrationWarning={true}><span className="w-1 h-1 rounded-full bg-emerald-500" suppressHydrationWarning={true} /> Paid</span>
        </div>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 text-center text-xs font-bold text-slate-500" suppressHydrationWarning={true}>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-center gap-2" suppressHydrationWarning={true}><Check className="w-4 h-4 text-teal-500" suppressHydrationWarning={true} /> No spreadsheets.</div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-center gap-2" suppressHydrationWarning={true}><Check className="w-4 h-4 text-teal-500" suppressHydrationWarning={true} /> No confusion.</div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-center gap-2" suppressHydrationWarning={true}><Check className="w-4 h-4 text-teal-500" suppressHydrationWarning={true} /> No forgotten follow-ups.</div>
          </div>
        </motion.div>
      </div>
  </div>
  </motion.section>

    {/* --- SECTION 5: SPLIT APP GENERATOR CONSOLE WITH ANIMATION --- */}
    <motion.section 
    id="reminder-generator"
    ref={generatorSectionRef}
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="bg-white py-16 scroll-mt-24 px-4"
    suppressHydrationWarning={true}
    >
    <div className="max-w-7xl mx-auto text-center space-y-10" suppressHydrationWarning={true}>
      <div className="space-y-2" suppressHydrationWarning={true}>
        <div className="text-3xl sm:text-4xl select-none mb-1" suppressHydrationWarning={true}>🤖</div>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight" suppressHydrationWarning={true}>
          {isPro ? 'Generate AI Reminder — Pro Unlimited Edition' : user ? 'Generate AI Reminder — Member Edition (15 Monthly Free)' : 'Generate Your First AI Reminder — Free'}
        </h2>
        <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto px-2" suppressHydrationWarning={true}>Create professional Email & WhatsApp payment reminders in seconds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto text-left" suppressHydrationWarning={true}>
            
      {/* Left Form */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-6 flex flex-col justify-between"
        suppressHydrationWarning={true}
      >
        <div suppressHydrationWarning={true}>
          {limitReached ? (
          <div className="bg-gradient-to-b from-slate-900 to-[#1e293b] text-white border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-6 my-auto shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#20B8BE]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#245B92] to-[#20B8BE] flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#20B8BE] bg-[#20B8BE]/10 px-3 py-1 rounded-full">
             {user ? 'Monthly Limit Reached' : 'Free Trial Limit Reached'}
            </span>
            <h4 className="text-lg font-black tracking-tight text-white pt-2">
             {user ? 'You have used all 15 free reminders this month.' : "You've used all 5 free AI reminders."}
            </h4>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
             {user ? 'Your reminders automatically refill every month. Want unlimited reminders and advanced recovery tools right now?' : "Create a free account to unlock 15 monthly free reminders or upgrade to Pro for unlimited AI generation."}
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button 
              onClick={() => router.push('/pricing')}
              className="w-full py-3.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white font-bold rounded-xl text-xs hover:opacity-95 transition cursor-pointer shadow-md flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Zap className="w-4 h-4" /> Upgrade to Pro
            </button>
            {!user && (
              <button 
                onClick={() => router.push('/create-account')}
                className="w-full py-3 bg-slate-800 text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-700 transition cursor-pointer border border-slate-700"
              >
                Create Free Account
              </button>
            )}
          </div>
          </div>
               ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4" suppressHydrationWarning={true}>
              <div suppressHydrationWarning={true}>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5" suppressHydrationWarning={true}><Sparkles className="w-4 h-4 text-[#2BB6A8]" suppressHydrationWarning={true} /> Generate Your Reminder</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5" suppressHydrationWarning={true}>
                  {isPro ? 'Pro Plan — Unlimited Generations' : user ? `${reminderCount}/15 Used (Monthly Refill)` : `${reminderCount}/5 Free Reminders Used`}
                </p>
              </div>
              <span className="self-start sm:self-center text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full" suppressHydrationWarning={true}>{getStageLabel()}</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4" suppressHydrationWarning={true}>
              <div suppressHydrationWarning={true}>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" suppressHydrationWarning={true}>Client Name *</label>
                <input type="text" required placeholder="e.g. ABC Agency" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none" suppressHydrationWarning={true} />
              </div>
              <div className="grid grid-cols-2 gap-3" suppressHydrationWarning={true}>
                <div suppressHydrationWarning={true}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" suppressHydrationWarning={true}>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none appearance-none" suppressHydrationWarning={true}>
                <option value="₹ INR" suppressHydrationWarning={true}>₹ INR</option><option value="$ USD" suppressHydrationWarning={true}>$ USD</option><option value="€ EUR" suppressHydrationWarning={true}>€ EUR</option>
              </select>
                </div>
                <div suppressHydrationWarning={true}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" suppressHydrationWarning={true}>Amount Due *</label>
              <input type="number" required placeholder="25000" value={amount} onChange={e => setAmount(e.target.value)} className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none placeholder:text-slate-300" suppressHydrationWarning={true} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3" suppressHydrationWarning={true}>
                <div suppressHydrationWarning={true}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" suppressHydrationWarning={true}>Days Overdue</label>
              <input type="number" value={daysOverdue} onChange={e => setDaysOverdue(e.target.value)} className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none" suppressHydrationWarning={true} />
                </div>
                <div suppressHydrationWarning={true}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" suppressHydrationWarning={true}>Invoice #</label>
              <input type="text" placeholder="INV-2025-042" value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none placeholder:text-slate-300" suppressHydrationWarning={true} />
                </div>
              </div>
              <div suppressHydrationWarning={true}>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" suppressHydrationWarning={true}>Tone</label>
                <div className="grid grid-cols-3 border border-slate-200 rounded-lg overflow-hidden text-center text-xs font-bold h-10" suppressHydrationWarning={true}>
              {['gentle', 'professional', 'firm'].map((t) => (
                <button key={t} type="button" onClick={() => handleToneChange(t)} className={`capitalize h-full cursor-pointer ${tone === t ? 'bg-[#0F172A] text-white' : 'bg-white text-slate-500'}`} suppressHydrationWarning={true}>{t}</button>
              ))}
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isGenerating || limitReached} 
                style={{ background: 'linear-gradient(to right, #7D9BBB, #5FA8A6)' }} 
                className="w-full text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" suppressHydrationWarning={true} /> : <Sparkles className="w-4 h-4" suppressHydrationWarning={true} />} 
                {isGenerating ? 'AI Thinking…' : 'Generate Reminder'}
              </motion.button>
            </form>
          </div>
               )}
        </div>
      </motion.div>

      {/* Right Result Window */}
      <motion.div 
        initial={{ opacity: 0, x: 10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
        suppressHydrationWarning={true}
      >
        <div className="space-y-4 h-full flex flex-col justify-start" suppressHydrationWarning={true}>
          <div suppressHydrationWarning={true}>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2" suppressHydrationWarning={true}><Brain className="w-4 h-4 text-[#1C2E8F]" suppressHydrationWarning={true} /> AI Generated Reminders</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1" suppressHydrationWarning={true}>Email • WhatsApp • SMS • AI Strategy</p>
          </div>
            
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 sm:p-6 flex-1 flex flex-col items-center justify-center text-center w-full min-h-[400px]" suppressHydrationWarning={true}>
            {isGenerating ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="py-12 flex flex-col items-center justify-center space-y-4 w-full"
              >
                <motion.div 
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
                  className="w-14 h-14 bg-blue-100/80 text-[#1C2E8F] rounded-2xl flex items-center justify-center shadow-inner mx-auto"
                >
                  <Brain className="w-7 h-7 animate-pulse text-[#1C2E8F]" />
                </motion.div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Blink AI is analyzing recovery psychology...</p>
                  <p className="text-[11px] text-slate-500 font-medium">Drafting multi-channel high-conversion follow-ups</p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div 
              key={result.email_subject}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-4 text-left"
              suppressHydrationWarning={true}
              >
            <div className="flex flex-wrap gap-2 border-b pb-2 mb-4 items-center justify-between" suppressHydrationWarning={true}>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {[
                  { id: 'email', label: 'Email' },
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'sms', label: 'SMS' },
                  { id: 'strategy', label: 'AI Strategy' }
                ].map((tab) => (
                  <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider transition cursor-pointer shadow-3xs ${activeTab === tab.id ? 'bg-[#1C2E8F] text-white ring-2 ring-[#1C2E8F]/20 scale-102' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                  suppressHydrationWarning={true}
                  >
                  {tab.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-[10px] font-bold text-[#245B92] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50 mt-1 sm:mt-0"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} /> 
                {isGenerating ? 'Rewriting...' : 'Regenerate'}
              </button>
            </div>
                  
            <div className="bg-white p-4 rounded-lg border border-slate-100 text-xs text-slate-700 h-64 overflow-y-auto whitespace-pre-line font-mono leading-relaxed" suppressHydrationWarning={true}>
              {activeTab === 'email' && `Subject: ${result.email_subject}\n\n${result.email_body}`}
              {activeTab === 'whatsapp' && result.whatsapp_message}
              {activeTab === 'sms' && result.sms_text}
              {activeTab === 'strategy' && (
                <div className="space-y-3 font-sans text-xs text-slate-700">
                  <div className="font-black text-slate-900 border-b pb-1 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#20B8BE]" /> AI Recovery Action Plan
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Best tone:</span>
                  <span className="font-bold text-slate-800 uppercase text-[11px] bg-teal-50 text-[#147D75] px-2 py-0.5 rounded">Professional</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Best time to send:</span>
                  <span className="font-bold text-slate-800">10:00 AM</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Next follow-up:</span>
                  <span className="font-bold text-slate-800">In 3 days</span>
                </div>
                <div className="bg-teal-50/60 p-3 rounded-lg border border-teal-100/60 text-slate-700 space-y-1">
                  <span className="font-black text-[#147D75] uppercase text-[10px] block">AI Recommendation</span>
                  <p className="font-medium">Send a follow-up today via WhatsApp for highest response rate.</p>
                </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => handleCopy(activeTab === 'email' ? `${result.email_subject}\n\n${result.email_body}` : activeTab === 'strategy' ? `Best tone: Professional\nBest time: 10:00 AM\nNext follow-up: 3 days\nAI recommendation: Send a follow-up today` : (result as any)[activeTab === 'whatsapp' ? 'whatsapp_message' : 'sms_text'])}
              className="w-full py-2.5 bg-[#2BB6A8] text-white font-bold rounded-lg text-xs hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2"
              suppressHydrationWarning={true}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied to Clipboard
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
              </motion.div>
            ) : (
              <div className="my-auto py-12" suppressHydrationWarning={true}>
            <div style={{ background: 'linear-gradient(to bottom right, #245B92, #20B8BE)' }} className="w-11 h-11 rounded-full flex items-center justify-center text-white mb-3 shadow-xs mx-auto" suppressHydrationWarning={true}><Sparkles className="w-4 h-4 text-white/90" suppressHydrationWarning={true} /></div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide" suppressHydrationWarning={true}>Your AI-generated reminder will appear here.</h4>
            <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed" suppressHydrationWarning={true}>Generate a reminder to see both Email and WhatsApp versions instantly.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  </div>
  </motion.section>

    {/* --- SECTION 6: NEVER LOSE TRACK OF AN UNPAID CLIENT WITH ANIMATION --- */}
    <motion.section 
    id="without-vs-with"
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="bg-white pt-20 sm:pt-24 pb-16 sm:pb-20 border-b border-slate-100 px-4"
    suppressHydrationWarning={true}
    >
    <div className="max-w-5xl mx-auto text-center space-y-10 sm:space-y-12" suppressHydrationWarning={true}>
      <div className="space-y-3.5" suppressHydrationWarning={true}>
        <div className="flex justify-center select-none" suppressHydrationWarning={true}>
          <Target className="w-11 h-11 text-rose-500" suppressHydrationWarning={true} />
        </div>
        <h2 className="text-2xl sm:text-[32px] font-black text-[#0F172A] tracking-tight leading-tight" suppressHydrationWarning={true}>
          Never Lose Track of Your Payments.
        </h2>
        <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto px-2" suppressHydrationWarning={true}>
          Keep every client, reminder, and payment organized in one place.
        </p>
      </div>

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-left max-w-4xl mx-auto pt-4"
       suppressHydrationWarning={true}
    >
      {/* WITHOUT DUEBLINK */}
      <motion.div 
        variants={{
      hidden: { opacity: 0, x: -10 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
        }}
        className="bg-[#FAFBFD] border border-slate-200/60 rounded-[20px] p-6 sm:p-8 space-y-6"
        suppressHydrationWarning={true}
      >
        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest block" suppressHydrationWarning={true}>WITHOUT DUEBLINK</span>
        <ul className="space-y-4" suppressHydrationWarning={true}>
      {["Invoices get buried", "Messages get lost", "Clients promise to pay later", "Follow-ups are forgotten"].map((item, index) => (
        <li key={index} className="flex items-center gap-4 text-sm sm:text-[15px] font-semibold text-slate-600" suppressHydrationWarning={true}>
          <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shrink-0" suppressHydrationWarning={true}>
            <AlertTriangle className="w-3 h-3" suppressHydrationWarning={true} />
          </div>
          {item}
        </li>
      ))}
        </ul>
      </motion.div>

      {/* WITH DUEBLINK */}
      <motion.div 
        variants={{
      hidden: { opacity: 0, x: 10 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
        }}
        className="bg-white border-2 border-[#20B8BE]/40 rounded-[20px] p-6 sm:p-8 space-y-6 shadow-3xs"
        suppressHydrationWarning={true}
      >
        <span className="text-[11px] font-bold text-[#1C2E8F] uppercase tracking-widest block" suppressHydrationWarning={true}>WITH DUEBLINK</span>
        <ul className="space-y-4" suppressHydrationWarning={true}>
      {["Know who owes you money", "Track every follow-up", "See payment status instantly", "Know exactly what to do next"].map((item, index) => (
        <li key={index} className="flex items-center gap-4 text-sm sm:text-[15px] font-bold text-slate-800" suppressHydrationWarning={true}>
          <div style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-3xs" suppressHydrationWarning={true}>
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} suppressHydrationWarning={true} />
          </div>
          {item}
        </li>
      ))}
        </ul>
      </motion.div>
    </motion.div>

    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="space-y-2 pt-6 max-w-xl mx-auto text-center px-4"
      suppressHydrationWarning={true}
    >
      <p className="text-sm sm:text-[15px] font-bold text-slate-700" suppressHydrationWarning={true}>
        Everything you need to recover payments—<br />organized in one simple workspace.
      </p>
      <p className="text-xs sm:text-[13px] font-medium text-slate-400 italic leading-relaxed" suppressHydrationWarning={true}>
        Because getting paid isn't just about sending reminders. <br />It's about staying consistent until payment arrives.
      </p>
    </motion.div>
  </div>
  </motion.section>

    {/* --- SECTION 7: REAL REMINDER EXAMPLES WITH PREMIUM ANIMATION --- */}
    <motion.section 
    id="reminder-examples"
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="bg-[#FAFBFD] py-16 sm:py-20 border-b border-slate-100 px-4"
    suppressHydrationWarning={true}
    >
    <div className="max-w-6xl mx-auto text-center space-y-10 sm:space-y-12" suppressHydrationWarning={true}>
      <div className="space-y-2.5" suppressHydrationWarning={true}>
        <div className="flex justify-center select-none" suppressHydrationWarning={true}><Clipboard className="w-10 h-10 text-slate-600" suppressHydrationWarning={true} /></div>
        <h2 className="text-2xl sm:text-[32px] font-black text-[#0F172A] tracking-tight" suppressHydrationWarning={true}>Real Reminder Examples</h2>
        <p className="text-sm text-slate-500 font-medium px-2" suppressHydrationWarning={true}>See how Dueblink automatically adjusts the reminder tone based on how overdue a payment is.</p>
      </div>

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto"
       suppressHydrationWarning={true}
    >
      {/* CARD 1: GENTLE */}
      <motion.div 
        variants={{
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
        }}
        whileHover={{ y: -2 }}
        className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between"
        suppressHydrationWarning={true}
      >
        <div style={{ height: '4px', background: '#2BB6A8' }} suppressHydrationWarning={true} />
        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between" suppressHydrationWarning={true}>
      <div suppressHydrationWarning={true}>
        <div className="flex items-center justify-between gap-2 mb-4" suppressHydrationWarning={true}>
          <span className="text-[10px] font-bold text-[#147D75] bg-[#E6F7F5] px-2.5 py-1 rounded-md uppercase tracking-wider" suppressHydrationWarning={true}>Gentle</span>
          <span className="text-[11px] font-semibold text-slate-400" suppressHydrationWarning={true}>3 days overdue</span>
        </div>
        <h4 className="text-base font-black text-slate-800 mb-3" suppressHydrationWarning={true}>ABC Marketing Team</h4>
        <div className="rounded-xl bg-[#F8FAFC] p-4 font-sans text-[13px] sm:text-[13.5px] text-slate-600 space-y-3 leading-relaxed border border-slate-100/60" suppressHydrationWarning={true}>
          <p suppressHydrationWarning={true}>Hi ABC Marketing Team,</p>
          <p suppressHydrationWarning={true}>Just a friendly reminder that invoice #1234 for ₹25,000 is due.</p>
          <p suppressHydrationWarning={true}>Could you please confirm when payment is expected?</p>
          <p suppressHydrationWarning={true}>Thank you.</p>
        </div>
      </div>
        </div>
      </motion.div>

      {/* CARD 2: PROFESSIONAL */}
      <motion.div 
        variants={{
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
        }}
        whileHover={{ y: -2 }}
        className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between"
        suppressHydrationWarning={true}
      >
        <div style={{ height: '4px', background: '#245B92' }} suppressHydrationWarning={true} />
        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between" suppressHydrationWarning={true}>
      <div suppressHydrationWarning={true}>
        <div className="flex items-center justify-between gap-2 mb-4" suppressHydrationWarning={true}>
          <span className="text-[10px] font-bold text-[#1E4A75] bg-[#EEF4FA] px-2.5 py-1 rounded-md uppercase tracking-wider" suppressHydrationWarning={true}>Professional</span>
          <span className="text-[11px] font-semibold text-slate-400" suppressHydrationWarning={true}>10 days overdue</span>
        </div>
        <h4 className="text-base font-black text-slate-800 mb-3" suppressHydrationWarning={true}>Growthify Solutions</h4>
        <div className="rounded-xl bg-[#F8FAFC] p-4 font-sans text-[13px] sm:text-[13.5px] text-slate-600 space-y-3 leading-relaxed border border-slate-100/60" suppressHydrationWarning={true}>
          <p suppressHydrationWarning={true}>Hi Growthify Solutions,</p>
          <p suppressHydrationWarning={true}>I wanted to follow up regarding invoice #1234 for ₹25,000, which is now 10 days past due.</p>
          <p suppressHydrationWarning={true}>Please let me know when payment is expected.</p>
          <p suppressHydrationWarning={true}>Thank you.</p>
        </div>
      </div>
        </div>
      </motion.div>

      {/* CARD 3: FIRM */}
      <motion.div 
        variants={{
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
        }}
        whileHover={{ y: -2 }}
        className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between"
        suppressHydrationWarning={true}
      >
        <div style={{ height: '4px', background: '#FF6A5A' }} suppressHydrationWarning={true} />
        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between" suppressHydrationWarning={true}>
      <div suppressHydrationWarning={true}>
        <div className="flex items-center justify-between gap-2 mb-4" suppressHydrationWarning={true}>
          <span className="text-[10px] font-bold text-[#C24133] bg-[#FFF0EF] px-2.5 py-1 rounded-md uppercase tracking-wider" suppressHydrationWarning={true}>Firm</span>
          <span className="text-[11px] font-semibold text-slate-400" suppressHydrationWarning={true}>20+ days overdue</span>
        </div>
        <h4 className="text-base font-black text-slate-800 mb-3" suppressHydrationWarning={true}>BrightLabs Agency</h4>
        <div className="rounded-xl bg-[#F8FAFC] p-4 font-sans text-[13px] sm:text-[13.5px] text-slate-600 space-y-3 leading-relaxed border border-slate-100/60" suppressHydrationWarning={true}>
          <p suppressHydrationWarning={true}>Hi BrightLabs Agency,</p>
          <p suppressHydrationWarning={true}>This is my third follow-up regarding invoice #1234 for ₹25,000, now over 20 days overdue.</p>
          <p className="font-bold text-[#99261A] bg-[#FFE4E2] p-2 rounded-lg text-[13px]" suppressHydrationWarning={true}>Please process payment within the next 3 business days.</p>
          <p suppressHydrationWarning={true}>Thank you.</p>
        </div>
      </div>
        </div>
      </motion.div>
    </motion.div>
  </div>
  </motion.section>

    {/* --- SECTION 8: HOW IT WORKS & BUILT FOR WITH ANIMATION --- */}
    <motion.section 
    id="how-it-works"
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="bg-white py-20 sm:py-24 border-b border-slate-100 px-4"
    suppressHydrationWarning={true}
    >
    <div className="max-w-6xl mx-auto text-center space-y-20 sm:space-y-24" suppressHydrationWarning={true}>
        
      <div className="space-y-12" suppressHydrationWarning={true}>
        <div className="space-y-2" suppressHydrationWarning={true}>
          <Zap className="w-10 h-10 text-amber-400 mx-auto fill-amber-400" suppressHydrationWarning={true} />
          <h2 className="text-2xl sm:text-[32px] font-black text-[#0F172A] tracking-tight uppercase" suppressHydrationWarning={true}>How it works</h2>
          <p className="text-sm sm:text-base text-slate-400 font-medium" suppressHydrationWarning={true}>Five simple steps from invoice to paid.</p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
        visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto pt-2"
          suppressHydrationWarning={true}
        >
          {[
        { icon: <Users className="w-5 h-5 text-white" suppressHydrationWarning={true} />, step: "01", label: "Add Client", desc: "Enter client details and amount due." },
        { icon: <Sparkles className="w-5 h-5 text-white" suppressHydrationWarning={true} />, step: "02", label: "Generate AI Reminder", desc: "Create a professional AI payment reminder instantly." },
        { icon: <FileText className="w-5 h-5 text-white" suppressHydrationWarning={true} />, step: "03", label: "Send Reminder", desc: "Send via Email, WhatsApp or SMS." },
        { icon: <Clipboard className="w-5 h-5 text-white" suppressHydrationWarning={true} />, step: "04", label: "Track Payment Status", desc: "Pending → Reminder Sent → Paid." },
        { icon: <Target className="w-5 h-5 text-white" suppressHydrationWarning={true} />, step: "05", label: "Get Paid Faster", desc: "Recover payments with less manual follow-up." }
          ].map((item, idx) => (
        <motion.div 
          key={idx}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
          }}
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 p-8 rounded-3xl shadow-3xs text-center flex flex-col items-center space-y-4 hover:border-blue-100 transition-all duration-150"
          suppressHydrationWarning={true}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-3xs" style={{ background: 'linear-gradient(135deg, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>
            {item.icon}
          </div>
          <div className="text-[11px] font-black text-slate-400 tracking-widest uppercase" suppressHydrationWarning={true}>{item.step}</div>
          <h4 className="text-base sm:text-lg font-black text-[#0F172A] uppercase" suppressHydrationWarning={true}>{item.label}</h4>
          <p className="text-sm text-slate-500 font-medium leading-relaxed" suppressHydrationWarning={true}>{item.desc}</p>
        </motion.div>
          ))}
        </motion.div>

        <div className="pt-2 text-center px-4" suppressHydrationWarning={true}>
          <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-full uppercase tracking-wider shadow-3xs inline-block">
        ⚡ Takes less than 2 minutes to send your first reminder.
          </span>
        </div>
      </div>

      {/* BUILT FOR */}
      <div id="built-for" className="space-y-10 pt-12 border-t border-slate-100" suppressHydrationWarning={true}>
        <div className="space-y-2" suppressHydrationWarning={true}>
          <div className="flex justify-center select-none" suppressHydrationWarning={true}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#245B92]" suppressHydrationWarning={true}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" suppressHydrationWarning={true} />
          <circle cx="9" cy="7" r="4" suppressHydrationWarning={true} />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" suppressHydrationWarning={true} />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" suppressHydrationWarning={true} />
        </svg>
          </div>
          <h2 className="text-2xl sm:text-[32px] font-black text-[#0F172A] tracking-tight uppercase" suppressHydrationWarning={true}>Built for</h2>
          <p className="text-sm sm:text-base text-slate-400 font-medium" suppressHydrationWarning={true}>If clients owe you money, DueBlink is built for you.</p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
        visible: { transition: { staggerChildren: 0.03 } }
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4"
          suppressHydrationWarning={true}
        >
          {[
        { label: "Freelancers", icon: <Briefcase className="w-5 h-5 text-slate-400" suppressHydrationWarning={true} /> },
        { label: "Agencies", icon: <Layers className="w-5 h-5 text-slate-400" suppressHydrationWarning={true} /> },
        { label: "Consultants", icon: <Users className="w-5 h-5 text-slate-400" suppressHydrationWarning={true} /> },
        { label: "Designers", icon: <Sparkles className="w-5 h-5 text-slate-400" suppressHydrationWarning={true} /> },
        { label: "Developers", icon: <Brain className="w-5 h-5 text-slate-400" suppressHydrationWarning={true} /> },
        { label: "Marketers", icon: <Send className="w-5 h-5 text-slate-400" suppressHydrationWarning={true} /> },
        { label: "Service Businesses", icon: <Briefcase className="w-5 h-5 text-slate-400" suppressHydrationWarning={true} /> }
          ].map((persona, pIdx) => (
        <motion.div 
          key={pIdx}
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } }
          }}
          whileHover={{ y: -2, borderColor: "#bfdbfe" }}
          className="px-6 py-6 bg-white border border-slate-200 rounded-3xl shadow-3xs text-sm font-bold text-slate-700 flex flex-col items-center justify-center gap-3 transition cursor-default"
          suppressHydrationWarning={true}
        >
          {persona.icon}
          {persona.label}
        </motion.div>
          ))}
        </motion.div>
    </div>
  </div>
  </motion.section>

    {/* --- PRICING SECTION WITH PREMIUM ANIMATION --- */}
    <motion.section 
    id="pricing"
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="bg-white py-20 sm:py-24 border-b border-slate-100 px-4"
    suppressHydrationWarning={true}
    >
    <div className="max-w-5xl mx-auto text-center space-y-12" suppressHydrationWarning={true}>
      <div className="space-y-4" suppressHydrationWarning={true}>
        <div className="mx-auto w-12 h-12 flex items-center justify-center" suppressHydrationWarning={true}>
          <Sparkles className="w-8 h-8 text-amber-400" suppressHydrationWarning={true} />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight" suppressHydrationWarning={true}>Simple pricing</h2>
        <p className="text-slate-500 font-medium" suppressHydrationWarning={true}>Choose the plan that fits your recovery needs.</p>
      </div>

      {isPro ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto bg-gradient-to-br from-slate-900 to-[#1e293b] p-8 sm:p-12 rounded-3xl border border-slate-800 text-white text-center space-y-6 shadow-2xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#245B92] to-[#20B8BE] flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight">Your Pro Plan is Active</h3>
            <p className="text-xs text-slate-300 font-medium">You have full access to unlimited AI reminders, the AI Recovery Assistant, and priority workflows.</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 rounded-xl text-white font-bold bg-gradient-to-r from-[#245B92] to-[#20B8BE] hover:opacity-95 transition cursor-pointer text-sm shadow-md"
          >
            Open Dashboard
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid md:grid-cols-2 gap-8 text-left items-stretch"
          suppressHydrationWarning={true}
        >
          {/* Free Plan */}
          <motion.div 
            variants={{
          hidden: { opacity: 0, scale: 0.99 },
          visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } }
            }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 flex flex-col justify-between"
            suppressHydrationWarning={true}
          >
            <div>
          <h3 className="font-black text-lg" suppressHydrationWarning={true}>Free</h3>
          <p className="text-slate-400 text-sm mb-6" suppressHydrationWarning={true}>Start recovering payments</p>
          <div className="text-5xl font-black mb-8" suppressHydrationWarning={true}>₹0</div>
          <ul className="space-y-4 mb-8" suppressHydrationWarning={true}>
            {["15 Free Monthly Reminders (Auto-refills)", "Email Reminders", "WhatsApp Reminders", "Tone Selection", "Basic Tracking"].map(text => (
              <li key={text} className="flex items-center gap-3 font-semibold text-slate-700 text-sm" suppressHydrationWarning={true}>
                <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0" suppressHydrationWarning={true}>
              <Check className="w-3 h-3 text-slate-400" strokeWidth={4} suppressHydrationWarning={true} />
                </div>
                {text}
              </li>
            ))}
          </ul>
            </div>
            <button 
          onClick={() => router.push('/pricing')} 
          className="w-full py-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition cursor-pointer text-sm"
          suppressHydrationWarning={true}
            >
          {user ? 'Current Plan' : 'Start Free'}
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div 
            variants={{
          hidden: { opacity: 0, scale: 0.99 },
          visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } }
            }}
            whileHover={{ scale: 1.01 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#20B8BE] shadow-xl relative flex flex-col justify-between"
            suppressHydrationWarning={true}
          >
            <div>
          <div className="absolute top-4 right-4 bg-[#20B8BE] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider" suppressHydrationWarning={true}>MOST POPULAR</div>
          <h3 className="font-black text-lg" suppressHydrationWarning={true}>Pro</h3>
          <p className="text-slate-400 text-sm mb-6" suppressHydrationWarning={true}>Everything you need to recover payments faster.</p>
          <div className="text-4xl sm:text-5xl font-black mb-1" suppressHydrationWarning={true}>₹499 <span className="text-xs sm:text-sm font-bold text-slate-400" suppressHydrationWarning={true}>/ month</span></div>
          <p className="text-xs font-bold text-slate-400 mb-2" suppressHydrationWarning={true}>or ₹4,999 / year</p>
          <p className="text-[11px] text-slate-400 font-medium mb-8">Cancel anytime • Secure payments</p>
          <ul className="space-y-4 mb-8" suppressHydrationWarning={true}>
            {[
              "Unlimited AI Reminders",
              "Floating AI Recovery Assistant",
              "AI Smart Recommendations",
              "AI Follow-up Generator",
              "Reminder Rewriter",
              "Payment Tracking & History",
              "Unlimited Clients"
            ].map(text => (
              <li key={text} className="flex items-center gap-3 font-semibold text-slate-700 text-sm" suppressHydrationWarning={true}>
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#245B92] to-[#20B8BE] flex items-center justify-center shrink-0" suppressHydrationWarning={true}>
              <Check className="w-3 h-3 text-white" strokeWidth={4} suppressHydrationWarning={true} />
                </div>
                {text}
              </li>
            ))}
          </ul>
            </div>
            <button 
          onClick={() => router.push('/pricing')} 
          className="w-full py-4 rounded-xl text-white font-bold bg-gradient-to-r from-[#245B92] to-[#20B8BE] hover:opacity-95 transition cursor-pointer text-sm shadow-3xs"
          suppressHydrationWarning={true}
            >
          Upgrade to Pro
            </button>
          </motion.div>
        </motion.div>
      )}
  </div>
  </motion.section>

    {/* --- FAQ SECTION WITH PREMIUM ANIMATION --- */}
    <motion.section 
    id="faq"
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="bg-slate-50 py-20 sm:py-24 border-b border-slate-100 px-4 scroll-mt-24"
    suppressHydrationWarning={true}
    >
    <div className="max-w-4xl mx-auto text-center space-y-20 sm:space-y-24" suppressHydrationWarning={true}>
        
      <div className="space-y-12" suppressHydrationWarning={true}>
        <div className="space-y-2" suppressHydrationWarning={true}>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight" suppressHydrationWarning={true}>Frequently asked questions</h2>
          <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto px-2" suppressHydrationWarning={true}>Common questions about DueBlink.</p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
        visible: { transition: { staggerChildren: 0.03 } }
          }}
          className="space-y-4 max-w-3xl mx-auto text-left"
          suppressHydrationWarning={true}
        >
          {[
        { q: "How do the free monthly reminders work?", a: "Logged-in users get 15 free reminders every month. Your reminder count automatically refills at the start of each month." },
        { q: "Is DueBlink just another AI writer?", a: "No. DueBlink is a specialized payment recovery system combining automated workflows with structured invoice tracking." },
        { q: "How long until I get paid?", a: "Most users recover payments significantly faster. Many report successful collections within 7-14 days of consistent follow-ups." },
        { q: "Does it work with WhatsApp?", a: "Yes. DueBlink automatically formats messages for WhatsApp. Just copy the text and paste it directly into your chat." },
        { q: "Do I need an account?", a: "No. You can try the reminder generator instantly. An account is only required for the central dashboard and monthly free reminders." },
        { q: "Is it secure?", a: "Yes. DueBlink never accesses your bank account or payment processor. We only track the specific invoice data you input." },
        { q: "What's included in DueBlink Pro?", a: "DueBlink Pro unlocks the Floating AI Recovery Assistant, unlimited AI reminders, AI recommendations, unlimited clients, payment history, and premium recovery tools." }
          ].map((faq, index) => (
        <motion.div 
          key={index}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 }
          }}
          className="border-b border-slate-200/60 pb-4"
          suppressHydrationWarning={true}
        >
          <button 
            onClick={() => toggleFaq(index)} 
            className="w-full flex items-center justify-between gap-4 text-left font-bold text-sm sm:text-base text-[#0F172A] hover:text-[#245B92] transition-colors cursor-pointer py-2"
            suppressHydrationWarning={true}
          >
            <span className="flex items-center gap-3" suppressHydrationWarning={true}>
              <div className="w-5 flex items-center justify-center shrink-0" suppressHydrationWarning={true}>
            <HelpCircle className="w-4 h-4 text-[#20B8BE]" suppressHydrationWarning={true} />
              </div>
              {faq.q}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${openFaq === index ? 'rotate-180' : ''}`} suppressHydrationWarning={true} />
          </button>
               
          <motion.div
            initial={false}
            animate={{ height: openFaq === index ? "auto" : 0, opacity: openFaq === index ? 1 : 0 }}
            className="overflow-hidden"
            suppressHydrationWarning={true}
          >
            <p className="pt-2 pb-2 text-sm sm:text-[15px] text-[#334155] font-medium leading-relaxed" suppressHydrationWarning={true}>
              {faq.a}
            </p>
          </motion.div>
        </motion.div>
          ))}
        </motion.div>
    </div>
  </div>
  </motion.section>

    {/* --- IMPACT SECTION WITH PREMIUM ANIMATION --- */}
    <motion.section 
    id="missed-followup"
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="bg-slate-50 py-20 sm:py-24 px-4"
    suppressHydrationWarning={true}
    >
    <div className="max-w-4xl mx-auto" suppressHydrationWarning={true}>
      <div className="bg-white rounded-[32px] p-6 sm:p-12 text-center shadow-3xs border border-amber-100" suppressHydrationWarning={true}>
        <div className="text-4xl mb-6 select-none" suppressHydrationWarning={true}>⚠️</div>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tight mb-6 sm:mb-8" suppressHydrationWarning={true}>
          Every missed follow-up costs money.
        </h2>
            
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
        visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8"
          suppressHydrationWarning={true}
        >
          {["Forgotten follow-ups.", "Delayed payments.", "Lost cash flow."].map((text) => (
        <motion.div 
          key={text}
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } }
          }}
          className="bg-[#FFFBEB] py-4 px-4 rounded-2xl border border-amber-100 font-semibold text-slate-800 text-sm"
          suppressHydrationWarning={true}
        >
          {text}
        </motion.div>
          ))}
        </motion.div>
            
        <p className="text-sm sm:text-base text-slate-600 font-medium px-2" suppressHydrationWarning={true}>
          Every missed follow-up delays cash flow. DueBlink keeps every client, reminder, and payment organized so nothing slips through the cracks.
        </p>
      </div>
  </div>
  </motion.section>

    {/* --- FINAL CTA CONVERSION CONTAINER WITH PREMIUM ANIMATION --- */}
    <motion.section 
    id="final-cta"
    initial={{ opacity: 0, scale: 0.99 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="bg-white py-16 px-4"
    suppressHydrationWarning={true}
    >
    <div className="max-w-4xl mx-auto" suppressHydrationWarning={true}>
      <div className="bg-gradient-to-br from-[#245B92] to-[#20B8BE] rounded-[32px] p-6 sm:p-12 text-center text-white relative shadow-lg overflow-hidden" suppressHydrationWarning={true}>
        <div className="text-4xl mb-6" suppressHydrationWarning={true}>🏆</div>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-6 sm:mb-8" suppressHydrationWarning={true}>
          {isPro ? 'Welcome back! Your Pro features are ready.' : user ? 'Welcome back. Ready to recover more payments?' : 'Stop Chasing Clients. Get Paid Faster.'}
        </h2>
            
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
        visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto mb-8"
          suppressHydrationWarning={true}
        >
          {["✓ Know who owes you money", "✓ Never miss a follow-up", "✓ Recover payments faster"].map((text, i) => (
        <motion.div 
          key={text}
          variants={{
            hidden: { opacity: 0, y: 5 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
          }}
          className="bg-white/10 backdrop-blur-xs border border-white/20 p-3 sm:p-4 rounded-xl font-bold text-xs sm:text-sm"
          suppressHydrationWarning={true}
        >
          {text}
        </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => user ? router.push('/dashboard') : handleScrollToGenerator()} 
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#245B92] px-8 py-3.5 rounded-xl font-black text-sm hover:bg-slate-50 transition cursor-pointer shadow-xs"
        suppressHydrationWarning={true}
          >
        <Zap className="w-4 h-4" suppressHydrationWarning={true} /> 
        {user ? 'Open Dashboard' : 'Generate Free Reminder'}
          </motion.button>
            
          {user && !isPro && (
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/pricing')} 
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0F172A] text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-slate-900 transition cursor-pointer border border-white/20 shadow-xs"
          suppressHydrationWarning={true}
        >
          <Sparkles className="w-4 h-4 text-[#20B8BE]" suppressHydrationWarning={true} /> 
          Upgrade to Pro
        </motion.button>
          )}
        </div>
            
        {!user && (
          <p className="mt-3 text-xs font-medium text-white/80" suppressHydrationWarning={true}>No signup required • Generate your first AI reminder in seconds.</p>
        )}
      </div>
  </div>
  </motion.section>

    {/* --- GLOBAL FOOTER WITH ANIMATION --- */}
    <motion.footer 
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3 }}
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

    {/* --- PREMIUM INTERCEPT MODAL WITH SPRING ANIMATION --- */}
    <AnimatePresence>
    {isModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" suppressHydrationWarning={true}>
        <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" 
        onClick={() => setIsModalOpen(false)}
        suppressHydrationWarning={true}
       />
       <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4"
        suppressHydrationWarning={true}
       >
        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" suppressHydrationWarning={true}>
          <X className="w-5 h-5" suppressHydrationWarning={true} />
        </button>
        <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight" suppressHydrationWarning={true}>{modalTitle}</h3>
        <p className="text-xs text-slate-600 font-medium">
          {user ? 'You have reached your 15 monthly free reminders. Upgrade to Pro for unlimited AI generation.' : 'You have used your 5 free guest reminders. Create a free account for 15 monthly reminders or upgrade to Pro.'}
        </p>
        <div className="space-y-2 pt-2">
          <button 
        onClick={() => { setIsModalOpen(false); router.push('/pricing'); }} 
        style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
        className="w-full py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition hover:opacity-90 shadow-3xs cursor-pointer flex items-center justify-center gap-2" 
        suppressHydrationWarning={true}
          >
        <Zap className="w-4 h-4" /> Upgrade to Pro
          </button>
          {!user && (
        <button 
           onClick={() => { setIsModalOpen(false); router.push('/create-account'); }} 
           className="w-full py-3 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition hover:bg-slate-200 cursor-pointer" 
           suppressHydrationWarning={true}
        >
           Create Account Free
        </button>
          )}
        </div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>

    {/* --- SMART SCROLL BUTTON (TOP <-> BOTTOM) --- */}
    <button
    onClick={() => {
      if (isAtTop) {
        window.scrollTo({ top: document.body.scrollHeight, height: 'smooth' } as any);
      } else {
        window.scrollTo({ top: 0, height: 'smooth' } as any);
      }
  }}
      className="fixed bottom-6 right-6 z-[90] bg-[#0F172A] text-white p-3 rounded-full shadow-lg hover:bg-[#245B92] hover:scale-105 transition-all duration-150 cursor-pointer border border-white/10"
      aria-label="Toggle scroll position"
      suppressHydrationWarning={true}
  >
      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isAtTop ? '' : 'rotate-180'}`} suppressHydrationWarning={true} />
    </button>

    <FloatingRobot />

</div>
  );
}