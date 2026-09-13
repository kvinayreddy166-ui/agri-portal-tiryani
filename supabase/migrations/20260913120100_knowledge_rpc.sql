-- =====================================================================
-- AGRONIX Knowledge Base — search RPC functions
-- =====================================================================
-- These run via the service role from Edge Functions (RLS bypassed).
-- They return chunk ids + scores for vector and keyword search.
-- =====================================================================

-- Vector (semantic) similarity search
CREATE OR REPLACE FUNCTION public.knowledge_vector_search(
  p_embedding vector(1024),
  p_category UUID DEFAULT NULL,
  p_document_type TEXT DEFAULT NULL,
  p_authority TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_year INTEGER DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (id UUID, score DOUBLE PRECISION)
LANGUAGE sql
STABLE
AS $$
  SELECT c.id,
         1 - (c.embedding <=> p_embedding) AS score
  FROM public.knowledge_chunks c
  JOIN public.knowledge_documents d ON d.id = c.document_id
  WHERE d.is_active = TRUE
    AND d.deleted_at IS NULL
    AND d.is_superseded = FALSE
    AND c.embedding IS NOT NULL
    AND (p_category IS NULL OR c.document_id IN (
      SELECT dc.document_id FROM public.knowledge_document_categories dc WHERE dc.category_id = p_category))
    AND (p_document_type IS NULL OR d.document_type = p_document_type)
    AND (p_authority IS NULL OR d.authority = p_authority)
    AND (p_department IS NULL OR d.department = p_department)
    AND (p_year IS NULL OR EXTRACT(YEAR FROM d.document_date) = p_year)
    AND (p_language IS NULL OR d.language = p_language)
  ORDER BY c.embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- Keyword (full-text) search
CREATE OR REPLACE FUNCTION public.knowledge_keyword_search(
  p_query TEXT,
  p_category UUID DEFAULT NULL,
  p_document_type TEXT DEFAULT NULL,
  p_authority TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_year INTEGER DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (id UUID, score DOUBLE PRECISION)
LANGUAGE sql
STABLE
AS $$
  SELECT c.id,
         ts_rank(c.fts, to_tsquery('simple', p_query)) AS score
  FROM public.knowledge_chunks c
  JOIN public.knowledge_documents d ON d.id = c.document_id
  WHERE d.is_active = TRUE
    AND d.deleted_at IS NULL
    AND d.is_superseded = FALSE
    AND c.fts @@ to_tsquery('simple', p_query)
    AND (p_category IS NULL OR c.document_id IN (
      SELECT dc.document_id FROM public.knowledge_document_categories dc WHERE dc.category_id = p_category))
    AND (p_document_type IS NULL OR d.document_type = p_document_type)
    AND (p_authority IS NULL OR d.authority = p_authority)
    AND (p_department IS NULL OR d.department = p_department)
    AND (p_year IS NULL OR EXTRACT(YEAR FROM d.document_date) = p_year)
    AND (p_language IS NULL OR d.language = p_language)
  ORDER BY score DESC
  LIMIT p_limit;
$$;

-- Grant execute to authenticated + service role
GRANT EXECUTE ON FUNCTION public.knowledge_vector_search(vector(1024), UUID, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.knowledge_keyword_search(TEXT, UUID, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER) TO authenticated, anon, service_role;
