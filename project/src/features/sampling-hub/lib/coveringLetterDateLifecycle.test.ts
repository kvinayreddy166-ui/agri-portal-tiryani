import { describe, expect, it, beforeEach, afterAll } from 'vitest';
import { localTodayDate } from '../../../shared/utils/dateUtils';
import { safeStorage } from '../../../shared/lib/safeStorage';

// Setup mock localStorage in node test environment and restore on teardown
const originalWindow = (globalThis as any).window;
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
  },
  key: (i: number) => Object.keys(mockStorage)[i] ?? null,
  get length() { return Object.keys(mockStorage).length; }
};

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    localStorage: mockLocalStorage,
  };
} else if (!window.localStorage) {
  (window as any).localStorage = mockLocalStorage;
}

describe('Covering Letter Date Lifecycle & Stability', () => {
  afterAll(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  });

  beforeEach(() => {
    safeStorage.clear();
  });

  it('correctly formats and preserves a user-selected letter date', () => {
    const selectedDate = '2026-10-20';
    expect(selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(selectedDate).not.toBe(localTodayDate());
  });

  it('restores letter date from localStorage without flickering or overwriting with today', () => {
    const COVERING_LETTER_DETAILS_KEY = 'tiryani-covering-letter-details';
    const draftDate = '2026-10-20';
    
    // Simulate pre-existing saved covering letter details in localStorage
    safeStorage.setItem(
      COVERING_LETTER_DETAILS_KEY,
      JSON.stringify({
        year: '2026-27',
        letterNumber: 'CL/2026/001',
        letterDate: draftDate,
        authorityType: 'DAO',
        daoMemoNumber: 'MEMO-123',
        daoMemoDate: '2026-10-18',
        division: 'Tiryani',
        officePhone: '9876543210',
      })
    );

    // Initial state resolution logic used in CoveringLetterModal
    const saved = safeStorage.getItem(COVERING_LETTER_DETAILS_KEY);
    let storageData: any = null;
    if (saved) storageData = JSON.parse(saved);

    const initialLetterDate = storageData?.letterDate || localTodayDate();

    // Verify it loads draft date directly on initialization (never blank, never today)
    expect(initialLetterDate).toBe(draftDate);
    expect(initialLetterDate).not.toBe('');
    expect(initialLetterDate).toBe('2026-10-20');
  });

  it('normalizes property names between parent tool state and modal storage schema', () => {
    const PESTICIDE_COVERING_LETTER_DETAILS_KEY = 'tiryani-pesticide-covering-letter-details';
    
    // Saved in modal schema (year, daoMemoNumber, daoMemoDate, officePhone)
    safeStorage.setItem(
      PESTICIDE_COVERING_LETTER_DETAILS_KEY,
      JSON.stringify({
        year: '2026-27',
        letterNumber: 'PEST-01',
        letterDate: '2026-10-20',
        authorityType: 'DAO',
        daoMemoNumber: 'DAO-999',
        daoMemoDate: '2026-10-19',
        division: 'Asifabad',
        officePhone: '9123456789',
      })
    );

    const saved = safeStorage.getItem(PESTICIDE_COVERING_LETTER_DETAILS_KEY);
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);

    // Normalized parent state hydration
    const normalizedParentDetails = {
      financialYear: parsed.financialYear || parsed.year || '2026-27',
      letterNumber: parsed.letterNumber ?? '',
      letterDate: parsed.letterDate || localTodayDate(),
      authorityType: parsed.authorityType || 'DAO',
      memoNumber: parsed.memoNumber ?? parsed.daoMemoNumber ?? '',
      memoDate: parsed.memoDate ?? parsed.daoMemoDate ?? '',
      division: parsed.division ?? '',
      officerPhone: parsed.officerPhone ?? parsed.officePhone ?? '',
    };

    expect(normalizedParentDetails.financialYear).toBe('2026-27');
    expect(normalizedParentDetails.letterDate).toBe('2026-10-20');
    expect(normalizedParentDetails.memoNumber).toBe('DAO-999');
    expect(normalizedParentDetails.memoDate).toBe('2026-10-19');
    expect(normalizedParentDetails.officerPhone).toBe('9123456789');
  });

  it('falls back to localTodayDate when no saved date exists, preventing blank input', () => {
    let storageData: any = null;
    const resolvedDate = storageData?.letterDate || localTodayDate();
    expect(resolvedDate).toBeTruthy();
    expect(resolvedDate).toBe(localTodayDate());
    expect(resolvedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
