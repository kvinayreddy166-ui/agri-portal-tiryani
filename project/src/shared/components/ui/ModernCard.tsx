import React, { useState, useEffect, ReactNode } from 'react';

interface ModernCardProps {
  children: ReactNode;
  gradient?: string;
  bgGradient?: string;
  className?: string;
  hover?: boolean;
  delay?: number;
  compact?: boolean;
  onClick?: () => void;
}

export function ModernCard({
  children,
  gradient = 'from-emerald-500 to-emerald-600',
  bgGradient = 'from-emerald-50 to-emerald-50 dark:from-emerald-950/30 dark:to-emerald-950/30',
  className = '',
  hover = true,
  delay = 0,
  compact = false,
  onClick,
}: ModernCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const baseClasses = `
    group relative overflow-hidden rounded-2xl border border-emerald-200/50
    bg-gradient-to-br ${bgGradient} ${compact ? 'p-3 sm:p-3.5' : 'p-5'} shadow-sm
    transition-[transform,opacity,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
    dark:border-emerald-800/50
    ${hover ? 'hover-lift cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2' : ''}
    ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-4'}
    ${className}
  `;

  return (
    <div
      onClick={onClick}
      className={baseClasses}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
      {children}
      <div className={`absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20`} />
    </div>
  );
}

interface IconCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  gradient?: string;
  bgGradient?: string;
  onClick?: () => void;
  delay?: number;
  external?: boolean;
}

export function IconCard({
  icon: Icon,
  title,
  description,
  gradient = 'from-emerald-500 to-emerald-600',
  bgGradient = 'from-emerald-50 to-emerald-50 dark:from-emerald-950/30 dark:to-emerald-950/30',
  onClick,
  delay = 0,
  external = false,
}: IconCardProps) {
  return (
    <ModernCard gradient={gradient} bgGradient={bgGradient} onClick={onClick} delay={delay}>
      <div className="relative flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-2">
              {description}
            </p>
          )}
          {external && (
            <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span>External Link</span>
            </div>
          )}
        </div>
      </div>
    </ModernCard>
  );
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  gradient?: string;
  bgGradient?: string;
  icon?: React.ComponentType<{ className?: string }>;
  delay?: number;
  compact?: boolean;
}

export function ModernStatCard({
  label,
  value,
  helper,
  gradient = 'from-emerald-500 to-emerald-600',
  bgGradient = 'from-emerald-50 to-emerald-50 dark:from-emerald-950/30 dark:to-emerald-950/30',
  icon: Icon,
  delay = 0,
  compact = false,
}: StatCardProps) {
  return (
    <ModernCard gradient={gradient} bgGradient={bgGradient} hover={false} delay={delay} compact={compact}>
      <div className="relative">
        {Icon && (
          <div className={`flex ${compact ? 'mb-1.5 h-8 w-8 rounded-md' : 'mb-3 h-10 w-10 rounded-lg'} shrink-0 items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-md`}>
            <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
          </div>
        )}
        <p className={`font-black uppercase tracking-wide text-slate-600 dark:text-slate-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>{label}</p>
        <p className={`font-black leading-tight text-slate-900 dark:text-white ${compact ? 'mt-0.5 text-lg' : 'mt-1 text-2xl'}`}>{value}</p>
        {helper && <p className={`font-bold text-slate-500 dark:text-slate-400 ${compact ? 'mt-0.5 text-[11px]' : 'mt-1 text-xs'}`}>{helper}</p>}
      </div>
    </ModernCard>
  );
}
