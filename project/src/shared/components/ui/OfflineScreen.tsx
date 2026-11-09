import React, { useCallback, useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { checkNetworkOnline } from '../../lib/networkStatus';

export const OfflineScreen = React.memo(function OfflineScreen() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [dismissed, setDismissed] = useState(false);

  const syncOnlineStatus = useCallback(async () => {
    const isUp = await checkNetworkOnline();
    setOnline(isUp);
    return isUp;
  }, []);

  useEffect(() => {
    const handleBrowserOnline = () => {
      void syncOnlineStatus();
    };
    const handleBrowserOffline = () => {
      setOnline(false);
      setDismissed(false);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void syncOnlineStatus();
      }
    };

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleBrowserOnline);

    void syncOnlineStatus();

    return () => {
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleBrowserOnline);
    };
  }, [syncOnlineStatus]);

  useEffect(() => {
    if (online) {
      setDismissed(false);
      return;
    }
    const probeTimer = window.setInterval(() => {
      void syncOnlineStatus();
    }, 4000);
    return () => window.clearInterval(probeTimer);
  }, [online, syncOnlineStatus]);

  if (online || dismissed) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[9999] flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-sm animate-pop-in items-center gap-3 rounded-2xl border border-amber-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-950/15 backdrop-blur-md dark:border-amber-800/50 dark:bg-slate-900/95">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <WifiOff className="h-4.5 w-4.5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-amber-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-slate-900 dark:text-white">
            {typeof navigator !== 'undefined' && !navigator.onLine
              ? 'You are offline'
              : 'Connection unstable'}
          </p>
          <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Cached data still works — changes will sync when online
          </p>
        </div>
        <button
          type="button"
          onClick={() => void syncOnlineStatus()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"
          aria-label="Retry connection"
          title="Retry"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          OK
        </button>
      </div>
    </div>
  );
});
