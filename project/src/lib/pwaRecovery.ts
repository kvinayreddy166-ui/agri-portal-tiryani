const RECOVERY_KEY = 'tiryani-pwa-recovery-attempted-at';
const RECOVERY_WINDOW_MS = 30_000;
const CACHE_PREFIX = 'tiryani-portal';

const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
];

export function installPwaRecovery() {
  if (typeof window === 'undefined') return;

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

function isRecoverableChunkError(message: string) {
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

async function recoverFromStaleAssets() {
  if (!shouldAttemptRecovery()) return;

  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_RUNTIME_CACHES' });

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX))
          .map((key) => caches.delete(key))
      );
    }

    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations || []).map((registration) => registration.update()));
  } catch {
    // Reloading with network cache bypass is still the best recovery path.
  } finally {
    window.location.reload();
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
