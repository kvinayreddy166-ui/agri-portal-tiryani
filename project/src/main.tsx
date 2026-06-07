import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installPwaRecovery } from './lib/pwaRecovery';
import { recordSiteHit } from './lib/siteHits';
import './index.css';

installPwaRecovery();
void recordSiteHit();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/service-worker.js').catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(registerServiceWorker, { timeout: 3000 });
    } else {
      setTimeout(registerServiceWorker, 1200);
    }
  });
}
