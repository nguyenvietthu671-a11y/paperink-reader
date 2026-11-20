const SHELL_CACHE = 'paperink-shell-v9';
const RUNTIME_CACHE = 'paperink-runtime-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './vendor/jszip.min.js',
  './js/db.js',
  './js/shelf-decor.js',
  './js/epub-engine.js',
  './js/ink-canvas.js',
  './js/dictionary-ui.js',
  './js/reader.js',
  './js/demo-book.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cache Google Fonts & local book covers with cache-first
  const isGoogleFont =
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com';
  const isBookCover =
    url.origin === self.location.origin && /\/api\/books\/[^/]+\/cover$/.test(url.pathname);

  if (isGoogleFont || isBookCover) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.ok) {
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (_) {
          return cached || new Response('', { status: 504 });
        }
      })
    );
    return;
  }

  // Let dynamic APIs go straight to network (offline handled by IndexedDB in app)
  if (url.origin === self.location.origin && url.pathname.includes('/api/')) {
    return;
  }

  // App shell: network-first when online, instant fallback to cache when offline
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((fresh) => {
          if (fresh && fresh.ok) {
            const copy = fresh.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(req, copy));
          }
          return fresh;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        })
    );
  }
});
