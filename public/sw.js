// Movie redx Service Worker for Offline Shell Caching
const CACHE_NAME = 'movie-redx-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/watch.html',
  '/dmca.html',
  '/css/style.css',
  '/css/player.css',
  '/js/app.js',
  '/js/player.js',
  '/js/ads.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some static assets failed to pre-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Don't cache TMDB or streaming API calls
  if (event.request.url.includes('/api/') || event.request.url.includes('themoviedb.org') || event.request.url.includes('/embed/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        // Fallback for html pages
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
