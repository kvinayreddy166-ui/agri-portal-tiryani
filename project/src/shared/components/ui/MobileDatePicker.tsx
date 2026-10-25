import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, ArrowDown, Calendar } from 'lucide-react';

export interface MobileDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  min?: string;
  max?: string;
  isOpen: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function toDisplayFormat(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}-${m}-${y}`;
}

export function parseManualDate(input: string): { y: number; m: number; d: number; formatted: string } | null {
  if (!input) return null;
  const trimmed = input.trim();

  let d = 0;
  let m = 0;
  let y = 0;

  // Format 1: 8 digits DDMMYYYY
  if (/^\d{8}$/.test(trimmed)) {
    d = Number(trimmed.slice(0, 2));
    m = Number(trimmed.slice(2, 4)) - 1;
    y = Number(trimmed.slice(4, 8));
  }
  // Format 2: Delimited by - or / or .
  else if (/^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      y = Number(parts[0]);
      m = Number(parts[1]) - 1;
      d = Number(parts[2]);
    } else {
      // DD-MM-YYYY
      d = Number(parts[0]);
      m = Number(parts[1]) - 1;
      y = Number(parts[2]);
      if (y < 100) {
        y += 2000;
      }
    }
  } else {
    return null;
  }

  // Validate range
  if (y < 1900 || y > 2100) return null;
  if (m < 0 || m > 11) return null;
  const maxDays = new Date(y, m + 1, 0).getDate();
  if (d < 1 || d > maxDays) return null;

  return { y, m, d, formatted: formatDate(y, m, d) };
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(userAgent);
  const isTouch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen = window.innerWidth <= 768;
  return isMobileUA || (isTouch && isSmallScreen) || isSmallScreen;
}

export function ChromiumDatePickerCard({
  value,
  onChange,
  onClose,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  min?: string;
  max?: string;
}) {
  const initialDate = (() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  })();

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [manualText, setManualText] = useState(() => toDisplayFormat(value));
  const [manualError, setManualError] = useState<string | null>(null);

  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  // Keep view aligned if value changes
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setManualText(toDisplayFormat(value));
      setManualError(null);
    } else if (!value) {
      setManualText('');
      setManualError(null);
    }
  }, [value]);

  const parsedManual = parseManualDate(manualText);
  const isValidManual = Boolean(
    parsedManual &&
      (!min || parsedManual.formatted >= min) &&
      (!max || parsedManual.formatted <= max)
  );

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualText(val);

    const parsed = parseManualDate(val);
    if (parsed) {
      if (min && parsed.formatted < min) {
        setManualError(`Date must be on or after ${toDisplayFormat(min)}`);
        return;
      }
      if (max && parsed.formatted > max) {
        setManualError(`Date must be on or before ${toDisplayFormat(max)}`);
        return;
      }
      setManualError(null);
      // Synchronize calendar view in real-time as user types
      setViewYear(parsed.y);
      setViewMonth(parsed.m);
    } else {
      setManualError(null);
    }
  };

  const handleApplyManual = () => {
    if (!manualText.trim()) {
      onChange('');
      onClose();
      return;
    }

    const parsed = parseManualDate(manualText);
    if (!parsed) {
      setManualError('Enter a valid date: DD-MM-YYYY');
      return;
    }
    if (min && parsed.formatted < min) {
      setManualError(`Date must be on or after ${toDisplayFormat(min)}`);
      return;
    }
    if (max && parsed.formatted > max) {
      setManualError(`Date must be on or before ${toDisplayFormat(max)}`);
      return;
    }

    onChange(parsed.formatted);
    onClose();
  };

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyManual();
    }
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (year: number, monthIndex: number, day: number) => {
    const formatted = formatDate(year, monthIndex, day);
    if (min && formatted < min) return;
    if (max && formatted > max) return;
    onChange(formatted);
    onClose();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    onClose();
  };

  const handleToday = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(todayStr);
    onClose();
  };

  // Build calendar matrix (42 cells: 6 rows of 7)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: Array<{
    day: number;
    year: number;
    month: number;
    isCurrentMonth: boolean;
    dateStr: string;
    isSelected: boolean;
    isToday: boolean;
    isDisabled: boolean;
  }> = [];

  // Trailing days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = formatDate(prevYear, prevMonth, day);
    calendarDays.push({
      day,
      year: prevYear,
      month: prevMonth,
      isCurrentMonth: false,
      dateStr,
      isSelected: value === dateStr,
      isToday: dateStr === todayStr,
      isDisabled: Boolean((min && dateStr < min) || (max && dateStr > max)),
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = formatDate(viewYear, viewMonth, d);
    calendarDays.push({
      day: d,
      year: viewYear,
      month: viewMonth,
      isCurrentMonth: true,
      dateStr,
      isSelected: value === dateStr,
      isToday: dateStr === todayStr,
      isDisabled: Boolean((min && dateStr < min) || (max && dateStr > max)),
    });
  }

  // Leading days from next month to fill grid
  const totalSlots = calendarDays.length > 35 ? 42 : 35;
  const remaining = totalSlots - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = formatDate(nextYear, nextMonth, d);
    calendarDays.push({
      day: d,
      year: nextYear,
      month: nextMonth,
      isCurrentMonth: false,
      dateStr,
      isSelected: value === dateStr,
      isToday: dateStr === todayStr,
      isDisabled: Boolean((min && dateStr < min) || (max && dateStr > max)),
    });
  }

  // Years for quick dropdown (past 25 to future 15)
  const availableYears: number[] = [];
  const currentYear = today.getFullYear();
  for (let y = currentYear - 25; y <= currentYear + 15; y++) {
    availableYears.push(y);
  }

  return (
    <div
      className="relative w-[285px] select-none rounded-lg border border-slate-200 bg-white p-3.5 shadow-xl transition-all dark:border-slate-700 dark:bg-slate-900"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header: Month, Year + Prev/Next Arrows */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
          className="group inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
          aria-label="Toggle month and year selector"
        >
          <Calendar className="h-4 w-4 text-[#0075ff]" />
          <span>
            {MONTH_NAMES[viewMonth]}, {viewYear}
          </span>
          <span className="text-[9px] text-slate-700 transition group-hover:translate-y-0.5 dark:text-slate-300">
            ▼
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Previous month"
            title="Previous month"
          >
            <ArrowUp className="h-4 w-4 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Next month"
            title="Next month"
          >
            <ArrowDown className="h-4 w-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Manual Date Input Facility */}
      <div className="mb-2.5">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={manualText}
            onChange={handleManualInputChange}
            onKeyDown={handleManualKeyDown}
            placeholder="DD-MM-YYYY"
            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#0075ff] focus:outline-none focus:ring-1 focus:ring-[#0075ff] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            aria-label="Type date manually in DD-MM-YYYY format"
          />
          <button
            type="button"
            onClick={handleApplyManual}
            disabled={!isValidManual && manualText.trim().length > 0}
            className={`rounded px-2.5 py-1 text-xs font-bold transition shrink-0 ${
              isValidManual || manualText.trim().length === 0
                ? 'bg-[#0075ff] text-white hover:bg-blue-600 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
            }`}
            title="Apply manually entered date"
          >
            Set
          </button>
        </div>
        {manualError && (
          <p className="mt-1 text-[10px] font-semibold text-rose-500 dark:text-rose-400">
            {manualError}
          </p>
        )}
      </div>

      {/* Month & Year Selection Overlay */}
      {showMonthYearPicker ? (
        <div className="my-2 max-h-[200px] overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
            <span className="font-bold text-slate-700 dark:text-slate-300">Year:</span>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {MONTH_NAMES.map((name, idx) => {
              const isCurrent = idx === viewMonth;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setViewMonth(idx);
                    setShowMonthYearPicker(false);
                  }}
                  className={`rounded px-1.5 py-1 text-center font-semibold transition ${
                    isCurrent
                      ? 'bg-[#0075ff] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Weekday Labels (Su, Mo, Tu, We, Th, Fr, Sa) */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {WEEKDAYS.map((wd) => (
              <span
                key={wd}
                className="py-1 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
            {calendarDays.map((cell) => {
              const { day, year, month, isCurrentMonth, isSelected, isToday, isDisabled } = cell;

              let cellStyle =
                'flex h-8 w-8 mx-auto items-center justify-center rounded-sm text-xs font-normal transition-all ';

              if (isDisabled) {
                cellStyle += 'opacity-25 cursor-not-allowed text-slate-400 ';
              } else if (isSelected) {
                // Exact Chromium Desktop highlight: bright blue background with orange border
                cellStyle +=
                  'bg-[#0075ff] text-white font-bold border-2 border-[#e67e00] shadow-sm z-10 cursor-pointer ';
              } else if (!isCurrentMonth) {
                cellStyle +=
                  'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ';
              } else if (isToday) {
                cellStyle +=
                  'font-bold text-[#0075ff] hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer ';
              } else {
                cellStyle +=
                  'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ';
              }

              return (
                <button
                  key={`${year}-${month}-${day}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(year, month, day)}
                  className={cellStyle}
                  aria-label={`${MONTH_NAMES[month]} ${day}, ${year}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Bottom Footer Action Bar: Clear & Today */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-medium dark:border-slate-800">
        <button
          type="button"
          onClick={handleClear}
          className="text-[#0075ff] transition hover:underline active:opacity-75 dark:text-blue-400"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="text-[#0075ff] transition hover:underline active:opacity-75 dark:text-blue-400"
        >
          Today
        </button>
      </div>
    </div>
  );
}

/**
 * Mobile-friendly modal container for the Chromium Date Picker
 */
export function MobileDatePickerModal({
  isOpen,
  value,
  onChange,
  onClose,
  min,
  max,
}: MobileDatePickerProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background body scroll completely while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 select-none"
      onClick={onClose}
      onTouchMove={(e) => {
        // Prevent background page from scrolling when touching backdrop
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      style={{ touchAction: 'none' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        <ChromiumDatePickerCard
          value={value}
          onChange={onChange}
          onClose={onClose}
          min={min}
          max={max}
        />
      </div>
    </div>,
    document.body
  );
}

/**
 * Global Mobile Date Picker Enhancer Controller
 */
type ActivePickerState = {
  input: HTMLInputElement;
  value: string;
  min?: string;
  max?: string;
} | null;

let globalSetPickerState: ((state: ActivePickerState) => void) | null = null;

export function openMobileDatePickerForInput(input: HTMLInputElement) {
  if (globalSetPickerState) {
    globalSetPickerState({
      input,
      value: input.value || '',
      min: input.min || undefined,
      max: input.max || undefined,
    });
  }
}

export function GlobalMobileDatePickerProvider() {
  const [pickerState, setPickerState] = useState<ActivePickerState>(null);

  useEffect(() => {
    globalSetPickerState = setPickerState;
    return () => {
      globalSetPickerState = null;
    };
  }, []);

  // Set up global touch/click interceptor that accurately distinguishes between
  // intentional taps vs. vertical page scrolling on mobile devices.
  useEffect(() => {
    if (!isMobileDevice()) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTouchScrolling = false;
    let touchedInput: HTMLInputElement | null = null;
    let lastScrollEndTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      // Multi-touch gestures (zoom/pinch) are scrolls
      if (e.touches.length !== 1) {
        isTouchScrolling = true;
        touchedInput = null;
        return;
      }

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      isTouchScrolling = false;

      const target = e.target as HTMLElement | null;
      const input = target?.closest('input[type="date"]') as HTMLInputElement | null;
      if (input && !input.disabled && !input.readOnly) {
        touchedInput = input;
      } else {
        touchedInput = null;
      }
      // CRITICAL: Passive listener with NO e.preventDefault() allows native vertical scroll to flow freely
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isTouchScrolling || !touchedInput) return;
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX);
      const deltaY = Math.abs(touch.clientY - touchStartY);

      // If finger moves more than 7px in any direction, user is scrolling the page!
      if (deltaX > 7 || deltaY > 7) {
        isTouchScrolling = true;
        touchedInput = null;
        lastScrollEndTime = Date.now();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      // If user was scrolling, cancel and never open picker
      if (isTouchScrolling) {
        lastScrollEndTime = Date.now();
        touchedInput = null;
        isTouchScrolling = false;
        return;
      }

      const duration = Date.now() - touchStartTime;
      const input = touchedInput;
      touchedInput = null;

      // Only open on deliberate brief tap (< 450ms) on a valid date input
      if (!input || input.disabled || input.readOnly || duration > 450) {
        return;
      }

      // Check distance at touchend
      if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        if (deltaX > 10 || deltaY > 10) {
          return;
        }
      }

      // Prevent native OS datepicker dialog from launching
      e.preventDefault();
      input.blur();

      setPickerState({
        input,
        value: input.value || '',
        min: input.min || undefined,
        max: input.max || undefined,
      });
    };

    const onTouchCancel = () => {
      isTouchScrolling = false;
      touchedInput = null;
    };

    const onClick = (e: MouseEvent) => {
      // If a touch scroll ended recently (< 250ms), suppress synthesized click
      if (Date.now() - lastScrollEndTime < 250) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const target = e.target as HTMLElement | null;
      const input = target?.closest('input[type="date"]') as HTMLInputElement | null;
      if (!input || input.disabled || input.readOnly) return;

      // Prevent native mobile OS date dialog
      e.preventDefault();
      e.stopPropagation();
      input.blur();

      setPickerState({
        input,
        value: input.value || '',
        min: input.min || undefined,
        max: input.max || undefined,
      });
    };

    // Attach passive touch listeners so vertical scrolling is 60fps buttery-smooth
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    document.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true, passive: false });
    document.addEventListener('touchcancel', onTouchCancel, { capture: true, passive: true });
    document.addEventListener('click', onClick, { capture: true, passive: false });

    return () => {
      document.removeEventListener('touchstart', onTouchStart, true);
      document.removeEventListener('touchmove', onTouchMove, true);
      document.removeEventListener('touchend', onTouchEnd, true);
      document.removeEventListener('touchcancel', onTouchCancel, true);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  const handleDateChange = useCallback((newDate: string) => {
    if (!pickerState?.input) return;
    const input = pickerState.input;

    // Dispatch native React value change
    const nativeValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeValueSetter) {
      nativeValueSetter.call(input, newDate);
    } else {
      input.value = newDate;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, [pickerState]);

  const handleClose = useCallback(() => {
    setPickerState(null);
  }, []);

  if (!pickerState) return null;

  return (
    <MobileDatePickerModal
      isOpen={Boolean(pickerState)}
      value={pickerState.value}
      onChange={handleDateChange}
      onClose={handleClose}
      min={pickerState.min}
      max={pickerState.max}
    />
  );
}
