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
        const hadController = Boolean(navigator.serviceWorker.controller);
        const registrations = await navigator.serviceWorker.getRegistrations();
        const appRegistrations = registrations.filter((registration) => new URL(registration.scope).origin === window.location.origin);

        await Promise.all(appRegistrations.map(async (registration) => {
          try { registration.active?.postMessage({ type: 'CLEAR_RUNTIME_CACHES' }); } catch {}
          try { await registration.update(); } catch {}
        }));

        if (!appRegistrations.some((registration) => new URL(registration.scope).pathname === '/')) {
          await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
        }

        if ('caches' in window) {
          const keys = await caches.keys();
          // Keep the current static shell so offline refresh can load the SPA
          // (and honor the offline-banner session flag) instead of a hard fallback page.
          await Promise.all(
            keys
              .filter((key) => !key.startsWith('agronix-static-'))
              .map((key) => caches.delete(key))
          );
        }

        if (hadController) {
          const reloadKey = 'tiryani-service-worker-rescue-reload';
          try {
            if (window.sessionStorage.getItem(reloadKey)) return;
            window.sessionStorage.setItem(reloadKey, '1');
          } catch {
            return;
          }
          const url = new URL(window.location.href);
          url.searchParams.set('sw-rescue', String(Date.now()));
          window.location.replace(url.toString());
        }
      } catch (error) {
        if (import.meta.env.DEV) console.warn('Service worker rescue setup failed:', error);
      }
    };

    void installRescueServiceWorker();
  });
}