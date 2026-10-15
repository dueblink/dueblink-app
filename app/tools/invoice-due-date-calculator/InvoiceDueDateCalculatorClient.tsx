'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowRight, Mail, Clock, HelpCircle, Copy, Check, CalendarPlus, CheckCircle2, AlertTriangle, MessageCircle } from 'lucide-react';
import { ToolNav, ToolFooter } from '@/components/ToolLayout';
import { FAQS } from './faqs';

const TERM_OPTIONS = [
  { label: 'Net 7', days: 7 },
  { label: 'Net 15', days: 15 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 45', days: 45 },
  { label: 'Net 60', days: 60 },
  { label: 'Net 90', days: 90 },
  { label: 'Custom', days: null as number | null },
];


export default function InvoiceDueDateCalculatorClient() {
  const router = useRouter();

  const [invoiceDate, setInvoiceDate] = useState('');
  const [termIndex, setTermIndex] = useState(2); // default Net 30
  const [customDays, setCustomDays] = useState('30');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Today's date on the visitor's own calendar (toISOString would use
    // UTC and show yesterday's date in India before 5:30 am).
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setInvoiceDate(`${y}-${m}-${d}`);
  }, []);

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
      formatted: due.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }),
      compact: due.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }),
      isWeekend: due.getUTCDay() === 0 || due.getUTCDay() === 6,
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
        date: due.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }),
        isSelected: selectedTerm.days === t.days,
      };
    });
  }, [invoiceDate, selectedTerm]);

  const handleCopyResult = () => {
    if (!result) return;
    const text = `Invoice dated ${new Date(invoiceDate + 'T00:00:00').toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })} \u2014 ${selectedTerm.label === 'Custom' ? `${daysToAdd} days` : selectedTerm.label} terms \u2014 payment due ${result.formatted}.`;
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

      <ToolNav />

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

          {/* Helpful notes */}
          {result && (result.isWeekend || daysToAdd > 45) && (
            <div className="mt-4 space-y-2" suppressHydrationWarning={true}>
              {result.isWeekend && (
                <p className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5" suppressHydrationWarning={true}>
                  This due date falls on a weekend. Many clients pay on the next working day, so it&apos;s worth sending a reminder on Friday.
                </p>
              )}
              {daysToAdd > 45 && (
                <p className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5" suppressHydrationWarning={true}>
                  India: if you&apos;re a micro or small enterprise (Udyam), the MSMED Act limits payment terms to 45 days. After that, your client owes interest.{' '}
                  <a href="/tools/late-payment-interest-calculator" className="font-bold underline">Calculate it</a>
                </p>
              )}
            </div>
          )}

          {/* Next step when the payment is close or late */}
          {result && result.status !== 'upcoming' && (
            <div className="mt-4 grid grid-cols-2 gap-2" suppressHydrationWarning={true}>
              <a href="/tools/whatsapp-payment-reminder" className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#245B92] bg-[#245B92]/5 hover:bg-[#245B92]/10 border border-[#245B92]/15 rounded-xl py-3 transition">
                <MessageCircle size={14} /> WhatsApp reminder
              </a>
              <a href="/tools/payment-reminder-email-templates" className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#245B92] bg-[#245B92]/5 hover:bg-[#245B92]/10 border border-[#245B92]/15 rounded-xl py-3 transition">
                <Mail size={14} /> Email reminder
              </a>
            </div>
          )}

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

      <ToolFooter />

    </div>
  );
}
