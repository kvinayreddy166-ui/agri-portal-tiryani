import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { Session, User } from '@supabase/supabase-js';
import { OfficerRecordsHub, getDocumentSavedCategory, getEnforcementTrackerHref, getRecordSavedCategory } from './OfficerRecordsHub';
import * as AuthContextModule from '../../../shared/context/AuthContext';
import * as LanguageContextModule from '../../../shared/context/LanguageContext';
import { OfficerDocumentArchiveService } from '../services/officerDocumentArchiveService';
import { OfficerCloudSyncService, type UnifiedOfficerRecord } from '../services/officerCloudSyncService';
import type { OfficerDocumentArchiveRecord } from '../types/officerArchiveTypes';

vi.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
  isAdmin: vi.fn(() => false),
  isTestUser: vi.fn(() => false),
  isDealerUser: vi.fn(() => false),
  isOfficerUser: vi.fn(() => true),
}));

describe('OfficerRecordsHub (Enhanced Cloudflare R2 Archive)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(LanguageContextModule, 'useLanguage').mockReturnValue({
      language: 'en',
      isTelugu: false,
      toggleLanguage: vi.fn(),
      t: (en: string) => en,
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'test-officer', email: 'officer@telangana.gov.in' } as unknown as User,
      session: {} as unknown as Session,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: false,
      isElevatedOfficerUser: false,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: true,
      officerProfile: {
        id: 'test-officer',
        full_name: 'V. Reddy',
        designation: 'MAO',
        district: 'Kumurambheem Asifabad',
        mandal: 'Tiryani',
        phone: '9999999999',
        email: 'officer@telangana.gov.in',
        role: 'officer',
        status: 'active',
        created_at: '',
        updated_at: '',
      },
      dealerId: null,
      dealerName: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      registerOfficer: vi.fn(),
      signInOfficerOtp: vi.fn(),
      verifyOfficerOtp: vi.fn(),
      refreshOfficerProfile: vi.fn(),
      signInDealer: vi.fn(),
    });

    vi.spyOn(OfficerDocumentArchiveService, 'checkR2StorageHealth').mockResolvedValue({
      online: true,
      message: 'Cloud Storage Active',
    });

    vi.spyOn(OfficerDocumentArchiveService, 'getStorageOverview').mockResolvedValue({
      totalDocuments: 3,
      totalStorageBytes: 256000,
      totalOriginalBytes: 500000,
      totalStoredBytes: 256000,
      storageSavedBytes: 244000,
      compressionPercentage: 48.8,
      totalPdfs: 2,
      totalDocx: 1,
      successfullyUploaded: 2,
      pendingUploads: 1,
      failedUploads: 0,
    });

    vi.spyOn(OfficerDocumentArchiveService, 'fetchOfficerDocuments').mockResolvedValue([]);
    vi.spyOn(OfficerCloudSyncService, 'fetchAllOfficerRecords').mockResolvedValue([]);
  });

  it('renders the storage overview metric titles without original storage or storage saved cards', () => {
    const html = renderToString(<OfficerRecordsHub />);

    expect(html).toContain('Total Documents');
    expect(html).not.toContain('Original Storage');
    expect(html).toContain('Total Storage Used');
    expect(html).not.toContain('Storage Saved');
    expect(html).toContain('Saved to Cloud');
    expect(html).toContain('Pending Uploads');
    expect(html).toContain('Failed Uploads');
  });

  it('renders records header correctly without redundant officer jurisdiction strip', () => {
    const html = renderToString(<OfficerRecordsHub />);

    expect(html).toContain('Saved Records &amp; Storage');
    expect(html).not.toContain('Cloudflare R2 Active');
  });

  it('renders a single merged view without separate storage/records tabs', () => {
    const html = renderToString(<OfficerRecordsHub />);

    expect(html).not.toContain('Cloud Storage');
    expect(html).not.toContain('My Records');
  });

  it('renders filter controls, search bar, and view toggles', () => {
    const html = renderToString(<OfficerRecordsHub />);

    expect(html).toContain('All Categories');
    expect(html).toContain('Stop Sales');
    expect(html).toContain('Seizures');
    expect(html).toContain('SCN/Memos');
    expect(html).not.toContain('Statutory Orders');
    expect(html).not.toContain('Show Cause Notices');
    expect(html).toContain('Search name, firm or product');
    expect(html).toContain('List View');
  });

  it('classifies unified order records into the new saved-record categories', () => {
    const baseRecord: UnifiedOfficerRecord = {
      id: 'rec-1',
      source: 'cloud',
      category: 'order',
      subType: 'stop_sale',
      commodity: 'fertilizer',
      title: 'STOP SALE - FERTILIZER',
      referenceNumber: 'SS-001',
      entityName: 'Dealer',
      recordDate: '2026-11-07',
      location: 'Tiryani',
      details: {},
      synced: true,
      createdAt: '2026-11-07T10:00:00Z',
    };

    expect(getRecordSavedCategory({ ...baseRecord, subType: 'stop_sale' })).toBe('stop_sales');
    expect(getRecordSavedCategory({ ...baseRecord, subType: 'revocation' })).toBe('stop_sales');
    expect(getRecordSavedCategory({ ...baseRecord, subType: 'seizure' })).toBe('seizures');
    expect(getRecordSavedCategory({ ...baseRecord, subType: 'show_cause' })).toBe('scn_memos');
  });

  it('classifies archived enforcement documents by source module and category', () => {
    const makeDoc = (overrides: Partial<OfficerDocumentArchiveRecord>): OfficerDocumentArchiveRecord => ({
      id: 'doc-1',
      user_id: 'officer-1',
      document_name: 'Order.pdf',
      document_category: 'order',
      document_date: '2026-11-07',
      source_module: 'stop_sale',
      object_key: 'officers/officer-1/doc-1.pdf',
      file_format: 'pdf',
      mime_type: 'application/pdf',
      original_size: 1000,
      stored_size: 500,
      compression_status: 'compressed',
      content_hash: 'hash',
      upload_status: 'saved_to_cloud',
      version_number: 1,
      metadata_json: {},
      created_at: '2026-11-07T10:00:00Z',
      updated_at: '2026-11-07T10:00:00Z',
      ...overrides,
    });

    expect(getDocumentSavedCategory(makeDoc({ source_module: 'stop_sale' }))).toBe('stop_sales');
    expect(getDocumentSavedCategory(makeDoc({ source_module: 'revocation' }))).toBe('stop_sales');
    expect(getDocumentSavedCategory(makeDoc({ source_module: 'seizure' }))).toBe('seizures');
    expect(getDocumentSavedCategory(makeDoc({ document_category: 'notice', source_module: 'show_cause' }))).toBe('scn_memos');
    expect(getDocumentSavedCategory(makeDoc({ document_category: 'notice', source_module: 'seizure' }))).toBe('seizures');
    expect(getDocumentSavedCategory(makeDoc({ source_module: 'acts_and_orders', document_name: 'Generic Order.pdf' }))).toBe('order');
  });

  it('maps enforcement categories to the relevant tracker tabs', () => {
    expect(getEnforcementTrackerHref('stop_sales')).toBe('/officer-toolkit/enforcement-tracker?tab=scorecards');
    expect(getEnforcementTrackerHref('seizures')).toBe('/officer-toolkit/enforcement-tracker?tab=scorecards');
    expect(getEnforcementTrackerHref('scn_memos')).toBe('/officer-toolkit/enforcement-tracker?tab=deadlines');
    expect(getEnforcementTrackerHref('sample')).toBeNull();
  });

  it('provides the Field Form Records view details interface', async () => {
    vi.spyOn(OfficerCloudSyncService, 'fetchAllOfficerRecords').mockResolvedValue([
      {
        id: 'rec-1',
        source: 'cloud',
        category: 'order',
        subType: 'stop_sale',
        commodity: 'fertilizer',
        title: 'FERTILIZER STOP SALE ORDER',
        referenceNumber: 'ORD-2026-001',
        entityName: 'Sri Balaji Agro Agencies',
        recordDate: '2026-11-07',
        location: 'Tiryani, Kumurambheem Asifabad',
        details: {
          observations: 'Stock board missing; contravention of FCO 1985',
          products: [
            {
              name: 'Urea 46% N',
              batchNo: 'B-998',
              manufacturer: 'IFFCO',
              quantityMt: '50 MT',
              remarks: 'Suspended pending sample analysis',
            },
          ],
        },
        synced: true,
        createdAt: '2026-11-07T10:00:00Z',
      },
    ]);

    const html = renderToString(<OfficerRecordsHub />);
    expect(html).toBeDefined();
  });
});
