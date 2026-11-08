import type {
  CompressionMethod,
  CompressionStatus,
  DocumentCategory,
  FileFormat,
  UploadStatus,
} from '../types/officerArchiveTypes';

export interface QueuedDocument {
  id: string;
  userId: string;
  documentName: string;
  originalFilename?: string;
  documentCategory: DocumentCategory;
  documentNumber?: string;
  documentDate: string;
  sourceModule: string;
  fileFormat: FileFormat;
  mimeType: string;
  originalSize: number;
  storedSize: number;
  originalSizeBytes?: number;
  storedSizeBytes?: number;
  compressionMethod?: CompressionMethod;
  compressionStatus: CompressionStatus;
  contentHash: string;
  originalSha256?: string;
  storedSha256?: string;
  restorationVerified?: boolean;
  objectKey?: string;
  uploadStatus: UploadStatus;
  versionNumber: number;
  parentDocumentId?: string | null;
  metadata: Record<string, unknown>;
  fileBlob: Blob;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'agronix_officer_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'document_upload_queue';

/**
 * Manages persistent offline upload queue using IndexedDB.
 * Guarantees that documents generated in field conditions are never lost
 * even when network or Cloudflare services are unavailable.
 */
export class OfficerDocumentQueue {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not available in this environment'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('uploadStatus', 'uploadStatus', { unique: false });
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  /**
   * Save a document to persistent offline queue
   */
  static async enqueue(doc: QueuedDocument): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put({
          ...doc,
          updatedAt: new Date().toISOString(),
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to enqueue document into IndexedDB:', err);
    }
  }

  /**
   * Get all queued documents (pending, failed, or already cloud-synced local
   * copies retained for offline access), optionally filtered by userId.
   * 'anonymous'/'guest' filter matches both guest identities.
   */
  static async getPendingDocuments(userId?: string): Promise<QueuedDocument[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          let docs = (req.result || []) as QueuedDocument[];
          if (userId) {
            if (userId === 'anonymous' || userId === 'guest') {
              docs = docs.filter((d) => d.userId === 'anonymous' || d.userId === 'guest');
            } else {
              docs = docs.filter((d) => d.userId === userId);
            }
          }
          resolve(docs);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Update status of a queued document (e.g. after retry attempt)
   */
  static async updateStatus(id: string, uploadStatus: UploadStatus, lastError?: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(id);

        getReq.onsuccess = () => {
          const doc = getReq.result as QueuedDocument | undefined;
          if (doc) {
            doc.uploadStatus = uploadStatus;
            doc.retryCount = (doc.retryCount || 0) + 1;
            if (lastError !== undefined) doc.lastError = lastError;
            doc.updatedAt = new Date().toISOString();
            store.put(doc);
          }
          resolve();
        };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch (err) {
      console.warn('Failed to update queued document status:', err);
    }
  }

  /**
   * Remove a document from queue after successful cloud archive
   */
  static async remove(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to remove document from queue:', err);
    }
  }

  /**
   * Remove all queued documents matching a content hash.
   * Used when deleting an archived document whose queue entry has a
   * different id than the Supabase archive row id.
   */
  static async removeByHash(sha256: string): Promise<void> {
    if (!sha256) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const docs = (req.result || []) as QueuedDocument[];
          docs.forEach((doc) => {
            if (doc.originalSha256 === sha256 || doc.contentHash === sha256 || doc.storedSha256 === sha256) {
              store.delete(doc.id);
            }
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to remove documents by hash from queue:', err);
    }
  }

  /**
   * Clear all documents from queue
   */
  static async clearQueue(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
  }
}
