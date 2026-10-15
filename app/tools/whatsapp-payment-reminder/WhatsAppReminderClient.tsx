'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ArrowRight, HelpCircle, Copy, Check, RefreshCw, Send, Clock, Sparkles, CheckCheck } from 'lucide-react';
import { ToolNav, ToolFooter } from '@/components/ToolLayout';
import { FAQS } from './faqs';

// =========================================================
// TEMPLATES
// =========================================================
// Every message is written by hand (no AI), so it's instant and free.
// Words between *stars* show in bold on WhatsApp.

type Tone = 'polite' | 'firm';

type Values = {
  hi: string;        // "Hi Rahul" or "Hi"
  amount: string;    // "the payment of *₹25,000*" or "the pending payment"
  forWork: string;   // " for the website design" or ""
  sign: string;      // "\n\n– Priya" or ""
};

type Template = { tone: Tone; text: (v: Values) => string };

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const STAGES: { id: string; label: string; short: string; templates: Template[] }[] = [
  {
    id: 'before',
    label: 'Before the due date',
    short: 'Due soon',
    templates: [
      { tone: 'polite', text: (v) => `${v.hi}, hope you're doing well! Just a friendly heads-up that ${v.amount}${v.forWork} is due in a couple of days. Let me know if you need the invoice again. Thank you! 🙏${v.sign}` },
      { tone: 'polite', text: (v) => `${v.hi}! A quick reminder that ${v.amount}${v.forWork} is due this week. Sharing so it's on your radar. Thanks!${v.sign}` },
      { tone: 'firm', text: (v) => `${v.hi}, this is a reminder that ${v.amount}${v.forWork} is due in 2 days, as per the invoice. Please plan the transfer accordingly. Thanks.${v.sign}` },
    ],
  },
  {
    id: 'today',
    label: 'On the due date',
    short: 'Due today',
    templates: [
      { tone: 'polite', text: (v) => `${v.hi}, hope all's well! Just a reminder that ${v.amount}${v.forWork} is due today. Could you please process it when you get a moment? Thank you! 🙏${v.sign}` },
      { tone: 'polite', text: (v) => `${v.hi}! ${capitalize(v.amount)}${v.forWork} is due today. If you've already sent it, please ignore this, and thanks a lot!${v.sign}` },
      { tone: 'firm', text: (v) => `${v.hi}, ${v.amount}${v.forWork} is due today. Please share the payment confirmation once it's done. Thank you.${v.sign}` },
    ],
  },
  {
    id: 'late3',
    label: 'A few days late',
    short: '3 days late',
    templates: [
      { tone: 'polite', text: (v) => `${v.hi}, just checking in on ${v.amount}${v.forWork}. It was due a few days ago and I haven't received it yet. Could you let me know when I can expect it? Thanks!${v.sign}` },
      { tone: 'polite', text: (v) => `${v.hi}, hope you're well! I think ${v.amount}${v.forWork} may have slipped through the cracks. Could you please check and update me? 🙏${v.sign}` },
      { tone: 'firm', text: (v) => `${v.hi}, ${v.amount}${v.forWork} is now 3 days overdue. Please arrange the payment at the earliest and share the confirmation. Thank you.${v.sign}` },
    ],
  },
  {
    id: 'late7',
    label: 'One week late',
    short: '1 week late',
    templates: [
      { tone: 'polite', text: (v) => `${v.hi}, following up again on ${v.amount}${v.forWork}, which is now a week overdue. Is anything holding it up on your side? Happy to resend the invoice or bank details if that helps.${v.sign}` },
      { tone: 'polite', text: (v) => `${v.hi}, a gentle reminder that ${v.amount}${v.forWork} is still pending, a week past the due date. Could you please share a date when I can expect it? Thanks for understanding.${v.sign}` },
      { tone: 'firm', text: (v) => `${v.hi}, ${v.amount}${v.forWork} is now 7 days overdue and I haven't heard back. Please confirm today when the payment will be made.${v.sign}` },
    ],
  },
  {
    id: 'final',
    label: 'Final reminder (2+ weeks late)',
    short: 'Final',
    templates: [
      { tone: 'polite', text: (v) => `${v.hi}, I've sent a few reminders about ${v.amount}${v.forWork}, which is now over 2 weeks overdue. I'd really appreciate it if you could clear it this week. Please let me know if there's an issue I can help with.${v.sign}` },
      { tone: 'firm', text: (v) => `${v.hi}, ${v.amount}${v.forWork} is now more than 2 weeks overdue, despite earlier reminders. Please clear it within the next 3 days. If it isn't received by then, I'll have to pause further work until it's settled.${v.sign}` },
      { tone: 'firm', text: (v) => `${v.hi}, this is my final reminder for ${v.amount}${v.forWork}, which is now well past due. Please make the payment by this Friday. After that, late fees will apply as per our terms.${v.sign}` },
    ],
  },
];

const CURRENCIES = ['₹', '$', '€', '£', 'AED'];


// =========================================================
// HELPERS
// =========================================================

function formatAmount(amount: string, currency: string): string {
  const number = Number(amount.replace(/,/g, ''));
  if (!amount.trim() || !isFinite(number) || number <= 0) return '';
  const formatted = currency === '₹'
    ? number.toLocaleString('en-IN')
    : number.toLocaleString('en-US');
  return currency === 'AED' ? `AED ${formatted}` : `${currency}${formatted}`;
}

// Shows *bold* parts in bold, like WhatsApp does.
function WhatsAppText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('*') && part.endsWith('*') && part.length > 2
          ? <strong key={i}>{part.slice(1, -1)}</strong>
          : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </>
  );
}

// =========================================================
// PAGE
// =========================================================

export default function WhatsAppReminderClient() {
  const router = useRouter();

  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [work, setWork] = useState('');
  const [yourName, setYourName] = useState('');
  const [phone, setPhone] = useState('');

  const [stageIndex, setStageIndex] = useState(2); // "3 days late"
  const [tone, setTone] = useState<Tone>('polite');
  const [variant, setVariant] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const values: Values = useMemo(() => {
    const money = formatAmount(amount, currency);
    return {
      hi: clientName.trim() ? `Hi ${clientName.trim()}` : 'Hi',
      amount: money ? `the payment of *${money}*` : 'the pending payment',
      forWork: work.trim() ? ` for ${work.trim()}` : '',
      sign: yourName.trim() ? `\n\n– ${yourName.trim()}` : '',
    };
  }, [clientName, amount, currency, work, yourName]);

  const stage = STAGES[stageIndex];
  const toneTemplates = stage.templates.filter((t) => t.tone === tone);
  const template = toneTemplates[variant % toneTemplates.length] || stage.templates[0];
  const message = template.text(values);

  const whatsappUrl = (text: string) => {
    let number = phone.replace(/\D/g, '');
    if (number.length === 10) number = `91${number}`;
    return number
      ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => {});
  };

  const inputClass = 'w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#245B92] focus:bg-white focus:ring-4 focus:ring-[#245B92]/10 transition text-slate-900 placeholder:text-slate-400 placeholder:font-medium';
  const labelClass = 'block text-[11px] font-bold uppercase text-slate-500 tracking-wider';

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased" suppressHydrationWarning={true}>

      <ToolNav />

      {/* --- HERO / TOOL --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto text-center space-y-4" suppressHydrationWarning={true}>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-500 mx-auto" suppressHydrationWarning={true}>
            <MessageCircle size={13} className="text-[#245B92]" />
            Free Tool
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight" suppressHydrationWarning={true}>
            WhatsApp Payment Reminder Messages
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto" suppressHydrationWarning={true}>
            Ready-to-send WhatsApp messages to remind a client about payment, politely or firmly. Add your details, pick how late the payment is, and send it in one tap.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mt-10 grid lg:grid-cols-2 gap-6 items-start" suppressHydrationWarning={true}>

          {/* FORM */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5" suppressHydrationWarning={true}>

            <div className="grid sm:grid-cols-2 gap-4" suppressHydrationWarning={true}>
              <div className="space-y-1.5">
                <label className={labelClass}>Client name</label>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Rahul" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Amount</label>
                <div className="flex gap-2">
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputClass} w-[88px] px-3`} aria-label="Currency">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="25000" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>What it&apos;s for <span className="normal-case font-semibold text-slate-400">(optional)</span></label>
              <input value={work} onChange={(e) => setWork(e.target.value)} placeholder="e.g. the website design" className={inputClass} />
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
              <label className={labelClass}>Tone</label>
              <div className="grid grid-cols-2 gap-2">
                {(['polite', 'firm'] as Tone[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTone(t); setVariant(0); }}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${tone === t ? 'text-white border-transparent' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    style={tone === t ? { background: 'linear-gradient(to right, #245B92, #20B8BE)' } : undefined}
                  >
                    {t === 'polite' ? 'Polite' : 'Firm'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Your name <span className="normal-case font-semibold text-slate-400">(optional)</span></label>
                <input value={yourName} onChange={(e) => setYourName(e.target.value)} placeholder="e.g. Priya" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Client&apos;s WhatsApp <span className="normal-case font-semibold text-slate-400">(optional)</span></label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="98765 43210" className={inputClass} />
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="lg:sticky lg:top-36 space-y-3" suppressHydrationWarning={true}>
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50" suppressHydrationWarning={true}>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">
                  {(clientName.trim().charAt(0) || 'C').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{clientName.trim() || 'Your client'}</p>
                  <p className="text-[10px] font-semibold text-white/75">WhatsApp preview · {stage.label}</p>
                </div>
              </div>

              {/* Chat body */}
              <div className="bg-[#EFEAE2] px-4 py-6 min-h-[220px] flex flex-col justify-end">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={message}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-auto max-w-[88%] bg-[#D9FDD3] rounded-2xl rounded-tr-sm px-3.5 py-2.5 shadow-sm"
                  >
                    <p className="text-[13px] leading-relaxed text-[#111B21] whitespace-pre-line">
                      <WhatsAppText text={message} />
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500">
                      10:30 am <CheckCheck size={13} className="text-[#53BDEB]" />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="bg-white p-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setVariant((v) => v + 1)}
                  disabled={toneTemplates.length < 2}
                  className="inline-flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} /> Another
                </button>
                <button
                  onClick={() => copy(message, 'main')}
                  className="inline-flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  {copiedKey === 'main' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey === 'main' ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={whatsappUrl(message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-95 transition cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                >
                  <Send size={14} /> Send
                </a>
              </div>
            </div>

            <button
              onClick={() => router.push('/#reminder-generator')}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#245B92] bg-[#245B92]/5 hover:bg-[#245B92]/10 border border-[#245B92]/15 rounded-2xl py-3 transition cursor-pointer"
            >
              <Sparkles size={14} /> Want a unique message for this client? Write one with AI, free
            </button>
          </div>
        </div>
      </section>

      {/* --- ALL TEMPLATES --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100 bg-slate-50/60" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto space-y-10" suppressHydrationWarning={true}>
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black" suppressHydrationWarning={true}>All WhatsApp payment reminder templates</h2>
            <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>
              15 messages for every stage, from a friendly heads-up to a final reminder. Your details above are filled in automatically.
            </p>
          </div>

          {STAGES.map((s) => (
            <div key={s.id} className="space-y-3" suppressHydrationWarning={true}>
              <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2" suppressHydrationWarning={true}>
                <Clock size={15} className="text-[#245B92]" /> {s.label}
              </h3>
              <div className="space-y-3">
                {s.templates.map((t, i) => {
                  const text = t.text(values);
                  const key = `${s.id}-${i}`;
                  return (
                    <div key={key} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3" suppressHydrationWarning={true}>
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${t.tone === 'polite' ? 'bg-[#20B8BE]/10 text-[#178F94]' : 'bg-[#245B92]/10 text-[#245B92]'}`}>
                        {t.tone === 'polite' ? 'Polite' : 'Firm'}
                      </span>
                      <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-line">
                        <WhatsAppText text={text} />
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copy(text, key)}
                          className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                        >
                          {copiedKey === key ? <Check size={12} /> : <Copy size={12} />}
                          {copiedKey === key ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={whatsappUrl(text)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:opacity-95 transition cursor-pointer"
                          style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                        >
                          <Send size={12} /> Send on WhatsApp
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
          <h2 className="text-xl sm:text-2xl font-black text-center" suppressHydrationWarning={true}>Tips for payment reminders on WhatsApp</h2>
          <div className="grid sm:grid-cols-3 gap-4 pt-2" suppressHydrationWarning={true}>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-[#0F172A]">1. Be specific</p>
              <p className="text-[11px] text-slate-500 font-medium">Mention the amount and what it&apos;s for, so there&apos;s no back-and-forth.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-[#0F172A]">2. Ask for a date</p>
              <p className="text-[11px] text-slate-500 font-medium">&quot;When can I expect it?&quot; gets a clearer answer than &quot;please pay&quot;.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-black text-[#0F172A]">3. Get firmer slowly</p>
              <p className="text-[11px] text-slate-500 font-medium">Start friendly. Mention late fees only in the final reminder.</p>
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
            <MessageCircle className="w-8 h-8 mx-auto text-white/90" />
            <h2 className="text-xl sm:text-2xl font-black" suppressHydrationWarning={true}>Stop remembering who to chase.</h2>
            <p className="text-sm text-white/85 font-medium max-w-md mx-auto" suppressHydrationWarning={true}>
              DueBlink remembers every reminder you&apos;ve sent, tells you who to follow up with today, and writes the next message for you.
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

