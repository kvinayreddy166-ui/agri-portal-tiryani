import React from 'react';
import { ArrowLeft } from 'lucide-react';

type BackButtonTone = 'light' | 'solid';

type BackButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  tone?: BackButtonTone;
  className?: string;
};

const toneClass: Record<BackButtonTone, string> = {
  light:
    'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-300 dark:hover:bg-slate-800',
  solid:
    'border-white/25 bg-white/15 text-white hover:bg-white/25',
};

export function BackButton({ children, onClick, tone = 'light', className = '' }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex min-h-9 w-fit items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-black shadow-sm transition focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40',
        toneClass[tone],
        className,
      ].join(' ')}
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  );
}
