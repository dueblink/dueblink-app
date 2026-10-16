'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Loader2, X, User, Building, Mail, Phone, IndianRupee, Calendar, FileText, CheckCircle2, Layers, TrendingUp, Users, Trash2, AlertTriangle, Eye, ChevronDown, Menu, Crown, Bell, Shield, HelpCircle, Search, ArrowUpDown, Edit3, Check, MessageCircle, MessageSquare, Gavel, PhoneCall, Ban, Undo2 } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { addDoc, collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { formatAmountWithCurrency, normalizeLanguage, finalReminderNote, msmeApplies, isIndianCurrency, formatTotalsByCurrency, guessDefaultCurrency, getCurrencySymbol } from '@/lib/reminderRules';
import { auth, db } from '@/lib/firebase';
import { track, trackOnce } from '@/lib/track';
import FloatingRobot from '@/components/FloatingRobot';
import SeasonalBanner from '@/components/SeasonalBanner';
import AddClientModal from '@/components/AddClientModal';

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
  // True the moment someone has ever paid for Pro, and never cleared — lets
  // the UI tell an expired/cancelled subscriber apart from a brand-new
  // visitor, so they see "Renew" instead of being sold Pro from scratch.
  const [wasPro, setWasPro] = useState(false);
  // The actual date Pro is active until (if currently Pro) or ended on (if
  // lapsed) — kept so Billing & Subscription can show a real date instead
  // of just a plan name.
  const [proExpiresAt, setProExpiresAt] = useState<Date | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | null>(null);
  const [clients, setClients] = useState<any[]>([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Overdue' | 'Paid'>('All');

  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const [aiTone, setAiTone] = useState('Professional');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [reminderNotifs, setReminderNotifs] = useState(true);

  const [robotAction, setRobotAction] = useState<string | null>(null);
  const [robotActionClientId, setRobotActionClientId] = useState<string | null>(null);
  // Goes up on every button press, so the same button works twice in a row.
  const [robotActionNonce, setRobotActionNonce] = useState(0);

  // First-invoice form shown to new users with no clients yet.
  const [firstName, setFirstName] = useState('');
  const [firstAmount, setFirstAmount] = useState('');
  const [firstDueDate, setFirstDueDate] = useState('');
  const [firstSaving, setFirstSaving] = useState(false);
  const [firstError, setFirstError] = useState('');
  // Currency for the first invoice: rupees in India, local currency elsewhere
  // (set after load, so server and browser match). Can be changed in Edit.
  const [firstCurrency, setFirstCurrency] = useState('INR');
  useEffect(() => { setFirstCurrency(guessDefaultCurrency()); }, []);
  const [isRobotProcessing, setIsRobotProcessing] = useState(false);


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
        setWasPro(true);
        setRobotAction('welcome_pro');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [clients]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);

        // Google Analytics: a brand-new account (created in the last
        // 30 minutes) reaching the dashboard counts as one sign-up.
        const createdAt = Date.parse(currentUser.metadata?.creationTime || '');
        if (Number.isFinite(createdAt) && Date.now() - createdAt < 30 * 60 * 1000) {
          trackOnce(`signup_${currentUser.uid}`, 'sign_up', {
            method: currentUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
          });
        }
        
        if (localStorage.getItem('dueblink_pro_active') === 'true') {
          setIsPro(true);
        }
        // Same idea for wasPro: without this, it defaults to false on every
        // load and only becomes true once the Firestore read below finishes.
        // That gap is what caused "Renew" to flash as "Upgrade to Pro" on
        // slower connections.
        if (localStorage.getItem('dueblink_was_pro') === 'true') {
          setWasPro(true);
        }

        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            if (data.billingCycle) setBillingCycle(data.billingCycle);

            // isPro, expiresAt, plan, billingCycle and upgradedAt are all
            // server-controlled fields per Firestore rules — the client is
            // never allowed to write them, on purpose (otherwise anyone
            // could just set themselves to Pro for free). So an expired
            // subscription is only ever detected here for DISPLAY purposes;
            // the database's isPro field itself must be flipped server-side.
            const rawExpiresAt = data.proExpiresAt ? data.proExpiresAt.toDate() : null;
            const isExpired = !!(data.isPro && rawExpiresAt && new Date() > rawExpiresAt);
            const effectivelyPro = !!data.isPro && !isExpired;

            setIsPro(effectivelyPro);
            setProExpiresAt(rawExpiresAt);

            // wasPro is NOT one of the blocked fields, so it's safe to write
            // on its own — just never bundled into the same call as isPro.
            const reallyWasPro = effectivelyPro || isExpired || !!data.wasPro || !!data.cancelledAt;
            setWasPro(reallyWasPro);
            if (reallyWasPro && !data.wasPro) {
              updateDoc(userDocRef, { wasPro: true }).catch(() => {});
            }

            // isPro itself can only be corrected server-side (see
            // check-pro-status route) — the client can detect and display
            // the lapse instantly above, but this is what actually fixes
            // the stored value for next time. Fire-and-forget: the UI
            // already reflects the correct state from isExpired, this
            // call doesn't need to block anything.
            if (isExpired) {
              currentUser.getIdToken().then((idToken: string) => {
                fetch('/api/check-pro-status', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                  },
                }).catch(() => {});
              }).catch(() => {});
            }

            if (effectivelyPro) {
              localStorage.setItem('dueblink_pro_active', 'true');
            } else {
              localStorage.removeItem('dueblink_pro_active');
            }
            if (reallyWasPro) {
              localStorage.setItem('dueblink_was_pro', 'true');
            } else {
              localStorage.removeItem('dueblink_was_pro');
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
      localStorage.removeItem('dueblink_was_pro');
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) {
      setErrorMessage("No active user found. Please log in again.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    
    try {
      setLoading(true);

      // isPro can only be changed server-side (see the real Firestore
      // rules) — the client used to try to write this directly, which
      // Firestore always rejected. This now goes through an API route
      // that does the same update via the Admin SDK instead.
      const idToken = await user.getIdToken();

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Failed to cancel subscription.');
      }

      localStorage.removeItem('dueblink_pro_active');
      
      setIsPro(false);
      setWasPro(true);
      setProExpiresAt(new Date());
      setLoading(false);
      setCancelModalOpen(false);
      
      setSuccessMessage("Your Pro subscription has been successfully cancelled.");
      setTimeout(() => setSuccessMessage(null), 4000);

      router.refresh();
      
    } catch (error: any) {
      console.error("Detailed Cancellation Error:", error);
      setErrorMessage(`Failed to cancel subscription: ${error.message || "Please try again."}`);
      setTimeout(() => setErrorMessage(null), 4000);
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
      setErrorMessage("Failed to delete client. Please try again.");
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const totalOutstanding = clients.filter(c => c.status === 'Pending').reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const pendingCount = clients.filter(c => c.status === 'Pending').length;
  const paidCount = clients.filter(c => c.status === 'Paid').length;
  const totalRecovered = clients.filter(c => c.status === 'Paid').reduce((acc, c) => acc + Number(c.amount || 0), 0);

  // Recovered this month = clients marked paid this calendar month (India
  // time). Uses the paid date saved by "Mark paid"; older paid clients have
  // no date, so they count only in the all-time total.
  const thisMonthKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit',
  }).format(new Date());
  const paidThisMonth = clients.filter((c) => {
    if (c.status !== 'Paid' || !c.paidAt) return false;
    const paidDate = new Date(c.paidAt);
    if (isNaN(paidDate.getTime())) return false;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit',
    }).format(paidDate) === thisMonthKey;
  });
  const recoveredThisMonth = paidThisMonth.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  
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

  const handleSummarizeOutstanding = () => {
    if (!isPro) {
      setUpgradeModalOpen(true);
      return;
    }
    setRobotAction('summarize');
    setRobotActionNonce((n) => n + 1);
  };

  const recommendation = clients.filter(c => c.status === 'Pending').sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0)).pop();

  // Whole calendar days late, counted in India time — the same way Blink
  // and the automatic reminders count. Due today = 0 (not overdue yet);
  // due yesterday = 1. (Before, a client due today showed "1 day overdue".)
  const getDaysOverdue = (dueDate: any): number => {
    if (!dueDate) return 0;

    const dueText = String(dueDate).substring(0, 10);
    const [y, m, d] = dueText.split('-').map(Number);
    if (!y || !m || !d) return 0;

    const todayText = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const [ty, tm, td] = todayText.split('-').map(Number);

    const diffDays = Math.round(
      (Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / (1000 * 60 * 60 * 24)
    );

    return diffDays > 0 ? diffDays : 0;
  };

  const getRecommendationDaysOverdue = (c: any): number =>
    getDaysOverdue(c?.dueDate);

  // Overdue = unpaid and past its due date (India time).
  const overdueClients = clients.filter(
    (c) => c.status === 'Pending' && getDaysOverdue(c.dueDate) > 0
  );
  const overdueCount = overdueClients.length;
  const totalOverdue = overdueClients.reduce((acc, c) => acc + Number(c.amount || 0), 0);

  // ============================================================
  // TODAY LIST — who to chase today, and how.
  // Unpaid, due today or overdue, and no reminder in the last 2 days.
  // Stage uses the same reminder count as Blink's escalation ladder.
  // ============================================================
  const getLastReminderDaysAgo = (c: any): number | null => {
    const history = Array.isArray(c.reminderHistory) ? c.reminderHistory : [];
    let latest = 0;
    for (const r of history) {
      const raw = r?.sentAt;
      const time =
        raw && typeof raw.toDate === 'function'
          ? raw.toDate().getTime()
          : raw
            ? new Date(raw).getTime()
            : NaN;
      if (Number.isFinite(time) && time > latest) latest = time;
    }
    if (!latest) return null;
    return Math.floor((Date.now() - latest) / (1000 * 60 * 60 * 24));
  };

  const getTodayStage = (c: any, daysOverdue: number) => {
    const sent = Array.isArray(c.reminderHistory) ? c.reminderHistory.length : 0;
    if (sent >= 3 || (sent === 2 && daysOverdue >= 21)) {
      return { label: 'Stalled', advice: 'Reminders are not working. Call them or offer to split the payment.' };
    }
    if (sent === 2) {
      return { label: 'Final reminder', advice: 'Two reminders ignored. Send a firm final reminder.' };
    }
    if (sent === 1) {
      return { label: 'Follow-up', advice: 'One reminder sent. Follow up on a different channel and ask for a date.' };
    }
    return {
      label: 'First reminder',
      advice: daysOverdue === 0 ? 'Due today. Send a friendly reminder.' : 'No reminder sent yet. Send a friendly one today.',
    };
  };

  // When the daily reminder job will next email this client, using the
  // same rules as the job: first on the due date, follow-up from day 3,
  // final from day 7; each stage once; at least 2 days apart.
  const STAGE_ORDER: Record<string, number> = { first: 1, 'follow-up': 2, final: 3 };
  const STAGE_NAMES: Record<string, string> = { first: 'first reminder', 'follow-up': 'follow-up', final: 'final reminder' };

  const getNextAutoReminder = (c: any): string => {
    if (c.status !== 'Pending') return '';
    if (!(c.automatedReminders === true && c.automationStatus === 'active')) return 'Automatic reminders off';
    if (!c.email) {
      return c.whatsapp || c.phone
        ? 'No email: send reminders from the Today list in one tap'
        : 'Automatic reminders need an email';
    }

    const last = String(c.lastAutomatedReminderStage || '');
    if (last === 'final') return 'All automatic reminders sent';

    const [dy, dm, dd] = String(c.dueDate || '').substring(0, 10).split('-').map(Number);
    if (!dy || !dm || !dd) return '';
    const dueUtc = Date.UTC(dy, dm - 1, dd);
    const DAY = 1000 * 60 * 60 * 24;

    const todayText = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const [ty, tm, td] = todayText.split('-').map(Number);
    const todayUtc = Date.UTC(ty, tm - 1, td);

    const lastSentRaw = c.lastAutomatedReminderSentAt;
    const lastSent =
      lastSentRaw && typeof lastSentRaw.toDate === 'function'
        ? lastSentRaw.toDate()
        : lastSentRaw ? new Date(lastSentRaw) : null;
    let lastSentUtc: number | null = null;
    if (lastSent && !isNaN(lastSent.getTime())) {
      const t = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(lastSent).split('-').map(Number);
      lastSentUtc = Date.UTC(t[0], t[1] - 1, t[2]);
    }

    for (let i = 0; i <= 14; i++) {
      const dayUtc = todayUtc + i * DAY;
      const daysLate = Math.round((dayUtc - dueUtc) / DAY);
      const stage = daysLate >= 7 ? 'final' : daysLate >= 3 ? 'follow-up' : daysLate >= 0 ? 'first' : '';
      if (!stage || STAGE_ORDER[stage] <= (STAGE_ORDER[last] || 0)) continue;
      if (lastSentUtc !== null && (dayUtc - lastSentUtc) / DAY < 2) continue;

      const when =
        i === 0 ? 'today' : i === 1 ? 'tomorrow'
        : new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(dayUtc));
      return `Next automatic reminder ${when} (${STAGE_NAMES[stage]})`;
    }
    return '';
  };

  // ============================================================
  // TAP TO SEND — a ready message for each client in the Today list.
  // Opens WhatsApp, SMS or email on the user's own phone with the
  // message filled in, then records it in the client's reminder
  // history, so the stage moves on (first -> follow-up -> final).
  // Works for free users too (no AI needed).
  // ============================================================
  // "What to do next" card for stalled clients: which one is open.
  const [stalledOpenId, setStalledOpenId] = useState<string | null>(null);

  // Written off: the user has given up on this payment. The client leaves
  // the Today list and the totals; "Undo" puts it back to pending.
  const markWrittenOff = async (c: any) => {
    const ok = window.confirm(`Mark ${c.name || 'this client'} as written off? It leaves your Today list and totals. You can undo this from the client list.`);
    if (!ok) return;
    try {
      await updateDoc(doc(db, 'clients', c.id), {
        status: 'Written off',
        writtenOffAt: new Date().toISOString(),
        automatedReminders: false,
        automationStatus: 'off',
      });
      window.dispatchEvent(new Event('clients-updated'));
    } catch {
      setErrorMessage('Could not update the client. Please try again.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const undoWrittenOff = async (c: any) => {
    try {
      await updateDoc(doc(db, 'clients', c.id), { status: 'Pending', writtenOffAt: null });
      window.dispatchEvent(new Event('clients-updated'));
    } catch {
      setErrorMessage('Could not update the client. Please try again.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  // The "You can pay here" line, in the client's language.
  const tapLinkLine = (c: any) => {
    if (!c.paymentLink) return '';
    const label: Record<string, string> = {
      english: 'You can pay here:',
      hinglish: 'Yahan pay kar sakte hain:',
      hindi: 'यहाँ भुगतान कर सकते हैं:',
      marathi: 'येथे पेमेंट करू शकता:',
    };
    return `\n\n${label[normalizeLanguage(c.language)]} ${c.paymentLink}`;
  };

  const buildTapMessage = (c: any, days: number, forceStage?: string) => {
    const stage = forceStage || getTodayStage(c, days).label;
    // Firm final reminder extras (set per client in Add/Edit Client).
    const invoice = String(c.invoiceNumber || c.invoiceRef || '').trim();
    const lateFee = String(c.lateFee || '').trim();
    const msme = msmeApplies(c);
    const language = normalizeLanguage(c.language);
    const firstName = String(c.name || '').trim().split(' ')[0];
    const amount = formatAmountWithCurrency(c.amount, c.currency);
    const ownerName = String(user?.displayName || '').trim();
    const link = tapLinkLine(c);

    // Deadline 3 days from today, written for the client's language
    // (Marathi with normal 0-9 digits, to match the amount).
    const dateLocale = language === 'hindi' ? 'hi-IN' : language === 'marathi' ? 'mr-IN-u-nu-latn' : 'en-IN';
    const deadline = new Intl.DateTimeFormat(dateLocale, {
      timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long',
    }).format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

    // ---------- Hinglish ----------
    if (language === 'hinglish') {
      const hi = firstName ? `Hi ${firstName}` : 'Hi';
      const late = days <= 0 ? 'aaj due hai' : `ab ${days} din se overdue hai`;
      const sign = ownerName ? `\n\nThanks,\n${ownerName}` : '\n\nThanks!';
      if (stage === 'Stalled') {
        return {
          subject: 'Pending payment ke baare mein baat karein?',
          text: `${hi}, ${amount} ke pending payment ke baare mein check karna tha. Agar ek saath dena mushkil ho, toh do hisson mein bhi de sakte hain. Is hafte ek chhoti si call kar lein?${link}${sign}`,
        };
      }
      if (stage === 'Final reminder') {
        const fee = lateFee ? ` Agreement ke hisaab se ${lateFee} late fee lagegi.` : '';
        const msmeLine = msme ? ' Udyam (MSME) registered supplier hone ke naate, MSMED Act, 2006 ke tahat late payment par interest lagta hai.' : '';
        return {
          subject: `Final reminder: ${amount} ka payment overdue`,
          text: `${hi}, ${amount}${invoice ? ` (invoice ${invoice})` : ''} ka payment ${late}, aur pichhle reminders ke baad bhi abhi tak nahi mila hai. Yeh final reminder hai. Please ${deadline} tak payment clear kar dijiye. Tab tak payment nahi aaya toh formal recovery shuru karni padegi, jismein legal notice bhi ho sakta hai.${fee}${msmeLine} Invoice mein koi problem ho toh reply karke bata dijiye.${link}${sign}`,
        };
      }
      if (stage === 'Follow-up') {
        return {
          subject: `Follow-up: ${amount} ka payment`,
          text: `${hi}, ${amount} ka payment ${late}. Kab tak bhej payenge? Please ek date bata dijiye.${link}${sign}`,
        };
      }
      return {
        subject: days <= 0 ? `${amount} ka payment aaj due hai` : `Reminder: ${amount} ka payment`,
        text: `${hi}, umeed hai sab badhiya hai! Bas ek chhota sa reminder: ${amount} ka payment ${late}. Ho jaaye toh please bata dijiye.${link}${sign}`,
      };
    }

    // ---------- Hindi ----------
    if (language === 'hindi') {
      const hi = firstName ? `नमस्ते ${firstName} जी` : 'नमस्ते';
      const late = days <= 0 ? 'आज देय है' : `अब ${days} दिन से बकाया है`;
      const sign = ownerName ? `\n\nधन्यवाद,\n${ownerName}` : '\n\nधन्यवाद!';
      if (stage === 'Stalled') {
        return {
          subject: 'बकाया भुगतान के बारे में बात करें?',
          text: `${hi}, ${amount} के बकाया भुगतान के बारे में पूछना था। अगर एक साथ देना मुश्किल हो, तो दो हिस्सों में भी दे सकते हैं। क्या इस हफ़्ते एक छोटी सी कॉल कर सकते हैं?${link}${sign}`,
        };
      }
      if (stage === 'Final reminder') {
        const fee = lateFee ? ` तय शर्तों के अनुसार ${lateFee} लेट फ़ीस लागू होगी।` : '';
        const msmeLine = msme ? ' Udyam (MSME) पंजीकृत सप्लायर होने के नाते, MSMED Act, 2006 के तहत देर से भुगतान पर ब्याज लगता है।' : '';
        return {
          subject: `अंतिम रिमाइंडर: ${amount} का भुगतान बकाया`,
          text: `${hi}, ${amount}${invoice ? ` (इनवॉइस ${invoice})` : ''} का भुगतान ${late}, और पिछले रिमाइंडर के बाद भी अभी तक नहीं मिला है। यह अंतिम रिमाइंडर है। कृपया ${deadline} तक भुगतान कर दीजिए। तब तक भुगतान नहीं हुआ, तो औपचारिक वसूली की कार्रवाई शुरू करनी पड़ेगी, जिसमें कानूनी नोटिस भी शामिल हो सकता है।${fee}${msmeLine} इनवॉइस में कोई समस्या हो तो कृपया जवाब देकर बताइए।${link}${sign}`,
        };
      }
      if (stage === 'Follow-up') {
        return {
          subject: `फ़ॉलो-अप: ${amount} का भुगतान`,
          text: `${hi}, ${amount} का भुगतान ${late}। कृपया बता दीजिए कि भुगतान कब तक हो जाएगा?${link}${sign}`,
        };
      }
      return {
        subject: days <= 0 ? `${amount} का भुगतान आज देय है` : `रिमाइंडर: ${amount} का भुगतान`,
        text: `${hi}, आशा है आप ठीक हैं! बस एक छोटा सा रिमाइंडर: ${amount} का भुगतान ${late}। भुगतान हो जाए तो कृपया बता दीजिए।${link}${sign}`,
      };
    }

    // ---------- Marathi ----------
    if (language === 'marathi') {
      const hi = firstName ? `नमस्कार ${firstName}` : 'नमस्कार';
      const late = days <= 0 ? 'आज देय आहे' : `आता ${days} ${days === 1 ? 'दिवसापासून' : 'दिवसांपासून'} थकित आहे`;
      const sign = ownerName ? `\n\nधन्यवाद,\n${ownerName}` : '\n\nधन्यवाद!';
      if (stage === 'Stalled') {
        return {
          subject: 'थकित पेमेंटबद्दल बोलूया का?',
          text: `${hi}, ${amount} च्या थकित पेमेंटबद्दल विचारायचे होते. एकदम पूर्ण रक्कम देणे अवघड असेल, तर दोन भागांतही देऊ शकता. या आठवड्यात एक छोटा कॉल करूया का?${link}${sign}`,
        };
      }
      if (stage === 'Final reminder') {
        const fee = lateFee ? ` ठरल्याप्रमाणे ${lateFee} लेट फी लागू होईल.` : '';
        const msmeLine = msme ? ' Udyam (MSME) नोंदणीकृत पुरवठादार म्हणून, MSMED Act, 2006 नुसार उशिरा पेमेंटवर व्याज लागू होते.' : '';
        return {
          subject: `अंतिम रिमाइंडर: ${amount} चे पेमेंट थकित`,
          text: `${hi}, ${amount}${invoice ? ` (इनव्हॉइस ${invoice})` : ''} चे पेमेंट ${late}, आणि आधीच्या रिमाइंडरनंतरही अजून मिळालेले नाही. हे अंतिम रिमाइंडर आहे. कृपया ${deadline} पर्यंत पेमेंट करा. तोपर्यंत पेमेंट न झाल्यास औपचारिक वसुलीची कारवाई सुरू करावी लागेल, ज्यात कायदेशीर नोटीसही असू शकते.${fee}${msmeLine} इनव्हॉइसमध्ये काही अडचण असल्यास कृपया उत्तर देऊन कळवा.${link}${sign}`,
        };
      }
      if (stage === 'Follow-up') {
        return {
          subject: `फॉलो-अप: ${amount} चे पेमेंट`,
          text: `${hi}, ${amount} चे पेमेंट ${late}. कृपया पेमेंट कधीपर्यंत होईल ते कळवाल का?${link}${sign}`,
        };
      }
      return {
        subject: days <= 0 ? `${amount} चे पेमेंट आज देय आहे` : `रिमाइंडर: ${amount} चे पेमेंट`,
        text: `${hi}, आशा आहे तुम्ही बरे आहात! फक्त एक छोटेसे रिमाइंडर: ${amount} चे पेमेंट ${late}. पेमेंट झाल्यावर कृपया कळवा.${link}${sign}`,
      };
    }

    // ---------- English ----------
    const name = firstName || 'there';
    const late = days <= 0 ? 'due today' : `now ${days} ${days === 1 ? 'day' : 'days'} overdue`;
    const sign = ownerName ? `\n\nThanks,\n${ownerName}` : '\n\nThanks!';

    if (stage === 'Stalled') {
      return {
        subject: 'Can we sort out the pending payment?',
        text: `Hi ${name}, I wanted to check in about the pending payment of ${amount}. If paying it all at once is difficult, I'm happy to split it into two parts. Could we have a quick call this week to sort it out?${link}${sign}`,
      };
    }
    if (stage === 'Final reminder') {
      const fee = lateFee ? ` As agreed, a late fee of ${lateFee} applies.` : '';
      const msmeLine = msme ? ' As a Udyam (MSME) registered supplier, delayed payments carry interest under the MSMED Act, 2006.' : '';
      return {
        subject: `Final reminder: payment of ${amount} overdue`,
        text: `Hi ${name}, this is my final reminder about the payment of ${amount}${invoice ? ` for invoice ${invoice}` : ''}, which is ${late}. Please clear it by ${deadline}. If it isn't paid by then, I'll have to move to formal recovery, which may include a legal notice.${fee}${msmeLine} If there's an issue with the invoice, just reply and let me know.${link}${sign}`,
      };
    }
    if (stage === 'Follow-up') {
      return {
        subject: `Following up: payment of ${amount}`,
        text: `Hi ${name}, following up on the payment of ${amount}, which is ${late}. Could you let me know the date I can expect it?${link}${sign}`,
      };
    }
    return {
      subject: days <= 0 ? `Payment of ${amount} due today` : `Reminder: payment of ${amount}`,
      text: `Hi ${name}, hope you're doing well! Just a quick reminder that the payment of ${amount} is ${late}. Could you let me know once it's done?${link}${sign}`,
    };
  };

  const getClientPhone = (c: any): string => {
    let phone = String(c.whatsapp || c.phone || '').replace(/\D/g, '');
    if (phone.length === 10) phone = `91${phone}`; // 10 digits = Indian number
    return phone;
  };

  // Which button is busy writing an AI message, e.g. "abc123-whatsapp".
  const [tapWriting, setTapWriting] = useState<string | null>(null);

  // Pro users: Blink AI writes a fresh message for this client and stage.
  // Free users (or if the AI fails): the ready-made template above.
  const getAiTapMessage = async (c: any, days: number, channel: 'whatsapp' | 'sms' | 'email', forceStage?: string) => {
    const stage = forceStage || getTodayStage(c, days).label;
    const stageGuide: Record<string, { tone: string; note: string }> = {
      'First reminder': { tone: 'gentle', note: 'This is the FIRST reminder. Friendly, assume they forgot.' },
      'Follow-up': { tone: 'professional', note: 'This is a FOLLOW-UP. One reminder was already sent. Be direct and ask for a payment date.' },
      'Final reminder': { tone: 'firm', note: 'This is the FINAL reminder. Two reminders were ignored. Be firm, give a clear deadline 3 days from today, stay respectful.' },
      'Stalled': { tone: 'professional', note: 'Reminders are being ignored. Do not demand the full amount again. Offer to split the payment, ask what is blocking it, and suggest a short call.' },
    };
    const guide = stageGuide[stage] || stageGuide['First reminder'];

    const idToken = await user?.getIdToken();
    if (!idToken) throw new Error('Not signed in');

    // Earlier messages to this client, so the new one is worded differently.
    const previousReminders = (Array.isArray(c.reminderHistory) ? c.reminderHistory : [])
      .filter((r: any) => r && (r.message || r.email_body))
      .slice(-5)
      .map((r: any) => ({
        email_subject: r.email_subject || '',
        email_body: r.email_body || (r.channel === 'email' ? r.message : '') || '',
        whatsapp_message: r.channel === 'whatsapp' ? r.message || '' : '',
        sms_text: r.channel === 'sms' ? r.message || '' : '',
      }));

    const response = await fetch('/api/generate-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        clientName: String(c.name || '').trim(),
        amount: c.amount,
        currency: c.currency,
        daysOverdue: Math.max(0, days),
        invoiceRef: c.invoiceNumber || c.invoiceRef || '',
        tone: guide.tone,
        language: normalizeLanguage(c.language),
        variationInstruction: `${guide.note} The payment is ${days <= 0 ? 'due today' : `${days} days overdue`}.${stage === 'Final reminder' ? finalReminderNote(c) : ''}`,
        previousReminders,
      }),
    });
    if (!response.ok) throw new Error('AI message failed');

    const data = await response.json();
    const link = tapLinkLine(c);

    if (channel === 'email') {
      if (!data.email_body) throw new Error('Empty email');
      return { subject: data.email_subject || buildTapMessage(c, days, forceStage).subject, text: `${data.email_body}${link}` };
    }
    const text = channel === 'sms' ? data.sms_text : data.whatsapp_message;
    if (!text) throw new Error('Empty message');
    return { subject: '', text: `${text}${link}` };
  };

  // forceStage: 'Final reminder' sends the formal final notice (from the
  // "What to do next" card), whatever stage the client is at.
  const sendTapReminder = async (c: any, channel: 'whatsapp' | 'sms' | 'email', forceStage?: string) => {
    if (tapWriting) return;

    const days = getDaysOverdue(c.dueDate);
    const phone = getClientPhone(c);

    // Open the WhatsApp tab straight away (phones block tabs opened
    // after waiting), then fill in the address once the message is ready.
    const whatsappTab = channel === 'whatsapp' ? window.open('', '_blank') : null;
    if (whatsappTab) whatsappTab.opener = null;

    let message = buildTapMessage(c, days, forceStage);
    let usedAi = false;

    if (isPro) {
      setTapWriting(`${c.id}-${channel}${forceStage ? '-final' : ''}`);
      try {
        message = await getAiTapMessage(c, days, channel, forceStage);
        usedAi = true;
      } catch {
        // Keep the ready-made template so the user can still send.
      } finally {
        setTapWriting(null);
      }
    }

    const { subject, text } = message;
    track('send_reminder', {
      channel,
      written_by: usedAi ? 'ai' : 'template',
      final_notice: forceStage === 'Final reminder',
    });

    if (channel === 'whatsapp') {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      if (whatsappTab) whatsappTab.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    } else if (channel === 'sms') {
      // "sms:+number?&body=" works on both Android and iPhone.
      window.location.href = `sms:+${phone}?&body=${encodeURIComponent(text)}`;
    } else {
      window.location.href = `mailto:${String(c.email || '').trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    }

    try {
      await updateDoc(doc(db, 'clients', c.id), {
        reminderHistory: arrayUnion({
          type: 'manual',
          channel,
          sentAt: new Date().toISOString(),
          label: forceStage === 'Final reminder'
            ? `Formal final notice sent (${channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'email'})`
            : channel === 'whatsapp' ? 'Manual WhatsApp sent' : channel === 'sms' ? 'Manual SMS sent' : 'Manual email sent',
          message: text,
          ...(channel === 'email' ? { email_subject: subject, email_body: text } : {}),
          writtenBy: usedAi ? 'ai' : 'template',
        }),
      });
      window.dispatchEvent(new Event('clients-updated'));
    } catch {
      // If saving fails, the message still opened; the user can send again later.
    }
  };

  const todayClients = clients
    .filter((c) => {
      if (c.status !== 'Pending' || !c.dueDate) return false;
      const dueText = String(c.dueDate).substring(0, 10);
      const todayText = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      if (dueText > todayText) return false; // not due yet
      const last = getLastReminderDaysAgo(c);
      return last === null || last >= 2;
    })
    .sort((a, b) => getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate))
    .slice(0, 5);

  const filteredAndSortedClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (statusFilter === 'All') return true;
    
    const isOverdue = c.status === 'Pending' && getDaysOverdue(c.dueDate) > 0;

    if (statusFilter === 'Paid') return c.status === 'Paid';
    if (statusFilter === 'Pending') return c.status === 'Pending' && !isOverdue;
    if (statusFilter === 'Overdue') return c.status === 'Pending' && isOverdue;

    return true;
  }).sort((a, b) => {
    // Most urgent first: overdue (most days late first), then unpaid by
    // nearest due date, then paid clients last.
    const group = (c: any) =>
      c.status === 'Paid' ? 2 : getDaysOverdue(c.dueDate) > 0 ? 0 : 1;
    const ga = group(a);
    const gb = group(b);
    if (ga !== gb) return ga - gb;
    if (ga === 0) return getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate);
    if (ga === 1) return String(a.dueDate || '').localeCompare(String(b.dueDate || ''));
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  // Saves the first late invoice in 3 fields. Email, phone, invoice
  // number and payment link can be added later with Edit.
  const handleAddFirstInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || firstSaving) return;

    if (!firstName.trim() || !firstAmount.trim() || !firstDueDate) {
      setFirstError('Please fill in the client, amount and due date.');
      return;
    }

    setFirstError('');
    setFirstSaving(true);
    try {
      await addDoc(collection(db, 'clients'), {
        userId: user.uid,
        name: firstName.trim(),
        company: '',
        email: '',
        whatsapp: '',
        amount: firstAmount,
        dueDate: firstDueDate,
        invoiceNumber: '',
        paymentLink: '',
        currency: firstCurrency,
        automatedReminders: false,
        automationStatus: 'off',
        status: 'Pending',
        createdAt: serverTimestamp(),
        reminderHistory: [],
      });
      track('add_client', { from: 'first_invoice_form' });
      setFirstName('');
      setFirstAmount('');
      setFirstDueDate('');
      window.dispatchEvent(new Event('clients-updated'));
    } catch (error) {
      console.error('Could not add first invoice:', error);
      setFirstError('Could not save. Please try again.');
    } finally {
      setFirstSaving(false);
    }
  };

  // Premium loading screen: three brand-coloured dots rising and
  // falling in a smooth wave. No images, no spinner.
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6" suppressHydrationWarning={true}>
      <div className="flex items-end gap-2.5 h-8" suppressHydrationWarning={true}>
        {['#245B92', '#2289A8', '#20B8BE'].map((color, i) => (
          <motion.span
            key={color}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 6px 14px -4px ${color}99` }}
            animate={{ y: [0, -12, 0], scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.16 }}
          />
        ))}
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-400" suppressHydrationWarning={true}>
        Loading your dashboard
      </p>
    </div>
  );

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
                <h3 className="text-xl font-black text-slate-900" suppressHydrationWarning={true}>{wasPro ? 'Renew DueBlink Pro' : 'Upgrade to DueBlink Pro'}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed" suppressHydrationWarning={true}>
                  {wasPro
                    ? <>Your Pro plan has ended. Renew to get the <span className="font-bold text-slate-700">Pro Recovery Assistant</span> and your recovery tools back.</>
                    : <>Upgrade to DueBlink Pro to unlock the <span className="font-bold text-slate-700">Pro Recovery Assistant</span> and accelerate your cash collection.</>}
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
                  {wasPro ? 'Renew Now 🚀' : 'Upgrade Now 🚀'}
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
        externalActionClientId={robotActionClientId}
        externalActionNonce={robotActionNonce}
        onProcessingChange={setIsRobotProcessing}
        recommendation={recommendation ? { id: recommendation.id, name: recommendation.name, amount: recommendation.amount, currency: recommendation.currency, daysOverdue: getRecommendationDaysOverdue(recommendation) } : null} 
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
            <Image src="/logo.png" alt="DueBlink Logo" width={500} height={112} priority className="h-full w-full object-contain object-left" />
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
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245B92]/40"
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

        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center justify-between shadow-xs"
              suppressHydrationWarning={true}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertTriangle size={16} />
                </div>
                <p className="text-xs font-bold tracking-wide">{errorMessage}</p>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
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
            {!isPro && <SeasonalBanner />}

            {/* Pro ends within 3 days: remind them to renew */}
            {isPro && proExpiresAt && proExpiresAt.getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000 && proExpiresAt.getTime() > Date.now() && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" suppressHydrationWarning={true}>
                <div className="space-y-1" suppressHydrationWarning={true}>
                  <h2 className="text-base sm:text-lg font-black text-amber-900" suppressHydrationWarning={true}>
                    Your Pro ends on {proExpiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                  </h2>
                  <p className="text-xs sm:text-sm text-amber-800 font-medium" suppressHydrationWarning={true}>
                    After that, automatic reminders and Blink stop. Renew now; the new time is added on top, so you lose no days.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => router.push('/pricing')}
                  className="w-full sm:w-auto shrink-0 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition cursor-pointer whitespace-nowrap"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                  suppressHydrationWarning={true}
                >
                  Renew Pro
                </motion.button>
              </div>
            )}

            {!isPro && (
              <div className="bg-gradient-to-r from-[#245B92] to-[#20B8BE] rounded-3xl p-6 text-white flex flex-col sm:flex-row justify-between items-center shadow-lg gap-4" suppressHydrationWarning={true}>
                <div className="space-y-1 text-center sm:text-left" suppressHydrationWarning={true}>
                  <h2 className="text-lg font-black tracking-tight" suppressHydrationWarning={true}>{wasPro ? 'Your Pro Plan Has Ended' : 'Unlock Pro Recovery Assistant'}</h2>
                  <p className="text-xs text-white/90 font-medium" suppressHydrationWarning={true}>
                    {wasPro
                      ? 'Renew to get automated follow-ups, the AI Recovery Assistant, and your other Pro tools back.'
                      : 'Automate follow-ups, analyze payment trends, and recover money faster.'}
                  </p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setUpgradeModalOpen(true)}
                  className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-xs shadow-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                  suppressHydrationWarning={true}
                >
                  {wasPro ? 'Renew Pro 🚀' : 'Upgrade to Pro 🚀'}
                </motion.button>
              </div>
            )}

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" suppressHydrationWarning={true}>
              <div className="space-y-1.5" suppressHydrationWarning={true}>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900" suppressHydrationWarning={true}>
                  {getGreeting()}, {getUserDisplayName()} 👋
                  {isPro && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      title="You're on DueBlink Pro. Tap to see your plan."
                      className="ml-2 sm:ml-3 align-middle inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#245B92] text-white whitespace-nowrap cursor-pointer hover:opacity-90 transition"
                      suppressHydrationWarning={true}
                    >
                      <Crown size={12} suppressHydrationWarning={true} /> PRO
                    </button>
                  )}
                </h1>
                <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>
                  Here's what needs your attention today.
                </p>
                
              </div>

            </header>

            {/* Mobile Quick Add Client */}
            {clients.length > 0 && (
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
            )}

            {/* TODAY — who to chase today, with the stage, advice and quick actions */}
            {clients.some((c) => c.status === 'Pending') && (
              <section className="p-5 sm:p-8 bg-white border border-[#2BB6A8]/30 rounded-3xl shadow-xs border-l-8 border-l-[#2BB6A8] space-y-4" suppressHydrationWarning={true}>
                <div className="flex items-center justify-between gap-3" suppressHydrationWarning={true}>
                  <h2 className="text-[10px] font-black text-[#2BB6A8] uppercase tracking-widest" suppressHydrationWarning={true}>Today</h2>
                  <span className="text-[11px] font-bold text-slate-500" suppressHydrationWarning={true}>
                    {todayClients.length === 0
                      ? 'All caught up'
                      : `${todayClients.length} ${todayClients.length === 1 ? 'client' : 'clients'} to chase`}
                  </span>
                </div>

                {todayClients.length === 0 ? (
                  <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>
                    Nobody needs a reminder today. DueBlink will show clients here when they are due.
                  </p>
                ) : (
                  <div className="space-y-3" suppressHydrationWarning={true}>
                    {todayClients.map((c) => {
                      const days = getDaysOverdue(c.dueDate);
                      const stage = getTodayStage(c, days);
                      const lastDays = getLastReminderDaysAgo(c);

                      return (
                        <div
                          key={c.id}
                          className="p-4 sm:p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-3"
                          suppressHydrationWarning={true}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2" suppressHydrationWarning={true}>
                            <div className="space-y-1" suppressHydrationWarning={true}>
                              <div className="flex items-center gap-2 flex-wrap" suppressHydrationWarning={true}>
                                <p className="font-bold text-base text-slate-900" suppressHydrationWarning={true}>{c.name}</p>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                  stage.label === 'Stalled'
                                    ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                    : days > 0
                                      ? 'bg-rose-50 text-rose-600'
                                      : 'bg-amber-50 text-amber-600'
                                }`} suppressHydrationWarning={true}>
                                  {stage.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium" suppressHydrationWarning={true}>
                                {formatAmountWithCurrency(c.amount, c.currency)} · {days === 0 ? 'Due today' : `${days} ${days === 1 ? 'day' : 'days'} overdue`} · {lastDays === null ? 'No reminder sent yet' : `Last reminder ${lastDays} ${lastDays === 1 ? 'day' : 'days'} ago`}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-slate-700 font-medium" suppressHydrationWarning={true}>{stage.advice}</p>

                          {/* STALLED — reminders are being ignored: what to do next */}
                          {stage.label === 'Stalled' && (
                            <div className="rounded-xl border border-orange-200 bg-white" suppressHydrationWarning={true}>
                              <button
                                type="button"
                                onClick={() => setStalledOpenId(stalledOpenId === c.id ? null : c.id)}
                                aria-expanded={stalledOpenId === c.id}
                                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-orange-700 cursor-pointer"
                                suppressHydrationWarning={true}
                              >
                                What to do next
                                <ChevronDown size={16} className={`transition-transform ${stalledOpenId === c.id ? 'rotate-180' : ''}`} />
                              </button>

                              <AnimatePresence initial={false}>
                                {stalledOpenId === c.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden"
                                  >
                                    <ol className="px-4 pb-4 space-y-3 text-xs text-slate-600 font-medium list-decimal list-inside" suppressHydrationWarning={true}>
                                      <li>
                                        <span className="font-bold text-slate-800">Try another way to reach them.</span>{' '}
                                        A call often works when messages don&apos;t. The buttons above send a message offering to split the payment.
                                        {getClientPhone(c) && (
                                          <a
                                            href={`tel:+${getClientPhone(c)}`}
                                            className="mt-2 flex w-full sm:w-auto sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#245B92] bg-white border border-[#245B92]/20 hover:bg-[#245B92]/5 transition"
                                          >
                                            <PhoneCall size={14} /> Call {String(c.name || '').trim().split(' ')[0] || 'client'}
                                          </a>
                                        )}
                                      </li>
                                      <li>
                                        <span className="font-bold text-slate-800">Ask for their accounts team.</span>{' '}
                                        The person you work with may not be the one who pays invoices.
                                      </li>
                                      <li>
                                        <span className="font-bold text-slate-800">Pause any ongoing work</span> until the payment is sorted.
                                      </li>
                                      <li>
                                        <span className="font-bold text-slate-800">Send the formal final notice.</span>{' '}
                                        Amount, deadline in 3 days, and the next step (formal recovery).
                                        {(getClientPhone(c) || c.email) ? (
                                          <div className="mt-2 grid grid-cols-2 sm:flex gap-2">
                                            {getClientPhone(c) && (
                                              <motion.button
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => sendTapReminder(c, 'whatsapp', 'Final reminder')}
                                                disabled={tapWriting !== null}
                                                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F172A] hover:opacity-90 transition cursor-pointer"
                                              >
                                                {tapWriting === `${c.id}-whatsapp-final` ? <Loader2 size={14} className="animate-spin" /> : <Gavel size={14} />}
                                                {tapWriting === `${c.id}-whatsapp-final` ? 'Writing…' : 'On WhatsApp'}
                                              </motion.button>
                                            )}
                                            {c.email && (
                                              <motion.button
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => sendTapReminder(c, 'email', 'Final reminder')}
                                                disabled={tapWriting !== null}
                                                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F172A] hover:opacity-90 transition cursor-pointer"
                                              >
                                                {tapWriting === `${c.id}-email-final` ? <Loader2 size={14} className="animate-spin" /> : <Gavel size={14} />}
                                                {tapWriting === `${c.id}-email-final` ? 'Writing…' : 'By email'}
                                              </motion.button>
                                            )}
                                          </div>
                                        ) : null}
                                        <span className="block mt-1.5 text-[11px] text-slate-400">
                                          Late fee and MSME lines are added only if you set them in Edit client.
                                        </span>
                                      </li>
                                      <li>
                                        <span className="font-bold text-slate-800">Formal options.</span>{' '}
                                        {!isIndianCurrency(c.currency)
                                          ? "A legal notice through a lawyer, a small-claims court, or a collection agency in the client's country."
                                          : msmeApplies(c)
                                            ? 'A legal notice through a lawyer, or a complaint on MSME Samadhaan (samadhaan.msme.gov.in).'
                                            : 'A legal notice through a lawyer, then a recovery case in civil court if needed.'}
                                        {/* Not Udyam registered: tell them it's free, for future invoices */}
                                        {isIndianCurrency(c.currency) && !msmeApplies(c) && (
                                          <span className="block mt-1 text-[11px] text-slate-500">
                                            Tip: Udyam (MSME) registration is free and online for freelancers too (udyamregistration.gov.in). It usually protects only work done after you register, not this invoice.
                                          </span>
                                        )}
                                        <span className="block mt-1 text-[11px] text-slate-400">
                                          Check with a lawyer or CA before taking formal steps. Not legal advice.
                                        </span>
                                      </li>
                                      <li>
                                        <span className="font-bold text-slate-800">Or let it go.</span>{' '}
                                        Mark it as written off so it stops showing here.
                                        <button
                                          type="button"
                                          onClick={() => markWrittenOff(c)}
                                          className="mt-2 flex w-full sm:w-auto sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                                        >
                                          <Ban size={14} /> Mark as written off
                                        </button>
                                      </li>
                                    </ol>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Tap to send: a ready message, opened on the user's own phone */}
                          {(getClientPhone(c) || c.email) ? (
                            <div className="grid grid-cols-3 gap-2" suppressHydrationWarning={true}>
                              {getClientPhone(c) && (
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => sendTapReminder(c, 'whatsapp')}
                                  disabled={tapWriting !== null}
                                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-[#245B92] bg-white border border-[#245B92]/20 hover:bg-[#245B92]/5 transition cursor-pointer"
                                  suppressHydrationWarning={true}
                                >
                                  {tapWriting === `${c.id}-whatsapp` ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                                  {tapWriting === `${c.id}-whatsapp` ? 'Writing…' : 'WhatsApp'}
                                </motion.button>
                              )}
                              {getClientPhone(c) && (
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => sendTapReminder(c, 'sms')}
                                  disabled={tapWriting !== null}
                                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-[#245B92] bg-white border border-[#245B92]/20 hover:bg-[#245B92]/5 transition cursor-pointer"
                                  suppressHydrationWarning={true}
                                >
                                  {tapWriting === `${c.id}-sms` ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                                  {tapWriting === `${c.id}-sms` ? 'Writing…' : 'SMS'}
                                </motion.button>
                              )}
                              {c.email && (
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => sendTapReminder(c, 'email')}
                                  disabled={tapWriting !== null}
                                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-[#245B92] bg-white border border-[#245B92]/20 hover:bg-[#245B92]/5 transition cursor-pointer"
                                  suppressHydrationWarning={true}
                                >
                                  {tapWriting === `${c.id}-email` ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                  {tapWriting === `${c.id}-email` ? 'Writing…' : 'Email'}
                                </motion.button>
                              )}
                              <p className="col-span-3 text-[11px] text-slate-400 font-medium" suppressHydrationWarning={true}>
                                {isPro ? '✨ Blink AI writes a fresh message for this stage.' : 'Ready-made message. Pro: Blink AI writes a fresh one each time.'}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 font-medium" suppressHydrationWarning={true}>
                              Add this client&apos;s WhatsApp number or email to send a reminder in one tap.
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2" suppressHydrationWarning={true}>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (!isPro) {
                                  setUpgradeModalOpen(true);
                                  return;
                                }
                                setRobotActionClientId(c.id);
                                setRobotAction('recommend');
                                setRobotActionNonce((n) => n + 1);
                              }}
                              className="w-full sm:w-auto bg-[#0F172A] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xs hover:opacity-90 flex items-center justify-center gap-2 transition-all cursor-pointer"
                              suppressHydrationWarning={true}
                            >
                              <Sparkles size={14} suppressHydrationWarning={true} /> Write reminder
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                await updateDoc(doc(db, 'clients', c.id), { status: 'Paid', paidAt: new Date().toISOString() });
                                window.dispatchEvent(new Event('clients-updated'));
                              }}
                              className="w-full sm:w-auto text-sm font-bold text-white px-6 py-3 rounded-xl shadow-xs transition-shadow cursor-pointer flex items-center justify-center gap-1.5"
                              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                              suppressHydrationWarning={true}
                            >
                              <CheckCircle2 size={14} suppressHydrationWarning={true} /> Mark paid
                            </motion.button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* NEW USER — add the first late invoice in 3 fields */}
            {clients.length === 0 && (
              <section className="p-5 sm:p-8 bg-white border border-[#2BB6A8]/30 rounded-3xl shadow-xs border-l-8 border-l-[#2BB6A8] space-y-5" suppressHydrationWarning={true}>
                <div className="space-y-1" suppressHydrationWarning={true}>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900" suppressHydrationWarning={true}>Add your first late invoice</h2>
                  <p className="text-sm text-slate-500 font-medium" suppressHydrationWarning={true}>
                    Just 3 details. DueBlink tells you when to follow up and writes the reminder.
                  </p>
                </div>

                <form onSubmit={handleAddFirstInvoice} className="grid grid-cols-1 sm:grid-cols-3 gap-3" suppressHydrationWarning={true}>
                  <div className="space-y-1.5" suppressHydrationWarning={true}>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>Client</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Rahul Mehta"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition text-slate-900"
                      suppressHydrationWarning={true}
                    />
                  </div>
                  <div className="space-y-1.5" suppressHydrationWarning={true}>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>Amount ({getCurrencySymbol(firstCurrency).trim()})</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={firstAmount ? Number(firstAmount).toLocaleString(firstCurrency === 'INR' ? 'en-IN' : 'en-US') : ''}
                      onChange={(e) => setFirstAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="25,000"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition text-slate-900"
                      suppressHydrationWarning={true}
                    />
                  </div>
                  <div className="space-y-1.5" suppressHydrationWarning={true}>
                    <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase" suppressHydrationWarning={true}>Due date</label>
                    <input
                      type="date"
                      value={firstDueDate}
                      onChange={(e) => setFirstDueDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/25 transition text-slate-700"
                      suppressHydrationWarning={true}
                    />
                  </div>

                  {firstError && (
                    <p className="sm:col-span-3 text-[11px] font-bold text-red-500" suppressHydrationWarning={true}>{firstError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={firstSaving}
                    className="sm:col-span-3 w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                    suppressHydrationWarning={true}
                  >
                    {firstSaving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                    {firstSaving ? 'Saving...' : 'Add your first late invoice'}
                  </button>
                </form>

                <p className="text-xs text-slate-400 font-medium" suppressHydrationWarning={true}>
                  Email, WhatsApp number and invoice number are optional. Add them later with Edit.
                </p>
              </section>
            )}

            {clients.length > 0 && (
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" suppressHydrationWarning={true}>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} whileHover={{ y: -2 }} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs border-t-4 border-t-[#245B92]" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><Layers size={14} suppressHydrationWarning={true}/> Total Outstanding</div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mb-1" suppressHydrationWarning={true}>{formatTotalsByCurrency(clients.filter((c) => c.status === 'Pending'))}</p>
                <p className="text-xs font-medium text-slate-500">Outstanding across {pendingCount} {pendingCount === 1 ? 'invoice' : 'invoices'}.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} whileHover={{ y: -2 }} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs border-t-4 border-t-[#20B8BE]" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><AlertTriangle size={14} suppressHydrationWarning={true}/> Overdue</div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mb-1" suppressHydrationWarning={true}>{formatTotalsByCurrency(overdueClients)}</p>
                <p className="text-xs font-medium text-slate-500">{overdueCount === 0 ? 'Nothing overdue right now.' : `${overdueCount} overdue ${overdueCount === 1 ? 'invoice' : 'invoices'}.`}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} whileHover={{ y: -2 }} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs border-t-4 border-t-[#2BB6A8]" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2" suppressHydrationWarning={true}><TrendingUp size={14} suppressHydrationWarning={true}/> Recovered this month</div>
                <p className="text-2xl sm:text-3xl font-black text-[#2BB6A8] mb-1" suppressHydrationWarning={true}>{formatTotalsByCurrency(paidThisMonth)}</p>
                <p className="text-xs font-medium text-slate-500">{paidCount === 0 ? 'No payments recovered yet.' : `${formatTotalsByCurrency(clients.filter((c) => c.status === 'Paid'))} recovered in total.`}</p>
              </motion.div>
            </section>
            )}

            {clients.length > 0 && (
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
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/20 transition text-slate-900"
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setClientToEdit(null); setIsModalOpen(true); }} 
                    className="hidden sm:flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer" 
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
                    const isOverdue = c.status === 'Pending' && getDaysOverdue(c.dueDate) > 0;
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
                    const daysOverdue = getDaysOverdue(c.dueDate);
                    const isOverdue = daysOverdue > 0 && c.status === 'Pending';

                    const isExpanded = expandedClientId === c.id;

                    // Same escalation logic as the Pro Recovery Assistant's
                    // getEscalationStage: 3+ reminders sent and still unpaid
                    // (or 2 sent and 21+ days overdue) means reminders alone
                    // aren't working — flag it visibly instead of burying
                    // that signal inside the AI panel.
                    const reminderCount = Array.isArray(c.reminderHistory) ? c.reminderHistory.length : 0;
                    const isWrittenOff = c.status === 'Written off';
                    const isStalled = c.status === 'Pending' && (
                      reminderCount >= 3 || (reminderCount === 2 && daysOverdue >= 21)
                    );

                    return (
                      <motion.div 
                        key={c.id} 
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`p-6 border rounded-2xl transition-colors duration-150 space-y-4 cursor-pointer ${
                          isStalled
                            ? 'border-orange-200 border-l-4 border-l-orange-400 bg-orange-50/30 hover:bg-orange-50/50'
                            : 'border-slate-100 bg-slate-50/50 hover:bg-[#245B92]/5 hover:border-[#245B92]/30'
                        }`} suppressHydrationWarning={true}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" suppressHydrationWarning={true}>
                          <div className="space-y-1" suppressHydrationWarning={true}>
                            <div className="flex items-center gap-3 flex-wrap" suppressHydrationWarning={true}>
                              <p className="font-bold text-base text-slate-900" suppressHydrationWarning={true}>{c.name}</p>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                c.status === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : isWrittenOff
                                    ? 'bg-slate-100 text-slate-500'
                                    : isOverdue 
                                      ? 'bg-rose-50 text-rose-600' 
                                      : 'bg-amber-50 text-amber-600'
                              }`} suppressHydrationWarning={true}>
                                {c.status === 'Paid' ? 'Paid' : isWrittenOff ? 'Written off' : isOverdue ? 'Overdue' : 'Pending'}
                              </span>

                              {isStalled && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1"
                                  title="Reminders haven't worked — try a different approach (call, payment plan, or ask what's blocking payment)"
                                  suppressHydrationWarning={true}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                  Needs Attention
                                </motion.span>
                              )}

                              {c.automatedReminders === true && c.status === 'Pending' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F8F8] text-[#159A9F]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#20B8BE]" />
                                  Auto Reminder ON
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium" suppressHydrationWarning={true}>{c.company || c.email || 'No company'}</p>
                            {c.status === 'Pending' && (() => {
                              const lastDays = getLastReminderDaysAgo(c);
                              const nextAuto = getNextAutoReminder(c);
                              return (
                                <p className="text-xs text-slate-600 font-medium" suppressHydrationWarning={true}>
                                  <span className="font-bold text-slate-700">{getTodayStage(c, daysOverdue).label}</span>
                                  {' · '}
                                  {lastDays === null ? 'No reminder sent yet' : `Last reminder ${lastDays === 0 ? 'today' : `${lastDays} ${lastDays === 1 ? 'day' : 'days'} ago`}`}
                                  {nextAuto ? ` · ${nextAuto}` : ''}
                                </p>
                              );
                            })()}
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
                                  await updateDoc(doc(db, 'clients', c.id), { status: 'Paid', paidAt: new Date().toISOString() }); 
                                  window.dispatchEvent(new Event('clients-updated'));
                                }} 
                                className="flex-1 sm:flex-none text-xs font-bold text-white px-4 py-2.5 rounded-xl shadow-xs transition-shadow cursor-pointer flex items-center justify-center gap-1.5" 
                                style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                                suppressHydrationWarning={true}
                              >
                                <CheckCircle2 size={14} suppressHydrationWarning={true} /> Mark Paid
                              </motion.button>
                            ) : isWrittenOff ? (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={(e) => { e.stopPropagation(); undoWrittenOff(c); }}
                                className="flex-1 sm:flex-none text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                title="Move back to pending"
                                suppressHydrationWarning={true}
                              >
                                <Undo2 size={14} suppressHydrationWarning={true} /> Undo write-off
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
                                  Amount Due: <strong className="text-slate-900 font-black text-sm ml-1" suppressHydrationWarning={true}>{formatAmountWithCurrency(c.amount, c.currency)}</strong>
                                </span>
                                <span suppressHydrationWarning={true}>
                                  Due Date: <strong className="text-slate-900 ml-1" suppressHydrationWarning={true}>{c.dueDate || 'N/A'}</strong>
                                </span>
                                <span suppressHydrationWarning={true}>
                                  Status: <strong className={c.status === 'Paid' ? 'text-emerald-600' : isWrittenOff ? 'text-slate-500' : isOverdue ? 'text-rose-600' : 'text-amber-600'} suppressHydrationWarning={true}>{c.status === 'Paid' ? 'Paid' : isWrittenOff ? 'Written off' : isOverdue ? `Overdue by ${daysOverdue} days` : 'Pending'}</strong>
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
                                    onClick={() => { setRobotActionClientId(c.id); setRobotAction('recommend'); setRobotActionNonce((n) => n + 1); }} 
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
            )}
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
              <p className="text-sm text-slate-500 font-medium mt-1">Manage your profile, billing plan and security settings.</p>
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
                  <p className="text-xl font-black text-slate-900">{isPro ? 'DueBlink Pro 🚀' : wasPro ? 'Pro Plan Ended' : 'Free Plan'}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {isPro
                      ? 'All Pro recovery tools and AI assistant are fully unlocked.'
                      : wasPro
                        ? 'Your Pro access has ended. Renew to get your recovery tools back.'
                        : 'Upgrade to Pro to unlock unlimited AI features.'}
                  </p>
                  {isPro && proExpiresAt && (
                    <p className="text-xs font-bold text-slate-700 pt-1">
                      Active until {proExpiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {billingCycle ? ` · Billed ${billingCycle}` : ''}
                    </p>
                  )}
                  {!isPro && wasPro && proExpiresAt && (
                    <p className="text-xs font-bold text-slate-500 pt-1">
                      Ended {proExpiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
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
                    {wasPro ? 'Renew Pro ✨' : 'Upgrade to Pro ✨'}
                  </motion.button>
                )}
              </div>
              
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-semibold text-slate-500 px-2 gap-2">
                <span>
                  {isPro
                    ? 'Manage Billing: You can cancel anytime before your renewal date.'
                    : wasPro
                      ? 'Renew anytime to pick up right where you left off.'
                      : 'Upgrade anytime — no long-term commitment.'}
                </span>
                <button onClick={() => router.push('/pricing')} className="text-[#245B92] font-bold hover:underline cursor-pointer">
                  View Pricing & Plans →
                </button>
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
                        setErrorMessage("No registered email address found.");
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
                      setErrorMessage("Failed to send password reset email. Please try again.");
                      setTimeout(() => setErrorMessage(null), 4000);
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
                  <span className="text-[#245B92]">→</span>
                </a>
                <a href="/#faq" className="px-5 py-4 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center justify-between">
                  <span>FAQ</span>
                  <span className="text-[#245B92]">→</span>
                </a>
                <a href="/pricing" className="px-5 py-4 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center justify-between">
                  <span>Pricing & Plans</span>
                  <span className="text-[#245B92]">→</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </motion.div>
  );
}