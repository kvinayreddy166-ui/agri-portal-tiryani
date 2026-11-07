/**
 * Officer Cloudflare R2 Document Archive Types
 */

export type DocumentCategory = 
  | 'order'
  | 'notice'
  | 'inspection'
  | 'inspection_report'
  | 'sample'
  | 'tour_diary'
  | 'advisory'
  | 'other';

export type FileFormat = 'pdf' | 'docx' | 'xlsx' | 'txt';

export type CompressionStatus = 'uncompressed' | 'compressed' | 'failed' | 'skipped';

export type CompressionMethod = 'none' | 'gzip' | 'deflate' | 'brotli';

export type UploadStatus = 
  | 'generated'
  | 'compressing'
  | 'uploading'
  | 'saved_to_cloud'
  | 'upload_failed'
  | 'pending_retry'
  | 'local_only';

export interface OfficerDocumentArchiveRecord {
  id: string;
  user_id: string;
  document_name: string;
  original_filename?: string;
  document_category: DocumentCategory;
  document_number?: string | null;
  document_date: string;
  source_module: string;
  object_key: string;
  file_format: FileFormat;
  mime_type: string;
  original_size: number;
  stored_size: number;
  original_size_bytes?: number;
  stored_size_bytes?: number;
  compression_method?: CompressionMethod;
  compression_status: CompressionStatus;
  content_hash: string;
  original_sha256?: string;
  stored_sha256?: string;
  restoration_verified?: boolean;
  upload_status: UploadStatus;
  version_number: number;
  parent_document_id?: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StorageOverviewStats {
  totalDocuments: number;
  totalStorageBytes: number;
  totalOriginalBytes: number;
  totalStoredBytes: number;
  storageSavedBytes: number;
  compressionPercentage: number;
  totalPdfs: number;
  totalDocx: number;
  successfullyUploaded: number;
  pendingUploads: number;
  failedUploads: number;
}

export interface ArchiveDocumentOptions {
  filename: string;
  documentCategory: DocumentCategory;
  documentNumber?: string;
  sourceModule: string;
  fileFormat: FileFormat;
  documentDate?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentCompressionResult {
  storedBytes: Uint8Array;
  originalBytes: Uint8Array;
  originalSize: number;
  storedSize: number;
  savingsBytes: number;
  savingsPercent: number;
  compressionMethod: CompressionMethod;
  compressionStatus: CompressionStatus;
  originalSha256: string;
  storedSha256: string;
  verifiedRestoration: boolean;
}
