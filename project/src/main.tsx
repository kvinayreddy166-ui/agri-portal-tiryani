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

  // After successful update (reload), persist the new version
  // This ensures the timestamp displays the installed version
  // ONLY call this if this is a fresh load after a user-initiated update
  const initializeAppVersion = async () => {
    try {
      // Check if this reload was triggered by a user-initiated update
      const wasUserInitiatedUpdate = (window as any).__USER_INITIATED_UPDATE__;
      if (wasUserInitiatedUpdate) {
        const { rememberCurrentAppVersion } = await import('./lib/appVersion');
        rememberCurrentAppVersion();
        // Reset the flag after recording the version
        (window as any).__USER_INITIATED_UPDATE__ = false;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Failed to initialize app version:', error);
    }
  };
  void initializeAppVersion();

  // Set up proper service worker update detection using updatefound event
  const setupUpdateDetection = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // Check if there's already a waiting worker on page load
      if (registration.waiting) {
        window.dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable', { 
          detail: { version: 'waiting' } 
        }));
      }

      // Listen for new service worker installation
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // When the new worker is installed and there's an existing controller,
          // it means a new version is available but not yet activated
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // UPDATE AVAILABLE ONLY - do NOT change installed version
            window.dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable', { 
              detail: { version: 'waiting' } 
            }));
          }
        });
      });
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Service worker update detection setup failed:', error);
    }
  };
  void setupUpdateDetection();
}