-- =====================================================================
-- Migration: 20261113000000_officer_dealer_management.sql
-- Description: Per-officer dealer data silo.
--   - Officers can add/edit ONLY dealers they created (created_by = auth.uid()).
--   - Dealers created by one officer are NOT visible to other officers.
--   - Admin sees all dealers. Anonymous/public and other signed-in users
--     only see dealers NOT created by an officer (legacy/imported/admin data).
--   - Dealer portal users can still read their own dealer record so the
--     dealer stock portal keeps working.
--   - Dealer login RPCs are SECURITY DEFINER and unaffected.
-- =====================================================================

-- 1. Attribution columns
ALTER TABLE public.dealers
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

CREATE INDEX IF NOT EXISTS idx_dealers_created_by ON public.dealers(created_by);

-- 2. Officer detection helper (caller's own officer status).
CREATE OR REPLACE FUNCTION public.is_officer_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'officer'
    OR EXISTS (
      SELECT 1 FROM public.officer_profiles op WHERE op.id = auth.uid()
    ),
    FALSE
  );
$$;

-- 3. Helper: was a dealer row created by an officer account?
--    SECURITY DEFINER so the officer_profiles lookup is not blocked by
--    officer_profiles RLS for anon/other callers.
CREATE OR REPLACE FUNCTION public.dealer_created_by_officer(p_created_by uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_created_by IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.officer_profiles op WHERE op.id = p_created_by
  );
$$;

-- 4. SELECT policies — replace the old public read-all policies.
DROP POLICY IF EXISTS "Anyone can view dealers" ON public.dealers;
DROP POLICY IF EXISTS "Public can view dealers directory" ON public.dealers;

-- Anonymous visitors: only dealers not created by an officer.
CREATE POLICY "Public can view non-officer dealers"
  ON public.dealers FOR SELECT
  TO anon
  USING (
    created_by IS NULL
    OR NOT public.dealer_created_by_officer(created_by)
  );

-- Portal admin: everything.
CREATE POLICY "Admin can view all dealers"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (public.is_portal_admin());

-- Officers: only dealers they created themselves.
CREATE POLICY "Officers can view own dealers"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (public.is_officer_user() AND created_by = auth.uid());

-- Dealer portal users: their own dealer record (stock portal profile).
CREATE POLICY "Dealers can view own dealer record"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'dealer'
    AND (auth.jwt() -> 'user_metadata' ->> 'dealer_id') = dealers.id::text
  );

-- Any other signed-in user (e.g. test/view accounts): non-officer dealers only.
CREATE POLICY "Members can view non-officer dealers"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (
    NOT public.is_portal_admin()
    AND NOT public.is_officer_user()
    AND (
      created_by IS NULL
      OR NOT public.dealer_created_by_officer(created_by)
    )
  );

-- 5. Write policies — officers can insert/update only their own rows.
DROP POLICY IF EXISTS "Admin can insert dealers" ON public.dealers;
CREATE POLICY "Admin and officers can insert dealers"
  ON public.dealers FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_portal_admin()
    OR (public.is_officer_user() AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Admin can update dealers" ON public.dealers;
CREATE POLICY "Admin and officers can update own dealers"
  ON public.dealers FOR UPDATE
  TO authenticated
  USING (
    public.is_portal_admin()
    OR (public.is_officer_user() AND created_by = auth.uid())
  )
  WITH CHECK (
    public.is_portal_admin()
    OR (public.is_officer_user() AND created_by = auth.uid())
  );

-- DELETE remains admin-only ("Admin can delete dealers" unchanged).
