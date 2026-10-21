import { describe, expect, it } from 'vitest';
import {
  parseDateString,
  formatIso,
  formatDisplay,
  getTodayString,
  generateCalendarCells,
} from './DatePicker';

describe('DatePicker Logic', () => {
  it('parses YYYY-MM-DD correctly', () => {
    const parsed = parseDateString('2026-10-21');
    expect(parsed).toEqual({ year: 2026, month: 9, day: 21 }); // month 9 = October
  });

  it('parses DD-MM-YYYY correctly', () => {
    const parsed = parseDateString('21-10-2026');
    expect(parsed).toEqual({ year: 2026, month: 9, day: 21 });
  });

  it('returns null for invalid strings', () => {
    expect(parseDateString('')).toBeNull();
    expect(parseDateString('invalid')).toBeNull();
  });

  it('formats ISO correctly', () => {
    expect(formatIso(2026, 9, 21)).toBe('2026-10-21');
    expect(formatIso(2026, 0, 5)).toBe('2026-01-05');
  });

  it('formats display date correctly (DD-MM-YYYY)', () => {
    expect(formatDisplay('2026-10-21')).toBe('21-10-2026');
    expect(formatDisplay('2026-01-05')).toBe('05-01-2026');
    expect(formatDisplay('')).toBe('');
  });

  it('returns valid today string', () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('generates 42 calendar cells matching October 2026 exactly as shown in Image 2', () => {
    // October 2026 (year: 2026, month: 9)
    // Oct 1, 2026 is Thursday (day 4), so previous month overflow should be 4 days: 27, 28, 29, 30
    const cells = generateCalendarCells(2026, 9, { year: 2026, month: 9, day: 21 }, '2026-10-21');
    expect(cells).toHaveLength(42);

    // Row 1 starts with 27, 28, 29, 30 (September) then 1, 2, 3 (October)
    expect(cells[0].dayNumber).toBe(27);
    expect(cells[0].isCurrentMonth).toBe(false);
    expect(cells[0].iso).toBe('2026-09-27');

    expect(cells[3].dayNumber).toBe(30);
    expect(cells[3].isCurrentMonth).toBe(false);

    expect(cells[4].dayNumber).toBe(1);
    expect(cells[4].isCurrentMonth).toBe(true);
    expect(cells[4].iso).toBe('2026-10-01');

    // Day 21 (index 24) should be selected
    const day21 = cells.find((c) => c.iso === '2026-10-21');
    expect(day21).toBeDefined();
    expect(day21?.isSelected).toBe(true);
    expect(day21?.dayNumber).toBe(21);
    expect(day21?.isCurrentMonth).toBe(true);

    // Last row should have next month overflow: 1, 2, 3, 4, 5, 6, 7 (November)
    const lastRow = cells.slice(35);
    expect(lastRow).toHaveLength(7);
    expect(lastRow.map((c) => c.dayNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(lastRow.every((c) => !c.isCurrentMonth)).toBe(true);
  });
});
