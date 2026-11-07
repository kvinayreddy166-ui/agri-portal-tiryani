import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  OfficerReportExportService,
  type ReportExportOptions,
} from './officerReportExportService';
import type { OfficerDocumentArchiveRecord } from '../types/officerArchiveTypes';
import type { UnifiedOfficerRecord } from './officerCloudSyncService';

describe('OfficerReportExportService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractRows for documents (Tab 1)', () => {
    it('correctly maps statutory sampling document with complete metadata into official columns', () => {
      const docs: OfficerDocumentArchiveRecord[] = [
        {
          id: 'doc-1',
          user_id: 'officer-1',
          document_name: 'Fertilizer_Sample_Urea_46.pdf',
          file_format: 'pdf',
          mime_type: 'application/pdf',
          object_key: 'officers/officer-1/doc-1.pdf',
          document_category: 'sample',
          document_date: '2026-11-05',
          document_number: 'SMP-FERT-2026-001',
          source_module: 'fertilizer_statutory',
          original_size: 102400,
          stored_size: 51200,
          compression_status: 'compressed',
          content_hash: 'a'.repeat(64),
          upload_status: 'saved_to_cloud',
          version_number: 1,
          created_at: '2026-11-05T10:00:00Z',
          updated_at: '2026-11-05T10:00:00Z',
          metadata_json: {
            productName: 'Urea (46% N) Granular',
            firmName: 'Sri Venkateshwara Fertilisers',
            firmAddress: 'Main Road, Tiryani Mandal',
            codeNo: 'TS/FERT/TIR/001',
            samplingDate: '2026-11-05',
            officerName: 'K. Vinay Reddy, AO',
            resultRemarks: 'Form J & K Prepared, Sent to Laboratory',
          },
        },
      ];

      const options: ReportExportOptions = {
        activeTab: 'documents',
        categoryFilter: 'sample',
        commodityFilter: 'fertilizer',
        officerName: 'K. Vinay Reddy, AO',
        location: 'Tiryani Mandal',
      };

      const rows = OfficerReportExportService.extractRows(docs, [], options);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        sNo: 1,
        productName: 'Urea (46% N) Granular',
        firmName: 'Sri Venkateshwara Fertilisers',
        firmAddress: 'Main Road, Tiryani Mandal',
        codeNo: 'SMP-FERT-2026-001',
        samplingDate: '2026-11-05',
        officerName: 'K. Vinay Reddy, AO',
        resultRemarks: 'Form J & K Prepared, Sent to Laboratory',
        rawCategory: 'sample',
      });
    });

    it('gracefully handles missing metadata using file name and document defaults', () => {
      const docs: OfficerDocumentArchiveRecord[] = [
        {
          id: 'doc-2',
          user_id: 'officer-1',
          document_name: 'Chlorpyrifos_20EC_Sample.pdf',
          file_format: 'pdf',
          mime_type: 'application/pdf',
          object_key: 'officers/officer-1/doc-2.pdf',
          document_category: 'sample',
          document_date: '2026-11-06',
          source_module: 'pesticide_statutory',
          original_size: 80000,
          stored_size: 40000,
          compression_status: 'compressed',
          content_hash: 'b'.repeat(64),
          upload_status: 'saved_to_cloud',
          version_number: 1,
          created_at: '2026-11-06T10:00:00Z',
          updated_at: '2026-11-06T10:00:00Z',
          metadata_json: {},
        },
      ];

      const options: ReportExportOptions = {
        activeTab: 'documents',
        categoryFilter: 'sample',
        officerName: 'K. Vinay Reddy',
        location: 'Tiryani',
      };

      const rows = OfficerReportExportService.extractRows(docs, [], options);

      expect(rows).toHaveLength(1);
      expect(rows[0].sNo).toBe(1);
      expect(rows[0].productName).toBe('Chlorpyrifos 20EC Sample');
      expect(rows[0].firmName).toBe('—');
      expect(rows[0].firmAddress).toBe('Tiryani');
      expect(rows[0].codeNo).toBe('—');
      expect(rows[0].samplingDate).toBe('2026-11-06');
      expect(rows[0].officerName).toBe('K. Vinay Reddy');
      expect(rows[0].resultRemarks).toBe('Archived to Cloud');
    });
  });

  describe('extractRows for forms (Tab 2)', () => {
    it('correctly maps unified statutory form records into standard columns', () => {
      const forms: UnifiedOfficerRecord[] = [
        {
          id: 'form-1',
          source: 'cloud',
          category: 'sample',
          subType: 'seed_form_8',
          commodity: 'seed',
          title: 'Form VIII - Seed Sampling Report',
          referenceNumber: 'SEED-TIR-042',
          entityName: 'Kisan Beej Bhandar',
          location: 'Tiryani Village',
          recordDate: '2026-11-04',
          synced: true,
          createdAt: '2026-11-04T10:00:00Z',
          details: {
            variety: 'Cotton BG-II',
            officerName: 'Inspector Sharma',
            remarks: 'Sealed 3 packets as per procedure',
          },
        },
      ];

      const options: ReportExportOptions = {
        activeTab: 'forms',
        categoryFilter: 'sample',
        commodityFilter: 'seed',
      };

      const rows = OfficerReportExportService.extractRows([], forms, options);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        sNo: 1,
        productName: 'Cotton BG-II',
        firmName: 'Kisan Beej Bhandar',
        firmAddress: 'Tiryani Village',
        codeNo: 'SEED-TIR-042',
        samplingDate: '2026-11-04',
        officerName: 'Inspector Sharma',
        resultRemarks: 'Sealed 3 packets as per procedure',
        rawCategory: 'sample',
      });
    });
  });

  describe('getReportTitle', () => {
    it('returns official sampling register title with commodity prefix', () => {
      const titleFert = OfficerReportExportService.getReportTitle({
        activeTab: 'documents',
        categoryFilter: 'sample',
        commodityFilter: 'fertilizer',
      });
      expect(titleFert.mainTitle).toContain('GOVERNMENT OF TELANGANA');
      expect(titleFert.subTitle).toBe(
        'OFFICIAL STATUTORY FERTILIZER SAMPLING REGISTER & CONSOLIDATED REPORT'
      );
      expect(titleFert.filenameBase).toBe('Official_Fertilizer_Sampling_Register_Report');

      const titleSeed = OfficerReportExportService.getReportTitle({
        activeTab: 'documents',
        categoryFilter: 'sample',
        commodityFilter: 'seed',
      });
      expect(titleSeed.subTitle).toBe(
        'OFFICIAL STATUTORY SEED SAMPLING REGISTER & CONSOLIDATED REPORT'
      );

      const titlePesticide = OfficerReportExportService.getReportTitle({
        activeTab: 'documents',
        categoryFilter: 'sample',
        commodityFilter: 'pesticide',
      });
      expect(titlePesticide.subTitle).toBe(
        'OFFICIAL STATUTORY INSECTICIDE / PESTICIDE SAMPLING REGISTER & CONSOLIDATED REPORT'
      );
    });

    it('returns official enforcement orders register title', () => {
      const title = OfficerReportExportService.getReportTitle({
        activeTab: 'forms',
        categoryFilter: 'order',
      });
      expect(title.subTitle).toContain('STATUTORY ENFORCEMENT ORDERS');
    });

    it('returns official inspection report title', () => {
      const title = OfficerReportExportService.getReportTitle({
        activeTab: 'documents',
        categoryFilter: 'inspection',
      });
      expect(title.subTitle).toContain('QUALITY CONTROL ENFORCEMENT REPORT');
    });

    it('returns general archive title when no specific category is selected', () => {
      const title = OfficerReportExportService.getReportTitle({
        activeTab: 'documents',
        categoryFilter: 'all',
      });
      expect(title.subTitle).toContain('OFFICIAL RECORDS & CLOUD ARCHIVE CONSOLIDATED REPORT');
    });
  });
});
