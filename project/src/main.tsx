import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installPwaRecovery } from './lib/pwaRecovery';
import { recordSiteHit } from './lib/siteHits';
import './index.css';

declare global {
  interface Window {
    __TIRYANI_APP_BOOTED__?: boolean;
  }
}

installPwaRecovery();

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
              .filter((key) => key !== 'agronix-static-v10' && key !== 'agronix-runtime-v10')
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

  // Flag to track if the update was user-initiated
  // Expose globally so UpdateBanner can set it when user taps UPDATE
  (window as any).__USER_INITIATED_UPDATE__ = false;

  // Listen for service worker controller change - reload only if user-initiated
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.dispatchEvent(new CustomEvent('serviceWorkerUpdate'));
    // Only reload if the update was initiated by the user
    if ((window as any).__USER_INITIATED_UPDATE__) {
      window.location.reload();
    }
  });

  // Listen for SW_READY messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_READY') {
      window.dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable', { 
        detail: { version: event.data.version } 
      }));
    }
  });

  // After successful update (reload), persist the new version
  // This ensures the timestamp displays the installed version
  const initializeAppVersion = async () => {
    try {
      const { rememberCurrentAppVersion } = await import('./lib/appVersion');
      rememberCurrentAppVersion();
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Failed to initialize app version:', error);
    }
  };
  void initializeAppVersion();

  // Check for waiting service worker (new version available)
  const checkForWaitingServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        window.dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable', { 
          detail: { version: 'waiting' } 
        }));
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Service worker check failed:', error);
    }
  };

  // Check immediately on load
  void checkForWaitingServiceWorker();

  // Periodically check for updates (every 5 minutes)
  const updateCheckInterval = setInterval(() => {
    void checkForWaitingServiceWorker();
  }, 5 * 60 * 1000);

  // Cleanup interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(updateCheckInterval);
  });
}