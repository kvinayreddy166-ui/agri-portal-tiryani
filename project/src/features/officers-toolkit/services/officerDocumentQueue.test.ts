import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfficerDocumentQueue, type QueuedDocument } from './officerDocumentQueue';

describe('OfficerDocumentQueue (IndexedDB Persistence)', () => {
  let inMemoryStore: Map<string, any>;

  beforeEach(() => {
    inMemoryStore = new Map();

    const mockStore = {
      put: (item: any) => {
        inMemoryStore.set(item.id, item);
        const req: any = { onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      },
      get: (id: string) => {
        const req: any = { result: inMemoryStore.get(id), onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      },
      getAll: () => {
        const req: any = { result: Array.from(inMemoryStore.values()), onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      },
      delete: (id: string) => {
        inMemoryStore.delete(id);
        const req: any = { onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      },
      clear: () => {
        inMemoryStore.clear();
        const req: any = { onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      },
      createIndex: vi.fn(),
    };

    const mockDb: any = {
      objectStoreNames: { contains: () => true },
      transaction: () => ({
        objectStore: () => mockStore,
      }),
    };

    (globalThis as any).indexedDB = {
      open: () => {
        const req: any = { result: mockDb, onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess?.({ target: req }), 0);
        return req;
      },
    };

    // Reset static promise
    (OfficerDocumentQueue as any).dbPromise = null;
  });

  it('enqueues a document and persists it in offline storage', async () => {
    const doc: QueuedDocument = {
      id: 'doc-offline-1',
      userId: 'officer-123',
      documentName: 'Stop_Sale_Fertilizer.pdf',
      documentCategory: 'order',
      documentDate: '2026-11-07',
      sourceModule: 'stop_sale',
      fileFormat: 'pdf',
      mimeType: 'application/pdf',
      originalSize: 45000,
      storedSize: 38000,
      compressionStatus: 'compressed',
      contentHash: 'hash-abc',
      uploadStatus: 'pending_retry',
      versionNumber: 1,
      metadata: { firm: 'Balaji Seeds' },
      fileBlob: new Blob(['dummy pdf data'], { type: 'application/pdf' }),
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await OfficerDocumentQueue.enqueue(doc);

    const pending = await OfficerDocumentQueue.getPendingDocuments('officer-123');
    expect(pending.length).toBe(1);
    expect(pending[0].documentName).toBe('Stop_Sale_Fertilizer.pdf');
    expect(pending[0].uploadStatus).toBe('pending_retry');
  });

  it('updates document status and retry count on retry attempts', async () => {
    const doc: QueuedDocument = {
      id: 'doc-offline-2',
      userId: 'officer-123',
      documentName: 'Seizure_Notice.pdf',
      documentCategory: 'notice',
      documentDate: '2026-11-07',
      sourceModule: 'seizure',
      fileFormat: 'pdf',
      mimeType: 'application/pdf',
      originalSize: 20000,
      storedSize: 20000,
      compressionStatus: 'skipped',
      contentHash: 'hash-xyz',
      uploadStatus: 'pending_retry',
      versionNumber: 1,
      metadata: {},
      fileBlob: new Blob(['test'], { type: 'application/pdf' }),
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await OfficerDocumentQueue.enqueue(doc);
    await OfficerDocumentQueue.updateStatus('doc-offline-2', 'upload_failed', 'R2 timeout');

    const pending = await OfficerDocumentQueue.getPendingDocuments('officer-123');
    expect(pending[0].uploadStatus).toBe('upload_failed');
    expect(pending[0].retryCount).toBe(1);
    expect(pending[0].lastError).toBe('R2 timeout');
  });

  it('removes document from queue once successfully uploaded', async () => {
    const doc: QueuedDocument = {
      id: 'doc-offline-3',
      userId: 'officer-123',
      documentName: 'Sample_Memo.pdf',
      documentCategory: 'sample',
      documentDate: '2026-11-07',
      sourceModule: 'sample_memo',
      fileFormat: 'pdf',
      mimeType: 'application/pdf',
      originalSize: 10000,
      storedSize: 10000,
      compressionStatus: 'uncompressed',
      contentHash: 'hash-123',
      uploadStatus: 'pending_retry',
      versionNumber: 1,
      metadata: {},
      fileBlob: new Blob(['sample'], { type: 'application/pdf' }),
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await OfficerDocumentQueue.enqueue(doc);
    expect((await OfficerDocumentQueue.getPendingDocuments()).length).toBe(1);

    await OfficerDocumentQueue.remove('doc-offline-3');
    expect((await OfficerDocumentQueue.getPendingDocuments()).length).toBe(0);
  });
});
