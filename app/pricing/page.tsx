'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Zap, X, Menu, ChevronDown, CheckCircle2 } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function PricingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isIndia, setIsIndia] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Auth listener to check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem('user_authenticated', 'true');
      } else {
        localStorage.removeItem('user_authenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('has_created_account');
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpgradeClick = async (plan: 'free' | 'pro') => {
    if (plan === 'free') {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/create-account');
      }
      return;
    }

    // PRO Plan Flow with Razorpay
    if (!user) {
      router.push('/create-account?redirect=checkout');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Calculate amount in smallest unit (paise for INR, cents for USD)
      const amountInPaise = isIndia 
        ? (billingCycle === 'monthly' ? 49900 : 499900) 
        : (billingCycle === 'monthly' ? 900 : 8900);

      const currency = isIndia ? 'INR' : 'USD';

      // 2. Configure Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: currency,
        name: "DueBlink",
        description: `Pro Subscription (${billingCycle})`,
        image: "/logo.png",
        handler: function (response: any) {
          console.log("Payment ID:", response.razorpay_payment_id);
          setPaymentSuccessModal(true);
        },
        prefill: {
          email: user?.email || "",
          name: user?.displayName || "DueBlink User",
        },
        theme: {
          color: "#245B92",
        },
      };

      // 3. Open Razorpay Checkout Modal
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong with checkout. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased selection:bg-[#20B8BE]/20" suppressHydrationWarning={true}>
      
      {/* --- GLOBAL STICKY HEADER BAR WITH ANIMATED ACTIVE INDICATOR --- */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 shadow-3xs" suppressHydrationWarning={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-32 flex items-center justify-between" suppressHydrationWarning={true}>
          
          {/* LOGO */}
          <motion.div 
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex items-center justify-start cursor-pointer h-28 w-[380px] sm:w-[500px] relative select-none" 
            onClick={() => router.push('/')} 
            suppressHydrationWarning={true}
          >
            <img src="/logo.png" alt="DueBlink Logo" className="h-full w-full object-contain object-left" suppressHydrationWarning={true} />
          </motion.div>

          {/* DESKTOP NAV LINKS & AUTH BUTTONS */}
          <div className="hidden md:flex items-center gap-8" suppressHydrationWarning={true}>
            
            {/* Center Navigation Links with Smooth Animated Underline */}
            <div className="flex items-center gap-6 text-sm font-bold text-slate-600" suppressHydrationWarning={true}>
              
              {/* Pricing Link */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative py-2 px-3 cursor-pointer transition-colors duration-200 group ${pathname === '/pricing' ? 'text-[#245B92]' : 'hover:text-[#245B92]'}`} 
                onClick={() => router.push('/pricing')} 
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Pricing</span>
                {pathname === '/pricing' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.25, ease: "easeInOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.div>

              {/* Contact Link */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative py-2 px-3 cursor-pointer transition-colors duration-200 group ${pathname === '/contact' ? 'text-[#245B92]' : 'hover:text-[#245B92]'}`} 
                onClick={() => router.push('/contact')} 
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Contact</span>
                {pathname === '/contact' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.25, ease: "easeInOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.div>

            </div>

            {/* DYNAMIC AUTH BUTTONS */}
            <div className="flex items-center gap-4" suppressHydrationWarning={true}>
              {pathname === '/login' ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} onClick={() => router.push('/create-account')} className="text-xs sm:text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>Create Account</motion.button>
              ) : !mounted ? (
                <div className="h-9 w-32" suppressHydrationWarning={true} />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => router.push('/dashboard')} 
                    className="px-4 py-2 text-sm font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 text-white hover:opacity-95"
                    style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                    suppressHydrationWarning={true}
                  >
                    Dashboard
                  </motion.button>
                  <div className="relative group py-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-[#245B92] transition cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-50" suppressHydrationWarning={true}>
                      Account <ChevronDown size={14} />
                    </motion.button>
                    <div className="absolute right-0 top-full w-40 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 hidden group-hover:block z-50">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer" suppressHydrationWarning={true}>Logout</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} onClick={() => router.push('/login')} className={`text-sm font-bold transition cursor-pointer px-3 py-2 rounded-xl ${pathname === '/login' ? 'bg-[#245B92]/10 text-[#245B92]' : 'text-slate-600 hover:text-[#245B92] hover:bg-slate-50'}`} suppressHydrationWarning={true}>Login</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} onClick={() => router.push('/create-account')} className="text-xs sm:text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>Create Account</motion.button>
                </>
              )}
            </div>

          </div>

          {/* MOBILE HAMBURGER TOGGLE BUTTON */}
          <div className="flex md:hidden items-center">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
              suppressHydrationWarning={true}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>

        </div>

        {/* MOBILE DROPDOWN MENU */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-slate-100 bg-white px-6 py-6 space-y-4 shadow-xl overflow-hidden"
              suppressHydrationWarning={true}
            >
              <div className="flex flex-col space-y-3 font-bold text-slate-700">
                <button 
                  onClick={() => { router.push('/pricing'); setMobileMenuOpen(false); }}
                  className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/pricing' ? 'bg-slate-50 text-[#1C2E8F]' : 'text-[#1E293B] hover:bg-slate-50'}`}
                >
                  Pricing
                </button>
                <button 
                  onClick={() => { router.push('/contact'); setMobileMenuOpen(false); }}
                  className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/contact' ? 'bg-slate-50 text-[#1C2E8F]' : 'text-[#1E293B] hover:bg-slate-50'}`}
                >
                  Contact
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                {user ? (
                  <>
                    <button 
                      onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }}
                      className="w-full py-3 text-center font-bold text-white bg-[#0F172A] rounded-xl shadow-xs hover:bg-[#245B92] transition"
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="w-full py-3 text-center font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => { router.push('/login'); setMobileMenuOpen(false); }}
                      className="w-full py-3 text-center font-bold text-slate-700 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => { router.push('/create-account'); setMobileMenuOpen(false); }}
                      className="w-full py-3 text-center font-bold text-white rounded-xl shadow-xs transition"
                      style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                    >
                      Create Account
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- HERO SECTION --- */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden bg-white pt-16 pb-12 border-b border-slate-50 text-center"
        suppressHydrationWarning={true}
      >
        <div className="absolute top-[-10%] left-[5%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#1C2E8F]/10 to-transparent blur-3xl opacity-70" suppressHydrationWarning={true}></div>
        <div className="absolute bottom-[10%] right-[-5%] -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#2BB6A8]/10 to-transparent blur-3xl opacity-60" suppressHydrationWarning={true}></div>

        <div className="max-w-4xl mx-auto px-4 space-y-6" suppressHydrationWarning={true}>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-3xs mx-auto select-none" suppressHydrationWarning={true}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2BB6A8] animate-pulse shrink-0" />
            <span className="text-[#0F172A] font-bold">Simple, Transparent Pricing</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] uppercase leading-[1.2]" suppressHydrationWarning={true}>
            Start free. <span className="bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] bg-clip-text text-transparent">Upgrade</span> when you're ready.
          </h1>

          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto leading-relaxed" suppressHydrationWarning={true}>
            AI-powered payment recovery for freelancers, agencies and consultants.
          </p>

          {/* Controls Bar: Region & Billing Cycle */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            
            {/* Region Toggle */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
              <button 
                onClick={() => setIsIndia(true)} 
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${isIndia ? 'bg-[#0F172A] text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🇮🇳 India (₹ INR)
              </button>
              <button 
                onClick={() => setIsIndia(false)} 
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${!isIndia ? 'bg-[#0F172A] text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🌍 International ($ USD)
              </button>
            </div>

            {/* Monthly / Yearly Billing Toggle */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
              <button 
                onClick={() => setBillingCycle('monthly')} 
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${billingCycle === 'monthly' ? 'bg-[#245B92] text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')} 
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-[#245B92] text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <span>Yearly</span>
                <span className="text-[9px] font-black bg-teal-500 text-white px-1.5 py-0.5 rounded-md">Save ~15%</span>
              </button>
            </div>

          </div>
        </div>
      </motion.section>

      {/* --- PRICING SECTION --- */}
      <section className="bg-white py-20 border-b border-slate-100" suppressHydrationWarning={true}>
        <div className="max-w-5xl mx-auto px-4 text-center space-y-12" suppressHydrationWarning={true}>
          
          <div className="grid md:grid-cols-2 gap-8 text-left items-stretch max-w-4xl mx-auto" suppressHydrationWarning={true}>
            
            {/* Free Plan */}
            <motion.div 
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-3xs"
              suppressHydrationWarning={true}
            >
              <div>
                <div className="flex justify-between items-center mb-2" suppressHydrationWarning={true}>
                  <h3 className="font-black text-xl text-[#0F172A]" suppressHydrationWarning={true}>Free</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6 font-medium" suppressHydrationWarning={true}>Start recovering payments</p>
                <div className="text-5xl font-black mb-8 text-[#0F172A]" suppressHydrationWarning={true}>₹0</div>
                <ul className="space-y-4 mb-8 flex-grow" suppressHydrationWarning={true}>
                  {["5 AI Reminders per month", "Email Reminders", "WhatsApp Reminders", "Tone Selection", "Basic Tracking"].map(text => (
                    <li key={text} className="flex items-center gap-3 font-semibold text-slate-700 text-sm" suppressHydrationWarning={true}>
                      <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center" suppressHydrationWarning={true}>
                        <Check className="w-3 h-3 text-slate-400" strokeWidth={4} suppressHydrationWarning={true} />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => handleUpgradeClick('free')} 
                className="w-full py-4 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                suppressHydrationWarning={true}
              >
                {user ? 'Go to Dashboard' : 'Start Free'}
              </button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-3xl border-2 border-[#20B8BE] shadow-xl relative flex flex-col justify-between"
              suppressHydrationWarning={true}
            >
              <div className="absolute top-4 right-4 bg-[#20B8BE] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider" suppressHydrationWarning={true}>Most popular</div>
              <div>
                <div className="flex justify-between items-center mb-2" suppressHydrationWarning={true}>
                  <h3 className="font-black text-xl text-[#0F172A]" suppressHydrationWarning={true}>Pro</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6 font-medium" suppressHydrationWarning={true}>Unlock full potential</p>
                
                {/* Dynamic Price Display based on toggle */}
                <div className="text-5xl font-black mb-1 text-[#0F172A]" suppressHydrationWarning={true}>
                  {isIndia 
                    ? (billingCycle === 'monthly' ? '₹499' : '₹4,999') 
                    : (billingCycle === 'monthly' ? '$9' : '$89')} 
                  <span className="text-sm font-bold text-slate-400" suppressHydrationWarning={true}>
                    {billingCycle === 'monthly' ? ' / month' : ' / year'}
                  </span>
                </div>
                <p className="text-xs font-bold text-teal-600 mb-8" suppressHydrationWarning={true}>
                  {billingCycle === 'yearly' ? '✨ Best value: Save 15% annually' : 'Billed monthly · Cancel anytime'}
                </p>

                <ul className="space-y-4 mb-8 flex-grow" suppressHydrationWarning={true}>
                  {[
                    "Unlimited AI Reminders", 
                    "Floating AI Recovery Assistant", 
                    "AI Smart Recommendations", 
                    "Payment Tracking & History", 
                    "Unlimited Clients & Priority Support"
                  ].map(text => (
                    <li key={text} className="flex items-center gap-3 font-semibold text-slate-700 text-sm" suppressHydrationWarning={true}>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#245B92] to-[#20B8BE] flex items-center justify-center" suppressHydrationWarning={true}>
                        <Check className="w-3 h-3 text-white" strokeWidth={4} suppressHydrationWarning={true} />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => handleUpgradeClick('pro')} 
                disabled={isProcessing}
                className="w-full py-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#245B92] to-[#20B8BE] hover:opacity-95 transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                suppressHydrationWarning={true}
              >
                {isProcessing ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isProcessing ? 'Connecting Gateway...' : 'Upgrade to Pro'}
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- WHY UPGRADE SECTION --- */}
      <section className="bg-slate-50 py-20 border-b border-slate-100 text-center" suppressHydrationWarning={true}>
        <div className="max-w-3xl mx-auto px-4 space-y-4" suppressHydrationWarning={true}>
          <div className="text-3xl select-none">🧠</div>
          <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Stop manually deciding who to follow up with.</h2>
          <p className="text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
            Let AI analyze your payments and recommend the next best action. Recover payments faster with DueBlink.
          </p>
        </div>
      </section>

      {/* --- CUSTOM SaaS SUCCESS MODAL --- */}
      <AnimatePresence>
        {paymentSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto text-[#20B8BE]">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#0F172A]">You're officially Pro! 🎉</h3>
                <p className="text-sm font-medium text-slate-500">
                  Your payment was successfully processed. Your account has been upgraded with unlimited AI recovery tools.
                </p>
              </div>

              <button 
                onClick={() => {
                  localStorage.setItem('just_upgraded', 'true');
                  router.push('/dashboard');
                }}
                className="w-full py-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#245B92] to-[#20B8BE] hover:opacity-95 transition cursor-pointer shadow-md"
              >
                Go to Dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GLOBAL FOOTER WITH ANIMATION --- */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-white py-12 border-t border-slate-200 px-6"
        suppressHydrationWarning={true}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left" suppressHydrationWarning={true}>
            
          <div className="flex flex-col items-center md:items-start gap-2" suppressHydrationWarning={true}>
            <div className="h-24 sm:h-32 w-[380px] flex items-center justify-center md:justify-start" suppressHydrationWarning={true}>
              <img src="/logo.png" alt="DueBlink Logo" className="h-full w-full object-contain object-left" suppressHydrationWarning={true} />
            </div>
            <div className="text-xs font-bold text-slate-500 leading-relaxed" suppressHydrationWarning={true}>
              Know who owes you money.<br />Know exactly what to do next.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold uppercase tracking-wider text-slate-500" suppressHydrationWarning={true}>
            <a href="/privacy" className="text-slate-500 hover:text-black transition-colors" suppressHydrationWarning={true}>Privacy</a>
            <a href="/terms" className="text-slate-500 hover:text-black transition-colors" suppressHydrationWarning={true}>Terms</a>
            <a href="/refund-policy" className="text-slate-500 hover:text-black transition-colors" suppressHydrationWarning={true}>Refunds</a>
            <a href="/contact" className="text-slate-500 hover:text-black transition-colors" suppressHydrationWarning={true}>Contact</a>
          </div>
            
          <div className="flex flex-col items-center md:items-end gap-1 text-xs font-bold uppercase tracking-wider text-slate-400" suppressHydrationWarning={true}>
            <a href="mailto:support@dueblink.com" className="text-slate-500 hover:text-black transition-colors normal-case lowercase font-medium" suppressHydrationWarning={true}>
              support@dueblink.com
            </a>
            <span suppressHydrationWarning={true}>© 2026 DueBlink</span>
          </div>
            
        </div>
      </motion.footer>

    </div>
  );
}