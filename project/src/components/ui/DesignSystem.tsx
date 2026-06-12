import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'primary' | 'secondary' | 'danger' | 'warning';

export function AppCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`app-card ${className}`}>{children}</section>;
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
    primary: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
    secondary: 'border-green-200 bg-green-50/70 text-green-900',
    blue: 'border-blue-200 bg-blue-50/70 text-blue-900',
    danger: 'border-red-200 bg-red-50/70 text-red-900',
    warning: 'border-amber-200 bg-amber-50/70 text-amber-950',
  }[tone];

  return (
    <article className={`stat-card ${toneClass}`}>
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
    primary: 'action-button-primary',
    secondary: 'action-button-secondary',
    danger: 'action-button-danger',
    warning: 'action-button-warning',
  }[tone];

  return (
    <button type="button" className={`action-button ${toneClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
