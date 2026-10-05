// SatyaDrishti Conservative Service Worker
// Version: 2.0.0
const CACHE_NAME = 'satyadrishti-shell-v2';

// Static UI shell assets to cache on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/ocr/worker.min.js',
  '/ocr/tesseract-core-lstm.wasm.js',
  '/ocr/tesseract-core-lstm.wasm',
  '/ocr/eng.traineddata',
];

// Install: pre-cache the UI shell and local OCR runtime assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Conservative caching policy
// CRITICAL: Sensitive compliance, inspection, violation, and report APIs are NEVER cached statically.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Non-GET requests always bypass service worker
  if (request.method !== 'GET') {
    return;
  }

  // Explicitly bypass caching for API endpoints and sensitive data
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/violations') ||
    url.pathname.includes('/compliance') ||
    url.pathname.includes('/inspections') ||
    url.pathname.includes('/reports') ||
    url.pathname.includes('/stream')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // OCR runtime/model assets are installed with the shell for offline field scans.
  if (url.pathname.startsWith('/ocr/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) =>
        cachedResponse || fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
      )
    );
    return;
  }

  // Navigation requests: Network-first with offline shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (scripts, styles, fonts, images): Stale-while-revalidate / Cache-first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch fresh copy in background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
