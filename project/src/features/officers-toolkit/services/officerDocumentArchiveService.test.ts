import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfficerDocumentArchiveService, LOCAL_ARCHIVED_DOCS_KEY, type DocumentArchiveInput } from './officerDocumentArchiveService';
import { supabase } from '../../../shared/lib/supabase';
import { OfficerDocumentQueue } from './officerDocumentQueue';
import { safeStorage } from '../../../shared/lib/safeStorage';

describe('OfficerDocumentArchiveService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(OfficerDocumentArchiveService, 'getWorkerUrl').mockReturnValue('https://mock-worker.workers.dev');
    vi.spyOn(OfficerDocumentQueue, 'enqueue').mockResolvedValue();
    vi.spyOn(OfficerDocumentQueue, 'getPendingDocuments').mockResolvedValue([]);
    vi.spyOn(OfficerDocumentQueue, 'remove').mockResolvedValue();

    // Mock authenticated officer user
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-officer-uid', email: 'officer@telangana.gov.in' },
          access_token: 'valid-test-jwt-token',
        },
      },
      error: null,
    } as any);
  });

  it('detects duplicate uploads via SHA-256 hash idempotently', async () => {
    const dummyBlob = new Blob(['sample pdf content'], { type: 'application/pdf' });
    const input: DocumentArchiveInput = {
      filename: 'Stop_Sale_Notice.pdf',
      documentCategory: 'order',
      documentNumber: 'SSO-001',
      sourceModule: 'stop_sale',
      fileFormat: 'pdf',
    };

    // Mock Supabase finding an existing record with matching hash
    const duplicateQuery: any = {};
    duplicateQuery.select = vi.fn().mockReturnValue(duplicateQuery);
    duplicateQuery.eq = vi.fn().mockReturnValue(duplicateQuery);
    duplicateQuery.or = vi.fn().mockReturnValue(duplicateQuery);
    duplicateQuery.limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'existing-doc-id-123',
          document_name: 'Stop_Sale_Notice.pdf',
          version_number: 1,
          object_key: 'officers/test-officer-uid/2026/11/existing-doc-id-123.pdf',
        },
      ],
      error: null,
    });

    vi.spyOn(supabase, 'from').mockReturnValue(duplicateQuery);

    const result = await OfficerDocumentArchiveService.archiveGeneratedDocument(dummyBlob, input);

    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(true);
    expect(result.documentId).toBe('existing-doc-id-123');
  });

  it('skips archiving non-PDF documents', async () => {
    const docxBlob = new Blob(['word content'], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const result = await OfficerDocumentArchiveService.archiveGeneratedDocument(docxBlob, {
      filename: 'Show_Cause_Notice.docx',
      documentCategory: 'notice',
      sourceModule: 'show_cause',
      fileFormat: 'docx',
    });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.compressionStatus).toBe('skipped');
    expect(result.documentId).toBe('');
  });

  it('enqueues into offline queue when Cloudflare worker is unreachable without failing caller', async () => {
    const dummyBlob = new Blob(['new unique pdf content'], { type: 'application/pdf' });
    const input: DocumentArchiveInput = {
      filename: 'New_Inspection_Report.pdf',
      documentCategory: 'inspection',
      sourceModule: 'dealer_inspection',
      fileFormat: 'pdf',
    };

    // Mock Supabase select returning no duplicates
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => mockQuery,
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    // Mock fetch failing (network error)
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline or R2 down'));

    const enqueueSpy = vi.spyOn(OfficerDocumentQueue, 'enqueue');

    const result = await OfficerDocumentArchiveService.archiveGeneratedDocument(dummyBlob, input);

    expect(result.success).toBe(true);
    expect(result.queued).toBe(true);
    expect(result.uploadStatus).toBe('pending_retry');
    expect(enqueueSpy).toHaveBeenCalled();
  });

  it('reports genuine storage health connectivity from worker health probe', async () => {
    // 1. Success response
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy', connected: true }),
    } as any);

    const healthyResult = await OfficerDocumentArchiveService.checkR2StorageHealth();
    expect(healthyResult.online).toBe(true);
    expect(healthyResult.message).toContain('Cloud Storage Active');

    // 2. Failure response
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ status: 'unhealthy', connected: false }),
    } as any);

    const unhealthyResult = await OfficerDocumentArchiveService.checkR2StorageHealth();
    expect(unhealthyResult.online).toBe(false);
  });

  it('renames document in Supabase without modifying or moving R2 object', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      update: mockUpdate,
    } as any);

    const success = await OfficerDocumentArchiveService.renameDocument('doc-123', 'Renamed_Official_Notice.pdf');
    expect(success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ document_name: 'Renamed_Official_Notice.pdf' });
  });

  it('calculates storage overview aggregation correctly with compression metrics', async () => {
    vi.spyOn(OfficerDocumentArchiveService, 'fetchOfficerDocuments').mockResolvedValue([
      {
        id: '1',
        user_id: 'u1',
        document_name: 'doc1.pdf',
        document_category: 'order',
        document_date: '2026-11-07',
        source_module: 'stop_sale',
        object_key: 'officers/u1/2026/11/1.pdf',
        file_format: 'pdf',
        mime_type: 'application/pdf',
        original_size: 100000,
        stored_size: 40000,
        original_size_bytes: 100000,
        stored_size_bytes: 40000,
        compression_method: 'gzip',
        compression_status: 'compressed',
        content_hash: 'h1',
        original_sha256: 'orig-h1',
        stored_sha256: 'h1',
        upload_status: 'saved_to_cloud',
        version_number: 1,
        metadata_json: {},
        created_at: '2026-11-07T10:00:00Z',
        updated_at: '2026-11-07T10:00:00Z',
      },
      {
        id: '2',
        user_id: 'u1',
        document_name: 'doc2.docx',
        document_category: 'notice',
        document_date: '2026-11-07',
        source_module: 'show_cause',
        object_key: 'officers/u1/2026/11/2.docx',
        file_format: 'docx',
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        original_size: 50000,
        stored_size: 50000,
        original_size_bytes: 50000,
        stored_size_bytes: 50000,
        compression_method: 'none',
        compression_status: 'uncompressed',
        content_hash: 'h2',
        upload_status: 'pending_retry',
        version_number: 1,
        metadata_json: {},
        created_at: '2026-11-07T10:05:00Z',
        updated_at: '2026-11-07T10:05:00Z',
      },
    ]);

    const stats = await OfficerDocumentArchiveService.getStorageOverview();
    expect(stats.totalDocuments).toBe(2);
    expect(stats.totalOriginalBytes).toBe(150000);
    expect(stats.totalStoredBytes).toBe(90000);
    expect(stats.storageSavedBytes).toBe(60000);
    expect(stats.compressionPercentage).toBe(40.0);
    expect(stats.totalPdfs).toBe(1);
    expect(stats.totalDocx).toBe(1);
    expect(stats.successfullyUploaded).toBe(1);
    expect(stats.pendingUploads).toBe(1);
    expect(stats.failedUploads).toBe(0);
  });

  it('fetches archived documents from safeStorage when user is unauthenticated or offline', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const testDoc = {
      id: 'local-test-doc-1',
      user_id: 'anonymous',
      document_name: 'Local_Stop_Sale.pdf',
      document_category: 'order' as const,
      document_number: 'LSS-1',
      document_date: '2026-11-07',
      source_module: 'stop_sale',
      object_key: 'officers/anonymous/local-test-doc-1/Local_Stop_Sale.pdf',
      file_format: 'pdf' as const,
      mime_type: 'application/pdf',
      original_size: 12000,
      stored_size: 10000,
      compression_status: 'compressed' as const,
      content_hash: 'hash-local-1',
      upload_status: 'pending_retry' as const,
      version_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    safeStorage.setItem(LOCAL_ARCHIVED_DOCS_KEY, JSON.stringify([testDoc]));

    const docs = await OfficerDocumentArchiveService.fetchOfficerDocuments();
    expect(docs.length).toBeGreaterThanOrEqual(1);
    expect(docs.some((d) => d.id === 'local-test-doc-1')).toBe(true);
  });

  it('deletes document from safeStorage', async () => {
    const testDoc = {
      id: 'doc-to-delete',
      user_id: 'anonymous',
      document_name: 'To_Delete.pdf',
      document_category: 'order' as const,
      document_number: 'DEL-1',
      document_date: '2026-11-07',
      source_module: 'stop_sale',
      object_key: 'officers/anonymous/doc-to-delete/To_Delete.pdf',
      file_format: 'pdf' as const,
      mime_type: 'application/pdf',
      original_size: 1000,
      stored_size: 1000,
      compression_status: 'uncompressed' as const,
      content_hash: 'hash-del-1',
      upload_status: 'pending_retry' as const,
      version_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    safeStorage.setItem(LOCAL_ARCHIVED_DOCS_KEY, JSON.stringify([testDoc]));

    await OfficerDocumentArchiveService.deleteDocument('doc-to-delete', 'officers/anonymous/doc-to-delete/To_Delete.pdf');

    const raw = safeStorage.getItem(LOCAL_ARCHIVED_DOCS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    expect(list.some((d: any) => d.id === 'doc-to-delete')).toBe(false);
  });

  it('enforces authentication-based draft rules: guest users do not upload to R2 or Supabase', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const dummyBlob = new Blob(['guest pdf content'], { type: 'application/pdf' });
    const input: DocumentArchiveInput = {
      filename: 'Guest_Draft.pdf',
      documentCategory: 'order',
      documentNumber: 'GUEST-1',
      sourceModule: 'stop_sale',
      fileFormat: 'pdf',
    };

    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
    const insertSpy = vi.fn();
    vi.spyOn(supabase, 'from').mockReturnValue({
      insert: insertSpy,
      select: vi.fn().mockReturnThis(),
    } as any);

    const result = await OfficerDocumentArchiveService.archiveGeneratedDocument(dummyBlob, input);

    expect(result.success).toBe(true);
    expect(result.uploadStatus).toBe('local_only');
    expect(result.queued).toBe(false);
    // Verified: No network call to R2 Worker
    expect(fetchSpy).not.toHaveBeenCalled();
    // Verified: No insert to Supabase cloud metadata table
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('enforces isolation: logged-in officer only loads drafts matching authenticated user.id', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'officer-a-uuid', email: 'officer-a@telangana.gov.in' },
          access_token: 'officer-a-jwt',
        },
      },
      error: null,
    } as any);

    // Mock safeStorage containing drafts from Officer A, Officer B, and Guest
    const officerADoc = {
      id: 'doc-officer-a',
      user_id: 'officer-a-uuid',
      document_name: 'Officer_A_Order.pdf',
      document_category: 'order' as const,
      document_date: '2026-11-07',
      source_module: 'stop_sale',
      object_key: 'officers/officer-a-uuid/doc-officer-a.pdf',
      file_format: 'pdf' as const,
      mime_type: 'application/pdf',
      original_size: 5000,
      stored_size: 4000,
      compression_status: 'compressed' as const,
      content_hash: 'hash-a',
      upload_status: 'saved_to_cloud' as const,
      version_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const officerBDoc = {
      id: 'doc-officer-b',
      user_id: 'officer-b-uuid',
      document_name: 'Officer_B_Order.pdf',
      document_category: 'order' as const,
      document_date: '2026-11-07',
      source_module: 'stop_sale',
      object_key: 'officers/officer-b-uuid/doc-officer-b.pdf',
      file_format: 'pdf' as const,
      mime_type: 'application/pdf',
      original_size: 5000,
      stored_size: 4000,
      compression_status: 'compressed' as const,
      content_hash: 'hash-b',
      upload_status: 'saved_to_cloud' as const,
      version_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const guestDoc = {
      id: 'doc-guest',
      user_id: 'guest',
      document_name: 'Guest_Order.pdf',
      document_category: 'order' as const,
      document_date: '2026-11-07',
      source_module: 'stop_sale',
      object_key: 'local/doc-guest.pdf',
      file_format: 'pdf' as const,
      mime_type: 'application/pdf',
      original_size: 3000,
      stored_size: 3000,
      compression_status: 'uncompressed' as const,
      content_hash: 'hash-g',
      upload_status: 'local_only' as const,
      version_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    safeStorage.setItem(LOCAL_ARCHIVED_DOCS_KEY, JSON.stringify([officerADoc, officerBDoc, guestDoc]));

    // Supabase returns Officer A records
    const supabaseEqMock = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [officerADoc], error: null }),
    });
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: supabaseEqMock,
      }),
    } as any);

    const docs = await OfficerDocumentArchiveService.fetchOfficerDocuments();

    // Supabase query was scoped strictly to officer-a-uuid
    expect(supabaseEqMock).toHaveBeenCalledWith('user_id', 'officer-a-uuid');

    // Returned list only contains Officer A documents
    expect(docs.some((d) => d.id === 'doc-officer-a')).toBe(true);
    // Never exposes Officer B or Guest drafts
    expect(docs.some((d) => d.id === 'doc-officer-b')).toBe(false);
    expect(docs.some((d) => d.id === 'doc-guest')).toBe(false);
  });
});
