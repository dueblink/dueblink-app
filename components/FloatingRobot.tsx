'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Brain, X, Sparkles, BarChart3, Clock, ArrowRight, Users, ChevronRight, Zap, ArrowLeft, Loader2, Copy, Check, Download, RefreshCw, UserPlus, Mail, MessageCircle, CheckCircle2, Wallet, CalendarCheck, Flag, Hourglass, Target, Scissors, Smile, ShieldCheck, Languages, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import BlinkChat from '@/components/BlinkChat';
import type { LucideIcon } from 'lucide-react';
import { formatAmountWithCurrency, formatTotalsByCurrency, normalizeLanguage, isIndianCurrency } from '@/lib/reminderRules';

// Landing page sections Blink reacts to, in the order they appear on the page.
// Same order as the sections on the landing page (app/page.tsx).
const LANDING_SECTION_IDS = [
  'hero',
  'reminder-generator',
  'late-payments',
  'how-it-works',
  'automated-reminders',
  'dashboard-preview',
  'reminder-examples',
  'built-for',
  'comparison',
  'pricing',
  'faq',
  'final-cta',
] as const;

// Sections where Blink's bubble also shows the main button.
const SECTIONS_WITH_BUTTON = ['hero', 'reminder-generator', 'final-cta'];

interface FloatingRobotProps {
  clients?: any[];
  onTrigger?: (action: string) => void;
  recommendation?: {
    id?: string;
    name: string;
    amount: string | number;
    currency?: string;
    daysOverdue: number;
  } | null;
  isPro?: boolean;
  externalAction?: string | null;
  // Optional client id to target when externalAction fires — lets a
  // parent-triggered action (e.g. a "Generate Follow-up" button on a
  // specific client row) open the assistant for THAT client instead of
  // silently falling back to the globally recommended one.
  externalActionClientId?: string | null;
  // Changes on every dashboard button press, so pressing "Write reminder"
  // again for the same client runs Blink again.
  externalActionNonce?: number;
  onOpenAddClient?: () => void;
  // Reports whether FloatingRobot is actively processing an action, so a
  // parent-side button (e.g. "View Recovery Summary") can show a real
  // loading state without needing its own separate API call.
  onProcessingChange?: (isProcessing: boolean) => void;
}

export default function FloatingRobot({
  clients = [],
  onTrigger,
  recommendation,
  isPro = false,
  externalAction = null,
  externalActionClientId = null,
  externalActionNonce = 0,
  onOpenAddClient,
  onProcessingChange
}: FloatingRobotProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(true);

  // Dismissing the recommendation card should only hide it for THAT
  // client — not silence the feature for the rest of the session. So
  // whenever the top recommendation actually changes to a different
  // client (new client added, someone paid, dates shifted), bring the
  // card back.
  useEffect(() => {
    setShowRecommendation(true);
  }, [recommendation?.id]);
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

  // ONE Blink answer at a time. Every new request gets a number; an older
  // answer that is still arriving is stopped and can never write into the
  // panel again. This is what stopped the screen jumping between two
  // answers, or showing plain text after you pressed Back.
  const blinkRequestIdRef = useRef(0);
  const blinkAbortRef = useRef<AbortController | null>(null);
  const blinkRunningRef = useRef<{ actionId: string; clientId: string } | null>(null);

  const stopBlinkRequest = () => {
    blinkRequestIdRef.current += 1;
    blinkAbortRef.current?.abort();
    blinkAbortRef.current = null;
    blinkRunningRef.current = null;
  };
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientPickerAction, setClientPickerAction] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  // Which Copy button was pressed, so only that one says "Copied".
  const [copiedWhich, setCopiedWhich] = useState<string | null>(null);
  // Generate Follow-up: which message is shown (one at a time, less clutter).
  const [followUpTab, setFollowUpTab] = useState<'whatsapp' | 'email' | null>(null);
  // Opened a client from Priorities / Overdue: Back returns to that list.
  const [returnTo, setReturnTo] = useState<{ actionId: string; name: string; response: string } | null>(null);
  // Quick edits ("Shorter", "In Hindi", or the owner's own note):
  // the edited text replaces the message on screen until a new answer.
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const editAbortRef = useRef<AbortController | null>(null);
  // Search box in the client picker (shown when there are many clients).
  const [pickerSearch, setPickerSearch] = useState('');
  // Loading screen: which step text is showing.
  const [loadingStep, setLoadingStep] = useState(0);

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

      // A heading is a short line that IS the heading. A sentence that
      // only mentions it ("lead with an email follow-up") must not count.
      return lines.findIndex((line) => {
        const normalized = normalizeHeading(line);
        return (
          normalized === target ||
          (normalized.includes(target) && normalized.length <= target.length + 6)
        );
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

        return (
          normalized === target ||
          (normalized.includes(target) && normalized.length <= target.length + 6)
        );
      });

      return contentLines
        .slice(0, endIndex === -1 ? contentLines.length : endIndex)
        .join("\n")
        .trim();
    };

    return {
      snapshot: getSection(
        "RECOVERY SNAPSHOT",
        "BLINK RECOMMENDATION"
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

      insight: truncateRunawayTail(getSection(
        "Blink Insight",
        ["Next Best Action"]
      )),

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
        clientId: getValue('Client ID'),
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
        clientId: getValue(block, 'Client ID'),
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
        ["Important Information", "REWRITTEN REMINDER", "Blink Recommendation", "Next Best Action"]
      ),

      importantInformation: getSection(
        "Important Information",
        ["REWRITTEN REMINDER", "Blink Recommendation", "Next Best Action"]
      ),

      recommendation: truncateRunawayTail(getSection(
        "Blink Recommendation",
        ["Next Best Action"]
      )),

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

  // Splits Blink's email text into a subject and a body.
  // Blink writes "Subject: ..." on the first line, then the message.
  const splitEmailText = (text: string) => {
    const lines = (text || '').split('\n');
    const subjectIndex = lines.findIndex((line) => /^\s*subject:/i.test(line));

    const subject =
      subjectIndex === -1
        ? 'Payment reminder'
        : lines[subjectIndex].replace(/^\s*subject:\s*/i, '').trim();

    const body = lines
      .filter((_, index) => index !== subjectIndex)
      .join('\n')
      .replace(/^\s*email body:\s*/im, '')
      .trim();

    return { subject, body };
  };

  // Opens the user's own email app or WhatsApp with the message
  // already filled in, then records it in the client's reminder
  // history so Blink knows this reminder went out.
  const sendReminder = (channel: 'email' | 'whatsapp', messageText: string) => {
    // Wait until Blink has finished writing before sending.
    if (!messageText || uiState === 'processing') return;

    const targetClient = clients.find((c: any) => c.id === selectedClientId);

    if (channel === 'email') {
      const { subject, body } = splitEmailText(messageText);
      const to = String(targetClient?.email || '').trim();

      window.location.href =
        `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      // Use the client's number if one is saved; a 10-digit number is
      // treated as Indian (+91). With no number, WhatsApp asks who to send to.
      let phone = String(targetClient?.phone || targetClient?.whatsapp || '').replace(/\D/g, '');
      if (phone.length === 10) phone = `91${phone}`;

      const url = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`
        : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

      window.open(url, '_blank', 'noopener,noreferrer');
    }

    markAsSent(channel);
  };

  // Copies just the rewritten reminder, not the whole Blink answer.
  const copyRewriteMessage = async (text: string) => {
    const message = parseRewriteResponse(text).message;
    if (!message || uiState === 'processing') return;

    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const copyFollowUpEmail = async (text: string) => {
    const followUp = parseFollowUpResponse(text);

    if (!followUp.email || uiState === 'processing') return;

    await navigator.clipboard.writeText(followUp.email);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const copyFollowUpWhatsApp = async (text: string) => {
    const followUp = parseFollowUpResponse(text);

    if (!followUp.whatsapp || uiState === 'processing') return;

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

  // Public pages: small "Ask me" pop-ups at the right moments.
  // Moments: interested (20 s + some scrolling), reaches Pricing,
  // reaches FAQ, or (computer) mouse heads to close the tab.
  // Rules: at most 2 per visit, 1 minute apart, none after ✕ or after
  // the chat is opened, each hides after 10 s. A new visit starts fresh,
  // unless the visitor chatted in the last 2 days.
  const NUDGE_MESSAGES: Record<string, { lead: string; ask: string }> = {
    interest: { lead: '👋 Questions?', ask: 'Ask me anything' },
    pricing: { lead: '💬 Not sure which plan fits you?', ask: 'Ask me' },
    faq: { lead: "🙋 Didn't find your answer?", ask: 'Ask me' },
    exit: { lead: 'Before you go 👋', ask: 'Any question about getting paid?' },
  };
  const [chatNudge, setChatNudge] = useState<string | null>(null);
  const showChatNudge = chatNudge !== null;
  const setShowChatNudge = (show: boolean) => { if (!show) setChatNudge(null); };
  const nudgeStateRef = useRef({ shown: 0, lastAt: 0, stopped: false, used: new Set<string>() });

  useEffect(() => {
    if (pathname === '/dashboard') return;
    const state = nudgeStateRef.current;

    // Chatted in the last 2 days, or said no (✕) this visit: stay quiet.
    try {
      const lastChat = Number(localStorage.getItem('blink_chat_opened_at') || 0);
      if (Date.now() - lastChat < 2 * 24 * 60 * 60 * 1000) state.stopped = true;
      if (sessionStorage.getItem('blink_nudge_dismissed')) state.stopped = true;
      state.shown = Math.max(state.shown, Number(sessionStorage.getItem('blink_nudge_count') || 0));
    } catch {
      // Storage blocked: the per-page limits below still apply.
    }

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const trigger = (moment: string) => {
      const now = Date.now();
      if (state.stopped || state.shown >= 2 || state.used.has(moment)) return;
      if (now - state.lastAt < 60 * 1000) return;
      state.used.add(moment);
      state.shown += 1;
      state.lastAt = now;
      try { sessionStorage.setItem('blink_nudge_count', String(state.shown)); } catch {}
      setChatNudge(moment);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setChatNudge(null), 10000);
    };

    // 1. Interested: 20 seconds on the page and scrolled a little.
    let timeOk = false;
    let scrolled = false;
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.5) {
        scrolled = true;
        if (timeOk) trigger('interest');
      }
    };
    const timeTimer = setTimeout(() => { timeOk = true; if (scrolled) trigger('interest'); }, 20000);
    window.addEventListener('scroll', onScroll, { passive: true });

    // 2 + 3. Reaches the Pricing or FAQ section.
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) trigger(entry.target.id === 'faq' ? 'faq' : 'pricing');
          });
        }, { threshold: 0.35 })
      : null;
    ['pricing', 'faq'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && observer) observer.observe(el);
    });

    // 4. Computer only: mouse leaves through the top (going to close the tab).
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0 && window.matchMedia?.('(pointer: fine)').matches) {
        trigger('exit');
      }
    };
    document.addEventListener('mouseout', onMouseOut);

    return () => {
      clearTimeout(timeTimer);
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onMouseOut);
      observer?.disconnect();
    };
  }, [pathname]);

  // ✕ on a pop-up: no more pop-ups this visit.
  const dismissChatNudge = () => {
    setChatNudge(null);
    nudgeStateRef.current.stopped = true;
    try { sessionStorage.setItem('blink_nudge_dismissed', '1'); } catch {}
  };

  // Chat opened: no more pop-ups this visit, and none for 2 days.
  useEffect(() => {
    if (isExpanded && pathname !== '/dashboard') {
      setChatNudge(null);
      nudgeStateRef.current.stopped = true;
      try { localStorage.setItem('blink_chat_opened_at', String(Date.now())); } catch {}
    }
  }, [isExpanded, pathname]);

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

  // Loading text moves on every 1.3 s while Blink works.
  useEffect(() => {
    if (uiState !== 'processing') return;
    setLoadingStep(0);
    const timer = setInterval(() => setLoadingStep((n) => n + 1), 1300);
    return () => clearInterval(timer);
  }, [uiState, activeActionId]);

  // New answer: pick the message tab again.
  useEffect(() => {
    setFollowUpTab(null);
    setCopiedWhich(null);
    editAbortRef.current?.abort();
    editAbortRef.current = null;
    setEditedMessages({});
    setEditingKey(null);
    setEditNote('');
    setEditError(null);
  }, [activeActionId, selectedClientId]);

  useEffect(() => {
    if (activeActionId === null && blinkRunningRef.current) {
      stopBlinkRequest();
      setUiState('idle');
    }
  }, [activeActionId]);

  useEffect(() => {
    if (externalAction && pathname === '/dashboard') {
      setIsExpanded(true);
      setShowMessageBubble(false);
      if (externalAction === 'summarize') {
        handleActionClick('summarize', 'Outstanding Summary');
      } else if (externalAction === 'recommend') {
        handleActionClick('recommend', 'Generate Follow-up', externalActionClientId || undefined);
      } else if (externalAction === 'welcome_pro') {
        handleActionClick('welcome_pro', 'Welcome to Pro');
      }
    }
  }, [externalAction, externalActionClientId, externalActionNonce, pathname]);

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

  // Let the parent know when a real assistant call starts/finishes, so it
  // can drive its own loading UI (e.g. the "View Recovery Summary" button)
  // off the actual request instead of firing a second, unrendered one.
  useEffect(() => {
    onProcessingChange?.(uiState === 'processing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState]);


  useEffect(() => {
    if (pathname === '/dashboard') return;

    const sectionIds: readonly string[] = LANDING_SECTION_IDS;

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

  const getCurrentMessages = (): Record<string, string> => {
    if (isLoggedIn && isPro) {
      return {
        'hero': "Your Pro workspace is ready.",
        'reminder-generator': "Create unlimited AI payment reminders in seconds.",
        'late-payments': "Late payments hurt cash flow. You're already covered.",
        'how-it-works': "Add a client, send reminders, mark paid. That's it.",
        'automated-reminders': "Your automatic follow-ups run for you, step by step.",
        'dashboard-preview': "Your payment recovery activity, all in one place.",
        'reminder-examples': "See reminders for different payment stages.",
        'built-for': "Built for freelancers and small businesses.",
        'comparison': "See how DueBlink compares to other tools.",
        'pricing': "Your Pro plan unlocks the full recovery toolkit.",
        'faq': "Find quick answers to common questions.",
        'final-cta': "Ready to recover more payments?"
      };
    } else if (isLoggedIn) {
      return {
        'hero': "Welcome back. Let's recover your payments.",
        'reminder-generator': "Create AI payment reminders when you need them.",
        'late-payments': "Stay on top of every payment you are owed.",
        'how-it-works': "Add a client, send reminders, mark paid. That's it.",
        'automated-reminders': "With Pro, DueBlink follows up for you automatically.",
        'dashboard-preview': "Manage your clients and payment activity here.",
        'reminder-examples': "See examples for different payment stages.",
        'built-for': "Built for freelancers and small businesses.",
        'comparison': "See how DueBlink compares to other tools.",
        'pricing': "Upgrade when you need automatic follow-ups.",
        'faq': "Find quick answers to common questions.",
        'final-cta': "Ready to get paid faster?"
      };
    } else {
      return {
        'hero': "Start with 5 free AI reminders.",
        'reminder-generator': "Create a professional payment reminder in seconds.",
        'late-payments': "Late payments are easier to manage with timely follow-ups.",
        'how-it-works': "Add a client, send reminders, mark paid. That's it.",
        'automated-reminders': "Client ignoring you? DueBlink follows up step by step.",
        'dashboard-preview': "Your payment recovery workspace.",
        'reminder-examples': "See reminders for different payment stages.",
        'built-for': "Built for freelancers and small businesses.",
        'comparison': "See how DueBlink compares to other tools.",
        'pricing': "Start free, then upgrade when you need more.",
        'faq': "Find quick answers to common questions.",
        'final-cta': "Ready to get paid faster?"
      };
    }
  };

  const handleRobotClick = () => {
    if (pathname === '/dashboard') {
      setIsExpanded(!isExpanded);
      setShowMessageBubble(false); 
      return;
    }

    // Landing and other public pages: the robot opens the Blink chat.
    setShowMessageBubble(false);
    setShowChatNudge(false);
    setIsExpanded(!isExpanded);
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
    return messages[LANDING_SECTION_IDS[currentSectionIndex]] || messages['hero'] || "Hi! I'm Blink.\n\nI'll help you explore DueBlink and show you how it can help you get paid faster.";
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
    // Same request already running (double tap): ignore it.
    const running = blinkRunningRef.current;
    if (running && running.actionId === actionId && running.clientId === (clientId || '')) return;

    // A different request: stop the old one first.
    stopBlinkRequest();
    const requestId = blinkRequestIdRef.current;
    const controller = new AbortController();
    blinkAbortRef.current = controller;
    blinkRunningRef.current = { actionId, clientId: clientId || '' };
    const isCurrent = () => blinkRequestIdRef.current === requestId;

    setActiveActionName(actionTitle);
    setActiveActionId(actionId);
    setUiState('processing');
    setAiResponse(null);
    editAbortRef.current?.abort();
    setEditedMessages({});
    setEditingKey(null);
    setEditError(null);
    setAllClientsPaid(false);

    if (onTrigger) {
      onTrigger(actionId);
    }

    try {
      const freshClients = clients;

      if (freshClients.length === 0 && actionId !== 'welcome_pro') {
        setSavedClientsCount(0);
        setUiState('idle');
        return;
      }

      const hasActiveClient = freshClients.some(
        (c: any) => (c.status !== 'Paid' && c.status !== 'Written off')
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

      // Remember which client this follow-up is for, even when the
      // client came from the recommendation, so Send can log it.
      // For a follow-up or rewrite, always pick an UNPAID client and send
      // its id to Blink, so the screen and Blink talk about the same client.
      const isFollowUpAction = actionId === 'recommend' || actionId === 'rewrite';
      const followUpTarget =
        targetClient && (targetClient.status !== 'Paid' && targetClient.status !== 'Written off')
          ? targetClient
          : freshClients.find((c: any) => (c.status !== 'Paid' && c.status !== 'Written off'));
      const followUpClientId =
        clientId || (isFollowUpAction ? followUpTarget?.id : undefined);

      if (followUpClientId) {
        setSelectedClientId(followUpClientId);
      }

      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error("Authentication required");
      }

      if (!isCurrent()) return;

      const response = await fetch('/api/pro-recovery-assistant', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: actionId,
          clientId:
            (isFollowUpAction ? followUpClientId : resolvedClientId) ||
            null,
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
        // SPEED: show Blink's answer word by word as it is written,
        // instead of waiting for the whole answer to finish.
        // The screen is refreshed at most every 120 ms so it stays smooth.
        let lastPaint = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // A newer request started, or Back was pressed: stop here.
          if (!isCurrent()) {
            reader.cancel().catch(() => {});
            return;
          }
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          const now = Date.now();
          if (now - lastPaint > 120) {
            lastPaint = now;
            setAiResponse(cleanResponseText(fullText) || null);
          }
        }
      }

      if (!isCurrent()) return;

      setAiResponse(
        cleanResponseText(fullText) ||
        "Analysis complete. No urgent actions needed right now."
      );
    } catch {
      // A stopped (old) request is not an error: show nothing for it.
      if (!isCurrent()) return;
      setAiResponse("Unable to fetch portfolio analysis right now. Please check your connection and try again.");
    } finally {
      if (isCurrent()) {
        blinkRunningRef.current = null;
        blinkAbortRef.current = null;
        setUiState('idle');
      }
    }
  };

  // Clean text for Copy / Export: a title with today's date, no internal
  // lines (like "Client ID: …") and no extra blank lines.
  const exportText = (): string => {
    const TITLES: Record<string, string> = {
      summarize: 'Outstanding summary',
      priorities: "Today's priorities",
      overdue: 'Overdue clients',
    };
    const date = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date());
    const body = (aiResponse || '')
      .split('\n')
      .filter((line) => !/^\s*client id:/i.test(line))
      .map((line) => line.replace(/^\s*•\s*/, '• ').trimEnd())
      .join('\n')
      .replace(/^(important information|today's focus|blink insight|next best action|quick summary)$/gim, (h) => `\n${h.toUpperCase()}`)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return `DueBlink · ${TITLES[activeActionId || ''] || 'Blink'} · ${date}\n\n${body}`;
  };

  const handleCopy = async () => {
    if (!aiResponse || uiState === 'processing') return;
    try {
      await navigator.clipboard.writeText(exportText());
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export: on a phone, opens the share sheet (WhatsApp, email, Notes…);
  // on a computer, downloads a .txt file.
  const handleExport = async () => {
    if (!aiResponse || uiState === 'processing') return;
    const text = exportText();
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (isTouch && nav?.share) {
      try {
        await nav.share({ title: 'DueBlink summary', text });
        return;
      } catch {
        // Share closed or not allowed: fall back to a download.
      }
    }
    try {
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dueblink-${activeActionId || 'summary'}-${date}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setCopiedWhich('exported');
      setTimeout(() => setCopiedWhich(null), 2000);
    } catch {
      handleCopy();
    }
  };

  const handleLandingAction = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      // Just take the visitor to the free generator. The real free-reminder
      // limit is counted by the generator itself, not here.
      const element = document.getElementById('reminder-generator');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsExpanded(false);
        setShowMessageBubble(false);
      } else {
        router.push('/#reminder-generator');
      }
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

  // Asks Blink to change one message (WhatsApp, email or rewritten email).
  // Only that message changes; the rest of the screen stays.
  const TONE_EDITS: { label: string; instruction: string; icon?: LucideIcon }[] = [
    { label: 'Shorter', instruction: 'Make it shorter. Keep only what matters.', icon: Scissors },
    { label: 'Softer', instruction: 'Make the tone softer and friendlier, but still ask for the payment.', icon: Smile },
    { label: 'Firmer', instruction: 'Make the tone firmer and more direct, but stay polite.', icon: ShieldCheck },
  ];
  const LANGUAGE_EDITS: Record<string, { label: string; instruction: string }> = {
    english: { label: 'In English', instruction: 'Write it in clear, simple English.' },
    hinglish: { label: 'In Hinglish', instruction: 'Write it in Hinglish: everyday Hindi in English letters, like a WhatsApp message.' },
    hindi: { label: 'In Hindi', instruction: 'Write it in simple, everyday Hindi (Devanagari script).' },
    marathi: { label: 'In Marathi', instruction: 'Write it in simple, everyday Marathi (Devanagari script).' },
  };

  // Language chips depend on the client:
  // - Indian (₹) client: the other Indian languages DueBlink supports,
  //   not the one already chosen for this client.
  // - International client: no Indian languages; only "In English"
  //   if this client's language isn't English already.
  const quickEditsFor = (clientId: string | null): { label: string; instruction: string; icon?: LucideIcon }[] => {
    const client = clients.find((c: any) => c.id === clientId);
    const current = normalizeLanguage(client?.language);
    const indian = isIndianCurrency(client?.currency);
    const languages = (indian ? ['english', 'hinglish', 'hindi', 'marathi'] : ['english'])
      .filter((id) => id !== current)
      .map((id) => LANGUAGE_EDITS[id]);
    return [...TONE_EDITS, ...languages];
  };

  const editBlinkMessage = async (
    key: string,
    channel: 'whatsapp' | 'email',
    currentText: string,
    instruction: string
  ) => {
    const note = instruction.trim();
    if (!note || !currentText || editingKey || uiState === 'processing' || !selectedClientId) return;

    const controller = new AbortController();
    editAbortRef.current = controller;
    setEditingKey(key);
    setEditError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Authentication required');

      const response = await fetch('/api/pro-recovery-assistant', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          action: 'edit_message',
          clientId: selectedClientId,
          editMessage: currentText,
          editInstruction: note.slice(0, 300),
          editChannel: channel,
        }),
      });
      if (!response.ok || !response.body) throw new Error('Edit failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let lastPaint = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (editAbortRef.current !== controller) { reader.cancel().catch(() => {}); return; }
        text += decoder.decode(value, { stream: true });
        const now = Date.now();
        if (now - lastPaint > 120 && text.trim()) {
          lastPaint = now;
          setEditedMessages((prev) => ({ ...prev, [key]: text.trim() }));
        }
      }
      if (editAbortRef.current !== controller) return;
      if (!text.trim()) throw new Error('Empty edit');
      setEditedMessages((prev) => ({ ...prev, [key]: text.trim() }));
      setEditNote('');
    } catch {
      if (editAbortRef.current === controller) {
        setEditError("Couldn't change it this time. Please try again.");
      }
    } finally {
      if (editAbortRef.current === controller) {
        editAbortRef.current = null;
        setEditingKey(null);
      }
    }
  };

  // The chips and the "Tell Blink what to change…" box under a message.
  const renderEditTools = (key: string, channel: 'whatsapp' | 'email', currentText: string) => {
    const busy = editingKey !== null || uiState === 'processing';
    const editingThis = editingKey === key;
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5" aria-label="Quick edits">
          {quickEditsFor(selectedClientId).map((edit) => (
            <button
              key={edit.label}
              type="button"
              disabled={busy || !currentText}
              onClick={() => editBlinkMessage(key, channel, currentText, edit.instruction)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:border-[#20B8BE] hover:text-[#245B92] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(() => { const Icon: LucideIcon = edit.icon ?? Languages; return <Icon size={11} className="text-[#20B8BE]" aria-hidden="true" />; })()}
              {edit.label}
            </button>
          ))}
        </div>


        {editingThis && (
          <p className="text-[10px] font-semibold text-slate-500" role="status">Blink is changing the message…</p>
        )}
        {editError && !editingKey && (
          <p className="text-[10px] font-semibold text-rose-700" role="alert">{editError}</p>
        )}
      </div>
    );
  };

  // Back: from a client opened out of a list, return to that list
  // straight away (no reload). Otherwise go to the actions menu.
  const goBack = () => {
    if (returnTo && (activeActionId === 'recommend' || activeActionId === 'rewrite')) {
      stopBlinkRequest();
      setUiState('idle');
      setActiveActionId(returnTo.actionId);
      setActiveActionName(returnTo.name);
      setAiResponse(returnTo.response);
      setSelectedClientId(null);
      setReturnTo(null);
      return;
    }
    setAiResponse(null);
    setActiveActionName(null);
    setActiveActionId(null);
    setSelectedClientId(null);
    setClientPickerAction(null);
    setAllClientsPaid(false);
    setReturnTo(null);
  };

  // Unpaid clients, most urgent first (most days late, then biggest amount).
  const urgentClients = () =>
    clients
      .filter((c: any) => c.status === 'Pending')
      .map((c: any) => ({ c, late: daysLateFor(c.dueDate) ?? -9999 }))
      .sort((a: any, b: any) => b.late - a.late || Number(b.c.amount || 0) - Number(a.c.amount || 0))
      .map((x: any) => x.c);

  const timingLabel = (c: any): string => {
    const late = daysLateFor(c.dueDate);
    if (late === null) return 'no due date';
    if (late === 0) return 'due today';
    if (late < 0) return `due in ${-late} ${-late === 1 ? 'day' : 'days'}`;
    return `${late} ${late === 1 ? 'day' : 'days'} overdue`;
  };

  // ============================================================
  // STAT TILES — the coloured cards from Outstanding Summary, used
  // at the top of every Blink command so all 5 look the same.
  // ============================================================
  type TileTone = 'blue' | 'slate' | 'amber' | 'emerald' | 'rose';
  const TILE_STYLES: Record<TileTone, { box: string; label: string; value: string; unit: string }> = {
    blue: { box: 'bg-blue-50/70 border-blue-100', label: 'text-[#245B92]', value: 'text-[#245B92]', unit: 'text-[#245B92]/70' },
    slate: { box: 'bg-slate-50 border-slate-100', label: 'text-slate-500', value: 'text-slate-800', unit: 'text-slate-500' },
    amber: { box: 'bg-amber-50/70 border-amber-100', label: 'text-amber-700', value: 'text-amber-700', unit: 'text-amber-700' },
    emerald: { box: 'bg-emerald-50/70 border-emerald-100', label: 'text-emerald-700', value: 'text-emerald-700', unit: 'text-emerald-700' },
    rose: { box: 'bg-rose-50/70 border-rose-100', label: 'text-rose-700', value: 'text-rose-700', unit: 'text-rose-700' },
  };

  const TILE_ICONS: Record<string, LucideIcon> = {
    Amount: Wallet,
    'Overdue amount': Wallet,
    Overdue: Clock,
    Status: CalendarCheck,
    'Due today': CalendarCheck,
    Stage: Flag,
    Tone: MessageSquare,
    'Chase first': Target,
    'Longest wait': Hourglass,
  };

  const renderStatTiles = (
    tiles: { label: string; value: string; unit?: string; tone: TileTone; wide?: boolean }[]
  ) => (
    <div className={`grid gap-1.5 ${tiles.some((t) => t.wide) ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {tiles.map((t) => {
        const st = TILE_STYLES[t.tone];
        return (
          <div key={t.label} className={`rounded-xl border px-2.5 py-2 min-w-0 ${st.box} ${t.wide ? 'col-span-2' : ''}`}>
            <p className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider truncate ${st.label}`}>
              {(() => { const Icon = TILE_ICONS[t.label]; return Icon ? <Icon size={10} className="shrink-0" aria-hidden="true" /> : null; })()}
              <span className="truncate">{t.label}</span>
            </p>
            <p className={`${!t.wide && t.value.length > 7 ? 'text-[11px] sm:text-xs' : 'text-[13px] sm:text-sm'} font-black mt-0.5 leading-tight break-words ${st.value}`}>
              {t.value}
              {t.unit && <span className={`text-[10px] font-semibold ml-1 ${st.unit}`}>{t.unit}</span>}
            </p>
          </div>
        );
      })}
    </div>
  );

  // Days late from the due date, in India time (negative = not due yet).
  const daysLateFor = (dueDate: string | undefined): number | null => {
    if (!dueDate) return null;
    const [y, m, d] = String(dueDate).substring(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const [ty, tm, td] = today.split('-').map(Number);
    return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000);
  };

  const plural = (n: number, word: string) => `${n === 1 ? word : `${word}s`}`;

  return (
    <MotionConfig reducedMotion="user">
    <div 
      className={`blink-widget-root fixed z-[900] flex flex-col items-end gap-3 transition-all duration-200 ease-in-out ${positioningClass}`}
      suppressHydrationWarning={true}
    >
      <style>{`
        @keyframes blinkFadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blinkShimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        .blink-skeleton {
          background: linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 60px, #f1f5f9 120px);
          background-size: 400px 100%;
          animation: blinkShimmer 1.2s linear infinite;
          border-radius: 6px;
        }
        @keyframes blinkDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        /* People who turn on "reduce motion" get a still screen. */
        @media (prefers-reduced-motion: reduce) {
          .blink-widget-root .blink-skeleton,
          .blink-widget-root [style*="blinkDot"],
          .blink-widget-root .animate-ping,
          .blink-widget-root .animate-bounce,
          .blink-widget-root .animate-pulse { animation: none !important; }
        }
        /* Clear keyboard focus ring on every Blink button and field. */
        .blink-widget-root button:focus-visible,
        .blink-widget-root a:focus-visible,
        .blink-widget-root input:focus-visible {
          outline: 2px solid #245B92;
          outline-offset: 2px;
        }
        .blink-widget-root .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
      `}</style>

      {/* 1. SCROLL GUIDANCE MESSAGE BUBBLE */}
      <AnimatePresence>
        {!isExpanded && showMessageBubble && isPro && pathname === '/dashboard' && (
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

            {pathname !== '/dashboard' && (isLoggedIn || SECTIONS_WITH_BUTTON.includes(LANDING_SECTION_IDS[currentSectionIndex] ?? 'hero') || clickedSectionText) && (
              <button 
                onClick={handleLandingAction} 
                className="mt-0.5 w-full bg-gradient-to-r from-[#245B92] to-[#20B8BE] text-white py-2 px-3 rounded-xl font-bold text-[11px] shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#245B92]"
                suppressHydrationWarning={true}
              >
                {isLoggedIn ? "Open Dashboard" : "Generate a free reminder"} <ArrowRight size={12} />
              </button>
            )}

            {pathname !== '/dashboard' && (
              <button
                onClick={() => { setShowMessageBubble(false); setIsExpanded(true); }}
                className="w-full py-2 px-3 rounded-xl border border-[#245B92]/20 bg-white text-[#245B92] font-bold text-[11px] hover:bg-[#245B92]/5 transition flex items-center justify-center gap-1.5 cursor-pointer"
                suppressHydrationWarning={true}
              >
                <MessageCircle size={12} /> Ask Blink anything
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
                <p className="text-xs font-black text-[#0F172A]" suppressHydrationWarning={true}>{formatAmountWithCurrency(recommendation.amount, recommendation.currency)}</p>
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
        {isExpanded && pathname !== '/dashboard' && (
          <BlinkChat onClose={() => setIsExpanded(false)} />
        )}
        {!isExpanded && showChatNudge && pathname !== '/dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="flex items-center gap-1 max-w-[270px] bg-white border border-slate-200 shadow-xl rounded-2xl pl-3 pr-1 py-1"
          >
            <button
              type="button"
              onClick={() => { setShowChatNudge(false); setIsExpanded(true); }}
              className="text-[12px] font-semibold text-slate-700 py-1.5 cursor-pointer text-left"
            >
              {(NUDGE_MESSAGES[chatNudge || 'interest'] || NUDGE_MESSAGES.interest).lead}{' '}
              <span className="text-[#245B92] font-bold">{(NUDGE_MESSAGES[chatNudge || 'interest'] || NUDGE_MESSAGES.interest).ask}</span>
            </button>
            <button
              type="button"
              onClick={dismissChatNudge}
              className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
              aria-label="Hide"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
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
                          setPickerSearch('');
                        } else {
                          goBack();
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
                onClick={() => { setIsExpanded(false); setAiResponse(null); setActiveActionName(null); setActiveActionId(null); setSelectedClientId(null); setClientPickerAction(null); setAllClientsPaid(false); setReturnTo(null); }} 
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
                    {uiState === 'processing' && !aiResponse ? (
                      (() => {
                        // What Blink is doing, step by step, for this command.
                        const LOADING_STEPS: Record<string, string[]> = {
                          recommend: ['Checking reminder history', 'Choosing the right tone', 'Writing your message'],
                          rewrite: ['Reading the last reminder', 'Rewriting in fresh words'],
                          priorities: ['Sorting your clients'],
                          summarize: ['Adding up your payments'],
                          overdue: ['Finding late payments'],
                          welcome_pro: ['Getting things ready'],
                        };
                        const steps = LOADING_STEPS[activeActionId || ''] || ['Working on it'];
                        const stepText = steps[Math.min(loadingStep, steps.length - 1)];

                        return (
                          <div className="py-2 space-y-3" role="status" aria-live="polite">
                            <div className="flex items-center gap-2 px-1">
                              <span className="flex items-end gap-1 h-3" aria-hidden="true">
                                {['#245B92', '#2289A8', '#20B8BE'].map((color, i) => (
                                  <span
                                    key={color}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: color, animation: `blinkDot 1s ease-in-out ${i * 0.16}s infinite` }}
                                  />
                                ))}
                              </span>
                              <AnimatePresence mode="wait" initial={false}>
                                <motion.p
                                  key={stepText}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.2 }}
                                  className="text-[10px] sm:text-[11px] font-semibold text-slate-600"
                                >
                                  {stepText}…
                                </motion.p>
                              </AnimatePresence>
                            </div>

                            {/* Calm placeholder in the shape of the answer */}
                            <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-2.5" aria-hidden="true">
                              <div className="blink-skeleton h-3 w-1/2" />
                              <div className="blink-skeleton h-2.5 w-3/4" />
                              <div className="blink-skeleton h-2.5 w-2/3" />
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-2" aria-hidden="true">
                              <div className="blink-skeleton h-2.5 w-full" />
                              <div className="blink-skeleton h-2.5 w-11/12" />
                              <div className="blink-skeleton h-2.5 w-4/5" />
                              <div className="blink-skeleton h-8 w-full mt-3 rounded-lg" />
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div
                        key={`${activeActionId}`}
                        style={{ animation: 'blinkFadeSlideUp 0.4s ease-out' }}
                        className="space-y-3"
                        aria-busy={uiState === 'processing'}
                        aria-label={activeActionName || 'Blink answer'}
                      >
                        {activeActionId === 'recommend' ? (
                          (() => {
                            const followUp = parseFollowUpResponse(aiResponse || '');
                            const isWriting = uiState === 'processing';
                            const snapshotLines = followUp.snapshot.split('\n').map((l) => l.trim());
                            const field = (label: string) =>
                              snapshotLines.find((l) => l.toLowerCase().startsWith(label))?.replace(/^[^:]+:\s*/, '') || '';

                            const clientName = field('client:') || 'Selected client';
                            const amount = field('amount due:');
                            const daysRaw = field('days overdue:');
                            const timing = /^\d+$/.test(daysRaw)
                              ? `${daysRaw} ${daysRaw === '1' ? 'day' : 'days'} overdue`
                              : daysRaw;
                            const stage = field('stage:').replace(/\s*\(.*\)\s*$/, '');
                            const STAGE_LABELS: Record<string, string> = {
                              first: 'First', second: 'Follow-up', final: 'Final', stalled: 'Stalled',
                            };

                            const target = clients.find((c: any) => c.id === selectedClientId);
                            const canWhatsApp = String(target?.whatsapp || target?.phone || '').replace(/\D/g, '').length >= 10;
                            const canEmail = Boolean(String(target?.email || '').trim());
                            const prefersEmail = /\bemail\b/i.test(followUp.recommendation) && !/whatsapp/i.test(followUp.recommendation);
                            const tab: 'whatsapp' | 'email' =
                              followUpTab ||
                              (prefersEmail && canEmail ? 'email' : canWhatsApp || !canEmail ? 'whatsapp' : 'email');

                            const messageKey = `followup-${tab}`;
                            const originalMessage = tab === 'whatsapp' ? followUp.whatsapp : followUp.email;
                            const message = editedMessages[messageKey] ?? originalMessage;
                            const isEdited = editedMessages[messageKey] !== undefined;
                            const { subject, body } = splitEmailText(tab === 'email' ? message || '' : '');
                            const sentHere = sentChannel?.channel === tab && sentChannel.clientId === selectedClientId;

                            return (
                              <div className="space-y-3 text-left">


                                {/* Client + the coloured cards */}
                                <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate px-1">{clientName}</p>
                                {(amount || timing || stage) && renderStatTiles([
                                  { label: 'Amount', value: amount || '—', tone: 'blue' },
                                  {
                                    label: /overdue/i.test(timing) ? 'Overdue' : 'Status',
                                    value: /^\d+$/.test(daysRaw) ? daysRaw : (timing ? timing.charAt(0).toUpperCase() + timing.slice(1) : '—'),
                                    unit: /^\d+$/.test(daysRaw) ? plural(Number(daysRaw), 'day') : undefined,
                                    tone: /^\d+$/.test(daysRaw) && Number(daysRaw) > 0 ? 'amber' : 'emerald',
                                  },
                                  {
                                    label: 'Stage',
                                    value: STAGE_LABELS[stage] || stage || '—',
                                    tone: stage === 'stalled' || stage === 'final' ? 'rose' : 'slate',
                                  },
                                ])}

                                {/* Blink's advice */}
                                {followUp.recommendation ? (
                                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[#20B8BE]/5 border-l-2 border-[#20B8BE]">
                                    <Sparkles size={13} className="text-[#20B8BE] mt-0.5 shrink-0" aria-hidden="true" />
                                    <p className="text-[11px] sm:text-xs text-slate-700 leading-snug">{followUp.recommendation}</p>
                                  </div>
                                ) : isWriting ? (
                                  <div className="blink-skeleton h-9 w-full rounded-xl" aria-hidden="true" />
                                ) : null}

                                {/* Message: WhatsApp or Email, one at a time */}
                                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                                  <div className="grid grid-cols-2 text-[10px] sm:text-[11px] font-bold border-b border-slate-100" role="tablist" aria-label="Message type">
                                    {([
                                      { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
                                      { id: 'email', label: 'Email', Icon: Mail },
                                    ] as const).map(({ id, label, Icon }) => (
                                      <button
                                        key={id}
                                        id={`blink-tab-${id}`}
                                        role="tab"
                                        aria-selected={tab === id}
                                        aria-controls="blink-followup-panel"
                                        onClick={() => setFollowUpTab(id)}
                                        className={`relative flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer ${
                                          tab === id ? 'text-[#245B92]' : 'text-slate-500 hover:text-slate-600'
                                        }`}
                                      >
                                        <Icon size={13} /> {label}
                                        {tab === id && (
                                          <motion.span
                                            layoutId="blink-followup-tab"
                                            className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-[#245B92] to-[#20B8BE]"
                                          />
                                        )}
                                      </button>
                                    ))}
                                  </div>

                                  <div className="p-3" id="blink-followup-panel" role="tabpanel" aria-labelledby={`blink-tab-${tab}`}>
                                    {message ? (
                                      <div className={`max-h-[32vh] sm:max-h-[190px] overflow-y-auto scroll-smooth transition-opacity ${editingKey === messageKey && !isEdited ? 'opacity-50' : ''}`}>
                                        {isEdited && editingKey !== messageKey && (
                                          <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-bold text-[#245B92] bg-[#245B92]/10 px-2 py-0.5 rounded-full">Edited by Blink</span>
                                            <button
                                              type="button"
                                              onClick={() => setEditedMessages((prev) => { const next = { ...prev }; delete next[messageKey]; return next; })}
                                              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                            >
                                              Undo
                                            </button>
                                          </div>
                                        )}
                                        {tab === 'email' && (
                                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 mb-1.5">{subject}</p>
                                        )}
                                        <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                          {tab === 'email' ? body : message}
                                        </p>
                                      </div>
                                    ) : isWriting ? (
                                      <div className="space-y-2" aria-hidden="true">
                                        <div className="blink-skeleton h-2.5 w-full" />
                                        <div className="blink-skeleton h-2.5 w-11/12" />
                                        <div className="blink-skeleton h-2.5 w-3/4" />
                                      </div>
                                    ) : (
                                      <p className="text-[10px] sm:text-[11px] text-slate-500">No {tab === 'email' ? 'email' : 'WhatsApp message'} this time. Try Rewrite.</p>
                                    )}

                                    {tab === 'whatsapp' && !canWhatsApp && message && (
                                      <p className="text-[10px] text-slate-500 mt-2">No WhatsApp number saved: WhatsApp will ask who to send it to.</p>
                                    )}
                                    {tab === 'email' && !canEmail && message && (
                                      <p className="text-[10px] text-slate-500 mt-2">No email saved for this client: add one with Edit.</p>
                                    )}

                                    {message && !isWriting && (
                                      <div className="mt-3 pt-3 border-t border-slate-100">
                                        {renderEditTools(messageKey, tab, message)}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Actions: one main button, two small ones */}
                                <div className="space-y-2">
                                  <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => sendReminder(tab, message)}
                                    disabled={markingSent || isWriting || !message || editingKey !== null}
                                    className={`w-full py-2.5 rounded-xl font-bold text-[11px] sm:text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                      sentHere
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-sm hover:opacity-90'
                                    }`}
                                  >
                                    {sentHere ? (
                                      <><span className="sr-only" role="status">Marked as sent.</span><CheckCircle2 size={13} /> Sent</>
                                    ) : isWriting ? (
                                      <><Loader2 size={13} className="animate-spin" /> Writing…</>
                                    ) : tab === 'whatsapp' ? (
                                      <><MessageCircle size={13} /> Send on WhatsApp</>
                                    ) : (
                                      <><Mail size={13} /> Send email</>
                                    )}
                                  </motion.button>

                                  {/* Sent: go straight to the next client who needs a reminder */}
                                  {sentHere && (() => {
                                    const next = urgentClients().find((c: any) => c.id !== selectedClientId && (daysLateFor(c.dueDate) ?? -1) >= 0);
                                    if (!next) return null;
                                    return (
                                      <motion.button
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleActionClick('recommend', 'Generate Follow-up', next.id)}
                                        className="w-full py-2 px-3 rounded-xl bg-[#245B92]/5 border border-[#245B92]/15 text-[#245B92] text-[10px] sm:text-[11px] font-bold hover:bg-[#245B92]/10 transition flex items-center justify-between gap-2 cursor-pointer"
                                      >
                                        <span className="truncate">Next: {next.name} · {timingLabel(next)}</span>
                                        <ArrowRight size={13} className="shrink-0" />
                                      </motion.button>
                                    );
                                  })()}

                                  <div className={`grid gap-2 ${returnTo ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                    <button
                                      onClick={async () => {
                                        try { await navigator.clipboard.writeText(message || ''); } catch { return; }
                                        setCopiedWhich(`followup-${tab}`);
                                        setTimeout(() => setCopiedWhich(null), 1800);
                                      }}
                                      disabled={isWriting || !message}
                                      className="py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {copiedWhich === `followup-${tab}` ? <><Check size={13} className="text-emerald-500" /> Copied</> : <><Copy size={13} /> Copy</>}
                                    </button>
                                    <button
                                      onClick={() => handleActionClick('rewrite', 'Rewrite Reminder', selectedClientId || undefined)}
                                      disabled={isWriting}
                                      className="py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <RefreshCw size={13} className="text-[#20B8BE]" /> Rewrite
                                    </button>
                                    {returnTo && (
                                    <button
                                      onClick={goBack}
                                      className="py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <ArrowLeft size={13} /> List
                                    </button>
                                    )}
                                  </div>
                                </div>

                              </div>
                            );
                          })()
                        ) : activeActionId === 'priorities' ? (
                            (() => {
                              const priorityData = parsePrioritiesResponse(aiResponse || '');

                              return (
                                <div className="space-y-3 text-left">


                                  {/* The coloured cards */}
                                  {(() => {
                                    const unpaid = clients.filter((c: any) => c.status === 'Pending');
                                    const late = unpaid.filter((c: any) => (daysLateFor(c.dueDate) ?? 0) > 0).length;
                                    const today = unpaid.filter((c: any) => daysLateFor(c.dueDate) === 0).length;
                                    const top = priorityData.priorities[0];
                                    return renderStatTiles([
                                      { label: 'Chase first', value: top ? `${top.client}${top.amount ? ` · ${top.amount}` : ''}` : '—', tone: 'blue', wide: true },
                                      { label: 'Overdue', value: String(late), unit: plural(late, 'Client'), tone: 'amber' },
                                      { label: 'Due today', value: String(today), unit: plural(today, 'Client'), tone: 'emerald' },
                                    ]);
                                  })()}

                                  {/* Priority list */}
                                  <div className="space-y-1.5">
                                    {priorityData.priorities.map((priority: any) => (
                                      <div
                                        key={priority.number}
                                        className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2"
                                      >
                                        <div className="flex items-center justify-between gap-2">

                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[10px] font-black text-[#245B92] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                                #{priority.number}
                                              </span>

                                              <p className="text-[11px] sm:text-xs font-black text-slate-900 truncate">
                                                {priority.client || 'Client'}
                                              </p>
                                            </div>

                                            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
                                              {priority.amount &&
                                                (/^\d/.test(priority.amount.trim())
                                                  ? `₹${priority.amount}`
                                                  : priority.amount)}
                                              {priority.daysOverdue
                                                ? (/^\d+$/.test(priority.daysOverdue.trim())
                                                    ? (Number(priority.daysOverdue) === 0 ? ' · due today' : ` · ${priority.daysOverdue} ${priority.daysOverdue.trim() === '1' ? 'day' : 'days'} overdue`)
                                                    : ` · ${priority.daysOverdue}`)
                                                : ''}
                                            </p>

                                            {priority.action && (
                                              <p className="text-[10px] sm:text-[11px] text-slate-600 mt-1 leading-relaxed">
                                                {priority.action}
                                              </p>
                                            )}
                                          </div>

                                          <button
                                            onClick={() => {
                                              const matchedClient =
                                                activeClients.find((client: any) => priority.clientId && client.id === priority.clientId) ||
                                                activeClients.find(
                                                  (client: any) =>
                                                    client.name?.toLowerCase() === priority.client?.toLowerCase()
                                                );

                                              if (matchedClient) {
                                                setReturnTo({ actionId: 'priorities', name: "Today's Priorities", response: aiResponse || '' });
                                                setSelectedClientId(matchedClient.id);
                                                setAiResponse(null);
                                                handleActionClick(
                                                  'recommend',
                                                  'Generate Follow-up',
                                                  matchedClient.id
                                                );
                                              }
                                            }}
                                            className="shrink-0 px-2 py-1.5 rounded-xl bg-blue-50 text-[#245B92] border border-blue-100 hover:bg-blue-100 font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                                          >
                                            <Sparkles size={12} className="text-[#20B8BE]" />
                                            Follow-up
                                          </button>

                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Today's focus */}
                                  {priorityData.focus && (
                                    <div className="rounded-xl bg-teal-50/60 border border-teal-100 px-2.5 py-2">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <ArrowRight size={12} className="text-[#20B8BE]" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E]">
                                          Today's Focus
                                        </span>
                                      </div>

                                      <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
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


                                  {/* Quick Summary */}
                                  {summary.quickSummary && (
                                    <div className="px-1">
                                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#245B92]">
                                        Quick Summary
                                      </p>
                                      <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-0.5">
                                        {summary.quickSummary}
                                      </p>
                                    </div>
                                  )}

                                  {/* Important Information */}
                                  {summary.importantInformation && (
                                    <div className="space-y-1.5">

                                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#245B92] px-1">
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
                                            <div className="col-span-2 rounded-xl bg-blue-50/70 border border-blue-100 px-2.5 py-2">
                                              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#245B92]">
                                                <Wallet size={10} aria-hidden="true" /> Outstanding
                                              </p>
                                              <p className="text-[13px] sm:text-sm font-black text-[#245B92] mt-0.5 break-words">
                                                {outstanding}
                                              </p>
                                            </div>

                                            {/* Pending */}
                                            <div className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2">
                                              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                <Users size={10} aria-hidden="true" /> Pending
                                              </p>
                                              <p className="text-[13px] sm:text-sm font-black text-slate-800 mt-0.5">
                                                {pending}
                                                <span className="text-[10px] font-semibold text-slate-500 ml-1">
                                                  {pending === '1' ? 'Client' : 'Clients'}
                                                </span>
                                              </p>
                                            </div>

                                            {/* Overdue */}
                                            <div className="rounded-xl bg-amber-50/70 border border-amber-100 px-2.5 py-2">
                                              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                                <AlertTriangle size={10} aria-hidden="true" /> Overdue
                                              </p>
                                              <p className="text-[13px] sm:text-sm font-black text-amber-700 mt-0.5">
                                                {overdue}
                                                <span className="text-[10px] font-semibold text-amber-700 ml-1">
                                                  {overdue === '1' ? 'Client' : 'Clients'}
                                                </span>
                                              </p>
                                            </div>

                                            {/* Paid */}
                                            <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-2.5 py-2">
                                              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                                <CheckCircle2 size={10} aria-hidden="true" /> Paid
                                              </p>
                                              <p className="text-[13px] sm:text-sm font-black text-emerald-700 mt-0.5">
                                                {paid}
                                                <span className="text-[10px] font-semibold text-emerald-700 ml-1">
                                                  {paid === '1' ? 'Client' : 'Clients'}
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
                                    <div className="rounded-xl bg-teal-50/60 border border-teal-100 px-2.5 py-2">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <Zap size={12} className="text-[#20B8BE]" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E]">
                                          Blink Insight
                                        </span>
                                      </div>

                                      <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
                                        {summary.insight}
                                      </p>
                                    </div>
                                  )}

                                  {/* Next Best Action */}
                                  {summary.nextBestAction && (
                                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-2">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <ArrowRight size={12} className="text-[#20B8BE]" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E]">
                                          Next Best Action
                                        </span>
                                      </div>

                                      <p className="text-[11px] sm:text-xs text-slate-700 font-semibold leading-relaxed">
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
                              const isWriting = uiState === 'processing';
                              const infoLines = (rewrite.importantInformation || '')
                                .split('\n')
                                .map((l) => l.replace(/^[•*\-\s]+/, '').trim());
                              const field = (label: string) =>
                                infoLines.find((l) => l.toLowerCase().startsWith(label))?.replace(/^[^:]+:\s*/, '') || '';
                              const clientName = field('client:') || 'Selected client';
                              const amount = field('amount due:');
                              const daysRaw = field('days overdue:');
                              const timing = /^\d+$/.test(daysRaw)
                                ? `${daysRaw} ${daysRaw === '1' ? 'day' : 'days'} overdue`
                                : daysRaw;
                              const tone = field('tone:');
                              const rewriteText = editedMessages['rewrite'] ?? rewrite.message;
                              const rewriteEdited = editedMessages['rewrite'] !== undefined;
                              const { subject, body } = splitEmailText(rewriteText || '');
                              const sentHere = sentChannel?.channel === 'email' && sentChannel.clientId === selectedClientId;

                              return (
                                <div className="space-y-3 text-left">


                                  {/* Client + the coloured cards */}
                                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate px-1">{clientName}</p>
                                  {(amount || timing || tone) && renderStatTiles([
                                    { label: 'Amount', value: amount || '—', tone: 'blue' },
                                    {
                                      label: /overdue/i.test(timing) ? 'Overdue' : 'Status',
                                      value: /^\d+$/.test(daysRaw) ? daysRaw : (timing ? timing.charAt(0).toUpperCase() + timing.slice(1) : '—'),
                                      unit: /^\d+$/.test(daysRaw) ? plural(Number(daysRaw), 'day') : undefined,
                                      tone: /^\d+$/.test(daysRaw) && Number(daysRaw) > 0 ? 'amber' : 'emerald',
                                    },
                                    { label: 'Tone', value: tone || '—', tone: 'slate' },
                                  ])}

                                  {/* Rewritten email */}
                                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="flex items-center gap-1.5 mb-2 text-[10px] sm:text-[11px] font-bold text-[#245B92]">
                                      <Mail size={13} /> Fresh email
                                    </div>
                                    {rewriteText ? (
                                      <div className={`max-h-[32vh] sm:max-h-[190px] overflow-y-auto scroll-smooth transition-opacity ${editingKey === 'rewrite' && !rewriteEdited ? 'opacity-50' : ''}`}>
                                        {rewriteEdited && editingKey !== 'rewrite' && (
                                          <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-bold text-[#245B92] bg-[#245B92]/10 px-2 py-0.5 rounded-full">Edited by Blink</span>
                                            <button
                                              type="button"
                                              onClick={() => setEditedMessages((prev) => { const next = { ...prev }; delete next['rewrite']; return next; })}
                                              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                            >
                                              Undo
                                            </button>
                                          </div>
                                        )}
                                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 mb-1.5">{subject}</p>
                                        <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{body}</p>
                                      </div>
                                    ) : isWriting ? (
                                      <div className="space-y-2" aria-hidden="true">
                                        <div className="blink-skeleton h-3 w-1/2" />
                                        <div className="blink-skeleton h-2.5 w-full" />
                                        <div className="blink-skeleton h-2.5 w-11/12" />
                                        <div className="blink-skeleton h-2.5 w-3/4" />
                                      </div>
                                    ) : (
                                      <p className="text-[10px] sm:text-[11px] text-slate-500">Couldn&apos;t write it this time. Tap Rewrite again.</p>
                                    )}

                                    {rewriteText && !isWriting && (
                                      <div className="mt-3 pt-3 border-t border-slate-100">
                                        {renderEditTools('rewrite', 'email', rewriteText)}
                                      </div>
                                    )}
                                  </div>

                                  {/* Why this tone */}
                                  {rewrite.recommendation && (
                                    <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[#20B8BE]/5 border-l-2 border-[#20B8BE]">
                                      <Sparkles size={13} className="text-[#20B8BE] mt-0.5 shrink-0" aria-hidden="true" />
                                      <p className="text-[11px] sm:text-xs text-slate-700 leading-snug">{rewrite.recommendation}</p>
                                    </div>
                                  )}

                                  {/* Actions: one main button, then Copy · Rewrite again · Back */}
                                  <div className="space-y-2">
                                    <motion.button
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => sendReminder('email', rewriteText)}
                                      disabled={markingSent || isWriting || !rewriteText || editingKey !== null}
                                      className={`w-full py-2.5 rounded-xl font-bold text-[11px] sm:text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                        sentHere
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-sm hover:opacity-90'
                                      }`}
                                    >
                                      {sentHere ? <><CheckCircle2 size={13} /> Sent</> : isWriting ? <><Loader2 size={13} className="animate-spin" /> Writing…</> : <><Mail size={13} /> Send email</>}
                                    </motion.button>
                                    <div className={`grid gap-2 ${returnTo ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                    <button
                                      onClick={async () => {
                                        try { await navigator.clipboard.writeText(rewriteText || ''); } catch { return; }
                                        setCopiedWhich('rewrite');
                                        setTimeout(() => setCopiedWhich(null), 1800);
                                      }}
                                      disabled={isWriting || !rewriteText}
                                      className="py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {copiedWhich === 'rewrite' ? <><Check size={13} className="text-emerald-500" /> Copied</> : <><Copy size={13} /> Copy</>}
                                    </button>
                                    <button
                                      onClick={() => handleActionClick('rewrite', 'Rewrite Reminder', selectedClientId || undefined)}
                                      disabled={isWriting}
                                      className="py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <RefreshCw size={13} className="text-[#20B8BE]" /> Again
                                    </button>
                                    {returnTo && (
                                    <button
                                      onClick={goBack}
                                      className="py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <ArrowLeft size={13} /> List
                                    </button>
                                    )}
                                    </div>
                                  </div>

                                </div>
                              );
                            })()
                        ) : activeActionId === 'overdue' ? (
                            (() => {
                              const overdue = parseOverdueResponse(aiResponse || '');

                              return (
                                <div className="space-y-2.5 text-left">


                                  {/* The coloured cards */}
                                  {(() => {
                                    const lateClients = clients.filter(
                                      (c: any) => c.status === 'Pending' && (daysLateFor(c.dueDate) ?? 0) > 0
                                    );
                                    const longest = lateClients.reduce(
                                      (max: number, c: any) => Math.max(max, daysLateFor(c.dueDate) ?? 0), 0
                                    );
                                    return renderStatTiles([
                                      { label: 'Overdue amount', value: lateClients.length ? formatTotalsByCurrency(lateClients) : formatAmountWithCurrency(0, 'INR'), tone: 'blue', wide: true },
                                      { label: 'Overdue', value: String(lateClients.length), unit: plural(lateClients.length, 'Client'), tone: 'amber' },
                                      { label: 'Longest wait', value: String(longest), unit: plural(longest, 'day'), tone: longest >= 21 ? 'rose' : 'slate' },
                                    ]);
                                  })()}

                                  {/* Quick Summary */}
                                  {overdue.quickSummary && (
                                    <div className="px-1">
                                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#245B92]">
                                      Quick Summary
                                      </p>

                                      <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-0.5">
                                        {overdue.quickSummary}
                                      </p>
                                    </div>
                                  )}

                                  {/* Overdue Recovery Queue */}
                                  {overdue.priorities.length > 0 && (
                                  <div className="space-y-1.5">

                                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#245B92] px-1">
                                      Overdue Recovery Queue
                                    </p>

                                    {overdue.priorities.map((priority: any) => (
                                      <div
                                        key={priority.number}
                                        className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2"
                                      >

                                        {/* Client header */}
                                        <div className="flex items-center justify-between gap-2">

                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="shrink-0 text-[10px] font-black text-[#245B92] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                              #{priority.number}
                                            </span>

                                            <p className="text-[11px] sm:text-xs font-black text-slate-900 truncate">
                                              {priority.client || 'Client'}
                                            </p>
                                          </div>

                                          {priority.recoveryStage && (
                                            <span className="shrink-0 text-[10px] font-bold text-[#0F766E] bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                                              {({ first: 'First reminder', second: 'Follow-up', final: 'Final reminder', stalled: 'Stalled' } as Record<string, string>)[
                                                String(priority.recoveryStage).split(' ')[0].toLowerCase()
                                              ] || priority.recoveryStage}
                                            </span>
                                          )}

                                        </div>

                                        {/* Amount + overdue */}
                                        <div className="flex items-center gap-1.5 mt-1.5">

                                          {priority.amount && (
                                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">
                                              {/^\d/.test(priority.amount.trim())
                                                ? `₹${priority.amount}`
                                                : priority.amount}
                                            </span>
                                          )}

                                          {priority.daysOverdue && (
                                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                              {priority.daysOverdue} {String(priority.daysOverdue).trim() === '1' ? 'day' : 'days'} overdue
                                            </span>
                                          )}

                                        </div>

                                        {/* Company */}
                                        {priority.company && priority.company !== 'N/A' && (
                                          <p className="text-[10px] text-slate-500 mt-1 truncate">
                                            {priority.company}
                                          </p>
                                        )}

                                        {/* Why it matters */}
                                        {priority.why && (
                                          <div className="mt-1.5">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                              Why It Matters
                                            </p>

                                            <p className="text-[10px] sm:text-[11px] text-slate-600 leading-relaxed mt-0.5">
                                              {priority.why}
                                            </p>
                                          </div>
                                        )}

                                        {/* Recommended action */}
                                        {priority.action && (
                                          <div className="mt-1.5 border-l-2 border-[#20B8BE] pl-2">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-[#0F766E]">
                                              Recommended Action
                                            </p>

                                            <p className="text-[10px] sm:text-[11px] text-slate-700 font-semibold leading-relaxed mt-0.5">
                                              {priority.action}
                                            </p>
                                          </div>
                                        )}

                                        {/* Follow-up */}
                                        {priority.client && (
                                          <button
                                            onClick={() => {
                                              const matchedClient =
                                                activeClients.find((client: any) => priority.clientId && client.id === priority.clientId) ||
                                                activeClients.find(
                                                  (client: any) =>
                                                    client.name?.toLowerCase() === priority.client?.toLowerCase()
                                                );

                                              if (matchedClient) {
                                                setReturnTo({ actionId: 'overdue', name: 'Find Overdue Clients', response: aiResponse || '' });
                                                setSelectedClientId(matchedClient.id);
                                                setAiResponse(null);

                                                handleActionClick(
                                                  'recommend',
                                                  'Generate Follow-up',
                                                  matchedClient.id
                                                );
                                              }
                                            }}
                                            className="w-full mt-2 py-1.5 px-2 rounded-xl bg-blue-50 text-[#245B92] border border-blue-100 hover:bg-blue-100 font-bold text-[10px] sm:text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                                          >
                                            <Sparkles size={12} className="text-[#20B8BE]" />
                                            Generate Follow-up
                                          </button>
                                        )}

                                      </div>
                                    ))}

                                </div>
                                )}

                                  {/* Blink Recommendation */}
                                  {overdue.recommendation && (
                                    <div className="rounded-xl bg-teal-50/60 border border-teal-100 px-2.5 py-2">

                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <Zap size={12} className="text-[#20B8BE]" />

                                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E]">
                                          Blink Recommendation
                                        </span>
                                      </div>

                                      <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
                                        {overdue.recommendation}
                                      </p>

                                    </div>
                                  )}

                                  {/* Next Best Action */}
                                  {overdue.nextBestAction && (
                                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-2">

                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <ArrowRight size={12} className="text-[#20B8BE]" />

                                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E]">
                                          Next Best Action
                                        </span>
                                      </div>

                                      <p className="text-[11px] sm:text-xs text-slate-700 font-semibold leading-relaxed">
                                        {overdue.nextBestAction}
                                      </p>

                                    </div>
                                  )}

                                </div>
                              );
                            })()
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] sm:text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed break-words block w-full text-left max-h-[42vh] sm:max-h-[240px] overflow-y-auto scroll-smooth">
                            {aiResponse}
                          </div>
                        )}
                      </div>
                    )}
                  

                {/* Summary, Priorities, Overdue: Copy/Export · Refresh */}
                {uiState !== 'processing' && ['summarize', 'priorities', 'overdue'].includes(activeActionId || '') && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {activeActionId === 'summarize' ? (
                      <button onClick={handleExport} className="py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {copiedWhich === 'exported' ? <><Check size={13} className="text-emerald-700" /> Saved</> : <><Download size={13} /> Export</>}
                      </button>
                    ) : (
                      <button onClick={handleCopy} className="py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {copied ? <><Check size={13} className="text-emerald-700" /> Copied</> : <><Copy size={13} /> Copy</>}
                      </button>
                    )}
                    <button
                      onClick={() => handleActionClick(activeActionId || 'summarize', activeActionName || 'Blink')}
                      className="py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] sm:text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw size={13} className="text-[#20B8BE]" /> Refresh
                    </button>
                  </div>
                )}

                {true && (
                <button 
                  onClick={() => { setAiResponse(null); setActiveActionName(null); setActiveActionId(null); setSelectedClientId(null); setClientPickerAction(null); setAllClientsPaid(false); setReturnTo(null); }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[10px] sm:text-[11px] hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1 mt-1"
                >
                  <ArrowLeft size={12} /> Back to Quick Actions
                </button>
                )}
              </div>
            ) : clientPickerAction ? (
              <div className="space-y-2.5" suppressHydrationWarning={true}>
                <div className="mb-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Select Client
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Choose which client you want Blink to work on.
                  </p>
                </div>

                {(() => {
                  const all = urgentClients();
                  const q = pickerSearch.trim().toLowerCase();
                  const shown = q
                    ? all.filter((c: any) => `${c.name || ''} ${c.company || ''}`.toLowerCase().includes(q))
                    : all;

                  if (all.length === 0) {
                    return (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                        <p className="text-[11px] sm:text-xs font-bold text-emerald-700">All caught up! 🎉</p>
                        <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-1">
                          Every client is marked Paid, so there's nothing to follow up on right now.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {all.length > 5 && (
                        <input
                          type="search"
                          value={pickerSearch}
                          onChange={(e) => setPickerSearch(e.target.value)}
                          placeholder={`Search ${all.length} clients`}
                          aria-label="Search clients"
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-base sm:text-xs focus:outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/20"
                        />
                      )}

                      <div className="space-y-1.5 max-h-[46vh] sm:max-h-[300px] overflow-y-auto">
                        {shown.length === 0 && (
                          <p className="text-[10px] sm:text-[11px] text-slate-500 text-center py-4">No client matches &quot;{pickerSearch}&quot;.</p>
                        )}
                        {shown.map((client: any, index: number) => {
                          const late = daysLateFor(client.dueDate) ?? 0;
                          return (
                            <motion.button
                              key={client.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              // Only the first few rows animate in, so long lists stay quick.
                              transition={{ delay: Math.min(index, 6) * 0.03, duration: 0.18 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                const action = clientPickerAction;
                                setClientPickerAction(null);
                                setPickerSearch('');
                                if (action) handleActionClick(action.id, action.name, client.id);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-xl border border-slate-100 hover:border-[#20B8BE]/50 hover:bg-teal-50/20 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-[11px] sm:text-xs text-slate-800 truncate">{client.name}</p>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                                  {formatAmountWithCurrency(client.amount, client.currency)}
                                  {client.company ? ` · ${client.company}` : ''}
                                </p>
                              </div>
                              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                late > 0 ? 'bg-amber-50 text-amber-700' : late === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {timingLabel(client)}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                <button
                  onClick={() => { setClientPickerAction(null); setPickerSearch(''); }}
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
                      setReturnTo(null);
                      const clientSpecificActions = ['recommend', 'rewrite'];
                      const unpaid = urgentClients();

                      if (clientSpecificActions.includes(act.id) && unpaid.length === 1) {
                        // Only one unpaid client: no need to pick, go straight to it.
                        handleActionClick(act.id, act.name, unpaid[0].id);
                      } else if (clientSpecificActions.includes(act.id) && unpaid.length > 1) {
                        setPickerSearch('');
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
              Hi! Generate your first payment reminder for free.
            </p>
            <button onClick={handleLandingAction} className="w-full text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer mb-2 focus:outline-none focus:ring-2 focus:ring-[#245B92]" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }} suppressHydrationWarning={true}>
              <span>Generate a free reminder</span> 
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
    </MotionConfig>
  );
}