import React, { useEffect, useState } from 'react';
import { PortalLogo } from './PortalLogo';

const OFFLINE_SHOWN_KEY = 'tiryani-offline-screen-shown';
const OFFLINE_SHELL_RETRY_KEY = 'tiryani-offline-shell-retry';

function readAlreadyShown(): boolean {
  try {
    return sessionStorage.getItem(OFFLINE_SHOWN_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeAlreadyShown(value: boolean) {
  try {
    if (value) {
      sessionStorage.setItem(OFFLINE_SHOWN_KEY, 'true');
    } else {
      sessionStorage.removeItem(OFFLINE_SHOWN_KEY);
      sessionStorage.removeItem(OFFLINE_SHELL_RETRY_KEY);
    }
  } catch {
    // Session storage might not be available
  }
}

export const OfflineScreen = React.memo(function OfflineScreen() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [visible, setVisible] = useState(false);
  const [alreadyShown, setAlreadyShown] = useState(readAlreadyShown);

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
      const timer = setTimeout(() => {
        setVisible(true);
        writeAlreadyShown(true);
      }, 40);
      return () => clearTimeout(timer);
    }

    setVisible(false);
    const clearTimer = setTimeout(() => {
      if (navigator.onLine) {
        writeAlreadyShown(false);
        setAlreadyShown(false);
      }
    }, 2500);
    return () => clearTimeout(clearTimer);
  }, [online]);

  // Refresh while still offline: compact toast so the full-screen banner does not loop
  if (!online && alreadyShown) {
    return (
      <div className="fixed bottom-3 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-xl ring-1 ring-white/15">
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        You are offline. Cached data available.
      </div>
    );
  }

  if (online || alreadyShown) return null;

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
