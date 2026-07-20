import React, { useEffect, useState } from 'react';
import { PortalLogo } from './PortalLogo';

export const OfflineScreen = React.memo(function OfflineScreen() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  useEffect(() => {
    // Small delay for smooth entrance animation when going offline
    if (!online) {
      const timer = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [online]);

  if (online) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#eef6f0] p-6 text-center dark:bg-slate-950">
      <div
        className={`transition-all duration-700 ease-out ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        <div className="relative mb-8">
          <PortalLogo size="xl" className="mx-auto" />
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 -m-4 flex items-center justify-center">
            <div className="h-32 w-32 animate-ping rounded-full bg-emerald-500/20" />
          </div>
        </div>
        
        <h1 className="mb-3 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
          AGRONIX is offline
        </h1>
        
        <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
          Please reconnect and reopen the app
        </p>
      </div>
    </div>
  );
});
