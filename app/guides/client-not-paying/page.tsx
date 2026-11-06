import { pageMetadata } from '@/lib/seo';
import { ToolNav, ToolFooter } from '@/components/ToolLayout';
import { LifeBuoy, ArrowRight, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { FAQS } from './faqs';

// A step-by-step guide for freelancers and small businesses in India
// whose client hasn't paid. Server page: all text is in the HTML for Google.
export const metadata = pageMetadata({
  title: 'Client Not Paying? What to Do, Step by Step (India) | DueBlink',
  description: 'Client not paying your invoice? A simple step-by-step plan for freelancers and small businesses in India: reminders, a call, a final notice and MSME Samadhaan.',
  path: '/guides/client-not-paying',
});

// Lets Google show the questions and answers directly in search results.
const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

type Step = {
  when: string;
  title: string;
  text: string;
  link?: { href: string; label: string };
};

const STEPS: Step[] = [
  {
    when: 'Before the due date',
    title: 'Check the basics',
    text: 'Make sure the client actually has your invoice, with the right amount, your bank or UPI details and the due date. Many “late” payments are just an invoice that went to the wrong person.',
  },
  {
    when: 'Due date to 3 days late',
    title: 'Send a friendly reminder',
    text: 'Assume they forgot, not that they refused. Keep it short: the amount, what it’s for, and a simple question like “Could you let me know when I can expect it?”',
    link: { href: '/tools/whatsapp-payment-reminder', label: 'WhatsApp reminder templates' },
  },
  {
    when: '1 week late',
    title: 'Follow up and ask for a date',
    text: 'Send a second reminder and ask for a specific payment date. “Next week” is easy to postpone; a date is not. Offer to resend the invoice or bank details.',
    link: { href: '/tools/payment-reminder-email-templates', label: 'Payment reminder email templates' },
  },
  {
    when: '2 weeks late',
    title: 'Call them',
    text: 'A short, calm call often works when messages don’t. If the person you work with isn’t the one who pays, ask for their accounts team and send the invoice there too.',
  },
  {
    when: 'Still not paid',
    title: 'Offer to split the payment',
    text: 'Sometimes the client is short of cash. Offering to accept the amount in two or three parts gets money moving and keeps the relationship.',
  },
  {
    when: '3+ weeks late',
    title: 'Pause work and send a final notice',
    text: 'Stop any ongoing work until it is paid. Send a formal final notice with the amount, a clear deadline (for example 7 days) and the next step you will take. Only mention steps you are really prepared to take.',
    link: { href: '/tools/payment-reminder-email-templates', label: 'Final reminder letter format' },
  },
  {
    when: 'If you are MSME registered',
    title: 'Use your MSME rights',
    text: 'If you are a micro or small enterprise on Udyam, a business buyer must pay within 45 days and owes interest at three times the RBI bank rate after that. You can file a case on the MSME Samadhaan portal.',
    link: { href: '/guides/msme-45-day-payment-rule', label: 'MSME 45-day rule explained' },
  },
  {
    when: 'Last option',
    title: 'Get legal advice',
    text: 'For larger amounts, a lawyer can send a legal notice and advise you on recovery. Compare the cost and time with the amount you are owed before you decide.',
  },
];

const PREVENTION = [
  { title: 'Take an advance', text: 'Ask for 30–50% before you start, especially with new clients.' },
  { title: 'Agree terms in writing', text: 'Amount, due date and late fees in a short agreement or on the invoice.' },
  { title: 'Bill in milestones', text: 'For long projects, invoice after each stage instead of once at the end.' },
  { title: 'Follow up on time', text: 'Reminders sent on schedule get paid faster than ones sent when you remember.' },
];

export default function ClientNotPayingPage() {
  const card = 'bg-white border border-slate-200 rounded-2xl p-5 sm:p-6';
  const h2 = 'text-xl sm:text-2xl font-black text-[#0F172A]';

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased" suppressHydrationWarning={true}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <ToolNav />

      {/* --- HERO --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto text-center space-y-4" suppressHydrationWarning={true}>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-500 mx-auto">
            <LifeBuoy size={13} className="text-[#245B92]" />
            Free Guide
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Client Not Paying? What to Do, Step by Step
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-2xl mx-auto">
            A calm, practical plan for freelancers and small businesses in India: from the first friendly reminder to MSME Samadhaan, and how to stop it happening again.
          </p>
          <a
            href="/#reminder-generator"
            className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xl shadow-md hover:opacity-95 transition"
            style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
          >
            Write a polite reminder now, free <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* --- STEPS --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100 bg-slate-50/60" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto space-y-6" suppressHydrationWarning={true}>
          <div className="text-center space-y-2">
            <h2 className={h2}>What to do, from day 1 to the last option</h2>
            <p className="text-sm text-slate-500 font-medium">Most clients pay by step 3 or 4. Go one step at a time, and stay polite even when you get firmer.</p>
          </div>

          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`${card} flex gap-4`}>
                <span className="w-7 h-7 shrink-0 rounded-full bg-[#245B92] text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                <div className="space-y-1.5 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#20B8BE]">{s.when}</p>
                  <h3 className="text-sm font-black text-[#0F172A]">{s.title}</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{s.text}</p>
                  {s.link && (
                    <a href={s.link.href} className="inline-flex items-center gap-1 text-xs font-bold text-[#245B92] hover:underline">
                      {s.link.label} <ArrowRight size={12} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-medium leading-relaxed">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <p>This guide is general information, not legal advice. For a large amount or a formal step, talk to a CA or lawyer about your situation.</p>
          </div>
        </div>
      </section>

      {/* --- PREVENTION --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto space-y-6" suppressHydrationWarning={true}>
          <div className="text-center space-y-2">
            <ShieldCheck className="w-7 h-7 text-[#245B92] mx-auto" />
            <h2 className={h2}>How to avoid late payments next time</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {PREVENTION.map((p) => (
              <div key={p.title} className={card}>
                <p className="text-sm font-black text-[#0F172A] mb-1">{p.title}</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 font-medium text-center">
            Writing reminders in Hindi or Hinglish?{' '}
            <a href="/tools/payment-reminder-message-hindi" className="font-bold text-[#245B92] hover:underline">See ready-made Hindi &amp; Hinglish messages</a>.
          </p>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <HelpCircle className="w-7 h-7 text-[#245B92] mx-auto" />
            <h2 className={h2}>Frequently asked questions</h2>
          </div>
          <div className="space-y-5">
            {FAQS.map((item) => (
              <div key={item.q} className="border-b border-slate-100 pb-5">
                <p className="text-sm font-black text-[#0F172A] mb-1.5">{item.q}</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-14 sm:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl p-8 sm:p-10 text-center text-white space-y-4" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}>
            <LifeBuoy className="w-8 h-8 mx-auto text-white/90" />
            <h2 className="text-xl sm:text-2xl font-black">Let DueBlink keep track of the follow-ups.</h2>
            <p className="text-sm text-white/85 font-medium max-w-md mx-auto">
              DueBlink remembers every reminder you&apos;ve sent, tells you who to follow up with today, and suggests the next step when a client goes quiet.
            </p>
            <a
              href="/create-account"
              className="inline-flex items-center gap-2 bg-white text-[#0F172A] px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition"
            >
              Try DueBlink Free <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <ToolFooter />
    </div>
  );
}
