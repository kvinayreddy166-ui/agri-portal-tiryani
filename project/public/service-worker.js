const DISABLE_CACHE_VERSION = 'tiryani-portal-sw-disabled-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clearAllCaches()
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() => notifyClients({ type: 'SW_DISABLED', version: DISABLE_CACHE_VERSION }))
      .then(() => navigateClients())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_RUNTIME_CACHES' || event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(clearAllCaches().then(() => self.registration.unregister()).then(() => navigateClients()));
  }
});

self.addEventListener('fetch', () => {
  // Intentionally empty: do not intercept navigation, assets, Supabase, or API calls.
});

async function clearAllCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach((client) => client.postMessage(message));
}

async function navigateClients() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  await Promise.all(clients.map((client) => {
    try {
      const url = new URL(client.url);
      url.searchParams.set('sw-cleared', Date.now().toString());
      return client.navigate(url.toString());
    } catch (error) {
      return undefined;
    }
  }));
}
