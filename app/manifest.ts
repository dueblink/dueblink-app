import type { MetadataRoute } from 'next';

// ============================================================
// DUEBLINK APP SETTINGS (PWA)
// ============================================================
// Tells phones how to install DueBlink like an app:
// its name, icon, colours, and which page opens first.
// Next.js serves this automatically at /manifest.webmanifest.
// ============================================================

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/dashboard',
    name: 'DueBlink – Payment Reminders',
    short_name: 'DueBlink',
    description:
      'Get paid on time. See who to chase today and send payment reminders in one tap.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
