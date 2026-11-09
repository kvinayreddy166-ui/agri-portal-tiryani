import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  safeStorage,
  setStorageActiveUser,
  getStorageActiveUser,
  isUserIsolatedKey,
  resolveScopedStorageKey,
  clearUserStorage,
} from './safeStorage';

// Setup mock localStorage in node test environment
const originalWindow = (globalThis as unknown as { window?: unknown }).window;
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
  },
  key: (i: number) => Object.keys(mockStorage)[i] ?? null,
  get length() {
    return Object.keys(mockStorage).length;
  },
};

if (typeof window === 'undefined') {
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: mockLocalStorage,
  };
} else if (!window.localStorage) {
  (window as unknown as { localStorage: unknown }).localStorage = mockLocalStorage;
}

describe('safeStorage user isolation', () => {
  afterAll(() => {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window;
    } else {
      (globalThis as unknown as { window: unknown }).window = originalWindow;
    }
  });

  beforeEach(() => {
    safeStorage.clear();
    setStorageActiveUser(null);
  });

  it('identifies officer statutory and draft keys as user-isolated', () => {
    expect(isUserIsolatedKey('agri-legal-fertilizer-stop-sale-orders')).toBe(true);
    expect(isUserIsolatedKey('agri-legal-pesticide-seizure-orders')).toBe(true);
    expect(isUserIsolatedKey('tiryani-fertilizer-forms-draft')).toBe(true);
    expect(isUserIsolatedKey('tiryani-covering-letter-queue')).toBe(true);
    expect(isUserIsolatedKey('tiryani_officer_records')).toBe(true);
    expect(isUserIsolatedKey('tourDiaryRecovery')).toBe(true);
    expect(isUserIsolatedKey('agronix_officer_archived_documents')).toBe(true);
  });

  it('preserves global app preferences as un-scoped', () => {
    expect(isUserIsolatedKey('tiryani-current-page')).toBe(false);
    expect(isUserIsolatedKey('tiryani-language')).toBe(false);
    expect(isUserIsolatedKey('tiryani-theme')).toBe(false);
  });

  it('scopes isolated keys to usr_{id} when officer is logged in and guest_ when unauthenticated', () => {
    setStorageActiveUser(null);
    expect(getStorageActiveUser()).toBeNull();
    expect(resolveScopedStorageKey('agri-legal-fertilizer-stop-sale-orders')).toBe(
      'guest_agri-legal-fertilizer-stop-sale-orders'
    );

    setStorageActiveUser('officer-123');
    expect(getStorageActiveUser()).toBe('officer-123');
    expect(resolveScopedStorageKey('agri-legal-fertilizer-stop-sale-orders')).toBe(
      'usr_officer-123_agri-legal-fertilizer-stop-sale-orders'
    );
  });

  it('completely isolates officer drafts between Officer A and Officer B on shared devices', () => {
    // Officer A logs in and saves a statutory draft
    setStorageActiveUser('officer-A');
    safeStorage.setItem('agri-legal-fertilizer-stop-sale-orders', JSON.stringify([{ id: 'order-A', dealer: 'Kisan Kendra' }]));

    expect(safeStorage.getItem('agri-legal-fertilizer-stop-sale-orders')).toContain('order-A');

    // Officer A logs out, Officer B logs in
    setStorageActiveUser(null);
    setStorageActiveUser('officer-B');

    // Officer B should NOT see Officer A's draft
    expect(safeStorage.getItem('agri-legal-fertilizer-stop-sale-orders')).toBeNull();

    // Officer B saves their own draft
    safeStorage.setItem('agri-legal-fertilizer-stop-sale-orders', JSON.stringify([{ id: 'order-B', dealer: 'Rythu Seva' }]));
    expect(safeStorage.getItem('agri-legal-fertilizer-stop-sale-orders')).toContain('order-B');

    // Officer B logs out, Officer A logs back in
    setStorageActiveUser('officer-A');
    const officerARecovered = safeStorage.getItem('agri-legal-fertilizer-stop-sale-orders');
    expect(officerARecovered).toContain('order-A');
    expect(officerARecovered).not.toContain('order-B');
  });

  it('shares global preferences across all users on the device', () => {
    setStorageActiveUser('officer-A');
    safeStorage.setItem('tiryani-language', 'te');

    setStorageActiveUser('officer-B');
    expect(safeStorage.getItem('tiryani-language')).toBe('te');

    safeStorage.setItem('tiryani-language', 'en');

    setStorageActiveUser('officer-A');
    expect(safeStorage.getItem('tiryani-language')).toBe('en');
  });

  it('migrates legacy un-scoped data transparently on first access', () => {
    // Simulate legacy data saved in window.localStorage before user scoping existed
    window.localStorage.setItem(
      'agri-legal-fertilizer-stop-sale-orders',
      JSON.stringify([{ id: 'legacy-1', note: 'Existing un-scoped order' }])
    );

    setStorageActiveUser('officer-migration-test');
    const retrieved = safeStorage.getItem('agri-legal-fertilizer-stop-sale-orders');

    expect(retrieved).toContain('legacy-1');
    // Verify it was migrated to the scoped key
    expect(
      window.localStorage.getItem('usr_officer-migration-test_agri-legal-fertilizer-stop-sale-orders')
    ).toContain('legacy-1');
  });

  it('clearUserStorage purges only the target user data and retains other users data', () => {
    setStorageActiveUser('officer-A');
    safeStorage.setItem('agri-legal-fertilizer-stop-sale-orders', 'data-A');

    setStorageActiveUser('officer-B');
    safeStorage.setItem('agri-legal-fertilizer-stop-sale-orders', 'data-B');

    // Clear Officer A's storage (e.g. account deletion)
    clearUserStorage('officer-A');

    // Officer A data is gone
    setStorageActiveUser('officer-A');
    expect(safeStorage.getItem('agri-legal-fertilizer-stop-sale-orders')).toBeNull();

    // Officer B data remains intact
    setStorageActiveUser('officer-B');
    expect(safeStorage.getItem('agri-legal-fertilizer-stop-sale-orders')).toBe('data-B');
  });
});
