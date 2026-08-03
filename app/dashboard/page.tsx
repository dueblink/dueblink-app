'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Loader2, X, User, Building, Mail, Phone, IndianRupee, Calendar, FileText, CheckCircle2, Copy, Layers, TrendingUp, Users, Trash2, AlertTriangle, Eye, ChevronDown, Menu, Crown, Bell, Shield, HelpCircle } from 'lucide-react';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" suppressHydrationWarning={true}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
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
              <p className="text-xs text-slate-500 font-medium mt-1" suppressHydrationWarning={true}>Add a client to start tracking payments and managing invoices.</p>
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
                onClick={() => { handleResetAndClose(); }} 
                className="w-full py-3.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                suppressHydrationWarning={true}
              >
                Go to Dashboard Overview
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
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [clients, setClients] = useState<any[]>([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [aiTone, setAiTone] = useState('Professional');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [reminderNotifs, setReminderNotifs] = useState(true);

  const [robotAction, setRobotAction] = useState<string | null>(null);

  const { completion, complete, isLoading: isStreaming } = useCompletion({
    api: '/api/pro-recovery-assistant',
  });

  useEffect(() => {
    if (clients && clients.length > 0) {
      localStorage.setItem('dueblink_clients', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    const justUpgraded = localStorage.getItem('just_upgraded');
    if (justUpgraded === 'true') {
      localStorage.removeItem('just_upgraded');
      
      const timer = setTimeout(() => {
        setIsPro(true);
        complete(JSON.stringify({ action: "welcome_pro", clients, history: [] }));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [clients, complete]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        
        if (localStorage.getItem('dueblink_pro_active') === 'true') {
          setIsPro(true);
        }

        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            if (data.isPro && data.proExpiresAt) {
              const expirationDate = data.proExpiresAt.toDate();
              const now = new Date();

              if (now > expirationDate) {
                await updateDoc(userDocRef, {
                  isPro: false,
                  proExpiresAt: null
                });
                setIsPro(false);
                localStorage.removeItem('dueblink_pro_active');
              } else {
                setIsPro(true);
                localStorage.setItem('dueblink_pro_active', 'true');
              }
            } else if (data.isPro) {
              setIsPro(true);
              localStorage.setItem('dueblink_pro_active', 'true');
            } else {
              setIsPro(false);
              localStorage.removeItem('dueblink_pro_active');
            }

            if (data.aiTone) setAiTone(data.aiTone);
            if (data.emailNotifs !== undefined) setEmailNotifs(data.emailNotifs);
            if (data.reminderNotifs !== undefined) setReminderNotifs(data.reminderNotifs);
          }
        } catch (err) {
          console.error("Error fetching pro status:", err);
        }

        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
  }, [user]);

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

  const handleCancelSubscription = async () => {
    if (!user) {
      alert("No active user found. Please log in again.");
      return;
    }
    
    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      
      await setDoc(userRef, { 
        isPro: false, 
        proExpiresAt: null, 
        cancelledAt: serverTimestamp(),
        email: user.email || '',
        name: user.displayName || ''
      }, { merge: true });

      localStorage.removeItem('dueblink_pro_active');
      
      setIsPro(false);
      setLoading(false);
      setCancelModalOpen(false);
      
      setSuccessMessage("Your Pro subscription has been successfully cancelled.");
      setTimeout(() => setSuccessMessage(null), 4000);

      router.refresh();
      
    } catch (error: any) {
      console.error("Detailed Cancellation Error:", error);
      alert(`Failed to cancel subscription: ${error.message || "Please try again."}`);
      setLoading(false);
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
  const paidCount = clients.filter(c => c.status === 'Paid').length;
  
  const totalClientsCount = clients.length;
  const recoveryRateValue = totalClientsCount > 0 ? Math.round((paidCount / totalClientsCount) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleAssistantAction = async (action: string) => {
    if (!isPro) {
      alert("Upgrade to DueBlink Pro to unlock Pro Recovery Assistant.");
      router.push('/pricing');
      return;
    }
    await complete(JSON.stringify({ action, clients, history: [] }));
  };

  const handleProRecovery = async (client: any) => {
    if (!isPro) {
      alert("Upgrade to DueBlink Pro to unlock Pro Recovery Assistant.");
      router.push('/pricing');
      return;
    }
    await complete(JSON.stringify({ client, history: client.reminderHistory || [] }));
  };

  const handleSummarizeOutstanding = async () => {
    if (!isPro) {
      alert("Upgrade to DueBlink Pro to unlock Pro Recovery Assistant.");
      router.push('/pricing');
      return;
    }
    setRobotAction('summarize');
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
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-white text-[#0F172A] antialiased selection:bg-[#20B8BE]/25 transition-colors duration-150" 
      suppressHydrationWarning={true}
    >
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} />
      
      {/* --- CUSTOM SUBSCRIPTION CANCELLATION MODAL --- */}
      <AnimatePresence>
        {cancelModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" suppressHydrationWarning={true}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6"
              suppressHydrationWarning={true}
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner" suppressHydrationWarning={true}>
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-2" suppressHydrationWarning={true}>
                <h3 className="text-xl font-black text-slate-900" suppressHydrationWarning={true}>Cancel Pro Subscription?</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed" suppressHydrationWarning={true}>
                  Are you sure you want to cancel? You will lose access to the <span className="font-bold text-slate-700">Pro Recovery Assistant</span> and unlimited client recovery tools.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2" suppressHydrationWarning={true}>
                <button 
                  onClick={() => setCancelModalOpen(false)} 
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-3xs"
                  suppressHydrationWarning={true}
                >
                  Keep Pro Plan ✨
                </button>
                <button 
                  onClick={handleCancelSubscription} 
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2"
                  suppressHydrationWarning={true}
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : 'Yes, Cancel Plan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {clientToDelete && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" suppressHydrationWarning={true}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
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
      
      <FloatingRobot 
        isPro={isPro}
        externalAction={robotAction}
        onTrigger={(action) => {
          if (!isPro) {
            router.push('/pricing');
            return;
          }
          handleAssistantAction(action);
        }} 
        recommendation={recommendation ? { name: recommendation.name, amount: recommendation.amount, daysOverdue: 0 } : null} 
      />

      {/* NAVBAR */}
      <nav className="border-b border-slate-100 bg-white/90 backdrop-blur-[10px] sticky top-0 z-50 transition-all duration-200 shadow-xs" suppressHydrationWarning={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-32 flex items-center justify-between" suppressHydrationWarning={true}>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center justify-start cursor-pointer h-28 w-[380px] sm:w-[500px] relative select-none" 
            onClick={() => router.push('/')} 
            suppressHydrationWarning={true}
          >
            <img src="/logo.png" alt="DueBlink Logo" className="h-full w-full object-contain object-left" suppressHydrationWarning={true} />
          </motion.div>

          <div className="flex items-center gap-8" suppressHydrationWarning={true}>
            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600" suppressHydrationWarning={true}>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('overview')} 
                className={`relative py-2 px-3 transition-colors duration-150 cursor-pointer font-bold group ${activeTab === 'overview' ? 'text-[#245B92]' : 'text-slate-600 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Dashboard</span>
                {activeTab === 'overview' && (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.2, ease: "easeOut" }} suppressHydrationWarning={true} />
                )}
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/pricing')} 
                className="relative py-2 px-3 transition-colors duration-150 cursor-pointer font-bold text-slate-600 hover:text-[#245B92]"
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Pricing</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('settings')} 
                className={`relative py-2 px-3 transition-colors duration-150 cursor-pointer font-bold group ${activeTab === 'settings' ? 'text-[#245B92]' : 'text-slate-600 hover:text-[#245B92]'}`}
                suppressHydrationWarning={true}
              >
                <span suppressHydrationWarning={true}>Account & Settings</span>
                {activeTab === 'settings' && (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-full" transition={{ duration: 0.2, ease: "easeOut" }} suppressHydrationWarning={true} />
                )}
              </motion.button>
            </div>

            <div className="flex items-center gap-4" suppressHydrationWarning={true}>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                onClick={handleLogout} 
                className="text-sm font-bold text-slate-600 hover:text-red-600 cursor-pointer transition py-2 px-3 rounded-xl hover:bg-slate-50" 
                suppressHydrationWarning={true}
              >
                Logout
              </motion.button>
            </div>
          </div>

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

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden border-t border-slate-100 bg-white px-6 py-6 space-y-4 shadow-xl overflow-hidden"
              suppressHydrationWarning={true}
            >
              <div className="flex flex-col space-y-3 font-bold text-slate-700">
                <button onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }} className="text-left py-2 px-3 rounded-lg transition font-bold text-slate-700 hover:bg-slate-50">Dashboard</button>
                <button onClick={() => { router.push('/pricing'); setMobileMenuOpen(false); }} className="text-left py-2 px-3 rounded-lg transition font-bold text-slate-700 hover:bg-slate-50">Pricing</button>
                <button onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }} className="text-left py-2 px-3 rounded-lg transition font-bold text-slate-700 hover:bg-slate-50">Account & Settings</button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full py-3 text-center font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition">Logout</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12" suppressHydrationWarning={true}>
        
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-xs"
              suppressHydrationWarning={true}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">✓</div>
                <p className="text-xs font-bold tracking-wide">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'overview' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {isPro ? (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl p-6 text-white flex flex-col sm:flex-row justify-between items-center shadow-lg gap-4" suppressHydrationWarning={true}>
                <div className="space-y-1 text-center sm:text-left flex items-center gap-3" suppressHydrationWarning={true}>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Crown size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight" suppressHydrationWarning={true}>You are Pro ✨</h2>
                    <p className="text-xs text-white/90 font-medium" suppressHydrationWarning={true}>Pro Recovery Assistant and premium features are fully unlocked.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs backdrop-blur-md">
                    Active Pro Plan
                  </span>
                  <button 
                    onClick={() => setCancelModalOpen(true)}
                    className="bg-white/10 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-bold text-xs backdrop-blur-md transition cursor-pointer"
                  >
                    Cancel Plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-3xl p-6 text-white flex flex-col sm:flex-row justify-between items-center shadow-lg gap-4" suppressHydrationWarning={true}>
                <div className="space-y-1 text-center sm:text-left" suppressHydrationWarning={true}>
                  <h2 className="text-lg font-black tracking-tight" suppressHydrationWarning={true}>Unlock Pro Recovery Assistant</h2>
                  <p className="text-xs text-white/90 font-medium" suppressHydrationWarning={true}>Automate follow-ups, analyze payment trends, and recover money faster.</p>
                </div>
                <button 
                  onClick={() => router.push('/pricing')}
                  className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-xs shadow-md hover:bg-slate-100 transition cursor-pointer whitespace-nowrap"
                  suppressHydrationWarning={true}
                >
                  Upgrade to Pro 🚀
                </button>
              </div>
            )}

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" suppressHydrationWarning={true}>
              <div className="space-y-1.5" suppressHydrationWarning={true}>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900" suppressHydrationWarning={true}>
                  {getGreeting()}, {user?.email?.split('@')[0]} 👋
                </h1>
                <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>
                  Here's your complete payment management overview.
                </p>
                
                <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-slate-600" suppressHydrationWarning={true}>
                  <span suppressHydrationWarning={true}>Paid: <strong className="text-slate-900 font-black" suppressHydrationWarning={true}>{paidCount}</strong></span>
                  <span suppressHydrationWarning={true}>Pending: <strong className="text-slate-900 font-black" suppressHydrationWarning={true}>{pendingCount}</strong></span>
                  <span suppressHydrationWarning={true}>Total Clients: <strong className="text-slate-900 font-black" suppressHydrationWarning={true}>{clients.length}</strong></span>
                </div>
              </div>

              <motion.button 
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setRobotAction('summarize');
                  handleSummarizeOutstanding();
                }} 
                disabled={isStreaming} 
                className="text-xs font-bold text-white bg-[#0F172A] px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                suppressHydrationWarning={true}
              >
                {isStreaming ? <Loader2 className="animate-spin" size={14} suppressHydrationWarning={true} /> : null}
                {isStreaming ? 'Summarizing...' : 'Outstanding Summary'}
              </motion.button>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" suppressHydrationWarning={true}>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs border-t-4 border-t-[#245B92]" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><Layers size={14} suppressHydrationWarning={true}/> Total Outstanding</div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900" suppressHydrationWarning={true}>₹{totalOutstanding.toLocaleString()}</p>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs border-t-4 border-t-[#20B8BE]" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><Users size={14} suppressHydrationWarning={true}/> Pending Clients</div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900" suppressHydrationWarning={true}>{pendingCount} {pendingCount === 1 ? 'Client' : 'Clients'}</p>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs border-t-4 border-t-[#2BB6A8]" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><TrendingUp size={14} suppressHydrationWarning={true}/> Recovery Rate</div>
                <p className="text-2xl sm:text-3xl font-black text-[#2BB6A8]" suppressHydrationWarning={true}>{recoveryRateValue}%</p>
              </motion.div>
            </section>

            {recommendation && isPro && (
              <section className="p-6 sm:p-8 bg-white border border-[#2BB6A8]/30 rounded-3xl shadow-xs border-l-8 border-l-[#2BB6A8]" suppressHydrationWarning={true}>
                <h2 className="text-[10px] font-black text-[#2BB6A8] uppercase tracking-widest mb-4" suppressHydrationWarning={true}>Today's Recommendation</h2>
                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4" suppressHydrationWarning={true}>
                  <div suppressHydrationWarning={true}>
                    <p className="text-xl sm:text-2xl font-black text-slate-900" suppressHydrationWarning={true}>{recommendation.name}</p>
                    <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>{recommendation.company || recommendation.email} • ₹{recommendation.amount} Outstanding</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { 
                      setRobotAction('recommend'); 
                      handleProRecovery(recommendation); 
                    }} 
                    className="w-full sm:w-auto bg-[#0F172A] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xs hover:opacity-90 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    suppressHydrationWarning={true}
                  >
                    Generate Follow-up
                  </motion.button>
                </div>
              </section>
            )}

            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs" suppressHydrationWarning={true}>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4" suppressHydrationWarning={true}>
                <h3 className="font-black uppercase text-xs tracking-widest text-slate-400" suppressHydrationWarning={true}>Recent Clients</h3>
                <motion.button 
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)} 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer" 
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
                  suppressHydrationWarning={true}
                >
                  <Plus size={16} suppressHydrationWarning={true} /> Add New Client
                </motion.button>
              </div>
              
              <div className="space-y-4" suppressHydrationWarning={true}>
                {clients.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-16 text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200" 
                    suppressHydrationWarning={true}
                  >
                    <p className="text-base font-bold text-slate-700" suppressHydrationWarning={true}>No clients yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium" suppressHydrationWarning={true}>Start by adding your first client to begin tracking payments.</p>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsModalOpen(true)} 
                      className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer" 
                      style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                      suppressHydrationWarning={true}
                    >
                      <Plus size={14} suppressHydrationWarning={true} /> Add Your First Client
                    </motion.button>
                  </motion.div>
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
                      <div key={c.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-[#245B92]/5 hover:border-[#245B92]/30 transition-all duration-150 space-y-4 cursor-pointer" suppressHydrationWarning={true}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" suppressHydrationWarning={true}>
                          <div className="space-y-1" suppressHydrationWarning={true}>
                            <div className="flex items-center gap-3" suppressHydrationWarning={true}>
                              <p className="font-bold text-base text-slate-900" suppressHydrationWarning={true}>{c.name}</p>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${c.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`} suppressHydrationWarning={true}>
                                {c.status || 'Pending'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium" suppressHydrationWarning={true}>{c.company || c.email || 'No company'}</p>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto" suppressHydrationWarning={true}>
                            <button 
                              onClick={() => setExpandedClientId(isExpanded ? null : c.id)} 
                              className="flex-1 sm:flex-none text-xs font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 shadow-xs transition cursor-pointer text-slate-700 flex items-center justify-center gap-1.5"
                              suppressHydrationWarning={true}
                            >
                              <Eye size={14} suppressHydrationWarning={true} /> {isExpanded ? 'Hide Details' : 'View'}
                              <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} suppressHydrationWarning={true} />
                            </button>

                            {c.status === 'Pending' ? (
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateDoc(doc(db, 'clients', c.id), { status: 'Paid' }); }} 
                                className="flex-1 sm:flex-none text-xs font-bold text-white px-4 py-2 rounded-xl shadow-xs hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5" 
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
                              onClick={(e) => { e.stopPropagation(); setClientToDelete(c); }} 
                              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                              title="Delete Client"
                              suppressHydrationWarning={true}
                            >
                              <Trash2 size={16} suppressHydrationWarning={true} />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
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

                              {isPro && (
                                <div className="mt-3 flex justify-end" suppressHydrationWarning={true}>
                                  <button 
                                    onClick={() => { setRobotAction('recommend'); handleProRecovery(c); }} 
                                    className="text-xs font-bold text-[#245B92] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                    suppressHydrationWarning={true}
                                  >
                                    <Sparkles size={14} className="text-[#20B8BE]" suppressHydrationWarning={true} /> Generate AI Reminder
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </motion.div>
        ) : (
          /* SETTINGS TAB VIEW */
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div>
              <h1 className="text-3xl font-black text-slate-900">Account & Settings</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Manage your profile, billing plan, AI preferences, and security settings.</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <User className="text-[#245B92]" size={20} />
                <h3 className="text-lg font-black text-slate-900">Profile</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input type="email" disabled value={user?.email || ''} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-600 cursor-not-allowed" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">User ID</label>
                  <input type="text" disabled value={user?.uid || ''} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-600 cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* BILLING & SUBSCRIPTION SECTION */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Crown className="text-amber-500" size={20} />
                <h3 className="text-lg font-black text-slate-900">Billing & Subscription</h3>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Current Plan</p>
                  <p className="text-xl font-black text-slate-900">{isPro ? 'DueBlink Pro 🚀' : 'Free Plan'}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {isPro ? 'All Pro recovery tools and AI assistant are fully unlocked.' : 'Upgrade to Pro to unlock unlimited AI features.'}
                  </p>
                </div>
                {isPro ? (
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-full">Active Pro</span>
                    <button 
                      onClick={() => setCancelModalOpen(true)} 
                      className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 transition cursor-pointer"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => router.push('/pricing')} 
                    className="px-6 py-3 bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white rounded-xl font-bold text-xs shadow-xs hover:opacity-95 transition cursor-pointer"
                  >
                    Upgrade to Pro ✨
                  </button>
                )}
              </div>
              
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-semibold text-slate-500 px-2 gap-2">
                <span>Manage Billing: You can cancel anytime before your renewal date.</span>
                <button onClick={() => router.push('/pricing')} className="text-[#245B92] font-bold hover:underline cursor-pointer">
                  View Pricing & Plans →
                </button>
              </div>
            </div>

            {/* AI Preferences Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Sparkles className="text-[#245B92]" size={20} />
                <h3 className="text-lg font-black text-slate-900">AI Preferences</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">AI Reminder Tone</label>
                  <select 
                    value={aiTone} 
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#245B92]"
                  >
                    <option value="Professional">Professional & Polite</option>
                    <option value="Firm">Firm & Direct</option>
                    <option value="Friendly">Friendly & Casual</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Bell className="text-[#245B92]" size={20} />
                <h3 className="text-lg font-black text-slate-900">Notifications</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Email Notifications</p>
                    <p className="text-xs text-slate-500">Receive summaries and updates via email</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={emailNotifs} 
                    onChange={() => setEmailNotifs(!emailNotifs)}
                    className="w-5 h-5 accent-[#245B92] cursor-pointer" 
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Payment Reminders</p>
                    <p className="text-xs text-slate-500">Get alerted when client invoices become overdue</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={reminderNotifs} 
                    onChange={() => setReminderNotifs(!reminderNotifs)}
                    className="w-5 h-5 accent-[#245B92] cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Shield className="text-[#245B92]" size={20} />
                <h3 className="text-lg font-black text-slate-900">Security & Password</h3>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">Password Reset</p>
                  <p className="text-xs text-slate-500">Send a password reset secure link to your registered email.</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      if (user?.email) {
                        await sendPasswordResetEmail(auth, user.email);
                        alert("Password reset email sent successfully!");
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Failed to send password reset email.");
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Send Reset Email
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <HelpCircle className="text-[#245B92]" size={20} />
                <h3 className="text-lg font-black text-slate-900">Help & Support</h3>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-bold">
                <a href="mailto:support@dueblink.com" className="px-5 py-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition">Contact Support</a>
                <a href="/pricing" className="px-5 py-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition">FAQ & Pricing</a>
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </motion.div>
  );
}