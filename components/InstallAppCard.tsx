'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Download, Share } from 'lucide-react';
import { track } from '@/lib/track';

// ============================================================
// "INSTALL DUEBLINK" CARD (dashboard, phones only)
// ============================================================
// - Android / Chrome: one tap on "Install" installs DueBlink.
// - iPhone / iPad: Apple has no install button, so "How?" shows
//   the 2 steps (Share → Add to Home Screen).
// - Hidden when: already installed, on a computer, the phone can't
//   install, or the user closed it with ✕ (comes back after 14 days).
// ============================================================

const DISMISS_KEY = 'dueblink_install_dismissed_at';
const DISMISS_DAYS = 14;

function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function InstallAppCard() {
  const [mode, setMode] = useState<'hidden' | 'android' | 'ios'>('hidden');
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isInstalled() || recentlyDismissed()) return;

    if (isIOS()) {
      setMode('ios');
      return;
    }

    const check = () => {
      if (window.__dueblinkInstallPrompt) setMode('android');
    };
    const hide = () => setMode('hidden');

    check(); // the signal may already have arrived
    window.addEventListener('dueblink-install-ready', check);
    window.addEventListener('dueblink-installed', hide);
    return () => {
      window.removeEventListener('dueblink-install-ready', check);
      window.removeEventListener('dueblink-installed', hide);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // storage blocked: it just hides for now
    }
    setMode('hidden');
  };

  const install = async () => {
    const promptEvent = window.__dueblinkInstallPrompt;
    if (!promptEvent) return;
    track('install_click');
    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      window.__dueblinkInstallPrompt = undefined;
      if (choice?.outcome === 'accepted') setMode('hidden');
    } catch {
      // the phone refused to show it; nothing to do
    }
  };

  if (mode === 'hidden') return null;

  return (
    <div className="sm:hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-xs" suppressHydrationWarning={true}>
      <div className="flex items-start gap-3">
        <Image src="/icon-192.png" alt="" width={40} height={40} className="w-10 h-10 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900">Install DueBlink</p>
          <p className="text-xs text-slate-600 font-medium">Open your Today list in one tap from your home screen.</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="p-1.5 -mr-1.5 -mt-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {mode === 'android' && (
        <button
          type="button"
          onClick={install}
          className="mt-3 w-full flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs transition hover:opacity-90 cursor-pointer"
          style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
        >
          <Download size={16} /> Install app
        </button>
      )}

      {mode === 'ios' && !showSteps && (
        <button
          type="button"
          onClick={() => {
            setShowSteps(true);
            track('install_click', { platform: 'ios' });
          }}
          className="mt-3 w-full flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs transition hover:opacity-90 cursor-pointer"
          style={{ background: 'linear-gradient(to right, #245B92, #20B8BE)' }}
        >
          <Download size={16} /> How to install
        </button>
      )}

      {mode === 'ios' && showSteps && (
        <ol className="mt-3 space-y-2 text-xs text-slate-700 font-medium bg-slate-50 rounded-xl p-3">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 shrink-0 rounded-full bg-[#245B92] text-white text-[11px] font-black flex items-center justify-center">1</span>
            <span>
              In Safari, tap the Share button <Share size={14} className="inline -mt-0.5 text-[#245B92]" aria-label="Share" />
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 shrink-0 rounded-full bg-[#245B92] text-white text-[11px] font-black flex items-center justify-center">2</span>
            <span>Tap <b className="text-slate-900">Add to Home Screen</b>, then <b className="text-slate-900">Add</b></span>
          </li>
        </ol>
      )}
    </div>
  );
}
