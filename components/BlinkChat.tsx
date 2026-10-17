'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, ArrowUp, RotateCcw, ArrowRight } from 'lucide-react';
import { track } from '@/lib/track';

// ============================================================
// BLINK CHAT — the landing page chat for visitors.
// Answers come from /api/landing-chat (DueBlink facts only).
// ============================================================

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const STORAGE_KEY = 'dueblink_blink_chat_v1';
const MAX_QUESTION = 300;

const GREETING =
  "👋 Hey! I'm Blink. I help freelancers and small businesses get paid on time, without awkward follow-ups. Ask me anything about DueBlink: pricing, reminders, WhatsApp, anything!";

const SUGGESTIONS = [
  'How does DueBlink work?',
  'How much is Pro?',
  'Can it send WhatsApp reminders?',
  'Is there a free plan?',
];

// The buttons Blink can put under an answer ([[id]] in its reply).
const LINKS: Record<string, { label: string; href: string }> = {
  pricing: { label: 'See pricing', href: '/pricing' },
  generator: { label: 'Try free generator', href: '/#reminder-generator' },
  signup: { label: 'Create free account', href: '/create-account' },
  tools: { label: 'Free tools', href: '/tools/whatsapp-payment-reminder' },
  refund: { label: 'Refund policy', href: '/refund-policy' },
  privacy: { label: 'Privacy policy', href: '/privacy' },
  terms: { label: 'Terms of service', href: '/terms' },
  help: { label: 'How reminders work', href: '/help/automated-reminders' },
  contact: { label: 'Contact the team', href: '/contact' },
};

// Splits Blink's reply into the text and its buttons. While the answer
// is still arriving, a half-written "[[pri" is hidden.
// Words the AI sometimes leaves next to a button tag ("… pricing page").
// The button already says it, so they're removed from the end of the reply.
const LEFTOVER_LABELS = [
  'pricing page', 'see pricing', 'free reminder generator', 'try free generator', 'create a free account',
  'create free account', 'free tools', 'refund policy', 'privacy policy', 'terms of service',
  'how automatic reminders work', 'how reminders work', 'the page explaining automatic reminders',
  'contact the team', 'contact page', 'click here', 'see below',
];

function stripLeftoverLabels(text: string): string {
  let out = text.trimEnd();
  let changed = true;
  while (changed) {
    changed = false;
    for (const label of LEFTOVER_LABELS) {
      // Only a stand-alone fragment after a full stop or on its own line,
      // so a normal sentence ending is never cut.
      const re = new RegExp(`(^|[.!?]\\s+|\\n)${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s.:!·|-]*$`, 'i');
      if (re.test(out)) {
        out = out.replace(re, '$1').trimEnd();
        changed = true;
      }
    }
  }
  return out;
}

function splitReply(text: string): { body: string; links: string[] } {
  const links: string[] = [];
  const raw = text
    .replace(/\[\[\s*([a-z]+)\s*\]\]/gi, (_, id: string) => {
      const key = id.toLowerCase();
      if (LINKS[key] && !links.includes(key)) links.push(key);
      return '';
    })
    .replace(/\[\[[^\]]*$/, '')        // half-written tag at the end
    .replace(/\*\*(.*?)\*\*/g, '$1')    // no bold markdown
    .replace(/ {2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // Only clean up leftovers when a button was actually added.
  const body = links.length ? stripLeftoverLabels(raw) : raw;
  return { body, links: links.slice(0, 2) };
}

function loadSaved(): ChatMessage[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved)
      ? saved.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-30)
      : [];
  } catch {
    return [];
  }
}

export default function BlinkChat({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'typing' | 'error' | 'limit'>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // FULL-SCREEN MODE, used on:
  // - phones (narrower than 640 px),
  // - short screens like a phone turned sideways (under 520 px tall),
  // - touch tablets while the keyboard is open.
  // The chat then fills the visible area ABOVE the keyboard and follows it
  // exactly, so the header and messages never slide off the screen.
  // Everywhere else it's the floating box in the corner.
  const [mobileBox, setMobileBox] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px), (max-height: 519px)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const vv = window.visualViewport;
    const update = () => {
      const keyboardOpen = vv ? vv.height < window.innerHeight * 0.8 : false;
      const fullScreen = mq.matches || (coarse.matches && keyboardOpen);
      if (!fullScreen) { setMobileBox(null); return; }
      setMobileBox({
        top: vv ? vv.offsetTop : 0,
        height: vv ? vv.height : window.innerHeight,
      });
    };
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    mq.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      mq.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // While the full-screen chat is open on a phone, the page behind it
  // doesn't scroll.
  const isMobileSheet = mobileBox !== null;
  useEffect(() => {
    if (!isMobileSheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isMobileSheet]);

  // Keyboard opened or closed: keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mobileBox?.height]);

  // Restore this visit's chat (survives a page reload).
  useEffect(() => {
    setMessages(loadSaved());
    track('blink_chat_open');
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Storage blocked: the chat still works, it just won't survive a reload.
    }
  }, [messages]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const ask = async (question: string, history: ChatMessage[] = messages) => {
    const text = question.trim().slice(0, MAX_QUESTION);
    if (!text || status === 'typing') return;

    const next: ChatMessage[] = [...history, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setStatus('typing');
    track('blink_chat_question');

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/landing-chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-8) }),
      });

      if (response.status === 429) {
        setStatus('limit');
        return;
      }
      if (!response.ok || !response.body) throw new Error('Chat failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';
      let lastPaint = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (abortRef.current !== controller) { reader.cancel().catch(() => {}); return; }
        reply += decoder.decode(value, { stream: true });
        const now = Date.now();
        if (now - lastPaint > 80) {
          lastPaint = now;
          setMessages([...next, { role: 'assistant', content: reply }]);
        }
      }

      if (abortRef.current !== controller) return;
      if (!reply.trim()) throw new Error('Empty reply');
      setMessages([...next, { role: 'assistant', content: reply }]);
      setStatus('idle');
    } catch {
      if (abortRef.current === controller) setStatus('error');
    }
  };

  // Try again: resend the last question.
  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const idx = messages.lastIndexOf(lastUser);
    setStatus('idle');
    ask(lastUser.content, messages.slice(0, idx));
  };

  const newChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setStatus('idle');
    setInput('');
    inputRef.current?.focus();
  };

  const openLink = (id: string) => {
    const link = LINKS[id];
    if (!link) return;
    track('blink_chat_link', { link: id });
    if (id === 'generator') {
      const el = document.getElementById('reminder-generator');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        onClose();
        return;
      }
    }
    router.push(link.href);
    onClose();
  };

  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.7 }}
      className={
        isMobileSheet
          ? 'fixed left-0 right-0 z-[10] bg-white flex flex-col overflow-hidden'
          : 'bg-white border border-slate-200/90 shadow-2xl rounded-2xl w-[min(350px,calc(100vw-32px))] lg:w-[370px] h-[min(560px,calc(100vh-230px))] min-h-[280px] flex flex-col overflow-hidden transform-gpu'
      }
      style={mobileBox ? { top: mobileBox.top, height: mobileBox.height } : undefined}
      role="dialog"
      aria-label="Chat with Blink"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#245B92] to-[#20B8BE] px-3.5 py-3 text-white flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-full bg-white/20 border border-white/30 shrink-0"
            style={{ backgroundImage: "url('/anima-bot.svg')", backgroundSize: '120%', backgroundPosition: 'center' }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold leading-none">Blink</p>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
              <span className="text-[10px] font-semibold text-white/85">Online</span>
            </div>
            <p className="text-[10px] text-white/85 mt-1 truncate">Ask me anything about DueBlink</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={newChat}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition cursor-pointer"
              aria-label="Start a new chat"
              title="New chat"
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition cursor-pointer"
            aria-label="Close chat"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-slate-50/60"
        style={isMobileSheet ? { paddingInline: 'max(12px, calc((100% - 640px) / 2))' } : undefined}
        aria-live="polite"
      >
        {/* Greeting */}
        <div className="flex">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white border border-slate-100 px-3 py-2 text-[12px] sm:text-[13px] text-slate-700 leading-relaxed shadow-3xs">
            {GREETING}
          </div>
        </div>

        {/* Suggested questions (only before the first question) */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="px-2.5 py-1.5 rounded-full border border-[#245B92]/20 bg-white text-[11px] font-semibold text-[#245B92] hover:bg-[#245B92]/5 transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md px-3 py-2 text-[12px] sm:text-[13px] text-white leading-relaxed whitespace-pre-wrap break-words" style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}>
                  {m.content}
                </div>
              </div>
            );
          }
          const { body, links: rawLinks } = splitReply(m.content);
          // The same button right after it was just shown (in Blink's previous
          // answer) is skipped, unless the visitor asked for that page again.
          const prevAnswer = messages.slice(0, i).reverse().find((x) => x.role === 'assistant');
          const prevLinks = new Set(prevAnswer ? splitReply(prevAnswer.content).links : []);
          const askedAgain = (id: string) => {
            const question = (messages[i - 1]?.role === 'user' ? messages[i - 1].content : '').toLowerCase();
            const words: Record<string, string[]> = {
              pricing: ['price', 'pricing', 'plan', 'cost', 'kitna', 'pay'],
              generator: ['generator', 'try', 'free reminder'],
              signup: ['sign up', 'signup', 'account', 'register', 'start'],
              tools: ['tool'],
              refund: ['refund'],
              privacy: ['privacy', 'data', 'safe'],
              terms: ['terms'],
              help: ['automatic', 'automated', 'how it works'],
              contact: ['contact', 'support', 'talk', 'email', 'human'],
            };
            return (words[id] || []).some((w) => question.includes(w));
          };
          const links = rawLinks.filter((id) => !prevLinks.has(id) || askedAgain(id));
          const isLast = i === messages.length - 1;
          return (
            <div key={i} className="flex flex-col items-start gap-1.5">
              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white border border-slate-100 px-3 py-2 text-[12px] sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words shadow-3xs">
                {body}
              </div>
              {links.length > 0 && (!isLast || status !== 'typing') && (
                <div className="flex flex-wrap gap-1.5">
                  {links.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openLink(id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white shadow-sm hover:opacity-90 transition cursor-pointer"
                      style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                    >
                      {LINKS[id].label} <ArrowRight size={11} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing dots (before the first words arrive) */}
        {status === 'typing' && lastIsUser && (
          <div className="flex" role="status" aria-label="Blink is typing">
            <div className="rounded-2xl rounded-tl-md bg-white border border-slate-100 px-3 py-2.5 flex items-center gap-1 shadow-3xs">
              {['#245B92', '#2289A8', '#20B8BE'].map((color, i) => (
                <span
                  key={color}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: color, animation: `blinkDot 1s ease-in-out ${i * 0.16}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-start gap-1.5">
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-rose-50 border border-rose-100 px-3 py-2 text-[12px] text-rose-700">
              Oops, I couldn&apos;t reply just now. Please try again.
            </div>
            <button type="button" onClick={retry} className="text-[11px] font-bold text-[#245B92] underline cursor-pointer">
              Try again
            </button>
          </div>
        )}

        {status === 'limit' && (
          <div className="flex flex-col items-start gap-1.5">
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white border border-slate-100 px-3 py-2 text-[12px] text-slate-700 leading-relaxed">
              You&apos;ve asked a lot today 😄 Create a free account to try DueBlink, or message the team and they&apos;ll help you.
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['signup', 'contact'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => openLink(id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white shadow-sm hover:opacity-90 transition cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
                >
                  {LINKS[id].label} <ArrowRight size={11} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input: one clean rounded box with the send button inside */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="p-2.5 border-t border-slate-100 bg-white flex-shrink-0"
        style={isMobileSheet ? {
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          paddingInline: 'max(10px, calc((100% - 640px) / 2))',
        } : undefined}
      >
        <div className="blink-chat-input flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 pl-4 pr-1 py-1 transition-colors focus-within:border-[#20B8BE] focus-within:bg-white">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX_QUESTION}
            disabled={status === 'limit'}
            placeholder="Type your question…"
            aria-label="Type your question for Blink"
            className="flex-1 min-w-0 py-1.5 bg-transparent border-0 outline-none text-base sm:text-[13px] text-slate-800 placeholder:text-slate-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || status === 'typing' || status === 'limit'}
            aria-label="Send question"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
          >
            <ArrowUp size={15} />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
