import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { BackButton } from './BackButton';
import { useAuth } from '../../context/AuthContext';

export type ToolkitHeaderTone = 'emerald' | 'sky' | 'rose' | 'lime' | 'indigo' | 'amber' | 'teal-indigo' | 'blue';

interface ToolkitPageHeaderProps {
  title: string | ReactNode;
  eyebrow?: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: LucideIcon;
  iconSize?: 'sm' | 'md' | 'lg';
  tone?: ToolkitHeaderTone;
  variant?: 'tinted' | 'solid';
  fallbackPath?: string;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
}

const TONE_STYLES: Record<
  ToolkitHeaderTone,
  {
    container: string;
    iconBg: string;
    eyebrow: string;
    title: string;
    backBtn: string;
  }
> = {
  emerald: {
    container: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 shadow-md dark:border-emerald-800/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-900/30',
    iconBg: 'bg-emerald-600 text-white dark:bg-emerald-500',
    eyebrow: 'text-emerald-800 dark:text-emerald-300',
    title: 'text-emerald-950 dark:text-emerald-50',
    backBtn: 'text-emerald-800 hover:text-emerald-950 dark:text-emerald-200 dark:hover:text-white',
  },
  sky: {
    container: 'border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 shadow-sm dark:border-sky-800/50 dark:from-sky-950/40 dark:via-slate-900 dark:to-blue-900/30',
    iconBg: 'bg-sky-600 text-white dark:bg-sky-500',
    eyebrow: 'text-sky-800 dark:text-sky-300',
    title: 'text-sky-900 dark:text-sky-50',
    backBtn: 'text-sky-800 hover:text-sky-950 dark:text-sky-200 dark:hover:text-white',
  },
  rose: {
    container: 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 shadow-sm dark:border-rose-800/50 dark:from-rose-950/40 dark:via-slate-900 dark:to-pink-900/30',
    iconBg: 'bg-rose-600 text-white dark:bg-rose-500',
    eyebrow: 'text-rose-800 dark:text-rose-300',
    title: 'text-rose-900 dark:text-rose-50',
    backBtn: 'text-rose-800 hover:text-rose-950 dark:text-rose-200 dark:hover:text-white',
  },
  lime: {
    container: 'border-lime-200/60 bg-gradient-to-r from-lime-50 to-green-50 shadow-sm dark:border-lime-800/50 dark:from-lime-950/40 dark:via-slate-900 dark:to-green-900/30',
    iconBg: 'bg-lime-600 text-white dark:bg-lime-500',
    eyebrow: 'text-lime-800 dark:text-lime-300',
    title: 'text-lime-950 dark:text-lime-50',
    backBtn: 'text-lime-800 hover:text-lime-950 dark:text-lime-200 dark:hover:text-white',
  },
  indigo: {
    container: 'border-slate-300 bg-gradient-to-r from-slate-100 to-emerald-50/40 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800',
    iconBg: 'bg-slate-700 text-white dark:bg-slate-600',
    eyebrow: 'text-slate-700 dark:text-slate-300',
    title: 'text-slate-900 dark:text-slate-50',
    backBtn: 'text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white',
  },
  amber: {
    container: 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm dark:border-amber-800/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-900/30',
    iconBg: 'bg-amber-600 text-white dark:bg-amber-500',
    eyebrow: 'text-amber-800 dark:text-amber-300',
    title: 'text-amber-950 dark:text-amber-50',
    backBtn: 'text-amber-800 hover:text-amber-950 dark:text-amber-200 dark:hover:text-white',
  },
  'teal-indigo': {
    container: 'border-indigo-300 bg-gradient-to-r from-emerald-200 via-cyan-200 to-indigo-200 shadow-md dark:border-indigo-800/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-indigo-950/40',
    iconBg: 'bg-gradient-to-br from-emerald-600 to-indigo-600 text-white',
    eyebrow: 'text-emerald-800 dark:text-emerald-300',
    title: 'text-indigo-950 dark:text-indigo-50',
    backBtn: 'text-emerald-800 hover:text-indigo-950 dark:text-emerald-200 dark:hover:text-white',
  },
  blue: {
    container: 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm dark:border-blue-800/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-900/30',
    iconBg: 'bg-blue-600 text-white dark:bg-blue-500',
    eyebrow: 'text-blue-800 dark:text-blue-300',
    title: 'text-blue-950 dark:text-blue-50',
    backBtn: 'text-blue-800 hover:text-blue-950 dark:text-blue-200 dark:hover:text-white',
  },
};

const SOLID_STYLES: Record<
  ToolkitHeaderTone,
  { container: string; iconBg: string; eyebrow: string; title: string; backBtn: string }
> = {
  emerald: {
    container: 'border-emerald-900/40 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 shadow-lg dark:border-emerald-800/50',
    iconBg: 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm',
    eyebrow: 'text-gold-300 font-bold tracking-widest',
    title: 'text-white',
    backBtn: 'text-white hover:text-gold-300',
  },
  sky: {
    container: 'border-sky-700/40 bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-700 shadow-lg dark:border-sky-800/50',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30',
    eyebrow: 'text-sky-100',
    title: 'text-white',
    backBtn: 'text-white hover:text-white/80',
  },
  rose: {
    container: 'border-rose-700/40 bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 shadow-lg dark:border-rose-800/50',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30',
    eyebrow: 'text-rose-100',
    title: 'text-white',
    backBtn: 'text-white hover:text-white/80',
  },
  lime: {
    container: 'border-lime-700/40 bg-gradient-to-br from-lime-600 via-green-600 to-emerald-700 shadow-lg dark:border-lime-800/50',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30',
    eyebrow: 'text-lime-100',
    title: 'text-white',
    backBtn: 'text-white hover:text-white/80',
  },
  indigo: {
    container: 'border-indigo-700/40 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 shadow-lg dark:border-indigo-800/50',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30',
    eyebrow: 'text-indigo-100',
    title: 'text-white',
    backBtn: 'text-white hover:text-white/80',
  },
  amber: {
    container: 'border-amber-700/40 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 shadow-lg dark:border-amber-800/50',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30',
    eyebrow: 'text-amber-100',
    title: 'text-white',
    backBtn: 'text-white hover:text-white/80',
  },
  'teal-indigo': {
    container: 'border-emerald-700/40 bg-gradient-to-br from-emerald-600 via-cyan-600 to-indigo-600 shadow-lg dark:border-indigo-800/50',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30',
    eyebrow: 'text-emerald-100',
    title: 'text-white',
    backBtn: 'text-white hover:text-white/80',
  },
  blue: {
    container: 'border-blue-500/40 bg-blue-600 shadow-lg dark:border-blue-400/40',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm',
    eyebrow: 'text-blue-100 font-bold tracking-widest',
    title: 'text-white',
    backBtn: 'text-white hover:text-blue-100',
  },
};

const BAR_STYLES: Record<ToolkitHeaderTone, string> = {
  emerald: 'from-emerald-700 via-gold-400 to-emerald-600',
  sky: 'from-sky-400 via-blue-500 to-cyan-400',
  rose: 'from-rose-500 via-pink-500 to-rose-400',
  lime: 'from-lime-500 via-green-500 to-emerald-400',
  indigo: 'from-indigo-600 via-blue-600 to-teal-500',
  amber: 'from-amber-500 via-orange-500 to-amber-400',
  'teal-indigo': 'from-emerald-600 via-teal-600 to-cyan-600',
  blue: 'from-blue-500 via-blue-400 to-blue-600',
};

const COMPACT_ICON_STYLES: Record<ToolkitHeaderTone, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  sky: 'text-sky-600 dark:text-sky-400',
  rose: 'text-rose-600 dark:text-rose-400',
  lime: 'text-lime-600 dark:text-lime-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  amber: 'text-amber-600 dark:text-amber-400',
  'teal-indigo': 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-blue-600 dark:text-blue-400',
};

export function CompactToolkitHeader({
  title,
  eyebrow = 'Officer Toolkit',
  subtitle,
  icon: Icon,
  iconSize = 'md',
  tone = 'emerald',
  actions,
  onBack,
  className = '',
}: Pick<ToolkitPageHeaderProps, 'title' | 'eyebrow' | 'subtitle' | 'icon' | 'iconSize' | 'tone' | 'actions' | 'onBack' | 'className'>) {
  const iconBoxClass = iconSize === 'sm'
    ? 'h-8 w-8 sm:h-9 sm:w-9 rounded-lg'
    : iconSize === 'lg'
    ? 'h-11 w-11 sm:h-12 sm:w-12 rounded-xl'
    : 'h-9 w-9 sm:h-10 sm:w-10 rounded-xl';
  const iconSvgClass = iconSize === 'sm'
    ? 'h-4 w-4 sm:h-4.5 sm:w-4.5'
    : iconSize === 'lg'
    ? 'h-5.5 w-5.5 sm:h-6 sm:w-6'
    : 'h-4.5 w-4.5 sm:h-5 sm:w-5';

  return (
    <header className={`mb-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3.5">
          {onBack && <BackButton onClick={onBack} className="mt-1 shrink-0" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {Icon && (
                <div className={`flex ${iconBoxClass} shrink-0 items-center justify-center bg-slate-100 dark:bg-slate-800/80 ring-1 ring-slate-200/80 dark:ring-slate-700/80 shadow-xs ${COMPACT_ICON_STYLES[tone] || COMPACT_ICON_STYLES.emerald}`}>
                  <Icon className={iconSvgClass} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {eyebrow && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 mb-0.5">
                    {eyebrow}
                  </p>
                )}
                <h1 className="text-lg sm:text-xl font-black leading-tight text-slate-950 dark:text-white sm:text-2xl">
                  {title}
                </h1>
              </div>
            </div>
            {subtitle && (
              <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 self-start pt-1">{actions}</div>}
      </div>
    </header>
  );
}

export function ToolkitPageHeader({
  title,
  eyebrow = 'Officer Toolkit',
  subtitle,
  icon: Icon,
  iconSize = 'md',
  tone = 'emerald',
  variant = 'tinted',
  fallbackPath = '/officer-toolkit',
  onBack,
  actions,
  className = '',
}: ToolkitPageHeaderProps) {
  const navigate = useNavigate();
  const { isAdminUser, isTestUser } = useAuth();
  const theme = (variant === 'solid' ? SOLID_STYLES[tone] : TONE_STYLES[tone]) || TONE_STYLES.emerald;

  if (isAdminUser || isTestUser) {
    return (
      <CompactToolkitHeader
        title={title}
        eyebrow={eyebrow}
        subtitle={subtitle}
        icon={Icon}
        iconSize={iconSize}
        tone={tone}
        actions={actions}
        onBack={onBack}
        className={className}
      />
    );
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  const iconBoxClass = iconSize === 'sm'
    ? 'h-8 w-8 sm:h-9 sm:w-9 rounded-lg'
    : iconSize === 'lg'
    ? 'h-11 w-11 sm:h-12 sm:w-12 rounded-xl'
    : 'h-9 w-9 sm:h-10 sm:w-10 rounded-xl';
  const iconSvgClass = iconSize === 'sm'
    ? 'h-4 w-4 sm:h-4.5 sm:w-4.5'
    : iconSize === 'lg'
    ? 'h-5.5 w-5.5 sm:h-6 sm:w-6'
    : 'h-4.5 w-4.5 sm:h-5 sm:w-5';

  return (
    <div className={`relative mb-5 overflow-hidden rounded-2xl border p-4 ${theme.container} ${className}`}>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${variant === 'solid' ? 'from-white/70 via-white/50 to-white/70' : BAR_STYLES[tone]}`} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-3.5">
          <BackButton onClick={handleBack} colors={theme.backBtn} className="mt-1 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {Icon && (
                <div className={`flex ${iconBoxClass} shrink-0 items-center justify-center shadow-sm ring-1 ring-white/25 backdrop-blur-xs ${theme.iconBg}`}>
                  <Icon className={iconSvgClass} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {eyebrow && (
                  <p className={`text-[10px] sm:text-xs font-black uppercase tracking-wider mb-0.5 ${theme.eyebrow}`}>
                    {eyebrow}
                  </p>
                )}
                <h1 className={`text-lg sm:text-xl md:text-2xl font-black leading-snug tracking-tight ${theme.title}`}>
                  {title}
                </h1>
              </div>
            </div>
            {subtitle && (
              <p className={`mt-2 text-xs sm:text-sm font-medium leading-relaxed max-w-3xl ${variant === 'solid' ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 self-end sm:self-start pt-1">{actions}</div>}
      </div>
    </div>
  );
}
