import React from 'react';
import { ArrowLeft } from 'lucide-react';

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
    'text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100',
  solid:
    'text-white hover:text-white/80',
};

/**
 * Bare back-arrow button that sits flush on the header's leading edge.
 * No border/background — just the arrow glyph with a generous touch target.
 */
export function BackButton({ onClick, tone = 'light', colors, className = '', label = 'Go back' }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        '-ml-2 inline-flex shrink-0 items-center justify-center rounded-md p-2 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95',
        colors ?? toneClass[tone],
        className,
      ].join(' ')}
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
