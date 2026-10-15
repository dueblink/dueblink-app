'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Percent, ArrowRight, HelpCircle, Copy, Check, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import { ToolNav, ToolFooter } from '@/components/ToolLayout';
import {
  calculateInterest, parseDate, formatDate, formatINR,
  RBI_BANK_RATE, RBI_BANK_RATE_AS_OF, MSME_MAX_DAYS, MSME_NO_AGREEMENT_DAYS,
} from './interest';
import { FAQS } from './faqs';

const CREDIT_OPTIONS = [
  { label: 'No agreement', days: MSME_NO_AGREEMENT_DAYS as number | null },
  { label: '30 days', days: 30 as number | null },
  { label: '45 days', days: 45 as number | null },
  { label: 'Custom', days: null as number | null },
];

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function InterestCalculatorClient() {
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [creditIndex, setCreditIndex] = useState(2); // 45 days
  const [customDays, setCustomDays] = useState('30');
  const [stillUnpaid, setStillUnpaid] = useState(true);
  const [paymentDate, setPaymentDate] = useState('');
  const [mode, setMode] = useState<'msme' | 'custom'>('msme');
  const [bankRate, setBankRate] = useState(String(RBI_BANK_RATE));
  const [customRate, setCustomRate] = useState('18');
  const [today, setToday] = useState('');
  const [copied, setCopied] = useState(false);

  // Dates are set after the page loads, so the server and browser agree.
  useEffect(() => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    setToday(toInputDate(todayUTC));
    setPaymentDate(toInputDate(todayUTC));
    setInvoiceDate(toInputDate(new Date(todayUTC.getTime() - 75 * 24 * 60 * 60 * 1000)));
  }, []);

  const selectedCredit = CREDIT_OPTIONS[creditIndex];
  const creditDays = selectedCredit.days ?? (parseInt(customDays, 10) || 0);
  const amountNumber = Number(amount.replace(/,/g, '')) || 0;

  const result = useMemo(() => {
    const start = parseDate(invoiceDate);
    const paid = parseDate(stillUnpaid ? today : paymentDate);
    if (!start || !paid || amountNumber <= 0) return null;
    return calculateInterest({
      amount: amountNumber,
      startDate: start,
      creditDays,
      paymentDate: paid,
      mode,
      bankRate: parseFloat(bankRate) || 0,
      customRate: parseFloat(customRate) || 0,
    });
  }, [invoiceDate, stillUnpaid, today, paymentDate, amountNumber, creditDays, mode, bankRate, customRate]);

  const cappedByMsme = mode === 'msme' && creditDays > MSME_MAX_DAYS;

  const clientNote = result && result.daysLate > 0
    ? mode === 'msme'
      ? `As per Sections 15 and 16 of the MSMED Act, 2006, payment of ${formatINR(amountNumber)} was due on ${formatDate(result.dueDate)}. As the payment is ${result.daysLate} days late, interest of ${formatINR(result.interest)} is payable (at ${result.annualRate.toFixed(2)}% per year, compounded monthly), making the total amount due ${formatINR(result.total)}.`
      : `As per our agreed payment terms, payment of ${formatINR(amountNumber)} was due on ${formatDate(result.dueDate)}. As the payment is ${result.daysLate} days late, late payment interest of ${formatINR(result.interest)} applies (at ${result.annualRate}% per year), making the total amount due ${formatINR(result.total)}.`
    : '';

  const handleCopy = () => {
    if (!clientNote) return;
    navigator.clipboard.writeText(clientNote).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const inputClass = 'w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#245B92] focus:bg-white focus:ring-4 focus:ring-[#245B92]/10 transition text-slate-900 placeholder:text-slate-400 placeholder:font-medium';
  const labelClass = 'block text-[11px] font-bold uppercase text-slate-500 tracking-wider';
  const chip = (active: boolean) =>
    `py-2.5 px-1 rounded-xl text-xs font-bold border transition cursor-pointer ${active ? 'text-white border-transparent' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`;
  const gradient = { background: 'linear-gradient(to right, #245B92, #20B8BE)' };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased" suppressHydrationWarning={true}>

      <ToolNav />

      {/* --- HERO / TOOL --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto text-center space-y-4" suppressHydrationWarning={true}>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-500 mx-auto" suppressHydrationWarning={true}>
            <Percent size={13} className="text-[#245B92]" />
            Free Tool · India
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight" suppressHydrationWarning={true}>
            Late Payment Interest Calculator
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto" suppressHydrationWarning={true}>
            Find out how much interest a client owes you on a late payment, using the MSME 45-day rule (3× the RBI bank rate, compounded monthly) or your own contract rate.
          </p>
        </div>

        <div className="max-w-xl mx-auto mt-10" suppressHydrationWarning={true}>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6" suppressHydrationWarning={true}>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Invoice amount (₹)</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="100000" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Invoice / acceptance date</label>
                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Agreed payment period</label>
              <div className="grid grid-cols-4 gap-2">
                {CREDIT_OPTIONS.map((option, i) => (
                  <button key={option.label} onClick={() => setCreditIndex(i)} className={chip(creditIndex === i)} style={creditIndex === i ? gradient : undefined}>
                    {option.label}
                  </button>
                ))}
              </div>
              {selectedCredit.days === null && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="pt-2 relative flex items-center">
                  <input type="number" min={0} value={customDays} onChange={(e) => setCustomDays(e.target.value)} className={inputClass} placeholder="Number of days" />
                  <span className="absolute right-4 text-xs font-bold text-slate-400">days</span>
                </motion.div>
              )}
              {selectedCredit.days === MSME_NO_AGREEMENT_DAYS && (
                <p className="text-[11px] font-medium text-slate-500 pt-1">With no written agreement, payment is due within 15 days under the MSMED Act.</p>
              )}
              {cappedByMsme && (
                <p className="text-[11px] font-medium text-amber-700 pt-1">The MSME rule allows at most 45 days, so 45 days is used.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Has the client paid?</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setStillUnpaid(true)} className={chip(stillUnpaid)} style={stillUnpaid ? gradient : undefined}>Still unpaid</button>
                <button onClick={() => setStillUnpaid(false)} className={chip(!stillUnpaid)} style={!stillUnpaid ? gradient : undefined}>Paid late</button>
              </div>
              {!stillUnpaid && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputClass} aria-label="Payment date" />
                </motion.div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Interest rate</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode('msme')} className={chip(mode === 'msme')} style={mode === 'msme' ? gradient : undefined}>MSME rule</button>
                <button onClick={() => setMode('custom')} className={chip(mode === 'custom')} style={mode === 'custom' ? gradient : undefined}>My contract rate</button>
              </div>
              {mode === 'msme' ? (
                <div className="pt-2 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  <span>RBI Bank Rate</span>
                  <input value={bankRate} onChange={(e) => setBankRate(e.target.value)} inputMode="decimal" className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#245B92]" aria-label="RBI Bank Rate" />
                  <span>% (as of {RBI_BANK_RATE_AS_OF}) × 3 = <strong className="text-slate-700">{((parseFloat(bankRate) || 0) * 3).toFixed(2)}% a year</strong></span>
                </div>
              ) : (
                <div className="pt-2 relative flex items-center">
                  <input value={customRate} onChange={(e) => setCustomRate(e.target.value)} inputMode="decimal" className={inputClass} placeholder="18" aria-label="Interest rate per year" />
                  <span className="absolute right-4 text-xs font-bold text-slate-400">% per year</span>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={`${result.interest}-${result.daysLate}-${mode}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl p-5 sm:p-6 space-y-5"
                  style={gradient}
                >
                  {result.daysLate > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Interest your client owes</p>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/15 text-white">
                          <AlertTriangle size={11} /> {result.daysLate} days late
                        </span>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-3xl sm:text-4xl font-black text-white">{formatINR(result.interest)}</p>
                        <p className="text-xs font-bold text-white/85">Total now due: {formatINR(result.total)}</p>
                      </div>
                      <div className="bg-white/10 rounded-xl divide-y divide-white/10 text-xs">
                        <div className="flex justify-between px-4 py-2.5"><span className="text-white/75 font-semibold">Payment was due on</span><span className="text-white font-bold">{formatDate(result.dueDate)}</span></div>
                        <div className="flex justify-between px-4 py-2.5"><span className="text-white/75 font-semibold">Rate used</span><span className="text-white font-bold">{mode === 'msme' ? `${result.annualRate.toFixed(2)}% a year, monthly compounding` : `${result.annualRate}% a year, simple`}</span></div>
                      </div>
                      <button onClick={handleCopy} className="w-full inline-flex items-center justify-center gap-1.5 bg-white text-[#0F172A] text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition cursor-pointer">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy a note for your client'}
                      </button>
                    </>
                  ) : (
                    <div className="text-center space-y-2 py-2">
                      <CheckCircle2 className="w-7 h-7 text-white mx-auto" />
                      <p className="text-lg font-black text-white">Not late yet</p>
                      <p className="text-xs font-bold text-white/85">Payment is due on {formatDate(result.dueDate)}. No interest applies before then.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {result && result.daysLate > 0 && (
            <button
              onClick={() => router.push('/tools/payment-reminder-email-templates')}
              className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold text-[#245B92] bg-[#245B92]/5 hover:bg-[#245B92]/10 border border-[#245B92]/15 rounded-2xl py-3 transition cursor-pointer"
            >
              <Mail size={14} /> Need to send a reminder? Use our free email templates
            </button>
          )}

          <p className="mt-4 text-[11px] text-slate-400 font-medium text-center leading-relaxed">
            An estimate to help you know where you stand, not legal advice. For a formal claim, check with your CA or legal advisor.
          </p>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100 bg-slate-50/60" suppressHydrationWarning={true}>
        <div className="max-w-2xl mx-auto space-y-6" suppressHydrationWarning={true}>
          <h2 className="text-xl sm:text-2xl font-black text-center" suppressHydrationWarning={true}>How this calculator works</h2>
          <p className="text-sm text-slate-600 font-medium leading-relaxed text-center" suppressHydrationWarning={true}>
            Under the MSMED Act, 2006, a buyer must pay a micro or small enterprise within the agreed period, which can&apos;t be longer than 45 days (or 15 days with no written agreement). After that, interest is owed at three times the RBI bank rate, compounded every month. This calculator finds the due date, counts the days late, and works out the interest.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 pt-2" suppressHydrationWarning={true}>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-[#0F172A]">1. Enter the invoice</p>
              <p className="text-[11px] text-slate-500 font-medium">The amount and the date the work was accepted.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-[#0F172A]">2. Pick the terms</p>
              <p className="text-[11px] text-slate-500 font-medium">Your agreed payment period, up to 45 days.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-[#0F172A]">3. See what&apos;s owed</p>
              <p className="text-[11px] text-slate-500 font-medium">Interest, total due, and a note to send your client.</p>
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
          <div className="rounded-3xl p-8 sm:p-10 text-center text-white space-y-4" style={gradient} suppressHydrationWarning={true}>
            <Percent className="w-8 h-8 mx-auto text-white/90" />
            <h2 className="text-xl sm:text-2xl font-black" suppressHydrationWarning={true}>Get paid before interest is even needed.</h2>
            <p className="text-sm text-white/85 font-medium max-w-md mx-auto" suppressHydrationWarning={true}>
              DueBlink reminds your clients before and after the due date, step by step, so payments come in on time and you never have to chase by hand.
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
