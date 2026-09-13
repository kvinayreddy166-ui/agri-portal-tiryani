// =====================================================================
// AGRONIX Knowledge Base — shared types
// =====================================================================

export type DocumentType =
  | 'Act'
  | 'Rule'
  | 'Order'
  | 'Government Order'
  | 'Circular'
  | 'Office Memo'
  | 'Notification'
  | 'Guideline'
  | 'Manual'
  | 'Procedure'
  | 'SOP'
  | 'Scheme Guideline'
  | 'Proceeding'
  | 'Form'
  | 'Other';

export const DOCUMENT_TYPES: DocumentType[] = [
  'Act',
  'Rule',
  'Order',
  'Government Order',
  'Circular',
  'Office Memo',
  'Notification',
  'Guideline',
  'Manual',
  'Procedure',
  'SOP',
  'Scheme Guideline',
  'Proceeding',
  'Form',
  'Other',
];

export type ProcessingStatus =
  | 'UPLOADED'
  | 'EXTRACTING'
  | 'CLEANING'
  | 'CHUNKING'
  | 'GENERATING_EMBEDDINGS'
  | 'SAVING'
  | 'COMPLETED'
  | 'FAILED'
  | 'OCR_REQUIRED'
  | 'CANCELLED';

export const PROCESSING_STEPS: ProcessingStatus[] = [
  'UPLOADED',
  'EXTRACTING',
  'CLEANING',
  'CHUNKING',
  'GENERATING_EMBEDDINGS',
  'SAVING',
  'COMPLETED',
];

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  description?: string | null;
  document_type: DocumentType;
  department?: string | null;
  authority?: string | null;
  reference_number?: string | null;
  document_number?: string | null;
  document_date?: string | null;
  effective_date?: string | null;
  state?: string | null;
  language?: string | null;
  keywords?: string[] | null;
  version?: string | null;
  status: ProcessingStatus;
  is_active: boolean;
  is_superseded: boolean;
  superseded_by?: string | null;
  file_name: string;
  file_path: string;
  file_hash?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  page_count?: number | null;
  chunk_count?: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  categories?: KnowledgeCategory[];
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  page_number?: number | null;
  page_end_number?: number | null;
  section_heading?: string | null;
  section_path?: string | null;
  token_count?: number | null;
  metadata?: Record<string, unknown>;
}

export interface ProcessingJob {
  id: string;
  document_id: string;
  status: ProcessingStatus;
  progress: number;
  current_step?: string | null;
  total_chunks: number;
  processed_chunks: number;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export type RetrievalQuality = 'STRONG' | 'PARTIAL' | 'LIMITED' | 'NONE';

export interface SearchFilters {
  category?: string;
  document_type?: DocumentType;
  authority?: string;
  department?: string;
  year?: number;
  language?: string;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentType: DocumentType;
  pageNumber?: number | null;
  pageEndNumber?: number | null;
  sectionHeading?: string | null;
  sectionPath?: string | null;
  referenceNumber?: string | null;
  text: string;
  vectorScore?: number;
  keywordScore?: number;
  combinedScore: number;
}

export interface Citation {
  sourceId: string;
  documentId: string;
  documentTitle: string;
  documentType: DocumentType;
  pageNumber?: number | null;
  pageEndNumber?: number | null;
  sectionHeading?: string | null;
  sectionPath?: string | null;
  referenceNumber?: string | null;
}

export interface AskResult {
  answer: string;
  citations: Citation[];
  retrievalQuality: RetrievalQuality;
  queryId: string;
  responseTimeMs: number;
  language: string;
}

export interface SearchResult {
  chunks: RetrievedChunk[];
  total: number;
}

export interface KnowledgeFeedback {
  id: string;
  query_id: string;
  feedback: 'helpful' | 'not_helpful';
  comments?: string | null;
  created_at: string;
}

export interface SuggestedQuestion {
  id: string;
  question: string;
  category?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DashboardStats {
  totalDocuments: number;
  activeDocuments: number;
  processing: number;
  failed: number;
  ocrRequired: number;
  totalChunks: number;
  totalQueries: number;
  recentUploads: KnowledgeDocument[];
  recentQueries: Array<{ id: string; query: string; created_at: string; retrieval_quality: string | null }>;
  unansweredQuestions: number;
}

export interface DocumentUploadInput {
  title: string;
  document_type: DocumentType;
  categoryIds: string[];
  description?: string;
  department?: string;
  authority?: string;
  reference_number?: string;
  document_number?: string;
  document_date?: string;
  effective_date?: string;
  state?: string;
  language?: string;
  keywords?: string[];
  version?: string;
  superseded_by?: string;
}
