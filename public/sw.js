// MOVIE REDX Service Worker
const CACHE_NAME = 'movie-redx-v2';
const STATIC_ASSETS = [
  '/css/style.css',
  '/css/player.css',
  '/js/app.js',
  '/manifest.json',
  '/favicon-32x32.png',
  '/apple-touch-icon.png'
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
  const url = new URL(event.request.url);

  // Never intercept search engine crawlers, sitemap, robots, API, HTML page routes
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/health' ||
    event.request.headers.get('accept')?.includes('text/html') ||
    event.request.headers.get('user-agent')?.includes('bot') ||
    event.request.headers.get('user-agent')?.includes('crawl') ||
    event.request.headers.get('user-agent')?.includes('spider')
  ) {
    return; // Pass through straight to network
  }

  // Network-first for everything else, fallback to cache for static CSS/JS
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
