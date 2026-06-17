import React from 'react';

interface PortalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export const PortalLogo = React.memo(function PortalLogo({ size = 'md', className = '' }: PortalLogoProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full bg-white shadow-md ring-1 ring-emerald-100/80 dark:ring-slate-600 ${sizeMap[size]} ${className}`}
    >
      <img
        src="/images/agri-emblem.webp"
        alt="Tiryani Agriculture Portal"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
});
