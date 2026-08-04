const CACHE_NAME = 'mn-sales-v3';
const APP_SHELL = [
  './',
  './index.html',
  './overview.html',
  './leads.html',
  './tasks.html',
  './content.html',
  './money.html',
  './compare.html',
  './notifications.html',
  './manifest.webmanifest',
  './pwa-install.js',
  './images/hero-phone.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        APP_SHELL.map((url) =>
          fetch(url, { cache: 'reload' }).then((response) => cache.put(url, response))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Cross-origin requests (Supabase data, Telegram, external CDNs) go straight
  // to the network untouched — offline behavior for live data is handled by
  // the app itself, not the cache.
  if (url.origin !== self.location.origin) return;

  // Same-origin app files: serve instantly from cache if we have it (this is
  // what makes offline reliable — no dependency on how fast/slow the browser
  // notices there's no network), and refresh the cache in the background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req, { cache: 'reload' })
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, response.clone()));
          return response;
        })
        .catch(() => cached || caches.match('./index.html'));

      return cached || network;
    })
  );
});
