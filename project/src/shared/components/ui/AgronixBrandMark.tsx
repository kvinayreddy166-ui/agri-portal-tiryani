import React from 'react';
import { Sprout } from 'lucide-react';

export function AgronixBrandMark() {
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5 pb-4">
      <Sprout className="h-3.5 w-3.5 text-[#15803D]" />
      <span className="bg-gradient-to-r from-[#15803D] to-[#0D9488] bg-clip-text text-[11px] font-black uppercase tracking-[0.35em] text-transparent">Agronix</span>
    </div>
  );
}
