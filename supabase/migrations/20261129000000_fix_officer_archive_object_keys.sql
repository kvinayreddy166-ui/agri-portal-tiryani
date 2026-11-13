-- =====================================================================
-- Migration: 20261129000000_fix_officer_archive_object_keys.sql
-- Description: Repair corrupted object_key values in officer_document_archive.
--              Some rows were persisted with whitespace embedded in the key
--              (e.g. "officers/ <uid>/2026/11/ <doc>.pdf"), which makes both
--              the Cloudflare Worker and Supabase Storage lookups fail.
--              Rebuilds the canonical key used at upload time:
--              officers/{user_id}/{YYYY}/{MM}/{id}.{file_format}
-- =====================================================================

UPDATE public.officer_document_archive
SET object_key =
      'officers/' || user_id::text || '/' ||
      to_char(document_date, 'YYYY') || '/' ||
      to_char(document_date, 'MM') || '/' ||
      id::text || '.' || file_format
WHERE object_key LIKE 'officers/%'
  AND object_key ~ '\s'
  AND upload_status = 'saved_to_cloud';
