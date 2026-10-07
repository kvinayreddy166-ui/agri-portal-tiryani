import React, { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions, badge }: PageHeaderProps) {
  return (
    <div className="animate-fadeIn relative mb-5 flex flex-col gap-3 overflow-hidden rounded-2xl border border-emerald-900/10 bg-white/95 p-4 shadow-sm backdrop-blur-md transition-[box-shadow,border-color] duration-200 dark:border-emerald-500/20 dark:bg-slate-900/90 sm:p-5 md:flex-row md:items-end md:justify-between">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-800 via-gold-400 to-emerald-700" />
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            {eyebrow}
          </div>
        )}
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h1 className="page-title text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl font-[var(--font-heading)]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="page-subtitle mt-1 max-w-2xl text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
