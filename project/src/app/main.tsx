import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { initServiceWorkerLifecycle, installPwaRecovery } from '../shared/lib/pwaRecovery';
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

initServiceWorkerLifecycle();