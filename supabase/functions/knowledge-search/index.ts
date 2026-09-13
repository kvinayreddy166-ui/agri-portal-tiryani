// =====================================================================
// knowledge-search — hybrid search (vector + full-text) (Edge Function)
// =====================================================================
import { createAdminClient, corsHeaders, EMBEDDING_DIM, errorResponse, json, OLLAMA_BASE_URL, OLLAMA_EMBEDDING_MODEL, RAG_FINAL_RESULTS, RAG_KEYWORD_RESULTS, RAG_VECTOR_RESULTS, verifyUser } from '../_shared/knowledge.ts';

interface SearchFilters {
  category?: string;
  document_type?: string;
  authority?: string;
  department?: string;
  year?: number;
  language?: string;
}

async function queryEmbedding(text: string): Promise<number[] | null> {
  if (!OLLAMA_BASE_URL) return null;
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_EMBEDDING_MODEL, prompt: text.slice(0, 8000) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const emb = data.embedding as number[];
    if (Array.isArray(emb) && emb.length === EMBEDDING_DIM) return emb;
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createAdminClient();
    const { user } = await verifyUser(req, supabase);
    if (!user) return errorResponse('Authentication required.', 401);

    const { query, filters = {} as SearchFilters, mode = 'hybrid', limit = RAG_FINAL_RESULTS } = await req.json();
    if (!query || typeof query !== 'string') return errorResponse('query is required.', 400);

    // --- Vector search ---
    let vectorResults: Array<{ id: string; score: number }> = [];
    if (mode === 'semantic' || mode === 'hybrid') {
      const emb = await queryEmbedding(query);
      if (emb) {
        const { data, error } = await supabase.rpc('knowledge_vector_search', {
          p_embedding: emb,
          p_category: filters.category ?? null,
          p_document_type: filters.document_type ?? null,
          p_authority: filters.authority ?? null,
          p_department: filters.department ?? null,
          p_year: filters.year ?? null,
          p_language: filters.language ?? null,
          p_limit: RAG_VECTOR_RESULTS,
        });
        if (!error && Array.isArray(data)) {
          vectorResults = data as Array<{ id: string; score: number }>;
        }
      }
    }

    // --- Keyword (FTS) search ---
    let keywordResults: Array<{ id: string; score: number }> = [];
    if (mode === 'keyword' || mode === 'hybrid') {
      const tsquery = query.trim().split(/\s+/).filter(Boolean).map((t) => `${t}:*`).join(' & ');
      if (tsquery) {
        const { data, error } = await supabase.rpc('knowledge_keyword_search', {
          p_query: tsquery,
          p_category: filters.category ?? null,
          p_document_type: filters.document_type ?? null,
          p_authority: filters.authority ?? null,
          p_department: filters.department ?? null,
          p_year: filters.year ?? null,
          p_language: filters.language ?? null,
          p_limit: RAG_KEYWORD_RESULTS,
        });
        if (!error && Array.isArray(data)) {
          keywordResults = data as Array<{ id: string; score: number }>;
        }
      }
    }

    // Merge + dedupe + normalize + rank
    const allIds = new Set<string>([...vectorResults.map((r) => r.id), ...keywordResults.map((r) => r.id)]);
    if (allIds.size === 0) {
      return json({ chunks: [], total: 0 });
    }

    const vecMax = Math.max(...vectorResults.map((r) => r.score), 1);
    const kwMax = Math.max(...keywordResults.map((r) => r.score), 1e-9);
    const vecMap = new Map(vectorResults.map((r) => [r.id, r.score / vecMax]));
    const kwMap = new Map(keywordResults.map((r) => [r.id, r.score / kwMax]));

    const vectorWeight = 0.6;
    const keywordWeight = 0.4;

    const ranked = [...allIds].map((id) => {
      const v = vecMap.get(id) ?? 0;
      const k = kwMap.get(id) ?? 0;
      return { id, combinedScore: v * vectorWeight + k * keywordWeight, vectorScore: vecMap.get(id) ?? null, keywordScore: kwMap.get(id) ?? null };
    }).sort((a, b) => b.combinedScore - a.combinedScore).slice(0, limit);

    // Fetch chunk + document details
    const { data: chunksData, error: chunksError } = await supabase
      .from('knowledge_chunks')
      .select('id, document_id, chunk_text, page_number, page_end_number, section_heading, section_path')
      .in('id', ranked.map((r) => r.id));
    if (chunksError) throw chunksError;

    const docIds = [...new Set((chunksData ?? []).map((c) => c.document_id))];
    const { data: docsData } = await supabase
      .from('knowledge_documents')
      .select('id, title, document_type, reference_number')
      .in('id', docIds);
    const docMap = new Map((docsData ?? []).map((d) => [d.id, d]));

    const scoreMap = new Map(ranked.map((r) => [r.id, r]));
    const results = (chunksData ?? []).map((c) => {
      const doc = docMap.get(c.document_id) as { id: string; title: string; document_type: string; reference_number: string | null } | undefined;
      const s = scoreMap.get(c.id)!;
      return {
        chunkId: c.id,
        documentId: c.document_id,
        documentTitle: doc?.title ?? '',
        documentType: doc?.document_type ?? 'Other',
        pageNumber: c.page_number,
        pageEndNumber: c.page_end_number,
        sectionHeading: c.section_heading,
        sectionPath: c.section_path,
        referenceNumber: doc?.reference_number ?? null,
        text: c.chunk_text,
        vectorScore: s.vectorScore,
        keywordScore: s.keywordScore,
        combinedScore: s.combinedScore,
      };
    }).sort((a, b) => b.combinedScore - a.combinedScore);

    return json({ chunks: results, total: results.length });
  } catch (err) {
    console.error('knowledge-search error:', err);
    return errorResponse((err as Error).message || 'Search failed.', 500);
  }
});
