-- =====================================================================
-- Migration: 20261107120000_create_officer_document_archive.sql
-- Description: Dedicated Cloudflare R2 Document Archive metadata table with
--              strict Row Level Security (RLS) and duplicate/version tracking.
-- Note: Document binaries are stored in Cloudflare R2 ('agronix-officer-records'),
--       NEVER in PostgreSQL.
-- =====================================================================

-- 1. Create Dedicated Document Archive Table
CREATE TABLE IF NOT EXISTS public.officer_document_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_category TEXT NOT NULL, -- e.g. 'order', 'notice', 'inspection', 'sample', 'tour_diary', 'advisory'
  document_number TEXT,
  document_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_module TEXT NOT NULL, -- e.g. 'stop_sale', 'seizure', 'revocation', 'show_cause', 'tour_diary', 'sample_memo', 'inspection'
  object_key TEXT NOT NULL, -- Cloudflare R2 object key: officers/{user_id}/{document_id}/{filename}
  file_format TEXT NOT NULL CHECK (file_format IN ('pdf', 'docx', 'xlsx', 'txt')),
  mime_type TEXT NOT NULL,
  original_size BIGINT NOT NULL CHECK (original_size >= 0),
  stored_size BIGINT NOT NULL CHECK (stored_size >= 0),
  compression_status TEXT NOT NULL DEFAULT 'uncompressed' 
    CHECK (compression_status IN ('uncompressed', 'compressed', 'failed', 'skipped')),
  content_hash TEXT NOT NULL, -- SHA-256 hex string of stored file
  upload_status TEXT NOT NULL DEFAULT 'saved_to_cloud' 
    CHECK (upload_status IN ('generated', 'compressing', 'uploading', 'saved_to_cloud', 'upload_failed', 'pending_retry')),
  version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number >= 1),
  parent_document_id UUID REFERENCES public.officer_document_archive(id) ON DELETE SET NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_officer_doc_archive_user 
  ON public.officer_document_archive(user_id);

CREATE INDEX IF NOT EXISTS idx_officer_doc_archive_category 
  ON public.officer_document_archive(document_category);

CREATE INDEX IF NOT EXISTS idx_officer_doc_archive_created 
  ON public.officer_document_archive(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_officer_doc_archive_user_hash 
  ON public.officer_document_archive(user_id, content_hash);

CREATE INDEX IF NOT EXISTS idx_officer_doc_archive_doc_num 
  ON public.officer_document_archive(user_id, document_number);

-- 3. Trigger for Automated updated_at Maintenance
DROP TRIGGER IF EXISTS handle_updated_at_officer_document_archive ON public.officer_document_archive;
CREATE TRIGGER handle_updated_at_officer_document_archive
  BEFORE UPDATE ON public.officer_document_archive
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Strict Row Level Security (RLS)
ALTER TABLE public.officer_document_archive ENABLE ROW LEVEL SECURITY;

-- Select Policy: Officers can only view their own archived records; portal admin can view all
DROP POLICY IF EXISTS "Officers can read their own archived documents" ON public.officer_document_archive;
CREATE POLICY "Officers can read their own archived documents"
  ON public.officer_document_archive FOR SELECT
  USING (auth.uid() = user_id OR public.is_portal_admin());

-- Insert Policy: Officers can only insert records for their authenticated user ID
DROP POLICY IF EXISTS "Officers can insert their own archived documents" ON public.officer_document_archive;
CREATE POLICY "Officers can insert their own archived documents"
  ON public.officer_document_archive FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_portal_admin());

-- Update Policy: Officers can only update their own records (e.g. document_name or upload_status)
DROP POLICY IF EXISTS "Officers can update their own archived documents" ON public.officer_document_archive;
CREATE POLICY "Officers can update their own archived documents"
  ON public.officer_document_archive FOR UPDATE
  USING (auth.uid() = user_id OR public.is_portal_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_portal_admin());

-- Delete Policy: Officers can only delete their own records
DROP POLICY IF EXISTS "Officers can delete their own archived documents" ON public.officer_document_archive;
CREATE POLICY "Officers can delete their own archived documents"
  ON public.officer_document_archive FOR DELETE
  USING (auth.uid() = user_id OR public.is_portal_admin());
