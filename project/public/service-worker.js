const RESCUE_SW_VERSION = 'agronix-rescue-sw-v8';
const RECOVERY_URL = '/?refresh=sw-missing-asset&reason=missing-asset';
const STATIC_CACHE_NAME = 'agronix-static-v8';
const RUNTIME_CACHE_NAME = 'agronix-runtime-v8';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/images/agronix-logo-original.jpeg',
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
  if (event.data?.type === 'PRECACHE_OFFLINE') {
    event.waitUntil(precacheOfflineAssets());
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

  // Always keep offline page + logo fresh when online
  if (url.pathname === '/offline.html' || url.pathname === '/images/agronix-logo-original.jpeg') {
    event.respondWith(networkFirstStatic(request));
    return;
  }

  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icons/'))) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(fetchOrRecoverMissingBuildAsset(request));
  }
});

async function networkOnlyNavigation(request) {
  try {
    return await fetch(new Request(request, { cache: 'no-store' }));
  } catch (error) {
    // Prefer branded offline page so refresh keeps the animated logo screen
    const offline = await caches.match('/offline.html');
    if (offline) return offline;

    const shell = (await caches.match('/')) || (await caches.match('/index.html'));
    if (shell) return shell;

    return new Response(offlineFallbackHtml(), {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}

function offlineFallbackHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Offline | Agronix</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#eef6f0;font-family:system-ui,sans-serif;text-align:center;padding:24px}
.logo{width:112px;height:112px;border-radius:999px;object-fit:cover;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.14);animation:breathe 4.5s ease-in-out infinite}
.msg{margin:28px 0 0;font-size:1.35rem;font-weight:900;line-height:1.35;color:#020617}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:translateY(-2px) scale(1.025)}}</style></head>
<body><div><img class="logo" src="/images/agronix-logo-original.jpeg" alt="Agronix" width="112" height="112"/>
<p class="msg">AGRONIX is offline<br/>Please reconnect and reopen the app</p></div></body></html>`;
}

async function precacheOfflineAssets() {
  const cache = await caches.open(STATIC_CACHE_NAME);
  await Promise.all(
    STATIC_ASSETS.map(async (asset) => {
      try {
        const response = await fetch(asset, { cache: 'no-store' });
        if (response.ok) await cache.put(asset, response.clone());
      } catch {
        // Best-effort while online
      }
    })
  );
}

async function networkFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  try {
    const response = await fetch(new Request(request, { cache: 'no-store' }));
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (new URL(request.url).pathname === '/offline.html') {
      return new Response(offlineFallbackHtml(), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    throw error;
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
  await caches.delete(RUNTIME_CACHE_NAME);
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
