import React from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  inputId?: string;
  /** Number of digit boxes. Defaults to 6. */
  length?: number;
}

/**
 * Segmented one-time-code input. A transparent real input sits on top of the
 * digit boxes so mobile keyboards, paste, and autofill keep working while the
 * UI shows a modern per-digit display.
 */
export function OtpInput({ value, onChange, disabled, autoFocus, inputId, length = 6 }: OtpInputProps) {
  const digits = value.padEnd(length).slice(0, length).split('');

  return (
    <div className="relative">
      <div className="flex gap-2 sm:gap-3" aria-hidden="true">
        {digits.map((digit, i) => {
          const filled = i < value.length;
          const isCaret = i === value.length;
          return (
            <div
              key={i}
              className={`flex h-12 w-full max-w-11 items-center justify-center rounded-xl border font-mono text-lg font-bold transition-colors duration-150 sm:h-14 ${
                filled
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : isCaret
                    ? 'border-emerald-400 bg-white dark:border-emerald-500/60 dark:bg-slate-800'
                    : 'border-slate-200 bg-slate-50/70 text-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-600'
              }`}
            >
              {digit || ''}
            </div>
          );
        })}
      </div>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        required
        disabled={disabled}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        aria-label="6-digit verification code"
        className="absolute inset-0 h-full w-full cursor-text text-base opacity-0"
      />
    </div>
  );
}

export default OtpInput;
