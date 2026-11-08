import React from 'react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
  '2xl': 'h-14 w-14',
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', className = '', label }: SpinnerProps) {
  return (
    <span role="status" aria-label={label ?? 'Loading'} className={`inline-flex shrink-0 ${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spinner h-full w-full">
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.12" strokeWidth="2" />
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="14 45.7"
          transform="rotate(-90 12 12)"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
