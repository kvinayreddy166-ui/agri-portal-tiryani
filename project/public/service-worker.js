const CACHE_VERSION = 'tiryani-portal-v21';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;
const MAX_RUNTIME_ENTRIES = 120;
const MAX_API_ENTRIES = 80;
const MAX_IMAGE_ENTRIES = 200;
const MAX_FONT_ENTRIES = 20;

const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png?v=emblem-v4',
  '/icons/icon-512x512.png?v=emblem-v4',
  '/icons/icon-maskable-192x192.png?v=emblem-v4',
  '/icons/icon-maskable-512x512.png?v=emblem-v4',
  '/images/agri-emblem.webp',
  '/images/agri-emblem-192.webp',
  '/images/agri-emblem-512.webp',
  '/images/rice.webp',
  '/data/crop-intelligence.json',
  '/sitemap.xml',
  '/robots.txt',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    deletePortalCaches()
      .then(() => caches.open(STATIC_CACHE))
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

  // Navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/index.html', RUNTIME_CACHE).catch(() => caches.match('/offline.html')));
    return;
  }

  // Build assets - cache first
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // Images - cache first with larger cache size
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/screenshots/'))
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
    return;
  }

  // Data files - stale while revalidate
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/data/') ||
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.xml') ||
      url.pathname.endsWith('.txt') ||
      url.pathname === '/manifest.webmanifest')
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Fonts - cache first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, FONT_CACHE, MAX_FONT_ENTRIES));
    return;
  }

  // Supabase API - network first with API cache
  if (isSupabaseGet(url)) {
    event.respondWith(networkFirst(request, undefined, API_CACHE, MAX_API_ENTRIES));
    return;
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

async function cacheFirst(request, cacheName = RUNTIME_CACHE, maxEntries = MAX_RUNTIME_ENTRIES) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putSafe(cache, request, response);
  trimCache(cacheName, maxEntries).catch(() => undefined);
  return response;
}

async function staleWhileRevalidate(request, cacheName = RUNTIME_CACHE, maxEntries = MAX_RUNTIME_ENTRIES) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fresh = fetch(request)
    .then(async (response) => {
      await putSafe(cache, request, response);
      trimCache(cacheName, maxEntries).catch(() => undefined);
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

