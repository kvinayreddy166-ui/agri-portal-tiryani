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
    <div className="portal-card animate-fade-in flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">{eyebrow}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white md:text-3xl">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
