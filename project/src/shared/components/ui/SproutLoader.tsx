import React from 'react';

export interface SproutLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'sprout' | 'spinner' | 'pulse';
  label?: React.ReactNode;
  className?: string;
}

const sizeMap = {
  sm: 'w-7 h-7',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const labelSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base font-semibold',
  xl: 'text-lg font-bold',
};

export const SproutLoader = React.memo(function SproutLoader({
  size = 'md',
  variant = 'sprout',
  label,
  className = '',
}: SproutLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className={`relative flex items-center justify-center ${sizeMap[size]}`}>
        {variant === 'spinner' ? (
          /* Dual-leaf circular spinner */
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full animate-leaf-orbit"
          >
            <path
              d="M24 6C16 6 10 12 10 20C10 24 13 27 16 27C21 27 24 22 24 16C24 11 24 6 24 6Z"
              className="fill-emerald-600 dark:fill-emerald-400 opacity-90"
            />
            <path
              d="M24 42C32 42 38 36 38 28C38 24 35 21 32 21C27 21 24 26 24 32C24 37 24 42 24 42Z"
              className="fill-emerald-400 dark:fill-emerald-300 opacity-80"
            />
          </svg>
        ) : (
          /* Living Botanical Sprout with stem, unfurling leaves & organic sway */
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <radialGradient id="sprout-aura-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="60%" stopColor="#059669" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sprout-stem-grad" x1="32" y1="54" x2="32" y2="18" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#047857" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="sprout-leaf-l-grad" x1="14" y1="12" x2="32" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="sprout-leaf-r-grad" x1="50" y1="10" x2="32" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>

            {/* Photosynthetic Backlight Aura */}
            <circle
              cx="32"
              cy="30"
              r="24"
              fill="url(#sprout-aura-glow)"
              className="animate-sprout-aura pointer-events-none"
            />

            {/* Soil Foundation Mound */}
            <ellipse
              cx="32"
              cy="54"
              rx="15"
              ry="3"
              className="fill-emerald-900/30 dark:fill-emerald-400/20 animate-sprout-soil"
            />

            {/* Organic Swaying Plant Body */}
            <g className="animate-sprout-sway" style={{ transformOrigin: '32px 54px' }}>
              {/* Sprouting Stem */}
              <path
                d="M32 54 C32 44 31 32 32 18"
                stroke="url(#sprout-stem-grad)"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
                className="animate-sprout-stem"
              />

              {/* Left Leaf */}
              <g
                className="animate-sprout-leaf-left"
                style={{ transformOrigin: '32px 30px' }}
              >
                <path
                  d="M32 30 C22 30 14 22 15 15 C19 12 28 18 32 30 Z"
                  fill="url(#sprout-leaf-l-grad)"
                />
                <path
                  d="M32 30 C26 25 21 21 16 16"
                  stroke="#a7f3d0"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </g>

              {/* Right Leaf (Higher & Tender) */}
              <g
                className="animate-sprout-leaf-right"
                style={{ transformOrigin: '32px 24px' }}
              >
                <path
                  d="M32 24 C41 22 49 15 48 8 C43 6 36 12 32 24 Z"
                  fill="url(#sprout-leaf-r-grad)"
                />
                <path
                  d="M32 24 C38 18 43 13 47 9"
                  stroke="#ecfdf5"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </g>

              {/* Dewdrop Sparkle on Right Tip */}
              <circle
                cx="48"
                cy="8"
                r="1.8"
                fill="#fef08a"
                className="animate-sprout-sparkle"
              />
            </g>
          </svg>
        )}
      </div>

      {label && (
        <span
          className={`tracking-wide text-slate-700 dark:text-slate-200 animate-fade-in ${labelSizeMap[size]}`}
        >
          {label}
        </span>
      )}
    </div>
  );
});

export default SproutLoader;
