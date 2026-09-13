-- =====================================================================
-- AGRONIX Knowledge Base — RAG schema
-- =====================================================================
-- Depends on: pgvector extension
-- Embedding dimension: 1024 (matches bge-m3, a multilingual model that
--   supports English / Telugu / Hindi). If you change OLLAMA_EMBEDDING_MODEL
--   to a model with a different dimension, you MUST recreate this column:
--     ALTER TABLE public.knowledge_chunks ALTER COLUMN embedding
--       TYPE vector(<new_dim>);
-- =====================================================================

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL,
  department TEXT,
  authority TEXT,
  reference_number TEXT,
  document_number TEXT,
  document_date DATE,
  effective_date DATE,
  state TEXT,
  language TEXT,
  keywords TEXT[] DEFAULT '{}'::TEXT[],
  version TEXT,
  status TEXT NOT NULL DEFAULT 'UPLOADED',
  is_active BOOLEAN DEFAULT TRUE,
  is_superseded BOOLEAN DEFAULT FALSE,
  superseded_by UUID NULL REFERENCES public.knowledge_documents(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT,
  file_size BIGINT,
  mime_type TEXT,
  page_count INTEGER,
  chunk_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON public.knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_active ON public.knowledge_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_document_type ON public.knowledge_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_document_date ON public.knowledge_documents(document_date);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_file_hash ON public.knowledge_documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_at ON public.knowledge_documents(created_at);

-- ---------------------------------------------------------------------
-- Document <-> Category join
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.knowledge_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (document_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_doc_categories_doc ON public.knowledge_document_categories(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_doc_categories_cat ON public.knowledge_document_categories(category_id);

-- ---------------------------------------------------------------------
-- Chunks (with vector embedding + full-text search)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  page_number INTEGER,
  page_end_number INTEGER,
  section_heading TEXT,
  section_path TEXT,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}'::JSONB,
  embedding vector(1024),
  fts TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id ON public.knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_chunk_index ON public.knowledge_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_fts ON public.knowledge_chunks USING GIN (fts);
-- Exact vector search index (ivfflat). For small DBs exact search is fine;
-- consider HNSW for larger datasets once pgvector >= 0.5.
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Auto-maintain fts column from chunk_text
CREATE OR REPLACE FUNCTION public.knowledge_chunks_fts_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts := to_tsvector('simple', COALESCE(NEW.chunk_text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS knowledge_chunks_fts_trigger ON public.knowledge_chunks;
CREATE TRIGGER knowledge_chunks_fts_trigger
  BEFORE INSERT OR UPDATE OF chunk_text ON public.knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION public.knowledge_chunks_fts_tsv();

-- ---------------------------------------------------------------------
-- Processing jobs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  total_chunks INTEGER DEFAULT 0,
  processed_chunks INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_jobs_status ON public.knowledge_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_jobs_document ON public.knowledge_processing_jobs(document_id);

-- ---------------------------------------------------------------------
-- Query analytics
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  language TEXT,
  retrieval_quality TEXT,
  retrieved_document_ids UUID[] DEFAULT '{}'::UUID[],
  retrieved_chunk_ids UUID[] DEFAULT '{}'::UUID[],
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_queries_created_at ON public.knowledge_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_queries_quality ON public.knowledge_queries(retrieval_quality);

-- ---------------------------------------------------------------------
-- Feedback
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID NOT NULL REFERENCES public.knowledge_queries(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_feedback_query ON public.knowledge_feedback(query_id);

-- ---------------------------------------------------------------------
-- Suggested questions (admin-managed)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_suggested_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_suggested_active ON public.knowledge_suggested_questions(is_active, sort_order);

-- ---------------------------------------------------------------------
-- updated_at trigger (reuse existing handle_updated_at if present)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at_knowledge_categories ON public.knowledge_categories;
CREATE TRIGGER handle_updated_at_knowledge_categories
  BEFORE UPDATE ON public.knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_knowledge_documents ON public.knowledge_documents;
CREATE TRIGGER handle_updated_at_knowledge_documents
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_suggested_questions ENABLE ROW LEVEL SECURITY;

-- Admin helper: matches the frontend isAdmin() rule (k.vinayreddy166@gmail.com)
CREATE OR REPLACE FUNCTION public.is_knowledge_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com',
    FALSE
  );
$$ LANGUAGE sql STABLE;

-- Categories: public read, admin write
CREATE POLICY "Anyone can read knowledge categories"
  ON public.knowledge_categories FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can insert knowledge categories"
  ON public.knowledge_categories FOR INSERT
  WITH CHECK (public.is_knowledge_admin());

CREATE POLICY "Admins can update knowledge categories"
  ON public.knowledge_categories FOR UPDATE
  USING (public.is_knowledge_admin());

CREATE POLICY "Admins can delete knowledge categories"
  ON public.knowledge_categories FOR DELETE
  USING (public.is_knowledge_admin());

-- Documents: authenticated read active docs; admin full write
CREATE POLICY "Authenticated can read active knowledge documents"
  ON public.knowledge_documents FOR SELECT
  USING (is_active = TRUE AND deleted_at IS NULL AND auth.role() = 'authenticated');

CREATE POLICY "Admins can insert knowledge documents"
  ON public.knowledge_documents FOR INSERT
  WITH CHECK (public.is_knowledge_admin());

CREATE POLICY "Admins can update knowledge documents"
  ON public.knowledge_documents FOR UPDATE
  USING (public.is_knowledge_admin());

CREATE POLICY "Admins can delete knowledge documents"
  ON public.knowledge_documents FOR DELETE
  USING (public.is_knowledge_admin());

-- Document categories: authenticated read, admin write
CREATE POLICY "Authenticated can read document categories"
  ON public.knowledge_document_categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert document categories"
  ON public.knowledge_document_categories FOR INSERT
  WITH CHECK (public.is_knowledge_admin());

CREATE POLICY "Admins can delete document categories"
  ON public.knowledge_document_categories FOR DELETE
  USING (public.is_knowledge_admin());

-- Chunks: authenticated read (text + metadata only; embedding NOT exposed via RLS select
-- because we never SELECT embedding from the client — search runs server-side).
CREATE POLICY "Authenticated can read knowledge chunks"
  ON public.knowledge_chunks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert knowledge chunks"
  ON public.knowledge_chunks FOR INSERT
  WITH CHECK (public.is_knowledge_admin());

CREATE POLICY "Admins can update knowledge chunks"
  ON public.knowledge_chunks FOR UPDATE
  USING (public.is_knowledge_admin());

CREATE POLICY "Admins can delete knowledge chunks"
  ON public.knowledge_chunks FOR DELETE
  USING (public.is_knowledge_admin());

-- Processing jobs: admin read/write
CREATE POLICY "Admins can read processing jobs"
  ON public.knowledge_processing_jobs FOR SELECT
  USING (public.is_knowledge_admin());

CREATE POLICY "Admins can insert processing jobs"
  ON public.knowledge_processing_jobs FOR INSERT
  WITH CHECK (public.is_knowledge_admin());

CREATE POLICY "Admins can update processing jobs"
  ON public.knowledge_processing_jobs FOR UPDATE
  USING (public.is_knowledge_admin());

CREATE POLICY "Admins can delete processing jobs"
  ON public.knowledge_processing_jobs FOR DELETE
  USING (public.is_knowledge_admin());

-- Queries: authenticated can insert (their own), admin can read all
CREATE POLICY "Authenticated can insert knowledge queries"
  ON public.knowledge_queries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can read knowledge queries"
  ON public.knowledge_queries FOR SELECT
  USING (public.is_knowledge_admin());

CREATE POLICY "Users can read their own knowledge queries"
  ON public.knowledge_queries FOR SELECT
  USING (auth.uid() = user_id);

-- Feedback: authenticated insert, admin read
CREATE POLICY "Authenticated can insert knowledge feedback"
  ON public.knowledge_feedback FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can read knowledge feedback"
  ON public.knowledge_feedback FOR SELECT
  USING (public.is_knowledge_admin());

-- Suggested questions: authenticated read, admin write
CREATE POLICY "Authenticated can read suggested questions"
  ON public.knowledge_suggested_questions FOR SELECT
  USING (is_active = TRUE AND auth.role() = 'authenticated');

CREATE POLICY "Admins can insert suggested questions"
  ON public.knowledge_suggested_questions FOR INSERT
  WITH CHECK (public.is_knowledge_admin());

CREATE POLICY "Admins can update suggested questions"
  ON public.knowledge_suggested_questions FOR UPDATE
  USING (public.is_knowledge_admin());

CREATE POLICY "Admins can delete suggested questions"
  ON public.knowledge_suggested_questions FOR DELETE
  USING (public.is_knowledge_admin());

-- =====================================================================
-- Default categories
-- =====================================================================
INSERT INTO public.knowledge_categories (name, slug, description) VALUES
  ('Seeds', 'seeds', 'Seed-related Acts, Rules, Orders and procedures'),
  ('Fertilizers', 'fertilizers', 'Fertilizer Control Order and related documents'),
  ('Pesticides', 'pesticides', 'Insecticides Act, Rules and pesticide procedures'),
  ('Quality Control', 'quality-control', 'Quality control guidelines and procedures'),
  ('Licensing', 'licensing', 'Seed, fertilizer and pesticide licensing guidelines'),
  ('Inspection', 'inspection', 'Inspection procedures for dealers'),
  ('Seed Sampling', 'seed-sampling', 'Seed sampling procedures and forms'),
  ('Fertilizer Sampling', 'fertilizer-sampling', 'Fertilizer sampling procedures and forms'),
  ('Pesticide Sampling', 'pesticide-sampling', 'Pesticide sampling procedures and forms'),
  ('Agriculture Schemes', 'agriculture-schemes', 'Departmental scheme guidelines'),
  ('Crop Management', 'crop-management', 'Crop management reference documents'),
  ('Department Administration', 'department-administration', 'Administrative orders and manuals'),
  ('Government Orders', 'government-orders', 'Government Orders (GO Ms No.)'),
  ('Circulars', 'circulars', 'Department circulars and office memos'),
  ('Acts and Rules', 'acts-and-rules', 'Central and state Acts and Rules'),
  ('General Agriculture', 'general-agriculture', 'General agriculture reference documents')
ON CONFLICT (slug) DO NOTHING;

-- Default suggested questions
INSERT INTO public.knowledge_suggested_questions (question, category, sort_order) VALUES
  ('What are the requirements for a seed licence?', 'Seeds', 1),
  ('What is Form D?', 'Seeds', 2),
  ('What should be verified during a seed dealer inspection?', 'Inspection', 3),
  ('What is the procedure for drawing seed samples?', 'Seed Sampling', 4),
  ('How should seed stocks be maintained?', 'Seeds', 5),
  ('What information should be included in a sales invoice?', 'Seeds', 6)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- Storage bucket for knowledge documents (private)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-documents', 'knowledge-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: admin upload/read, authenticated read via signed URLs
CREATE POLICY "Admins can upload knowledge documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'knowledge-documents' AND public.is_knowledge_admin()
  );

CREATE POLICY "Admins can read knowledge documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'knowledge-documents' AND public.is_knowledge_admin()
  );

CREATE POLICY "Authenticated can read knowledge documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'knowledge-documents' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins can update knowledge documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'knowledge-documents' AND public.is_knowledge_admin()
  );

CREATE POLICY "Admins can delete knowledge documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'knowledge-documents' AND public.is_knowledge_admin()
  );
