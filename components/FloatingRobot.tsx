'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Brain, X, Sparkles, BarChart3, Clock, ArrowRight, Users, ChevronRight, Zap, ArrowLeft, Loader2, Copy, Check, Download, RefreshCw, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingRobotProps {
  onTrigger?: (action: string) => void;
  recommendation?: {
    name: string;
    amount: string | number;
    daysOverdue: number;
  } | null;
  isPro?: boolean;
  externalAction?: string | null;
  onOpenAddClient?: () => void;
}

export default function FloatingRobot({ onTrigger, recommendation, isPro = false, externalAction = null, onOpenAddClient }: FloatingRobotProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(true);
  const [uiState, setUiState] = useState<'idle' | 'processing'>('idle');
  const [remainingFreeReminders, setRemainingFreeReminders] = useState(3);
  const [greeting, setGreeting] = useState('');
  
  // Real-time reactive client count state
  const [savedClientsCount, setSavedClientsCount] = useState(0);
  
  // State for in-panel AI response display & interactive commands
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [activeActionName, setActiveActionName] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showMessageBubble, setShowMessageBubble] = useState(false);
  const [clickedSectionText, setClickedSectionText] = useState<string | null>(null);
  
  // Dynamic positioning state to avoid overlapping
  const [isScrolled, setIsScrolled] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const cleanResponseText = (text: string) => {
    return text
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const updateClientCount = useCallback(() => {
    try {
      const clients = JSON.parse(localStorage.getItem('dueblink_clients') || '[]');
      setSavedClientsCount(clients.length);
    } catch {
      setSavedClientsCount(0);
    }
  }, []);

  useEffect(() => {
    updateClientCount();
    window.addEventListener('storage', updateClientCount);
    window.addEventListener('clients-updated', updateClientCount);
    return () => {
      window.removeEventListener('storage', updateClientCount);
      window.removeEventListener('clients-updated', updateClientCount);
    };
  }, [updateClientCount]);

  // Handle dynamic positioning to clear scroll-to-top buttons / system UI
  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 150) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', checkScroll);
    checkScroll();
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

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

    const timer = setTimeout(() => setIsVisible(true), 800);
    const saved = localStorage.getItem('freeReminders');
    if (saved) setRemainingFreeReminders(parseInt(saved));

    if (pathname !== '/dashboard' || isPro) {
      const loadMinimizeTimer = setTimeout(() => {
        setShowMessageBubble((prev) => (clickedSectionText ? prev : false));
      }, 6000);
      return () => clearTimeout(loadMinimizeTimer);
    }

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [pathname, isPro, clickedSectionText]);

  useEffect(() => {
    if (externalAction && pathname === '/dashboard') {
      setIsExpanded(true);
      setShowMessageBubble(false);
      if (externalAction === 'summarize') {
        handleActionClick('summarize', 'Outstanding Summary');
      } else if (externalAction === 'recommend') {
        handleActionClick('recommend', 'Generate Follow-up');
      }
    }
  }, [externalAction, pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
        setShowMessageBubble(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

    const sectionIds = [
      'hero',
      'late-payments',
      'features',
      'built-for',
      'automated-reminders',
      'ai-recovery-assistant',
      'dashboard-preview',
      'reminder-generator',
      'reminder-examples',
      'how-it-works',
      'pricing',
      'faq',
      'final-cta'
    ];

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = sectionIds.indexOf(entry.target.id);
          if (index !== -1 && currentSectionIndexRef.current !== index) {
            setCurrentSectionIndex(index);
          }
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  const getCurrentMessages = () => {
    if (isLoggedIn && isPro) {
      return [
        "Your Pro workspace is ready.",
        "See everything DueBlink can do for your payments.",
        "Your complete payment recovery toolkit.",
        "Built for businesses that invoice and follow up.",
        "Set it once and let DueBlink follow up automatically.",
        "I can help you decide which payment to chase first.",
        "Your payment recovery activity, all in one place.",
        "Create unlimited AI payment reminders in seconds.",
        "See reminders for different payment stages.",
        "Add clients, follow up, and track payments.",
        "Your Pro plan unlocks the full recovery toolkit.",
        "Find quick answers to common questions.",
        "Ready to recover more payments?"
      ];
    } else if (isLoggedIn) {
      return [
        "Welcome back. Let's recover your payments.",
        "Stay on top of every payment you are owed.",
        "Your tools for faster payment recovery.",
        "Built for businesses that invoice and follow up.",
        "Let DueBlink handle your follow-ups automatically.",
        "Upgrade to Pro for smarter recovery recommendations.",
        "Manage your clients and payment activity here.",
        "Create AI payment reminders when you need them.",
        "See examples for different payment stages.",
        "Add clients, send reminders, and track payments.",
        "Upgrade when you need unlimited recovery tools.",
        "Find quick answers to common questions.",
        "Ready to get paid faster?"
      ];
    } else {
      return [
        "Start with 5 free AI reminders.",
        "Late payments are easier to manage with timely follow-ups.",
        "Everything you need to recover payments, in one place.",
        "Built for businesses that invoice and follow up.",
        "Set it once and let DueBlink follow up automatically.",
        "See how AI can help you recover payments.",
        "Your payment recovery workspace.",
        "Create a professional payment reminder in seconds.",
        "See reminders for different payment stages.",
        "Add a client, send reminders, and track payment.",
        "Start free, then upgrade when you need more.",
        "Find quick answers to common questions.",
        "Ready to get paid faster?"
      ];
    }
  };

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

    const messages = getCurrentMessages();
    setClickedSectionText(messages[currentSectionIndex] || messages[0]);
    setShowMessageBubble((prev) => !prev);
  };

  const getActiveMessage = () => {
    if (pathname === '/dashboard') {
      if (isPro) {
        return `${greeting}, ${userName}!\n\nI'm Blink, your AI Recovery Assistant. ✨\n\nI'm here to analyze your client portfolio, prioritize overdue payments, and generate smart follow-ups for you!`;
      }
      return ""; 
    }

    if (clickedSectionText) {
      return clickedSectionText;
    }

    if (currentSectionIndex === null || currentSectionIndex === undefined) {
      return "Hi! I'm Blink.\n\nI'll help you explore DueBlink and show you how it can help you get paid faster.";
    }

    const messages = getCurrentMessages();
    return messages[currentSectionIndex] || messages[0] || "Hi! I'm Blink.\n\nI'll help you explore DueBlink and show you how it can help you get paid faster.";
  };

  const handleActionClick = async (actionId: string, actionTitle: string) => {
    if (!isPro) {
      router.push('/pricing');
      return;
    }
    if (uiState === 'processing') return;

    setActiveActionName(actionTitle);
    setActiveActionId(actionId);
    setUiState('processing');
    setAiResponse(null);

    if (onTrigger) {
      onTrigger(actionId);
    }

    try {
      const freshClients = JSON.parse(localStorage.getItem('dueblink_clients') || '[]');
      
      if (freshClients.length === 0) {
        setSavedClientsCount(0);
        setUiState('idle');
        return;
      }

      setSavedClientsCount(freshClients.length);
      const totalAmount = freshClients.reduce((acc: number, c: any) => acc + Number(c.amount || 0), 0);
      const targetClient = recommendation ? freshClients.find((c: any) => c.name === recommendation.name) || freshClients[0] : freshClients[0];

      const response = await fetch('/api/pro-recovery-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: actionId,
          client: targetClient,
          clients: freshClients,
          total: totalAmount
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
        }
      }

      setAiResponse(
        cleanResponseText(fullText) ||
        "Analysis complete. No urgent actions needed right now."
      );
    } catch {
      setAiResponse("Unable to fetch portfolio analysis right now. Please check your connection and try again.");
    } finally {
      setUiState('idle');
    }
  };

  const handleCopy = async () => {
    if (!aiResponse) return;
    await navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleAddClientRedirect = () => {
    setIsExpanded(false);
    if (onOpenAddClient) {
      onOpenAddClient();
    } else {
      window.dispatchEvent(new CustomEvent('open-add-client-modal'));
    }
  };

  if (pathname === '/create-account' || pathname === '/login' || !isVisible) return null;

  const positioningClass = isScrolled 
    ? 'bottom-28 sm:bottom-32 right-6 sm:right-8' 
    : 'bottom-20 sm:bottom-24 right-6 sm:right-8';

  return (
    <div 
      className={`fixed z-[900] flex flex-col items-end gap-3 transition-all duration-200 ease-in-out ${positioningClass}`}
      suppressHydrationWarning={true}
    >
      
      {/* 1. SCROLL GUIDANCE MESSAGE BUBBLE */}
      <AnimatePresence>
        {!isExpanded && showMessageBubble && (isPro || pathname !== '/dashboard') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/85 shadow-2xl rounded-2xl p-4 flex flex-col gap-2.5 max-w-[260px] sm:max-w-[280px] relative text-left transform-gpu will-change-transform"
            suppressHydrationWarning={true}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2" suppressHydrationWarning={true}>
              <div className="flex items-center gap-2" suppressHydrationWarning={true}>
                <div className="relative flex items-center justify-center w-2.5 h-2.5">
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-[#20B8BE] opacity-75" />
                  <div className="w-2 h-2 rounded-full bg-[#20B8BE]" />
                </div>
                <div className="flex flex-col" suppressHydrationWarning={true}>
                  <p className="text-[10px] font-black text-[#245B92] uppercase tracking-wider leading-none">Blink</p>
                  <p className="text-[9px] font-semibold text-slate-400 tracking-wide mt-0.5">
                    {pathname === '/dashboard' ? "Your AI Recovery Assistant" : "Your DueBlink Guide"}
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMessageBubble(false);
                }} 
                className="text-[10px] font-bold text-slate-400 hover:text-slate-700 bg-slate-100/80 hover:bg-slate-200 px-2 py-0.5 rounded-full cursor-pointer transition flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#20B8BE]"
                aria-label="Close message bubble"
                suppressHydrationWarning={true}
              >
                <X size={10} /> Close
              </button>
            </div>

            <p className="text-[11px] text-slate-600 font-medium whitespace-pre-line leading-relaxed tracking-wide" suppressHydrationWarning={true}>
              {getActiveMessage()}
            </p>

            {pathname !== '/dashboard' && (isLoggedIn || currentSectionIndex === 0 || currentSectionIndex === 12 || clickedSectionText) && (
              <button 
                onClick={handleLandingAction} 
                className="mt-0.5 w-full bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white py-2 px-3 rounded-xl font-bold text-[11px] shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#245B92]"
                suppressHydrationWarning={true}
              >
                {isLoggedIn ? "Open Dashboard" : (isPro ? "Open Dashboard" : "Try 5 AI Reminders Free")} <ArrowRight size={12} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. DASHBOARD PROACTIVE RECOMMENDATION CARD */}
      <AnimatePresence>
        {!isExpanded && isLoggedIn && recommendation && showRecommendation && pathname === '/dashboard' && isPro && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/85 shadow-2xl rounded-2xl p-4 flex flex-col gap-2.5 cursor-pointer hover:border-[#20B8BE] transition-all max-w-[260px] sm:max-w-[280px] relative group transform-gpu will-change-transform"
            onClick={() => {
              if (!isPro) {
                router.push('/pricing');
                return;
              }
              setIsExpanded(true);
              handleActionClick('recommend', 'Generate Follow-up');
            }}
            suppressHydrationWarning={true}
          >
            <button onClick={(e) => { e.stopPropagation(); setShowRecommendation(false); }} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition" aria-label="Close recommendation" suppressHydrationWarning={true}>
              <X size={12} />
            </button>
            <div suppressHydrationWarning={true}>
              <div className="flex items-center gap-1.5 mb-1" suppressHydrationWarning={true}>
                <span className="text-[9px] font-black text-[#245B92] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">Blink AI</span>
                <span className="text-[9px] font-medium text-slate-400">Action Required</span>
              </div>
              <p className="text-xs font-bold text-[#0F172A] mt-0.5 leading-snug" suppressHydrationWarning={true}>{recommendation.name} needs your attention today.</p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between" suppressHydrationWarning={true}>
              <div>
                <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>₹{Number(recommendation.amount).toLocaleString()}</p>
                <p className="text-[9px] font-bold text-[#20B8BE] uppercase tracking-wide mt-0.5" suppressHydrationWarning={true}>{recommendation.daysOverdue} Days Overdue</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[#245B92]">
                <Zap size={12} className="fill-[#20B8BE] text-[#20B8BE]" />
              </div>
            </div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!isPro) {
                  router.push('/pricing');
                  return;
                }
                setIsExpanded(true);
                handleActionClick('recommend', 'Generate Follow-up'); 
              }} 
              className="w-full text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#245B92]" 
              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
              suppressHydrationWarning={true}
            >
              <span>Generate Follow-up</span> 
              <ChevronRight size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. EXPANDED PANEL WITH STRUCTURED FORMAT & REACTIVE EMPTY STATES */}
      <AnimatePresence>
        {isExpanded && pathname === '/dashboard' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-2xl w-[280px] sm:w-[320px] max-h-[80vh] flex flex-col overflow-hidden transform-gpu will-change-transform"
            suppressHydrationWarning={true}
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#245B92] to-[#20B8BE] p-3.5 text-white relative overflow-hidden flex-shrink-0" suppressHydrationWarning={true}>
              <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-start relative z-10" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2">
                  {aiResponse || uiState === 'processing' || savedClientsCount === 0 ? (
                    <button 
                      onClick={() => { setAiResponse(null); setActiveActionName(null); setActiveActionId(null); }}
                      className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner hover:bg-white/30 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Back"
                    >
                      <ArrowLeft size={14} className="text-white" />
                    </button>
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                      <Brain size={14} className="text-white" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black tracking-wider uppercase text-[9px] text-white/90">Blink</h3>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[8px] font-bold text-white/80 uppercase">Online</span>
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5 truncate max-w-[160px]">
                      {activeActionName ? activeActionName : 'Your AI Recovery Assistant'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsExpanded(false); setAiResponse(null); setActiveActionName(null); setActiveActionId(null); }} 
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Close panel"
                  suppressHydrationWarning={true}
                >
                  <X size={12} />
                </button>
              </div>

              {!aiResponse && uiState !== 'processing' && savedClientsCount > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/15 text-left" suppressHydrationWarning={true}>
                  <p className="text-[11px] font-bold text-white/90">{greeting}, {userName}!</p>
                  <p className="text-[10px] text-white/80 font-medium mt-0.5">What can I help you with today?</p>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-3.5 overflow-y-auto flex-1 text-xs" suppressHydrationWarning={true}>
              {isLoggedIn ? (
                isPro ? (
                  savedClientsCount === 0 && activeActionId ? (
                    <div className="space-y-3 text-left py-1" suppressHydrationWarning={true}>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black text-[#245B92] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">Blink Guide</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {activeActionId === 'recommend' && "No Clients Found"}
                            {activeActionId === 'priorities' && "Nothing to Review"}
                            {activeActionId === 'summarize' && "No Payment Data"}
                            {activeActionId === 'rewrite' && "No Reminder Available"}
                            {activeActionId === 'overdue' && "No Overdue Clients"}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                            {activeActionId === 'recommend' && "You haven't added any clients yet. Blink needs at least one client to generate an AI follow-up."}
                            {activeActionId === 'priorities' && "You don't have any clients yet. Once you add clients, Blink will automatically identify who needs your attention first."}
                            {activeActionId === 'summarize' && "There are no clients or invoices to analyze. Your payment insights will appear here after you add your first client."}
                            {activeActionId === 'rewrite' && "There isn't a reminder to rewrite yet. Generate your first AI reminder after adding a client."}
                            {activeActionId === 'overdue' && "You haven't added any clients yet. Blink will automatically detect overdue payments after client information is added."}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-200/60">
                          <p className="text-[10px] font-bold text-[#20B8BE] uppercase tracking-wider">Next Step</p>
                          <p className="text-[11px] text-slate-700 font-semibold mt-0.5">Add your first client to get started.</p>
                        </div>
                      </div>

                      <button 
                        onClick={handleAddClientRedirect}
                        className="w-full py-2.5 rounded-xl text-white font-bold text-[11px] shadow-md transition hover:opacity-95 bg-gradient-to-r from-[#245B92] to-[#20B8BE] cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#245B92]"
                      >
                        <UserPlus size={13} /> Add New Client
                      </button>

                      <button 
                        onClick={() => { setAiResponse(null); setActiveActionName(null); setActiveActionId(null); }}
                        className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-[11px] hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ArrowLeft size={12} /> Back
                      </button>
                    </div>
                  ) : aiResponse || uiState === 'processing' ? (
                    <div className="py-1 space-y-2.5 text-left" suppressHydrationWarning={true}>
                      {uiState === 'processing' ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2 text-slate-400">
                          <Loader2 size={24} className="animate-spin text-[#20B8BE]" />
                          <p className="text-[11px] font-bold tracking-wide">Blink is analyzing...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-[11px] text-slate-800 font-medium whitespace-pre-wrap leading-relaxed shadow-inner break-words block w-full text-left max-h-[240px] overflow-y-auto">
                            {aiResponse}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {activeActionId === 'recommend' && (
                              <>
                                <button onClick={handleCopy} className="py-2 px-2.5 bg-[#0F172A] text-white rounded-xl font-bold text-[10px] shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  {copied ? 'Copied!' : 'Copy Email'}
                                </button>
                                <button onClick={() => handleActionClick('rewrite', 'Rewrite Reminder')} className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  <Clock size={11} className="text-[#20B8BE]" /> Rewrite
                                </button>
                              </>
                            )}

                            {activeActionId === 'summarize' && (
                              <>
                                <button onClick={handleCopy} className="py-2 px-2.5 bg-[#0F172A] text-white rounded-xl font-bold text-[10px] shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  {copied ? <Check size={11} className="text-emerald-400" /> : <Download size={11} />}
                                  {copied ? 'Copied!' : 'Export Summary'}
                                </button>
                                <button onClick={() => handleActionClick('summarize', 'Outstanding Summary')} className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  <RefreshCw size={11} className="text-[#20B8BE]" /> Analyze Again
                                </button>
                              </>
                            )}

                            {activeActionId === 'priorities' && (
                              <>
                                <button onClick={() => handleActionClick('recommend', 'Generate Follow-up')} className="py-2 px-2.5 bg-[#0F172A] text-white rounded-xl font-bold text-[10px] shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  <Sparkles size={11} className="text-[#20B8BE]" /> Follow-up
                                </button>
                                <button onClick={handleCopy} className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy Summary'}
                                </button>
                              </>
                            )}

                            {activeActionId === 'rewrite' && (
                              <>
                                <button onClick={handleCopy} className="py-2 px-2.5 bg-[#0F172A] text-white rounded-xl font-bold text-[10px] shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button onClick={() => handleActionClick('rewrite', 'Rewrite Reminder')} className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  <RefreshCw size={11} className="text-[#20B8BE]" /> Rewrite Again
                                </button>
                              </>
                            )}

                            {activeActionId === 'overdue' && (
                              <>
                                <button onClick={() => handleActionClick('recommend', 'Generate Follow-up')} className="py-2 px-2.5 bg-[#0F172A] text-white rounded-xl font-bold text-[10px] shadow-sm hover:opacity-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  <Sparkles size={11} className="text-[#20B8BE]" /> Follow-up
                                </button>
                                <button onClick={handleCopy} className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy List'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => { setAiResponse(null); setActiveActionName(null); setActiveActionId(null); }}
                        className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-[11px] hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1 mt-1"
                      >
                        <ArrowLeft size={12} /> Back to Quick Actions
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2" suppressHydrationWarning={true}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Choose an action</p>
                        <span className="text-[9px] font-bold text-[#20B8BE] bg-teal-50 px-2 py-0.5 rounded-full">Pro Active</span>
                      </div>
                      {[
                        { name: 'Generate Follow-up', id: 'recommend', icon: <Sparkles size={13}/>, desc: 'Generate an AI Email & WhatsApp follow-up' },
                        { name: "Today's Priorities", id: 'priorities', icon: <Brain size={13}/>, desc: 'See who needs your attention today' },
                        { name: 'Outstanding Summary', id: 'summarize', icon: <BarChart3 size={13}/>, desc: 'Analyze your outstanding payments' },
                        { name: 'Rewrite Reminder', id: 'rewrite', icon: <Clock size={13}/>, desc: 'Rewrite your reminder professionally' },
                        { name: 'Find Overdue Clients', id: 'overdue', icon: <Users size={13}/>, desc: 'Find clients with overdue payments' },
                      ].map((act) => (
                        <button 
                          key={act.id}
                          onClick={() => handleActionClick(act.id, act.name)}
                          className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-[#20B8BE]/50 hover:bg-teal-50/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 flex items-center justify-between group cursor-pointer shadow-2xs"
                          suppressHydrationWarning={true}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-[#20B8BE]/10 text-[#245B92] group-hover:text-[#20B8BE] flex items-center justify-center transition-colors flex-shrink-0">
                              {act.icon}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-[11px] text-slate-800 group-hover:text-[#245B92] transition-colors truncate">{act.name}</p>
                              <p className="text-[9px] text-slate-400 font-medium truncate">{act.desc}</p>
                            </div>
                          </div>
                          <ChevronRight size={12} className="text-slate-300 group-hover:text-[#20B8BE] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
                        </button>
                      ))}

                      <div className="pt-2 text-center border-t border-slate-100 mt-2">
                        <p className="text-[9px] font-medium text-slate-400">Powered by DueBlink AI</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="py-3 text-center space-y-2.5" suppressHydrationWarning={true}>
                    <div className="space-y-1">
                      <h5 className="font-black text-xs text-slate-900">Unlock Pro Assistant</h5>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Upgrade to DueBlink Pro to generate instant AI follow-up messages and payment recovery strategies.
                      </p>
                    </div>
                    <button 
                      onClick={() => { setIsExpanded(false); router.push('/pricing'); }}
                      className="w-full py-2.5 rounded-xl text-white font-bold text-[11px] shadow-md transition hover:opacity-95 bg-gradient-to-r from-[#245B92] to-[#20B8BE] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#245B92]"
                    >
                      Upgrade to Pro ✨
                    </button>
                    <div className="pt-1 text-center">
                      <p className="text-[9px] font-medium text-slate-400">Powered by DueBlink AI</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-2" suppressHydrationWarning={true}>
                  <p className="text-[11px] font-bold text-slate-800 mb-3 leading-relaxed" suppressHydrationWarning={true}>
                    {remainingFreeReminders > 0 ? `Hi! You have ${remainingFreeReminders} free reminders remaining.` : "You've used your free reminders. Create an account to continue!"}
                  </p>
                  <button onClick={handleLandingAction} className="w-full text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer mb-2 focus:outline-none focus:ring-2 focus:ring-[#245B92]" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>
                    <span>{remainingFreeReminders > 0 ? "Try 5 AI Reminders Free" : "Create Account"}</span> 
                    <ArrowRight size={12} />
                  </button>
                  <div className="pt-1.5 text-center border-t border-slate-100">
                    <p className="text-[9px] font-medium text-slate-400">Powered by DueBlink AI</p>
                  </div>
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
        onClick={handleRobotClick}
        aria-label="Open Blink AI Assistant"
        className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-[#245B92] to-[#20B8BE] rounded-full shadow-2xl flex items-center justify-center border-4 border-white cursor-pointer overflow-hidden flex-shrink-0 transform-gpu will-change-transform focus:outline-none focus:ring-4 focus:ring-[#20B8BE]/40"
        suppressHydrationWarning={true}
      >
        <div className="w-full h-full pointer-events-none" style={{ backgroundImage: "url('/anima-bot.svg')", backgroundPosition: 'center', backgroundSize: '120%', backgroundRepeat: 'no-repeat' }} suppressHydrationWarning={true} />
      </motion.button>
    </div>
  );
}