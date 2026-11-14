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
    __TIRYANI_REACT_MOUNTED__?: boolean;
  }
}

// Immediately signal to index.html pre-boot watchdog that main script is executing
window.__TIRYANI_APP_BOOTED__ = true;

installPwaRecovery();

try {
  window.sessionStorage.removeItem('tiryani-startup-recovery-v1');
  window.sessionStorage.removeItem('tiryani-startup-recovery-v2');
  window.sessionStorage.removeItem('tiryani-startup-recovery-v3');
  window.sessionStorage.removeItem('tiryani-startup-recovery-v4');
} catch {
  // Startup recovery state is best-effort only.
}

const recordInitialSiteHit = () => {
  void recordSiteHit();
};

const scheduleHit = () => {
  const requestIdle = window.requestIdleCallback;
  if (requestIdle) {
    requestIdle(recordInitialSiteHit, { timeout: 6000 });
  } else {
    setTimeout(recordInitialSiteHit, 4000);
  }
};

if (document.readyState === 'complete') {
  scheduleHit();
} else {
  window.addEventListener('load', scheduleHit, { once: true });
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

window.__TIRYANI_APP_BOOTED__ = true;
window.__TIRYANI_REACT_MOUNTED__ = true;
createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

initServiceWorkerLifecycle();
