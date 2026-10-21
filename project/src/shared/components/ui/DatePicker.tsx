import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(str?: string): { year: number; month: number; day: number } | null {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  // YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return { year, month, day };
    }
  }
  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return { year, month, day };
    }
  }
  return null;
}

export function formatIso(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function formatDisplay(value?: string): string {
  const parsed = parseDateString(value);
  if (!parsed) return value || '';
  const d = String(parsed.day).padStart(2, '0');
  const m = String(parsed.month + 1).padStart(2, '0');
  return `${d}-${m}-${parsed.year}`;
}

export function generateCalendarCells(
  viewYear: number,
  viewMonth: number,
  parsedValue: { year: number; month: number; day: number } | null,
  todayStr: string
) {
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: {
    dayNumber: number;
    iso: string;
    isCurrentMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
  }[] = [];

  // Overflow from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const iso = formatIso(prevYear, prevMonth, dayNumber);
    cells.push({
      dayNumber,
      iso,
      isCurrentMonth: false,
      isSelected: !!parsedValue && iso === formatIso(parsedValue.year, parsedValue.month, parsedValue.day),
      isToday: iso === todayStr,
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const iso = formatIso(viewYear, viewMonth, d);
    cells.push({
      dayNumber: d,
      iso,
      isCurrentMonth: true,
      isSelected: !!parsedValue && iso === formatIso(parsedValue.year, parsedValue.month, parsedValue.day),
      isToday: iso === todayStr,
    });
  }

  // Overflow into next month to complete 42 cells
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const iso = formatIso(nextYear, nextMonth, d);
    cells.push({
      dayNumber: d,
      iso,
      isCurrentMonth: false,
      isSelected: !!parsedValue && iso === formatIso(parsedValue.year, parsedValue.month, parsedValue.day),
      isToday: iso === todayStr,
    });
  }

  return cells;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'dd-mm-yyyy',
  className = '',
  wrapperClassName = '',
  disabled = false,
  required = false,
  min,
  max,
  id,
  name,
  'aria-label': ariaLabel,
  autoFocus = false,
  readOnly: explicitReadOnly = false,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const todayStr = useMemo(() => getTodayString(), []);
  const parsedValue = useMemo(() => parseDateString(value), [value]);

  const [viewYear, setViewYear] = useState<number>(() => {
    return parsedValue?.year ?? new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return parsedValue?.month ?? new Date().getMonth();
  });

  // When picker opens or value changes, sync view to selected date
  useEffect(() => {
    if (isOpen) {
      if (parsedValue) {
        setViewYear(parsedValue.year);
        setViewMonth(parsedValue.month);
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
      }
      setIsMonthPickerOpen(false);
    }
  }, [isOpen, parsedValue]);

  // Calculate popover position on desktop
  const updatePosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const calendarWidth = 270;
    const calendarHeight = 310;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.left;
    if (left + calendarWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - calendarWidth - 8);
    }

    let top = rect.bottom + 4;
    if (top + calendarHeight > viewportHeight - 8 && rect.top > calendarHeight + 8) {
      top = rect.top - calendarHeight - 4;
    }

    setPopoverPos({ top, left });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        calendarRef.current &&
        !calendarRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false);
        setIsMonthPickerOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMonthPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const emitChange = (newValue: string) => {
    if (!onChange) return;
    onChange(newValue);
  };

  const isDayDisabled = (iso: string) => {
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  };

  const handleSelectDay = (dayIso: string) => {
    if (isDayDisabled(dayIso)) return;
    emitChange(dayIso);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    emitChange('');
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    emitChange(todayStr);
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewYear((prev) => prev - 1);
      setViewMonth(11);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewYear((prev) => prev + 1);
      setViewMonth(0);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Calendar cells generation (42 cells: 6 rows of 7 days)
  const calendarCells = useMemo(() => {
    return generateCalendarCells(viewYear, viewMonth, parsedValue, todayStr);
  }, [viewYear, viewMonth, parsedValue, todayStr]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const calendarPopup = (
    <div
      ref={calendarRef}
      className="w-[266px] rounded bg-white p-3 font-sans text-slate-800 shadow-2xl ring-1 ring-black/10 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10"
      style={{ userSelect: 'none' }}
    >
      {/* Header Row: Month, Year on left, Up/Down arrows on right */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMonthPickerOpen((prev) => !prev)}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-sm font-bold text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
        >
          <span>{`${MONTH_NAMES[viewMonth]}, ${viewYear}`}</span>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">▾</span>
        </button>

        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
          <button
            type="button"
            aria-label="Previous month"
            onClick={handlePrevMonth}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowUp className="h-4 w-4 stroke-[2.2]" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={handleNextMonth}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowDown className="h-4 w-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {isMonthPickerOpen ? (
        /* Month & Year Quick Selector View */
        <div className="py-2">
          <div className="mb-3 flex items-center justify-between px-2">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
            {MONTH_NAMES.map((name, index) => {
              const isCurrent = index === viewMonth;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setViewMonth(index);
                    setIsMonthPickerOpen(false);
                  }}
                  className={`rounded py-2 font-semibold transition ${
                    isCurrent
                      ? 'bg-[#0075ff] font-bold text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standard Month Day Grid (Exactly matching Image 2) */
        <>
          {/* Day Headers (Su, Mo, Tu, We, Th, Fr, Sa) */}
          <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-slate-800 dark:text-slate-200">
            {WEEKDAY_NAMES.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          {/* 42 Day Grid */}
          <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
            {calendarCells.map((cell) => {
              const isSelected = cell.isSelected;
              const cellDisabled = isDayDisabled(cell.iso);
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={cellDisabled}
                  onClick={() => handleSelectDay(cell.iso)}
                  className={`relative flex h-8 w-8 items-center justify-center justify-self-center text-xs transition ${
                    cellDisabled
                      ? 'cursor-not-allowed opacity-30 text-slate-400'
                      : isSelected
                      ? 'rounded-sm border-2 border-black bg-[#0075ff] font-bold text-white shadow-sm dark:border-white'
                      : cell.isCurrentMonth
                      ? 'font-normal text-slate-900 hover:bg-blue-50 dark:text-slate-100 dark:hover:bg-slate-800'
                      : 'font-normal text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800'
                  }`}
                >
                  {cell.dayNumber}
                  {cell.isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#0075ff]" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Footer Row: Clear on Left, Today on Right (matching Image 2) */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-medium text-[#0075ff] dark:border-slate-800 dark:text-blue-400">
        <button
          type="button"
          onClick={handleClear}
          className="cursor-pointer hover:underline"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="cursor-pointer hover:underline"
        >
          Today
        </button>
      </div>
    </div>
  );

  return (
    <div className={`relative inline-block ${wrapperClassName || 'w-full'}`}>
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="text"
        readOnly={explicitReadOnly || true}
        inputMode="none"
        value={formatDisplay(value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        onClick={() => {
          if (!disabled) setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`${className} cursor-pointer pr-8`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className="pointer-events-auto absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <Calendar className="h-4 w-4" />
      </button>

      {/* Render calendar popover/modal via Portal */}
      {isOpen &&
        createPortal(
          isMobile ? (
            /* Mobile: Centered Dialog with Backdrop */
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px] animate-in fade-in duration-100">
              <div
                className="absolute inset-0"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              <div className="relative z-10 animate-in zoom-in-95 duration-100">
                {calendarPopup}
              </div>
            </div>
          ) : (
            /* Desktop: Positioned Popover */
            popoverPos && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setIsOpen(false)}
                  aria-hidden="true"
                />
                <div
                  style={{
                    position: 'fixed',
                    top: popoverPos.top,
                    left: popoverPos.left,
                    zIndex: 9999,
                  }}
                  className="animate-in fade-in-50 zoom-in-95 duration-100"
                >
                  {calendarPopup}
                </div>
              </>
            )
          ),
          document.body
        )}
    </div>
  );
}

export default DatePicker;
