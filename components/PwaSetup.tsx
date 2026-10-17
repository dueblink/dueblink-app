'use client';

import { useEffect } from 'react';
import { track } from '@/lib/track';

// ============================================================
// PWA SETUP (runs on every page, shows nothing)
// ============================================================
// 1. Turns on the background helper (public/sw.js).
// 2. Catches the phone's "this can be installed" signal as soon as
//    the site opens, and keeps it so the dashboard's Install button
//    can use it later (the signal often arrives before the dashboard
//    has finished loading).
// ============================================================

declare global {
  interface Window {
    __dueblinkInstallPrompt?: any;
  }
}

export default function PwaSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // If it fails, the site still works normally.
      });
    }

    const onPrompt = (e: Event) => {
      e.preventDefault(); // we show our own button instead of the browser's
      window.__dueblinkInstallPrompt = e;
      window.dispatchEvent(new Event('dueblink-install-ready'));
    };

    const onInstalled = () => {
      window.__dueblinkInstallPrompt = undefined;
      window.dispatchEvent(new Event('dueblink-installed'));
      track('app_installed');
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return null;
}
