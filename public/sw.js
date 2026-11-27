// EcoFurnish service worker
// Strategy: cache the app shell + static assets for a fast, installable, partly-offline
// experience. Anything touching money, auth, or personalized/admin data is deliberately
// left untouched so it always goes straight to the network.

// Bump this number whenever caching rules change: every device deletes the
// older caches the next time it loads the site.
const CACHE_VERSION = 'ecofurnish-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const APP_SHELL = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

// Never intercept these — always go straight to the network. This covers auth,
// payments, cart mutations, admin/dispatcher/driver data, and anything else that
// must never be stale.
const NEVER_CACHE_PREFIXES = [
  '/api/',
  '/admin',
  '/dispatcher',
  '/driver',
  '/account',
  '/checkout',
  '/cart',
  '/order-confirmation',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
];

function isNeverCache(pathname) {
  return NEVER_CACHE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
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
            .filter((key) => key.startsWith('ecofurnish-') && key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever handle GET — POST/PUT/DELETE (checkout, cart mutations, forms) pass through natively.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin routes that must always be fresh: skip entirely, let the browser fetch normally.
  if (url.origin === self.location.origin && isNeverCache(url.pathname)) {
    return;
  }

  // Next.js fetches a page's data (the "RSC payload") in the background when
  // you move between pages. That data changes with every deploy and with
  // every product edit, so it must never come from a cache: serving an old
  // copy next to new code is what made some product pages show an error in a
  // normal tab but not in a private one.
  if (request.headers.get('RSC') || url.searchParams.has('_rsc')) {
    return;
  }

  // Page navigations: network-first, falling back to a cached copy, then the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only keep good pages, so an error page is never replayed later.
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/offline');
        })
    );
    return;
  }

  // Next.js build assets and local images/icons/fonts: cache-first, they're either
  // content-hashed or effectively static.
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/icon') ||
      url.pathname.startsWith('/images/') ||
      /\.(png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Everything else (including cross-origin product photography): stale-while-revalidate,
  // best-effort only — never block or fail the request because of a caching error.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
