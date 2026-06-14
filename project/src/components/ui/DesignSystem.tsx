import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'primary' | 'secondary' | 'danger' | 'warning';
type IconTone = Tone | 'excel' | 'sky' | 'slate';

export function AppCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`app-card modern-card ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className = '',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`section-header ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap justify-end gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  tone = 'primary',
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: Tone | 'blue';
}) {
  const toneClass = {
    primary: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-900',
    secondary: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/70 text-green-900',
    blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-900',
    danger: 'border-red-200 bg-gradient-to-br from-red-50 to-red-100/70 text-red-900',
    warning: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-950',
  }[tone];

  return (
    <article className={`stat-card modern-stat-card ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-black leading-tight">{value}</p>
      {helper && <p className="mt-1 text-xs font-bold opacity-75">{helper}</p>}
    </article>
  );
}

export function FilterPanel({
  title = 'Filters',
  open,
  onToggle,
  children,
  actions,
}: {
  title?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="filter-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="card-title">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {actions}
          <ActionButton tone="secondary" onClick={onToggle}>
            {open ? 'Hide Filters' : 'Show Filters'}
          </ActionButton>
        </div>
      </div>
      {open && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{children}</div>}
    </section>
  );
}

export function TableScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`table-scroll ${className}`}>{children}</div>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="empty-state">
      <p className="font-black text-slate-700">{title}</p>
      {description && <p className="mt-1 font-semibold text-slate-500">{description}</p>}
    </div>
  );
}

export function ActionButton({
  tone = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
}) {
  const toneClass = {
    primary: 'action-button-primary modern-action-button',
    secondary: 'action-button-secondary modern-action-button',
    danger: 'action-button-danger modern-action-button',
    warning: 'action-button-warning modern-action-button',
  }[tone];

  return (
    <button type="button" className={`action-button ${toneClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function IconButton({
  label,
  tone = 'secondary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: IconTone;
}) {
  const toneClass = {
    primary: 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800',
    secondary: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
    danger: 'border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40',
    warning: 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-amber-950/30',
    excel: 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800',
    sky: 'border-sky-200 bg-white text-sky-700 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800',
    slate: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  }[tone];

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-black shadow-sm transition disabled:opacity-50 ${toneClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
