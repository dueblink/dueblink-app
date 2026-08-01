'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Brain, X, Sparkles, BarChart3, Clock, ArrowRight, Users, ChevronRight, Zap, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingRobotProps {
  onTrigger?: (action: string) => void;
  recommendation?: {
    name: string;
    amount: string | number;
    daysOverdue: number;
  } | null;
  isPro?: boolean;
}

export default function FloatingRobot({ onTrigger, recommendation, isPro = false }: FloatingRobotProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(true);
  const [uiState, setUiState] = useState<'idle' | 'processing'>('idle');
  const [remainingFreeReminders, setRemainingFreeReminders] = useState(3);
  const [greeting, setGreeting] = useState('');
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showMessageBubble, setShowMessageBubble] = useState(false);
  const [clickedSectionText, setClickedSectionText] = useState<string | null>(null);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true);
        if (user.displayName) {
          setUserName(user.displayName.split(' ')[0]);
        } else if (user.email) {
          const emailName = user.email.split('@')[0];
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }
      } else {
        setIsLoggedIn(false);
        setUserName('User');
      }
    });

    const timer = setTimeout(() => setIsVisible(true), 1000);
    const saved = localStorage.getItem('freeReminders');
    if (saved) setRemainingFreeReminders(parseInt(saved));

    // Only show welcome message bubble on dashboard if user is Pro or on landing page
    if (pathname !== '/dashboard' || isPro) {
      setShowMessageBubble(true);
      const loadMinimizeTimer = setTimeout(() => {
        setShowMessageBubble((prev) => (clickedSectionText ? prev : false));
      }, 6000);
      return () => clearTimeout(loadMinimizeTimer);
    }

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [pathname, isPro]);

  // Inactivity Timer
  useEffect(() => {
    if (pathname === '/dashboard') return;

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        setClickedSectionText("Need help?\n\nClick me anytime.");
        setShowMessageBubble(true);
      }, 50000);
    };

    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
      window.removeEventListener('keypress', resetInactivityTimer);
    };
  }, [pathname]);

  const currentSectionIndexRef = useRef(currentSectionIndex);
  currentSectionIndexRef.current = currentSectionIndex;

  useEffect(() => {
    if (pathname === '/dashboard') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sectionIds = [
            'hero', 'late-payments', 'features', 'ai-recovery-assistant',
            'dashboard-preview', 'reminder-generator', 'without-vs-with',
            'reminder-examples', 'how-it-works', 'built-for', 'pricing',
            'faq', 'missed-followup', 'final-cta'
          ];

          const viewportCenter = window.innerHeight / 2;
          let closestIndex = 0;
          let minDistance = Infinity;

          sectionIds.forEach((id, index) => {
            const element = document.getElementById(id);
            if (element) {
              const rect = element.getBoundingClientRect();
              const elementCenter = rect.top + rect.height / 2;
              const distance = Math.abs(viewportCenter - elementCenter);

              if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
              }
            }
          });

          if (currentSectionIndexRef.current !== closestIndex) {
            setCurrentSectionIndex(closestIndex);
            setClickedSectionText(null);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  const handleRobotClick = () => {
    if (pathname === '/dashboard') {
      setIsExpanded(!isExpanded);
      setShowMessageBubble(false); 
      return;
    }

    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    const messages = isLoggedIn && isPro ? [
      "Your Pro workspace is ready.",
      "Your Pro workspace is ready.",
      "You have access to every DueBlink feature.",
      "Open your AI Recovery Assistant to analyze payments, generate follow-ups and recover money faster.",
      "Your dashboard is your recovery command center.",
      "You can generate unlimited AI reminders anytime.",
      "Your dashboard is your recovery command center.",
      "Your dashboard is your recovery command center.",
      "Your dashboard is your recovery command center.",
      "Your dashboard is your recovery command center.",
      "You're already enjoying every Pro feature.",
      "Most common questions are answered here.",
      "Your Pro workspace is ready.",
      "Let's recover more payments."
    ] : isLoggedIn ? [
      "Open your dashboard to continue managing your clients.",
      "Open your dashboard to continue managing your clients.",
      "Everything you've seen is available inside your account.",
      "Upgrade to Pro to unlock AI recommendations and smart follow-ups.",
      "This is your payment recovery workspace.",
      "You can generate reminders instantly using your saved client data.",
      "This is your payment recovery workspace.",
      "This is your payment recovery workspace.",
      "This is your payment recovery workspace.",
      "This is your payment recovery workspace.",
      "You're on the Free plan. Upgrade anytime to unlock every AI feature.",
      "Most common questions are answered here.",
      "This is your payment recovery workspace.",
      "Continue where you left off."
    ] : [
      "Start here. Try 5 free AI reminders—no signup required.",
      "This explains why spreadsheets, WhatsApp and memory aren't enough.",
      "These are the tools DueBlink gives you to organize clients and recover payments.",
      "This is DueBlink Pro's smartest feature. It analyzes payment data and recommends your next action.",
      "This is where you'll manage clients, reminders and payment tracking.",
      "You can generate up to 5 AI reminders for free before creating an account.",
      "Here's the difference between manual tracking and using DueBlink.",
      "See how DueBlink automatically adjusts reminder tones based on how overdue a payment is.",
      "This section shows the complete payment recovery workflow.",
      "If clients owe you money, DueBlink is built for you.",
      "Start free. Upgrade only when you need unlimited AI and the Recovery Assistant.",
      "Most common questions are answered here.",
      "This is why consistent follow-ups matter for healthy cash flow.",
      "You're ready. Try your first AI reminder."
    ];

    setClickedSectionText(messages[currentSectionIndex] || messages[0]);
    setShowMessageBubble(true);
  };

  const getActiveMessage = () => {
    if (pathname === '/dashboard') {
      if (isPro) {
        return `${greeting}, ${userName}!\n\nI'm Blink, your AI Recovery Assistant. ✨\n\nI'm here to analyze your client portfolio, prioritize overdue payments, and generate smart follow-ups for you!`;
      }
      return ""; // No welcome message bubble for free users on dashboard
    }
    if (clickedSectionText) return clickedSectionText;

    if (isLoggedIn && isPro) {
      return `Welcome back, ${userName}!\n\nI'm Blink, your Pro AI Recovery Assistant. Everything is unlocked and ready.`;
    }

    if (isLoggedIn) {
      return `Welcome back, ${userName}!\n\nReady to continue recovering payments?`;
    }

    return "Hi! I'm Blink.\n\nI'll help you explore DueBlink and show you how to recover payments faster.\n\nNeed help? Click me anytime.";
  };

  const handleActionClick = async (action: string) => {
    if (!isPro) {
      router.push('/pricing');
      return;
    }
    if (uiState === 'processing') return;
    if (onTrigger) {
      onTrigger(action);
      setIsExpanded(false);
    } else if (isLoggedIn) {
      setUiState('processing');
      try {
        const response = await fetch('/api/pro-recovery-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        const data = await response.json();
        if (data.suggestion) {
          window.dispatchEvent(new CustomEvent('open-ai-preview', { detail: data.suggestion }));
        }
      } finally {
        setUiState('idle');
        setIsExpanded(false);
      }
    } else {
      router.push('/create-account');
    }
  };

  const handleLandingAction = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else if (remainingFreeReminders > 0) {
      const newCount = remainingFreeReminders - 1;
      setRemainingFreeReminders(newCount);
      localStorage.setItem('freeReminders', newCount.toString());
      const element = document.getElementById('reminder-generator');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsExpanded(false);
        setShowMessageBubble(false);
      } else {
        router.push('/create-account');
      }
    } else {
      router.push('/create-account');
    }
  };

  if (pathname === '/create-account' || !isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[900] sm:bottom-28 sm:right-8 flex flex-col items-end gap-3" suppressHydrationWarning={true}>
      
      {/* 1. SCROLL GUIDANCE MESSAGE BUBBLE (Hidden on dashboard for free users) */}
      <AnimatePresence>
        {!isExpanded && showMessageBubble && (isPro || pathname !== '/dashboard') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-3xl p-5 flex flex-col gap-3 max-w-[300px] relative text-left"
            suppressHydrationWarning={true}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5" suppressHydrationWarning={true}>
              <div className="flex items-center gap-2.5" suppressHydrationWarning={true}>
                <div className="relative flex items-center justify-center w-3 h-3">
                  <div className="absolute w-3 h-3 rounded-full bg-[#20B8BE] animate-ping opacity-75" />
                  <div className="w-2 h-2 rounded-full bg-[#20B8BE]" />
                </div>
                <div className="flex flex-col" suppressHydrationWarning={true}>
                  <p className="text-[11px] font-black text-[#245B92] uppercase tracking-wider leading-none">Blink</p>
                  <p className="text-[10px] font-semibold text-slate-400 tracking-wide mt-0.5">
                    {pathname === '/dashboard' ? "Your AI Recovery Assistant" : "Your DueBlink Guide"}
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMessageBubble(false); setClickedSectionText(null); }} 
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700 bg-slate-100/80 hover:bg-slate-200 px-2.5 py-1 rounded-full cursor-pointer transition flex items-center gap-1"
                suppressHydrationWarning={true}
              >
                <X size={12} /> Close
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium whitespace-pre-line leading-relaxed tracking-wide" suppressHydrationWarning={true}>
              {getActiveMessage()}
            </p>

            {pathname !== '/dashboard' && (isLoggedIn || currentSectionIndex === 0 || currentSectionIndex === 13 || clickedSectionText) && (
              <button 
                onClick={handleLandingAction} 
                className="mt-1 w-full bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                suppressHydrationWarning={true}
              >
                {isLoggedIn ? "Open Dashboard" : (isPro ? "Open Dashboard" : "Try 5 AI Reminders Free")} <ArrowRight size={14} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. DASHBOARD PROACTIVE RECOMMENDATION CARD */}
      <AnimatePresence>
        {!isExpanded && isLoggedIn && recommendation && showRecommendation && pathname === '/dashboard' && isPro && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-3xl p-5 flex flex-col gap-3 cursor-pointer hover:border-[#20B8BE] transition-all max-w-[300px] relative group"
            onClick={() => {
              if (!isPro) {
                router.push('/pricing');
                return;
              }
              setIsExpanded(true);
            }}
            suppressHydrationWarning={true}
          >
            <button onClick={(e) => { e.stopPropagation(); setShowRecommendation(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition" suppressHydrationWarning={true}>
              <X size={14} />
            </button>
            <div suppressHydrationWarning={true}>
              <div className="flex items-center gap-2 mb-1.5" suppressHydrationWarning={true}>
                <span className="text-[10px] font-black text-[#245B92] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">Blink AI</span>
                <span className="text-[10px] font-medium text-slate-400">Action Required</span>
              </div>
              <p className="text-sm font-bold text-[#0F172A] mt-1 leading-snug" suppressHydrationWarning={true}>{recommendation.name} needs your attention today.</p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between" suppressHydrationWarning={true}>
              <div>
                <p className="text-base font-black text-[#0F172A]" suppressHydrationWarning={true}>₹{Number(recommendation.amount).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-[#20B8BE] uppercase tracking-wide mt-0.5" suppressHydrationWarning={true}>{recommendation.daysOverdue} Days Overdue</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#245B92]">
                <Zap size={14} className="fill-[#20B8BE] text-[#20B8BE]" />
              </div>
            </div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!isPro) {
                  router.push('/pricing');
                  return;
                }
                onTrigger?.('recommend'); 
              }} 
              className="w-full text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer" 
              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
              suppressHydrationWarning={true}
            >
              <span>Generate Follow-up</span> 
              <ChevronRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. EXPANDED PANEL */}
      <AnimatePresence>
        {isExpanded && pathname === '/dashboard' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-3xl w-[300px] sm:w-[340px] overflow-hidden"
            suppressHydrationWarning={true}
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#245B92] to-[#20B8BE] p-5 text-white relative overflow-hidden" suppressHydrationWarning={true}>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-start relative z-10" suppressHydrationWarning={true}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-black tracking-wider uppercase text-[10px] text-white/90">Blink AI</h3>
                    <p className="text-sm font-bold text-white mt-0.5">{isPro ? 'Pro AI Recovery Assistant' : 'Upgrade to Unlock Pro'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)} 
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
                  suppressHydrationWarning={true}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5" suppressHydrationWarning={true}>
              {isLoggedIn ? (
                isPro ? (
                  <div className="space-y-2.5" suppressHydrationWarning={true}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</p>
                      <span className="text-[10px] font-bold text-[#20B8BE] bg-teal-50 px-2 py-0.5 rounded-full">Pro Active</span>
                    </div>
                    {[
                      { name: 'Generate Follow-up', id: 'recommend', icon: <Sparkles size={15}/>, desc: 'Create AI reminder message' },
                      { name: "Today's Priorities", id: 'priorities', icon: <Brain size={15}/>, desc: 'Review critical accounts' },
                      { name: 'Outstanding Summary', id: 'summarize', icon: <BarChart3 size={15}/>, desc: 'Analyze total dues' },
                      { name: 'Rewrite Reminder', id: 'rewrite', icon: <Clock size={15}/>, desc: 'Adjust tone & urgency' },
                      { name: 'Find Overdue Clients', id: 'overdue', icon: <Users size={15}/>, desc: 'Filter delayed payments' },
                    ].map((act) => (
                      <button 
                        key={act.id}
                        onClick={() => handleActionClick(act.id)}
                        className="w-full text-left p-3 rounded-2xl border border-slate-100 hover:border-[#20B8BE]/50 hover:bg-teal-50/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-between group cursor-pointer shadow-2xs"
                        suppressHydrationWarning={true}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-[#20B8BE]/10 text-[#245B92] group-hover:text-[#20B8BE] flex items-center justify-center transition-colors">
                            {act.icon}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-800 group-hover:text-[#245B92] transition-colors">{act.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{act.desc}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-[#20B8BE] transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-4">
                    <div className="w-12 h-12 bg-teal-50 text-[#20B8BE] rounded-2xl flex items-center justify-center mx-auto">
                      <Lock size={22} />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-black text-sm text-slate-900">Unlock Pro Assistant</h5>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Upgrade to DueBlink Pro to generate instant AI follow-up messages and payment recovery strategies.
                      </p>
                    </div>
                    <button 
                      onClick={() => { setIsExpanded(false); router.push('/pricing'); }}
                      className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition hover:opacity-95 bg-gradient-to-r from-[#245B92] to-[#20B8BE] cursor-pointer"
                    >
                      Upgrade to Pro ✨
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-2" suppressHydrationWarning={true}>
                  <p className="text-sm font-bold text-slate-800 mb-5 leading-relaxed" suppressHydrationWarning={true}>
                    {remainingFreeReminders > 0 ? `Hi! You have ${remainingFreeReminders} free reminders remaining.` : "You've used your free reminders. Create an account to continue!"}
                  </p>
                  <button onClick={handleLandingAction} className="w-full text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>
                    <span>{remainingFreeReminders > 0 ? "Try 5 AI Reminders Free" : "Create Account"}</span> 
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. WIDGET BUTTON */}
      <motion.button 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsExpanded(!isExpanded);
          setShowMessageBubble(false);
        }}
        className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#245B92] to-[#20B8BE] rounded-full shadow-2xl flex items-center justify-center border-4 border-white cursor-pointer overflow-hidden flex-shrink-0 transform-gpu will-change-transform relative"
        suppressHydrationWarning={true}
      >
        <div className="w-full h-full pointer-events-none" style={{ backgroundImage: "url('/anima-bot.svg')", backgroundPosition: 'center', backgroundSize: '120%', backgroundRepeat: 'no-repeat' }} suppressHydrationWarning={true} />
        {!isPro && pathname === '/dashboard' && (
          <div className="absolute top-0 right-0 w-6 h-6 bg-slate-900 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md">
            <Lock size={10} className="text-[#20B8BE]" />
          </div>
        )}
      </motion.button>
    </div>
  );
}