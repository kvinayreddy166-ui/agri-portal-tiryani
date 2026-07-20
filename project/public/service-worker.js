const RESCUE_SW_VERSION = 'agronix-rescue-sw-v1';
const RECOVERY_URL = '/?refresh=sw-missing-asset&reason=missing-asset';
const STATIC_CACHE_NAME = 'agronix-static-v1';
const RUNTIME_CACHE_NAME = 'agronix-runtime-v1';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/icons/icon-192x192.png?v=agronix-v2',
  '/icons/icon-512x512.png?v=agronix-v2',
  '/images/agri-emblem-192.webp',
  '/fonts/atkinson-hyperlegible-next-latin-400-normal.woff2',
  '/fonts/atkinson-hyperlegible-next-latin-800-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clearOldCaches(),
      self.clients.claim(),
    ])
      .then(() => notifyClients({ type: 'SW_READY', version: RESCUE_SW_VERSION }))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_RUNTIME_CACHES') {
    event.waitUntil(clearRuntimeCaches().then(() => self.clients.claim()));
  }
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting().then(() => self.clients.claim()));
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkOnlyNavigation(request));
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache static assets with stale-while-revalidate
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icons/'))) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Handle scripts and styles with recovery
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(fetchOrRecoverMissingBuildAsset(request));
  }
});

async function networkOnlyNavigation(request) {
  try {
    return await fetch(new Request(request, { cache: 'no-store' }));
  } catch (error) {
    const offline = await caches.match('/offline.html');
    return offline || new Response('Agronix is offline. Please reconnect and reopen the app.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function fetchOrRecoverMissingBuildAsset(request) {
  try {
    const response = await fetch(new Request(request, { cache: 'no-store' }));
    if (response.ok || response.type === 'opaque') return response;
    if (response.status !== 404 && response.status !== 410) return response;
  } catch (error) {
    return missingAssetRecoveryResponse(request);
  }
  return missingAssetRecoveryResponse(request);
}

function missingAssetRecoveryResponse(request) {
  if (request.destination === 'style') {
    return new Response('', {
      status: 200,
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(
    "try{location.replace('" + RECOVERY_URL + "&ts='+Date.now())}catch(e){location.href='" + RECOVERY_URL + "'}; export {};",
    {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  );
}

async function clearAllCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

async function clearOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys.map((key) => {
      if (key !== STATIC_CACHE_NAME && key !== RUNTIME_CACHE_NAME) {
        return caches.delete(key);
      }
    })
  );
}

async function clearRuntimeCaches() {
  if (caches.delete(RUNTIME_CACHE_NAME)) {
    await caches.delete(RUNTIME_CACHE_NAME);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  const networkFetch = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  return cached || networkFetch;
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach((client) => client.postMessage(message));
}