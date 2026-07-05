const RESCUE_SW_VERSION = 'tiryani-portal-rescue-sw-v3';
const RECOVERY_URL = '/?refresh=sw-missing-asset&reason=missing-asset';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clearAllCaches()
      .then(() => self.clients.claim())
      .then(() => notifyClients({ type: 'SW_READY', version: RESCUE_SW_VERSION }))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_RUNTIME_CACHES' || event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(clearAllCaches().then(() => self.skipWaiting()).then(() => self.clients.claim()));
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

  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(fetchOrRecoverMissingBuildAsset(request));
  }
});

async function networkOnlyNavigation(request) {
  try {
    return await fetch(new Request(request, { cache: 'no-store' }));
  } catch (error) {
    const offline = await caches.match('/offline.html');
    return offline || new Response('Tiryani Agriculture Portal is offline. Please reconnect and reopen the app.', {
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

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach((client) => client.postMessage(message));
}