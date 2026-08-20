'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Mail, MessageSquare, Copy, Check, Sparkles, RefreshCw, Smartphone, Brain, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReminderFormProps {
  onLimitReached?: () => void;
  isPro?: boolean;
}

export function ReminderForm({ onLimitReached, isPro = false }: ReminderFormProps) {
  const [clientName, setClientName] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [daysOverdue, setDaysOverdue] = useState('');
  const [tone, setTone] = useState('Professional');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [result, setResult] = useState<{ 
    email_subject: string; 
    email_body: string; 
    whatsapp_message: string; 
    sms_text: string; 
    psychology_note: string; 
  } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'sms' | 'psychology'>('email');
  const [copied, setCopied] = useState(false);

  // ============================================================
  // Reminder Variation Memory
  // ============================================================
  // Keeps recent generated reminders in this browser session.
  // This does NOT affect guest/free/pro usage limits or Firebase.

  const [previousReminders, setPreviousReminders] = useState<
    Array<{
      email_subject: string;
      email_body: string;
      whatsapp_message: string;
      sms_text: string;
    }>
  >([]);

  // User & Limit Tracking States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [effectiveIsPro, setEffectiveIsPro] = useState(isPro);
  const [guestUsage, setGuestUsage] = useState(0);
  const [freeUserUsage, setFreeUserUsage] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [limitType, setLimitType] = useState<'guest' | 'free' | null>(null);

  const router = useRouter();

  // Sync internal pro state with props and localStorage events
  useEffect(() => {
    const checkProStatus = () => {
      const localPro = localStorage.getItem('dueblink_is_pro') === 'true';
      if (isPro || localPro) {
        setEffectiveIsPro(true);
        setLimitReached(false);
      } else {
        setEffectiveIsPro(false);
      }
    };

    checkProStatus();

    const handleProUnlock = () => {
      checkProStatus();
    };

    window.addEventListener('pro-status-updated', handleProUnlock);
    window.addEventListener('storage', handleProUnlock);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserBackendData(user.uid);
      } else {
        initGuestTracking();
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('pro-status-updated', handleProUnlock);
      window.removeEventListener('storage', handleProUnlock);
    };
  }, [isPro]);

  const initGuestTracking = () => {
    if (isPro || localStorage.getItem('dueblink_is_pro') === 'true') return;

    let guestId = localStorage.getItem('dueblink_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('dueblink_guest_id', guestId);
    }

    const savedCount = localStorage.getItem('dueblink_guest_reminders');
    const count = savedCount ? parseInt(savedCount, 10) : 0;
    setGuestUsage(count);

    if (count >= 5) {
      setLimitReached(true);
      setLimitType('guest');
      if (onLimitReached) onLimitReached();
    }
  };

  const fetchUserBackendData = async (uid: string) => {
    try {
      const res = await fetch(`/api/user-usage?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        
        if (isPro || data.isPro || localStorage.getItem('dueblink_is_pro') === 'true') {
          setEffectiveIsPro(true);
          setLimitReached(false);
          return;
        }

        const usageCount = data.aiRemindersUsed || 0;
        setFreeUserUsage(usageCount);
        if (usageCount >= 15) {
          setLimitReached(true);
          setLimitType('free');
          if (onLimitReached) onLimitReached();
        }
      }
    } catch (error) {
      console.error("Failed to fetch backend user data", error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !amountDue) {
      alert("Please fill in Client Name and Amount.");
      return;
    }

    // Bypass all usage restrictions completely if Pro is active
    if (!effectiveIsPro) {
      if (currentUser && freeUserUsage >= 15) {
        setLimitReached(true);
        setLimitType('free');
        if (onLimitReached) onLimitReached();
        return;
      }
      if (!currentUser && guestUsage >= 5) {
        setLimitReached(true);
        setLimitType('guest');
        if (onLimitReached) onLimitReached();
        return;
      }
    }
    
    setIsGenerating(true);
    setResult(null);

    try {
      const guestId = !currentUser ? localStorage.getItem('dueblink_guest_id') : null;

      // ============================================================
      // Reminder Variation Instruction
      // ============================================================

      const variationStrategies = [
        'Use a fresh conversational opening and a natural human tone.',
        'Use a concise, direct structure with different sentence patterns.',
        'Use a relationship-focused approach while remaining professional.',
        'Use an action-oriented approach that clearly encourages payment.',
        'Use a calm and polished business communication style with fresh wording.',
        'Use a different opening, sentence structure, and call-to-action from previous versions.',
        'Use natural conversational wording and avoid generic AI-style phrases.',
        'Approach the reminder from a different communication angle while keeping all facts accurate.'
      ];

      const variationInstruction =
        variationStrategies[
          Math.floor(Math.random() * variationStrategies.length)
        ];

      const response = await fetch('/api/generate-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser
            ? {
                Authorization: `Bearer ${await currentUser.getIdToken()}`,
              }
            : {}),
        },
        body: JSON.stringify({
          clientName,
          amount: amountDue,
          currency: '₹ INR',
          invoiceRef: '', 
          daysOverdue: daysOverdue || '14',
          tone: tone.toLowerCase(),
          uid: currentUser?.uid || null,
          guestId: guestId,

          // New: recent outputs help the AI avoid repetition.
          previousReminders,
          variationInstruction
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403 && !effectiveIsPro) {
          setLimitReached(true);
          setLimitType(currentUser ? 'free' : 'guest');
          if (onLimitReached) onLimitReached();
          return;
        }
        throw new Error(data.details || data.message || 'Failed to generate.');
      }

      setResult(data);

      // ============================================================
      // Premium success animation after AI generation
      // ============================================================

      setShowSuccessAnimation(true);

      setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 1100);

      // ============================================================
      // Remember the latest 5 generations for variation.
      // This is separate from the actual user generation limit.
      // ============================================================

      setPreviousReminders((previous) => {
        const updated = [
          ...previous,
          {
            email_subject: data.email_subject || '',
            email_body: data.email_body || '',
            whatsapp_message: data.whatsapp_message || '',
            sms_text: data.sms_text || ''
          }
        ];

        return updated.slice(-5);
      });

      // Only increment usage counters if the user is NOT Pro
      if (!effectiveIsPro) {
        if (!currentUser) {
          const nextCount = guestUsage + 1;
          setGuestUsage(nextCount);
          localStorage.setItem('dueblink_guest_reminders', nextCount.toString());
          if (nextCount >= 5) {
            setLimitReached(true);
            setLimitType('guest');
            if (onLimitReached) onLimitReached();
          }
        } else {
          setFreeUserUsage((prev) => {
            const updated = prev + 1;
            if (updated >= 15) {
              setLimitReached(true);
              setLimitType('free');
              if (onLimitReached) onLimitReached();
            }
            return updated;
          });
        }
      }

    } catch (error: any) {
      console.error("AI Generation failed:", error);
      alert(error.message || "AI generation failed. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCopyableText = () => {
    if (!result) return '';
    switch (activeTab) {
      case 'email': return `Subject: ${result.email_subject}\n\n${result.email_body}`;
      case 'whatsapp': return result.whatsapp_message;
      case 'sms': return result.sms_text;
      case 'psychology': return result.psychology_note;
      default: return '';
    }
  };

  return (
    <div className="mx-auto max-w-2xl bg-white border border-slate-200/80 p-5 sm:p-8 rounded-3xl shadow-xl text-left relative overflow-hidden">
      
      {/* Workspace Header & Live Remaining Count / Pro Status */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <span className="flex items-center gap-2 text-xs font-black text-[#1C2E8F] uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#2BB6A8] animate-pulse"></span>
          {effectiveIsPro ? 'Pro Recovery Workspace' : 'Free Instant Generator Workspace'}
        </span>
        <div className="text-right">
          {effectiveIsPro ? (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
              <CheckCircle2 size={12} /> Pro Unlimited
            </span>
          ) : currentUser ? (
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Free Plan: <strong className="text-slate-900">{Math.max(0, 15 - freeUserUsage)}</strong> / 15 left
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Guest Trial: <strong className="text-slate-900">{Math.max(0, 5 - guestUsage)}</strong> / 5 left
            </span>
          )}
        </div>
      </div>

      {/* Limit Reached Block Banner (Hidden if Pro) */}
      {!effectiveIsPro && limitReached ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 text-center space-y-4 my-2"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-[#2BB6A8]">
            <Lock size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black">
              {limitType === 'guest' ? "You've used your 5 free guest reminders!" : "Monthly Free Limit Reached (15/15)"}
            </h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              {limitType === 'guest' 
                ? "Create a free DueBlink account now to unlock up to 15 free monthly AI reminders, or upgrade to Pro for unlimited generation." 
                : "You have reached your maximum monthly free AI generation limit. Upgrade to DueBlink Pro for unlimited automated debt recovery tools."}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {limitType === 'guest' && (
              <button
                onClick={() => router.push('/create-account')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition shadow-md cursor-pointer"
              >
                Create Free Account
              </button>
            )}
            <button
              onClick={() => router.push('/pricing')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition shadow-lg cursor-pointer"
            >
              Upgrade to Pro — Unlimited
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Client Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g., ABC Media Agency" 
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)} 
                className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/20 focus:border-[#1C2E8F] transition" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Amount Due (INR)</label>
              <input 
                type="number" 
                required 
                placeholder="e.g., 25000" 
                value={amountDue} 
                onChange={(e) => setAmountDue(e.target.value)} 
                className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/20 focus:border-[#1C2E8F] transition" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Days Overdue (Optional)</label>
              <input 
                type="number" 
                placeholder="e.g., 7" 
                value={daysOverdue} 
                onChange={(e) => setDaysOverdue(e.target.value)} 
                className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/20 focus:border-[#1C2E8F] transition" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Tone Framework</label>
              <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl text-xs font-bold text-center">
                {['Gentle', 'Professional', 'Firm'].map((t) => (
                  <button 
                    key={t} 
                    type="button" 
                    onClick={() => setTone(t)} 
                    className={`py-2 rounded-lg transition-all cursor-pointer ${tone === t ? 'bg-white text-[#1C2E8F] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isGenerating} 
            className="w-full font-bold text-sm text-white py-3.5 bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] rounded-xl shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            ) : <Sparkles className="w-4 h-4" />}
            {isGenerating ? "Processing Recovery Psychology..." : 'Generate Payment Reminders'}
          </button>
        </form>
      )}

      {/* Immersive Generation Animation & Results Workspace */}
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div 
            key="loading" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            transition={{ duration: 0.2 }}
            className="mt-6 p-8 border border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center space-y-4"
          >
            <motion.div 
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} 
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
              className="w-14 h-14 bg-blue-100/80 text-[#1C2E8F] rounded-2xl flex items-center justify-center shadow-inner"
            >
              <Brain className="w-7 h-7 animate-pulse" />
            </motion.div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Blink AI is analyzing recovery psychology...</p>
              <p className="text-[11px] text-slate-500 font-medium">Drafting multi-channel high-conversion follow-ups</p>
            </div>
          </motion.div>
        ) : showSuccessAnimation ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -6 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="mt-6 relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-8 sm:p-10 text-center shadow-sm"
          >
            {/* Animated light sweep */}
            <motion.div
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: "120%", opacity: [0, 0.55, 0] }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-18deg] pointer-events-none"
            />

            {/* Sparkle burst */}
            {[
              { x: -58, y: -32, r: 18, d: 0.05 },
              { x: 58, y: -30, r: -18, d: 0.12 },
              { x: -70, y: 22, r: -12, d: 0.18 },
              { x: 70, y: 24, r: 14, d: 0.22 },
              { x: 0, y: -58, r: 0, d: 0.08 }
            ].map((spark, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0,
                  rotate: 0
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.7],
                  x: spark.x,
                  y: spark.y,
                  rotate: spark.r
                }}
                transition={{
                  duration: 0.85,
                  delay: spark.d,
                  ease: "easeOut"
                }}
                className="absolute left-1/2 top-[46%] text-[#2BB6A8] pointer-events-none"
              >
                <Sparkles size={index === 4 ? 18 : 13} />
              </motion.div>
            ))}

            {/* Success icon */}
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{
                scale: [0, 1.12, 1],
                rotate: [-25, 8, 0]
              }}
              transition={{
                duration: 0.6,
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1C2E8F] to-[#2BB6A8] text-white shadow-lg"
            >
              <CheckCircle2 className="h-8 w-8" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.35 }}
              className="relative"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1C2E8F]">
                Blink AI
              </p>

              <h3 className="mt-1 text-lg sm:text-xl font-black text-slate-900">
                Recovery Reminder Ready
              </h3>

              <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500">
                Fresh Email, WhatsApp & SMS reminders generated.
              </p>
            </motion.div>
          </motion.div>
        ) : result ? (
          <motion.div 
            key="result" 
            initial={{ opacity: 0, y: 15, scale: 0.985 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm"
          >
            <div className="flex border-b border-slate-200/80 pb-3 mb-4 items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-2 sm:gap-4 text-xs font-bold flex-wrap">
                {['email', 'whatsapp', 'sms', 'psychology'].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab as any)} 
                    className={`pb-2 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${activeTab === tab ? 'border-[#1C2E8F] text-[#1C2E8F]' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                  >
                    {tab === 'email' && <Mail className="w-3.5 h-3.5" />}
                    {tab === 'whatsapp' && <MessageSquare className="w-3.5 h-3.5" />}
                    {tab === 'sms' && <Smartphone className="w-3.5 h-3.5" />}
                    {tab === 'psychology' && <Brain className="w-3.5 h-3.5" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => handleCopy(getCopyableText())} 
                className="text-xs bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-bold flex items-center gap-1.5 text-[#1C2E8F] transition shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} 
                {copied ? "Copied" : "Copy Output"}
              </button>
            </div>
            <div className="text-xs sm:text-sm bg-white text-slate-800 p-4 rounded-xl font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-slate-200/60 shadow-inner">
              {activeTab === 'email' && (
                <div>
                  <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wide text-[10px]">Subject:</span>
                  <p className="font-sans font-bold mb-3 text-[#1C2E8F] text-sm">{result.email_subject}</p>
                  <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wide text-[10px]">Body:</span>
                  <p className="font-sans whitespace-pre-line text-slate-700">{result.email_body}</p>
                </div>
              )}
              {activeTab === 'whatsapp' && <p className="font-sans text-slate-700">{result.whatsapp_message}</p>}
              {activeTab === 'sms' && <p className="font-sans text-slate-700">{result.sms_text}</p>}
              {activeTab === 'psychology' && <p className="font-sans text-slate-600 italic">{result.psychology_note}</p>}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}