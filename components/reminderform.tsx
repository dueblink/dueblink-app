'use client';

import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Copy, Check, Sparkles, RefreshCw, Smartphone, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReminderFormProps {
  onLimitReached: () => void;
}

export function ReminderForm({ onLimitReached }: ReminderFormProps) {
  const [clientName, setClientName] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [daysOverdue, setDaysOverdue] = useState('');
  const [tone, setTone] = useState('Professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ 
    email_subject: string; 
    email_body: string; 
    whatsapp_message: string; 
    sms_text: string; 
    psychology_note: string; 
  } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'sms' | 'psychology'>('email');
  const [copied, setCopied] = useState(false);
  const [reminderCount, setReminderCount] = useState<number>(0);

  useEffect(() => {
    const savedCount = localStorage.getItem('dueblink_free_reminders');
    if (savedCount) {
      setReminderCount(parseInt(savedCount, 10));
    }
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("DEBUG: Form submitted...");
    
    if (!clientName || !amountDue) {
      alert("Please fill in Client Name and Amount.");
      return;
    }

    if (reminderCount >= 5) {
      onLimitReached();
      return;
    }
    
    setIsGenerating(true);

    try {
      console.log("DEBUG: Fetching /api/generate-reminder...");
      const response = await fetch('/api/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          amount: amountDue,
          currency: '₹ INR',
          invoiceRef: '', 
          daysOverdue: daysOverdue || '14',
          tone: tone.toLowerCase(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // This will now show the REAL error from the API
        throw new Error(data.details || 'Failed to generate.');
      }

      setResult(data);
      const nextCount = reminderCount + 1;
      setReminderCount(nextCount);
      localStorage.setItem('dueblink_free_reminders', nextCount.toString());

      if (nextCount >= 5) onLimitReached();
    } catch (error) {
      console.error("DEBUG: Request failed:", error);
      alert("AI generation failed. Check browser F12 Console for details.");
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
    <div className="mx-auto max-w-2xl bg-slate-50 border border-slate-200/60 p-5 sm:p-8 rounded-2xl shadow-md text-left">
      <h3 className="text-sm font-bold text-[#1C2E8F] mb-6 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2BB6A8] animate-pulse"></span>
          Free Instant Generator Workspace
        </span>
        <span className="text-xs text-slate-400 font-semibold normal-case">
          {reminderCount >= 5 ? '0' : 5 - reminderCount} free remaining
        </span>
      </h3>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">Client Name</label>
            <input type="text" required placeholder="e.g., ABC Media Agency" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/10 focus:border-[#1C2E8F] transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">Amount Due (INR)</label>
            <input type="number" required placeholder="e.g., 25000" value={amountDue} onChange={(e) => setAmountDue(e.target.value)} className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/10 focus:border-[#1C2E8F] transition" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">Days Overdue (Optional)</label>
            <input type="number" placeholder="e.g., 7" value={daysOverdue} onChange={(e) => setDaysOverdue(e.target.value)} className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C2E8F]/10 focus:border-[#1C2E8F] transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">Tone Framework</label>
            <div className="grid grid-cols-3 bg-slate-200/60 p-1 rounded-xl text-xs font-bold text-center">
              {['Gentle', 'Professional', 'Firm'].map((t) => (
                <button key={t} type="button" onClick={() => setTone(t)} className={`py-2 rounded-lg transition-all cursor-pointer ${tone === t ? 'bg-white text-[#1C2E8F] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={isGenerating} className="w-full font-bold text-sm text-white py-3.5 bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] rounded-xl shadow-sm hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
          {isGenerating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          ) : <Sparkles className="w-4 h-4" />}
          {isGenerating ? "Processing Recovery Psychology..." : reminderCount >= 5 ? 'Free Limit Reached' : 'Generate Payment Reminders'}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 p-8 border border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center text-center space-y-4">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#1C2E8F]" />
            </motion.div>
            <p className="text-xs font-bold text-slate-500 animate-pulse uppercase tracking-widest">AI is crafting your strategy...</p>
          </motion.div>
        ) : result ? (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex border-b border-slate-100 pb-2 mb-4 items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-4 text-xs font-bold flex-wrap">
                {['email', 'whatsapp', 'sms', 'psychology'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-2 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${activeTab === tab ? 'border-[#1C2E8F] text-[#1C2E8F]' : 'border-transparent text-slate-400'}`}>
                    {tab === 'email' && <Mail className="w-3.5 h-3.5" />}
                    {tab === 'whatsapp' && <MessageSquare className="w-3.5 h-3.5" />}
                    {tab === 'sms' && <Smartphone className="w-3.5 h-3.5" />}
                    {tab === 'psychology' && <Brain className="w-3.5 h-3.5" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={() => handleCopy(getCopyableText())} className="text-xs bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-bold flex items-center gap-1.5 text-[#1C2E8F] transition cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : "Copy Output"}
              </button>
            </div>
            <div className="text-xs sm:text-sm bg-slate-50 text-slate-800 p-3.5 rounded-xl font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-slate-100">
              {activeTab === 'email' && <div><span className="font-bold text-slate-400 block mb-2 border-b border-slate-200 pb-1 uppercase tracking-wide text-[10px]">Subject:</span><p className="font-sans font-bold mb-4 text-[#1C2E8F] text-sm">{result.email_subject}</p><span className="font-bold text-slate-400 block mb-2 border-b border-slate-200 pb-1 uppercase tracking-wide text-[10px]">Body:</span><p className="font-sans whitespace-pre-line">{result.email_body}</p></div>}
              {activeTab === 'whatsapp' && <p className="font-sans">{result.whatsapp_message}</p>}
              {activeTab === 'sms' && <p className="font-sans">{result.sms_text}</p>}
              {activeTab === 'psychology' && <p className="font-sans text-slate-600 italic">{result.psychology_note}</p>}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}