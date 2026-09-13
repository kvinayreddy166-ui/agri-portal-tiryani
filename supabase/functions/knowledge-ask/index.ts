// =====================================================================
// knowledge-ask — RAG answer generation (Edge Function)
// =====================================================================
// Pipeline: query embedding -> hybrid search -> rerank -> no-answer
// detection -> build context with [SOURCE_n] ids -> LLM -> map citations
// -> save query analytics.
// =====================================================================
import { createAdminClient, corsHeaders, EMBEDDING_DIM, errorResponse, json, OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBEDDING_MODEL, RAG_FINAL_RESULTS, RAG_VECTOR_RESULTS, RAG_KEYWORD_RESULTS, verifyUser } from '../_shared/knowledge.ts';

interface SearchFilters {
  category?: string;
  document_type?: string;
  authority?: string;
  department?: string;
  year?: number;
  language?: string;
}

interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  pageNumber: number | null;
  pageEndNumber: number | null;
  sectionHeading: string | null;
  sectionPath: string | null;
  referenceNumber: string | null;
  text: string;
  vectorScore: number | null;
  keywordScore: number | null;
  combinedScore: number;
}

function detectLanguage(text: string): 'en' | 'te' | 'hi' {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
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

async function hybridSearch(supabase: ReturnType<typeof createAdminClient>, query: string, filters: SearchFilters): Promise<RetrievedChunk[]> {
  let vectorResults: Array<{ id: string; score: number }> = [];
  const emb = await queryEmbedding(query);
  if (emb) {
    const { data } = await supabase.rpc('knowledge_vector_search', {
      p_embedding: emb, p_category: filters.category ?? null, p_document_type: filters.document_type ?? null,
      p_authority: filters.authority ?? null, p_department: filters.department ?? null,
      p_year: filters.year ?? null, p_language: filters.language ?? null, p_limit: RAG_VECTOR_RESULTS,
    });
    if (Array.isArray(data)) vectorResults = data as Array<{ id: string; score: number }>;
  }

  const tsquery = query.trim().split(/\s+/).filter(Boolean).map((t) => `${t}:*`).join(' & ');
  let keywordResults: Array<{ id: string; score: number }> = [];
  if (tsquery) {
    const { data } = await supabase.rpc('knowledge_keyword_search', {
      p_query: tsquery, p_category: filters.category ?? null, p_document_type: filters.document_type ?? null,
      p_authority: filters.authority ?? null, p_department: filters.department ?? null,
      p_year: filters.year ?? null, p_language: filters.language ?? null, p_limit: RAG_KEYWORD_RESULTS,
    });
    if (Array.isArray(data)) keywordResults = data as Array<{ id: string; score: number }>;
  }

  const allIds = new Set<string>([...vectorResults.map((r) => r.id), ...keywordResults.map((r) => r.id)]);
  if (allIds.size === 0) return [];

  const vecMax = Math.max(...vectorResults.map((r) => r.score), 1);
  const kwMax = Math.max(...keywordResults.map((r) => r.score), 1e-9);
  const vecMap = new Map(vectorResults.map((r) => [r.id, r.score / vecMax]));
  const kwMap = new Map(keywordResults.map((r) => [r.id, r.score / kwMax]));

  const ranked = [...allIds].map((id) => {
    const v = vecMap.get(id) ?? 0;
    const k = kwMap.get(id) ?? 0;
    return { id, combinedScore: v * 0.6 + k * 0.4 };
  }).sort((a, b) => b.combinedScore - a.combinedScore).slice(0, RAG_FINAL_RESULTS);

  const { data: chunksData } = await supabase
    .from('knowledge_chunks')
    .select('id, document_id, chunk_text, page_number, page_end_number, section_heading, section_path')
    .in('id', ranked.map((r) => r.id));
  const docIds = [...new Set((chunksData ?? []).map((c) => c.document_id))];
  const { data: docsData } = await supabase.from('knowledge_documents').select('id, title, document_type, reference_number').in('id', docIds);
  const docMap = new Map((docsData ?? []).map((d) => [d.id, d]));
  const scoreMap = new Map(ranked.map((r) => [r.id, r]));

  return (chunksData ?? []).map((c) => {
    const doc = docMap.get(c.document_id) as { title: string; document_type: string; reference_number: string | null } | undefined;
    const s = scoreMap.get(c.id)!;
    return {
      chunkId: c.id, documentId: c.document_id, documentTitle: doc?.title ?? '', documentType: doc?.document_type ?? 'Other',
      pageNumber: c.page_number, pageEndNumber: c.page_end_number, sectionHeading: c.section_heading, sectionPath: c.section_path,
      referenceNumber: doc?.reference_number ?? null, text: c.chunk_text, combinedScore: s.combinedScore,
      vectorScore: null, keywordScore: null,
    };
  }).sort((a, b) => b.combinedScore - a.combinedScore);
}

function determineQuality(chunks: RetrievedChunk[]): 'STRONG' | 'PARTIAL' | 'LIMITED' | 'NONE' {
  if (chunks.length === 0) return 'NONE';
  const best = chunks[0].combinedScore;
  if (best >= 0.5) return 'STRONG';
  if (best >= 0.25) return 'PARTIAL';
  return 'LIMITED';
}

const SYSTEM_PROMPT = `You are AGRONIX Knowledge Assistant. You provide information based primarily on official documents retrieved from the AGRONIX Knowledge Base.

STRICT RULES:
1. Answer using the retrieved document context only.
2. Do not invent facts, Acts, Rules, Sections, Clauses, Forms, Government Orders, Circular Numbers, Notification Numbers, dates or authorities.
3. If the retrieved information is insufficient, clearly state that sufficient information was not found in the AGRONIX Knowledge Base.
4. Never fabricate citations. Use only the provided [SOURCE_N] identifiers.
5. Clearly distinguish between official document information and simplified explanation.
6. If two retrieved official documents conflict, mention the conflict and cite both.
7. Do not provide definitive legal advice. For statutory or regulatory actions, remind users to verify the latest official document.
8. Answer in the user's language where possible (English, Telugu or Hindi). If the user asks in Telugu, answer in Telugu.
9. Preserve official English names accurately: Act names, Rule numbers, Section numbers, Clause numbers, GO numbers, Circular numbers.
10. Do not claim information exists unless supported by the retrieved documents.
11. Reference sources using [SOURCE_1], [SOURCE_2] etc. as provided in the context.`;

function buildContext(chunks: RetrievedChunk[]): string {
  return chunks.map((c, i) => {
    const n = i + 1;
    const pagePart = c.pageNumber ? `\nPage: ${c.pageNumber}${c.pageEndNumber && c.pageEndNumber !== c.pageNumber ? `-${c.pageEndNumber}` : ''}` : '';
    const sectionPart = c.sectionHeading ? `\nSection: ${c.sectionHeading}` : '';
    const refPart = c.referenceNumber ? `\nReference: ${c.referenceNumber}` : '';
    return `[SOURCE_${n}]\nDocument: ${c.documentTitle}${pagePart}${sectionPart}${refPart}\n\nContent:\n${c.text}`;
  }).join('\n\n---\n\n');
}

async function generateAnswer(query: string, context: string, language: string): Promise<string> {
  if (!OLLAMA_BASE_URL) {
    return 'Knowledge AI service is currently unavailable. Please try again later.';
  }
  const userPrompt = `Retrieved context from AGRONIX Knowledge Base:\n\n${context}\n\n---\n\nUser question: ${query}\n\nAnswer the question using only the context above. Cite sources as [SOURCE_N]. Respond in ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}.`;
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      stream: false,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama chat failed: ${res.status}`);
  const data = await res.json();
  return data?.message?.content ?? 'No answer could be generated.';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = Date.now();
  try {
    const supabase = createAdminClient();
    const { user } = await verifyUser(req, supabase);
    if (!user) return errorResponse('Authentication required.', 401);

    const { query, filters = {} as SearchFilters } = await req.json();
    if (!query || typeof query !== 'string') return errorResponse('query is required.', 400);

    const language = detectLanguage(query);

    const chunks = await hybridSearch(supabase, query, filters);
    const quality = determineQuality(chunks);

    // No-answer detection: do not send unrelated chunks to the LLM
    if (quality === 'NONE' || chunks.length === 0) {
      const { data: qRow } = await supabase.from('knowledge_queries').insert({
        user_id: user.id, query, language, retrieval_quality: 'NONE',
        retrieved_document_ids: [], retrieved_chunk_ids: [], response_time_ms: Date.now() - startedAt,
      }).select().single();
      return json({
        answer: 'I could not find sufficient information in the available AGRONIX Knowledge Base documents. Try different keywords, search by document name, select a relevant category, or check whether the required document has been uploaded.',
        citations: [],
        retrievalQuality: 'NONE',
        queryId: qRow?.id ?? '',
        responseTimeMs: Date.now() - startedAt,
        language,
      });
    }

    const context = buildContext(chunks);
    let answer: string;
    try {
      answer = await generateAnswer(query, context, language);
    } catch (e) {
      // AI unavailable — still return retrieved sources so the user sees them
      answer = `Knowledge AI service is currently unavailable (${(e as Error).message}). Relevant document sections are shown below in Sources.`;
    }

    const { data: qRow } = await supabase.from('knowledge_queries').insert({
      user_id: user.id, query, language, retrieval_quality: quality,
      retrieved_document_ids: chunks.map((c) => c.documentId),
      retrieved_chunk_ids: chunks.map((c) => c.chunkId),
      response_time_ms: Date.now() - startedAt,
    }).select().single();

    const citations = chunks.map((c, i) => ({
      sourceId: `SOURCE_${i + 1}`,
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      documentType: c.documentType,
      pageNumber: c.pageNumber,
      pageEndNumber: c.pageEndNumber,
      sectionHeading: c.sectionHeading,
      sectionPath: c.sectionPath,
      referenceNumber: c.referenceNumber,
    }));

    return json({
      answer,
      citations,
      retrievalQuality: quality,
      queryId: qRow?.id ?? '',
      responseTimeMs: Date.now() - startedAt,
      language,
    });
  } catch (err) {
    console.error('knowledge-ask error:', err);
    return errorResponse((err as Error).message || 'Ask failed.', 500);
  }
});
