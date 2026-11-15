const RECOVERY_KEY = 'tiryani-pwa-recovery-attempted-at';
const RECOVERY_WINDOW_MS = 30_000;

// Must match STATIC_CACHE_NAME / RUNTIME_CACHE_NAME in public/service-worker.js.
const CURRENT_SW_CACHES = ['agronix-static-v15', 'agronix-runtime-v15'];

const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
];

export function installPwaRecovery() {
  if (typeof window === 'undefined') return;
  // In dev, Vite handles module errors itself — the SW/reload recovery would
  // interfere with lazy imports used by downloads (jspdf/docx/xlsx).
  if (import.meta.env.DEV) return;

  window.addEventListener('error', (event) => {
    const target = event.target as HTMLElement | null;
    const isScriptFailure = target?.tagName === 'SCRIPT';
    if (isScriptFailure || isRecoverableChunkError(event.message)) {
      void recoverFromStaleAssets();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason || '');
    if (isRecoverableChunkError(message)) {
      void recoverFromStaleAssets();
    }
  });
}

export function isRecoverableChunkError(message: string) {
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export async function recoverFromStaleAssets() {
  if (!shouldAttemptRecovery()) return;

  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_RUNTIME_CACHES' });

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations || []).map(async (registration) => {
      try { registration.active?.postMessage({ type: 'CLEAR_RUNTIME_CACHES' }); } catch {}
      // Do NOT call registration.update() automatically - let user control updates
    }));
    if (!registrations?.some((registration) => new URL(registration.scope).pathname === '/')) {
      await navigator.serviceWorker?.register('/service-worker.js', { scope: '/' });
    }
  } catch {
    // Reloading with network cache bypass is still the best recovery path.
  } finally {
    try {
      window.sessionStorage.removeItem('tiryani-startup-recovery-v4');
    } catch {
      // Startup recovery state is best-effort only.
    }

    // Preserve the current path for public routes
    const currentPath = window.location.pathname;
    const isPublicRoute = currentPath.startsWith('/officer-toolkit/') || currentPath === '/officer-toolkit';
    
    const url = new URL(isPublicRoute ? currentPath : '/', window.location.origin);
    url.searchParams.set('refresh', String(Date.now()));
    url.searchParams.set('reason', 'stale-assets');
    window.location.replace(url.toString());
  }
}

function shouldAttemptRecovery() {
  try {
    const lastAttempt = Number(window.sessionStorage.getItem(RECOVERY_KEY) || 0);
    if (Date.now() - lastAttempt < RECOVERY_WINDOW_MS) return false;
    window.sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
  } catch {
    return true;
  }
  return true;
}

/**
 * Registers the app service worker (if missing), asks active workers to
 * precache the offline shell, and prunes stale cache buckets.
 * Deliberately does NOT clear runtime caches here — /assets/* entries are
 * content-hashed and must survive reloads or offline cold starts have no
 * cached entry bundle. Clearing is reserved for explicit recovery paths
 * (recoverFromStaleAssets, clearAppCacheAndReload). Also does NOT call
 * update() or SKIP_WAITING — activation stays user-approved via the banner.
 */
async function syncServiceWorker() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
    const appRegistrations = registrations.filter(
      (registration) => new URL(registration.scope).origin === window.location.origin
    );

    await Promise.all(appRegistrations.map(async (registration) => {
      try { registration.active?.postMessage({ type: 'PRECACHE_OFFLINE' }); } catch {}
    }));

    if (!appRegistrations.some((registration) => new URL(registration.scope).pathname === '/')) {
      await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none',
      });
    }

    if ('caches' in window) {
      const keys = await caches.keys();
      // Drop stale static caches so an older offline.html banner cannot survive refresh
      await Promise.all(
        keys
          .filter((key) => !CURRENT_SW_CACHES.includes(key))
          .map((key) => caches.delete(key))
      );
    }

    // Clear legacy offline-banner session flags from earlier builds
    try {
      window.sessionStorage.removeItem('tiryani-offline-screen-shown');
      window.sessionStorage.removeItem('tiryani-offline-shell-retry');
    } catch {}
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Service worker sync failed:', error);
  }
}

/**
 * Owns the app's service-worker lifecycle: dev cleanup, production sync, the
 * controllerchange reload, and update checks. There is no update banner —
 * a waiting worker is activated automatically on page load/refresh, and
 * periodic checks only download new versions in the background.
 */
export function initServiceWorkerLifecycle() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (import.meta.env.DEV) {
    window.addEventListener('load', () => {
      // In dev, the SW's fetch interception breaks Vite module loading and lazy
      // imports (jspdf/docx/xlsx). Unregister any existing SW and clear caches.
      void navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            void registration.unregister().then(() => {
              if ('caches' in window) {
                void caches.keys().then((keys) =>
                  Promise.all(keys.map((key) => caches.delete(key)))
                );
              }
            });
          });
        })
        .catch(() => {});
    });
    return;
  }

  window.addEventListener('load', () => {
    void syncServiceWorker();
    void applyUpdateOnRefresh();
  });

  // Listen for service worker controller change - reload after new SW activates
  let hasReloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasReloaded) return;
    hasReloaded = true;
    window.dispatchEvent(new CustomEvent('serviceWorkerUpdate'));
    window.location.reload();
  });

  const waitForWaitingWorker = (registration: ServiceWorkerRegistration, timeoutMs = 10000) => {
    return new Promise<ServiceWorker | null>((resolve) => {
      if (registration.waiting) return resolve(registration.waiting);

      let settled = false;
      const finish = (worker: ServiceWorker | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        registration.removeEventListener('updatefound', onUpdateFound);
        resolve(worker);
      };
      const onStateChange = (event: Event) => {
        if ((event.target as ServiceWorker).state === 'installed') finish(registration.waiting);
      };
      const onUpdateFound = () => {
        registration.installing?.addEventListener('statechange', onStateChange);
      };
      const timer = window.setTimeout(() => finish(registration.waiting), timeoutMs);

      registration.addEventListener('updatefound', onUpdateFound);
      if (registration.installing) onUpdateFound();
    });
  };

  // On refresh: activate any waiting worker so the reload picks up the new
  // version. controllerchange reloads the page once it takes control.
  let updateApplyStarted = false;
  const applyUpdateOnRefresh = async () => {
    if (updateApplyStarted) return;
    updateApplyStarted = true;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      let worker = registration.waiting;
      if (!worker) {
        try { await registration.update(); } catch {}
        worker = await waitForWaitingWorker(registration, 10000);
      }
      worker?.postMessage({ type: 'SKIP_WAITING' });
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[PWA] Update check failed:', error);
    }
  };

  // Periodically check for updates (every 5 minutes) - downloads new versions
  // in the background; they activate on the next refresh.
  const checkForUpdates = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      try { await registration.update(); } catch {}
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[PWA] Service worker check failed:', error);
    }
  };

  // Check once shortly after load in case the SW was still installing
  window.setTimeout(() => {
    void applyUpdateOnRefresh();
  }, 3000);

  // Periodically check for updates (every 5 minutes) - detection only, no activation
  setInterval(() => {
    void checkForUpdates();
  }, 5 * 60 * 1000);
}
