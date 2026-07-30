export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-slate-800">
      
      {/* Header */}
      <h1 className="text-5xl font-black mb-8 bg-gradient-to-r from-[#245B92] to-[#20B8BE] bg-clip-text text-transparent uppercase tracking-tight">
        Terms of Service
      </h1>
      <p className="text-sm font-bold text-slate-400 mb-12 uppercase tracking-widest">
        Last Updated: June 30, 2026
      </p>

      {/* Intro */}
      <div className="prose prose-slate max-w-none text-slate-600 space-y-6 leading-relaxed">
        <p>
          Welcome to <strong>DueBlink</strong> ("DueBlink", "we", "our", or "us"). 
          These Terms of Service ("Terms") govern your access to and use of the DueBlink 
          website, products, and services. By accessing or using DueBlink, you agree to these Terms.
        </p>

        {[
          { title: "1. Acceptance of Terms", content: "By creating an account or using DueBlink, you confirm that you have read, understood, and agree to these Terms. If you do not agree, please do not use our services." },
          { title: "2. About DueBlink", content: "DueBlink is an AI-powered payment recovery platform that helps freelancers, agencies, consultants, and businesses organize unpaid payments, generate professional payment reminders, and track payment follow-ups. DueBlink is not a debt collection agency, legal service, accounting platform, or financial institution." },
          { title: "3. Eligibility", content: "You must be at least 18 years old and capable of entering into a legally binding agreement to use DueBlink." },
          { title: "4. Your Account", content: "You are responsible for keeping your account credentials secure, maintaining accurate account information, and all activity that occurs under your account. You agree not to share your account with others." },
          { title: "5. Acceptable Use", content: "You agree to use DueBlink only for lawful purposes. You must not send spam, harass/abuse others, engage in fraudulent activity, reverse engineer the platform, or upload harmful content. Violation may result in account termination." },
          { title: "6. AI-Generated Content", content: "DueBlink uses AI to generate payment reminders based on the information you provide. AI-generated content is intended to assist you and should be reviewed before sending. You are solely responsible for any messages you choose to send." },
          { title: "7. Payments & Subscriptions", content: "Certain features require a paid subscription. By subscribing, you authorize payment through our provider. If payment fails, your account may be downgraded to Free, and premium features will be unavailable until renewed." },
          { title: "8. Refund Policy", content: "Subscription payments are generally non-refundable unless required by applicable law. If you experience a billing issue, please contact our support team." },
          { title: "9. Intellectual Property", content: "All content, branding, software, logos, designs, and technology associated with DueBlink are owned by DueBlink and protected by applicable intellectual property laws." },
          { title: "10. User Data", content: "You retain ownership of the data you upload to DueBlink. By using the service, you grant DueBlink permission to process that data solely for providing and improving the service. We do not sell your personal information." },
          { title: "11. Service Availability", content: "We strive to provide reliable service but do not guarantee uninterrupted or error-free operation. Maintenance, updates, or unexpected technical issues may temporarily affect availability." },
          { title: "12. Limitation of Liability", content: "DueBlink is provided 'as is'. To the fullest extent permitted by law, DueBlink is not liable for business losses, lost profits, delayed payments, data loss, or any indirect/consequential damages." },
          { title: "13. Termination", content: "We reserve the right to suspend or terminate accounts that violate these Terms or misuse the platform. You may delete your account at any time through your account settings." },
          { title: "14. Changes to These Terms", content: "We may update these Terms from time to time. When changes are made, we will update the Last Updated date and publish the revised version. Continued use of DueBlink after changes means you accept the updated Terms." },
          { title: "15. Governing Law", content: "These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of the courts located in India." }
        ].map((section, idx) => (
          <section key={idx}>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">{section.title}</h2>
            <p>{section.content}</p>
          </section>
        ))}

        <section>
          <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">16. Contact Us</h2>
          <p>If you have questions about these Terms, please contact us:</p>
          <p className="mt-2">
            Email: <a href="mailto:support@dueblink.com" className="text-[#245B92] font-bold hover:underline">support@dueblink.com</a><br />
            Website: <a href="https://dueblink.com" className="text-[#245B92] font-bold hover:underline">dueblink.com</a>
          </p>
        </section>
      </div>

      {/* Footer CTA */}
      <div className="pt-12 border-t border-slate-100 mt-16 flex flex-col items-center text-center">
        <p className="text-slate-500 font-medium mb-6">Thank you for using DueBlink. Our mission is simple: Help businesses recover payments faster.</p>
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