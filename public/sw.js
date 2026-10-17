// ============================================================
// DUEBLINK BACKGROUND HELPER (service worker)
// ============================================================
// Needed so phones treat DueBlink as an installable app.
// It does NOT save or cache pages: every page loads fresh from the
// internet exactly like before. Only when the phone has no internet
// does it show a small "You're offline" page instead of an error.
// ============================================================

const OFFLINE_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DueBlink – You're offline</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fff;color:#0F172A;padding:24px;box-sizing:border-box}
  .box{max-width:320px;text-align:center}
  img{width:72px;height:72px}
  h1{font-size:20px;margin:16px 0 8px}
  p{font-size:14px;color:#475569;margin:0 0 20px;line-height:1.5}
  button{border:0;border-radius:12px;padding:12px 24px;font-weight:700;font-size:14px;color:#fff;
         background:linear-gradient(to right,#245B92,#20B8BE);cursor:pointer}
</style></head>
<body><div class="box">
  <img src="/icon-192.png" alt="">
  <h1>You're offline</h1>
  <p>DueBlink needs the internet to load your clients. Check your connection and try again.</p>
  <button onclick="location.reload()">Try again</button>
</div></body></html>`;

self.addEventListener('install', (event) => {
  // Keep the icon ready for the offline page.
  event.waitUntil(
    caches.open('dueblink-offline-v1').then((cache) => cache.add('/icon-192.png')).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // The offline page's icon.
  if (req.method === 'GET' && new URL(req.url).pathname === '/icon-192.png') {
    event.respondWith(fetch(req).catch(() => caches.match('/icon-192.png')));
    return;
  }

  // Only page openings are handled; everything else (data, login,
  // payments, images) goes straight to the internet as normal.
  if (req.mode !== 'navigate') return;

  event.respondWith(
    fetch(req).catch(
      () => new Response(OFFLINE_PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    )
  );
});
