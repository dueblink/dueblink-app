'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building, Mail, Phone, IndianRupee, Calendar, FileText, CheckCircle2, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function AddClientModal({ isOpen, onClose, user }: AddClientModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successStep, setSuccessStep] = useState(false);
  const [isFirstClient, setIsFirstClient] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    whatsapp: '',
    amount: '',
    dueDate: '',
    invoiceNumber: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    amount: '',
    dueDate: ''
  });

  // Refs for auto-focusing and keyboard navigation
  const nameInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const whatsappInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus Client Name on open & ESC key listener
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleResetAndClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  const validateField = (field: string, value: string) => {
    let errorMsg = '';
    if (field === 'name' && !value.trim()) {
      errorMsg = 'Client name is required.';
    } else if (field === 'email') {
      if (!value.trim()) {
        errorMsg = 'Email address is required.';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errorMsg = 'Please enter a valid email address.';
        }
      }
    } else if (field === 'amount' && !value.trim()) {
      errorMsg = 'Amount due is required.';
    } else if (field === 'dueDate' && !value.trim()) {
      errorMsg = 'Due date is required.';
    }
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'amount') {
      // Only allow numbers for amount
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, amount: numericValue }));
      validateField('amount', numericValue);
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      return;
    }

    // Validate all required fields
    const nameErr = !formData.name.trim() ? 'Client name is required.' : '';
    const emailErr = !formData.email.trim() ? 'Email address is required.' : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Please enter a valid email address.' : '');
    const amountErr = !formData.amount.trim() ? 'Amount due is required.' : '';
    const dueErr = !formData.dueDate.trim() ? 'Due date is required.' : '';

    setErrors({
      name: nameErr,
      email: emailErr,
      amount: amountErr,
      dueDate: dueErr
    });

    if (nameErr || emailErr || amountErr || dueErr) {
      return;
    }

    setLoading(true);
    try {
      // Check existing clients count from local storage to detect if first client
      const existingClients = JSON.parse(localStorage.getItem('dueblink_clients') || '[]');
      if (existingClients.length === 0) {
        setIsFirstClient(true);
      }

      await addDoc(collection(db, 'clients'), {
        userId: user.uid,
        name: formData.name,
        company: formData.company,
        email: formData.email,
        whatsapp: formData.whatsapp,
        amount: formData.amount,
        dueDate: formData.dueDate,
        invoiceNumber: formData.invoiceNumber,
        status: 'Pending',
        createdAt: serverTimestamp(),
        reminderHistory: []
      });

      window.dispatchEvent(new Event('clients-updated'));

      setLoading(false);
      setSuccessStep(true);
      router.refresh();
    } catch (error) {
      console.error("Firebase Error: ", error);
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setFormData({ name: '', company: '', email: '', whatsapp: '', amount: '', dueDate: '', invoiceNumber: '' });
    setErrors({ name: '', email: '', amount: '', dueDate: '' });
    setSuccessStep(false);
    setIsFirstClient(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs" 
      onClick={handleResetAndClose}
      suppressHydrationWarning={true}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col overflow-hidden text-slate-900"
        suppressHydrationWarning={true}
      >
        {/* STICKY HEADER */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 z-10 flex items-center justify-between" suppressHydrationWarning={true}>
          <div suppressHydrationWarning={true}>
            <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tight" suppressHydrationWarning={true}>Add New Client</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5" suppressHydrationWarning={true}>Add a client to start tracking payments.</p>
          </div>
          <button 
            onClick={handleResetAndClose} 
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-2 rounded-full bg-slate-50 hover:bg-slate-100 transition"
            suppressHydrationWarning={true}
          >
            <X size={18} />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5" suppressHydrationWarning={true}>
          {!successStep ? (
            <form id="add-client-form" className="space-y-4" onSubmit={handleSave} suppressHydrationWarning={true}>
              
              {/* Client Name */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.03 }}
                className="space-y-1.5" 
                suppressHydrationWarning={true}
              >
                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                  <span>Client Name *</span>
                  {formData.name.trim() && !errors.name && <CheckCircle2 size={14} className="text-[#2BB6A8]" />}
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <User className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={nameInputRef}
                    type="text" 
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#245B92]/25 transition ${errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#245B92]'}`} 
                    placeholder="John Doe" 
                    value={formData.name} 
                    onChange={(e) => handleChange('name', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, companyInputRef)}
                    suppressHydrationWarning={true}
                  />
                </div>
                {errors.name && <p className="text-[11px] font-bold text-red-500 pl-1" suppressHydrationWarning={true}>{errors.name}</p>}
              </motion.div>

              {/* Company */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.06 }}
                className="space-y-1.5" 
                suppressHydrationWarning={true}
              >
                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                  <span>Company <span className="text-slate-400 font-normal lowercase">(Optional)</span></span>
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <Building className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={companyInputRef}
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition" 
                    placeholder="ABC Agency" 
                    value={formData.company} 
                    onChange={(e) => handleChange('company', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, emailInputRef)}
                    suppressHydrationWarning={true}
                  />
                </div>
              </motion.div>

              {/* Client Email */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.09 }}
                className="space-y-1.5" 
                suppressHydrationWarning={true}
              >
                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                  <span>Client Email *</span>
                  {formData.email.trim() && !errors.email && <CheckCircle2 size={14} className="text-[#2BB6A8]" />}
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <Mail className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={emailInputRef}
                    type="email" 
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#245B92]/25 transition ${errors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#245B92]'}`} 
                    placeholder="client@company.com" 
                    value={formData.email} 
                    onChange={(e) => handleChange('email', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, whatsappInputRef)}
                    suppressHydrationWarning={true}
                  />
                </div>
                {errors.email && <p className="text-[11px] font-bold text-red-500 pl-1" suppressHydrationWarning={true}>{errors.email}</p>}
              </motion.div>

              {/* WhatsApp Number */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.12 }}
                className="space-y-1.5" 
                suppressHydrationWarning={true}
              >
                <label className="text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>
                  WhatsApp Number <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <Phone className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={whatsappInputRef}
                    type="tel" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition" 
                    placeholder="+91 98765 43210" 
                    value={formData.whatsapp} 
                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, amountInputRef)}
                    suppressHydrationWarning={true}
                  />
                </div>
              </motion.div>

              {/* Amount Due & Due Date */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.15 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4" 
                suppressHydrationWarning={true}
              >
                <div className="space-y-1.5" suppressHydrationWarning={true}>
                  <label className="text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                    <span>Amount Due *</span>
                    {formData.amount.trim() && !errors.amount && <CheckCircle2 size={14} className="text-[#2BB6A8]" />}
                  </label>
                  <div className="relative flex items-center" suppressHydrationWarning={true}>
                    <IndianRupee className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                    <input 
                      ref={amountInputRef}
                      type="text" 
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#245B92]/25 transition ${errors.amount ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#245B92]'}`} 
                      placeholder="25,000" 
                      value={formData.amount ? Number(formData.amount).toLocaleString('en-IN') : ''} 
                      onChange={(e) => handleChange('amount', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, dueDateInputRef)}
                      suppressHydrationWarning={true}
                    />
                  </div>
                  {errors.amount && <p className="text-[11px] font-bold text-red-500 pl-1" suppressHydrationWarning={true}>{errors.amount}</p>}
                </div>

                <div className="space-y-1.5" suppressHydrationWarning={true}>
                  <label className="text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                    <span>Due Date *</span>
                    {formData.dueDate.trim() && !errors.dueDate && <CheckCircle2 size={14} className="text-[#2BB6A8]" />}
                  </label>
                  <div className="relative flex items-center" suppressHydrationWarning={true}>
                    <Calendar className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                    <input 
                      ref={dueDateInputRef}
                      type="date" 
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#245B92]/25 transition text-slate-700 ${errors.dueDate ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#245B92]'}`} 
                      value={formData.dueDate} 
                      onChange={(e) => handleChange('dueDate', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, invoiceInputRef)}
                      suppressHydrationWarning={true}
                    />
                  </div>
                  {errors.dueDate && <p className="text-[11px] font-bold text-red-500 pl-1" suppressHydrationWarning={true}>{errors.dueDate}</p>}
                </div>
              </motion.div>

              {/* Invoice Number */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.18 }}
                className="space-y-1.5" 
                suppressHydrationWarning={true}
              >
                <label className="text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>
                  Invoice Number <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <FileText className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={invoiceInputRef}
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition" 
                    placeholder="INV-2026-001" 
                    value={formData.invoiceNumber} 
                    onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                    suppressHydrationWarning={true}
                  />
                </div>
              </motion.div>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center space-y-6" 
              suppressHydrationWarning={true}
            >
              <div className="w-16 h-16 bg-teal-50 text-[#2BB6A8] rounded-full flex items-center justify-center mx-auto shadow-inner" suppressHydrationWarning={true}>
                <CheckCircle2 size={36} />
              </div>
              <div suppressHydrationWarning={true}>
                {isFirstClient ? (
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-[#0F172A]" suppressHydrationWarning={true}>Great start! 🎉</h3>
                    <p className="text-sm text-slate-500 font-medium px-4" suppressHydrationWarning={true}>
                      You've added your first client. Now generate your first AI reminder.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-[#0F172A]" suppressHydrationWarning={true}>Client Added Successfully</h3>
                    <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning={true}>What would you like to do next?</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2" suppressHydrationWarning={true}>
                <button 
                  onClick={handleResetAndClose} 
                  className="w-full py-3.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  suppressHydrationWarning={true}
                >
                  Go to Dashboard <ArrowRight size={16} />
                </button>
                
                <button 
                  onClick={() => { 
                    handleResetAndClose(); 
                    router.push('/dashboard'); 
                  }} 
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                  suppressHydrationWarning={true}
                >
                  <Sparkles size={16} /> Generate Reminder
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* STICKY FOOTER SAVE BUTTON */}
        {!successStep && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-4 border-t border-slate-100 z-10" suppressHydrationWarning={true}>
            <motion.button 
              whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(36,91,146,0.2)' }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              form="add-client-form"
              disabled={loading} 
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer" 
              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
              suppressHydrationWarning={true}
            >
              {loading ? <><Loader2 className="animate-spin" size={16} /> Saving Client...</> : 'Save Client'}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}