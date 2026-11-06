import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BackButton } from './BackButton';

type ModulePageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
};

export function ModulePageHeader({ title, subtitle, icon: Icon, onBack, actions, className = '' }: ModulePageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {onBack && <BackButton onClick={onBack} className="mt-1.5" />}
        {Icon && (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60 sm:h-11 sm:w-11">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-tight text-slate-950 dark:text-white sm:text-2xl">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 pt-0.5">{actions}</div>}
    </div>
  );
}
