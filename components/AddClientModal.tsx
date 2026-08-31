'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building, Mail, Phone, IndianRupee, Calendar, FileText, Link2, CheckCircle2, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isPro: boolean;
  clientToEdit?: any;
  onClientSaved?: () => void;
}

export default function AddClientModal({
  isOpen,
  onClose,
  user,
  isPro,
  clientToEdit,
  onClientSaved
}: AddClientModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successStep, setSuccessStep] = useState(false);
  const [isFirstClient, setIsFirstClient] = useState(false);
  const [automatedReminders, setAutomatedReminders] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    whatsapp: '',
    amount: '',
    dueDate: '',
    invoiceNumber: '',
    paymentLink: ''
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
  const paymentLinkInputRef = useRef<HTMLInputElement>(null);

  // Populate form when editing an existing client; reset when adding new
  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name || '',
        company: clientToEdit.company || '',
        email: clientToEdit.email || '',
        whatsapp: clientToEdit.whatsapp || '',
        amount: clientToEdit.amount || '',
        dueDate: clientToEdit.dueDate || '',
        invoiceNumber: clientToEdit.invoiceNumber || '',
        paymentLink: clientToEdit.paymentLink || ''
      });
      setAutomatedReminders(clientToEdit.automatedReminders || false);
    } else {
      setFormData({ name: '', company: '', email: '', whatsapp: '', amount: '', dueDate: '', invoiceNumber: '', paymentLink: '' });
      setAutomatedReminders(false);
    }
    setErrors({ name: '', email: '', amount: '', dueDate: '' });
  }, [clientToEdit, isOpen]);

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

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | null>) => {
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
      if (clientToEdit) {
        await updateDoc(doc(db, 'clients', clientToEdit.id), {
          name: formData.name,
          company: formData.company,
          email: formData.email,
          whatsapp: formData.whatsapp,
          amount: formData.amount,
          dueDate: formData.dueDate,
          invoiceNumber: formData.invoiceNumber,
          paymentLink: formData.paymentLink.trim(),
          automatedReminders: isPro && automatedReminders,
          automationStatus: isPro && automatedReminders ? 'active' : 'off'
        });

        window.dispatchEvent(new Event('clients-updated'));
        if (onClientSaved) onClientSaved();

        setLoading(false);
        handleResetAndClose();
        router.refresh();
        return;
      }

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
        paymentLink: formData.paymentLink.trim(),
        automatedReminders: isPro && automatedReminders,
        automationStatus: isPro && automatedReminders ? 'active' : 'off',
        status: 'Pending',
        createdAt: serverTimestamp(),
        reminderHistory: []
      });

      window.dispatchEvent(new Event('clients-updated'));
      if (onClientSaved) onClientSaved();

      setLoading(false);
      setSuccessStep(true);
      router.refresh();
    } catch (error) {
      console.error("Firebase Error: ", error);
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      whatsapp: '',
      amount: '',
      dueDate: '',
      invoiceNumber: '',
      paymentLink: ''
    });
    setErrors({ name: '', email: '', amount: '', dueDate: '' });
    setSuccessStep(false);
    setIsFirstClient(false);
    setAutomatedReminders(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 py-4 sm:p-4 sm:py-4 bg-slate-900/30 backdrop-blur-xs" 
      onClick={handleResetAndClose}
      suppressHydrationWarning={true}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl max-w-md sm:max-w-lg w-full shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col overflow-hidden text-slate-900"
        suppressHydrationWarning={true}
      >
        {/* STICKY HEADER */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 pt-4 pb-3 sm:px-8 sm:pt-6 sm:pb-4 border-b border-slate-100 z-10 flex items-center justify-between" suppressHydrationWarning={true}>
          <div suppressHydrationWarning={true}>
            <h2 className="text-base sm:text-xl font-black text-[#0F172A] uppercase tracking-tight" suppressHydrationWarning={true}>{clientToEdit ? 'Edit Client' : 'Add New Client'}</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5" suppressHydrationWarning={true}>{clientToEdit ? 'Update client details and payment status.' : 'Add a client to start tracking payments.'}</p>
          </div>
          <motion.button 
            whileHover={{ rotate: 90, scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={handleResetAndClose} 
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 sm:p-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors shrink-0"
            suppressHydrationWarning={true}
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </motion.button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-3 sm:space-y-5" suppressHydrationWarning={true}>
          {!successStep ? (
            <form id="add-client-form" className="space-y-3 sm:space-y-4" onSubmit={handleSave} suppressHydrationWarning={true}>
              
              {/* Client Name */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.03 }}
                className="space-y-1.5" 
                suppressHydrationWarning={true}
              >
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                  <span>Client Name *</span>
                  <AnimatePresence>
                    {formData.name.trim() && !errors.name && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <CheckCircle2 size={14} className="text-[#2BB6A8]" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <User className="absolute left-2.5 sm:left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={nameInputRef}
                    type="text" 
                    className={`w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#245B92]/25 transition ${errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#245B92]'}`} 
                    placeholder="John Doe" 
                    value={formData.name} 
                    onChange={(e) => handleChange('name', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, companyInputRef)}
                    suppressHydrationWarning={true}
                  />
                </div>
                <AnimatePresence>
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-[11px] font-bold text-red-500 pl-1"
                      suppressHydrationWarning={true}
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Company */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.06 }}
                className="space-y-1.5" 
                suppressHydrationWarning={true}
              >
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                  <span>Company <span className="text-slate-400 font-normal lowercase">(Optional)</span></span>
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <Building className="absolute left-2.5 sm:left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={companyInputRef}
                    type="text" 
                    className="w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition" 
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
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                  <span>Client Email *</span>
                  <AnimatePresence>
                    {formData.email.trim() && !errors.email && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <CheckCircle2 size={14} className="text-[#2BB6A8]" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <Mail className="absolute left-2.5 sm:left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={emailInputRef}
                    type="email" 
                    className={`w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#245B92]/25 transition ${errors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#245B92]'}`} 
                    placeholder="client@company.com" 
                    value={formData.email} 
                    onChange={(e) => handleChange('email', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, whatsappInputRef)}
                    suppressHydrationWarning={true}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-[11px] font-bold text-red-500 pl-1"
                      suppressHydrationWarning={true}
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* WhatsApp Number */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.12 }}
                className="space-y-1.5" 
                suppressHydrationWarning={true}
              >
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>
                  WhatsApp Number <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <Phone className="absolute left-2.5 sm:left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={whatsappInputRef}
                    type="tel" 
                    className="w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition" 
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
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" 
                suppressHydrationWarning={true}
              >
                <div className="space-y-1.5" suppressHydrationWarning={true}>
                  <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                    <span>Amount Due *</span>
                    <AnimatePresence>
                    {formData.amount.trim() && !errors.amount && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <CheckCircle2 size={14} className="text-[#2BB6A8]" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  </label>
                  <div className="relative flex items-center" suppressHydrationWarning={true}>
                    <IndianRupee className="absolute left-2.5 sm:left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                    <input 
                      ref={amountInputRef}
                      type="text" 
                      className={`w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#245B92]/25 transition ${errors.amount ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#245B92]'}`} 
                      placeholder="25,000" 
                      value={formData.amount ? Number(formData.amount).toLocaleString('en-IN') : ''} 
                      onChange={(e) => handleChange('amount', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, dueDateInputRef)}
                      suppressHydrationWarning={true}
                    />
                  </div>
                  <AnimatePresence>
                  {errors.amount && (
                    <motion.p
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-[11px] font-bold text-red-500 pl-1"
                      suppressHydrationWarning={true}
                    >
                      {errors.amount}
                    </motion.p>
                  )}
                </AnimatePresence>
                </div>

                <div className="space-y-1.5" suppressHydrationWarning={true}>
                  <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase flex justify-between" suppressHydrationWarning={true}>
                    <span>Due Date *</span>
                    <AnimatePresence>
                    {formData.dueDate.trim() && !errors.dueDate && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <CheckCircle2 size={14} className="text-[#2BB6A8]" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  </label>
                  <div className="relative flex items-center" suppressHydrationWarning={true}>
                    <Calendar className="absolute left-2.5 sm:left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                    <input 
                      ref={dueDateInputRef}
                      type="date" 
                      className={`w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#245B92]/25 transition text-slate-700 ${errors.dueDate ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-[#245B92]'}`} 
                      value={formData.dueDate} 
                      onChange={(e) => handleChange('dueDate', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, invoiceInputRef)}
                      suppressHydrationWarning={true}
                    />
                  </div>
                  <AnimatePresence>
                  {errors.dueDate && (
                    <motion.p
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-[11px] font-bold text-red-500 pl-1"
                      suppressHydrationWarning={true}
                    >
                      {errors.dueDate}
                    </motion.p>
                  )}
                </AnimatePresence>
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
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>
                  Invoice Number <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                </label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <FileText className="absolute left-2.5 sm:left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    ref={invoiceInputRef}
                    type="text" 
                    className="w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition" 
                    placeholder="INV-2026-001" 
                    value={formData.invoiceNumber} 
                    onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, paymentLinkInputRef)}
                    suppressHydrationWarning={true}
                  />
                </div>
              </motion.div>

              {/* Payment Link */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.21 }}
                className="space-y-1.5"
                suppressHydrationWarning={true}
              >
                <label
                  className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase"
                  suppressHydrationWarning={true}
                >
                  Payment Link{' '}
                  <span className="text-slate-400 font-normal lowercase">
                    (Optional)
                  </span>
                </label>

                <div
                  className="relative flex items-center"
                  suppressHydrationWarning={true}
                >
                  <Link2 className="absolute left-2.5 sm:left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input
                    ref={paymentLinkInputRef}
                    type="url"
                    className="w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition"
                    placeholder="https://rzp.io/l/..."
                    value={formData.paymentLink}
                    onChange={(e) =>
                      handleChange('paymentLink', e.target.value)
                    }
                    suppressHydrationWarning={true}
                  />
                </div>

                <p className="text-[10px] text-slate-400 pl-1">
                  Add a payment link if you want clients to pay directly from the reminder email.
                </p>
              </motion.div>

              {/* Automated Email Reminders */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.24 }}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4"
                suppressHydrationWarning={true}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">
                        Automated Email Reminders
                      </p>

                      <span className="text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-full bg-[#245B92] text-white whitespace-nowrap">
                        PRO
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                      Automatically send payment reminders to this client.
                    </p>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      if (!isPro) {
                        alert('Automated Email Reminders are available with DueBlink Pro.');
                        router.push('/pricing');
                        return;
                      }

                      setAutomatedReminders(prev => !prev);
                    }}
                    className={`relative shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ${
                      automatedReminders
                        ? 'bg-[#20B8BE]'
                        : 'bg-slate-300'
                    }`}
                    aria-label="Toggle automated email reminders"
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
                      style={{ left: automatedReminders ? '26px' : '4px' }}
                    />
                  </motion.button>
                </div>

                {!isPro && (
                  <p className="text-[10px] font-bold text-[#245B92] mt-3">
                    Upgrade to Pro to automatically send reminders.
                  </p>
                )}

                {isPro && automatedReminders && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-2">
                      Automatic sequence
                    </p>

                    <div className="space-y-2 text-xs font-semibold text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>First reminder</span>
                        <span className="text-slate-400">On due date</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Follow-up</span>
                        <span className="text-slate-400">3 days later</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Final follow-up</span>
                        <span className="text-slate-400">7 days later</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 sm:py-6 text-center space-y-4 sm:space-y-6" 
              suppressHydrationWarning={true}
            >
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.1 }}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-teal-50 text-[#2BB6A8] rounded-full flex items-center justify-center mx-auto shadow-inner"
                suppressHydrationWarning={true}
              >
                <CheckCircle2 size={30} className="sm:hidden" />
                <CheckCircle2 size={36} className="hidden sm:block" />
              </motion.div>
              <div suppressHydrationWarning={true}>
                {isFirstClient ? (
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-black text-[#0F172A]" suppressHydrationWarning={true}>Great start! 🎉</h3>
                    <p className="text-sm text-slate-500 font-medium px-4" suppressHydrationWarning={true}>
                      You've added your first client. Now generate your first AI reminder.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-black text-[#0F172A]" suppressHydrationWarning={true}>Client Added Successfully</h3>
                    <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning={true}>What would you like to do next?</p>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 sm:space-y-3 pt-2" suppressHydrationWarning={true}>
                <motion.button 
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResetAndClose} 
                  className="w-full py-3 sm:py-3.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
                  suppressHydrationWarning={true}
                >
                  Go to Dashboard
                  <motion.span
                    className="inline-flex"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight size={16} />
                  </motion.span>
                </motion.button>
                
                <motion.button 
                  whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(36,91,146,0.25)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { 
                    handleResetAndClose(); 
                    router.push('/dashboard'); 
                  }} 
                  className="w-full py-3 sm:py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition-shadow flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                  suppressHydrationWarning={true}
                >
                  <Sparkles size={16} /> Generate Reminder
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* STICKY FOOTER SAVE BUTTON */}
        {!successStep && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-8 sm:py-4 border-t border-slate-100 z-10" suppressHydrationWarning={true}>
            <motion.button 
              whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(36,91,146,0.2)' }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              form="add-client-form"
              disabled={loading} 
              className="w-full py-3 sm:py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer" 
              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
              suppressHydrationWarning={true}
            >
              {loading ? <><Loader2 className="animate-spin" size={16} /> {clientToEdit ? 'Updating...' : 'Saving Client...'}</> : (clientToEdit ? 'Update Client' : 'Save Client')}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}