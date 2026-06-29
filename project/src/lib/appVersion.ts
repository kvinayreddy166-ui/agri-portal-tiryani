export const APP_BUILD_TIMESTAMP =
  (import.meta.env.VITE_APP_BUILD_TIMESTAMP as string | undefined) || 'dev';

export const APP_VERSION =
  (import.meta.env.VITE_APP_VERSION as string | undefined) || APP_BUILD_TIMESTAMP;

export const APP_BUILD_LABEL = APP_BUILD_TIMESTAMP === 'dev'
  ? 'dev'
  : new Date(APP_BUILD_TIMESTAMP).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

const BUILD_VERSION_KEY = 'tiryani-app-build-version';
const CACHE_PREFIX = 'tiryani-portal';

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
  } catch {
    // Version persistence is best-effort only.
  }
}

export function hasNewAppVersion() {
  const cached = getCachedAppVersion();
  return Boolean(cached && cached !== APP_VERSION);
}

export async function clearAppCacheAndReload() {
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_RUNTIME_CACHES' });

    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations || []).map((registration) => registration.unregister()));

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX))
          .map((key) => caches.delete(key))
      );
    }

    try {
      window.localStorage.removeItem(BUILD_VERSION_KEY);
    } catch {
      // Keep user data intact; only build metadata is cleared.
    }
  } finally {
    const url = new URL(window.location.href);
    url.searchParams.set('refresh', String(Date.now()));
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
