import React from 'react';
import { Check } from 'lucide-react';

interface AuthStepperProps {
  /** Resolved (already translated) step labels. */
  steps: string[];
  /** Index of the currently active step. Steps before it render as complete. */
  currentIndex: number;
  /** When true, every step renders as complete (final success state). */
  finished?: boolean;
}

/**
 * Horizontal step indicator used by the auth flows (sign-up, password reset).
 * Renders numbered badges that turn into checks, with progress-filled connectors.
 */
export function AuthStepper({ steps, currentIndex, finished = false }: AuthStepperProps) {
  return (
    <div
      className="mt-6 flex items-center gap-1.5 border-t border-emerald-700/60 pt-4 sm:gap-2"
      role="list"
      aria-label="Progress"
    >
      {steps.map((label, i) => {
        const done = finished || i < currentIndex;
        const active = !finished && i === currentIndex;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div
                aria-hidden="true"
                className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                  done || finished ? 'bg-emerald-400' : 'bg-emerald-800'
                }`}
              />
            )}
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2" role="listitem">
              <span
                aria-current={active ? 'step' : undefined}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-colors duration-300 ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-gold-400 text-emerald-950 ring-2 ring-gold-300/60'
                      : 'bg-emerald-800/80 text-emerald-300'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`hidden truncate text-[11px] font-semibold sm:inline ${
                  done || active ? 'text-emerald-100' : 'text-emerald-400/60'
                }`}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default AuthStepper;
