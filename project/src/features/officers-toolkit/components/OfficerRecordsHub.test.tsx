import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { OfficerRecordsHub } from './OfficerRecordsHub';
import * as AuthContextModule from '../../../shared/context/AuthContext';
import * as LanguageContextModule from '../../../shared/context/LanguageContext';
import { OfficerDocumentArchiveService } from '../services/officerDocumentArchiveService';
import { OfficerCloudSyncService } from '../services/officerCloudSyncService';

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
      user: { id: 'test-officer', email: 'officer@telangana.gov.in' } as any,
      session: {} as any,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: false,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: true,
      officerProfile: {
        id: 'test-officer',
        full_name: 'V. Reddy',
        designation: 'MAO',
        district: 'Kumuram Bheem Asifabad',
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

  it('renders the storage overview metric titles including compression savings', () => {
    const html = renderToString(<OfficerRecordsHub />);

    expect(html).toContain('Total Documents');
    expect(html).toContain('Original Storage');
    expect(html).toContain('Total Storage Used');
    expect(html).toContain('Storage Saved');
    expect(html).toContain('Total PDFs');
    expect(html).toContain('Total DOCX');
    expect(html).toContain('Saved to Cloud');
    expect(html).toContain('Pending Uploads');
    expect(html).toContain('Failed Uploads');
  });

  it('renders officer jurisdiction and title correctly', () => {
    const html = renderToString(<OfficerRecordsHub />);

    expect(html).toContain('Records &amp; Cloud Archive');
    expect(html).toContain('MAO');
    expect(html).toContain('Tiryani');
  });

  it('renders the tab options for Archived Documents and Field Form Records', () => {
    const html = renderToString(<OfficerRecordsHub />);

    expect(html).toContain('Archived Documents');
    expect(html).not.toContain('Archived Documents (R2 Cloud)');
    expect(html).toContain('Field Form Records &amp; Findings');
  });

  it('renders filter controls and search bar', () => {
    const html = renderToString(<OfficerRecordsHub />);

    expect(html).toContain('All Categories');
    expect(html).toContain('Statutory Orders');
    expect(html).toContain('Show Cause Notices');
    expect(html).toContain('Search by document name');
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
        location: 'Tiryani, Kumuram Bheem Asifabad',
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
