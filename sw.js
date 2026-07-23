/* ==========================================================================
   sw.js — Service Worker for 100% offline support.
   Cache-first strategy: once installed, the app never needs the network.
   Bump CACHE_NAME whenever any cached file changes to force a refresh.
   ========================================================================== */

const CACHE_NAME = 'levellist-cache-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/utils.js',
  './js/storage.js',
  './js/sound.js',
  './js/popup.js',
  './js/avatar.js',
  './js/xp.js',
  './js/level.js',
  './js/rank.js',
  './js/streak.js',
  './js/quest.js',
  './js/records.js',
  './js/settings.js',
  './js/app.js',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Cache newly-fetched same-origin assets for future offline use.
          if (event.request.method === 'GET' && response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
