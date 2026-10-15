'use client';

// Shared menu and footer for every free tool page (/tools/...).
// Copied from the invoice due date calculator so all tool pages look the same.
// To add a new tool to the footer, add it to FREE_TOOLS below.

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Mail } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const FREE_TOOLS = [
  { href: '/tools/invoice-due-date-calculator', label: 'Invoice due date calculator' },
  { href: '/tools/whatsapp-payment-reminder', label: 'WhatsApp payment reminders' },
  { href: '/tools/payment-reminder-email-templates', label: 'Payment reminder emails' },
  { href: '/tools/late-payment-interest-calculator', label: 'Late payment interest calculator' },
];

export function ToolNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 shadow-3xs" suppressHydrationWarning={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-32 flex items-center justify-between" suppressHydrationWarning={true}>

        <motion.div
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex items-center justify-start cursor-pointer h-28 w-[380px] sm:w-[500px] relative select-none"
          onClick={() => router.push('/')}
          suppressHydrationWarning={true}
        >
          <Image src="/logo.png" alt="DueBlink Logo" width={500} height={112} priority className="h-full w-full object-contain object-left" />
        </motion.div>

        <div className="hidden md:flex items-center gap-8" suppressHydrationWarning={true}>
          <div className="flex items-center gap-6 text-sm font-bold text-slate-600" suppressHydrationWarning={true}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative py-2 px-3 cursor-pointer transition-colors duration-200 group ${pathname === '/pricing' ? 'text-[#245B92]' : 'hover:text-[#245B92]'}`}
              onClick={() => router.push('/pricing')}
              suppressHydrationWarning={true}
            >
              <span suppressHydrationWarning={true}>Pricing</span>
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative py-2 px-3 cursor-pointer transition-colors duration-200 group ${pathname === '/contact' ? 'text-[#245B92]' : 'hover:text-[#245B92]'}`}
              onClick={() => router.push('/contact')}
              suppressHydrationWarning={true}
            >
              <span suppressHydrationWarning={true}>Contact</span>
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
            </motion.div>
          </div>

          <div className="flex items-center gap-4" suppressHydrationWarning={true}>
            {!mounted ? (
              <div className="h-9 w-32" suppressHydrationWarning={true} />
            ) : user ? (
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 text-sm font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 text-white hover:opacity-95"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                  suppressHydrationWarning={true}
                >
                  Dashboard
                </motion.button>
                <div className="relative group py-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-[#245B92] transition cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-50" suppressHydrationWarning={true}>
                    Account <ChevronDown size={14} />
                  </motion.button>
                  <div className="absolute right-0 top-full w-40 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 hidden group-hover:block z-50">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer" suppressHydrationWarning={true}>Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/login')} className="text-sm font-bold text-slate-600 hover:text-[#245B92] hover:bg-slate-50 transition cursor-pointer px-3 py-2 rounded-xl" suppressHydrationWarning={true}>Login</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/create-account')} className="text-xs sm:text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>Create Account</motion.button>
              </>
            )}
          </div>
        </div>

        <div className="flex md:hidden items-center">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer" aria-label="Toggle Menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-slate-100 bg-white px-6 py-6 space-y-4 shadow-xl overflow-hidden"
          >
            <div className="flex flex-col space-y-3 font-bold text-slate-700">
              <button onClick={() => { router.push('/pricing'); setMobileMenuOpen(false); }} className="text-left py-2 px-3 rounded-lg text-[#1E293B] hover:bg-slate-50 font-bold">Pricing</button>
              <button onClick={() => { router.push('/contact'); setMobileMenuOpen(false); }} className="text-left py-2 px-3 rounded-lg text-[#1E293B] hover:bg-slate-50 font-bold">Contact</button>
            </div>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              {user ? (
                <>
                  <button onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }} className="w-full py-3 text-center font-bold text-white bg-[#0F172A] rounded-xl shadow-xs hover:bg-[#245B92] transition">Dashboard</button>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full py-3 text-center font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition">Logout</button>
                </>
              ) : (
                <>
                  <button onClick={() => { router.push('/login'); setMobileMenuOpen(false); }} className="w-full py-3 text-center font-bold text-slate-700 bg-slate-50 rounded-xl hover:bg-slate-100 transition">Login</button>
                  <button onClick={() => { router.push('/create-account'); setMobileMenuOpen(false); }} className="w-full py-3 text-center font-bold text-white rounded-xl shadow-xs transition" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}>Create Account</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export function ToolFooter() {
  const pathname = usePathname();

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
            <a href="/#dashboard-preview" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Dashboard</a>
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
            {FREE_TOOLS.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                className={`text-xs font-medium w-fit transition-colors ${pathname === tool.href ? 'text-[#245B92]' : 'text-slate-500 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                {tool.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-3" suppressHydrationWarning={true}>
            <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>Account</p>
            <a href="/login" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Login</a>
            <a href="/create-account" className="text-xs font-medium text-slate-500 hover:text-[#245B92] transition-colors w-fit" suppressHydrationWarning={true}>Create account</a>
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
          <span className="text-xs font-medium text-slate-400 text-center sm:text-right" suppressHydrationWarning={true}>Built for the ones who&apos;d rather get paid than chase payments.</span>
        </div>

      </div>
    </motion.footer>
  );
}
