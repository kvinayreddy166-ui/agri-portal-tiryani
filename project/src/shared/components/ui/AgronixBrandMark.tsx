import React from 'react';
import { Sprout } from 'lucide-react';

export function AgronixBrandMark() {
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5 pb-4">
      <Sprout className="h-3.5 w-3.5 text-[#15803D]" />
      <span className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-800 dark:text-emerald-400">Agronix</span>
    </div>
  );
}
