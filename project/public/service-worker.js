const CACHE_VERSION = 'tiryani-portal-v30';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;
const MAX_ASSET_ENTRIES = 160;
const MAX_IMAGE_ENTRIES = 220;
const MAX_FONT_ENTRIES = 24;

const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png?v=emblem-v5',
  '/icons/icon-512x512.png?v=emblem-v5',
  '/icons/icon-maskable-192x192.png?v=emblem-v5',
  '/icons/icon-maskable-512x512.png?v=emblem-v5',
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
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    deleteOutdatedPortalCaches()
      .then(() => self.clients.claim())
      .then(() => notifyClients({ type: 'SW_UPDATED', version: CACHE_VERSION }))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === 'CLEAR_RUNTIME_CACHES') {
    event.waitUntil(deletePortalCaches());
    return;
  }

  if (event.data?.type === 'GET_VERSION') {
    event.source?.postMessage?.({ type: 'SW_VERSION', version: CACHE_VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (shouldBypassCache(url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkOnlyNavigation(request));
    return;
  }

  if (url.origin === self.location.origin && isBuildAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE, MAX_ASSET_ENTRIES));
    return;
  }

  if (url.origin === self.location.origin && isImageAsset(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
    return;
  }

  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, FONT_CACHE, MAX_FONT_ENTRIES));
    return;
  }

  if (url.origin === self.location.origin && isStaticData(url)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

function isBuildAsset(url) {
  return url.pathname.startsWith('/assets/') && /\.(?:js|css|woff2?|map)$/i.test(url.pathname);
}

function isImageAsset(url) {
  return (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/screenshots/')
  );
}

function isStaticData(url) {
  return (
    url.pathname.startsWith('/data/') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.xml') ||
    url.pathname.endsWith('.txt') ||
    url.pathname === '/manifest.webmanifest'
  );
}

function shouldBypassCache(url) {
  if (url.hostname.endsWith('.supabase.co')) return true;
  if (url.pathname.startsWith('/auth/') || url.pathname.includes('/auth/v1/')) return true;
  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname === '/service-worker.js') return true;
  return false;
}

async function networkOnlyNavigation(request) {
  try {
    return await fetch(request, { cache: 'no-store' });
  } catch {
    return caches.match('/offline.html');
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putSafe(cache, request, response);
  trimCache(cacheName, maxEntries).catch(() => undefined);
  return response;
}

async function staleWhileRevalidate(request, cacheName, maxEntries = 120) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fresh = fetch(request, { cache: 'no-cache' })
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

async function deleteOutdatedPortalCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith('tiryani-portal') && !key.startsWith(CACHE_VERSION))
      .map((key) => caches.delete(key))
  );
}

async function deletePortalCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith('tiryani-portal'))
      .map((key) => caches.delete(key))
  );
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach((client) => client.postMessage(message));
}
