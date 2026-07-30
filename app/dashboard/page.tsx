'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Loader2, X, User, Building, Mail, Phone, IndianRupee, Calendar, FileText, CheckCircle2, Copy, Layers, TrendingUp, Users, Trash2, AlertTriangle, Eye, ChevronDown, Menu } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import FloatingRobot from '@/components/FloatingRobot';
import { useCompletion } from 'ai/react';

function AddClientModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: any }) {
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
      router.refresh();
    } catch (error) {
      console.error("Error adding client: ", error);
      alert("Failed to save client.");
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" suppressHydrationWarning={true}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto text-slate-900"
        suppressHydrationWarning={true}
      >
        <button 
          onClick={handleResetAndClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full bg-slate-50 transition"
          suppressHydrationWarning={true}
        >
          <X size={20} />
        </button>

        {!successStep ? (
          <>
            <div className="mb-6" suppressHydrationWarning={true}>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900" suppressHydrationWarning={true}>Add New Client</h2>
              <p className="text-xs text-slate-500 font-medium mt-1" suppressHydrationWarning={true}>Add a client to start tracking payments and generating AI reminders.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSave} suppressHydrationWarning={true}>
              <div className="space-y-1.5" suppressHydrationWarning={true}>
                <label className="text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>Client Name *</label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <User className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    type="text" 
                    required 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-transparent rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition text-slate-900" 
                    placeholder="John Doe" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>

              <div className="space-y-1.5" suppressHydrationWarning={true}>
                <label className="text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>Company (Optional)</label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <Building className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-transparent rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition text-slate-900" 
                    placeholder="ABC Agency" 
                    value={formData.company} 
                    onChange={(e) => setFormData({...formData, company: e.target.value})} 
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>

              <div className="space-y-1.5" suppressHydrationWarning={true}>
                <label className="text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>Client Email *</label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <Mail className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    type="email" 
                    required 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-transparent rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition text-slate-900" 
                    placeholder="client@company.com" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>

              <div className="space-y-1.5" suppressHydrationWarning={true}>
                <label className="text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>WhatsApp Number (Optional)</label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <Phone className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    type="tel" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-transparent rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition text-slate-900" 
                    placeholder="+91 98765 43210" 
                    value={formData.whatsapp} 
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} 
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" suppressHydrationWarning={true}>
                <div className="space-y-1.5" suppressHydrationWarning={true}>
                  <label className="text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>Amount Due *</label>
                  <div className="relative flex items-center" suppressHydrationWarning={true}>
                    <IndianRupee className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                    <input 
                      type="number" 
                      required 
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-transparent rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition text-slate-900" 
                      placeholder="25000" 
                      value={formData.amount} 
                      onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                      suppressHydrationWarning={true}
                    />
                  </div>
                </div>

                <div className="space-y-1.5" suppressHydrationWarning={true}>
                  <label className="text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>Due Date *</label>
                  <div className="relative flex items-center" suppressHydrationWarning={true}>
                    <Calendar className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                    <input 
                      type="date" 
                      required 
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-transparent rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition text-slate-600" 
                      value={formData.dueDate} 
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                      suppressHydrationWarning={true}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5" suppressHydrationWarning={true}>
                <label className="text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>Invoice Number (Optional)</label>
                <div className="relative flex items-center" suppressHydrationWarning={true}>
                  <FileText className="absolute left-3 text-slate-400" size={16} suppressHydrationWarning={true} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-transparent rounded-xl text-sm focus:outline-none focus:border-[#245B92] transition text-slate-900" 
                    placeholder="INV-2026-001" 
                    value={formData.invoiceNumber} 
                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} 
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm mt-6 shadow-md transition hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer" 
                style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                suppressHydrationWarning={true}
              >
                {loading ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : 'Save Client'}
              </button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center space-y-6" suppressHydrationWarning={true}>
            <div className="w-16 h-16 bg-teal-50 text-[#2BB6A8] rounded-full flex items-center justify-center mx-auto shadow-inner" suppressHydrationWarning={true}>
              <CheckCircle2 size={36} />
            </div>
            <div suppressHydrationWarning={true}>
              <h3 className="text-xl font-black text-slate-900" suppressHydrationWarning={true}>Client Saved Successfully</h3>
              <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning={true}>What would you like to do next?</p>
            </div>

            <div className="space-y-3 pt-2" suppressHydrationWarning={true}>
              <button 
                onClick={() => { handleResetAndClose(); router.push('/dashboard'); }} 
                className="w-full py-3.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                suppressHydrationWarning={true}
              >
                Go to Client Details
              </button>
              
              <button 
                onClick={() => { handleResetAndClose(); router.push('/dashboard'); }} 
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                suppressHydrationWarning={true}
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

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State for toggling small details module per client
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Custom Delete Confirmation Popup State
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);

  const { completion, complete, isLoading: isStreaming } = useCompletion({
    api: '/api/pro-recovery-assistant',
  });

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push('/login');
      else { setUser(currentUser); setLoading(false); }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteDoc(doc(db, 'clients', clientToDelete.id));
      setClientToDelete(null);
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client.");
    }
  };

  const totalOutstanding = clients.filter(c => c.status === 'Pending').reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const pendingCount = clients.filter(c => c.status === 'Pending').length;
  
  const totalClientsCount = clients.length;
  const paidClientsCount = clients.filter(c => c.status === 'Paid').length;
  const recoveryRateValue = totalClientsCount > 0 ? Math.round((paidClientsCount / totalClientsCount) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleAssistantAction = async (action: string) => {
    setActiveAction(action);
    await complete(JSON.stringify({ action, clients, history: [] }));
  };

  const handleProRecovery = async (client: any) => {
    setActiveAction(client.id);
    await complete(JSON.stringify({ client, history: client.reminderHistory || [] }));
  };

  const handleSummarizeOutstanding = async () => {
    setActiveAction("summary");
    await complete(JSON.stringify({ 
      action: "summarize_outstanding", 
      clients: clients, 
      total: totalOutstanding 
    }));
  };

  const recommendation = clients.filter(c => c.status === 'Pending').sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0)).pop();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white" suppressHydrationWarning={true}><Loader2 className="w-8 h-8 animate-spin text-[#1C2E8F]" /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-white text-[#0F172A] antialiased selection:bg-[#20B8BE]/25 transition-colors duration-200" 
      suppressHydrationWarning={true}
    >
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} />
      
      <AnimatePresence>
        {clientToDelete && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" suppressHydrationWarning={true}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4"
              suppressHydrationWarning={true}
            >
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner" suppressHydrationWarning={true}>
                <AlertTriangle size={28} />
              </div>
              <div suppressHydrationWarning={true}>
                <h3 className="text-lg font-black text-slate-900" suppressHydrationWarning={true}>Delete Client</h3>
                <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning={true}>Are you sure you want to delete <span className="font-bold text-slate-700" suppressHydrationWarning={true}>{clientToDelete.name}</span>? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-2" suppressHydrationWarning={true}>
                <button 
                  onClick={() => setClientToDelete(null)} 
                  className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  suppressHydrationWarning={true}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteClient} 
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 transition cursor-pointer"
                  suppressHydrationWarning={true}
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeAction && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 50, x: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50, x: 50 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-24 right-6 sm:bottom-28 sm:right-10 z-[999] w-[calc(100vw-48px)] sm:w-96 bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 overflow-hidden max-h-[60vh]"
            suppressHydrationWarning={true}
          >
            <div className="flex justify-between items-center mb-6" suppressHydrationWarning={true}>
              <h3 className="font-black text-[#245B92] uppercase text-[10px] tracking-widest" suppressHydrationWarning={true}>
                {isStreaming ? "Thinking..." : "AI Insight"}
              </h3>
              <button onClick={() => setActiveAction(null)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-full cursor-pointer" suppressHydrationWarning={true}><X size={16}/></button>
            </div>
            
            <div className="text-sm text-slate-700 overflow-y-auto whitespace-pre-wrap leading-7 tracking-normal font-medium max-h-[40vh]" suppressHydrationWarning={true}>
              {completion || (isStreaming ? "Generating response..." : "Processing...")}
            </div>
            
            {!isStreaming && completion && (
              <button 
                onClick={async () => { await navigator.clipboard.writeText(completion); alert("Copied!"); }} 
                className="mt-8 flex items-center gap-2 text-[10px] font-bold text-[#1C2E8F] uppercase tracking-wider hover:opacity-80 cursor-pointer"
                suppressHydrationWarning={true}
              >
                <Copy size={12} /> Copy Result
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <FloatingRobot 
        onTrigger={handleAssistantAction} 
        recommendation={recommendation ? { name: recommendation.name, amount: recommendation.amount, daysOverdue: 0 } : null} 
      />

      {/* --- PRECISE SAAS NAVBAR WITH ALL ANIMATIONS & HOVERS APPLIED --- */}
      <nav className="border-b border-slate-100 bg-white/90 backdrop-blur-[10px] sticky top-0 z-50 transition-all duration-300 shadow-xs" suppressHydrationWarning={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-32 flex items-center justify-between" suppressHydrationWarning={true}>
          
          {/* LOGO WITH HOVER ANIMATION */}
          <motion.div 
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex items-center justify-start cursor-pointer h-28 w-[380px] sm:w-[500px] relative select-none" 
            onClick={() => router.push('/')} 
            suppressHydrationWarning={true}
          >
            <img src="/logo.png" alt="DueBlink Logo" className="h-full w-full object-contain object-left" suppressHydrationWarning={true} />
          </motion.div>

          <div className="flex items-center gap-8" suppressHydrationWarning={true}>
            
            {/* DESKTOP NAV LINKS */}
            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600" suppressHydrationWarning={true}>
              
              {/* Dashboard Link */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard')} 
                className={`relative py-2 px-3 transition-colors duration-200 cursor-pointer font-bold group ${pathname === '/dashboard' ? 'text-[#245B92]' : 'text-slate-600 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Dashboard</span>
                {pathname === '/dashboard' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.25, ease: "easeInOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.button>

              {/* Pricing Link */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/pricing')} 
                className={`relative py-2 px-3 transition-colors duration-200 cursor-pointer font-bold group ${pathname === '/pricing' ? 'text-[#245B92]' : 'text-slate-600 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Pricing</span>
                {pathname === '/pricing' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.25, ease: "easeInOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.button>

              {/* Account Link */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/account')} 
                className={`relative py-2 px-3 transition-colors duration-200 cursor-pointer font-bold group ${pathname === '/account' ? 'text-[#245B92]' : 'text-slate-600 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Account</span>
                {pathname === '/account' ? (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.25, ease: "easeInOut" }} suppressHydrationWarning={true} />
                ) : (
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#245B92] rounded-full transition-all duration-200 group-hover:w-[calc(100%-24px)] group-hover:left-3" />
                )}
              </motion.button>
            </div>

            {/* CTA / LOGOUT BUTTON WITH SCALE & SHADOW EFFECTS */}
            <div className="flex items-center gap-4" suppressHydrationWarning={true}>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={handleLogout} 
                className="text-sm font-bold text-slate-600 hover:text-red-600 cursor-pointer transition py-2 px-3 rounded-xl hover:bg-slate-50 shadow-none hover:shadow-xs" 
                suppressHydrationWarning={true}
              >
                Logout
              </motion.button>
            </div>
          </div>

          {/* MOBILE HAMBURGER TOGGLE BUTTON */}
          <div className="flex md:hidden items-center" suppressHydrationWarning={true}>
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

        {/* MOBILE DROPDOWN DRAWER */}
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
                  onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }}
                  className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/dashboard' ? 'bg-slate-50 text-[#245B92]' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => { router.push('/pricing'); setMobileMenuOpen(false); }}
                  className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/pricing' ? 'bg-slate-50 text-[#245B92]' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  Pricing
                </button>
                <button 
                  onClick={() => { router.push('/account'); setMobileMenuOpen(false); }}
                  className={`text-left py-2 px-3 rounded-lg transition font-bold ${pathname === '/account' ? 'bg-slate-50 text-[#245B92]' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  Account
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full py-3 text-center font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12" suppressHydrationWarning={true}>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" suppressHydrationWarning={true}>
          <div className="space-y-1.5" suppressHydrationWarning={true}>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900" suppressHydrationWarning={true}>
              {getGreeting()}, {user?.email?.split('@')[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>
              Here's your payment recovery overview.
            </p>
            
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-slate-600" suppressHydrationWarning={true}>
              <span suppressHydrationWarning={true}>Last reminder: <strong className="text-slate-900 font-black" suppressHydrationWarning={true}>Today</strong></span>
              <span suppressHydrationWarning={true}>Recovered this month: <strong className="text-slate-900 font-black" suppressHydrationWarning={true}>₹0</strong></span>
              <span suppressHydrationWarning={true}>Clients: <strong className="text-slate-900 font-black" suppressHydrationWarning={true}>{clients.length}</strong></span>
            </div>
          </div>

          <button onClick={handleSummarizeOutstanding} disabled={isStreaming} className="text-xs font-bold text-white bg-[#0F172A] px-5 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition cursor-pointer flex items-center gap-2" suppressHydrationWarning={true}>
            {isStreaming ? <Loader2 className="animate-spin" size={14} suppressHydrationWarning={true} /> : null}
            {isStreaming ? 'Summarizing...' : 'Outstanding Summary'}
          </button>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" suppressHydrationWarning={true}>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm border-t-4 border-t-[#245B92]" suppressHydrationWarning={true}>
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><Layers size={14} suppressHydrationWarning={true}/> Total Outstanding</div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900" suppressHydrationWarning={true}>₹{totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm border-t-4 border-t-[#20B8BE]" suppressHydrationWarning={true}>
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><Users size={14} suppressHydrationWarning={true}/> Pending Clients</div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900" suppressHydrationWarning={true}>{pendingCount} {pendingCount === 1 ? 'Client' : 'Clients'}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm border-t-4 border-t-[#2BB6A8]" suppressHydrationWarning={true}>
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><TrendingUp size={14} suppressHydrationWarning={true}/> Recovery Rate</div>
            <p className="text-2xl sm:text-3xl font-black text-[#2BB6A8]" suppressHydrationWarning={true}>{recoveryRateValue}%</p>
          </div>
        </section>

        {recommendation && (
          <section className="p-6 sm:p-8 bg-white border border-[#2BB6A8]/30 rounded-3xl shadow-sm border-l-8 border-l-[#2BB6A8]" suppressHydrationWarning={true}>
            <h2 className="text-[10px] font-black text-[#2BB6A8] uppercase tracking-widest mb-4" suppressHydrationWarning={true}>Today's Recommendation</h2>
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4" suppressHydrationWarning={true}>
              <div suppressHydrationWarning={true}>
                <p className="text-xl sm:text-2xl font-black text-slate-900" suppressHydrationWarning={true}>{recommendation.name}</p>
                <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>{recommendation.company || recommendation.email} • ₹{recommendation.amount} Outstanding</p>
              </div>
              <button onClick={() => handleProRecovery(recommendation)} disabled={activeAction === recommendation.id} className="w-full sm:w-auto bg-[#0F172A] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-90 flex items-center justify-center gap-2 transition-all cursor-pointer" suppressHydrationWarning={true}>
                {activeAction === recommendation.id ? <><Loader2 className="animate-spin" size={16} suppressHydrationWarning={true} /> Thinking...</> : "Generate Follow-up"}
              </button>
            </div>
          </section>
        )}

        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm" suppressHydrationWarning={true}>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4" suppressHydrationWarning={true}>
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400" suppressHydrationWarning={true}>Recent Clients</h3>
            <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:opacity-95 transition cursor-pointer" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>
              <Plus size={16} suppressHydrationWarning={true} /> Add New Client
            </button>
          </div>
          
          <div className="space-y-4" suppressHydrationWarning={true}>
            {clients.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200" suppressHydrationWarning={true}>
                <p className="text-base font-bold text-slate-700" suppressHydrationWarning={true}>No clients yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium" suppressHydrationWarning={true}>Start by adding your first client to begin tracking payments.</p>
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer" 
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                  suppressHydrationWarning={true}
                >
                  <Plus size={14} suppressHydrationWarning={true} /> Add New Client
                </button>
              </div>
            ) : (
              clients.map((c) => {
                let daysOverdue = 0;
                if (c.dueDate) {
                  const due = new Date(c.dueDate);
                  const today = new Date();
                  const diffTime = today.getTime() - due.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  daysOverdue = diffDays > 0 ? diffDays : 0;
                }

                const isExpanded = expandedClientId === c.id;

                return (
                  <div key={c.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50 hover:border-slate-200 transition space-y-4" suppressHydrationWarning={true}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" suppressHydrationWarning={true}>
                      {/* Minimal Row: Client Name & Status */}
                      <div className="space-y-1" suppressHydrationWarning={true}>
                        <div className="flex items-center gap-3" suppressHydrationWarning={true}>
                          <p className="font-bold text-base text-slate-900" suppressHydrationWarning={true}>{c.name}</p>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${c.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`} suppressHydrationWarning={true}>
                            {c.status || 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium" suppressHydrationWarning={true}>{c.company || c.email || 'No company'}</p>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-3 w-full sm:w-auto" suppressHydrationWarning={true}>
                        {/* View Button to toggle the small details module */}
                        <button 
                          onClick={() => setExpandedClientId(isExpanded ? null : c.id)} 
                          className="flex-1 sm:flex-none text-xs font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 shadow-sm transition cursor-pointer text-slate-700 flex items-center justify-center gap-1.5"
                          suppressHydrationWarning={true}
                        >
                          <Eye size={14} suppressHydrationWarning={true} /> {isExpanded ? 'Hide Details' : 'View'}
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} suppressHydrationWarning={true} />
                        </button>

                        {c.status === 'Pending' ? (
                          <button 
                            onClick={() => updateDoc(doc(db, 'clients', c.id), { status: 'Paid' })} 
                            className="flex-1 sm:flex-none text-xs font-bold text-white px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5" 
                            style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                            suppressHydrationWarning={true}
                          >
                            <CheckCircle2 size={14} suppressHydrationWarning={true} /> Mark Paid
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-[#2BB6A8] bg-[#2BB6A8]/10 px-4 py-2 rounded-xl flex items-center gap-2" suppressHydrationWarning={true}>
                            <CheckCircle2 size={14} suppressHydrationWarning={true} /> Paid
                          </span>
                        )}
                        
                        <button 
                          onClick={() => setClientToDelete(c)} 
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Client"
                          suppressHydrationWarning={true}
                        >
                          <Trash2 size={16} suppressHydrationWarning={true} />
                        </button>
                      </div>
                    </div>

                    {/* Small Collapsible Module for Amount Due, Due Date, and Overdue */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pt-3 border-t border-slate-200/60"
                          suppressHydrationWarning={true}
                        >
                          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-700 bg-white p-4 rounded-xl border border-slate-200 shadow-3xs" suppressHydrationWarning={true}>
                            <span suppressHydrationWarning={true}>
                              Amount Due: <strong className="text-slate-900 font-black text-sm ml-1" suppressHydrationWarning={true}>₹{Number(c.amount || 0).toLocaleString()}</strong>
                            </span>
                            <span suppressHydrationWarning={true}>
                              Due Date: <strong className="text-slate-900 ml-1" suppressHydrationWarning={true}>{c.dueDate || 'N/A'}</strong>
                            </span>
                            <span suppressHydrationWarning={true}>
                              Overdue: <strong className="text-rose-600 ml-1" suppressHydrationWarning={true}>{daysOverdue} days</strong>
                            </span>
                          </div>

                          <div className="mt-3 flex justify-end" suppressHydrationWarning={true}>
                            <button 
                              onClick={() => handleProRecovery(c)} 
                              className="text-xs font-bold text-[#245B92] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                              suppressHydrationWarning={true}
                            >
                              <Sparkles size={14} className="text-[#20B8BE]" suppressHydrationWarning={true} /> Generate AI Reminder
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </motion.div>
  );
}