import { pageMetadata } from '@/lib/seo';
import { ToolNav, ToolFooter } from '@/components/ToolLayout';
import { Scale, Calendar, Percent, Landmark, ArrowRight, HelpCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { FAQS } from './faqs';

// A plain-language guide to the MSME 45-day payment rule (MSMED Act, 2006).
// Server page: all text is in the HTML, so Google can read it easily.
export const metadata = pageMetadata({
  title: 'MSME 45-Day Payment Rule Explained (Simple Guide) | DueBlink',
  description: 'The MSME 45-day payment rule in simple words: who it covers, how the days are counted, the interest a late buyer owes, and how to complain on MSME Samadhaan.',
  path: '/guides/msme-45-day-payment-rule',
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

const KEY_POINTS = [
  { icon: Calendar, title: '15 days', text: 'Time to pay when there is no written payment agreement.' },
  { icon: Calendar, title: '45 days max', text: 'Even with an agreement, payment can’t be later than 45 days.' },
  { icon: Percent, title: '3× bank rate', text: 'Interest on late payments: three times the RBI bank rate, compounded monthly.' },
  { icon: Landmark, title: 'MSME Samadhaan', text: 'The government’s online portal to file a delayed payment case.' },
];

const STEPS = [
  { title: 'Send polite reminders first', text: 'Most late payments are forgotten, not refused. Start with a friendly reminder and follow up at 3 days, 1 week and 2 weeks late.' },
  { title: 'Mention your MSME status, politely', text: 'In a later reminder, say you are a registered micro or small enterprise and that payments are due within 45 days under the MSMED Act. This alone often gets a reply.' },
  { title: 'Send a formal final notice', text: 'Give a clear deadline (for example 7 days), state the amount, the invoice and the interest that applies under Section 16, and say that you may file on MSME Samadhaan.' },
  { title: 'File on MSME Samadhaan', text: 'If you are still not paid, file an online application on the MSME Samadhaan portal with your Udyam number, invoices and proof of delivery. It goes to your state’s MSME Facilitation Council.' },
  { title: 'Conciliation, then arbitration', text: 'The Council first tries to settle the case through conciliation. If that fails, it can move to arbitration. Talk to a CA or lawyer before this stage.' },
];

export default function Msme45DayRulePage() {
  const card = 'bg-white border border-slate-200 rounded-2xl p-5 sm:p-6';
  const h2 = 'text-xl sm:text-2xl font-black text-[#0F172A]';
  const p = 'text-sm text-slate-600 font-medium leading-relaxed';

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
            <Scale size={13} className="text-[#245B92]" />
            Free Guide
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            MSME 45-Day Payment Rule Explained
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-2xl mx-auto">
            If you are a micro or small business registered on Udyam, the businesses that buy from you must pay within 45 days. If they pay late, the law says they owe you interest. Here is how it works, in simple words.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4" suppressHydrationWarning={true}>
          {KEY_POINTS.map((k) => (
            <div key={k.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-slate-200/40 space-y-2">
              <k.icon size={20} className="text-[#245B92]" />
              <p className="text-lg font-black text-[#0F172A]">{k.title}</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{k.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CONTENT --- */}
      <section className="py-14 sm:py-20 px-4 border-b border-slate-100 bg-slate-50/60" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto space-y-12" suppressHydrationWarning={true}>

          {/* What the rule says */}
          <div className="space-y-3">
            <h2 className={h2}>What the 45-day rule says</h2>
            <p className={p}>
              The rule comes from <strong>Section 15 of the MSMED Act, 2006</strong>. When a micro or small enterprise supplies goods or services, the buyer must pay by the date agreed in writing. That agreed date can never be more than <strong>45 days</strong> after the buyer accepts the goods or services. If there is no written agreement, the buyer must pay within <strong>15 days</strong>.
            </p>
          </div>

          {/* Who it covers */}
          <div className="space-y-4">
            <h2 className={h2}>Who it covers</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className={card}>
                <p className="text-sm font-black text-[#0F172A] mb-3 flex items-center gap-2"><CheckCircle2 size={16} className="text-[#20B8BE]" /> Covered</p>
                <ul className="space-y-2 text-xs text-slate-600 font-medium list-disc list-inside">
                  <li>Micro and small enterprises registered on Udyam</li>
                  <li>Manufacturing and service businesses, including freelancers and agencies registered as service providers</li>
                  <li>Payments from the businesses and organisations that buy from you</li>
                </ul>
              </div>
              <div className={card}>
                <p className="text-sm font-black text-[#0F172A] mb-3 flex items-center gap-2"><XCircle size={16} className="text-slate-400" /> Not covered</p>
                <ul className="space-y-2 text-xs text-slate-600 font-medium list-disc list-inside">
                  <li>Medium enterprises</li>
                  <li>Businesses not registered on Udyam at the time of supply</li>
                  <li>Retail and wholesale traders (their Udyam registration is for priority sector lending only)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How days are counted */}
          <div className="space-y-3">
            <h2 className={h2}>How the days are counted</h2>
            <p className={p}>
              The days start from the <strong>day of acceptance</strong>: the day the buyer accepts your goods or services. If the buyer doesn’t raise any objection within 15 days of delivery, the delivery day itself counts as acceptance (called <strong>deemed acceptance</strong>).
            </p>
            <div className={`${card} text-xs text-slate-600 font-medium space-y-1.5`}>
              <p><span className="font-bold text-slate-800">Example:</span> you deliver a website on 1 March and the client raises no issues.</p>
              <p>No written agreement → payment due by <strong>16 March</strong> (15 days).</p>
              <p>Agreement says 30 days → due by <strong>31 March</strong>.</p>
              <p>Agreement says 60 days → still due by <strong>15 April</strong>, because 45 days is the maximum.</p>
            </div>
          </div>

          {/* Interest */}
          <div className="space-y-3">
            <h2 className={h2}>The interest a late buyer owes</h2>
            <p className={p}>
              Under <strong>Section 16</strong>, if the buyer pays late, they must pay <strong>compound interest with monthly rests</strong> at <strong>three times the bank rate</strong> notified by the Reserve Bank of India. The interest runs from the due date until the day you are paid. This is much higher than normal bank interest, which is why the rule works.
            </p>
            <a
              href="/tools/late-payment-interest-calculator"
              className="group inline-flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xl hover:opacity-95 transition"
              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
            >
              Calculate the interest on your invoice <ArrowRight size={16} />
            </a>
          </div>

          {/* 43B(h) */}
          <div className="space-y-3">
            <h2 className={h2}>Why buyers now take this seriously: Section 43B(h)</h2>
            <p className={p}>
              Since the 2023–24 financial year, <strong>Section 43B(h) of the Income Tax Act</strong> says a business can claim a payment to a micro or small enterprise as an expense only in the year it is actually paid within the MSMED Act time limit. Paying you late can increase the buyer’s own tax for that year. The interest they pay you for the delay can’t be claimed as an expense either.
            </p>
          </div>

          {/* What to do */}
          <div className="space-y-4">
            <h2 className={h2}>What to do if a buyer pays late</h2>
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className={`${card} flex gap-4`}>
                  <span className="w-7 h-7 shrink-0 rounded-full bg-[#245B92] text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-[#0F172A]">{s.title}</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Sample line */}
          <div className="space-y-3">
            <h2 className={h2}>A polite way to mention the MSME rule</h2>
            <div className={`${card} space-y-3 text-[13px] text-slate-700 leading-relaxed`}>
              <p><span className="font-bold text-slate-800">English:</span> “As a registered micro enterprise (Udyam No. [your number]), payments to us are due within 45 days under the MSMED Act, 2006. Could you please confirm the payment date for invoice [number]?”</p>
              <p><span className="font-bold text-slate-800">Hinglish:</span> “Hum Udyam registered micro enterprise hain (Udyam No. [your number]), aur MSMED Act ke hisaab se payment 45 din ke andar due hota hai. Kya aap invoice [number] ki payment date confirm kar sakte hain?”</p>
            </div>
          </div>

          {/* Note */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-medium leading-relaxed">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <p>This guide is general information, not legal or tax advice. Rules and rates can change, so check the latest on the official MSME and RBI websites, or ask a CA or lawyer about your situation.</p>
          </div>
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
            <Scale className="w-8 h-8 mx-auto text-white/90" />
            <h2 className="text-xl sm:text-2xl font-black">Most clients pay after a good reminder.</h2>
            <p className="text-sm text-white/85 font-medium max-w-md mx-auto">
              Before any formal step, send a clear, polite reminder. DueBlink writes one for WhatsApp or email in seconds, free, with no sign-up.
            </p>
            <a
              href="/#reminder-generator"
              className="inline-flex items-center gap-2 bg-white text-[#0F172A] px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition"
            >
              Write a reminder free <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <ToolFooter />
    </div>
  );
}
