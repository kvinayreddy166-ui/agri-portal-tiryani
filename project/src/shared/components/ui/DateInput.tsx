import React, { useState } from 'react';
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
 */
export function DateInput({
  value,
  onChange,
  className = '',
  disabled = false,
  min,
  max,
  placeholder = 'YYYY-MM-DD',
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
    <div className="relative inline-block w-full">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={handleClick}
        disabled={disabled}
        min={min}
        max={max}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white ${className}`}
        {...props}
      />
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
