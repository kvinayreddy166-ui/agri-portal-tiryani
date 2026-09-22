import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

export type ToolkitHeaderTone = 'emerald' | 'sky' | 'rose' | 'lime' | 'indigo' | 'amber';

interface ToolkitPageHeaderProps {
  title: string | ReactNode;
  eyebrow?: string | ReactNode;
  icon?: LucideIcon;
  tone?: ToolkitHeaderTone;
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
    backBtn: 'border-emerald-300 bg-white/70 text-emerald-800 hover:bg-white hover:border-emerald-500 dark:border-emerald-700 dark:bg-slate-800/80 dark:text-emerald-200 dark:hover:bg-slate-700',
  },
  sky: {
    container: 'border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 shadow-sm dark:border-sky-800/50 dark:from-sky-950/40 dark:via-slate-900 dark:to-blue-900/30',
    iconBg: 'bg-sky-600 text-white dark:bg-sky-500',
    eyebrow: 'text-sky-800 dark:text-sky-300',
    title: 'text-sky-900 dark:text-sky-50',
    backBtn: 'border-sky-300 bg-white/70 text-sky-800 hover:bg-white hover:border-sky-500 dark:border-sky-700 dark:bg-slate-800/80 dark:text-sky-200 dark:hover:bg-slate-700',
  },
  rose: {
    container: 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 shadow-sm dark:border-rose-800/50 dark:from-rose-950/40 dark:via-slate-900 dark:to-pink-900/30',
    iconBg: 'bg-rose-600 text-white dark:bg-rose-500',
    eyebrow: 'text-rose-800 dark:text-rose-300',
    title: 'text-rose-900 dark:text-rose-50',
    backBtn: 'border-rose-300 bg-white/70 text-rose-800 hover:bg-white hover:border-rose-500 dark:border-rose-700 dark:bg-slate-800/80 dark:text-rose-200 dark:hover:bg-slate-700',
  },
  lime: {
    container: 'border-lime-200/60 bg-gradient-to-r from-lime-50 to-green-50 shadow-sm dark:border-lime-800/50 dark:from-lime-950/40 dark:via-slate-900 dark:to-green-900/30',
    iconBg: 'bg-lime-600 text-white dark:bg-lime-500',
    eyebrow: 'text-lime-800 dark:text-lime-300',
    title: 'text-lime-950 dark:text-lime-50',
    backBtn: 'border-lime-300 bg-white/70 text-lime-800 hover:bg-white hover:border-lime-500 dark:border-lime-700 dark:bg-slate-800/80 dark:text-lime-200 dark:hover:bg-slate-700',
  },
  indigo: {
    container: 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm dark:border-indigo-800/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-900/30',
    iconBg: 'bg-indigo-600 text-white dark:bg-indigo-500',
    eyebrow: 'text-indigo-800 dark:text-indigo-300',
    title: 'text-indigo-950 dark:text-indigo-50',
    backBtn: 'border-indigo-300 bg-white/70 text-indigo-800 hover:bg-white hover:border-indigo-500 dark:border-indigo-700 dark:bg-slate-800/80 dark:text-indigo-200 dark:hover:bg-slate-700',
  },
  amber: {
    container: 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm dark:border-amber-800/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-900/30',
    iconBg: 'bg-amber-600 text-white dark:bg-amber-500',
    eyebrow: 'text-amber-800 dark:text-amber-300',
    title: 'text-amber-950 dark:text-amber-50',
    backBtn: 'border-amber-300 bg-white/70 text-amber-800 hover:bg-white hover:border-amber-500 dark:border-amber-700 dark:bg-slate-800/80 dark:text-amber-200 dark:hover:bg-slate-700',
  },
};

export function ToolkitPageHeader({
  title,
  eyebrow = 'Officer Toolkit',
  icon: Icon,
  tone = 'emerald',
  fallbackPath = '/officer-toolkit',
  onBack,
  actions,
  className = '',
}: ToolkitPageHeaderProps) {
  const navigate = useNavigate();
  const theme = TONE_STYLES[tone] || TONE_STYLES.emerald;

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
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
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
            <h1 className={`truncate text-lg font-black sm:text-xl ${theme.title}`}>
              {title}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={handleBack}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-black shadow-sm transition ${theme.backBtn}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
