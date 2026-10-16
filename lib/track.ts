// ============================================================
// GOOGLE ANALYTICS STEP TRACKING
// ============================================================
// Sends a named step ("event") to Google Analytics through the
// Firebase connection DueBlink already has (lib/firebase.ts).
// If Analytics is blocked or not supported, nothing happens and
// the site works exactly the same.
//
// Steps tracked:
//   generate_reminder   landing page generator wrote a reminder
//   copy_reminder       visitor copied a generated reminder
//   start_free_click    visitor clicked a "Start free" / sign-up button
//   view_pricing        pricing page opened
//   sign_up             new account created (first visit to the dashboard)
//   add_client          a client / invoice was added
//   send_reminder       tap-to-send used on the dashboard
//   begin_checkout      Pro checkout started
//   purchase            Pro payment verified (India / Razorpay)

import { logEvent } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

type EventParams = Record<string, string | number | boolean | undefined>;

export function track(name: string, params?: EventParams): void {
  if (typeof window === 'undefined' || !analytics) return;

  analytics
    .then((instance) => {
      if (instance) logEvent(instance, name, params);
    })
    .catch(() => {
      // Tracking must never break the page.
    });
}

// Sends an event only once per browser (e.g. sign_up), using a
// localStorage note. If storage is blocked, it still sends once per page load.
const sentThisLoad = new Set<string>();

export function trackOnce(key: string, name: string, params?: EventParams): void {
  const storageKey = `dueblink_tracked_${key}`;
  if (sentThisLoad.has(storageKey)) return;
  sentThisLoad.add(storageKey);

  try {
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, '1');
  } catch {
    // Storage blocked: the in-memory note above still prevents repeats.
  }

  track(name, params);
}
