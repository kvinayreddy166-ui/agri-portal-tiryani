export const APP_BUILD_TIMESTAMP =
  (import.meta.env.VITE_APP_BUILD_TIMESTAMP as string | undefined) || 'dev';

export const APP_VERSION =
  (import.meta.env.VITE_APP_VERSION as string | undefined) || APP_BUILD_TIMESTAMP;

export const APP_BUILD_LABEL = (() => {
  // ALWAYS show the cached installed version - this represents the version actually running
  const cached = getCachedAppVersion();
  if (cached) {
    const cachedTimestamp = cached.split('-').pop();
    if (cachedTimestamp && cachedTimestamp !== 'dev') {
      return new Date(cachedTimestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    return cached;
  }
  // No cached version yet (first install) - show current build
  return APP_BUILD_TIMESTAMP === 'dev'
    ? 'dev'
    : new Date(APP_BUILD_TIMESTAMP).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
})();

const BUILD_VERSION_KEY = 'tiryani-app-build-version';
const UPDATE_DISMISSED_KEY = 'tiryani-update-dismissed-timestamp';

export function getCachedAppVersion() {
  try {
    return window.localStorage.getItem(BUILD_VERSION_KEY);
  } catch {
    return null;
  }
}

export function rememberCurrentAppVersion() {
  try {
    window.localStorage.setItem(BUILD_VERSION_KEY, APP_VERSION);
    // Clear the dismissed flag when we remember the current version
    window.localStorage.removeItem(UPDATE_DISMISSED_KEY);
  } catch {
    // Version persistence is best-effort only.
  }
}

export function dismissUpdateBanner() {
  try {
    window.localStorage.setItem(UPDATE_DISMISSED_KEY, String(Date.now()));
  } catch {
    // Dismissal persistence is best-effort only.
  }
}

export function hasNewAppVersion() {
  const cached = getCachedAppVersion();
  if (!cached || cached === APP_VERSION) return false;

  // Check if the banner was dismissed in the last 5 minutes
  try {
    const dismissed = window.localStorage.getItem(UPDATE_DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (dismissedTime > fiveMinutesAgo) {
        return false; // Don't show banner if dismissed recently
      }
    }
  } catch {
    // If we can't check the dismissed flag, proceed with showing the banner
  }

  return true;
}

export async function clearAppCacheAndReload() {
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_RUNTIME_CACHES' });

    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations || []).map(async (registration) => {
      try { registration.active?.postMessage({ type: 'CLEAR_RUNTIME_CACHES' }); } catch {}
      // Do NOT call registration.update() - this prevents auto-updates
    }));
    if (!registrations?.some((registration) => new URL(registration.scope).pathname === '/')) {
      await navigator.serviceWorker?.register('/service-worker.js', { scope: '/' });
    }

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    try {
      window.localStorage.removeItem(BUILD_VERSION_KEY);
      window.sessionStorage.removeItem('tiryani-startup-recovery-v4');
      window.sessionStorage.removeItem('tiryani-pwa-recovery-attempted-at');
    } catch {
      // Keep user data intact; only build metadata is cleared.
    }
  } finally {
    const url = new URL('/', window.location.origin);
    url.searchParams.set('refresh', String(Date.now()));
    url.searchParams.set('reason', 'cache-reset');
    window.location.replace(url.toString());
  }
}

if (typeof window !== 'undefined') {
  window.clearAppCacheAndReload = clearAppCacheAndReload;
}

declare global {
  interface Window {
    clearAppCacheAndReload?: () => Promise<void>;
  }
}
