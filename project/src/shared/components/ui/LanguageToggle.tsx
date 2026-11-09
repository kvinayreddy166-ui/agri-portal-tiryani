import React from 'react';
import { Languages } from 'lucide-react';

type LanguageToggleTone = 'light' | 'solid';
type LanguageToggleAccent = 'violet' | 'emerald' | 'teal' | 'gold';

type LanguageToggleProps = {
  language: 'en' | 'te';
  onClick: () => void;
  tone?: LanguageToggleTone;
  /** Light-tone accent colour — match the surrounding card/page theme. */
  accent?: LanguageToggleAccent;
  className?: string;
  /** Accessible label + tooltip. */
  label?: string;
};

const lightAccentClass: Record<LanguageToggleAccent, string> = {
  violet:
    'border-violet-200 bg-violet-50/80 text-violet-700 shadow-[0_1px_3px_rgba(124,58,237,0.12)] hover:bg-violet-100 hover:text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/60 dark:text-violet-300 dark:hover:bg-violet-900/60',
  emerald:
    'border-emerald-200 bg-emerald-50/80 text-emerald-700 shadow-[0_1px_3px_rgba(5,150,105,0.12)] hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60',
  teal:
    'border-emerald-200 bg-emerald-50/80 text-emerald-700 shadow-[0_1px_3px_rgba(13,148,136,0.12)] hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60',
  gold:
    'border-gold-300 bg-gold-50/80 text-gold-700 shadow-[0_1px_3px_rgba(216,155,24,0.15)] hover:bg-gold-100 hover:text-gold-800 dark:border-gold-700/60 dark:bg-gold-950/60 dark:text-gold-300 dark:hover:bg-gold-900/60',
};

const accentFocusClass: Record<LanguageToggleAccent, string> = {
  violet: 'focus:ring-violet-200 dark:focus:ring-violet-900/50',
  emerald: 'focus:ring-emerald-200 dark:focus:ring-emerald-900/50',
  teal: 'focus:ring-emerald-200 dark:focus:ring-emerald-900/50',
  gold: 'focus:ring-gold-200 dark:focus:ring-gold-900/50',
};

export function LanguageToggle({ language, onClick, tone = 'light', accent = 'violet', className = '', label }: LanguageToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        'inline-flex h-7 min-w-[60px] items-center justify-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold transition duration-200 active:scale-95 focus:outline-none focus:ring-4',
        accentFocusClass[accent],
        tone === 'solid' ? 'border-white/25 bg-white/15 text-white hover:bg-white/25' : lightAccentClass[accent],
        className,
      ].join(' ')}
    >
      <Languages className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="h-3 w-px shrink-0 bg-current opacity-30" aria-hidden="true" />
      <span className="leading-none">{language === 'en' ? 'EN' : 'తె'}</span>
    </button>
  );
}
