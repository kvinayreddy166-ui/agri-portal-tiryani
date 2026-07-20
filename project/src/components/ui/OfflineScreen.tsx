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
    if (!online) {
      const timer = setTimeout(() => setVisible(true), 40);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [online]);

  if (online) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#eef6f0] p-6 text-center dark:bg-slate-950">
      <div
        className={`flex max-w-md flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-95 opacity-0'
        }`}
      >
        <div
          className={`relative mb-10 transition-all delay-100 duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 -m-6 flex items-center justify-center">
            <div className="h-36 w-36 animate-ping rounded-full bg-emerald-500/15" />
          </div>
          <div className="pointer-events-none absolute inset-0 -m-3 flex items-center justify-center">
            <div className="h-28 w-28 animate-pulse rounded-full bg-emerald-400/10" />
          </div>
          <div className={visible ? 'login-logo-hero' : ''}>
            <PortalLogo size="xl" className="mx-auto !h-28 !w-28 shadow-xl ring-emerald-500/40" />
          </div>
        </div>

        <p
          className={`text-xl font-black leading-snug tracking-tight text-slate-950 transition-all delay-200 duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] dark:text-white sm:text-2xl ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
          }`}
        >
          AGRONIX is offline
          <br />
          Please reconnect and reopen the app
        </p>
      </div>
    </div>
  );
});
