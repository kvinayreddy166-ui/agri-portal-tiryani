import React from 'react';
import { Languages } from 'lucide-react';

type LanguageToggleTone = 'light' | 'solid';

type LanguageToggleProps = {
  language: 'en' | 'te';
  onClick: () => void;
  tone?: LanguageToggleTone;
  className?: string;
};

const toneClass: Record<LanguageToggleTone, string> = {
  light:
    'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800',
  solid:
    'border-white/25 bg-white/15 text-white hover:bg-white/25',
};

export function LanguageToggle({ language, onClick, tone = 'light', className = '' }: LanguageToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-black shadow-sm transition focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40',
        toneClass[tone],
        className,
      ].join(' ')}
    >
      <Languages className="h-4 w-4" />
      {language === 'en' ? '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41' : 'English'}
    </button>
  );
}
