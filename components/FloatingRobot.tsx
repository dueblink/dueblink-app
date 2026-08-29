'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Brain, X, Sparkles, BarChart3, Clock, ArrowRight, Users, ChevronRight, Zap, ArrowLeft, Loader2, Copy, Check, Download, RefreshCw, UserPlus, Mail, MessageCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingRobotProps {
  clients?: any[];
  onTrigger?: (action: string) => void;
  recommendation?: {
    id?: string;
    name: string;
    amount: string | number;
    daysOverdue: number;
  } | null;
  isPro?: boolean;
  externalAction?: string | null;
  onOpenAddClient?: () => void;
}

export default function FloatingRobot({
  clients = [],
  onTrigger,
  recommendation,
  isPro = false,
  externalAction = null,
  onOpenAddClient
}: FloatingRobotProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(true);
  const [uiState, setUiState] = useState<'idle' | 'processing'>('idle');
  const [remainingFreeReminders, setRemainingFreeReminders] = useState(3);
  const [greeting, setGreeting] = useState('');

  // Real-time reactive client count state
  const [savedClientsCount, setSavedClientsCount] = useState(0);
  const [allClientsPaid, setAllClientsPaid] = useState(false);

  // State for in-panel AI response display & interactive commands
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [activeActionName, setActiveActionName] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientPickerAction, setClientPickerAction] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showMessageBubble, setShowMessageBubble] = useState(false);
  const [clickedSectionText, setClickedSectionText] = useState<string | null>(null);

  // Dynamic positioning state to avoid overlapping
  const [isScrolled, setIsScrolled] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const cleanResponseText = (text: string) => {
    return text
      .replace(/\r/g, "")
      // Strip stray divider lines the AI sometimes appends after a
      // paragraph (runs of 3+ dashes, underscores, or em-dashes/box-
      // drawing characters), e.g. "date. ————————————————"
      .replace(/[\s]*[-_─—━]{3,}[\s]*/g, "\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  // Safety net for fields that are captured "to the end of the response"
  // (Next Best Action, Today's Focus, etc). These are always meant to be
  // one or two sentences. If the AI ever adds extra content after them —
  // repeats a section, restates a heading, dumps the rest of the response —
  // this truncates at the first sign of it, so the UI never shows a
  // runaway wall of text no matter what the model does.
  const truncateRunawayTail = (text: string) => {
    if (!text) return text;

    // Any of these reappearing means the AI kept going past where it
    // should have stopped — cut there.
    const stopMarkers = [
      "RECOVERY SNAPSHOT",
      "RECOVERY STATUS",
      "BLINK RECOMMENDATION",
      "EMAIL FOLLOW-UP",
      "WHATSAPP FOLLOW-UP",
      "NEXT BEST ACTION",
      "IMPORTANT INFORMATION",
      "QUICK SUMMARY",
      "REWRITTEN REMINDER",
      "PRIORITY 1",
      "PRIORITY 2",
      "TODAY'S FOCUS",
      "BLINK INSIGHT",
    ];

    let cutIndex = text.length;

    for (const marker of stopMarkers) {
      // Only match if the marker starts a new line (a real heading),
      // not if it's just part of an ordinary sentence — e.g. "Send the
      // rewritten reminder via WhatsApp" must NOT match "REWRITTEN REMINDER".
      const escaped = marker.replace(/'/g, "['’]?");
      const regex = new RegExp(`(?:^|\\n)\\s*${escaped}\\b`, "i");
      const match = text.match(regex);
      if (match && match.index !== undefined && match.index > 0) {
        cutIndex = Math.min(cutIndex, match.index);
      }
    }

    let result = text.slice(0, cutIndex).trim();

    // These fields are one or two sentences — a blank line is another
    // strong signal the real answer already ended.
    const blankLineIndex = result.indexOf("\n\n");
    if (blankLineIndex > 0) {
      result = result.slice(0, blankLineIndex).trim();
    }

    return result;
  };

  const parseFollowUpResponse = (text: string) => {
    const response = cleanResponseText(text);

    const normalizeHeading = (value: string) =>
      value
        .replace(/[*_`#]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

    const lines = response.split("\n");

    const findHeadingIndex = (heading: string) => {
      const target = normalizeHeading(heading);

      return lines.findIndex((line) => {
        const normalized = normalizeHeading(line);
        return normalized === target || normalized.includes(target);
      });
    };

    const getSection = (start: string, end?: string) => {
      const startIndex = findHeadingIndex(start);

      if (startIndex === -1) return "";

      const contentLines = lines.slice(startIndex + 1);

      if (!end) {
        return contentLines.join("\n").trim();
      }

      const endIndex = contentLines.findIndex((line) => {
        const normalized = normalizeHeading(line);
        const target = normalizeHeading(end);

        return normalized === target || normalized.includes(target);
      });

      return contentLines
        .slice(0, endIndex === -1 ? contentLines.length : endIndex)
        .join("\n")
        .trim();
    };

    return {
      snapshot: getSection(
        "RECOVERY SNAPSHOT",
        "RECOVERY STATUS"
      ),

      recoveryStatus: getSection(
        "RECOVERY STATUS",
        "BLINK RECOMMENDATION"
      ),

      recommendation: getSection(
        "BLINK RECOMMENDATION",
        "EMAIL FOLLOW-UP"
      ),

      email: getSection(
        "EMAIL FOLLOW-UP",
        "WHATSAPP FOLLOW-UP"
      ),

      whatsapp: getSection(
        "WHATSAPP FOLLOW-UP",
        "NEXT BEST ACTION"
      ),

      nextBestAction: truncateRunawayTail(getSection(
        "NEXT BEST ACTION"
      ))
    };
  };

  const parseSummaryResponse = (text: string) => {
    const response = cleanResponseText(text);

    const getSection = (heading: string, nextHeadings: string[]) => {
      const startRegex = new RegExp(
        `(?:^|\\n)\\s*(?:[^\\w\\n]{0,4})?${heading}\\s*`,
        'i'
      );

      const startMatch = response.match(startRegex);

      if (!startMatch || startMatch.index === undefined) {
        return "";
      }

      const contentStart = startMatch.index + startMatch[0].length;

      let contentEnd = response.length;

      for (const nextHeading of nextHeadings) {
        const endRegex = new RegExp(
          `(?:^|\\n)\\s*(?:[^\\w\\n]{0,4})?${nextHeading}\\s*`,
          'i'
        );

        const remaining = response.slice(contentStart);
        const endMatch = remaining.match(endRegex);

        if (endMatch && endMatch.index !== undefined) {
          contentEnd = Math.min(
            contentEnd,
            contentStart + endMatch.index
          );
        }
      }

      return response
        .slice(contentStart, contentEnd)
        .trim();
    };

    return {
      quickSummary: getSection(
        "Quick Summary",
        ["Important Information", "Blink Insight", "Next Best Action"]
      ),

      importantInformation: getSection(
        "Important Information",
        ["Blink Insight", "Next Best Action"]
      ),

      insight: getSection(
        "Blink Insight",
        ["Next Best Action"]
      ),

      nextBestAction: truncateRunawayTail(getSection(
        "Next Best Action",
        []
      )),
    };
  };

  const parsePrioritiesResponse = (text: string) => {
    const response = cleanResponseText(text);

    const priorityMatches = [...response.matchAll(
      /PRIORITY\s+(\d+)([\s\S]*?)(?=PRIORITY\s+\d+|TODAY'S FOCUS|$)/gi
    )];

    const priorities = priorityMatches.map((match) => {
      const block = match[2].trim();

      const getValue = (label: string) => {
        const regex = new RegExp(
          `${label}:\\s*([\\s\\S]*?)(?=\\n[A-Za-z ]+:|$)`,
          'i'
        );

        return block.match(regex)?.[1]?.trim() || '';
      };

      return {
        number: match[1],
        client: getValue('Client'),
        company: getValue('Company'),
        amount: getValue('Amount Due'),
        dueDate: getValue('Due Date'),
        status: getValue('Status'),
        daysOverdue: getValue('Days Overdue'),
        recoveryStage: getValue('Recovery Stage'),
        why: getValue('Why It Matters'),
        action: getValue('Recommended Action'),
      };
    });

    const focusMatch = response.match(
      /TODAY'S FOCUS\s*([\s\S]*)$/i
    );

    return {
      priorities,
      focus: truncateRunawayTail(focusMatch?.[1]?.trim() || ''),
    };
  };

  const parseOverdueResponse = (text: string) => {
    const response = cleanResponseText(text);

    const getSection = (heading: string, nextHeadings: string[]) => {
      const startRegex = new RegExp(
        `(?:^|\\n)\\s*(?:[^\\w\\n]{0,4})?${heading}\\s*`,
        'i'
      );

      const startMatch = response.match(startRegex);

      if (!startMatch || startMatch.index === undefined) {
        return "";
      }

      const contentStart =
        startMatch.index + startMatch[0].length;

      let contentEnd = response.length;

      for (const nextHeading of nextHeadings) {
        const endRegex = new RegExp(
          `(?:^|\\n)\\s*(?:[^\\w\\n]{0,4})?${nextHeading}\\s*`,
          'i'
        );

        const remaining = response.slice(contentStart);
        const endMatch = remaining.match(endRegex);

        if (endMatch && endMatch.index !== undefined) {
          contentEnd = Math.min(
            contentEnd,
            contentStart + endMatch.index
          );
        }
      }

      return response
        .slice(contentStart, contentEnd)
        .trim();
    };

    const importantInformation = getSection(
      "IMPORTANT INFORMATION",
      ["BLINK RECOMMENDATION", "NEXT BEST ACTION"]
    );

    const priorityMatches = [
      ...importantInformation.matchAll(
        /(?:PRIORITY\s+(\d+)|[•*-]?\s*(\d+)\.\s+)([\s\S]*?)(?=(?:PRIORITY\s+\d+|[•*-]?\s*\d+\.\s+)|$)/gi
      ),
    ];

    const getValue = (block: string, label: string) => {
      const regex = new RegExp(
        `${label}:\\s*([\\s\\S]*?)(?=\\n[A-Za-z ]+:|$)`,
        'i'
      );

      return block.match(regex)?.[1]?.trim() || '';
    };

    const priorities = priorityMatches.map((match, index) => {
      const number = match[1] || match[2] || String(index + 1);
      const block = match[3].trim();

      const simpleMatch = block.match(
        /^(.+?)\s*-\s*(₹[\d,]+|Rs\.?\s*[\d,]+|\$[\d,]+)\s*\((\d+)\s+days?\s+overdue\)/i
      );

      if (simpleMatch) {
        return {
          number,
          client: simpleMatch[1].trim(),
          company: '',
          amount: simpleMatch[2].trim(),
          daysOverdue: simpleMatch[3].trim(),
          recoveryStage: '',
          why: '',
          action: '',
        };
      }

      return {
        number,
        client: getValue(block, 'Client'),
        company: getValue(block, 'Company'),
        amount: getValue(block, 'Amount Due'),
        daysOverdue: getValue(block, 'Days Overdue'),
        recoveryStage: getValue(block, 'Recovery Stage'),
        why: getValue(block, 'Why It Matters'),
        action: getValue(block, 'Recommended Action'),
      };
    });

    return {
      quickSummary: getSection(
        "QUICK SUMMARY",
        ["IMPORTANT INFORMATION"]
      ),

      priorities,

      recommendation: getSection(
        "BLINK RECOMMENDATION",
        ["NEXT BEST ACTION"]
      ),

      nextBestAction: truncateRunawayTail(getSection(
        "NEXT BEST ACTION",
        []
      )),
    };
  };

  const parseRewriteResponse = (text: string) => {
    const response = cleanResponseText(text);

    const getSection = (heading: string, nextHeadings: string[]) => {
      const startRegex = new RegExp(
        `(?:^|\\n)\\s*(?:[^\\w\\n]{0,4})?${heading}\\s*`,
        'i'
      );

      const startMatch = response.match(startRegex);

      if (!startMatch || startMatch.index === undefined) {
        return "";
      }

      const contentStart = startMatch.index + startMatch[0].length;

      let contentEnd = response.length;

      for (const nextHeading of nextHeadings) {
        const endRegex = new RegExp(
          `(?:^|\\n)\\s*(?:[^\\w\\n]{0,4})?${nextHeading}\\s*`,
          'i'
        );

        const remaining = response.slice(contentStart);
        const endMatch = remaining.match(endRegex);

        if (endMatch && endMatch.index !== undefined) {
          contentEnd = Math.min(
            contentEnd,
            contentStart + endMatch.index
          );
        }
      }

      return response
        .slice(contentStart, contentEnd)
        .trim();
    };

    return {
      quickSummary: getSection(
        "Quick Summary",
        ["Important Information", "Blink Recommendation", "Next Best Action"]
      ),

      importantInformation: getSection(
        "Important Information",
        ["Blink Recommendation", "Next Best Action"]
      ),

      recommendation: getSection(
        "Blink Recommendation",
        ["Next Best Action"]
      ),

      nextBestAction: truncateRunawayTail(getSection(
        "Next Best Action",
        []
      )),

      message: getSection(
        "REWRITTEN REMINDER",
        ["Blink Recommendation", "Next Best Action"]
      )
    };
  };

  const [sentChannel, setSentChannel] = useState<{ channel: 'email' | 'whatsapp'; clientId: string } | null>(null);
  const [markingSent, setMarkingSent] = useState(false);

  // Logs a manual send (user copied the drafted message and sent it themselves,
  // outside the app) so the next time Blink looks at this client it knows a
  // reminder actually went out — same reminderHistory shape as automated sends,
  // just with type: 'manual', so escalation stage stays accurate.
  const markAsSent = async (channel: 'email' | 'whatsapp') => {
    const targetId = selectedClientId;
    if (!targetId || markingSent) return;

    setMarkingSent(true);
    try {
      await updateDoc(doc(db, 'clients', targetId), {
        reminderHistory: arrayUnion({
          type: 'manual',
          channel,
          sentAt: new Date().toISOString(),
          label: channel === 'email' ? 'Manual email sent' : 'Manual WhatsApp sent',
        }),
      });
      setSentChannel({ channel, clientId: targetId });
      window.dispatchEvent(new Event('clients-updated'));
      setTimeout(() => setSentChannel(null), 2500);
    } catch {
      // Silent fail is acceptable here — worst case the history just isn't logged
      // and the user can try again; it should never block the Copy action.
    } finally {
      setMarkingSent(false);
    }
  };

  const copyFollowUpEmail = async (text: string) => {
    const followUp = parseFollowUpResponse(text);

    if (!followUp.email) return;

    await navigator.clipboard.writeText(followUp.email);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const copyFollowUpWhatsApp = async (text: string) => {
    const followUp = parseFollowUpResponse(text);

    if (!followUp.whatsapp) return;

    await navigator.clipboard.writeText(followUp.whatsapp);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const updateClientCount = useCallback(() => {
    try {
      const storedClients = clients.length > 0 ? clients : JSON.parse(localStorage.getItem('dueblink_clients') || '[]');
      setSavedClientsCount(storedClients.length);
    } catch {
      setSavedClientsCount(0);
    }
  }, [clients]);

  useEffect(() => {
    updateClientCount();
    window.addEventListener('storage', updateClientCount);
    window.addEventListener('clients-updated', updateClientCount);
    return () => {
      window.removeEventListener('storage', updateClientCount);
      window.removeEventListener('clients-updated', updateClientCount);
    };
  }, [updateClientCount]);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 150) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', checkScroll);
    checkScroll();
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true);
        if (user.displayName) {
          setUserName(user.displayName.split(' ')[0]);
        } else if (user.email) {
          const emailName = user.email.split('@')[0];
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }
      } else {
        setIsLoggedIn(false);
        setUserName('User');
      }
    });

    const timer = setTimeout(() => setIsVisible(true), 800);
    const saved = localStorage.getItem('freeReminders');
    if (saved) setRemainingFreeReminders(parseInt(saved));

    if (pathname !== '/dashboard' || isPro) {
      const loadMinimizeTimer = setTimeout(() => {
        setShowMessageBubble((prev) => (clickedSectionText ? prev : false));
      }, 6000);
      return () => clearTimeout(loadMinimizeTimer);
    }

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [pathname, isPro, clickedSectionText]);

  // Show Blink's "Hi, I'm Blink" greeting bubble automatically the very
  // first time a Pro user ever lands on the dashboard — persisted in
  // localStorage so it only shows once, not once per session/tab.
  useEffect(() => {
    if (pathname !== '/dashboard' || !isPro || !isLoggedIn) return;

    const alreadyGreeted = localStorage.getItem('blink_dashboard_greeted');
    if (alreadyGreeted) return;

    const greetTimer = setTimeout(() => {
      setClickedSectionText(null);
      setShowMessageBubble(true);
      localStorage.setItem('blink_dashboard_greeted', '1');
    }, 1200);

    return () => clearTimeout(greetTimer);
  }, [pathname, isPro, isLoggedIn]);

  useEffect(() => {
    if (externalAction && pathname === '/dashboard') {
      setIsExpanded(true);
      setShowMessageBubble(false);
      if (externalAction === 'summarize') {
        handleActionClick('summarize', 'Outstanding Summary');
      } else if (externalAction === 'recommend') {
        handleActionClick('recommend', 'Generate Follow-up');
      }
    }
  }, [externalAction, pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
        setShowMessageBubble(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (pathname === '/dashboard') return;

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        setClickedSectionText("Need help?\n\nClick me anytime.");
        setShowMessageBubble(true);
      }, 50000);
    };

    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
      window.removeEventListener('keypress', resetInactivityTimer);
    };
  }, [pathname]);

  const currentSectionIndexRef = useRef(currentSectionIndex);
  currentSectionIndexRef.current = currentSectionIndex;

  useEffect(() => {
    if (pathname === '/dashboard') return;

    const sectionIds = [
      'hero',
      'late-payments',
      'features',
      'built-for',
      'automated-reminders',
      'ai-recovery-assistant',
      'dashboard-preview',
      'reminder-generator',
      'reminder-examples',
      'how-it-works',
      'pricing',
      'faq',
      'final-cta'
    ];

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = sectionIds.indexOf(entry.target.id);
          if (index !== -1 && currentSectionIndexRef.current !== index) {
            setCurrentSectionIndex(index);
          }
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  const getCurrentMessages = () => {
    if (isLoggedIn && isPro) {
      return [
        "Your Pro workspace is ready.",
        "See everything DueBlink can do for your payments.",
        "Your complete payment recovery toolkit.",
        "Built for businesses that invoice and follow up.",
        "Set it once and let DueBlink follow up automatically.",
        "I can help you decide which payment to chase first.",
        "Your payment recovery activity, all in one place.",
        "Create unlimited AI payment reminders in seconds.",
        "See reminders for different payment stages.",
        "Add clients, follow up, and track payments.",
        "Your Pro plan unlocks the full recovery toolkit.",
        "Find quick answers to common questions.",
        "Ready to recover more payments?"
      ];
    } else if (isLoggedIn) {
      return [
        "Welcome back. Let's recover your payments.",
        "Stay on top of every payment you are owed.",
        "Your tools for faster payment recovery.",
        "Built for businesses that invoice and follow up.",
        "Let DueBlink handle your follow-ups automatically.",
        "Upgrade to Pro for smarter recovery recommendations.",
        "Manage your clients and payment activity here.",
        "Create AI payment reminders when you need them.",
        "See examples for different payment stages.",
        "Add clients, send reminders, and track payments.",
        "Upgrade when you need unlimited recovery tools.",
        "Find quick answers to common questions.",
        "Ready to get paid faster?"
      ];
    } else {
      return [
        "Start with 5 free AI reminders.",
        "Late payments are easier to manage with timely follow-ups.",
        "Everything you need to recover payments, in one place.",
        "Built for businesses that invoice and follow up.",
        "Set it once and let DueBlink follow up automatically.",
        "See how AI can help you recover payments.",
        "Your payment recovery workspace.",
        "Create a professional payment reminder in seconds.",
        "See reminders for different payment stages.",
        "Add a client, send reminders, and track payment.",
        "Start free, then upgrade when you need more.",
        "Find quick answers to common questions.",
        "Ready to get paid faster?"
      ];
    }
  };

  const handleRobotClick = () => {
    if (pathname === '/dashboard') {
      setIsExpanded(!isExpanded);
      setShowMessageBubble(false); 
      return;
    }

    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    const messages = getCurrentMessages();
    setClickedSectionText(messages[currentSectionIndex] || messages[0]);
    setShowMessageBubble((prev) => !prev);
  };

  const getActiveMessage = () => {
    if (pathname === '/dashboard') {
      if (isPro) {
        return `${greeting}, ${userName}!\n\nI'm Blink, your AI Recovery Assistant. ✨\n\nI'm here to analyze your client portfolio, prioritize overdue payments, and generate smart follow-ups for you!`;
      }
      return ""; 
    }

    if (clickedSectionText) {
      return clickedSectionText;
    }

    if (currentSectionIndex === null || currentSectionIndex === undefined) {
      return "Hi! I'm Blink.\n\nI'll help you explore DueBlink and show you how it can help you get paid faster.";
    }

    const messages = getCurrentMessages();
    return messages[currentSectionIndex] || messages[0] || "Hi! I'm Blink.\n\nI'll help you explore DueBlink and show you how it can help you get paid faster.";
  };

  const handleActionClick = async (
    actionId: string,
    actionTitle: string,
    clientId?: string
  ) => {
    if (!isPro) {
      router.push('/pricing');
      return;
    }
    if (uiState === 'processing') return;

    setActiveActionName(actionTitle);
    setActiveActionId(actionId);
    setUiState('processing');
    setAiResponse(null);
    setAllClientsPaid(false);

    if (onTrigger) {
      onTrigger(actionId);
    }

    try {
      const freshClients = clients;

      if (freshClients.length === 0) {
        setSavedClientsCount(0);
        setUiState('idle');
        return;
      }

      const hasActiveClient = freshClients.some(
        (c: any) => c.status !== 'Paid'
      );

      if (!hasActiveClient && actionId !== 'welcome_pro') {
        // Every client is already paid — nothing for the AI to analyze.
        // Show the dedicated "all caught up" card directly instead of
        // calling the API and hoping the parser matches a generic
        // status message it was never designed to parse.
        setSavedClientsCount(freshClients.length);
        setAllClientsPaid(true);
        setUiState('idle');
        return;
      }

      setSavedClientsCount(freshClients.length);
      const totalAmount = freshClients.reduce((acc: number, c: any) => acc + Number(c.amount || 0), 0);

      const resolvedClientId =
        clientId ||
        (recommendation
          ? freshClients.find((c: any) => c.id === recommendation.id)?.id
          : undefined);

      const targetClient = resolvedClientId
        ? freshClients.find((c: any) => c.id === resolvedClientId)
        : recommendation 
          ? freshClients.find((c: any) => c.name === recommendation.name) || freshClients[0] 
          : freshClients[0];

      const reminderHistory = Array.isArray(targetClient?.reminderHistory)
        ? targetClient.reminderHistory
        : [];

      const automatedRemindersSent = reminderHistory.filter(
        (r: any) =>
          r?.type === 'automated' &&
          r?.channel === 'email'
      );

      const lastAutomatedReminder =
        automatedRemindersSent.length > 0
          ? automatedRemindersSent[automatedRemindersSent.length - 1]
          : null;

      if (clientId) {
        setSelectedClientId(clientId);
      }

      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch('/api/pro-recovery-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: actionId,
          clientId: resolvedClientId || null,
          client: targetClient || null,
          clients: freshClients,
          total: totalAmount,
          automatedReminderContext: {
            enabled: targetClient?.automatedReminders === true,
            status: targetClient?.automationStatus || 'off',
            lastStage: targetClient?.lastAutomatedReminderStage || null,
            lastSentAt: targetClient?.lastAutomatedReminderSentAt || null,
            sentCount: automatedRemindersSent.length,
            lastReminder: lastAutomatedReminder
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
        }
      }

      setAiResponse(
        cleanResponseText(fullText) ||
        "Analysis complete. No urgent actions needed right now."
      );
    } catch {
      setAiResponse("Unable to fetch portfolio analysis right now. Please check your connection and try again.");
    } finally {
      setUiState('idle');
    }
  };

  const handleCopy = async () => {
    if (!aiResponse) return;
    await navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLandingAction = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else if (remainingFreeReminders > 0) {
      const newCount = remainingFreeReminders - 1;
      setRemainingFreeReminders(newCount);
      localStorage.setItem('freeReminders', newCount.toString());
      const element = document.getElementById('reminder-generator');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsExpanded(false);
        setShowMessageBubble(false);
      } else {
        router.push('/create-account');
      }
    } else {
      router.push('/create-account');
    }
  };

  const handleAddClientRedirect = () => {
    setIsExpanded(false);
    if (onOpenAddClient) {
      onOpenAddClient();
    } else {
      window.dispatchEvent(new CustomEvent('open-add-client-modal'));
    }
  };

  if (pathname === '/create-account' || pathname === '/login' || !isVisible) return null;

  const positioningClass = isScrolled 
    ? 'bottom-28 sm:bottom-32 right-6 sm:right-8' 
    : 'bottom-20 sm:bottom-24 right-6 sm:right-8';

  const activeClients = clients;

  return (
    <div 
      className={`blink-widget-root fixed z-[900] flex flex-col items-end gap-3 transition-all duration-200 ease-in-out ${positioningClass}`}
      suppressHydrationWarning={true}
    >
      <style>{`
        @keyframes blinkFadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .blink-widget-root .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
      `}</style>

      {/* 1. SCROLL GUIDANCE MESSAGE BUBBLE */}
      <AnimatePresence>
        {!isExpanded && showMessageBubble && (isPro || pathname !== '/dashboard') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/85 shadow-2xl rounded-2xl p-4 flex flex-col gap-2.5 max-w-[260px] sm:max-w-[280px] relative text-left transform-gpu will-change-transform"
            suppressHydrationWarning={true}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2" suppressHydrationWarning={true}>
              <div className="flex items-center gap-2" suppressHydrationWarning={true}>
                <div className="relative flex items-center justify-center w-2.5 h-2.5">
                  <div className={`absolute w-2.5 h-2.5 rounded-full opacity-75 ${isPro ? 'bg-[#20B8BE]' : 'bg-red-400'}`} />
                  <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-[#20B8BE]' : 'bg-red-500'}`} />
                </div>
                <div className="flex flex-col" suppressHydrationWarning={true}>
                  <p className="text-[10px] font-black text-[#245B92] uppercase tracking-wider leading-none">Blink</p>
                  <p className="text-[9px] font-semibold text-slate-400 tracking-wide mt-0.5">
                    {pathname === '/dashboard' ? "Your AI Recovery Assistant" : "Your DueBlink Guide"}
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMessageBubble(false);
                }} 
                className="text-[10px] font-bold text-slate-400 hover:text-slate-700 bg-slate-100/80 hover:bg-slate-200 px-2 py-0.5 rounded-full cursor-pointer transition flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#20B8BE]"
                aria-label="Close message bubble"
                suppressHydrationWarning={true}
              >
                <X size={10} /> Close
              </button>
            </div>

            <p className="text-[11px] text-slate-600 font-medium whitespace-pre-line leading-relaxed tracking-wide" suppressHydrationWarning={true}>
              {getActiveMessage()}
            </p>

            {pathname !== '/dashboard' && (isLoggedIn || currentSectionIndex === 0 || currentSectionIndex === 12 || clickedSectionText) && (
              <button 
                onClick={handleLandingAction} 
                className="mt-0.5 w-full bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white py-2 px-3 rounded-xl font-bold text-[11px] shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#245B92]"
                suppressHydrationWarning={true}
              >
                {isLoggedIn ? "Open Dashboard" : (isPro ? "Open Dashboard" : "Try 5 AI Reminders Free")} <ArrowRight size={12} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. DASHBOARD PROACTIVE RECOMMENDATION CARD */}
      <AnimatePresence>
        {!isExpanded && isLoggedIn && recommendation && showRecommendation && pathname === '/dashboard' && isPro && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/85 shadow-2xl rounded-2xl p-4 flex flex-col gap-2.5 cursor-pointer hover:border-[#20B8BE] transition-all max-w-[260px] sm:max-w-[280px] relative group transform-gpu will-change-transform"
            onClick={() => {
              if (!isPro) {
                router.push('/pricing');
                return;
              }
              setIsExpanded(true);
              handleActionClick('recommend', 'Generate Follow-up', recommendation.id);
            }}
            suppressHydrationWarning={true}
          >
            <button onClick={(e) => { e.stopPropagation(); setShowRecommendation(false); }} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition" aria-label="Close recommendation" suppressHydrationWarning={true}>
              <X size={12} />
            </button>
            <div suppressHydrationWarning={true}>
              <div className="flex items-center gap-1.5 mb-1" suppressHydrationWarning={true}>
                <span className="text-[9px] font-black text-[#245B92] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">Blink AI</span>
                <span className="text-[9px] font-medium text-slate-400">Action Required</span>
              </div>
              <p className="text-xs font-bold text-[#0F172A] mt-0.5 leading-snug" suppressHydrationWarning={true}>{recommendation.name} needs your attention today.</p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between" suppressHydrationWarning={true}>
              <div>
                <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>₹{Number(recommendation.amount).toLocaleString()}</p>
                <p className="text-[9px] font-bold text-[#20B8BE] uppercase tracking-wide mt-0.5" suppressHydrationWarning={true}>{recommendation.daysOverdue} Days Overdue</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[#245B92]">
                <Zap size={12} className="fill-[#20B8BE] text-[#20B8BE]" />
              </div>
            </div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!isPro) {
                  router.push('/pricing');
                  return;
                }
                setIsExpanded(true);
                handleActionClick('recommend', 'Generate Follow-up', recommendation.id); 
              }} 
              className="w-full text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#245B92]" 
              style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} 
              suppressHydrationWarning={true}
            >
              <span>Generate Follow-up</span> 
              <ChevronRight size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. EXPANDED PANEL WITH STRUCTURED FORMAT & REACTIVE EMPTY STATES */}
      <AnimatePresence>
        {isExpanded && pathname === '/dashboard' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
            className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-2xl w-[min(290px,calc(100vw-24px))] sm:w-[320px] max-h-[min(72vh,560px)] flex flex-col overflow-hidden transform-gpu will-change-transform"
            suppressHydrationWarning={true}
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#245B92] to-[#20B8BE] p-3.5 text-white relative overflow-hidden flex-shrink-0" suppressHydrationWarning={true}>
              <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-start relative z-10" suppressHydrationWarning={true}>
                <div className="flex items-center gap-2">
                  {aiResponse || uiState === 'processing' || savedClientsCount === 0 || clientPickerAction ? (
                    <button 
                      onClick={() => { 
                        if (clientPickerAction) {
                          setClientPickerAction(null);
                        } else {
                          setAiResponse(null); 
                          setActiveActionName(null); 
                          setActiveActionId(null); 
                          setSelectedClientId(null); 
                          setClientPickerAction(null); 
                          setAllClientsPaid(false);
                        }
                      }} 
                      className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner hover:bg-white/30 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Back"
                    >
                      <ArrowLeft size={14} className="text-white" />
                    </button>
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                      <Brain size={14} className="text-white" />
                    </div>
                  )}
                <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black tracking-wider uppercase text-[9px] text-white/90">Blink</h3>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPro ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="text-[8px] font-bold text-white/80 uppercase">
                        {isPro ? 'Online' : 'Locked'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5 truncate max-w-[160px]">
                      {clientPickerAction ? clientPickerAction.name : (activeActionName ? activeActionName : 'Your AI Recovery Assistant')}
                    </p>
                  </div>
              </div>
              <motion.button 
                whileHover={{ rotate: 90, scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                onClick={() => { setIsExpanded(false); setAiResponse(null); setActiveActionName(null); setActiveActionId(null); setSelectedClientId(null); setClientPickerAction(null); setAllClientsPaid(false); }} 
                className="text-white/70 hover:text-white bg-white/15 hover:bg-white/25 p-1.5 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close panel"
                suppressHydrationWarning={true}
              >
                <X size={12} />
              </motion.button>
            </div>

            {!aiResponse && uiState !== 'processing' && savedClientsCount > 0 && !clientPickerAction && (
              <div className="mt-2.5 pt-2 border-t border-white/15 text-left" suppressHydrationWarning={true}>
                <p className="text-[11px] font-bold text-white/90">{greeting}, {userName}!</p>
                <p className="text-[10px] text-white/80 font-medium mt-0.5">What can I help you with today?</p>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-3.5 overflow-y-auto flex-1 text-xs" suppressHydrationWarning={true}>
            {isLoggedIn ? (
              isPro ? (
                (savedClientsCount === 0 || allClientsPaid) && activeActionId ? (
                  <div className="space-y-3 text-left py-1" suppressHydrationWarning={true}>
                    <div className={`border rounded-xl p-3.5 space-y-2.5 ${allClientsPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${allClientsPaid ? 'text-emerald-700 bg-emerald-100' : 'text-[#245B92] bg-blue-50'}`}>
                          {allClientsPaid ? 'All Caught Up' : 'Blink Guide'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          {allClientsPaid ? (
                            "Every Client is Paid 🎉"
                          ) : (
                            <>
                              {activeActionId === 'recommend' && "No Clients Found"}
                              {activeActionId === 'priorities' && "Nothing to Review"}
                              {activeActionId === 'summarize' && "No Payment Data"}
                              {activeActionId === 'rewrite' && "No Reminder Available"}
                              {activeActionId === 'overdue' && "No Overdue Clients"}
                            </>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                          {allClientsPaid ? (
                            "All payments have been successfully recovered. There's nothing for Blink to follow up on right now — nice work!"
                          ) : (
                            <>
                              {activeActionId === 'recommend' && "You haven't added any clients yet. Blink needs at least one client to generate an AI follow-up."}
                              {activeActionId === 'priorities' && "You don't have any clients yet. Once you add clients, Blink will automatically identify who needs your attention first."}
                              {activeActionId === 'summarize' && "There are no clients or invoices to analyze. Your payment insights will appear here after you add your first client."}
                              {activeActionId === 'rewrite' && "There isn't a reminder to rewrite yet. Generate your first AI reminder after adding a client."}
                              {activeActionId === 'overdue' && "You haven't added any clients yet. Blink will automatically detect overdue payments after client information is added."}
                            </>
                          )}
                        </p>
                      </div>
                      <div className={`pt-2 border-t ${allClientsPaid ? 'border-emerald-200/60' : 'border-slate-200/60'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${allClientsPaid ? 'text-emerald-600' : 'text-[#20B8BE]'}`}>Next Step</p>
                        <p className="text-[11px] text-slate-700 font-semibold mt-0.5">
                          {allClientsPaid ? "Add a new client to keep tracking payments." : "Add your first client to get started."}
                        </p>
                      </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleAddClientRedirect}
                      className="w-full py-2.5 rounded-xl text-white font-bold text-[11px] shadow-md transition-shadow hover:shadow-lg bg-gradient-to-r from-[#245B92] to-[#20B8BE] cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#245B92]"
                    >
                      <UserPlus size={13} /> Add New Client
                    </motion.button>

                    <button 
                      onClick={() => { setAiResponse(null); setActiveActionName(null); setActiveActionId(null); setSelectedClientId(null); setClientPickerAction(null); setAllClientsPaid(false); }}
                      className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-[11px] hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ArrowLeft size={12} /> Back
                    </button>
                  </div>
                ) : aiResponse || uiState === 'processing' ? (
                  <div className="py-1 space-y-2.5 text-left" suppressHydrationWarning={true}>
                    {uiState === 'processing' ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-3 text-slate-400">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <span className="absolute inset-0 rounded-full bg-[#20B8BE]/20 animate-ping" />
                          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#245B92]/10 to-[#20B8BE]/10" />
                          <Brain size={20} className="relative text-[#20B8BE] animate-pulse" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-bold tracking-wide text-slate-500">Blink is analyzing</p>
                          <span className="flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-[#20B8BE] animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 rounded-full bg-[#20B8BE] animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 rounded-full bg-[#20B8BE] animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={`${activeActionId}-${(aiResponse || '').length}`}
                        style={{ animation: 'blinkFadeSlideUp 0.4s ease-out' }}
                        className="space-y-3"
                      >
                        {activeActionId === 'recommend' ? (
                          (() => {
                            const followUp = parseFollowUpResponse(aiResponse || '');

                            return (
                              <div className="space-y-3 text-left">

                                {/* Title */}
                                <div className="flex items-center gap-1.5 px-1">
                                  <Brain size={13} className="text-[#20B8BE]" />
                                  <span className="text-[11px] font-black text-slate-900">
                                    Generate Follow-up
                                  </span>
                                </div>

                                {/* Client */}
                                {followUp.snapshot && (
                                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-[11px] font-black text-slate-900 truncate">
                                        {followUp.snapshot
                                          .split('\n')
                                          .find(line => line.toLowerCase().startsWith('client:'))
                                          ?.replace(/^client:\s*/i, '') || 'Selected Client'}
                                      </p>

                                      <span className="shrink-0 text-[8px] font-bold text-[#245B92] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                        Recovery
                                      </span>
                                    </div>

                                    <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                                      {followUp.snapshot
                                        .split('\n')
                                        .filter(line =>
                                          /amount due:|due date:|status:|days overdue:|automation:|last automated stage:/i.test(line)
                                        )
                                        .map(line =>
                                          line
                                            .replace(/^amount due:\s*/i, '')
                                            .replace(/^due date:\s*/i, 'Due ')
                                            .replace(/^status:\s*/i, '')
                                            .replace(/^days overdue:\s*/i, '')
                                            .replace(/^automation:\s*/i, '')
                                            .replace(/^last automated stage:\s*/i, '')
                                        )
                                        .join(' · ')}
                                    </p>
                                  </div>
                                )}

                                {/* Recovery */}
                                {(followUp.recoveryStatus || followUp.recommendation) && (
                                  <div className="rounded-lg bg-teal-50/60 border border-teal-100 px-2.5 py-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Zap size={10} className="text-[#20B8BE]" />
                                      <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                        Recovery
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-700 leading-relaxed">
                                      {followUp.recommendation || followUp.recoveryStatus}
                                    </p>
                                  </div>
                                )}

                                {/* Email */}
                                {followUp.email && (
                                  <div className="rounded-lg bg-blue-50/50 border border-blue-100 px-2.5 py-2">

                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <Mail size={11} className="text-[#245B92]" />
                                        <span className="text-[8px] font-black uppercase tracking-wider text-[#245B92]">
                                          Email
                                        </span>
                                      </div>

                                      <span className="text-[8px] font-bold text-[#245B92]">
                                        Ready
                                      </span>
                                    </div>

                                    <div className="px-1 text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap max-h-[18vh] sm:max-h-[110px] overflow-y-auto scroll-smooth">
                                      {followUp.email}
                                    </div>

                                    <div className="flex gap-1.5 mt-2">
                                      <button
                                        onClick={() => copyFollowUpEmail(aiResponse || '')}
                                        className="py-1.5 px-2.5 rounded-lg bg-white text-[#245B92] border border-slate-200 hover:border-[#245B92]/40 hover:bg-blue-50/40 font-bold text-[9px] transition flex items-center justify-center gap-1 cursor-pointer overflow-hidden"
                                      >
                                        <AnimatePresence mode="wait" initial={false}>
                                          {copied ? (
                                            <motion.span
                                              key="copied"
                                              initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
                                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                              exit={{ opacity: 0, scale: 0.4 }}
                                              transition={{ type: "spring", stiffness: 500, damping: 18 }}
                                              className="flex items-center gap-1"
                                            >
                                              <Check size={10} /> Copied
                                            </motion.span>
                                          ) : (
                                            <motion.span
                                              key="copy"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              exit={{ opacity: 0 }}
                                              className="flex items-center gap-1"
                                            >
                                              <Copy size={10} /> Copy
                                            </motion.span>
                                          )}
                                        </AnimatePresence>
                                      </button>

                                      <button
                                        onClick={() =>
                                          handleActionClick(
                                            'rewrite',
                                            'Rewrite Reminder',
                                            selectedClientId || undefined
                                          )
                                        }
                                        className="py-1.5 px-2.5 rounded-lg bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold text-[9px] transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <RefreshCw size={10} className="text-slate-400" />
                                        Rewrite
                                      </button>

                                      <motion.button
                                        onClick={() => markAsSent('email')}
                                        disabled={markingSent || !selectedClientId}
                                        animate={
                                          sentChannel?.channel === 'email' && sentChannel.clientId === selectedClientId
                                            ? { scale: [1, 1.12, 1] }
                                            : { scale: 1 }
                                        }
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[9px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                          sentChannel?.channel === 'email' && sentChannel.clientId === selectedClientId
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90'
                                        }`}
                                      >
                                        <AnimatePresence mode="wait" initial={false}>
                                          {sentChannel?.channel === 'email' && sentChannel.clientId === selectedClientId ? (
                                            <motion.span
                                              key="sent"
                                              initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                              exit={{ opacity: 0, scale: 0.5 }}
                                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                              className="flex items-center gap-1"
                                            >
                                              <CheckCircle2 size={11} /> Sent
                                            </motion.span>
                                          ) : (
                                            <motion.span
                                              key="mark"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              exit={{ opacity: 0 }}
                                              className="flex items-center gap-1"
                                            >
                                              <Check size={11} /> Mark as Sent
                                            </motion.span>
                                          )}
                                        </AnimatePresence>
                                      </motion.button>
                                    </div>

                                  </div>
                                )}

                                {/* WhatsApp */}
                                {followUp.whatsapp && (
                                  <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 px-2.5 py-2">

                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <MessageCircle size={11} className="text-[#159A9F]" />
                                      <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                        WhatsApp
                                      </span>
                                    </div>

                                    <span className="text-[8px] font-bold text-[#159A9F]">
                                      Ready
                                    </span>
                                  </div>

                                  <div className="px-1 text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap max-h-[14vh] sm:max-h-[85px] overflow-y-auto scroll-smooth">
                                    {followUp.whatsapp}
                                  </div>

                                  <div className="flex gap-1.5 mt-2">
                                    <button
                                      onClick={() => copyFollowUpWhatsApp(aiResponse || '')}
                                      className="py-1.5 px-2.5 rounded-lg bg-white text-[#159A9F] border border-emerald-100 hover:border-[#159A9F]/40 hover:bg-emerald-50/40 font-bold text-[9px] transition flex items-center justify-center gap-1 cursor-pointer overflow-hidden"
                                    >
                                      <AnimatePresence mode="wait" initial={false}>
                                        {copied ? (
                                          <motion.span
                                            key="copied"
                                            initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            exit={{ opacity: 0, scale: 0.4 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 18 }}
                                            className="flex items-center gap-1"
                                          >
                                            <Check size={10} /> Copied
                                          </motion.span>
                                        ) : (
                                          <motion.span
                                            key="copy"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-1"
                                          >
                                            <Copy size={10} /> Copy
                                          </motion.span>
                                        )}
                                      </AnimatePresence>
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleActionClick(
                                          'rewrite',
                                          'Rewrite Reminder',
                                          selectedClientId || undefined
                                        )
                                      }
                                      className="py-1.5 px-2.5 rounded-lg bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold text-[9px] transition flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <RefreshCw size={10} className="text-slate-400" />
                                      Rewrite
                                    </button>

                                    <motion.button
                                      onClick={() => markAsSent('whatsapp')}
                                      disabled={markingSent || !selectedClientId}
                                      animate={
                                        sentChannel?.channel === 'whatsapp' && sentChannel.clientId === selectedClientId
                                          ? { scale: [1, 1.12, 1] }
                                          : { scale: 1 }
                                      }
                                      transition={{ duration: 0.4, ease: "easeOut" }}
                                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[9px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                        sentChannel?.channel === 'whatsapp' && sentChannel.clientId === selectedClientId
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90'
                                      }`}
                                    >
                                      <AnimatePresence mode="wait" initial={false}>
                                        {sentChannel?.channel === 'whatsapp' && sentChannel.clientId === selectedClientId ? (
                                          <motion.span
                                            key="sent"
                                            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                            className="flex items-center gap-1"
                                          >
                                            <CheckCircle2 size={11} /> Sent
                                          </motion.span>
                                        ) : (
                                          <motion.span
                                            key="mark"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-1"
                                          >
                                            <Check size={11} /> Mark as Sent
                                          </motion.span>
                                        )}
                                      </AnimatePresence>
                                    </motion.button>
                                  </div>

                                </div>
                                )}

                                {/* Next Best Action */}
                                {followUp.nextBestAction && (
                                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <ArrowRight size={10} className="text-[#20B8BE]" />
                                      <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                        Next Best Action
                                      </span>
                                    </div>

                                    <p className="text-[10px] text-slate-700 font-semibold leading-relaxed">
                                      {followUp.nextBestAction}
                                    </p>
                                  </div>
                                )}

                              </div>
                            );
                          })()
                        ) : activeActionId === 'priorities' ? (
                            (() => {
                              const priorityData = parsePrioritiesResponse(aiResponse || '');

                              return (
                                <div className="space-y-3 text-left">

                                  {/* Header */}
                                  <div className="flex items-center gap-1.5 px-1">
                                    <Zap size={13} className="text-[#20B8BE]" />
                                    <span className="text-[11px] font-black text-slate-900">
                                      Today's Priorities
                                    </span>
                                  </div>

                                  {/* Priority list */}
                                  <div className="space-y-1.5">
                                    {priorityData.priorities.map((priority: any) => (
                                      <div
                                        key={priority.number}
                                        className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2"
                                      >
                                        <div className="flex items-center justify-between gap-2">

                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[8px] font-black text-[#245B92] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                                #{priority.number}
                                              </span>

                                              <p className="text-[10px] font-black text-slate-900 truncate">
                                                {priority.client || 'Client'}
                                              </p>
                                            </div>

                                            <p className="text-[9px] text-slate-500 mt-1 truncate">
                                              {priority.amount &&
                                                (priority.amount.trim().startsWith('₹')
                                                  ? priority.amount
                                                  : `₹${priority.amount}`)}
                                              {priority.daysOverdue
                                                ? ` · ${priority.daysOverdue} days overdue`
                                                : ''}
                                            </p>

                                            {priority.action && (
                                              <p className="text-[9px] text-slate-600 mt-1 leading-relaxed">
                                                {priority.action}
                                              </p>
                                            )}
                                          </div>

                                          <button
                                            onClick={() => {
                                              const matchedClient = activeClients.find(
                                                (client: any) =>
                                                  client.name?.toLowerCase() === priority.client?.toLowerCase()
                                              );

                                              if (matchedClient) {
                                                setSelectedClientId(matchedClient.id);
                                                setAiResponse(null);
                                                handleActionClick(
                                                  'recommend',
                                                  'Generate Follow-up',
                                                  matchedClient.id
                                                );
                                              }
                                            }}
                                            className="shrink-0 px-2 py-1.5 rounded-lg bg-blue-50 text-[#245B92] border border-blue-100 hover:bg-blue-100 font-bold text-[8px] transition flex items-center gap-1 cursor-pointer"
                                          >
                                            <Sparkles size={9} className="text-[#20B8BE]" />
                                            Follow-up
                                          </button>

                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Today's focus */}
                                  {priorityData.focus && (
                                    <div className="rounded-lg bg-teal-50/60 border border-teal-100 px-2.5 py-2">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <ArrowRight size={10} className="text-[#20B8BE]" />
                                        <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                          Today's Focus
                                        </span>
                                      </div>

                                      <p className="text-[10px] text-slate-700 leading-relaxed">
                                        {priorityData.focus}
                                      </p>
                                    </div>
                                  )}

                                </div>
                              );
                            })()
                        ) : activeActionId === 'summarize' ? (
                            (() => {
                              const summary = parseSummaryResponse(aiResponse || '');

                              return (
                                <div className="space-y-2.5 text-left">

                                  {/* Header */}
                                  <div className="flex items-center gap-1.5 px-1">
                                    <BarChart3 size={13} className="text-[#20B8BE]" />
                                    <span className="text-[11px] font-black text-slate-900">
                                      Outstanding Summary
                                    </span>
                                  </div>

                                  {/* Quick Summary */}
                                  {summary.quickSummary && (
                                    <div className="px-1">
                                      <p className="text-[9px] font-black uppercase tracking-wider text-[#245B92]">
                                        Quick Summary
                                      </p>
                                      <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">
                                        {summary.quickSummary}
                                      </p>
                                    </div>
                                  )}

                                  {/* Important Information */}
                                  {summary.importantInformation && (
                                    <div className="space-y-1.5">

                                      <p className="text-[9px] font-black uppercase tracking-wider text-[#245B92] px-1">
                                        Important Information
                                      </p>

                                      {(() => {
                                        const info = summary.importantInformation;

                                        const outstanding =
                                          info.match(/Outstanding Amount:\s*([^\n]+)/i)?.[1]?.trim() || '₹0';

                                        const pending =
                                          info.match(/Pending Clients:\s*(\d+)/i)?.[1] || '0';

                                        const overdue =
                                          info.match(/Overdue Clients:\s*(\d+)/i)?.[1] || '0';

                                        const paid =
                                          info.match(/Paid Clients:\s*(\d+)/i)?.[1] || '0';

                                        return (
                                          <div className="grid grid-cols-2 gap-1.5">

                                            {/* Outstanding */}
                                            <div className="rounded-lg bg-blue-50/70 border border-blue-100 px-2.5 py-2">
                                              <p className="text-[8px] font-bold uppercase tracking-wider text-[#245B92]">
                                                Outstanding
                                              </p>
                                              <p className="text-[12px] font-black text-[#245B92] mt-0.5 truncate">
                                                {outstanding}
                                              </p>
                                            </div>

                                            {/* Pending */}
                                            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
                                              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                                Pending
                                              </p>
                                              <p className="text-[12px] font-black text-slate-800 mt-0.5">
                                                {pending}
                                                <span className="text-[8px] font-semibold text-slate-400 ml-1">
                                                  Clients
                                                </span>
                                              </p>
                                            </div>

                                            {/* Overdue */}
                                            <div className="rounded-lg bg-amber-50/70 border border-amber-100 px-2.5 py-2">
                                              <p className="text-[8px] font-bold uppercase tracking-wider text-amber-700">
                                                Overdue
                                              </p>
                                              <p className="text-[12px] font-black text-amber-700 mt-0.5">
                                                {overdue}
                                                <span className="text-[8px] font-semibold text-amber-600 ml-1">
                                                  Clients
                                                </span>
                                              </p>
                                            </div>

                                            {/* Paid */}
                                            <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 px-2.5 py-2">
                                              <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-700">
                                                Paid
                                              </p>
                                              <p className="text-[12px] font-black text-emerald-700 mt-0.5">
                                                {paid}
                                                <span className="text-[8px] font-semibold text-emerald-600 ml-1">
                                                  Clients
                                                </span>
                                              </p>
                                            </div>

                                          </div>
                                        );
                                      })()}


                                    </div>
                                  )}

                                  {/* Blink Insight */}
                                  {summary.insight && (
                                    <div className="rounded-lg bg-teal-50/60 border border-teal-100 px-2.5 py-2">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <Zap size={10} className="text-[#20B8BE]" />
                                        <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                          Blink Insight
                                        </span>
                                      </div>

                                      <p className="text-[10px] text-slate-700 leading-relaxed">
                                        {summary.insight}
                                      </p>
                                    </div>
                                  )}

                                  {/* Next Best Action */}
                                  {summary.nextBestAction && (
                                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <ArrowRight size={10} className="text-[#20B8BE]" />
                                        <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                          Next Best Action
                                        </span>
                                      </div>

                                      <p className="text-[10px] text-slate-700 font-semibold leading-relaxed">
                                        {summary.nextBestAction}
                                      </p>
                                    </div>
                                  )}

                                </div>
                              );
                            })()
                        ) : activeActionId === 'rewrite' ? (
                            (() => {
                              const rewrite = parseRewriteResponse(aiResponse || '');

                              return (
                                <div className="space-y-2.5 text-left">

                                  {/* Header */}
                                  <div className="flex items-center gap-1.5 px-1">
                                    <Clock size={13} className="text-[#20B8BE]" />
                                    <span className="text-[11px] font-black text-slate-900">
                                      Rewrite Reminder
                                    </span>
                                  </div>

                                  {/* Quick Summary */}
                                  {rewrite.quickSummary && (
                                    <div className="px-1">
                                      <p className="text-[9px] font-black uppercase tracking-wider text-[#245B92]">
                                      Quick Summary
                                      </p>

                                      <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">
                                        {rewrite.quickSummary}
                                      </p>
                                    </div>
                                  )}

                                  {/* Important Information */}
                                  {rewrite.importantInformation && (
                                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
                                      <p className="text-[9px] font-black uppercase tracking-wider text-[#245B92] mb-1">
                                        Important Information
                                      </p>

                                      <div className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {rewrite.importantInformation}
                                      </div>
                                    </div>
                                  )}

                                  {/* Rewritten Reminder */}
                                  {rewrite.message && (
                                    <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-2.5 py-2">

                                      <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <Mail size={11} className="text-[#245B92]" />

                                          <span className="text-[8px] font-black uppercase tracking-wider text-[#245B92]">
                                            Rewritten Reminder
                                          </span>
                                        </div>

                                        <span className="text-[8px] font-bold text-[#245B92]">
                                          Ready
                                        </span>
                                      </div>

                                      <div className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[18vh] sm:max-h-[120px] overflow-y-auto scroll-smooth">
                                        {rewrite.message}
                                      </div>

                                      <button
                                        onClick={handleCopy}
                                        className="w-full mt-2 py-1.5 px-2 rounded-lg bg-blue-50 text-[#245B92] border border-blue-100 hover:bg-blue-100 font-bold text-[9px] transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        {copied ? <Check size={10} /> : <Copy size={10} />}
                                        {copied ? 'Copied' : 'Copy Reminder'}
                                      </button>

                                    </div>
                                  )}

                                  {/* Blink Recommendation */}
                                  {rewrite.recommendation && (
                                    <div className="rounded-lg bg-teal-50/60 border border-teal-100 px-2.5 py-2">

                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <Zap size={10} className="text-[#20B8BE]" />

                                        <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                          Blink Recommendation
                                        </span>
                                      </div>

                                      <p className="text-[10px] text-slate-700 leading-relaxed">
                                        {rewrite.recommendation}
                                      </p>

                                    </div>
                                  )}

                                  {/* Next Best Action */}
                                  {rewrite.nextBestAction && (
                                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">

                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <ArrowRight size={10} className="text-[#20B8BE]" />

                                        <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                          Next Best Action
                                        </span>
                                      </div>

                                      <p className="text-[10px] text-slate-700 font-semibold leading-relaxed">
                                        {rewrite.nextBestAction}
                                      </p>

                                    </div>
                                  )}

                                </div>
                              );
                            })()
                        ) : activeActionId === 'overdue' ? (
                            (() => {
                              const overdue = parseOverdueResponse(aiResponse || '');

                              return (
                                <div className="space-y-2.5 text-left">

                                  {/* Header */}
                                  <div className="flex items-center gap-1.5 px-1">
                                    <Users size={13} className="text-[#20B8BE]" />
                                    <span className="text-[11px] font-black text-slate-900">
                                      Find Overdue Clients
                                    </span>
                                  </div>

                                  {/* Quick Summary */}
                                  {overdue.quickSummary && (
                                    <div className="px-1">
                                      <p className="text-[9px] font-black uppercase tracking-wider text-[#245B92]">
                                      Quick Summary
                                      </p>

                                      <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">
                                        {overdue.quickSummary}
                                      </p>
                                    </div>
                                  )}

                                  {/* Overdue Recovery Queue */}
                                  {overdue.priorities.length > 0 && (
                                  <div className="space-y-1.5">

                                    <p className="text-[9px] font-black uppercase tracking-wider text-[#245B92] px-1">
                                      Overdue Recovery Queue
                                    </p>

                                    {overdue.priorities.map((priority: any) => (
                                      <div
                                        key={priority.number}
                                        className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2"
                                      >

                                        {/* Client header */}
                                        <div className="flex items-center justify-between gap-2">

                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="shrink-0 text-[8px] font-black text-[#245B92] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                              #{priority.number}
                                            </span>

                                            <p className="text-[10px] font-black text-slate-900 truncate">
                                              {priority.client || 'Client'}
                                            </p>
                                          </div>

                                          {priority.recoveryStage && (
                                            <span className="shrink-0 text-[8px] font-bold text-[#159A9F] bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-full">
                                              {priority.recoveryStage}
                                            </span>
                                          )}

                                        </div>

                                        {/* Amount + overdue */}
                                        <div className="flex items-center gap-1.5 mt-1.5">

                                          {priority.amount && (
                                            <span className="text-[9px] font-bold text-slate-700">
                                              {priority.amount.trim().startsWith('₹')
                                                ? priority.amount
                                                : `₹${priority.amount}`}
                                            </span>
                                          )}

                                          {priority.daysOverdue && (
                                            <span className="text-[8px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                              {priority.daysOverdue} days overdue
                                            </span>
                                          )}

                                        </div>

                                        {/* Company */}
                                        {priority.company && priority.company !== 'N/A' && (
                                          <p className="text-[8px] text-slate-400 mt-1 truncate">
                                            {priority.company}
                                          </p>
                                        )}

                                        {/* Why it matters */}
                                        {priority.why && (
                                          <div className="mt-1.5">
                                            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                                              Why It Matters
                                            </p>

                                            <p className="text-[9px] text-slate-600 leading-relaxed mt-0.5">
                                              {priority.why}
                                            </p>
                                          </div>
                                        )}

                                        {/* Recommended action */}
                                        {priority.action && (
                                          <div className="mt-1.5 border-l-2 border-[#20B8BE] pl-2">
                                            <p className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                              Recommended Action
                                            </p>

                                            <p className="text-[9px] text-slate-700 font-semibold leading-relaxed mt-0.5">
                                              {priority.action}
                                            </p>
                                          </div>
                                        )}

                                        {/* Follow-up */}
                                        {priority.client && (
                                          <button
                                            onClick={() => {
                                              const matchedClient = activeClients.find(
                                                (client: any) =>
                                                  client.name?.toLowerCase() ===
                                                  priority.client?.toLowerCase()
                                              );

                                              if (matchedClient) {
                                                setSelectedClientId(matchedClient.id);
                                                setAiResponse(null);

                                                handleActionClick(
                                                  'recommend',
                                                  'Generate Follow-up',
                                                  matchedClient.id
                                                );
                                              }
                                            }}
                                            className="w-full mt-2 py-1.5 px-2 rounded-lg bg-blue-50 text-[#245B92] border border-blue-100 hover:bg-blue-100 font-bold text-[9px] transition flex items-center justify-center gap-1 cursor-pointer"
                                          >
                                            <Sparkles size={10} className="text-[#20B8BE]" />
                                            Generate Follow-up
                                          </button>
                                        )}

                                      </div>
                                    ))}

                                </div>
                                )}

                                  {/* Blink Recommendation */}
                                  {overdue.recommendation && (
                                    <div className="rounded-lg bg-teal-50/60 border border-teal-100 px-2.5 py-2">

                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <Zap size={10} className="text-[#20B8BE]" />

                                        <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                          Blink Recommendation
                                        </span>
                                      </div>

                                      <p className="text-[10px] text-slate-700 leading-relaxed">
                                        {overdue.recommendation}
                                      </p>

                                    </div>
                                  )}

                                  {/* Next Best Action */}
                                  {overdue.nextBestAction && (
                                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">

                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <ArrowRight size={10} className="text-[#20B8BE]" />

                                        <span className="text-[8px] font-black uppercase tracking-wider text-[#159A9F]">
                                          Next Best Action
                                        </span>
                                      </div>

                                      <p className="text-[10px] text-slate-700 font-semibold leading-relaxed">
                                        {overdue.nextBestAction}
                                      </p>

                                    </div>
                                  )}

                                </div>
                              );
                            })()
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[10px] text-slate-700 font-medium whitespace-pre-wrap leading-relaxed break-words block w-full text-left max-h-[42vh] sm:max-h-[240px] overflow-y-auto scroll-smooth">
                            {aiResponse}
                          </div>
                        )}
                      </div>
                    )}
                  

                {activeActionId === 'recommend' && uiState !== 'processing' && (
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() =>
                        handleActionClick(
                          'recommend',
                          'Generate Follow-up',
                          selectedClientId || undefined
                        )
                      }
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-bold text-[9px] transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={10} className="text-[#20B8BE]" />
                      Regenerate
                    </button>
                    <button
                      onClick={() => {
                        setAiResponse(null);
                        setActiveActionName(null);
                        setActiveActionId(null);
                        setSelectedClientId(null);
                        setClientPickerAction(null);
                        setAllClientsPaid(false);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-[9px] transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft size={10} />
                      Back
                    </button>
                  </div>
                )}

                {uiState !== 'processing' && activeActionId !== 'recommend' && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {activeActionId === 'summarize' && (
                    <>
                      <button onClick={handleCopy} className="flex-1 py-1.5 px-2 rounded-lg bg-blue-50 text-[#245B92] border border-blue-100 hover:bg-blue-100 font-bold text-[9px] transition flex items-center justify-center gap-1.5 cursor-pointer">
                      {copied ? <Check size={11} className="text-emerald-400" /> : <Download size={11} />}
                      {copied ? 'Copied!' : 'Export Summary'}
                      </button>
                      <button onClick={() => handleActionClick('summarize', 'Outstanding Summary', selectedClientId || undefined)} className="flex-1 py-1.5 px-2 rounded-lg bg-blue-50 text-[#245B92] border border-blue-100 hover:bg-blue-100 font-bold text-[9px] transition flex items-center justify-center gap-1.5 cursor-pointer">
                      <RefreshCw size={11} className="text-[#20B8BE]" /> Analyze Again
                      </button>
                    </>
                  )}

                  {activeActionId === 'priorities' && (
                    <>
                      <button onClick={handleCopy} className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer col-span-2">
                      {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy Summary'}
                      </button>
                    </>
                  )}

                  {activeActionId === 'rewrite' && (
                    <>
                      <button
                        onClick={() =>
                          handleActionClick(
                            'rewrite',
                            'Rewrite Reminder',
                            selectedClientId || undefined
                          )
                        }
                        className="py-1.5 px-2 rounded-lg bg-blue-50 text-[#245B92] border border-blue-100 hover:bg-blue-100 font-bold text-[9px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw size={10} className="text-[#20B8BE]" />
                        Rewrite Again
                      </button>

                      <button
                        onClick={() => {
                          setAiResponse(null);
                          setActiveActionName(null);
                          setActiveActionId(null);
                          setSelectedClientId(null);
                          setClientPickerAction(null);
                          setAllClientsPaid(false);
                        }}
                        className="py-1.5 px-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-[9px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft size={10} />
                        Back
                      </button>
                    </>
                  )}

                  {activeActionId === 'overdue' && (
                    <>
                      <button
                        onClick={handleCopy}
                        className="py-1.5 px-2 rounded-lg bg-blue-50 text-[#245B92] border border-blue-100 hover:bg-blue-100 font-bold text-[9px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copied ? <Check size={10} /> : <Copy size={10} />}
                        {copied ? 'Copied!' : 'Copy List'}
                      </button>

                      <button
                        onClick={() =>
                          handleActionClick(
                            'overdue',
                            'Find Overdue Clients',
                            undefined
                          )
                        }
                        className="py-1.5 px-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-bold text-[9px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw size={10} className="text-[#20B8BE]" />
                        Refresh
                      </button>
                    </>
                  )}
                  </div>
                )}

                <button 
                  onClick={() => { setAiResponse(null); setActiveActionName(null); setActiveActionId(null); setSelectedClientId(null); setClientPickerAction(null); }}
                  className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-[11px] hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1 mt-1"
                >
                  <ArrowLeft size={12} /> Back to Quick Actions
                </button>
              </div>
            ) : clientPickerAction ? (
              <div className="space-y-2.5" suppressHydrationWarning={true}>
                <div className="mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Select Client
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Choose which client you want Blink to work on.
                  </p>
                </div>

                {clients.filter((client: any) => client.status !== 'Paid').length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <p className="text-[11px] font-bold text-emerald-700">All caught up! 🎉</p>
                    <p className="text-[10px] text-emerald-600 mt-1">
                      Every client is marked Paid, so there's nothing to follow up on right now.
                    </p>
                  </div>
                ) : (
                  clients.filter((client: any) => client.status !== 'Paid').map((client: any, index: number) => (
                  <motion.button
                    key={client.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, type: "spring", stiffness: 320, damping: 26 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setClientPickerAction(null);
                      handleActionClick(
                        clientPickerAction.id,
                        clientPickerAction.name,
                        client.id
                      );
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#20B8BE]/50 hover:bg-teal-50/20 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] text-slate-800 truncate">
                        {client.name}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {client.company || 'No company'} · ₹{Number(client.amount || 0).toLocaleString()}
                      </p>
                    </div>

                    <ChevronRight
                      size={13}
                      className="text-slate-300 flex-shrink-0"
                    />
                  </motion.button>
                  ))
                )}

                <button
                  onClick={() => setClientPickerAction(null)}
                  className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-[11px] hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowLeft size={12} className="inline mr-1" />
                  Back
                </button>
              </div>
            ) : (
              <div className="space-y-2" suppressHydrationWarning={true}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Choose an action</p>
                  <span className="text-[9px] font-bold text-[#20B8BE] bg-teal-50 px-2 py-0.5 rounded-full">Pro Active</span>
                </div>
                {[
                  { name: 'Generate Follow-up', id: 'recommend', icon: <Sparkles size={13}/>, desc: 'Generate an AI Email & WhatsApp follow-up' },
                  { name: "Today's Priorities", id: 'priorities', icon: <Brain size={13}/>, desc: 'See who needs your attention today' },
                  { name: 'Outstanding Summary', id: 'summarize', icon: <BarChart3 size={13}/>, desc: 'Analyze your outstanding payments' },
                  { name: 'Rewrite Reminder', id: 'rewrite', icon: <Clock size={13}/>, desc: 'Rewrite your reminder professionally' },
                  { name: 'Find Overdue Clients', id: 'overdue', icon: <Users size={13}/>, desc: 'Find clients with overdue payments' },
                ].map((act, index) => (
                  <motion.button 
                    key={act.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 320, damping: 26 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const clientSpecificActions = ['recommend', 'rewrite'];

                      if (clientSpecificActions.includes(act.id) && clients.length > 0) {
                        setClientPickerAction({
                          id: act.id,
                          name: act.name,
                        });
                      } else {
                        handleActionClick(act.id, act.name);
                      }
                    }}
                    className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-[#20B8BE]/50 hover:bg-teal-50/20 transition-colors duration-150 flex items-center justify-between group cursor-pointer shadow-2xs"
                    suppressHydrationWarning={true}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-[#20B8BE]/10 text-[#245B92] group-hover:text-[#20B8BE] flex items-center justify-center transition-colors flex-shrink-0">
                        {act.icon}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-[11px] text-slate-800 group-hover:text-[#245B92] transition-colors truncate">{act.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium truncate">{act.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={12} className="text-slate-300 group-hover:text-[#20B8BE] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
                  </motion.button>
                ))}

                <div className="pt-2 text-center border-t border-slate-100 mt-2">
                  <p className="text-[9px] font-medium text-slate-400">Powered by DueBlink AI</p>
                </div>
              </div>
            )
          ) : (
            <div className="py-3 text-center space-y-2.5" suppressHydrationWarning={true}>
              <div className="space-y-1">
                <h5 className="font-black text-xs text-slate-900">Unlock Pro Assistant</h5>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Upgrade to DueBlink Pro to generate instant AI follow-up messages and payment recovery strategies.
                </p>
              </div>
              <button 
                onClick={() => { setIsExpanded(false); router.push('/pricing'); }}
                className="w-full py-2.5 rounded-xl text-white font-bold text-[11px] shadow-md transition hover:opacity-95 bg-gradient-to-r from-[#245B92] to-[#20B8BE] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#245B92]"
              >
                Upgrade to Pro ✨
              </button>
              <div className="pt-1 text-center">
                <p className="text-[9px] font-medium text-slate-400">Powered by DueBlink AI</p>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-2" suppressHydrationWarning={true}>
            <p className="text-[11px] font-bold text-slate-800 mb-3 leading-relaxed" suppressHydrationWarning={true}>
              {remainingFreeReminders > 0 ? `Hi! You have ${remainingFreeReminders} free reminders remaining.` : "You've used your free reminders. Create an account to continue!"}
            </p>
            <button onClick={handleLandingAction} className="w-full text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer mb-2 focus:outline-none focus:ring-2 focus:ring-[#245B92]" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>
              <span>{remainingFreeReminders > 0 ? "Try 5 AI Reminders Free" : "Create Account"}</span> 
              <ArrowRight size={12} />
            </button>
            <div className="pt-1.5 text-center border-t border-slate-100">
              <p className="text-[9px] font-medium text-slate-400">Powered by DueBlink AI</p>
            </div>
          </div>
        )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>

    {/* 4. WIDGET BUTTON */}
    <motion.button 
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.05, y: -2 }} 
      whileTap={{ scale: 0.95 }}
      onClick={handleRobotClick}
      aria-label="Open Blink AI Assistant"
      className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-[#245B92] to-[#20B8BE] rounded-full shadow-2xl flex items-center justify-center border-4 border-white cursor-pointer overflow-hidden flex-shrink-0 transform-gpu will-change-transform focus:outline-none focus:ring-4 focus:ring-[#20B8BE]/40"
      suppressHydrationWarning={true}
    >
      {uiState === 'processing' && (
        <span className="absolute -inset-1 rounded-full bg-[#20B8BE]/40 animate-ping pointer-events-none" />
      )}
      <div className="w-full h-full pointer-events-none" style={{ backgroundImage: "url('/anima-bot.svg')", backgroundPosition: 'center', backgroundSize: '120%', backgroundRepeat: 'no-repeat' }} suppressHydrationWarning={true} />
    </motion.button>
   </div>
  );
}