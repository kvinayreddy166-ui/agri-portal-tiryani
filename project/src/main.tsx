import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { APP_VERSION } from './lib/appVersion';
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

window.__TIRYANI_APP_BOOTED__ = true;
createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.DEV) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch((error) => console.warn('Service worker cleanup failed:', error));

      if ('caches' in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.filter((key) => key.startsWith('tiryani-portal')).map((key) => caches.delete(key))))
          .catch((error) => console.warn('Cache cleanup failed:', error));
      }
      return;
    }

    const notifyUpdateAvailable = () => {
      window.dispatchEvent(new CustomEvent('tiryani:update-available'));
    };

    const reloadForServiceWorkerUpdate = (version: string) => {
      const reloadKey = `tiryani-sw-reloaded-${version}`;
      try {
        if (window.sessionStorage.getItem(reloadKey)) {
          notifyUpdateAvailable();
          return;
        }
        window.sessionStorage.setItem(reloadKey, '1');
      } catch {
        notifyUpdateAvailable();
        return;
      }

      const url = new URL(window.location.href);
      url.searchParams.set('updated', String(Date.now()));
      window.location.replace(url.toString());
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(`/service-worker.js?v=${encodeURIComponent(APP_VERSION)}`, {
          updateViaCache: 'none',
        });

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdateAvailable();
            }
          });
        });

        if (registration.waiting) {
          notifyUpdateAvailable();
        }

        await registration.update();
      } catch (error) {
        if (import.meta.env.DEV) console.warn('Service worker registration failed:', error);
      }
    };

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        reloadForServiceWorkerUpdate(String(event.data.version || APP_VERSION));
      }
    });

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(registerServiceWorker, { timeout: 3000 });
    } else {
      setTimeout(registerServiceWorker, 1200);
    }
  });
}
