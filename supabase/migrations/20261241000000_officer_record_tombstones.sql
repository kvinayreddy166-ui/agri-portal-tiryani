-- =====================================================================
-- Migration: 20261241000000_officer_record_tombstones.sql
-- Description: Deletion tombstones for officer statutory records.
--
--   Problem: deleting a record only removes the cloud row + the local
--   copy on the deleting device. The issuing officer's device still holds
--   the issued local copy and flushPendingLocalRecords() re-upserts it,
--   so "deleted" records reappear.
--
--   Fix: record deletions in officer_record_tombstones. Sync functions
--   check the tombstone before writing to the cloud tables, and the
--   records hub skips tombstoned local copies.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.officer_record_tombstones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL,
  record_kind TEXT NOT NULL CHECK (record_kind IN ('order', 'inspection', 'sample')),
  record_ref TEXT NOT NULL,
  commodity TEXT,
  deleted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (officer_id, record_kind, record_ref)
);

CREATE INDEX IF NOT EXISTS idx_officer_record_tombstones_lookup
  ON public.officer_record_tombstones(officer_id, record_kind, record_ref);

ALTER TABLE public.officer_record_tombstones ENABLE ROW LEVEL SECURITY;

-- Officers can see/write tombstones for their own records; admins for all.
DROP POLICY IF EXISTS "Tombstones selectable by owner or admin" ON public.officer_record_tombstones;
CREATE POLICY "Tombstones selectable by owner or admin"
  ON public.officer_record_tombstones FOR SELECT
  TO authenticated
  USING (officer_id = auth.uid() OR public.is_portal_admin());

DROP POLICY IF EXISTS "Tombstones insertable by owner or admin" ON public.officer_record_tombstones;
CREATE POLICY "Tombstones insertable by owner or admin"
  ON public.officer_record_tombstones FOR INSERT
  TO authenticated
  WITH CHECK (officer_id = auth.uid() OR public.is_portal_admin());

DROP POLICY IF EXISTS "Tombstones deletable by admin" ON public.officer_record_tombstones;
CREATE POLICY "Tombstones deletable by admin"
  ON public.officer_record_tombstones FOR DELETE
  TO authenticated
  USING (public.is_portal_admin());

GRANT SELECT, INSERT, DELETE ON public.officer_record_tombstones TO authenticated;
