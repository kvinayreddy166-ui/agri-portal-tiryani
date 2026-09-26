import React, { useEffect, useState } from 'react';
import { checkNetworkOnline } from '../../lib/networkStatus';

export const OfflineStatus = React.memo(function OfflineStatus() {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    let checkInterval: number;

    const checkStatus = async () => {
      if (!mounted) return;
      const isOnline = await checkNetworkOnline();
      setOnline(isOnline);
      setChecking(false);
    };

    // Initial check
    void checkStatus();

    // Check periodically
    checkInterval = window.setInterval(() => {
      void checkStatus();
    }, 30000); // Check every 30 seconds

    // Also check on online/offline events
    const handleOnline = () => void checkStatus();
    const handleOffline = () => void checkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      window.clearInterval(checkInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online || checking) return null;

  return (
    <div className="fixed bottom-3 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-xl ring-1 ring-white/15">
      <span className="h-2 w-2 rounded-full bg-amber-300" />
      You are offline. Cached data available.
    </div>
  );
});
