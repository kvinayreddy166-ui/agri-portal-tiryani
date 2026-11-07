import React from 'react';
import { ChevronLeft } from 'lucide-react';

type BackButtonTone = 'light' | 'solid';

type BackButtonProps = {
  onClick: () => void;
  tone?: BackButtonTone;
  /** Text-color class override — replaces the tone palette (use for themed headers). */
  colors?: string;
  className?: string;
  /** Accessible label + tooltip. */
  label?: string;
};

const toneClass: Record<BackButtonTone, string> = {
  light:
    'border-slate-200/80 bg-white/90 text-emerald-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900/90 dark:text-emerald-300 dark:hover:border-emerald-700 dark:hover:bg-slate-800 dark:hover:text-emerald-200',
  solid:
    'border-white/25 bg-white/15 text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/25',
};

/**
 * Compact glass back-button tile — chevron nudges left on hover.
 * Sits at the header's leading edge with a proper touch target.
 */
export function BackButton({ onClick, tone = 'light', colors, className = '', label = 'Go back' }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        'group -ml-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-1 active:scale-90',
        colors
          ? `border-white/30 bg-white/15 hover:border-white/45 hover:bg-white/25 ${colors}`
          : toneClass[tone],
        className,
      ].join(' ')}
    >
      <ChevronLeft
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );
}
