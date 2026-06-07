const CACHE_VERSION = 'tiryani-portal-v7';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;
const MAX_RUNTIME_ENTRIES = 120;
const MAX_API_ENTRIES = 80;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/images/agri-emblem.webp',
  '/images/agri-emblem-192.webp',
  '/images/agri-emblem-512.webp',
  '/images/agri-emblem-192.png',
  '/images/agri-emblem-512.png',
  '/images/rice.webp',
  '/images/paddy.webp',
  '/images/maize.webp',
  '/images/cotton.webp',
  '/images/pulses.webp',
  '/images/oilseeds.webp',
  '/images/greengram.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
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
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_RUNTIME_CACHES') {
    event.waitUntil(deletePortalCaches());
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/index.html'));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/data/') ||
      url.pathname === '/manifest.webmanifest')
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (isSupabaseGet(url)) {
    event.respondWith(networkFirst(request, undefined, API_CACHE, MAX_API_ENTRIES));
  }
});

function isSupabaseGet(url) {
  return (
    url.hostname.endsWith('.supabase.co') &&
    (url.pathname.includes('/rest/v1/') || url.pathname.includes('/storage/v1/object/public/'))
  );
}

async function networkFirst(
  request,
  fallbackPath,
  cacheName = RUNTIME_CACHE,
  maxEntries = MAX_RUNTIME_ENTRIES
) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    await putSafe(cache, request, response);
    trimCache(cacheName, maxEntries).catch(() => undefined);
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackPath) return caches.match(fallbackPath);
    throw new Error('Offline and no cached response is available.');
  }
}

async function cacheFirst(request, cacheName = RUNTIME_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putSafe(cache, request, response);
  trimCache(cacheName, MAX_RUNTIME_ENTRIES).catch(() => undefined);
  return response;
}

async function staleWhileRevalidate(request, cacheName = RUNTIME_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fresh = fetch(request)
    .then(async (response) => {
      await putSafe(cache, request, response);
      trimCache(cacheName, MAX_RUNTIME_ENTRIES).catch(() => undefined);
      return response;
    })
    .catch(() => cached);
  return cached || fresh;
}

async function putSafe(cache, request, response) {
  if (!response || (!response.ok && response.type !== 'opaque')) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    // Some responses cannot be cached because of headers. Keep serving live data.
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function deletePortalCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith('tiryani-portal'))
      .map((key) => caches.delete(key))
  );
}
