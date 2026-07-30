export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-slate-800">
      
      {/* Header */}
      <h1 className="text-5xl font-black mb-8 bg-gradient-to-r from-[#245B92] to-[#20B8BE] bg-clip-text text-transparent uppercase tracking-tight">
        Privacy Policy
      </h1>
      <p className="text-sm font-bold text-slate-400 mb-12 uppercase tracking-widest">
        Last Updated: June 30, 2026
      </p>

      {/* Intro */}
      <div className="prose prose-slate max-w-none text-slate-600 space-y-6 leading-relaxed">
        <p>
          Welcome to <strong>DueBlink</strong> ("DueBlink", "we", "our", or "us"). 
          Your privacy is important to us. This Privacy Policy explains what information we collect, 
          how we use it, and how we protect it when you use our website and services.
        </p>

        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-3 font-bold text-slate-800">Account Information</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Name, Email address, Profile information</li>
            <li>Login credentials (encrypted)</li>
          </ul>
          <p className="mb-3 font-bold text-slate-800">Client Information</p>
          <p className="mb-2">Information you add to your account, including:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Client names, Company names, Email addresses, Phone numbers (optional)</li>
            <li>Payment amounts, Due dates, Reminder history, Payment status</li>
          </ul>
          <p className="mb-3 font-bold text-slate-800">Usage Information</p>
          <p className="mb-2">We automatically collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Device information, Browser type, IP address</li>
            <li>Pages visited, Session activity, Error logs</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-2">We use your information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide DueBlink services and generate AI-powered payment reminders</li>
            <li>Save your clients and reminders, and improve product performance</li>
            <li>Process payments, respond to support requests, and prevent fraud or abuse</li>
          </ul>
          <p className="mt-4 font-black bg-gradient-to-r from-[#245B92] to-[#20B8BE] bg-clip-text text-transparent">
            We never sell your personal information.
          </p>
        </section>

        {/* Sections 3 to 12 */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">3. AI Processing</h2>
            <p>When you generate a reminder, the information you provide may be securely processed by our AI service provider to generate personalized payment reminders. We only send the information necessary to generate the requested reminder.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">4. Payments</h2>
            <p>Payments are securely processed through trusted third-party payment providers. DueBlink does not store your full credit or debit card details.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">5. Cookies</h2>
            <p>We use cookies to keep you logged in, remember preferences, improve website performance, understand product usage, and enhance user experience. You can disable cookies through your browser settings, although some features may not function properly.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">6. Data Security</h2>
            <p>We use industry-standard security measures to protect your information, including secure HTTPS encryption, encrypted authentication, secure cloud infrastructure, access controls, and regular security updates. While we strive to protect your information, no online service can guarantee 100% security.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">7. Data Retention</h2>
            <p>We retain your information while your account remains active. If you delete your account, your personal data will be deleted or anonymized in accordance with applicable laws, except where retention is required for legal or regulatory purposes.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">8. Third-Party Services</h2>
            <p>DueBlink may use trusted third-party providers, including services for authentication, AI processing, payment processing, email delivery, hosting, and analytics. Each provider has its own privacy practices.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">9. Your Rights</h2>
            <p>Depending on your location, you may have the right to access your personal information, update your information, delete your account, request a copy of your data, or withdraw consent where applicable. To exercise these rights, please contact us.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">10. Children's Privacy</h2>
            <p>DueBlink is not intended for children under the age of 13. We do not knowingly collect personal information from children.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">11. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. When significant changes are made, we will update the Last Updated date and publish the revised version on this page.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0F172A] mt-8 mb-4">12. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <p className="mt-2">
              Email: <a href="mailto:support@dueblink.com" className="text-[#245B92] font-bold hover:underline">support@dueblink.com</a><br />
              Website: <a href="https://dueblink.com" className="text-[#245B92] font-bold hover:underline">dueblink.com</a>
            </p>
          </div>
        </section>
      </div>

      {/* Footer CTA */}
      <div className="pt-12 border-t border-slate-100 mt-16 flex flex-col items-center">
        <p className="text-slate-500 font-medium mb-6">Thank you for trusting DueBlink.</p>
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