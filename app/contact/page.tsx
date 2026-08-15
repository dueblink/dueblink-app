'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Send, AlertTriangle, FileText, MapPin, Clock, ArrowRight, Menu, X, ChevronDown, Mail, RefreshCw } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ContactPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem('user_authenticated', 'true');
        if (currentUser.displayName && !fullName) setFullName(currentUser.displayName);
        if (currentUser.email && !email) setEmail(currentUser.email);
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

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !subject || !message) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email,
          subject,
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to send message.'
        );
      }

      // Message successfully sent
      setSubmitStatus('success');

      // Clear form
      setFullName('');
      setEmail('');
      setSubject('');
      setMessage('');

    } catch (error) {
      console.error('Contact form submission error:', error);

      setSubmitStatus('error');

    } finally {
      setIsSubmitting(false);
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
            
            {/* Center Navigation Links with Smooth Animated Underline (Home removed as requested) */}
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

          {/* MOBILE HAMBURGER TOGGLE */}
          <div className="flex md:hidden items-center">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
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
            >
              <div className="flex flex-col space-y-3 font-bold text-slate-700">
                <button onClick={() => { router.push('/pricing'); setMobileMenuOpen(false); }} className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/pricing' ? 'bg-slate-50 text-[#1C2E8F]' : 'text-[#1E293B] hover:bg-slate-50'}`}>Pricing</button>
                <button onClick={() => { router.push('/contact'); setMobileMenuOpen(false); }} className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/contact' ? 'bg-slate-50 text-[#1C2E8F]' : 'text-[#1E293B] hover:bg-slate-50'}`}>Contact</button>
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
            <span className="text-[#0F172A] font-bold">Contact Us</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] uppercase leading-[1.2]" suppressHydrationWarning={true}>
            How Can We <span className="bg-gradient-to-r from-[#1C2E8F] to-[#2BB6A8] bg-clip-text text-transparent">Help?</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto leading-relaxed" suppressHydrationWarning={true}>
            Whether you have a question, found a bug, need billing help, or want to share feedback—we're here to help.
          </p>
        </div>
      </motion.section>

      {/* --- QUICK HELP BANNER --- */}
      <section className="bg-slate-50/50 py-12 border-b border-slate-100 px-4" suppressHydrationWarning={true}>
        <div className="max-w-4xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-3xs flex flex-col sm:flex-row items-center justify-between gap-6" suppressHydrationWarning={true}>
          <div className="space-y-3 text-left">
            <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight">Need an answer right now?</h3>
            <ul className="space-y-2 text-sm font-semibold text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2BB6A8]" /> Visit our FAQ for instant answers.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2BB6A8]" /> Check your Dashboard for account-related information.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2BB6A8]" /> Still need help? Send us a message below.
              </li>
            </ul>
          </div>
          <button 
            onClick={() => router.push('/#faq')} 
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#245B92] transition cursor-pointer shadow-3xs shrink-0"
          >
            View FAQ
          </button>
        </div>
      </section>

      {/* --- WHAT CAN WE HELP WITH? --- */}
      <section className="bg-white py-16 sm:py-20 border-b border-slate-100 px-4" suppressHydrationWarning={true}>
        <div className="max-w-6xl mx-auto space-y-12" suppressHydrationWarning={true}>
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight uppercase">What Can We Help With?</h2>
            <p className="text-sm text-slate-500 font-medium">Select a category or drop us a direct message below.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { title: "Technical Support", desc: "Having trouble using DueBlink? We'll help you get back on track.", icon: <Wrench className="w-5 h-5 text-[#245B92]" /> },
              { title: "Billing & Subscription", desc: "Questions about your plan, payments, or invoices.", icon: <FileText className="w-5 h-5 text-[#2BB6A8]" /> },
              { title: "Feature Requests", desc: "Have an idea to improve DueBlink? We'd love to hear it.", icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
              { title: "Report a Bug", desc: "Found something that isn't working? Let us know so we can fix it.", icon: <AlertTriangle className="w-5 h-5 text-rose-500" /> }
            ].map((cat, idx) => (
              <div key={idx} className="bg-[#FAFBFD] border border-slate-200/70 rounded-2xl p-6 space-y-3 shadow-3xs flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-3xs">
                  {cat.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#0F172A]">{cat.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT FORM & CONTACT INFO SECTION --- */}
      <section className="bg-slate-50/40 py-20 sm:py-24 border-b border-slate-100 px-4" suppressHydrationWarning={true}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start" suppressHydrationWarning={true}>
          
          {/* Form Window */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 text-left">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] uppercase tracking-tight">Send Us a Message</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Tell us what's happening and we'll get back to you as soon as possible.</p>
            </div>

            {submitStatus === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4"
              >
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-3xs">
                  <Check size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-emerald-900 uppercase">Message Sent!</h4>
                  <p className="text-xs text-emerald-700 font-medium">Thanks for contacting DueBlink. We've received your message and will respond as soon as possible.</p>
                </div>
                <button 
                  onClick={() => setSubmitStatus('idle')}
                  className="px-6 py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-3xs hover:opacity-90 transition cursor-pointer"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="John Doe" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#245B92]" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="john@example.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#245B92]" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Question about Pro subscription" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#245B92]" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Message *</label>
                  <textarea 
                    required 
                    rows={5}
                    placeholder="Describe your question or issue in detail..." 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#245B92] resize-none" 
                  />
                </div>

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                    <p className="font-bold">Something went wrong.</p>
                    <p>Please try again in a few moments. If the problem continues, email us directly at <a href="mailto:support@dueblink.com" className="underline font-bold">support@dueblink.com</a>.</p>
                  </div>
                )}

                <div className="pt-2">
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                    type="submit" 
                    disabled={isSubmitting} 
                    style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
                    className="w-full text-white font-bold text-sm uppercase tracking-wider py-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-3xs disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? 'Sending Message…' : 'Send Message'}
                  </motion.button>
                  <p className="text-[11px] text-slate-400 font-medium text-center mt-3">We usually reply within 1–2 business days.</p>
                </div>
              </form>
            )}
          </div>

          {/* Contact Details Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 text-left">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Get in Touch</h3>
              <p className="text-xs text-slate-500 font-medium">Direct channels to reach our core team.</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#2BB6A8] shrink-0 mt-0.5">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</h4>
                  <a href="mailto:support@dueblink.com" className="text-sm font-bold text-[#245B92] hover:underline">support@dueblink.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#245B92] shrink-0 mt-0.5">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Hours</h4>
                  <p className="text-sm font-bold text-slate-800">Monday – Friday</p>
                  <p className="text-xs text-slate-500 font-medium">9:00 AM – 6:00 PM (IST)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</h4>
                  <p className="text-sm font-bold text-slate-800">India</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 bg-[#FAFBFD] p-6 rounded-2xl border border-slate-200/60 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Looking for quick support?</h5>
              <p className="text-xs text-slate-500 font-medium">Check out our comprehensive FAQ section or access your dashboard for immediate payment overview.</p>
            </div>
          </div>

        </div>
      </section>

      {/* --- FINAL SECTION --- */}
      <section className="bg-white py-16 sm:py-20 px-4" suppressHydrationWarning={true}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#245B92] to-[#20B8BE] rounded-[32px] p-6 sm:p-12 text-center text-white relative shadow-lg overflow-hidden" suppressHydrationWarning={true}>
            <div className="text-4xl mb-6">🚀</div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
              We're Always Improving DueBlink.
            </h2>
            <p className="text-sm sm:text-base font-medium text-white/90 max-w-xl mx-auto leading-relaxed mb-8">
              Every question, bug report, and suggestion helps us build a better payment recovery experience.
            </p>
            <button 
              onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })} 
              className="inline-flex items-center gap-2 bg-white text-[#245B92] px-8 py-3.5 rounded-xl font-black text-sm hover:bg-slate-50 transition cursor-pointer shadow-3xs"
            >
              Send Message <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

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

// Simple helper icon
function Wrench({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}