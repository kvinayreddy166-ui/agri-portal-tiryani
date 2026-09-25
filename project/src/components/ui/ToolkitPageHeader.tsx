import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { BackButton } from './BackButton';

export type ToolkitHeaderTone = 'emerald' | 'sky' | 'rose' | 'lime' | 'indigo' | 'amber' | 'teal-indigo';

interface ToolkitPageHeaderProps {
  title: string | ReactNode;
  eyebrow?: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: LucideIcon;
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
    container: 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm dark:border-indigo-800/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-900/30',
    iconBg: 'bg-indigo-600 text-white dark:bg-indigo-500',
    eyebrow: 'text-indigo-800 dark:text-indigo-300',
    title: 'text-indigo-950 dark:text-indigo-50',
    backBtn: 'text-indigo-800 hover:text-indigo-950 dark:text-indigo-200 dark:hover:text-white',
  },
  amber: {
    container: 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm dark:border-amber-800/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-900/30',
    iconBg: 'bg-amber-600 text-white dark:bg-amber-500',
    eyebrow: 'text-amber-800 dark:text-amber-300',
    title: 'text-amber-950 dark:text-amber-50',
    backBtn: 'text-amber-800 hover:text-amber-950 dark:text-amber-200 dark:hover:text-white',
  },
  'teal-indigo': {
    container: 'border-indigo-300 bg-gradient-to-r from-teal-200 via-cyan-200 to-indigo-200 shadow-md dark:border-indigo-800/50 dark:from-teal-950/40 dark:via-slate-900 dark:to-indigo-950/40',
    iconBg: 'bg-gradient-to-br from-teal-600 to-indigo-600 text-white',
    eyebrow: 'text-teal-800 dark:text-teal-300',
    title: 'text-indigo-950 dark:text-indigo-50',
    backBtn: 'text-teal-800 hover:text-indigo-950 dark:text-teal-200 dark:hover:text-white',
  },
};

const SOLID_STYLES: Record<
  ToolkitHeaderTone,
  { container: string; iconBg: string; eyebrow: string; title: string; backBtn: string }
> = {
  emerald: {
    container: 'border-emerald-700/40 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 shadow-lg dark:border-emerald-800/50',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30',
    eyebrow: 'text-emerald-100',
    title: 'text-white',
    backBtn: 'text-white hover:text-white/80',
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
    container: 'border-indigo-700/40 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-lg dark:border-indigo-800/50',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30',
    eyebrow: 'text-blue-100',
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
    container: 'border-teal-700/40 bg-gradient-to-br from-teal-600 via-cyan-600 to-indigo-600 shadow-lg dark:border-indigo-800/50',
    iconBg: 'bg-white/20 text-white ring-1 ring-white/30',
    eyebrow: 'text-teal-100',
    title: 'text-white',
    backBtn: 'text-white hover:text-white/80',
  },
};

export function ToolkitPageHeader({
  title,
  eyebrow = 'Officer Toolkit',
  subtitle,
  icon: Icon,
  tone = 'emerald',
  variant = 'tinted',
  fallbackPath = '/officer-toolkit',
  onBack,
  actions,
  className = '',
}: ToolkitPageHeaderProps) {
  const navigate = useNavigate();
  const theme = (variant === 'solid' ? SOLID_STYLES[tone] : TONE_STYLES[tone]) || TONE_STYLES.emerald;

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

  return (
    <div className={`mb-5 rounded-2xl border p-4 ${theme.container} ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <BackButton onClick={handleBack} colors={theme.backBtn} className="self-center" />
          {Icon && (
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-white/20 ${theme.iconBg}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.eyebrow}`}>
                {eyebrow}
              </p>
            )}
            <h1 className={`text-lg font-black leading-tight sm:text-xl ${theme.title}`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-sm font-semibold ${variant === 'solid' ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 self-end">{actions}</div>}
      </div>
    </div>
  );
}
