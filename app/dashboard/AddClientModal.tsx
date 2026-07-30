'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    whatsapp: '',
    amount: '',
    dueDate: '',
    invoiceNumber: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to add a client.");
      return;
    }
    if (!formData.name || !formData.email || !formData.amount || !formData.dueDate) {
      alert("Please fill in all required fields (*).");
      return;
    }

    setLoading(true);
    try {
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

      setLoading(false);
      setSuccessStep(true);
      // Trigger a router refresh so the dashboard instantly picks up the new client
      router.refresh();
    } catch (error) {
      console.error("Firebase Error: ", error);
      alert("Failed to save client. Check console for details.");
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setFormData({ name: '', company: '', email: '', whatsapp: '', amount: '', dueDate: '', invoiceNumber: '' });
    setSuccessStep(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto"
      >
        <button 
          onClick={handleResetAndClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full bg-slate-50 hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        {!successStep ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Add New Client</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Add a client to start tracking payments and generating AI reminders.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSave}>
              {/* Client Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Client Name *</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    required 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition" 
                    placeholder="John Doe" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Company (Optional)</label>
                <div className="relative flex items-center">
                  <Building className="absolute left-3 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition" 
                    placeholder="ABC Agency" 
                    value={formData.company} 
                    onChange={(e) => setFormData({...formData, company: e.target.value})} 
                  />
                </div>
              </div>

              {/* Client Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Client Email *</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 text-slate-400" size={16} />
                  <input 
                    type="email" 
                    required 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition" 
                    placeholder="client@company.com" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp Number (Optional)</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 text-slate-400" size={16} />
                  <input 
                    type="tel" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition" 
                    placeholder="+91 98765 43210" 
                    value={formData.whatsapp} 
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} 
                  />
                </div>
              </div>

              {/* Amount Due & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount Due *</label>
                  <div className="relative flex items-center">
                    <IndianRupee className="absolute left-3 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      required 
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition" 
                      placeholder="25000" 
                      value={formData.amount} 
                      onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Due Date *</label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3 text-slate-400" size={16} />
                    <input 
                      type="date" 
                      required 
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition text-slate-600" 
                      value={formData.dueDate} 
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Invoice Number (Optional)</label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-3 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition" 
                    placeholder="INV-2026-001" 
                    value={formData.invoiceNumber} 
                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm mt-6 shadow-md transition hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer" 
                style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
              >
                {loading ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : 'Save Client'}
              </button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 bg-teal-50 text-[#2BB6A8] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0F172A]">Client Saved Successfully</h3>
              <p className="text-sm text-slate-500 mt-1">What would you like to do next?</p>
            </div>

            <div className="space-y-3 pt-2">
              <button 
                onClick={() => { handleResetAndClose(); router.push('/dashboard'); }} 
                className="w-full py-3.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Go to Client Details <ArrowRight size={16} />
              </button>
              
              <button 
                onClick={() => { handleResetAndClose(); router.push('/dashboard'); }} 
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
              >
                <Sparkles size={16} /> Generate AI Reminder
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}