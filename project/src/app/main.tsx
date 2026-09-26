import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { installPwaRecovery } from '../shared/lib/pwaRecovery';
import { recordSiteHit } from '../shared/lib/siteHits';
import './index.css';

declare global {
  interface Window {
    __TIRYANI_APP_BOOTED__?: boolean;
  }
}

installPwaRecovery();

// Lock orientation to portrait in installed PWA so the app does not rotate
// even when the device's auto-rotation toggle is off.
try {
  const orientationApi = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
  const lockOrientation = () => {
    try {
      void orientationApi.lock?.('portrait')?.catch(() => {});
    } catch {
      // lock() requires fullscreen and may reject in browsers — ignore.
    }
  };
  if (orientationApi && typeof orientationApi.lock === 'function') {
    // Try immediately — installed PWAs may honour the lock without fullscreen.
    lockOrientation();
    // Some browsers require fullscreen before orientation.lock() succeeds.
    document.addEventListener('fullscreenchange', lockOrientation);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) lockOrientation();
    });
    // Re-apply on orientation change (e.g. user rotates then returns).
    screen.orientation.addEventListener?.('change', lockOrientation);
  }
} catch {
  // Orientation lock is best-effort only.
}

try {
  window.sessionStorage.removeItem('tiryani-startup-recovery-v1');
  window.sessionStorage.removeItem('tiryani-startup-recovery-v2');
  window.sessionStorage.removeItem('tiryani-startup-recovery-v3');
} catch {
  // Startup recovery state is best-effort only.
}

const recordInitialSiteHit = () => {
  void recordSiteHit();
};

const requestIdle = window.requestIdleCallback;
if (requestIdle) {
  requestIdle(recordInitialSiteHit, { timeout: 2500 });
} else {
  setTimeout(recordInitialSiteHit, 1500);
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

window.__TIRYANI_APP_BOOTED__ = false;
createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // In dev, the SW's fetch interception breaks Vite module loading and lazy
    // imports (jspdf/docx/xlsx). Unregister any existing SW and skip registering.
    if (import.meta.env.DEV) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister());
      });
      return;
    }

    const installRescueServiceWorker = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const appRegistrations = registrations.filter((registration) => new URL(registration.scope).origin === window.location.origin);

        await Promise.all(appRegistrations.map(async (registration) => {
          try { registration.active?.postMessage({ type: 'CLEAR_RUNTIME_CACHES' }); } catch {}
          try { registration.active?.postMessage({ type: 'PRECACHE_OFFLINE' }); } catch {}
          // Do NOT automatically call registration.update() - this prevents auto-updates
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
              .filter((key) => key !== 'agronix-static-v15' && key !== 'agronix-runtime-v15')
              .map((key) => caches.delete(key))
          );
        }

        // Clear legacy offline-banner session flags from earlier builds
        try {
          window.sessionStorage.removeItem('tiryani-offline-screen-shown');
          window.sessionStorage.removeItem('tiryani-offline-shell-retry');
        } catch {}

        // Disable auto-reload to prevent unwanted app updates
        // if (hadController) {
        //   const reloadKey = 'tiryani-service-worker-rescue-reload';
        //   try {
        //     if (window.sessionStorage.getItem(reloadKey)) return;
        //     window.sessionStorage.setItem(reloadKey, '1');
        //   } catch {
        //     return;
        //   }
        //   const url = new URL(window.location.href);
        //   url.searchParams.set('sw-rescue', String(Date.now()));
        //   window.location.replace(url.toString());
        // }
      } catch (error) {
        if (import.meta.env.DEV) console.warn('Service worker rescue setup failed:', error);
      }
    };

    void installRescueServiceWorker();
  });

  // Listen for service worker controller change - reload after new SW activates
  let hasReloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Guard against multiple reloads
    if (hasReloaded) {
      if (import.meta.env.DEV) console.log('[PWA] Controller change detected, but already reloaded - skipping');
      return;
    }
    hasReloaded = true;
    
    window.dispatchEvent(new CustomEvent('serviceWorkerUpdate'));
    
    if (import.meta.env.DEV) console.log('[PWA] Controller changed, reloading to apply new version');
    // Reload to apply the new version
    window.location.reload();
  });

  // SW_READY fires on every activation (first install and after an update has
  // already been applied), so it is NOT used to trigger the update banner.
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_READY' && import.meta.env.DEV) {
      console.log('[PWA] SW_READY message received:', event.data.version);
    }
  });

  const notifyUpdateAvailable = () => {
    window.dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable', {
      detail: { version: 'waiting' }
    }));
  };

  const watchRegistrationForUpdates = (registration: ServiceWorkerRegistration) => {
    const watchInstalling = () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        // A finished install while a controller exists = new version waiting
        // for explicit user approval.
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          notifyUpdateAvailable();
        }
      });
    };
    registration.addEventListener('updatefound', watchInstalling);
    if (registration.installing) watchInstalling();
    if (registration.waiting && navigator.serviceWorker.controller) {
      notifyUpdateAvailable();
    }
  };

  // Check for updates: update() only downloads and installs a newer service
  // worker — it still waits for explicit user approval before activating.
  const checkForUpdates = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      watchRegistrationForUpdates(registration);
      try { await registration.update(); } catch {}
      if (registration.waiting && navigator.serviceWorker.controller) {
        if (import.meta.env.DEV) console.log('[PWA] Waiting service worker detected, showing update banner');
        notifyUpdateAvailable();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[PWA] Service worker check failed:', error);
    }
  };

  // Check immediately and after the rescue-registration setup inside 'load'
  if (import.meta.env.DEV) console.log('[PWA] Initial check for waiting service worker');
  void checkForUpdates();
  window.addEventListener('load', () => {
    if (!import.meta.env.DEV) void checkForUpdates();
  });

  // Periodically check for updates (every 5 minutes) - detection only, no activation
  const updateCheckInterval = setInterval(() => {
    if (import.meta.env.DEV) console.log('[PWA] Periodic check for waiting service worker');
    void checkForUpdates();
  }, 5 * 60 * 1000);

  // Cleanup interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(updateCheckInterval);
  });
}