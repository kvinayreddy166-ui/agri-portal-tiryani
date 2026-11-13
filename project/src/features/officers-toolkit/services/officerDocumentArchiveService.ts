import { supabase, isAdmin } from '../../../shared/lib/supabase';
import { compressForArchive, restoreArchivedDocument } from './documentCompressionService';
import { OfficerDocumentQueue, type QueuedDocument } from './officerDocumentQueue';
import { safeStorage } from '../../../shared/lib/safeStorage';
import type {
  CompressionMethod,
  CompressionStatus,
  DocumentCategory,
  FileFormat,
  OfficerDocumentArchiveRecord,
  StorageOverviewStats,
  UploadStatus,
} from '../types/officerArchiveTypes';

export const LOCAL_ARCHIVED_DOCS_KEY = 'agronix_officer_archived_documents';

/**
 * Normalizes file extensions/formats to valid statutory archive formats
 */
export function normalizeFileFormat(format: string | undefined, filename: string): FileFormat {
  const ext = (filename.split('.').pop() || format || '').toLowerCase();
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'xlsx';
  if (ext === 'txt') return 'txt';
  return 'pdf';
}

export interface DocumentArchiveInput {
  filename: string;
  documentCategory: DocumentCategory;
  documentNumber?: string;
  documentDate?: string;
  sourceModule: string;
  fileFormat: FileFormat;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface ArchiveResult {
  success: boolean;
  documentId: string;
  uploadStatus: UploadStatus;
  objectKey?: string;
  originalSize: number;
  storedSize: number;
  compressionMethod?: CompressionMethod;
  compressionStatus: CompressionStatus;
  contentHash: string;
  originalSha256?: string;
  storedSha256?: string;
  versionNumber: number;
  duplicate?: boolean;
  queued?: boolean;
  skipped?: boolean;
  error?: string;
}

interface OfficerDocumentArchiveTable {
  insert: (row: unknown) => PromiseLike<{ error: { message?: string } | null }>;
  upsert?: (row: unknown, options?: { onConflict?: string }) => PromiseLike<{ error: { message?: string } | null }>;
}

export class OfficerDocumentArchiveService {
  /**
   * Resolves the Cloudflare Worker URL
   */
  static getWorkerUrl(): string {
    const envUrl = typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_STORAGE_WORKER_URL
      : '';
    return envUrl ? String(envUrl).replace(/\/+$/, '') : '';
  }

  /**
   * Helper to get current authenticated user with auto-refreshed session token
   */
  private static async getCurrentUser(): Promise<{ id: string; email: string; token: string } | null> {
    try {
      const { data } = await supabase.auth.getSession();
      let session = data?.session;
      if (!session?.user) return null;

      // Proactively refresh JWT token if missing, expired, or expiring in less than 2 minutes
      const now = Math.floor(Date.now() / 1000);
      if (!session.access_token || (session.expires_at && session.expires_at - now < 120)) {
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData?.session) {
            session = refreshData.session;
          }
        } catch {
          // If refresh fails, proceed with current session token
        }
      }

      return {
        id: session.user.id,
        email: session.user.email || '',
        token: session.access_token,
      };
    } catch {
      return null;
    }
  }

  /**
   * Checks Cloudflare R2 storage connectivity
   */
  static async checkR2StorageHealth(): Promise<{ online: boolean; message: string }> {
    const workerUrl = this.getWorkerUrl();
    if (!workerUrl) {
      return { online: false, message: 'Cloudflare Storage Worker URL not configured' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${workerUrl}/health`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const body = (await res.json()) as { status?: string; connected?: boolean };
        if (body.connected || body.status === 'healthy') {
          return { online: true, message: 'Cloud Storage Active' };
        }
      }
      return { online: false, message: 'Cloud Storage Unavailable' };
    } catch {
      return { online: false, message: 'Storage connection timeout or network offline' };
    }
  }

  /**
   * Archives a generated document with intelligent reversible compression,
   * exact SHA-256 deduplication, version tracking, and offline queue fallback.
   */
  static async archiveGeneratedDocument(
    fileBlob: Blob,
    input: DocumentArchiveInput
  ): Promise<ArchiveResult> {
    const fileFormat = normalizeFileFormat(input.fileFormat, input.filename);

    // PDF is the only archived format. DOCX/XLSX/TXT exports are alternate
    // renderings of the same issued record — archiving them creates duplicate
    // files in Records, so they are skipped here.
    if (fileFormat !== 'pdf') {
      return {
        success: true,
        documentId: '',
        uploadStatus: 'local_only',
        originalSize: fileBlob.size,
        storedSize: fileBlob.size,
        compressionStatus: 'skipped',
        contentHash: '',
        versionNumber: 0,
        skipped: true,
      };
    }

    const user = await this.getCurrentUser();
    const userId = user?.id || 'anonymous';
    const documentId = crypto.randomUUID();
    const documentDate = input.documentDate || new Date().toISOString().slice(0, 10);
    const mimeType = input.mimeType || fileBlob.type || 'application/pdf';
    const originalSize = fileBlob.size;

    // 1. Process File Bytes & Intelligent Reversible Compression
    const rawBuffer = await fileBlob.arrayBuffer();
    const rawBytes = new Uint8Array(rawBuffer);

    const comp = await compressForArchive(rawBytes, mimeType, input.filename);
    const bytesToStore = comp.storedBytes;
    const storedSize = comp.storedSize;
    const compressionMethod = comp.compressionMethod;
    const compressionStatus = comp.compressionStatus;
    const originalSha256 = comp.originalSha256;
    const storedSha256 = comp.storedSha256;
    const contentHash = storedSha256;

    // Build secure opaque R2 object key: officers/{user_id}/{year}/{month}/{document_id}.{extension}
    const dateObj = new Date(documentDate);
    const year = !isNaN(dateObj.getFullYear()) ? String(dateObj.getFullYear()) : new Date().getFullYear().toString();
    const month = !isNaN(dateObj.getMonth()) ? String(dateObj.getMonth() + 1).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
    const ext = fileFormat;
    const objectKey = `officers/${userId}/${year}/${month}/${documentId}.${ext}`;

    // 2. Check for Duplicate Upload via Original SHA-256 Content Hash
    let versionNumber = 1;
    let parentDocId: string | null = null;

    if (user) {
      try {
        const { data: existingSameHash } = await supabase
          .from('officer_document_archive')
          .select('id, document_name, version_number, object_key')
          .eq('user_id', user.id)
          .or(`content_hash.eq.${originalSha256},content_hash.eq.${storedSha256},original_sha256.eq.${originalSha256}`)
          .limit(1);

        if (existingSameHash && existingSameHash.length > 0) {
          // Exact duplicate found! Safe idempotency: do not re-upload
          const existing = existingSameHash[0];
          return {
            success: true,
            documentId: existing.id,
            uploadStatus: 'saved_to_cloud',
            objectKey: existing.object_key,
            originalSize,
            storedSize,
            compressionMethod,
            compressionStatus,
            contentHash,
            originalSha256,
            storedSha256,
            versionNumber: existing.version_number,
            duplicate: true,
          };
        }

        // 3. Version Tracking: Check if document with same number or name already exists
        if (input.documentNumber || input.filename) {
          let builder = supabase
            .from('officer_document_archive')
            .select('id, version_number')
            .eq('user_id', user.id);

          if (input.documentNumber) {
            builder = builder.eq('document_number', input.documentNumber);
          } else {
            builder = builder.eq('document_name', input.filename);
          }

          const { data: priorVersions } = await builder
            .order('version_number', { ascending: false })
            .limit(1);

          if (priorVersions && priorVersions.length > 0) {
            const prior = priorVersions[0];
            versionNumber = (prior.version_number || 1) + 1;
            parentDocId = prior.id;
          }
        }
      } catch (err) {
        console.warn('Database check error during archive:', err);
      }
    } else {
      // Local duplicate check via safeStorage
      try {
        const raw = safeStorage.getItem(LOCAL_ARCHIVED_DOCS_KEY);
        if (raw) {
          const localList: OfficerDocumentArchiveRecord[] = JSON.parse(raw);
          const existing = localList.find(
            (item) => item.content_hash === originalSha256 || item.original_sha256 === originalSha256
          );
          if (existing) {
            return {
              success: true,
              documentId: existing.id,
              uploadStatus: existing.upload_status,
              objectKey: existing.object_key,
              originalSize,
              storedSize,
              compressionMethod,
              compressionStatus,
              contentHash,
              originalSha256,
              storedSha256,
              versionNumber: existing.version_number,
              duplicate: true,
            };
          }
        }
      } catch {
        // ignore
      }
    }

    // 4. Cloud upload is intentionally NOT performed here.
    // Generated documents are stored locally (IndexedDB queue + safeStorage +
    // Supabase metadata row) and uploaded to R2/cloud only when the officer
    // explicitly taps "Upload to Cloud" in Records (uploadDocumentToCloud) or
    // "Retry Uploads" (retryFailedUploads).
    const uploadedToCloud = false;
    const uploadError: string | undefined = 'Stored locally — upload manually from Records';

    // 5. Build Canonical Document Record (Authentication-Based Rule: R2 cloud upload only for logged-in users)
    let uploadStatus: UploadStatus;
    if (user) {
      uploadStatus = uploadedToCloud ? 'saved_to_cloud' : 'pending_retry';
    } else {
      uploadStatus = 'local_only';
    }

    const canonicalRecord: OfficerDocumentArchiveRecord = {
      id: documentId,
      user_id: userId,
      document_name: input.filename,
      original_filename: input.filename,
      document_category: input.documentCategory,
      document_number: input.documentNumber || null,
      document_date: documentDate,
      source_module: input.sourceModule,
      object_key: user ? objectKey : `local/${documentId}/${input.filename}`,
      file_format: fileFormat,
      mime_type: mimeType,
      original_size: originalSize,
      stored_size: storedSize,
      original_size_bytes: originalSize,
      stored_size_bytes: storedSize,
      compression_method: compressionMethod,
      compression_status: compressionStatus,
      content_hash: contentHash,
      original_sha256: originalSha256,
      stored_sha256: storedSha256,
      restoration_verified: true,
      upload_status: uploadStatus,
      version_number: versionNumber,
      parent_document_id: parentDocId,
      metadata_json: input.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Layer 1: Instant local safeStorage persistence (guarantees immediate visibility in UI in all logins)
    try {
      const raw = safeStorage.getItem(LOCAL_ARCHIVED_DOCS_KEY);
      const existing: OfficerDocumentArchiveRecord[] = raw ? JSON.parse(raw) : [];
      const updated = [canonicalRecord, ...existing.filter((item) => item.id !== documentId && item.content_hash !== contentHash)];
      safeStorage.setItem(LOCAL_ARCHIVED_DOCS_KEY, JSON.stringify(updated.slice(0, 150)));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('agronix:officer_document_archived', { detail: canonicalRecord }));
      }
    } catch (err) {
      console.warn('Failed to save archived document to safeStorage:', err);
    }

    // Layer 2: Persistent IndexedDB Queue (holds actual binary blob for offline download/preview)
    try {
      const queuedDoc: QueuedDocument = {
        id: documentId,
        userId,
        documentName: input.filename,
        originalFilename: input.filename,
        documentCategory: input.documentCategory,
        documentNumber: input.documentNumber,
        documentDate,
        sourceModule: input.sourceModule,
        fileFormat: fileFormat,
        mimeType,
        originalSize,
        storedSize,
        originalSizeBytes: originalSize,
        storedSizeBytes: storedSize,
        compressionMethod,
        compressionStatus,
        contentHash,
        originalSha256,
        storedSha256,
        restorationVerified: true,
        objectKey,
        uploadStatus,
        versionNumber,
        parentDocumentId: parentDocId,
        metadata: input.metadata || {},
        fileBlob: new Blob([bytesToStore as unknown as BlobPart], {
          type: compressionMethod === 'gzip' ? 'application/gzip' : mimeType,
        }),
        retryCount: 0,
        lastError: uploadError,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await OfficerDocumentQueue.enqueue(queuedDoc);
    } catch (err) {
      console.warn('Failed to enqueue document into IndexedDB:', err);
    }

    // Layer 3: Cloud Database Metadata (Supabase) if authenticated
    if (user) {
      try {
        const row = {
          id: documentId,
          user_id: user.id,
          document_name: input.filename,
          original_filename: input.filename,
          document_category: input.documentCategory,
          document_number: input.documentNumber || null,
          document_date: documentDate,
          source_module: input.sourceModule,
          object_key: objectKey,
          file_format: fileFormat,
          mime_type: mimeType,
          original_size: originalSize,
          stored_size: storedSize,
          original_size_bytes: originalSize,
          stored_size_bytes: storedSize,
          compression_method: compressionMethod,
          compression_status: compressionStatus,
          content_hash: contentHash,
          original_sha256: originalSha256,
          stored_sha256: storedSha256,
          restoration_verified: true,
          upload_status: uploadStatus,
          version_number: versionNumber,
          parent_document_id: parentDocId,
          metadata_json: input.metadata || {},
        };

        const table = supabase.from('officer_document_archive') as unknown as OfficerDocumentArchiveTable;
        const { error: dbError } = typeof table.upsert === 'function'
          ? await table.upsert(row, { onConflict: 'id' })
          : await table.insert(row);

        if (dbError) {
          console.warn('Failed to upsert metadata into Supabase:', dbError.message);
        }
      } catch (err) {
        console.warn('Error recording document metadata:', err);
      }
    }

    return {
      success: true,
      documentId,
      uploadStatus,
      objectKey,
      originalSize,
      storedSize,
      compressionMethod,
      compressionStatus,
      contentHash,
      originalSha256,
      storedSha256,
      versionNumber,
      queued: Boolean(user && !uploadedToCloud),
      error: uploadError,
    };
  }

  /**
   * Fetches archived documents based on authentication state:
   * - Logged-in users: loads that specific user's Cloudflare R2 cloud drafts from Supabase and their pending queue.
   * - Guest users: loads only local drafts from IndexedDB / safeStorage (no R2 / Supabase cloud calls).
   * Strictly never exposes another user's drafts or historical local drafts to a cloud user.
   */
  static async fetchOfficerDocuments(): Promise<OfficerDocumentArchiveRecord[]> {
    const records: OfficerDocumentArchiveRecord[] = [];
    const user = await this.getCurrentUser();
    const isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;

    if (user) {
      const viewerIsAdmin = isAdmin(user.email);

      // 1. Logged-in: Fetch Cloud Records from Supabase.
      // Portal admin sees every officer's cloud-saved documents (RLS allows
      // it) — local/pending uploads are excluded so only files actually
      // stored in cloud storage are listed. Regular officers only ever see
      // their own.
      if (isOnline) {
        try {
          let query = supabase
            .from('officer_document_archive')
            .select('*');
          if (viewerIsAdmin) {
            query = query.eq('upload_status', 'saved_to_cloud');
          } else {
            query = query.eq('user_id', user.id);
          }
          const { data, error } = await query.order('created_at', { ascending: false });

          if (!error && data) {
            data.forEach((row: OfficerDocumentArchiveRecord) => {
              records.push(row);
            });
          }
        } catch (err) {
          console.warn('Failed to fetch archived documents from Supabase:', err);
        }
      }

      const existingIds = new Set(records.map((r) => r.id));
      const existingHashes = new Set(
        records.filter((r) => Boolean(r.content_hash || r.original_sha256)).map((r) => r.original_sha256 || r.content_hash)
      );

      // 2. Fetch pending/failed uploads for THIS authenticated user from IndexedDB queue.
      //    Skipped for admin — the admin view lists only cloud-saved uploads.
      if (!viewerIsAdmin) try {
        const queued = await OfficerDocumentQueue.getPendingDocuments(user.id);

        queued.forEach((q) => {
          // Include this officer's docs plus anonymous/guest leftovers created
          // on this device before sign-in so they can be claimed & uploaded.
          if (q.userId === user.id || q.userId === 'anonymous' || q.userId === 'guest') {
            const hash = q.originalSha256 || q.contentHash;
            if (!existingIds.has(q.id) && (!hash || !existingHashes.has(hash))) {
              records.push({
                id: q.id,
                user_id: q.userId,
                document_name: q.documentName,
                original_filename: q.originalFilename || q.documentName,
                document_category: q.documentCategory,
                document_number: q.documentNumber || null,
                document_date: q.documentDate,
                source_module: q.sourceModule,
                object_key: q.objectKey || `officers/${q.userId}/${q.id}/${q.documentName}`,
                file_format: q.fileFormat,
                mime_type: q.mimeType,
                original_size: q.originalSize,
                stored_size: q.storedSize,
                original_size_bytes: q.originalSizeBytes || q.originalSize,
                stored_size_bytes: q.storedSizeBytes || q.storedSize,
                compression_method: q.compressionMethod || 'none',
                compression_status: q.compressionStatus,
                content_hash: q.contentHash,
                original_sha256: q.originalSha256 || q.contentHash,
                stored_sha256: q.storedSha256 || q.contentHash,
                restoration_verified: q.restorationVerified ?? true,
                upload_status: q.uploadStatus,
                version_number: q.versionNumber,
                parent_document_id: q.parentDocumentId || null,
                metadata_json: q.metadata,
                created_at: q.createdAt,
                updated_at: q.updatedAt,
              });
              existingIds.add(q.id);
            }
          }
        });
      } catch {
        // ignore
      }

      // 3. Fallback safeStorage for current session: strictly match user.id.
      //    Skipped for admin — local-only drafts are not cloud uploads.
      if (!viewerIsAdmin) try {
        const raw = safeStorage.getItem(LOCAL_ARCHIVED_DOCS_KEY);
        if (raw) {
          const localList: OfficerDocumentArchiveRecord[] = JSON.parse(raw);
          localList.forEach((item) => {
            if (item.user_id === user.id) {
              const hash = item.original_sha256 || item.content_hash;
              if (!existingIds.has(item.id) && (!hash || !existingHashes.has(hash))) {
                records.push(item);
                existingIds.add(item.id);
              }
            }
          });
        }
      } catch {
        // ignore
      }

      return records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // Guest User: Local storage only (Rule 2: "Continue using the existing local IndexedDB storage")
      const existingIds = new Set<string>();

      try {
        const queued = await OfficerDocumentQueue.getPendingDocuments('guest');

        queued.forEach((q) => {
          if (!existingIds.has(q.id)) {
            records.push({
              id: q.id,
              user_id: q.userId,
              document_name: q.documentName,
              original_filename: q.originalFilename || q.documentName,
              document_category: q.documentCategory,
              document_number: q.documentNumber || null,
              document_date: q.documentDate,
              source_module: q.sourceModule,
              object_key: q.objectKey || `local/${q.id}/${q.documentName}`,
              file_format: q.fileFormat,
              mime_type: q.mimeType,
              original_size: q.originalSize,
              stored_size: q.storedSize,
              original_size_bytes: q.originalSizeBytes || q.originalSize,
              stored_size_bytes: q.storedSizeBytes || q.storedSize,
              compression_method: q.compressionMethod || 'none',
              compression_status: q.compressionStatus,
              content_hash: q.contentHash,
              original_sha256: q.originalSha256 || q.contentHash,
              stored_sha256: q.storedSha256 || q.contentHash,
              restoration_verified: q.restorationVerified ?? true,
              upload_status: 'local_only',
              version_number: q.versionNumber,
              parent_document_id: q.parentDocumentId || null,
              metadata_json: q.metadata,
              created_at: q.createdAt,
              updated_at: q.updatedAt,
            });
            existingIds.add(q.id);
          }
        });
      } catch {
        // ignore
      }

      try {
        const raw = safeStorage.getItem(LOCAL_ARCHIVED_DOCS_KEY);
        if (raw) {
          const localList: OfficerDocumentArchiveRecord[] = JSON.parse(raw);
          localList.forEach((item) => {
            if (item.user_id === 'guest' || item.user_id === 'anonymous') {
              if (!existingIds.has(item.id)) {
                records.push({ ...item, upload_status: 'local_only' });
                existingIds.add(item.id);
              }
            }
          });
        }
      } catch {
        // ignore
      }

      return records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  /**
   * Clears user-specific cloud data from in-memory application caches on logout.
   * Crucial: NEVER deletes cloud drafts from R2 or Supabase during logout!
   */
  static clearUserSessionCache(): void {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('agronix:officer_user_logout'));
      } catch {
        // ignore
      }
    }
  }

  /**
   * Downloads an archived document in its exact original-quality binary format.
   * Restores compressed streams, verifies original SHA-256 fingerprint, and preserves layout.
   */
  static async downloadDocument(doc: OfficerDocumentArchiveRecord): Promise<void> {
    const downloadFilename = doc.original_filename || doc.document_name;

    // 1. Check local IndexedDB queue first
    try {
      const queued = await OfficerDocumentQueue.getPendingDocuments();
      const local = queued.find((q) => q.id === doc.id || (doc.content_hash && q.contentHash === doc.content_hash));
      if (local && local.fileBlob) {
        const rawBuffer = await local.fileBlob.arrayBuffer();
        const { restoredBytes } = await restoreArchivedDocument(
          new Uint8Array(rawBuffer),
          local.compressionMethod || doc.compression_method || 'none',
          doc.original_sha256 || local.originalSha256
        );

        const restoredBlob = new Blob([restoredBytes as unknown as BlobPart], {
          type: doc.mime_type || 'application/pdf',
        });
        const url = URL.createObjectURL(restoredBlob);
        triggerBrowserDownload(url, downloadFilename);
        return;
      }
    } catch (err) {
      console.warn('Could not read from local queue for download:', err);
    }

    // 2. Fetch raw stored bytes from Cloudflare Worker or Supabase Storage Fallback.
    //    raw=true returns the exact stored (possibly gzip) bytes so the client-side
    //    restoration below stays consistent for both storage backends.
    const user = await this.getCurrentUser();
    const workerUrl = this.getWorkerUrl();
    const storedBlob = await this.fetchStoredBlob(doc, user, workerUrl, '/api/documents/download');

    if (!storedBlob) {
      const errors = [];
      if (!workerUrl) errors.push('Cloudflare Worker not configured');
      if (workerUrl && !user) errors.push('Not authenticated');
      if (doc.object_key) errors.push(`Object key: ${doc.object_key}`);
      errors.push('Both worker and Supabase storage failed');
      throw new Error(`Download failed: ${errors.join('; ')}`);
    }

    // 4. Persist the file into IndexedDB first so it remains available offline
    //    and can be uploaded to the cloud later if needed.
    await this.persistDownloadedCopy(doc, storedBlob, user?.id || doc.user_id);

    // 5. Restore compressed stream if stored in compressed form, then download
    const rawBuffer = await storedBlob.arrayBuffer();
    const { restoredBytes } = await restoreArchivedDocument(
      new Uint8Array(rawBuffer),
      doc.compression_method || 'none',
      doc.original_sha256
    );

    const restoredBlob = new Blob([restoredBytes as unknown as BlobPart], {
      type: doc.mime_type || 'application/pdf',
    });
    const url = URL.createObjectURL(restoredBlob);
    triggerBrowserDownload(url, downloadFilename);
  }

  /**
   * Stores a cloud-downloaded file into the persistent IndexedDB queue so the
   * officer keeps a local copy for offline access and future cloud upload.
   * Skips persistence if a copy already exists in the queue.
   */
  private static async persistDownloadedCopy(
    doc: OfficerDocumentArchiveRecord,
    storedBlob: Blob,
    userId: string
  ): Promise<void> {
    try {
      const queued = await OfficerDocumentQueue.getPendingDocuments();
      const exists = queued.some(
        (q) => q.id === doc.id || (doc.content_hash && q.contentHash === doc.content_hash)
      );
      if (exists) return;

      const now = new Date().toISOString();
      const originalSize = Number(doc.original_size_bytes ?? doc.original_size) || storedBlob.size;
      const storedSize = Number(doc.stored_size_bytes ?? doc.stored_size) || storedBlob.size;

      await OfficerDocumentQueue.enqueue({
        id: doc.id,
        userId: userId || doc.user_id || 'anonymous',
        documentName: doc.document_name,
        originalFilename: doc.original_filename || doc.document_name,
        documentCategory: doc.document_category,
        documentNumber: doc.document_number || undefined,
        documentDate: doc.document_date,
        sourceModule: doc.source_module,
        fileFormat: doc.file_format,
        mimeType: doc.mime_type,
        originalSize,
        storedSize,
        originalSizeBytes: originalSize,
        storedSizeBytes: storedSize,
        compressionMethod: doc.compression_method || 'none',
        compressionStatus: doc.compression_status,
        contentHash: doc.content_hash,
        originalSha256: doc.original_sha256,
        storedSha256: doc.stored_sha256 || doc.content_hash,
        restorationVerified: doc.restoration_verified ?? true,
        objectKey: doc.object_key,
        uploadStatus: doc.upload_status === 'saved_to_cloud' ? 'saved_to_cloud' : doc.upload_status || 'pending_retry',
        versionNumber: doc.version_number,
        parentDocumentId: doc.parent_document_id || null,
        metadata: doc.metadata_json || {},
        fileBlob: storedBlob,
        retryCount: 0,
        createdAt: doc.created_at || now,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('Failed to persist downloaded copy into IndexedDB:', err);
    }
  }

  /**
   * Previews an archived document (inline blob URL) in its restored original quality.
   */
  static async previewDocument(doc: OfficerDocumentArchiveRecord): Promise<string> {
    // 1. Check local IndexedDB queue first
    try {
      const queued = await OfficerDocumentQueue.getPendingDocuments();
      const local = queued.find((q) => q.id === doc.id || (doc.content_hash && q.contentHash === doc.content_hash));
      if (local && local.fileBlob) {
        const rawBuffer = await local.fileBlob.arrayBuffer();
        const { restoredBytes } = await restoreArchivedDocument(
          new Uint8Array(rawBuffer),
          local.compressionMethod || doc.compression_method || 'none',
          doc.original_sha256 || local.originalSha256
        );

        const restoredBlob = new Blob([restoredBytes as unknown as BlobPart], {
          type: doc.mime_type || 'application/pdf',
        });
        return URL.createObjectURL(restoredBlob);
      }
    } catch (err) {
      console.warn('Could not read from local queue for preview:', err);
    }

    // 2. Fetch raw stored bytes from Cloudflare Worker (raw=true keeps stored
    //    bytes so client-side restoration stays consistent)
    const user = await this.getCurrentUser();
    const workerUrl = this.getWorkerUrl();
    const storedBlob = await this.fetchStoredBlob(doc, user, workerUrl, '/api/documents/preview');

    if (!storedBlob) {
      const errors = [];
      if (!workerUrl) errors.push('Cloudflare Worker not configured');
      if (workerUrl && !user) errors.push('Not authenticated');
      if (doc.object_key) errors.push(`Object key: ${doc.object_key}`);
      errors.push('Both worker and Supabase storage failed');
      throw new Error(`Preview failed: ${errors.join('; ')}`);
    }

    // Keep a local IndexedDB copy so the file survives offline
    await this.persistDownloadedCopy(doc, storedBlob, user?.id || doc.user_id);

    // Restore compressed stream if stored in compressed form
    const rawBuffer = await storedBlob.arrayBuffer();
    const { restoredBytes } = await restoreArchivedDocument(
      new Uint8Array(rawBuffer),
      doc.compression_method || 'none',
      doc.original_sha256
    );

    return URL.createObjectURL(new Blob([restoredBytes as unknown as BlobPart], {
      type: doc.mime_type || 'application/pdf',
    }));
  }

  /**
   * Renames a document metadata across safeStorage, IndexedDB queue, and Supabase.
   */
  static async renameDocument(id: string, newDocumentName: string): Promise<boolean> {
    const trimmed = newDocumentName.trim();
    if (!trimmed) return false;

    // 1. Update safeStorage
    try {
      const raw = safeStorage.getItem(LOCAL_ARCHIVED_DOCS_KEY);
      if (raw) {
        const list: OfficerDocumentArchiveRecord[] = JSON.parse(raw);
        const idx = list.findIndex((d) => d.id === id);
        if (idx !== -1) {
          list[idx].document_name = trimmed;
          list[idx].updated_at = new Date().toISOString();
          safeStorage.setItem(LOCAL_ARCHIVED_DOCS_KEY, JSON.stringify(list));
        }
      }
    } catch (e) {
      console.warn('Failed to update document name in safeStorage:', e);
    }

    // 2. Update IndexedDB queue if exists
    try {
      const queueList = await OfficerDocumentQueue.getPendingDocuments();
      const queued = queueList.find((q) => q.id === id);
      if (queued) {
        queued.documentName = trimmed;
        queued.updatedAt = new Date().toISOString();
        await OfficerDocumentQueue.enqueue(queued);
      }
    } catch {
      // ignore
    }

    // 3. Update Supabase if authenticated
    try {
      const { error } = await supabase
        .from('officer_document_archive')
        .update({ document_name: trimmed })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Deletes a document from both Cloudflare R2 and Supabase metadata table
   */
  static async deleteDocument(id: string, objectKey: string, contentHash?: string | null): Promise<boolean> {
    const user = await this.getCurrentUser();
    const workerUrl = this.getWorkerUrl();

    // 1. Delete from local safeStorage — by id and by content hash
    const hash = contentHash || null;
    try {
      const raw = safeStorage.getItem(LOCAL_ARCHIVED_DOCS_KEY);
      if (raw) {
        const list: OfficerDocumentArchiveRecord[] = JSON.parse(raw);
        const filtered = list.filter((d) => {
          if (d.id === id) return false;
          if (hash && (d.original_sha256 === hash || d.content_hash === hash)) return false;
          return true;
        });
        safeStorage.setItem(LOCAL_ARCHIVED_DOCS_KEY, JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }

    // 2. Delete from offline queue — by id AND by content hash, since queue
    // entries for the same file can carry a different id than the archive row
    await OfficerDocumentQueue.remove(id);
    if (hash) {
      await OfficerDocumentQueue.removeByHash(hash);
    }

    // 3. Delete from R2 if worker configured
    if (user && workerUrl && objectKey) {
      try {
        await fetch(`${workerUrl}/api/documents?key=${encodeURIComponent(objectKey)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      } catch {
        // ignore
      }
    }

    // 4. Delete from Supabase
    try {
      await supabase.from('officer_document_archive').delete().eq('id', id);
    } catch {
      // ignore
    }

    return true;
  }

  /**
   * Uploads a single archived document to the cloud on user request.
   * Used for the per-document "Upload to Cloud" action on locally stored files.
   */
  static async uploadDocumentToCloud(
    doc: OfficerDocumentArchiveRecord
  ): Promise<{ success: boolean; message?: string }> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, message: 'Please sign in to upload documents to the cloud.' };
    }

    // Already in cloud — no local file copy needed
    if (doc.upload_status === 'saved_to_cloud') {
      return { success: true, message: 'Document is already saved to the cloud.' };
    }

    const queued = await OfficerDocumentQueue.getPendingDocuments();
    let local = queued.find(
      (q) => q.id === doc.id || (doc.content_hash && q.contentHash === doc.content_hash)
    );

    if (local?.uploadStatus === 'saved_to_cloud') {
      return { success: true, message: 'Document is already saved to the cloud.' };
    }

    // Local blob missing (IndexedDB cleared, different origin, or doc created on
    // another device). Try to recover the bytes from Supabase Storage — a previous
    // fallback upload may have stored them under the canonical cloud key.
    if (!local || !local.fileBlob) {
      const recovered = await this.recoverQueuedDocumentFromStorage(user.id, doc);
      if (recovered) {
        local = recovered;
      } else {
        return { success: false, message: 'File copy not found on this device. Download it once to store it locally, then retry.' };
      }
    }

    const result = await this.uploadQueuedDocument(user, local);
    return result.uploaded
      ? { success: true }
      : { success: false, message: result.error || 'Cloud upload failed. Please try again.' };
  }

  /**
   * Ordered candidate storage keys for a document. Some legacy records have a
   * corrupted object_key (embedded whitespace / bad characters), so we also try
   * a whitespace-stripped variant and the canonical key rebuilt from record fields.
   */
  private static candidateObjectKeys(doc: OfficerDocumentArchiveRecord): string[] {
    const keys: string[] = [];
    const push = (key?: string | null) => {
      const trimmed = (key || '').trim();
      if (trimmed && !trimmed.startsWith('local/') && !keys.includes(trimmed)) keys.push(trimmed);
    };

    if (doc.object_key) {
      push(doc.object_key);
      push(doc.object_key.replace(/\s+/g, ''));
    }

    const dateObj = new Date(doc.document_date);
    const year = !isNaN(dateObj.getFullYear()) ? String(dateObj.getFullYear()) : new Date().getFullYear().toString();
    const month = !isNaN(dateObj.getMonth()) ? String(dateObj.getMonth() + 1).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
    const ext = normalizeFileFormat(doc.file_format, doc.document_name);
    const ownerIds = [doc.user_id, doc.object_key?.split('/')[1]].filter(Boolean) as string[];
    for (const uid of ownerIds) {
      push(`officers/${uid}/${year}/${month}/${doc.id}.${ext}`);
    }
    return keys;
  }

  /**
   * Fetches stored bytes trying every candidate key against the worker first,
   * then Supabase Storage, until a blob is found.
   */
  private static async fetchStoredBlob(
    doc: OfficerDocumentArchiveRecord,
    user: { id: string; email: string; token: string } | null,
    workerUrl: string,
    workerPath: string
  ): Promise<Blob | null> {
    for (const key of this.candidateObjectKeys(doc)) {
      if (user && workerUrl) {
        try {
          const res = await fetch(`${workerUrl}${workerPath}?key=${encodeURIComponent(key)}&raw=true`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          console.debug(`[Archive] Worker ${workerPath} response:`, res.status, key);
          if (res.ok) return await res.blob();
        } catch (err) {
          console.warn('Cloudflare Worker fetch error:', err, key);
        }
      }
      try {
        const { data, error } = await supabase.storage.from('uploads').download(key);
        console.debug('[Archive] Supabase Storage response:', error ? error.message : 'ok', key);
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase storage fallback fetch error:', err, key);
      }
    }
    return null;
  }

  /**
   * Rebuilds a QueuedDocument for a metadata-only archive record by downloading
   * the stored bytes from the Supabase 'uploads' bucket. Returns null when the
   * file was never uploaded anywhere.
   */
  private static async recoverQueuedDocumentFromStorage(
    userId: string,
    doc: OfficerDocumentArchiveRecord
  ): Promise<QueuedDocument | null> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;

    const candidateKeys = new Set<string>();
    if (doc.object_key && !doc.object_key.startsWith('local/')) {
      candidateKeys.add(doc.object_key);
    }
    // Canonical key used by uploadQueuedDocument: officers/{uid}/{year}/{month}/{id}.{ext}
    const dateObj = new Date(doc.document_date);
    const year = !isNaN(dateObj.getFullYear()) ? String(dateObj.getFullYear()) : new Date().getFullYear().toString();
    const month = !isNaN(dateObj.getMonth()) ? String(dateObj.getMonth() + 1).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
    const ext = normalizeFileFormat(doc.file_format, doc.document_name);
    candidateKeys.add(`officers/${userId}/${year}/${month}/${doc.id}.${ext}`);
    candidateKeys.add(`officers/${doc.user_id}/${year}/${month}/${doc.id}.${ext}`);

    const workerUrl = this.getWorkerUrl();
    const sessionUser = await this.getCurrentUser();

    const buildQueuedDoc = (key: string, data: Blob): QueuedDocument => {
      const now = new Date().toISOString();
      return {
          id: doc.id,
          userId: doc.user_id || userId,
          documentName: doc.document_name,
          originalFilename: doc.original_filename || doc.document_name,
          documentCategory: doc.document_category,
          documentNumber: doc.document_number || undefined,
          documentDate: doc.document_date,
          sourceModule: doc.source_module,
          fileFormat: doc.file_format,
          mimeType: doc.mime_type,
          originalSize: doc.original_size_bytes ?? doc.original_size,
          storedSize: doc.stored_size_bytes ?? doc.stored_size,
          originalSizeBytes: doc.original_size_bytes,
          storedSizeBytes: doc.stored_size_bytes,
          compressionMethod: doc.compression_method,
          compressionStatus: doc.compression_status,
          contentHash: doc.content_hash,
          originalSha256: doc.original_sha256 || undefined,
          storedSha256: doc.stored_sha256 || undefined,
          restorationVerified: doc.restoration_verified,
          objectKey: key,
          uploadStatus: 'pending_retry',
          versionNumber: doc.version_number,
          parentDocumentId: doc.parent_document_id,
          metadata: doc.metadata_json || {},
          fileBlob: data,
          retryCount: 0,
          createdAt: doc.created_at,
          updatedAt: now,
      };
    };

    const downloadFromKey = async (key: string): Promise<QueuedDocument | null> => {
      let data: Blob | null = null;

      // 1. Primary: Cloudflare R2 via worker — the file may have been uploaded
      //    there even though the local IndexedDB copy was later lost.
      if (workerUrl && sessionUser) {
        try {
          const res = await fetch(`${workerUrl}/api/documents/download?key=${encodeURIComponent(key)}&raw=true`, {
            headers: { Authorization: `Bearer ${sessionUser.token}` },
          });
          console.debug('[DocRecovery] worker download', key, '->', res.status);
          if (res.ok) {
            data = await res.blob();
          }
        } catch (err) {
          console.debug('[DocRecovery] worker download failed', key, err);
          // fall through to Supabase storage
        }
      }

      // 2. Fallback: Supabase Storage bucket
      if (!data) {
        try {
          const { data: sbData, error } = await supabase.storage.from('uploads').download(key);
          console.debug('[DocRecovery] supabase download', key, '->', error ? error.message : 'ok');
          if (!error && sbData) {
            data = sbData;
          }
        } catch (err) {
          console.debug('[DocRecovery] supabase download failed', key, err);
          // key not found — caller tries the next candidate
        }
      }

      return data ? buildQueuedDoc(key, data) : null;
    };

    for (const key of candidateKeys) {
      const recovered = await downloadFromKey(key);
      if (recovered) return recovered;
    }

    // 3. Last resort: the object key may not match the canonical guess (e.g. the
    //    document was queued under a different id or date). List the officer's
    //    storage prefix and match objects whose filename starts with the doc id.
    const discoveredKeys = await this.discoverStoredObjectKeys(
      Array.from(new Set([userId, doc.user_id].filter(Boolean) as string[])),
      doc
    );
    console.debug('[DocRecovery] discovered keys:', discoveredKeys, 'guessed keys were:', Array.from(candidateKeys));
    for (const key of discoveredKeys) {
      const recovered = await downloadFromKey(key);
      if (recovered) return recovered;
    }

    return null;
  }

  /**
   * Lists the Supabase 'uploads' bucket under officers/{userId}/{year}/{month}
   * and returns object keys whose filename starts with the document id.
   * Used when the canonical object-key guess fails during cloud recovery.
   */
  private static async discoverStoredObjectKeys(
    userIds: string[],
    doc: OfficerDocumentArchiveRecord
  ): Promise<string[]> {
    const keys = new Set<string>();
    const docId = String(doc.id || '');
    if (!docId) return [];

    for (const uid of userIds) {
      try {
        const { data: yearFolders } = await supabase.storage.from('uploads').list(`officers/${uid}`);
        for (const yearFolder of yearFolders || []) {
          if (yearFolder.id !== null) continue; // files can't sit at this level
          const { data: monthFolders } = await supabase.storage.from('uploads').list(`officers/${uid}/${yearFolder.name}`);
          for (const monthFolder of monthFolders || []) {
            if (monthFolder.id !== null) continue;
            const prefix = `officers/${uid}/${yearFolder.name}/${monthFolder.name}`;
            const { data: files } = await supabase.storage.from('uploads').list(prefix);
            for (const file of files || []) {
              if (file.id === null) continue;
              if (file.name.startsWith(`${docId}.`) || file.name === docId) {
                keys.add(`${prefix}/${file.name}`);
              }
            }
          }
        }
      } catch {
        // listing unsupported or bucket unreachable — skip this user
      }
    }
    return Array.from(keys);
  }

  /**
   * Retries uploading all pending documents in the offline queue.
   * Includes documents queued while signed out (anonymous/guest) — they are
   * claimed by the currently authenticated officer during upload.
   */
  static async retryFailedUploads(): Promise<{ total: number; succeeded: number; failed: number; errors: string[] }> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { total: 0, succeeded: 0, failed: 0, errors: ['Not signed in'] };
    }

    const queued = await OfficerDocumentQueue.getPendingDocuments();
    const pending = queued.filter(
      (d) =>
        d.fileBlob &&
        (d.userId === user.id || d.userId === 'anonymous' || d.userId === 'guest') &&
        d.uploadStatus !== 'saved_to_cloud'
    );

    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const doc of pending) {
      const result = await this.uploadQueuedDocument(user, doc);
      if (result.uploaded) {
        succeeded++;
      } else {
        failed++;
        errors.push(`${doc.documentName}: ${result.error || 'unknown error'}`);
      }
    }

    return { total: pending.length, succeeded, failed, errors };
  }

  /**
   * Uploads one queued document to Cloudflare R2 (primary) or Supabase Storage
   * (fallback), upserts the Supabase metadata row, claims anonymous/guest
   * documents for the authenticated officer, and keeps the IndexedDB copy so
   * the file remains available offline.
   */
  private static async uploadQueuedDocument(
    user: { id: string; email: string; token: string },
    doc: QueuedDocument
  ): Promise<{ uploaded: boolean; error?: string }> {
    if (doc.uploadStatus === 'saved_to_cloud') {
      return { uploaded: true };
    }

    const workerUrl = this.getWorkerUrl();
    const isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;

    const dateObj = new Date(doc.documentDate);
    const year = !isNaN(dateObj.getFullYear()) ? String(dateObj.getFullYear()) : new Date().getFullYear().toString();
    const month = !isNaN(dateObj.getMonth()) ? String(dateObj.getMonth() + 1).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
    const ext = normalizeFileFormat(doc.fileFormat, doc.documentName);
    // Always scope the cloud object key to the currently authenticated officer,
    // fixing stale keys left behind by anonymous/guest queue entries.
    const objectKey = `officers/${user.id}/${year}/${month}/${doc.id}.${ext}`;

    let uploaded = false;
    let lastError: string | undefined;

    // 1. Primary: Cloudflare Worker -> R2
    if (workerUrl && isOnline) {
      try {
        const formData = new FormData();
        formData.append('file', doc.fileBlob, doc.documentName);
        formData.append('filename', doc.documentName);
        formData.append('documentId', doc.id);
        if (doc.documentNumber) formData.append('documentNumber', doc.documentNumber);
        formData.append('category', doc.documentCategory);
        formData.append('sourceModule', doc.sourceModule);
        formData.append('mimeType', doc.mimeType);
        formData.append('originalSize', String(doc.originalSize));
        formData.append('compressionMethod', doc.compressionMethod || 'none');
        formData.append('compressionStatus', doc.compressionStatus);
        if (doc.originalSha256) formData.append('originalSha256', doc.originalSha256);
        if (doc.storedSha256) formData.append('storedSha256', doc.storedSha256);
        formData.append('year', year);
        formData.append('month', month);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(`${workerUrl}/api/documents/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          uploaded = true;
        } else {
          const errData = (await res.json().catch(() => ({}))) as { error?: string };
          lastError = errData.error || `HTTP ${res.status}`;
          console.warn(`[R2 Upload] Worker rejected ${doc.documentName}:`, lastError);
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`[R2 Upload] Worker request failed for ${doc.documentName}:`, lastError);
      }
    } else {
      lastError = !workerUrl ? 'Worker URL not configured' : 'Device is offline';
    }

    // 2. Secondary Cloud Storage Fallback: Supabase Storage
    if (!uploaded && isOnline) {
      try {
        // The 'uploads' bucket only accepts a fixed allow-list of MIME types.
        // Stored bytes may be gzip-compressed, but the object is labelled with
        // the document's original MIME type (restoration uses compression
        // metadata, not the storage content type).
        const SUPABASE_ALLOWED_MIMES = new Set([
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ]);
        const fallbackContentType =
          doc.mimeType && SUPABASE_ALLOWED_MIMES.has(doc.mimeType) ? doc.mimeType : 'application/pdf';
        const { error: storageError } = await supabase.storage
          .from('uploads')
          .upload(objectKey, new Blob([doc.fileBlob], { type: fallbackContentType }), {
            upsert: true,
            contentType: fallbackContentType,
          });

        if (!storageError) {
          uploaded = true;
          lastError = undefined;
        } else {
          lastError = storageError.message;
        }
      } catch (storageErr) {
        lastError = storageErr instanceof Error ? storageErr.message : String(storageErr);
      }
    }

    if (!uploaded) {
      // Keep the document retryable: pending_retry (not terminal upload_failed)
      // so the Retry Pending action keeps working for transient failures.
      await OfficerDocumentQueue.updateStatus(doc.id, 'pending_retry', lastError || 'Cloud upload failed');
      return { uploaded: false, error: lastError };
    }

    // Claim the document for the authenticated officer and persist the local copy
    doc.userId = user.id;
    doc.objectKey = objectKey;
    doc.uploadStatus = 'saved_to_cloud';
    doc.lastError = undefined;
    await OfficerDocumentQueue.enqueue(doc);

    // Upsert canonical metadata into Supabase
    try {
      const row = {
        id: doc.id,
        user_id: user.id,
        document_name: doc.documentName,
        original_filename: doc.originalFilename || doc.documentName,
        document_category: doc.documentCategory,
        document_number: doc.documentNumber || null,
        document_date: doc.documentDate,
        source_module: doc.sourceModule,
        object_key: objectKey,
        file_format: ext,
        mime_type: doc.mimeType,
        original_size: doc.originalSize,
        stored_size: doc.storedSize,
        original_size_bytes: doc.originalSizeBytes || doc.originalSize,
        stored_size_bytes: doc.storedSizeBytes || doc.storedSize,
        compression_method: doc.compressionMethod || 'none',
        compression_status: doc.compressionStatus,
        content_hash: doc.contentHash,
        original_sha256: doc.originalSha256 || doc.contentHash,
        stored_sha256: doc.storedSha256 || doc.contentHash,
        restoration_verified: true,
        upload_status: 'saved_to_cloud',
        version_number: doc.versionNumber,
        parent_document_id: doc.parentDocumentId || null,
        metadata_json: doc.metadata,
      };

      const table = supabase.from('officer_document_archive') as unknown as OfficerDocumentArchiveTable;
      if (typeof table.upsert === 'function') {
        await table.upsert(row, { onConflict: 'id' });
      } else {
        await table.insert(row);
      }
    } catch (err) {
      console.warn('Failed to upsert document metadata after cloud upload:', err);
    }

    // Update safeStorage record (also claims anonymous/guest records)
    try {
      const raw = safeStorage.getItem(LOCAL_ARCHIVED_DOCS_KEY);
      if (raw) {
        const list: OfficerDocumentArchiveRecord[] = JSON.parse(raw);
        const target = list.find((item) => item.id === doc.id);
        if (target) {
          target.user_id = user.id;
          target.upload_status = 'saved_to_cloud';
          target.object_key = objectKey;
          target.updated_at = new Date().toISOString();
          safeStorage.setItem(LOCAL_ARCHIVED_DOCS_KEY, JSON.stringify(list));
        }
      }
    } catch {
      // ignore
    }

    return { uploaded: true };
  }

  /**
   * Aggregates accurate storage statistics for the officer
   */
  static async getStorageOverview(): Promise<StorageOverviewStats> {
    const docs = await this.fetchOfficerDocuments();

    let totalOriginalBytes = 0;
    let totalStoredBytes = 0;
    let totalPdfs = 0;
    let totalDocx = 0;
    let successfullyUploaded = 0;
    let pendingUploads = 0;
    let failedUploads = 0;

    docs.forEach((d) => {
      const orig = Number(d.original_size_bytes ?? d.original_size) || 0;
      const stored = Number(d.stored_size_bytes ?? d.stored_size) || orig;

      totalOriginalBytes += orig;
      totalStoredBytes += stored;

      if (d.file_format === 'pdf') totalPdfs++;
      if (d.file_format === 'docx') totalDocx++;
      if (d.upload_status === 'saved_to_cloud') successfullyUploaded++;
      else if (d.upload_status === 'pending_retry' || d.upload_status === 'uploading' || d.upload_status === 'compressing') pendingUploads++;
      else if (d.upload_status === 'upload_failed') failedUploads++;
    });

    const storageSavedBytes = Math.max(0, totalOriginalBytes - totalStoredBytes);
    const compressionPercentage = totalOriginalBytes > 0
      ? Number(((storageSavedBytes / totalOriginalBytes) * 100).toFixed(1))
      : 0;

    return {
      totalDocuments: docs.length,
      totalStorageBytes: totalStoredBytes,
      totalOriginalBytes,
      totalStoredBytes,
      storageSavedBytes,
      compressionPercentage,
      totalPdfs,
      totalDocx,
      successfullyUploaded,
      pendingUploads,
      failedUploads,
    };
  }
}

function triggerBrowserDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
