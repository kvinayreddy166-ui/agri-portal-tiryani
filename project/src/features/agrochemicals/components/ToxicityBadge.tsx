import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { type ToxicityBand } from '../types';

interface ToxicityBadgeProps {
  band: ToxicityBand;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ToxicityBadge({
  band,
  label,
  showIcon = true,
  size = 'md',
}: ToxicityBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-black',
  }[size];

  const config: Record<
    ToxicityBand,
    {
      bg: string;
      text: string;
      border: string;
      dot: string;
      defaultLabel: string;
      icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    red: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-300 dark:border-red-800',
      dot: 'bg-red-600',
      defaultLabel: 'Extremely Toxic (Red)',
      icon: ShieldAlert,
    },
    yellow: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
      defaultLabel: 'Highly Toxic (Yellow)',
      icon: AlertTriangle,
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-800',
      dot: 'bg-blue-600',
      defaultLabel: 'Moderately Toxic (Blue)',
      icon: AlertTriangle,
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-600',
      defaultLabel: 'Slightly Toxic (Green)',
      icon: ShieldCheck,
    },
    unclassified: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
      defaultLabel: 'Plant Nutrient (FCO)',
      icon: ShieldCheck,
    },
  };

  const item = config[band] || config.unclassified;
  const IconComponent = item.icon;

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${item.bg} ${item.text} ${item.border} ${sizeClasses}`}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 ${item.dot}`} />
      {showIcon && <IconComponent className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{label || item.defaultLabel}</span>
    </span>
  );
}
