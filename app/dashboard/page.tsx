'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Loader2, X, User, Building, Mail, Phone, IndianRupee, Calendar, FileText, CheckCircle2, Layers, TrendingUp, Users, Trash2, AlertTriangle, Eye, ChevronDown, Menu, Crown, Bell, Shield, HelpCircle, Search, ArrowUpDown, Edit3, Check } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import FloatingRobot from '@/components/FloatingRobot';
import SeasonalBanner from '@/components/SeasonalBanner';
import AddClientModal from '@/components/AddClientModal';
import { useCompletion } from 'ai/react';

function CustomSelectDropdown({ 
  value, 
  options, 
  onChange, 
  icon: Icon 
}: { 
  value: string; 
  options: { label: string; value: string }[]; 
  onChange: (val: string) => void;
  icon?: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-[#245B92] transition flex items-center justify-between gap-3 cursor-pointer shadow-3xs"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 py-1.5"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-xs font-bold text-left flex items-center justify-between transition cursor-pointer ${
                    isSelected 
                      ? 'bg-[#245B92]/10 text-[#245B92]' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-[#245B92] shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
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
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Overdue' | 'Paid'>('All');
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'name'>('dueDate');

  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const [aiTone, setAiTone] = useState('Professional');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [reminderNotifs, setReminderNotifs] = useState(true);

  const [robotAction, setRobotAction] = useState<string | null>(null);

 const { completion, complete, isLoading: isStreaming } = useCompletion({
  api: '/api/pro-recovery-assistant',

  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    const idToken = await auth.currentUser?.getIdToken();

    if (!idToken) {
      throw new Error('Authentication required');
    }

    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${idToken}`);

    return fetch(input, {
      ...init,
      headers,
    });
  },
});


  useEffect(() => {
    if (clients && clients.length >= 0) {
      localStorage.setItem('dueblink_clients', JSON.stringify(clients));
      window.dispatchEvent(new Event('clients-updated'));
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
    return onSnapshot(q, (snapshot) => {
      const fetchedClients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(fetchedClients);
      localStorage.setItem('dueblink_clients', JSON.stringify(fetchedClients));
      window.dispatchEvent(new Event('clients-updated'));
    });
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
      window.dispatchEvent(new Event('clients-updated'));
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client.");
    }
  };

  const totalOutstanding = clients.filter(c => c.status === 'Pending').reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const pendingCount = clients.filter(c => c.status === 'Pending').length;
  const paidCount = clients.filter(c => c.status === 'Paid').length;
  const totalRecovered = clients.filter(c => c.status === 'Paid').reduce((acc, c) => acc + Number(c.amount || 0), 0);
  
  const totalClientsCount = clients.length;
  const recoveryRateValue = totalClientsCount > 0 ? Math.round((paidCount / totalClientsCount) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) {
      const parts = user.email.split('@')[0].split(/[-_\.]/);
      return parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return "Juned";
  };

  const handleAssistantAction = async (action: string) => {
    if (!isPro) {
      setUpgradeModalOpen(true);
      return;
    }

    await complete(
      JSON.stringify({
        action,
        clients,
        history: clients.flatMap(
          (client: any) => client.reminderHistory || []
        ),
      })
    );
  };

  const handleProRecovery = async (client: any) => {
    if (!isPro) {
      setUpgradeModalOpen(true);
      return;
    }
    await complete(JSON.stringify({ client, history: client.reminderHistory || [] }));
  };

  const handleSummarizeOutstanding = async () => {
    if (!isPro) {
      setUpgradeModalOpen(true);
      return;
    }
    setRobotAction('summarize');
    await complete(JSON.stringify({ 
      action: "summarize_outstanding", 
      clients: clients, 
      total: totalOutstanding,
      recovered: totalRecovered
    }));
  };

  const recommendation = clients.filter(c => c.status === 'Pending').sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0)).pop();

  const filteredAndSortedClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (statusFilter === 'All') return true;
    
    let isOverdue = false;
    if (c.status === 'Pending' && c.dueDate) {
      const due = new Date(c.dueDate);
      const today = new Date();
      isOverdue = today > due;
    }

    if (statusFilter === 'Paid') return c.status === 'Paid';
    if (statusFilter === 'Pending') return c.status === 'Pending' && !isOverdue;
    if (statusFilter === 'Overdue') return c.status === 'Pending' && isOverdue;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'dueDate') {
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
    }
    if (sortBy === 'amount') {
      return Number(b.amount || 0) - Number(a.amount || 0);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white" suppressHydrationWarning={true}><Loader2 className="w-8 h-8 animate-spin text-[#1C2E8F]" /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-white text-[#0F172A] antialiased selection:bg-[#20B8BE]/25 transition-colors duration-150" 
      suppressHydrationWarning={true}
    >
      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setClientToEdit(null); 
        }} 
        user={user}
        isPro={isPro}
        clientToEdit={clientToEdit}
      />
      
      <AnimatePresence>
        {upgradeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" suppressHydrationWarning={true}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 relative text-slate-900"
              suppressHydrationWarning={true}
            >
              <motion.button 
                whileHover={{ rotate: 90, scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                onClick={() => setUpgradeModalOpen(false)} 
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full bg-slate-50 transition-colors"
              >
                <X size={20} />
              </motion.button>

              <div className="w-16 h-16 bg-blue-50 text-[#245B92] rounded-2xl flex items-center justify-center mx-auto shadow-inner" suppressHydrationWarning={true}>
                <Sparkles size={32} />
              </div>

              <div className="space-y-2" suppressHydrationWarning={true}>
                <h3 className="text-xl font-black text-slate-900" suppressHydrationWarning={true}>Upgrade to DueBlink Pro</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed" suppressHydrationWarning={true}>
                  Upgrade to DueBlink Pro to unlock the <span className="font-bold text-slate-700">Pro Recovery Assistant</span> and accelerate your cash collection.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2" suppressHydrationWarning={true}>
                <motion.button 
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUpgradeModalOpen(false)} 
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-3xs"
                  suppressHydrationWarning={true}
                >
                  Maybe Later
                </motion.button>
                <motion.button 
                  whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(36,91,146,0.25)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setUpgradeModalOpen(false);
                    router.push('/pricing');
                  }} 
                  className="flex-1 py-3.5 rounded-xl text-white font-bold text-xs shadow-md transition-shadow cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                  suppressHydrationWarning={true}
                >
                  Upgrade Now 🚀
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" suppressHydrationWarning={true}>
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
                <motion.button 
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCancelModalOpen(false)} 
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-3xs"
                  suppressHydrationWarning={true}
                >
                  Keep Pro Plan ✨
                </motion.button>
                <motion.button 
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCancelSubscription} 
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  suppressHydrationWarning={true}
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : 'Yes, Cancel Plan'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {clientToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" suppressHydrationWarning={true}>
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
                <motion.button 
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setClientToDelete(null)} 
                  className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  suppressHydrationWarning={true}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={confirmDeleteClient} 
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                  suppressHydrationWarning={true}
                >
                  Yes, Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <FloatingRobot 
        clients={clients}
        isPro={isPro}
        externalAction={robotAction}
        onTrigger={(action) => {
          if (!isPro) {
            setUpgradeModalOpen(true);
            return;
          }
          handleAssistantAction(action);
        }} 
        recommendation={recommendation ? { name: recommendation.name, amount: recommendation.amount, daysOverdue: 0 } : null} 
        onOpenAddClient={() => { setClientToEdit(null); setIsModalOpen(true); }}
      />

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

          <div className="hidden md:flex items-center gap-8" suppressHydrationWarning={true}>
            <div className="flex items-center gap-6 text-sm font-bold text-slate-600" suppressHydrationWarning={true}>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8" suppressHydrationWarning={true}>
        
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
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer">
                <X size={16} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'overview' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 sm:space-y-8"
          >
            <SeasonalBanner />

            {isPro ? (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl p-6 text-white flex flex-col sm:flex-row justify-between items-center shadow-lg gap-4" suppressHydrationWarning={true}>
                <div className="space-y-1 text-center sm:text-left flex items-center gap-3" suppressHydrationWarning={true}>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Crown size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight" suppressHydrationWarning={true}>You're on the Pro Plan ✨</h2>
                    <p className="text-xs text-white/90 font-medium" suppressHydrationWarning={true}>Enjoy unlimited clients, advanced insights, and premium payment management features.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs backdrop-blur-md">
                    Active Pro Plan
                  </span>
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setCancelModalOpen(true)}
                    className="bg-white/10 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-bold text-xs backdrop-blur-md transition-colors cursor-pointer"
                  >
                    Cancel Plan
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-3xl p-6 text-white flex flex-col sm:flex-row justify-between items-center shadow-lg gap-4" suppressHydrationWarning={true}>
                <div className="space-y-1 text-center sm:text-left" suppressHydrationWarning={true}>
                  <h2 className="text-lg font-black tracking-tight" suppressHydrationWarning={true}>Unlock Pro Recovery Assistant</h2>
                  <p className="text-xs text-white/90 font-medium" suppressHydrationWarning={true}>Automate follow-ups, analyze payment trends, and recover money faster.</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setUpgradeModalOpen(true)}
                  className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-xs shadow-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                  suppressHydrationWarning={true}
                >
                  Upgrade to Pro 🚀
                </motion.button>
              </div>
            )}

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" suppressHydrationWarning={true}>
              <div className="space-y-1.5" suppressHydrationWarning={true}>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900" suppressHydrationWarning={true}>
                  {getGreeting()}, {getUserDisplayName()} 👋
                </h1>
                <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>
                  Here's what needs your attention today.
                </p>
                
                <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-bold text-slate-600" suppressHydrationWarning={true}>
                  <span suppressHydrationWarning={true}>Paid: <strong className="text-slate-900 font-black" suppressHydrationWarning={true}>{paidCount}</strong></span>
                  <span suppressHydrationWarning={true}>Pending: <strong className="text-slate-900 font-black" suppressHydrationWarning={true}>{pendingCount}</strong></span>
                  <span suppressHydrationWarning={true}>Total Recovered: <strong className="text-emerald-600 font-black" suppressHydrationWarning={true}>₹{totalRecovered.toLocaleString()}</strong></span>
                </div>
              </div>

              <motion.button 
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isPro) {
                    setUpgradeModalOpen(true);
                    return;
                  }
                  handleSummarizeOutstanding();
                }} 
                disabled={isStreaming && isPro} 
                className="text-xs font-bold text-white bg-[#0F172A] px-5 py-3 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                suppressHydrationWarning={true}
              >
                {isStreaming && isPro ? <Loader2 className="animate-spin" size={14} suppressHydrationWarning={true} /> : null}
                {isStreaming && isPro ? 'Summarizing...' : 'View Recovery Summary'}
              </motion.button>
            </header>

            {/* Mobile Quick Add Client */}
            <div className="sm:hidden">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setClientToEdit(null);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 text-white px-5 py-4 rounded-2xl text-sm font-bold shadow-md transition"
                style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
              >
                <Plus size={18} />
                Add Client
              </motion.button>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" suppressHydrationWarning={true}>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} whileHover={{ y: -2 }} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs border-t-4 border-t-[#245B92]" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><Layers size={14} suppressHydrationWarning={true}/> Total Outstanding</div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mb-1" suppressHydrationWarning={true}>₹{totalOutstanding.toLocaleString()}</p>
                <p className="text-xs font-medium text-slate-500">Outstanding across {pendingCount} {pendingCount === 1 ? 'invoice' : 'invoices'}.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} whileHover={{ y: -2 }} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs border-t-4 border-t-[#20B8BE]" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><Users size={14} suppressHydrationWarning={true}/> Pending Clients</div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mb-1" suppressHydrationWarning={true}>{pendingCount} {pendingCount === 1 ? 'Client' : 'Clients'}</p>
                <p className="text-xs font-medium text-slate-500">{pendingCount} require attention today.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} whileHover={{ y: -2 }} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs border-t-4 border-t-[#2BB6A8]" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><TrendingUp size={14} suppressHydrationWarning={true}/> Recovery Rate</div>
                <p className="text-2xl sm:text-3xl font-black text-[#2BB6A8] mb-1" suppressHydrationWarning={true}>{recoveryRateValue}%</p>
                <p className="text-xs font-medium text-slate-500">
                  {recoveryRateValue === 0
                    ? 'No payments recovered yet.'
                    : recoveryRateValue < 50
                      ? 'Room to improve your recovery.'
                      : recoveryRateValue < 80
                        ? 'Good recovery performance.'
                        : 'Strong recovery performance.'}
                </p>
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

            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6" suppressHydrationWarning={true}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" suppressHydrationWarning={true}>
                <h3 className="font-black uppercase text-xs tracking-widest text-slate-400" suppressHydrationWarning={true}>Client Management</h3>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search clients..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#245B92] transition text-slate-900"
                    />
                  </div>

                  <CustomSelectDropdown
                    value={sortBy}
                    onChange={(val) => setSortBy(val as any)}
                    icon={ArrowUpDown}
                    options={[
                      { label: 'Sort by: Due Date', value: 'dueDate' },
                      { label: 'Sort by: Amount', value: 'amount' },
                      { label: 'Sort by: Name', value: 'name' }
                    ]}
                  />

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setClientToEdit(null); setIsModalOpen(true); }} 
                    className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer" 
                    style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
                    suppressHydrationWarning={true}
                  >
                    <Plus size={16} suppressHydrationWarning={true} /> Add Client
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 text-xs font-bold">
                {(['All', 'Pending', 'Overdue', 'Paid'] as const).map((tab) => {
                  const count = clients.filter(c => {
                    if (tab === 'All') return true;
                    let isOverdue = false;
                    if (c.status === 'Pending' && c.dueDate) {
                      const due = new Date(c.dueDate);
                      const today = new Date();
                      isOverdue = today > due;
                    }
                    if (tab === 'Paid') return c.status === 'Paid';
                    if (tab === 'Pending') return c.status === 'Pending' && !isOverdue;
                    if (tab === 'Overdue') return c.status === 'Pending' && isOverdue;
                    return false;
                  }).length;

                  return (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        statusFilter === tab 
                          ? 'bg-[#0F172A] text-white shadow-xs' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tab}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              <div className="space-y-4" suppressHydrationWarning={true}>
                <AnimatePresence mode="popLayout">
                {filteredAndSortedClients.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-16 text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 sm:p-12" 
                    suppressHydrationWarning={true}
                  >
                    <div className="w-16 h-16 bg-teal-50 text-[#20B8BE] rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Sparkles size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-black text-slate-900" suppressHydrationWarning={true}>No clients found.</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto font-medium leading-relaxed" suppressHydrationWarning={true}>
                        {clients.length === 0 ? "Add your first client to start tracking invoices, monitor payments, and unlock your dashboard insights." : "No clients match your search or filter criteria."}
                      </p>
                    </div>
                    {clients.length === 0 && (
                      <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setClientToEdit(null); setIsModalOpen(true); }} 
                        className="inline-flex items-center gap-2 text-white px-8 py-3.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer" 
                        style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                        suppressHydrationWarning={true}
                      >
                        <Plus size={14} suppressHydrationWarning={true} /> Add Your First Client
                      </motion.button>
                    )}
                  </motion.div>
                ) : (
                  filteredAndSortedClients.map((c) => {
                    let daysOverdue = 0;
                    let isOverdue = false;
                    if (c.dueDate) {
                      const due = new Date(c.dueDate);
                      const today = new Date();
                      const diffTime = today.getTime() - due.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays > 0) {
                        daysOverdue = diffDays;
                        isOverdue = c.status === 'Pending';
                      }
                    }

                    const isExpanded = expandedClientId === c.id;

                    return (
                      <motion.div 
                        key={c.id} 
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-[#245B92]/5 hover:border-[#245B92]/30 transition-colors duration-150 space-y-4 cursor-pointer" suppressHydrationWarning={true}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" suppressHydrationWarning={true}>
                          <div className="space-y-1" suppressHydrationWarning={true}>
                            <div className="flex items-center gap-3 flex-wrap" suppressHydrationWarning={true}>
                              <p className="font-bold text-base text-slate-900" suppressHydrationWarning={true}>{c.name}</p>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                c.status === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : isOverdue 
                                    ? 'bg-rose-50 text-rose-600' 
                                    : 'bg-amber-50 text-amber-600'
                              }`} suppressHydrationWarning={true}>
                                {c.status === 'Paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                              </span>

                              {c.automatedReminders === true && c.status !== 'Paid' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F8F8] text-[#159A9F]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#20B8BE]" />
                                  Auto Reminder ON
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium" suppressHydrationWarning={true}>{c.company || c.email || 'No company'}</p>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto" suppressHydrationWarning={true}>
                            <motion.button 
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => setExpandedClientId(isExpanded ? null : c.id)} 
                              className="flex-1 sm:flex-none text-xs font-bold bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 shadow-xs transition-colors cursor-pointer text-slate-700 flex items-center justify-center gap-1.5"
                              suppressHydrationWarning={true}
                            >
                              <Eye size={14} suppressHydrationWarning={true} /> {isExpanded ? 'Hide Details' : 'View'}
                              <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} suppressHydrationWarning={true} />
                            </motion.button>

                            {c.status === 'Pending' ? (
                              <motion.button 
                                whileHover={{ y: -1, boxShadow: '0 4px 10px rgba(36,91,146,0.25)' }}
                                whileTap={{ scale: 0.96 }}
                                onClick={async (e) => { 
                                  e.stopPropagation(); 
                                  await updateDoc(doc(db, 'clients', c.id), { status: 'Paid' }); 
                                  window.dispatchEvent(new Event('clients-updated'));
                                }} 
                                className="flex-1 sm:flex-none text-xs font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition-shadow cursor-pointer flex items-center justify-center gap-1.5" 
                                style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                                suppressHydrationWarning={true}
                              >
                                <CheckCircle2 size={14} suppressHydrationWarning={true} /> Mark Paid
                              </motion.button>
                            ) : (
                              <span className="text-[11px] font-bold text-[#2BB6A8] bg-[#2BB6A8]/10 px-4 py-2.5 rounded-xl flex items-center gap-2" suppressHydrationWarning={true}>
                                <CheckCircle2 size={14} suppressHydrationWarning={true} /> Paid
                              </span>
                            )}
                            
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); setClientToEdit(c); setIsModalOpen(true); }} 
                              className="p-2.5 rounded-xl text-slate-400 hover:text-[#245B92] hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Client"
                              suppressHydrationWarning={true}
                            >
                              <Edit3 size={16} suppressHydrationWarning={true} />
                            </motion.button>

                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); setClientToDelete(c); }} 
                              className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Client"
                              suppressHydrationWarning={true}
                            >
                              <Trash2 size={16} suppressHydrationWarning={true} />
                            </motion.button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden pt-3 border-t border-slate-200/60 space-y-3"
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
                                  Status: <strong className={c.status === 'Paid' ? 'text-emerald-600' : isOverdue ? 'text-rose-600' : 'text-amber-600'} suppressHydrationWarning={true}>{c.status === 'Paid' ? 'Paid' : isOverdue ? `Overdue by ${daysOverdue} days` : 'Pending'}</strong>
                                </span>
                                {c.invoiceNumber && (
                                  <span suppressHydrationWarning={true}>
                                    Invoice: <strong className="text-slate-900 ml-1">{c.invoiceNumber}</strong>
                                  </span>
                                )}
                                {c.paymentLink && (
                                  <span suppressHydrationWarning={true}>
                                    Payment Link: <a href={c.paymentLink} target="_blank" rel="noopener noreferrer" className="text-[#245B92] underline ml-1">{c.paymentLink}</a>
                                  </span>
                                )}
                              </div>

                              {/* Reminder History */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs" suppressHydrationWarning={true}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-black text-slate-900">
                                    Reminder History
                                  </h4>
                                </div>

                                {Array.isArray(c.reminderHistory) && c.reminderHistory.length > 0 ? (
                                  <div className="space-y-3">
                                    {c.reminderHistory.map((reminder: any, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                                        suppressHydrationWarning={true}
                                      >
                                        <div className="mt-0.5 flex-shrink-0">
                                          <span className="text-base">
                                            {reminder.type === 'email' ? '' : ''}
                                          </span>
                                        </div>

                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-slate-900">
                                            {reminder.label || reminder.title || 'Reminder sent'}
                                          </p>

                                          <p className="text-[11px] text-slate-500 mt-0.5">
                                            {reminder.sentAt
                                              ? `Sent: ${new Date(
                                                  reminder.sentAt?.toDate
                                                    ? reminder.sentAt.toDate()
                                                    : reminder.sentAt
                                                ).toLocaleString('en-IN', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                })}`
                                              : 'Sent'}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs font-medium text-slate-500 py-2">
                                    No reminders sent yet.
                                  </p>
                                )}
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
                      </motion.div>
                    );
                  })
                )}
                </AnimatePresence>
              </div>
            </section>
          </motion.div>
        ) : (
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
                    <motion.button 
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setCancelModalOpen(true)} 
                      className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Cancel Subscription
                    </motion.button>
                  </div>
                ) : (
                  <motion.button 
                    whileHover={{ y: -1, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/pricing')} 
                    className="px-6 py-3 bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white rounded-xl font-bold text-xs shadow-xs transition-shadow cursor-pointer"
                  >
                    Upgrade to Pro ✨
                  </motion.button>
                )}
              </div>
              
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-semibold text-slate-500 px-2 gap-2">
                <span>Manage Billing: You can cancel anytime before your renewal date.</span>
                <button onClick={() => router.push('/pricing')} className="text-[#245B92] font-bold hover:underline cursor-pointer">
                  View Pricing & Plans →
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Sparkles className="text-[#245B92]" size={20} />
                <h3 className="text-lg font-black text-slate-900">AI Preferences</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">AI Reminder Tone</label>
                  <CustomSelectDropdown
                    value={aiTone}
                    onChange={(val) => setAiTone(val)}
                    icon={Sparkles}
                    options={[
                      { label: 'Professional & Polite', value: 'Professional' },
                      { label: 'Firm & Direct', value: 'Firm' },
                      { label: 'Friendly & Casual', value: 'Friendly' }
                    ]}
                  />
                </div>
              </div>
            </div>

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

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Shield className="text-[#245B92]" size={20} />
                <h3 className="text-lg font-black text-slate-900">Security & Password</h3>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Password Reset</p>
                <p className="text-xs text-slate-500 mb-4">Send a password reset secure link to your registered email.</p>
                
                <button 
                  onClick={async () => {
                    try {
                      if (!user?.email) {
                        alert("No registered email address found.");
                        return;
                      }

                      const response = await fetch("/api/auth/password-reset", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          email: user.email,
                        }),
                      });

                      const data = await response.json();

                      if (!response.ok || !data.success) {
                        throw new Error(
                          data?.error || "Failed to send password reset email."
                        );
                      }

                      setSuccessMessage(
                        "Password reset email sent! Check your inbox for the reset link."
                      );

                      setTimeout(() => {
                        setSuccessMessage(null);
                      }, 4000);
                    } catch (err) {
                      console.error("Password reset error:", err);
                      alert("Failed to send password reset email. Please try again.");
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Send Reset Email
                </button>

                {successMessage && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-bold text-emerald-700">
                          Password reset email sent!
                        </p>

                        <p className="mt-0.5 text-xs text-emerald-600">
                          Check your inbox for the reset link.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <HelpCircle className="text-[#245B92]" size={20} />
                <h3 className="text-lg font-black text-slate-900">Help & Support</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                <a href="/contact" className="px-5 py-4 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center justify-between">
                  <span>Contact Support</span>
                  <span className="#245B92">→</span>
                </a>
                <a href="/#faq" className="px-5 py-4 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center justify-between">
                  <span>FAQ</span>
                  <span className="#245B92">→</span>
                </a>
                <a href="/pricing" className="px-5 py-4 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center justify-between">
                  <span>Pricing & Plans</span>
                  <span className="#245B92">→</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </motion.div>
  );
}