/* Free Scripture — service worker
   Strategy: cache-first for assets, stale-while-revalidate for pages.
   Bible chapter pages are cached on first read, so they're available
   offline the next time. All three translations. No tracking, no
   analytics, no external pings — reads stay on the device.
*/

var SHELL = 'freescripture-shell-v28';
var PAGES = 'freescripture-pages-v14';
var ASSETS = 'freescripture-assets-v14';

/* App shell — pre-cached on install so the core UI is always available. */
var PRECACHE = [
  '/',
  '/read/',
  '/stories/',
  '/parables/',
  '/search/',
  '/about/',
  '/genre/',
  '/web/',
  '/kjv/',
  '/bbe/',
  '/static/css/site.css?v=31',
  '/static/js/reading-prefs.js?v=12',
  '/static/js/chapter.js?v=9',
  '/static/js/pages.js?v=2',
  '/static/js/search.js?v=2',
  '/static/js/shortcuts.js?v=1',
  '/static/search-index-web.json',
  '/static/search-index-kjv.json',
  '/static/search-index-bbe.json',
  '/static/favicon.svg',
  '/static/icons/icon-192.png',
  '/manifest.json',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(SHELL)
      .then(function(cache) { return cache.addAll(PRECACHE); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  var current = [SHELL, PAGES, ASSETS];
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return current.indexOf(k) === -1; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  var url = new URL(req.url);

  /* Only handle same-origin requests and Google Fonts. */
  if (url.origin !== self.location.origin &&
      !url.hostname.endsWith('fonts.googleapis.com') &&
      !url.hostname.endsWith('fonts.gstatic.com')) return;

  /* Static assets (CSS, JS, icons, fonts): cache-first.
     These are versioned in the URL, so a stale cache is never wrong. */
  if (url.pathname.startsWith('/static/') ||
      url.pathname === '/manifest.json' ||
      url.hostname.endsWith('fonts.gstatic.com') ||
      url.hostname.endsWith('fonts.googleapis.com')) {
    e.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(res) {
          if (!res || res.status !== 200) return res;
          var clone = res.clone();
          caches.open(ASSETS).then(function(c) { c.put(req, clone); });
          return res;
        });
      })
    );
    return;
  }

  /* HTML pages (navigate requests): network-first so users always get
     fresh content when online, fall back to the cached page when offline.
     Chapter pages are cached lazily as the reader navigates — they're
     available offline after the first visit. */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function(res) {
        if (!res || res.status !== 200) return res;
        var clone = res.clone();
        caches.open(PAGES).then(function(c) { c.put(req, clone); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          /* Offline fallback: return the cached page, or the homepage
             if this specific page hasn't been visited before. */
          return cached || caches.match('/');
        });
      })
    );
    return;
  }
});
