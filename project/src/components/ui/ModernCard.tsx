import React, { useState, useEffect, ReactNode } from 'react';

interface ModernCardProps {
  children: ReactNode;
  gradient?: string;
  bgGradient?: string;
  className?: string;
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function ModernCard({
  children,
  gradient = 'from-emerald-500 to-teal-600',
  bgGradient = 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
  className = '',
  hover = true,
  delay = 0,
  onClick,
}: ModernCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const baseClasses = `
    group relative overflow-hidden rounded-2xl border border-emerald-200/50 
    bg-gradient-to-br ${bgGradient} p-5 shadow-lg 
    transition-all duration-300 
    dark:border-emerald-800/50
    ${hover ? 'hover:shadow-2xl hover:scale-105 cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    ${className}
  `;

  return (
    <div onClick={onClick} className={baseClasses}>
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
  gradient = 'from-emerald-500 to-teal-600',
  bgGradient = 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
  onClick,
  delay = 0,
  external = false,
}: IconCardProps) {
  return (
    <ModernCard gradient={gradient} bgGradient={bgGradient} onClick={onClick} delay={delay}>
      <div className="relative flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
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
}

export function ModernStatCard({
  label,
  value,
  helper,
  gradient = 'from-emerald-500 to-teal-600',
  bgGradient = 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
  icon: Icon,
  delay = 0,
}: StatCardProps) {
  return (
    <ModernCard gradient={gradient} bgGradient={bgGradient} hover={false} delay={delay}>
      <div className="relative">
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-md mb-3`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <p className="text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-black leading-tight text-slate-900 dark:text-white">{value}</p>
        {helper && <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{helper}</p>}
      </div>
    </ModernCard>
  );
}
