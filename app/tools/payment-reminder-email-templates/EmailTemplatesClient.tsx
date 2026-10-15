'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, HelpCircle, Copy, Check, RefreshCw, Send, Clock, Sparkles } from 'lucide-react';
import { ToolNav, ToolFooter } from '@/components/ToolLayout';
import { STAGES, EmailValues, Tone } from './templates';
import { FAQS } from './faqs';

const CURRENCIES = ['₹', '$', '€', '£', 'AED'];

const TONE_STYLES: Record<Tone, { label: string; className: string }> = {
  friendly: { label: 'Friendly', className: 'bg-[#20B8BE]/10 text-[#178F94]' },
  firm: { label: 'Firm', className: 'bg-[#245B92]/10 text-[#245B92]' },
  final: { label: 'Final', className: 'bg-slate-900/10 text-slate-800' },
};

function formatAmount(amount: string, currency: string): string {
  const number = Number(amount.replace(/,/g, ''));
  if (!amount.trim() || !isFinite(number) || number <= 0) return '';
  const formatted = currency === '₹'
    ? number.toLocaleString('en-IN')
    : number.toLocaleString('en-US');
  return currency === 'AED' ? `AED ${formatted}` : `${currency}${formatted}`;
}

function formatDueDate(value: string): string {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

export default function EmailTemplatesClient() {
  const router = useRouter();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [work, setWork] = useState('');
  const [yourName, setYourName] = useState('');

  const [stageIndex, setStageIndex] = useState(2); // "3 days late"
  const [variant, setVariant] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const values: EmailValues = useMemo(() => {
    const money = formatAmount(amount, currency);
    const forWork = work.trim() ? ` for ${work.trim()}` : '';
    const invoice = invoiceNo.trim();
    return {
      greeting: clientName.trim() ? `Hi ${clientName.trim()},` : 'Hi,',
      payment: money
        ? `the payment of ${money}${forWork}`
        : forWork
          ? `the payment${forWork}`
          : 'the payment for my latest invoice',
      ref: invoice ? ` (invoice ${invoice})` : '',
      refSubject: invoice ? ` – Invoice ${invoice}` : '',
      dueOn: formatDueDate(dueDate),
      sender: yourName.trim(),
    };
  }, [clientName, amount, currency, invoiceNo, dueDate, work, yourName]);

  const stage = STAGES[stageIndex];
  const template = stage.templates[variant % stage.templates.length];
  const subject = template.subject(values);
  const body = template.body(values);

  const mailtoUrl = (s: string, b: string) =>
    `mailto:${clientEmail.trim()}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(b)}`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => {});
  };

  const inputClass = 'w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#245B92] focus:bg-white focus:ring-4 focus:ring-[#245B92]/10 transition text-slate-900 placeholder:text-slate-400 placeholder:font-medium';
  const labelClass = 'block text-[11px] font-bold uppercase text-slate-500 tracking-wider';
  const optional = <span className="normal-case font-semibold text-slate-400">(optional)</span>;

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased" suppressHydrationWarning={true}>

      <ToolNav />

      {/* --- HERO / TOOL --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto text-center space-y-4" suppressHydrationWarning={true}>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-500 mx-auto" suppressHydrationWarning={true}>
            <Mail size={13} className="text-[#245B92]" />
            Free Tool
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight" suppressHydrationWarning={true}>
            Payment Reminder Email Templates
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto" suppressHydrationWarning={true}>
            Friendly, firm and final payment reminder emails, with subject lines. Add your invoice details, pick how late the payment is, and open it in your email app.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mt-10 grid lg:grid-cols-2 gap-6 items-start" suppressHydrationWarning={true}>

          {/* FORM */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5" suppressHydrationWarning={true}>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Client name</label>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Rahul" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Client email {optional}</label>
                <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} type="email" inputMode="email" placeholder="rahul@company.com" className={inputClass} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Amount</label>
                <div className="flex gap-2">
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputClass} w-[88px] px-3`} aria-label="Currency">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="25000" className={inputClass} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Invoice number {optional}</label>
                <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="e.g. INV-102" className={inputClass} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Due date {optional}</label>
                <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>What it&apos;s for {optional}</label>
                <input value={work} onChange={(e) => setWork(e.target.value)} placeholder="e.g. the website design" className={inputClass} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>How late is the payment?</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {STAGES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setStageIndex(i); setVariant(0); }}
                    className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition cursor-pointer ${stageIndex === i ? 'text-white border-transparent' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    style={stageIndex === i ? { background: 'linear-gradient(to right, #245B92, #20B8BE)' } : undefined}
                  >
                    {s.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Your name {optional}</label>
              <input value={yourName} onChange={(e) => setYourName(e.target.value)} placeholder="e.g. Priya" className={inputClass} />
            </div>
          </div>

          {/* PREVIEW */}
          <div className="lg:sticky lg:top-36 space-y-3" suppressHydrationWarning={true}>
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 bg-white" suppressHydrationWarning={true}>
              <div className="flex items-center justify-between px-5 py-3 text-white" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}>
                <span className="text-sm font-bold flex items-center gap-2"><Mail size={15} /> Email preview</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/20`}>
                  {TONE_STYLES[template.tone].label}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={subject + body}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-5 py-2.5 border-b border-slate-100 text-xs flex gap-2">
                    <span className="font-bold text-slate-400 w-14 shrink-0">To</span>
                    <span className="font-semibold text-slate-700 truncate">{clientEmail.trim() || 'Your client'}</span>
                  </div>
                  <div className="px-5 py-2.5 border-b border-slate-100 text-xs flex gap-2">
                    <span className="font-bold text-slate-400 w-14 shrink-0">Subject</span>
                    <span className="font-bold text-[#0F172A]">{subject}</span>
                  </div>
                  <p className="px-5 py-5 text-[13px] leading-relaxed text-slate-700 whitespace-pre-line min-h-[220px]">
                    {body}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="p-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setVariant((v) => v + 1)}
                  className="inline-flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  <RefreshCw size={14} /> Another
                </button>
                <button
                  onClick={() => copy(`Subject: ${subject}\n\n${body}`, 'main')}
                  className="inline-flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  {copiedKey === 'main' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey === 'main' ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={mailtoUrl(subject, body)}
                  className="inline-flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-95 transition cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                >
                  <Send size={14} /> Open email
                </a>
              </div>
            </div>

            <button
              onClick={() => router.push('/#reminder-generator')}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#245B92] bg-[#245B92]/5 hover:bg-[#245B92]/10 border border-[#245B92]/15 rounded-2xl py-3 transition cursor-pointer"
            >
              <Sparkles size={14} /> Want a unique email for this client? Write one with AI, free
            </button>
          </div>
        </div>
      </section>

      {/* --- ALL TEMPLATES --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100 bg-slate-50/60" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto space-y-10" suppressHydrationWarning={true}>
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black" suppressHydrationWarning={true}>All payment reminder email templates</h2>
            <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>
              15 emails with subject lines, from a friendly heads-up to a final notice. Your details above are filled in automatically.
            </p>
          </div>

          {STAGES.map((s) => (
            <div key={s.id} className="space-y-3" suppressHydrationWarning={true}>
              <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2" suppressHydrationWarning={true}>
                <Clock size={15} className="text-[#245B92]" /> {s.label}
              </h3>
              <div className="space-y-3">
                {s.templates.map((t, i) => {
                  const tSubject = t.subject(values);
                  const tBody = t.body(values);
                  const key = `${s.id}-${i}`;
                  return (
                    <div key={key} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3" suppressHydrationWarning={true}>
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${TONE_STYLES[t.tone].className}`}>
                        {TONE_STYLES[t.tone].label}
                      </span>
                      <p className="text-[13px] font-bold text-[#0F172A]">Subject: {tSubject}</p>
                      <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-line">{tBody}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copy(`Subject: ${tSubject}\n\n${tBody}`, key)}
                          className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                        >
                          {copiedKey === key ? <Check size={12} /> : <Copy size={12} />}
                          {copiedKey === key ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={mailtoUrl(tSubject, tBody)}
                          className="inline-flex items-center gap-1.5 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:opacity-95 transition cursor-pointer"
                          style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                        >
                          <Send size={12} /> Open in email
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- TIPS --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100" suppressHydrationWarning={true}>
        <div className="max-w-2xl mx-auto space-y-6" suppressHydrationWarning={true}>
          <h2 className="text-xl sm:text-2xl font-black text-center" suppressHydrationWarning={true}>Tips for payment reminder emails</h2>
          <div className="grid sm:grid-cols-3 gap-4 pt-2" suppressHydrationWarning={true}>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-[#0F172A]">1. Clear subject line</p>
              <p className="text-[11px] text-slate-500 font-medium">Put the invoice number in it, so the client can find it later.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-[#0F172A]">2. Reply in the same thread</p>
              <p className="text-[11px] text-slate-500 font-medium">Send follow-ups as replies, so the whole history stays in one place.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-[#0F172A]">3. Get firmer slowly</p>
              <p className="text-[11px] text-slate-500 font-medium">Start friendly. Mention late fees only in the final notice.</p>
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
            <Mail className="w-8 h-8 mx-auto text-white/90" />
            <h2 className="text-xl sm:text-2xl font-black" suppressHydrationWarning={true}>Let DueBlink send the follow-ups.</h2>
            <p className="text-sm text-white/85 font-medium max-w-md mx-auto" suppressHydrationWarning={true}>
              DueBlink sends polite reminder emails automatically when a client goes quiet, and gets firmer step by step, so you never have to chase by hand.
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
