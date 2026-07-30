export default function RefundPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-slate-800">
      
      {/* Header */}
      <h1 className="text-5xl font-black mb-8 bg-gradient-to-r from-[#245B92] to-[#20B8BE] bg-clip-text text-transparent uppercase tracking-tight">
        Refund & Cancellation
      </h1>
      <p className="text-sm font-bold text-slate-400 mb-12 uppercase tracking-widest">
        Last Updated: June 30, 2026
      </p>

      {/* Intro */}
      <div className="prose prose-slate max-w-none text-slate-600 space-y-8 leading-relaxed">
        <p>
          At <strong>DueBlink</strong>, we aim to provide a reliable and valuable experience for all our users. 
          Please read our Refund & Cancellation Policy carefully before purchasing a subscription.
        </p>

        {[
          { title: "1. Subscription Plans", content: "DueBlink offers subscription-based plans that are billed on a monthly or annual basis. By subscribing, you agree to the applicable pricing and billing terms displayed at the time of purchase." },
          { title: "2. Cancellation", content: "You may cancel your subscription at any time from your account settings. If you cancel, your subscription will remain active until the end of your current billing period. You will continue to have access to Pro features until your subscription expires. Your subscription will not renew after the current billing cycle. No cancellation fees apply." },
          { title: "3. Refund Policy", content: "DueBlink generally does not provide refunds for monthly subscription payments, annual subscription payments, partial subscription periods, unused subscription time, or change of mind after purchase. Please review the features and pricing before subscribing." },
          { title: "4. Billing Errors", content: "If you believe you were charged incorrectly or experienced a duplicate payment, please contact us within 7 days of the transaction. After verification, eligible billing errors will be refunded." },
          { title: "5. Failed Payments", content: "If a payment cannot be processed, your subscription may not renew and your account may be downgraded to the Free plan. Your data will remain safe and accessible, and you can renew your subscription at any time to restore Pro features." },
          { title: "6. Downgrading to Free", content: "If your Pro subscription expires or is cancelled, you will continue to have access to your account and previously saved data. However, Pro features such as unlimited AI reminders, unlimited clients, reminder history, and smart templates may become unavailable until you renew your subscription." },
          { title: "7. Free Plan", content: "The Free plan does not require payment and can be used without a subscription, subject to the applicable usage limits." }
        ].map((section, idx) => (
          <section key={idx}>
            <h2 className="text-xl font-black text-[#0F172A] mb-3">{section.title}</h2>
            <p>{section.content}</p>
          </section>
        ))}

        <section>
          <h2 className="text-xl font-black text-[#0F172A] mb-3">8. Contact Us</h2>
          <p>If you have any questions regarding billing, cancellations, or refunds, please contact us:</p>
          <p className="mt-2 font-medium">
            Email: <a href="mailto:support@dueblink.com" className="text-[#245B92] font-bold hover:underline">support@dueblink.com</a><br />
            Website: <a href="https://dueblink.com" className="text-[#245B92] font-bold hover:underline">dueblink.com</a>
          </p>
        </section>
      </div>

      {/* Footer CTA */}
      <div className="pt-12 border-t border-slate-100 mt-16 flex flex-col items-center text-center">
        <p className="text-slate-500 font-medium mb-6">
          Thank you for choosing DueBlink. Our mission is to help freelancers, agencies, consultants, and businesses recover payments faster.
        </p>
        <a 
          href="/" 
          className="inline-block bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white font-bold px-8 py-3 rounded-xl shadow-md hover:opacity-90 transition"
        >
          Return to Home
        </a>
      </div>
    </main>
  );
}