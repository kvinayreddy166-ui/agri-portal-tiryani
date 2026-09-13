# AGRONIX — Knowledge Base (RAG) Module

A free-first Retrieval-Augmented Generation knowledge base integrated into the AGRONIX PWA. Administrators upload official agriculture documents (Acts, Rules, Circulars, GOs); authenticated users ask natural-language questions and get answers with citations pointing to the exact document, page, and section.

## Architecture

```
Admin → Upload → Supabase Storage → Edge Function (knowledge-process)
  → Extract (PDF/DOCX/TXT) → Clean → Semantic Chunk (page + section preserved)
  → Ollama embeddings → PostgreSQL + pgvector + FTS

User → Ask → Edge Function (knowledge-ask)
  → Query embedding → Hybrid search (vector + keyword RPCs) → Rerank
  → No-answer detection → LLM (Ollama) with [SOURCE_N] context → Citations
```

The app is a static Vite SPA on Vercel + Supabase (Auth, Postgres 17, Storage). Ollama runs on a separate server/VPS and is called server-side from Supabase Edge Functions (Deno). No AI secrets reach the browser.

## Files

### Database migrations
- `supabase/migrations/20260913120000_create_knowledge_base.sql` — pgvector extension, tables (categories, documents, document_categories, chunks, processing_jobs, queries, feedback, suggested_questions), indexes, RLS, storage bucket, default categories.
- `supabase/migrations/20260913120100_knowledge_rpc.sql` — `knowledge_vector_search` and `knowledge_keyword_search` RPC functions used by the search/ask Edge Functions.

### Edge Functions (Deno)
- `supabase/functions/_shared/knowledge.ts` — shared helpers (admin client, JWT verify, Ollama config).
- `supabase/functions/knowledge-process/index.ts` — extraction (unpdf/mammoth), scanned-PDF detection, cleaning, semantic chunking, batched embeddings, save.
- `supabase/functions/knowledge-search/index.ts` — hybrid vector + FTS search via RPCs, merge + normalize + rank.
- `supabase/functions/knowledge-ask/index.ts` — full RAG pipeline: search → no-answer detection → LLM with [SOURCE_N] context → citation mapping → query analytics.

### Frontend feature folder
- `project/src/features/knowledge-base/types/index.ts` — shared types + constants.
- `project/src/features/knowledge-base/services/knowledgeService.ts` — Supabase + Edge Function client.
- `project/src/features/knowledge-base/utils/index.ts` — file validation, SHA-256 hashing, language detection.
- `project/src/features/knowledge-base/hooks/useKnowledgeNav.ts` — route paths + nav helper.
- `project/src/features/knowledge-base/components/KnowledgeNav.tsx` — sub-navigation bar.
- `project/src/features/knowledge-base/pages/` — KnowledgeDashboard, KnowledgeDocumentLibrary, KnowledgeUpload, KnowledgeCategories, KnowledgeProcessingQueue, KnowledgeAnalytics, KnowledgeSettings, KnowledgeAssistant, KnowledgeSearch, KnowledgeDocumentViewer.

### Modified existing files
- `project/src/App.tsx` — lazy imports, valid pages, PAGE_PATHS, route→page mapping, renderPage cases, back fallback.
- `project/src/components/Layout.tsx` — Knowledge Base menu item, section grouping, page meta/breadcrumbs.
- `project/.env.example` — RAG env var documentation.

## Setup

### 1. Apply migrations
```bash
supabase db push
# or apply the two files in order against your remote Postgres
```

### 2. Deploy Edge Functions
```bash
supabase functions deploy knowledge-process
supabase functions deploy knowledge-search
supabase functions deploy knowledge-ask
```

### 3. Configure Ollama secrets
```bash
supabase secrets set OLLAMA_BASE_URL=http://your-ollama-server:11434
supabase secrets set OLLAMA_CHAT_MODEL=llama3.2
supabase secrets set OLLAMA_EMBEDDING_MODEL=bge-m3
supabase secrets set RAG_EMBEDDING_DIM=1024
supabase secrets set RAG_ENABLED=true
```

`RAG_EMBEDDING_DIM` MUST match the embedding model dimension. The `knowledge_chunks.embedding` column is `vector(1024)` by default (bge-m3). To use a different model, recreate the column:
```sql
ALTER TABLE public.knowledge_chunks ALTER COLUMN embedding TYPE vector(<new_dim>);
```

### 4. Install Ollama models on your server
```bash
ollama pull bge-m3
ollama pull llama3.2
```

## Usage

1. Sign in as admin (`k.vinayreddy166@gmail.com`).
2. Open **Knowledge Base → Upload Document**, choose a PDF/DOCX/TXT, fill metadata, click **Upload and Process**.
3. Watch **Processing Queue** — status goes UPLOADED → EXTRACTING → CLEANING → CHUNKING → GENERATING_EMBEDDINGS → SAVING → COMPLETED.
4. Any authenticated user can open **Knowledge Assistant** to ask questions, or **Search Documents** for keyword/semantic search.
5. Citations link to the internal PDF viewer, jumping to the cited page.

## Behavior when AI is unavailable

If `OLLAMA_BASE_URL` is unset or Ollama is down:
- Document processing still extracts, cleans, and chunks text and saves chunks **without embeddings**. Keyword search remains fully functional.
- The assistant returns retrieved source chunks with a notice that the AI service is unavailable, instead of an AI-generated answer.
- The app never freezes the UI; all errors surface as messages with retry options.

## Security

- RLS enabled on all knowledge tables. Admin = `is_knowledge_admin()` JWT check (matches frontend `isAdmin`).
- `knowledge_chunks.embedding` is never selected from the client — vector search runs server-side via the service role in Edge Functions.
- Storage bucket `knowledge-documents` is private; access via signed URLs.
- `SUPABASE_SERVICE_ROLE_KEY` is a server secret, never exposed to the browser.

## Known limitations

- OCR is detected (scanned PDFs flagged `OCR_REQUIRED`) but not yet executed — a future `OCRProvider` (Tesseract/OCRmyPDF) can be added without changing the pipeline.
- Streaming LLM responses are not yet wired to the UI (Ollama supports it; the chat function uses `stream: false` for simplicity).
- Cross-encoder reranking is not yet implemented; hybrid score combining is used as the initial reranker per the spec.

## Build / verify
```bash
cd project
npm run typecheck
npm run build
```
