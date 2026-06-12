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
    <div className="portal-card animate-fade-in flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{eyebrow}</p>
        )}
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="page-title">{title}</h1>
          {badge}
        </div>
        {description && <p className="page-subtitle max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
