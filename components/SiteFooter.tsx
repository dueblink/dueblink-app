'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { track } from '@/lib/track';

// ============================================================
// SITE FOOTER (same on every page)
// ============================================================
// Used on the pricing, contact and help pages. Change links here
// once and every page that uses <SiteFooter /> updates.
// ============================================================

export default function SiteFooter() {
  return (
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
            <a href="/#dashboard-preview" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Features</a>
            <a href="/#automated-reminders" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Automatic reminders</a>
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
            <a href="/tools/invoice-due-date-calculator" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Invoice due date calculator</a>
            <a href="/tools/whatsapp-payment-reminder" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>WhatsApp payment reminders</a>
            <a href="/tools/payment-reminder-email-templates" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Payment reminder emails</a>
            <a href="/tools/late-payment-interest-calculator" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Late payment interest calculator</a>
          </div>

          <div className="flex flex-col gap-3" suppressHydrationWarning={true}>
            <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>Account</p>
            <a href="/login" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Login</a>
            <a href="/create-account" onClick={() => track('start_free_click', { from: 'footer' })} className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Create account</a>
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
  );
}
