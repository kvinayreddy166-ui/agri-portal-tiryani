import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { OfficerCloudSyncService } from './officerCloudSyncService';
import { safeStorage } from '../../../shared/lib/safeStorage';
import { supabase } from '../../../shared/lib/supabase';

// Setup mock localStorage in node test environment
const originalWindow = (globalThis as unknown as { window?: unknown }).window;
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
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: mockLocalStorage,
  };
} else if (!window.localStorage) {
  (window as unknown as { localStorage: unknown }).localStorage = mockLocalStorage;
}

vi.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('OfficerCloudSyncService', () => {
  afterAll(() => {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window;
    } else {
      (globalThis as unknown as { window: unknown }).window = originalWindow;
    }
  });

  beforeEach(() => {
    safeStorage.clear();
    vi.clearAllMocks();
  });

  it('syncStatutoryOrder formats and returns a valid sync result when offline or unauthenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    const result = await OfficerCloudSyncService.syncStatutoryOrder(
      'stop_sale',
      'fertilizer',
      {
        orderNumber: 'ORD-101',
        firmName: 'Sri Balaji Agro',
        noticeDate: '2026-11-04',
        mandal: 'Tiryani',
        district: 'Kumurambheem Asifabad',
      }
    );

    expect(result.success).toBe(true);
    expect(result.syncedToCloud).toBe(false);
    expect(result.id).toBeDefined();
  });

  it('syncInspection creates valid payload with commodity and date', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    const result = await OfficerCloudSyncService.syncInspection('seed', {
      dealerName: 'Kisan Seed Agency',
      licenseNumber: 'TS/SEED/2026/09',
      inspectionDate: '2026-11-04',
    });

    expect(result.success).toBe(true);
    expect(result.syncedToCloud).toBe(false);
  });

  it('syncSampleMemo creates valid payload with sample code and status', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    const result = await OfficerCloudSyncService.syncSampleMemo('pesticide', {
      sampleCode: 'PEST-SMP-55',
      dealerName: 'Annapurna Fertilisers',
      samplingDate: '2026-11-04',
      batchNo: 'B-9988',
      labStatus: 'DISPATCHED',
    });

    expect(result.success).toBe(true);
    expect(result.syncedToCloud).toBe(false);
  });

  it('fetchAllOfficerRecords reads local drafts from safeStorage and surfaces them as UnifiedOfficerRecord', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    const localOrders = [
      {
        id: 'ord-local-1',
        orderNumber: 'STOP-SALE-001',
        firmName: 'Lakshmi Agro Services',
        noticeDate: '2026-11-04',
        mandal: 'Tiryani',
        district: 'Kumurambheem Asifabad',
        issuedAt: '2026-11-04T10:00:00.000Z',
      },
    ];

    safeStorage.setItem('agri-legal-fertilizer-stop-sale-orders', JSON.stringify(localOrders));

    const records = await OfficerCloudSyncService.fetchAllOfficerRecords();
    expect(records.length).toBeGreaterThan(0);
    const orderRecord = records.find((r) => r.referenceNumber === 'STOP-SALE-001');
    expect(orderRecord).toBeDefined();
    expect(orderRecord?.entityName).toBe('Lakshmi Agro Services');
    expect(orderRecord?.source).toBe('local');
    expect(orderRecord?.synced).toBe(false);
  });

  it('deleteRecord removes record from safeStorage arrays', async () => {
    const localOrders = [
      {
        id: 'ord-to-del-1',
        orderNumber: 'REVOKE-007',
        firmName: 'Ganesh Agro Traders',
      },
    ];
    safeStorage.setItem('agri-legal-fertilizer-stop-sale-orders', JSON.stringify(localOrders));

    const recordToDelete = {
      id: 'ord-to-del-1',
      source: 'local' as const,
      category: 'order' as const,
      subType: 'stop_sale',
      commodity: 'fertilizer' as const,
      title: 'Stop Sale Order',
      referenceNumber: 'REVOKE-007',
      entityName: 'Ganesh Agro Traders',
      recordDate: '2026-11-04',
      location: 'Tiryani',
      details: {},
      synced: false,
      createdAt: '2026-11-04',
    };

    const res = await OfficerCloudSyncService.deleteRecord(recordToDelete);
    expect(res).toBe(true);

    const afterRaw = safeStorage.getItem('agri-legal-fertilizer-stop-sale-orders');
    const parsed = JSON.parse(afterRaw || '[]');
    expect(parsed.length).toBe(0);
  });
});
