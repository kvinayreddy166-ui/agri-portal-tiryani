// =====================================================================
// AGRONIX Knowledge Base — client service
// =====================================================================
// Talks to Supabase tables (categories, documents, jobs, queries,
// feedback, suggested questions) and to Supabase Edge Functions for
// heavy processing (process-document), search, and RAG ask.
// =====================================================================
import { supabase } from '../../../lib/supabase';
import type {
  AskResult,
  DashboardStats,
  DocumentUploadInput,
  KnowledgeCategory,
  KnowledgeDocument,
  ProcessingJob,
  RetrievalQuality,
  SearchFilters,
  SearchResult,
  SuggestedQuestion,
} from '../types';

const EDGE_FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || ''}/functions/v1`;

function requireAuth() {
  return supabase.auth.getSession();
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await requireAuth();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function callEdgeFunction<T>(name: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${EDGE_FUNCTION_BASE}/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Edge function ${name} failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------
export async function fetchCategories(): Promise<KnowledgeCategory[]> {
  const { data, error } = await supabase
    .from('knowledge_categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as KnowledgeCategory[];
}

export async function createCategory(input: { name: string; description?: string }): Promise<KnowledgeCategory> {
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const { data, error } = await supabase
    .from('knowledge_categories')
    .insert({ name: input.name, slug, description: input.description ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as KnowledgeCategory;
}

export async function updateCategory(id: string, input: { name?: string; description?: string }): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    patch.name = input.name;
    patch.slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (input.description !== undefined) patch.description = input.description;
  const { error } = await supabase.from('knowledge_categories').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('knowledge_categories').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Suggested questions
// ---------------------------------------------------------------------
export async function fetchSuggestedQuestions(): Promise<SuggestedQuestion[]> {
  const { data, error } = await supabase
    .from('knowledge_suggested_questions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data as SuggestedQuestion[];
}

export async function fetchAllSuggestedQuestions(): Promise<SuggestedQuestion[]> {
  const { data, error } = await supabase
    .from('knowledge_suggested_questions')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data as SuggestedQuestion[];
}

export async function createSuggestedQuestion(input: { question: string; category?: string }): Promise<void> {
  const { error } = await supabase.from('knowledge_suggested_questions').insert({
    question: input.question,
    category: input.category ?? null,
  });
  if (error) throw error;
}

export async function deleteSuggestedQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('knowledge_suggested_questions').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------
export async function fetchDocuments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  documentType?: string;
  categoryId?: string;
  includeInactive?: boolean;
}): Promise<{ documents: KnowledgeDocument[]; total: number }> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('knowledge_documents').select(
    '*, knowledge_document_categories(category_id)',
    { count: 'exact' }
  );

  if (!params.includeInactive) query = query.eq('is_active', true);
  query = query.is('deleted_at', null);

  if (params.search) query = query.ilike('title', `%${params.search}%`);
  if (params.status) query = query.eq('status', params.status);
  if (params.documentType) query = query.eq('document_type', params.documentType);

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const documents = (data ?? []) as unknown as KnowledgeDocument[];
  return { documents, total: count ?? 0 };
}

export async function fetchDocument(id: string): Promise<KnowledgeDocument | null> {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as KnowledgeDocument | null;
}

export async function checkDuplicateHash(fileHash: string): Promise<KnowledgeDocument | null> {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*')
    .eq('file_hash', fileHash)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data as KnowledgeDocument | null;
}

export async function uploadDocumentFile(file: File, documentId: string): Promise<string> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${documentId}/original_${cleanName}`;
  const { error } = await supabase.storage
    .from('knowledge-documents')
    .upload(filePath, file, { upsert: true, contentType: file.type || 'application/octet-stream' });
  if (error) throw error;
  return filePath;
}

export async function createDocumentRecord(
  input: DocumentUploadInput & { file_path: string; file_name: string; file_size: number; mime_type: string; file_hash: string }
): Promise<KnowledgeDocument> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('knowledge_documents')
    .insert({
      title: input.title,
      description: input.description ?? null,
      document_type: input.document_type,
      department: input.department ?? null,
      authority: input.authority ?? null,
      reference_number: input.reference_number ?? null,
      document_number: input.document_number ?? null,
      document_date: input.document_date ?? null,
      effective_date: input.effective_date ?? null,
      state: input.state ?? null,
      language: input.language ?? null,
      keywords: input.keywords ?? [],
      version: input.version ?? null,
      status: 'UPLOADED',
      is_active: true,
      is_superseded: false,
      superseded_by: input.superseded_by ?? null,
      file_name: input.file_name,
      file_path: input.file_path,
      file_size: input.file_size,
      mime_type: input.mime_type,
      file_hash: input.file_hash,
      created_by: userData.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  const document = data as KnowledgeDocument;

  if (input.categoryIds.length > 0) {
    const rows = input.categoryIds.map((categoryId) => ({ document_id: document.id, category_id: categoryId }));
    const { error: catError } = await supabase.from('knowledge_document_categories').insert(rows);
    if (catError) console.warn('Failed to link categories:', catError.message);
  }

  return document;
}

export async function updateDocument(id: string, patch: Partial<KnowledgeDocument>): Promise<void> {
  const { error } = await supabase.from('knowledge_documents').update(patch).eq('id', id);
  if (error) throw error;
}

export async function setDocumentCategories(documentId: string, categoryIds: string[]): Promise<void> {
  await supabase.from('knowledge_document_categories').delete().eq('document_id', documentId);
  if (categoryIds.length > 0) {
    const rows = categoryIds.map((categoryId) => ({ document_id: documentId, category_id: categoryId }));
    const { error } = await supabase.from('knowledge_document_categories').insert(rows);
    if (error) throw error;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  // Soft delete
  const { error } = await supabase.from('knowledge_documents').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function toggleDocumentActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('knowledge_documents').update({ is_active: active }).eq('id', id);
  if (error) throw error;
}

export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('knowledge-documents').createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ---------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------
export async function processDocument(documentId: string): Promise<{ jobId: string }> {
  return callEdgeFunction<{ jobId: string }>('knowledge-process', { documentId });
}

export async function fetchProcessingJobs(): Promise<ProcessingJob[]> {
  const { data, error } = await supabase
    .from('knowledge_processing_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as ProcessingJob[];
}

export async function fetchProcessingJob(documentId: string): Promise<ProcessingJob | null> {
  const { data, error } = await supabase
    .from('knowledge_processing_jobs')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ProcessingJob | null;
}

// ---------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------
export async function searchKnowledge(
  query: string,
  filters: SearchFilters,
  mode: 'keyword' | 'semantic' | 'hybrid' = 'hybrid',
  limit = 10
): Promise<SearchResult> {
  return callEdgeFunction<SearchResult>('knowledge-search', { query, filters, mode, limit });
}

// ---------------------------------------------------------------------
// RAG ask
// ---------------------------------------------------------------------
export async function askQuestion(
  query: string,
  filters: SearchFilters
): Promise<AskResult> {
  return callEdgeFunction<AskResult>('knowledge-ask', { query, filters });
}

export async function submitFeedback(queryId: string, feedback: 'helpful' | 'not_helpful', comments?: string): Promise<void> {
  const { error } = await supabase.from('knowledge_feedback').insert({ query_id: queryId, feedback, comments: comments ?? null });
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Dashboard / analytics
// ---------------------------------------------------------------------
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [docs, chunks, queries, jobs] = await Promise.all([
    supabase.from('knowledge_documents').select('id, status, is_active, created_at, title').is('deleted_at', null),
    supabase.from('knowledge_chunks').select('id', { count: 'exact', head: true }),
    supabase.from('knowledge_queries').select('id, query, created_at, retrieval_quality').order('created_at', { ascending: false }).limit(10),
    supabase.from('knowledge_processing_jobs').select('status'),
  ]);

  if (docs.error) throw docs.error;
  if (queries.error) throw queries.error;
  if (jobs.error) throw jobs.error;

  const documents = docs.data ?? [];
  const totalDocuments = documents.length;
  const activeDocuments = documents.filter((d) => d.is_active).length;
  const processing = documents.filter((d) =>
    ['EXTRACTING', 'CLEANING', 'CHUNKING', 'GENERATING_EMBEDDINGS', 'SAVING', 'UPLOADED'].includes(d.status)
  ).length;
  const failed = documents.filter((d) => d.status === 'FAILED').length;
  const ocrRequired = documents.filter((d) => d.status === 'OCR_REQUIRED').length;

  const recentUploads = [...documents]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 5) as KnowledgeDocument[];

  const recentQueries = (queries.data ?? []).map((q) => ({
    id: q.id,
    query: q.query,
    created_at: q.created_at,
    retrieval_quality: q.retrieval_quality,
  }));

  const unansweredQuestions = (queries.data ?? []).filter((q) => q.retrieval_quality === 'NONE' || q.retrieval_quality === 'LIMITED').length;

  return {
    totalDocuments,
    activeDocuments,
    processing,
    failed,
    ocrRequired,
    totalChunks: chunks.count ?? 0,
    totalQueries: queries.data?.length ?? 0,
    recentUploads,
    recentQueries,
    unansweredQuestions,
  };
}

export async function fetchQueryAnalytics(): Promise<{
  totalQueries: number;
  unanswered: number;
  partial: number;
  averageResponseTime: number;
  recent: Array<{ id: string; query: string; created_at: string; retrieval_quality: string | null; response_time_ms: number | null }>;
}> {
  const { data, error } = await supabase
    .from('knowledge_queries')
    .select('id, query, created_at, retrieval_quality, response_time_ms')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = data ?? [];
  const total = rows.length;
  const unanswered = rows.filter((r) => r.retrieval_quality === 'NONE' || r.retrieval_quality === 'LIMITED').length;
  const partial = rows.filter((r) => r.retrieval_quality === 'PARTIAL').length;
  const times = rows.map((r) => r.response_time_ms).filter((v): v is number => typeof v === 'number');
  const averageResponseTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  return { totalQueries: total, unanswered, partial, averageResponseTime, recent: rows.slice(0, 20) };
}

export function qualityLabel(q: RetrievalQuality): string {
  switch (q) {
    case 'STRONG':
      return 'Strong document match';
    case 'PARTIAL':
      return 'Partial document match';
    case 'LIMITED':
      return 'Limited information available';
    case 'NONE':
      return 'No relevant information found';
  }
}
