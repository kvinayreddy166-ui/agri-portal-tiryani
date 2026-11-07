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
    <div className="animate-fadeIn mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            {eyebrow}
          </p>
        )}
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h1 className="page-title text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl font-[var(--font-heading)]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="page-subtitle mt-0.5 max-w-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
