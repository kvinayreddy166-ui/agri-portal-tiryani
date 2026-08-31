import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const updateInProgressRef = React.useRef(false);

  useEffect(() => {
    const handleUpdateAvailable = (event: CustomEvent) => {
      const newVersion = event.detail?.version;
      
      if (import.meta.env.DEV) console.log('[PWA UpdateBanner] Update available event:', newVersion);
      
      // Check if this is a different version than what we've already shown
      const lastShownVersion = localStorage.getItem('last-shown-update-version');
      if (lastShownVersion === newVersion) {
        if (import.meta.env.DEV) console.log('[PWA UpdateBanner] Same version, not showing banner');
        return; // Don't show banner for same version
      }
      
      // Check if banner was dismissed in current session
      try {
        if (sessionStorage.getItem('update-banner-dismissed')) {
          if (import.meta.env.DEV) console.log('[PWA UpdateBanner] Banner dismissed in session, not showing');
          return;
        }
      } catch {}
      
      if (import.meta.env.DEV) console.log('[PWA UpdateBanner] Showing update banner');
      setShowBanner(true);
      // Trigger slide-in animation
      setTimeout(() => setIsVisible(true), 50);
    };

    const handleControllerChange = () => {
      // Service worker controller changed, update is being applied
      if (import.meta.env.DEV) console.log('[PWA UpdateBanner] Controller changed, hiding banner');
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
      overlay.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-white';
      overlay.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <p class="text-lg font-semibold text-slate-700">Updating AGRONIX...</p>
        </div>
      `;
      document.body.appendChild(overlay);
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          // Store the version before updating
          const version = registration.waiting.scriptURL;
          try {
            localStorage.setItem('last-shown-update-version', version);
          } catch {}
          
          if (import.meta.env.DEV) console.log('[PWA UpdateBanner] Sending SKIP_WAITING message to service worker');
          // Tell the waiting service worker to skip waiting and become active
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          if (import.meta.env.DEV) console.warn('[PWA UpdateBanner] No waiting service worker found');
          // No waiting worker - might need to trigger an update check
          if (registration) {
            await registration.update();
          }
        }
      }
      // The controllerchange event will trigger reload
      // Don't reload immediately - wait for service worker activation
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
      <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl border border-white/20">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 mb-1">New Update Available</h4>
              <p className="text-sm text-slate-600 leading-snug">A newer version of AGRONIX is ready to install.</p>
            </div>
            <button
              onClick={handleLater}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleLater}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
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
