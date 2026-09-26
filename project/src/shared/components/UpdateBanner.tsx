import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

function waitForWaitingWorker(registration: ServiceWorkerRegistration, timeoutMs = 15000) {
  return new Promise<ServiceWorker | null>((resolve) => {
    if (registration.waiting) return resolve(registration.waiting);

    let settled = false;
    const finish = (worker: ServiceWorker | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      registration.removeEventListener('updatefound', onUpdateFound);
      resolve(worker);
    };
    const onStateChange = (event: Event) => {
      if ((event.target as ServiceWorker).state === 'installed') finish(registration.waiting);
    };
    const onUpdateFound = () => {
      registration.installing?.addEventListener('statechange', onStateChange);
    };
    const timer = window.setTimeout(() => finish(registration.waiting), timeoutMs);

    registration.addEventListener('updatefound', onUpdateFound);
    if (registration.installing) onUpdateFound();
  });
}

export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const updateInProgressRef = React.useRef(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      // Check if banner was dismissed in current session
      try {
        if (sessionStorage.getItem('update-banner-dismissed')) {
          return;
        }
      } catch {}

      setShowBanner(true);
      // Trigger slide-in animation immediately
      requestAnimationFrame(() => setIsVisible(true));
    };

    const handleControllerChange = () => {
      // Service worker controller changed, update is being applied
      setShowBanner(false);
      setIsVisible(false);
      // Clear the dismissed flag after successful update
      try {
        sessionStorage.removeItem('update-banner-dismissed');
      } catch {}
    };

    window.addEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable as EventListener);
    window.addEventListener('serviceWorkerUpdate', handleControllerChange);

    return () => {
      window.removeEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable as EventListener);
      window.removeEventListener('serviceWorkerUpdate', handleControllerChange);
    };
  }, []);

  const handleUpdate = async () => {
    // Prevent multiple simultaneous update attempts
    if (updateInProgressRef.current) {
      if (import.meta.env.DEV) console.log('[PWA UpdateBanner] Update already in progress, ignoring click');
      return;
    }
    
    updateInProgressRef.current = true;
    setIsUpdating(true);
    
    if (import.meta.env.DEV) console.log('[PWA UpdateBanner] Update button clicked');
    
    try {
      // Show loading overlay to prevent flickering
      const overlay = document.createElement('div');
      overlay.id = 'update-loading-overlay';
      overlay.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-white dark:bg-slate-900';
      overlay.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <p class="text-lg font-semibold text-slate-700">Updating AGRONIX...</p>
        </div>
      `;
      document.body.appendChild(overlay);

      if (!('serviceWorker' in navigator)) {
        window.location.reload();
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        window.location.reload();
        return;
      }

      let worker = registration.waiting;
      if (!worker) {
        // The banner may have fired before the new worker finished installing.
        // Trigger an update check, then wait for it to reach the waiting state.
        if (import.meta.env.DEV) console.warn('[PWA UpdateBanner] No waiting worker yet, running update check');
        try { await registration.update(); } catch {}
        worker = await waitForWaitingWorker(registration, 15000);
      }

      if (worker) {
        if (import.meta.env.DEV) console.log('[PWA UpdateBanner] Sending SKIP_WAITING message to service worker');
        worker.postMessage({ type: 'SKIP_WAITING' });
        // controllerchange reloads the page; this is a safety net if activation stalls
        window.setTimeout(() => window.location.reload(), 8000);
      } else {
        // Nothing waiting — reload to pick up whatever is current
        window.location.reload();
      }
    } catch (error) {
      console.error('[PWA UpdateBanner] Update failed:', error);
      setIsUpdating(false);
      updateInProgressRef.current = false;
      // Remove overlay on error
      const overlay = document.getElementById('update-loading-overlay');
      if (overlay) overlay.remove();
    }
  };

  const handleLater = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300); // Wait for slide-out animation
    // Store in sessionStorage to not show again in current session
    try {
      sessionStorage.setItem('update-banner-dismissed', 'true');
    } catch {}
  };

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] max-w-sm transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">New Update Available</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">A newer version of AGRONIX is ready to install.</p>
            </div>
            <button
              onClick={handleLater}
              className="flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleLater}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Update Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
