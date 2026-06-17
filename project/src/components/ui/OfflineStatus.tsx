import React, { useEffect, useState } from 'react';

export const OfflineStatus = React.memo(function OfflineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed bottom-3 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-xl ring-1 ring-white/15">
      <span className="h-2 w-2 rounded-full bg-amber-300" />
      Offline mode
    </div>
  );
});
