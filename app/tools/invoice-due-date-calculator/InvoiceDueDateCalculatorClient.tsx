'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowRight, Menu, X, ChevronDown, Mail, Clock, HelpCircle, Copy, Check, CalendarPlus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const TERM_OPTIONS = [
  { label: 'Net 7', days: 7 },
  { label: 'Net 15', days: 15 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 45', days: 45 },
  { label: 'Net 60', days: 60 },
  { label: 'Net 90', days: 90 },
  { label: 'Custom', days: null as number | null },
];

const FAQS = [
  {
    q: 'What does "Net 30" mean on an invoice?',
    a: 'Net 30 means the full invoice amount is due 30 days after the invoice date. The same logic applies to Net 7, Net 15, Net 45, Net 60, and Net 90 — the number is simply how many days the client has to pay, counted from the date the invoice was issued, not from when they received or opened it.',
  },
  {
    q: 'Is the due date counted from the invoice date or the delivery date?',
    a: 'Almost always the invoice date, unless your contract or payment terms explicitly say otherwise. Some businesses count from the delivery or completion date instead — if that applies to you, use that date as the starting point in the calculator above.',
  },
  {
    q: 'What happens if the due date falls on a weekend or holiday?',
    a: 'Most invoices don\u2019t automatically extend to the next business day — the due date stays as calculated unless your payment terms specifically state otherwise. It\u2019s worth checking your contract, since this varies by industry and region.',
  },
  {
    q: 'Should I offer longer payment terms to win more clients?',
    a: 'Longer terms (Net 60, Net 90) can make you more attractive to larger clients, but every extra day is cash sitting in someone else\u2019s account instead of yours. Shorter terms (Net 7, Net 15) improve your cash flow but may not fit every client relationship. There\u2019s no universally "right" answer — it depends on your leverage and how badly you need predictable cash flow.',
  },
];

export default function InvoiceDueDateCalculatorClient() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [invoiceDate, setInvoiceDate] = useState('');
  const [termIndex, setTermIndex] = useState(2); // default Net 30
  const [customDays, setCustomDays] = useState('30');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = new Date();
    setInvoiceDate(today.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const selectedTerm = TERM_OPTIONS[termIndex];
  const daysToAdd = selectedTerm.days ?? (parseInt(customDays, 10) || 0);

  const result = useMemo(() => {
    if (!invoiceDate || daysToAdd < 0) return null;

    const [year, month, day] = invoiceDate.split('-').map(Number);
    if (!year || !month || !day) return null;

    const invoiceUTC = new Date(Date.UTC(year, month - 1, day));
    const due = new Date(Date.UTC(year, month - 1, day));
    due.setUTCDate(due.getUTCDate() + daysToAdd);

    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const diffDays = Math.round((due.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24));

    const totalSpan = daysToAdd || 1;
    const elapsed = Math.round((todayUTC.getTime() - invoiceUTC.getTime()) / (1000 * 60 * 60 * 24));
    const progressPct = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));

    const status: 'upcoming' | 'due-soon' | 'overdue' =
      diffDays < 0 ? 'overdue' : diffDays <= 3 ? 'due-soon' : 'upcoming';

    return {
      invoiceUTC,
      dueDate: due,
      diffDays,
      progressPct,
      status,
      formatted: due.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      compact: due.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    };
  }, [invoiceDate, daysToAdd]);

  // Side-by-side comparison across every standard term, from the same
  // invoice date — the kind of extra depth a bare free tool wouldn't bother
  // including, since the person only asked about one term length.
  const allTermsComparison = useMemo(() => {
    if (!invoiceDate) return [];
    const [year, month, day] = invoiceDate.split('-').map(Number);
    if (!year || !month || !day) return [];

    return TERM_OPTIONS.filter((t) => t.days !== null).map((t) => {
      const due = new Date(Date.UTC(year, month - 1, day));
      due.setUTCDate(due.getUTCDate() + (t.days as number));
      return {
        label: t.label,
        days: t.days as number,
        date: due.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        isSelected: selectedTerm.days === t.days,
      };
    });
  }, [invoiceDate, selectedTerm]);

  const handleCopyResult = () => {
    if (!result) return;
    const text = `Invoice dated ${new Date(invoiceDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} \u2014 ${selectedTerm.label === 'Custom' ? `${daysToAdd} days` : selectedTerm.label} terms \u2014 payment due ${result.formatted}.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const googleCalendarUrl = useMemo(() => {
    if (!result) return '';
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const start = fmt(result.dueDate);
    const endDate = new Date(result.dueDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    const end = fmt(endDate);
    const title = encodeURIComponent('Invoice payment due');
    const details = encodeURIComponent(
      `Payment due (${selectedTerm.label === 'Custom' ? daysToAdd + ' days' : selectedTerm.label} terms from invoice date).`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }, [result, selectedTerm, daysToAdd]);

  const statusStyles = {
    upcoming: { label: 'On time', icon: CheckCircle2, bg: 'bg-white/15', text: 'text-white' },
    'due-soon': { label: 'Due soon', icon: Clock, bg: 'bg-white/15', text: 'text-white' },
    overdue: { label: 'Overdue', icon: AlertTriangle, bg: 'bg-white/15', text: 'text-white' },
  } as const;

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased" suppressHydrationWarning={true}>

      {/* --- NAV --- */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 shadow-3xs" suppressHydrationWarning={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-32 flex items-center justify-between" suppressHydrationWarning={true}>

          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex items-center justify-start cursor-pointer h-28 w-[380px] sm:w-[500px] relative select-none"
            onClick={() => router.push('/')}
            suppressHydrationWarning={true}
          >
            <Image src="/logo.png" alt="DueBlink Logo" width={500} height={112} priority className="h-full w-full object-contain object-left" />
          </motion.div>

          <div className="hidden md:flex items-center gap-8" suppressHydrationWarning={true}>
            <div className="flex items-center gap-6 text-sm font-bold text-slate-600" suppressHydrationWarning={true}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative py-2 px-3 cursor-pointer transition-colors duration-200 group ${pathname === '/pricing' ? 'text-[#245B92]' : 'hover:text-[#245B92]'}`}
                onClick={() => router.push('/pricing')}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Pricing</span>
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative py-2 px-3 cursor-pointer transition-colors duration-200 group ${pathname?.startsWith('/tools') ? 'text-[#245B92]' : 'hover:text-[#245B92]'}`}
                onClick={() => router.push('/contact')}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Contact</span>
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
              </motion.div>
            </div>

            <div className="flex items-center gap-4" suppressHydrationWarning={true}>
              {!mounted ? (
                <div className="h-9 w-32" suppressHydrationWarning={true} />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 text-sm font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 text-white hover:opacity-95"
                    style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                    suppressHydrationWarning={true}
                  >
                    Dashboard
                  </motion.button>
                  <div className="relative group py-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-[#245B92] transition cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-50" suppressHydrationWarning={true}>
                      Account <ChevronDown size={14} />
                    </motion.button>
                    <div className="absolute right-0 top-full w-40 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 hidden group-hover:block z-50">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer" suppressHydrationWarning={true}>Logout</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/login')} className="text-sm font-bold text-slate-600 hover:text-[#245B92] hover:bg-slate-50 transition cursor-pointer px-3 py-2 rounded-xl" suppressHydrationWarning={true}>Login</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/create-account')} className="text-xs sm:text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>Create Account</motion.button>
                </>
              )}
            </div>
          </div>

          <div className="flex md:hidden items-center">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer" aria-label="Toggle Menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>

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
                <button onClick={() => { router.push('/pricing'); setMobileMenuOpen(false); }} className="text-left py-2 px-3 rounded-lg text-[#1E293B] hover:bg-slate-50 font-bold">Pricing</button>
                <button onClick={() => { router.push('/contact'); setMobileMenuOpen(false); }} className="text-left py-2 px-3 rounded-lg text-[#1E293B] hover:bg-slate-50 font-bold">Contact</button>
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

      {/* --- HERO / TOOL --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto text-center space-y-4" suppressHydrationWarning={true}>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-500 mx-auto" suppressHydrationWarning={true}>
            <Calendar size={13} className="text-[#245B92]" />
            Free Tool
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight" suppressHydrationWarning={true}>
            Invoice Due Date Calculator
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto" suppressHydrationWarning={true}>
            Enter your invoice date and payment terms to instantly find out exactly when payment is due — no manual counting required.
          </p>
        </div>

        <div className="max-w-xl mx-auto mt-10" suppressHydrationWarning={true}>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6" suppressHydrationWarning={true}>

            <div className="space-y-1.5" suppressHydrationWarning={true}>
              <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#245B92] focus:bg-white focus:ring-4 focus:ring-[#245B92]/10 transition text-slate-900"
              />
            </div>

            <div className="space-y-1.5" suppressHydrationWarning={true}>
              <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">Payment Terms</label>
              <div className="grid grid-cols-4 gap-2" suppressHydrationWarning={true}>
                {TERM_OPTIONS.map((term, i) => (
                  <button
                    key={term.label}
                    onClick={() => setTermIndex(i)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      termIndex === i
                        ? 'text-white border-transparent'
                        : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                    style={termIndex === i ? { background: 'linear-gradient(to right, #245B92, #20B8BE)' } : undefined}
                  >
                    {term.label}
                  </button>
                ))}
              </div>

              {selectedTerm.days === null && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="pt-2" suppressHydrationWarning={true}>
                  <div className="relative flex items-center" suppressHydrationWarning={true}>
                    <input
                      type="number"
                      min={0}
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#245B92] focus:bg-white focus:ring-4 focus:ring-[#245B92]/10 transition text-slate-900"
                      placeholder="Number of days"
                    />
                    <span className="absolute right-4 text-xs font-bold text-slate-400">days</span>
                  </div>
                </motion.div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={result.formatted + daysToAdd}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl p-5 sm:p-6 space-y-5"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                >
                  <div className="flex items-center justify-between" suppressHydrationWarning={true}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Payment is due on</p>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${statusStyles[result.status].bg} ${statusStyles[result.status].text}`} suppressHydrationWarning={true}>
                      {(() => { const StatusIcon = statusStyles[result.status].icon; return <StatusIcon size={11} />; })()}
                      {statusStyles[result.status].label}
                    </span>
                  </div>

                  <div className="text-center space-y-1" suppressHydrationWarning={true}>
                    <p className="text-xl sm:text-2xl font-black text-white">{result.formatted}</p>
                    <p className="text-xs font-bold text-white/85">
                      {result.diffDays > 0
                        ? `Due in ${result.diffDays} day${result.diffDays === 1 ? '' : 's'}`
                        : result.diffDays === 0
                          ? 'Due today'
                          : `${Math.abs(result.diffDays)} day${Math.abs(result.diffDays) === 1 ? '' : 's'} overdue`}
                    </p>
                  </div>

                  {/* Timeline: invoice date -> today -> due date */}
                  <div className="space-y-1.5" suppressHydrationWarning={true}>
                    <div className="h-1.5 rounded-full bg-white/20 overflow-hidden" suppressHydrationWarning={true}>
                      <motion.div
                        className="h-full rounded-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${result.progressPct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-bold text-white/70 uppercase tracking-wide" suppressHydrationWarning={true}>
                      <span>Invoiced</span>
                      <span>Due</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1" suppressHydrationWarning={true}>
                    <button
                      onClick={handleCopyResult}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy result'}
                    </button>
                    <a
                      href={googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white text-[#0F172A] text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition cursor-pointer"
                    >
                      <CalendarPlus size={14} />
                      Add to calendar
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Compare every term length at a glance */}
          {allTermsComparison.length > 0 && (
            <div className="mt-6" suppressHydrationWarning={true}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center" suppressHydrationWarning={true}>Due date under every common term</p>
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden" suppressHydrationWarning={true}>
                {allTermsComparison.map((t) => (
                  <div
                    key={t.label}
                    className={`flex items-center justify-between px-4 py-2.5 text-xs ${t.isSelected ? 'bg-[#245B92]/5' : ''}`}
                    suppressHydrationWarning={true}
                  >
                    <span className={`font-bold ${t.isSelected ? 'text-[#245B92]' : 'text-slate-600'}`} suppressHydrationWarning={true}>{t.label}</span>
                    <span className={`font-semibold ${t.isSelected ? 'text-[#245B92]' : 'text-slate-500'}`} suppressHydrationWarning={true}>{t.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100 bg-slate-50/60" suppressHydrationWarning={true}>
        <div className="max-w-2xl mx-auto space-y-6" suppressHydrationWarning={true}>
          <h2 className="text-xl sm:text-2xl font-black text-center" suppressHydrationWarning={true}>How this calculator works</h2>
          <p className="text-sm text-slate-600 font-medium leading-relaxed text-center" suppressHydrationWarning={true}>
            The due date is simply your invoice date plus the number of days in your payment terms. For example, an invoice dated January 1st with Net 30 terms is due January 31st — 30 days later. This calculator does that counting for you, and also tells you how many days remain (or how many days overdue the payment already is) based on today's date.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 pt-2" suppressHydrationWarning={true}>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1" suppressHydrationWarning={true}>
              <p className="text-xs font-black text-[#0F172A]">1. Pick the invoice date</p>
              <p className="text-[11px] text-slate-500 font-medium">The date the invoice was issued.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1" suppressHydrationWarning={true}>
              <p className="text-xs font-black text-[#0F172A]">2. Choose the terms</p>
              <p className="text-[11px] text-slate-500 font-medium">Net 7 through Net 90, or a custom number of days.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1" suppressHydrationWarning={true}>
              <p className="text-xs font-black text-[#0F172A]">3. Get the due date</p>
              <p className="text-[11px] text-slate-500 font-medium">Calculated instantly, with days remaining.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100" suppressHydrationWarning={true}>
        <div className="max-w-2xl mx-auto space-y-8" suppressHydrationWarning={true}>
          <div className="text-center space-y-2" suppressHydrationWarning={true}>
            <HelpCircle className="w-7 h-7 text-[#245B92] mx-auto" />
            <h2 className="text-xl sm:text-2xl font-black" suppressHydrationWarning={true}>Frequently asked questions</h2>
          </div>
          <div className="space-y-5" suppressHydrationWarning={true}>
            {FAQS.map((item) => (
              <div key={item.q} className="border-b border-slate-100 pb-5" suppressHydrationWarning={true}>
                <p className="text-sm font-black text-[#0F172A] mb-1.5" suppressHydrationWarning={true}>{item.q}</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed" suppressHydrationWarning={true}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-14 sm:py-20 px-4" suppressHydrationWarning={true}>
        <div className="max-w-2xl mx-auto" suppressHydrationWarning={true}>
          <div className="rounded-3xl p-8 sm:p-10 text-center text-white space-y-4" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>
            <Clock className="w-8 h-8 mx-auto text-white/90" />
            <h2 className="text-xl sm:text-2xl font-black" suppressHydrationWarning={true}>Stop tracking due dates by hand.</h2>
            <p className="text-sm text-white/85 font-medium max-w-md mx-auto" suppressHydrationWarning={true}>
              DueBlink tracks every invoice's due date automatically and sends AI-written payment reminders before — and after — it's overdue.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/create-account')}
              className="inline-flex items-center gap-2 bg-white text-[#0F172A] px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition cursor-pointer"
            >
              Try DueBlink Free <ArrowRight size={16} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="bg-white border-t border-slate-200"
        suppressHydrationWarning={true}
      >
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-10" suppressHydrationWarning={true}>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-x-6 gap-y-10 md:gap-x-8" suppressHydrationWarning={true}>

            <div className="col-span-2 flex flex-col gap-4" suppressHydrationWarning={true}>
              <div className="h-16 sm:h-20 w-[220px] sm:w-[260px] -ml-2 flex items-center justify-start" suppressHydrationWarning={true}>
                <Image src="/logo.png" alt="DueBlink Logo" width={260} height={88} className="h-full w-full object-contain object-left" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[240px]" suppressHydrationWarning={true}>
                Know who owes you money. Know exactly what to do next.
              </p>
              <a href="mailto:support@dueblink.com" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>
                <Mail size={13} />
                support@dueblink.com
              </a>
            </div>

            <div className="flex flex-col gap-3" suppressHydrationWarning={true}>
              <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>Product</p>
              <a href="/#features" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Features</a>
              <a href="/#ai-recovery-assistant" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>AI recovery assistant</a>
              <a href="/#how-it-works" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>How it works</a>
              <a href="/pricing" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Pricing</a>
            </div>

            <div className="flex flex-col gap-3" suppressHydrationWarning={true}>
              <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>Resources</p>
              <a href="/#reminder-examples" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Reminder examples</a>
              <a href="/#faq" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>FAQ</a>
              <a href="/contact" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Contact us</a>
            </div>

            <div className="flex flex-col gap-3" suppressHydrationWarning={true}>
              <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>Free Tools</p>
              <a href="/tools/invoice-due-date-calculator" className="text-xs font-medium text-[#245B92] w-fit" suppressHydrationWarning={true}>Invoice due date calculator</a>
              <a href="/tools/late-payment-calculator" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Late payment calculator</a>
              <a href="/tools/payment-terms-calculator" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Payment terms calculator</a>
              <a href="/tools/late-payment-interest-calculator" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Late payment interest calculator</a>
            </div>

            <div className="flex flex-col gap-3" suppressHydrationWarning={true}>
              <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>Account</p>
              <a href="/login" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Login</a>
              <a href="/create-account" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Create account</a>
              <a href="/dashboard" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Dashboard</a>
            </div>

            <div className="flex flex-col gap-3" suppressHydrationWarning={true}>
              <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>Legal</p>
              <a href="/privacy" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Privacy policy</a>
              <a href="/terms" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Terms of service</a>
              <a href="/refund-policy" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Refund policy</a>
            </div>

          </div>

          <div className="mt-14 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4" suppressHydrationWarning={true}>
            <span className="text-xs font-medium text-slate-400" suppressHydrationWarning={true}>© 2026 DueBlink. All rights reserved.</span>
            <span className="text-xs font-medium text-slate-400 text-center sm:text-right" suppressHydrationWarning={true}>Built for the ones who'd rather get paid than chase payments.</span>
          </div>

        </div>
      </motion.footer>

    </div>
  );
}
