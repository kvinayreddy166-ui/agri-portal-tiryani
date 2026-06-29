const DISABLE_CACHE_VERSION = 'tiryani-portal-sw-disabled-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clearAllCaches()
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() => notifyClients({ type: 'SW_DISABLED', version: DISABLE_CACHE_VERSION }))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_RUNTIME_CACHES' || event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(clearAllCaches().then(() => self.registration.unregister()));
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