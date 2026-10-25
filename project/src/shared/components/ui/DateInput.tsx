import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import {
  ChromiumDatePickerCard,
  MobileDatePickerModal,
  isMobileDevice,
  GlobalMobileDatePickerProvider,
  openMobileDatePickerForInput,
} from './MobileDatePicker';

export {
  ChromiumDatePickerCard,
  MobileDatePickerModal,
  isMobileDevice,
  GlobalMobileDatePickerProvider,
  openMobileDatePickerForInput,
};

/**
 * Formerly rendered a separate red "[✕ Clear]" pill next to labels on mobile.
 * Now completely disabled because the Chromium DatePicker includes a native Clear action.
 */
export function DateClearButton(_props?: {
  onClick?: () => void;
  className?: string;
}) {
  return null;
}

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Universal DateInput component that uses the custom Chromium date picker on mobiles and desktops.
 * Shows a desktop-style calendar icon and 'dd-mm-yyyy' placeholder when empty on mobile view.
 */
export function DateInput({
  value,
  onChange,
  className = '',
  disabled = false,
  min,
  max,
  placeholder = 'dd-mm-yyyy',
  ...props
}: DateInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (isMobileDevice()) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className="relative inline-flex w-full items-center">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={handleClick}
        disabled={disabled}
        min={min}
        max={max}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white date-input-calendar ${className}`}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) setIsOpen(true);
        }}
        className="pointer-events-auto absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-700 transition hover:text-slate-950 active:scale-95 dark:text-slate-300 dark:hover:text-white"
        aria-label="Open calendar"
      >
        <Calendar className="h-4 w-4 stroke-[1.8]" />
      </button>
      {isOpen && (
        <MobileDatePickerModal
          isOpen={isOpen}
          value={value}
          onChange={onChange}
          onClose={() => setIsOpen(false)}
          min={typeof min === 'string' ? min : undefined}
          max={typeof max === 'string' ? max : undefined}
        />
      )}
    </div>
  );
}
