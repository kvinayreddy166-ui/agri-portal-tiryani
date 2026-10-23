import React from 'react';
import { X } from 'lucide-react';

export function DateClearButton({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`sm:hidden shrink-0 inline-flex items-center gap-1 rounded-full bg-rose-50/90 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 shadow-xs transition-all active:scale-95 touch-manipulation select-none ${className}`}
      aria-label="Clear date"
    >
      <X className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
      <span>Clear</span>
    </button>
  );
}
