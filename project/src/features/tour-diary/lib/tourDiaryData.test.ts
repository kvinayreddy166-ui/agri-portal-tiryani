import { describe, expect, it } from 'vitest';
import { resolveSpecialDateStatus } from './tourDiaryData';
import type { Holiday } from '../types/tourDiaryTypes';

describe('resolveSpecialDateStatus', () => {
  const sampleOptionalHoliday: Holiday = {
    id: 'h-1',
    year: 2026,
    date: '2026-08-21',
    holiday_name: 'Varalakshmi Vratham',
    holiday_type: 'OPTIONAL'
  };

  it('marks optional holiday as Leave when leave_type is OPTIONAL_HOLIDAY_LEAVE', () => {
    // 21-08-2026 is a Friday (not Sunday, not 2nd Saturday)
    const status = resolveSpecialDateStatus({
      year: 2026,
      month: 8,
      day: 21,
      leaveType: 'OPTIONAL_HOLIDAY_LEAVE',
      displayedHolidays: [sampleOptionalHoliday]
    });

    expect(status).toEqual({
      type: 'leave',
      label: 'Leave'
    });
  });

  it('marks normal leave as Leave when leave_type is NORMAL_LEAVE', () => {
    const status = resolveSpecialDateStatus({
      year: 2026,
      month: 8,
      day: 20,
      leaveType: 'NORMAL_LEAVE',
      displayedHolidays: []
    });

    expect(status).toEqual({
      type: 'leave',
      label: 'Leave'
    });
  });

  it('marks optional holiday as Optional Holiday when leave_type is OPTIONAL_HOLIDAY', () => {
    const status = resolveSpecialDateStatus({
      year: 2026,
      month: 8,
      day: 21,
      leaveType: 'OPTIONAL_HOLIDAY',
      displayedHolidays: [sampleOptionalHoliday]
    });

    expect(status).toEqual({
      type: 'optionalHoliday',
      label: 'Optional Holiday – Varalakshmi Vratham'
    });
  });

  it('marks general holiday correctly', () => {
    const generalHoliday: Holiday = {
      id: 'h-2',
      year: 2026,
      date: '2026-08-15',
      holiday_name: 'Independence Day',
      holiday_type: 'GENERAL'
    };

    const status = resolveSpecialDateStatus({
      year: 2026,
      month: 8,
      day: 15,
      leaveType: 'NONE',
      displayedHolidays: [generalHoliday]
    });

    expect(status).toEqual({
      type: 'holiday',
      label: 'Holiday – Independence Day'
    });
  });

  it('marks Sunday correctly', () => {
    // 02-08-2026 is Sunday
    const status = resolveSpecialDateStatus({
      year: 2026,
      month: 8,
      day: 2,
      leaveType: 'NONE',
      displayedHolidays: []
    });

    expect(status).toEqual({
      type: 'sunday',
      label: 'Sunday'
    });
  });

  it('marks 2nd Saturday correctly', () => {
    // 08-08-2026 is Second Saturday of August 2026
    const status = resolveSpecialDateStatus({
      year: 2026,
      month: 8,
      day: 8,
      leaveType: 'NONE',
      displayedHolidays: []
    });

    expect(status).toEqual({
      type: 'secondSaturday',
      label: '2nd Saturday'
    });
  });

  it('returns null for an ordinary working day without leaves or holidays', () => {
    // 03-08-2026 is Monday
    const status = resolveSpecialDateStatus({
      year: 2026,
      month: 8,
      day: 3,
      leaveType: 'NONE',
      displayedHolidays: []
    });

    expect(status).toBeNull();
  });
});
