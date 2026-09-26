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

const pixelSizeMap = {
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

export const PortalLogo = React.memo(function PortalLogo({ size = 'md', className = '' }: PortalLogoProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-emerald-500/30 ${sizeMap[size]} ${className}`}
      style={{
        willChange: 'transform, box-shadow',
        backfaceVisibility: 'hidden',
      }}
    >
      <img
        src="/images/agronix-logo-original.jpeg"
        alt="Agronix"
        width={pixelSizeMap[size]}
        height={pixelSizeMap[size]}
        decoding="sync"
        loading="eager"
        className="h-full w-full object-cover"
        style={{ backfaceVisibility: 'hidden' }}
      />
    </div>
  );
});
