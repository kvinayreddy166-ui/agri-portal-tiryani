-- =====================================================================
-- Migration: 20261107130000_extend_officer_document_archive_compression.sql
-- Description: Extend officer_document_archive with intelligent compression
--              tracking, original/stored SHA-256 cryptographic hashes,
--              and exact byte restoration verification.
-- =====================================================================

-- 1. Add New Compression & Integrity Columns
ALTER TABLE public.officer_document_archive
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS original_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS stored_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS compression_method VARCHAR(30) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS original_sha256 VARCHAR(64),
  ADD COLUMN IF NOT EXISTS stored_sha256 VARCHAR(64),
  ADD COLUMN IF NOT EXISTS restoration_verified BOOLEAN DEFAULT TRUE;

-- 2. Backfill existing rows for seamless backward compatibility
UPDATE public.officer_document_archive
SET
  original_filename = COALESCE(original_filename, document_name),
  original_size_bytes = COALESCE(original_size_bytes, original_size),
  stored_size_bytes = COALESCE(stored_size_bytes, stored_size),
  stored_sha256 = COALESCE(stored_sha256, content_hash),
  original_sha256 = COALESCE(original_sha256, content_hash),
  compression_method = COALESCE(compression_method, 'none')
WHERE original_filename IS NULL OR original_size_bytes IS NULL;

-- 3. Add Constraints & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_officer_doc_archive_orig_hash 
  ON public.officer_document_archive(user_id, original_sha256);

CREATE INDEX IF NOT EXISTS idx_officer_doc_archive_year_month 
  ON public.officer_document_archive(user_id, document_date DESC);

CREATE INDEX IF NOT EXISTS idx_officer_doc_archive_comp_method 
  ON public.officer_document_archive(compression_method);
