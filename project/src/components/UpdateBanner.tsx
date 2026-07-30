import React, { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';

export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setShowBanner(true);
    };

    const handleControllerChange = () => {
      // Service worker controller changed, update is being applied
      setShowBanner(false);
    };

    window.addEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);
    window.addEventListener('serviceWorkerUpdate', handleControllerChange);

    return () => {
      window.removeEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);
      window.removeEventListener('serviceWorkerUpdate', handleControllerChange);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          // Tell the waiting service worker to skip waiting and become active
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      // Reload the page to apply the update
      window.location.reload();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleLater = () => {
    setShowBanner(false);
    // Store in localStorage to not show again for this session
    try {
      sessionStorage.setItem('update-banner-dismissed', 'true');
    } catch {}
  };

  // Check if banner was dismissed in this session
  useEffect(() => {
    try {
      if (sessionStorage.getItem('update-banner-dismissed')) {
        setShowBanner(false);
      }
    } catch {}
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Download className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">New Update Available</p>
              <p className="text-xs text-blue-100">A new version of the app is ready to install.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLater}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-bold text-blue-700 shadow-md transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
