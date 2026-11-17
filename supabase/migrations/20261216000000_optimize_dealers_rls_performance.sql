-- =====================================================================
-- Migration: 20261216000000_optimize_dealers_rls_performance.sql
-- Description: Optimize dealers table RLS policies and helper functions
--   to eliminate 57014 statement timeouts (HTTP 500) caused by per-row
--   PL/pgSQL execution on 15,000+ dealer rows.
--
--   Key optimizations:
--   1. current_officer_jurisdiction() is pure SQL (inlinable by planner)
--      preserving JWT fallback from 20261215000000.
--   2. All scalar auth checks (is_portal_admin, is_officer_user, auth.uid)
--      in RLS policies are wrapped in (SELECT ...) so Postgres computes
--      them once as InitPlans per query, rather than on every row.
--   3. Functional indexes on public.location_key(district, mandal).
-- =====================================================================

-- -----------------------------------------------------------------------
-- 1. Pure SQL current_officer_jurisdiction() — inlinable, fast, with JWT fallback
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_officer_jurisdiction()
RETURNS TABLE(district text, mandal text, district_level boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH profile_data AS (
    SELECT 
      op.district, 
      op.mandal,
      upper(COALESCE(op.designation, '')) IN ('ADA', 'DAO', 'DNO') AS district_level,
      1 AS priority
    FROM public.officer_profiles op
    WHERE op.id = auth.uid()
  ),
  jwt_data AS (
    SELECT 
      COALESCE(auth.jwt() -> 'user_metadata' ->> 'district', '') AS district,
      COALESCE(auth.jwt() -> 'user_metadata' ->> 'mandal', '') AS mandal,
      upper(COALESCE(auth.jwt() -> 'user_metadata' ->> 'designation', '')) IN ('ADA', 'DAO', 'DNO') AS district_level,
      2 AS priority
    WHERE (auth.jwt() -> 'user_metadata' ->> 'role') = 'officer'
      AND COALESCE(auth.jwt() -> 'user_metadata' ->> 'district', '') <> ''
  )
  SELECT district, mandal, district_level
  FROM (
    SELECT * FROM profile_data
    UNION ALL
    SELECT * FROM jwt_data
  ) combined
  ORDER BY priority
  LIMIT 1;
$$;

-- -----------------------------------------------------------------------
-- 2. Pure SQL officer_jurisdiction_matches()
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.officer_jurisdiction_matches(p_district text, p_mandal text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.current_officer_jurisdiction() j
    WHERE (
      j.district_level
      AND public.location_key(p_district) = public.location_key(j.district)
      AND public.location_key(j.district) <> ''
    ) OR (
      NOT j.district_level
      AND public.location_key(p_district) = public.location_key(j.district)
      AND public.location_key(p_mandal) = public.location_key(j.mandal)
      AND public.location_key(j.mandal) <> ''
    )
  );
$$;

-- -----------------------------------------------------------------------
-- 3. Functional indexes for location_key matching
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dealers_location_keys 
ON public.dealers (public.location_key(district), public.location_key(mandal));

CREATE INDEX IF NOT EXISTS idx_dealers_location_key_district 
ON public.dealers (public.location_key(district));

-- -----------------------------------------------------------------------
-- 4. RLS policies with (SELECT ...) InitPlans to avoid per-row execution
-- -----------------------------------------------------------------------

-- Admin can view all dealers
DROP POLICY IF EXISTS "Admin can view all dealers" ON public.dealers;
CREATE POLICY "Admin can view all dealers"
  ON public.dealers FOR SELECT
  TO authenticated
  USING ((SELECT public.is_portal_admin()));

-- Dealers can view own dealer record
DROP POLICY IF EXISTS "Dealers can view own dealer record" ON public.dealers;
CREATE POLICY "Dealers can view own dealer record"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (
    (SELECT COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role', '') = 'dealer')
    AND (
      portal_email = (SELECT auth.jwt() ->> 'email')
      OR id = (SELECT public.current_dealer_id())
    )
  );

-- Members can view non-officer dealers
DROP POLICY IF EXISTS "Members can view non-officer dealers" ON public.dealers;
CREATE POLICY "Members can view non-officer dealers"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (
    (SELECT NOT public.is_portal_admin() AND NOT public.is_officer_user())
    AND (created_by IS NULL OR NOT public.dealer_created_by_officer(created_by))
  );

-- Officers can view jurisdiction dealers
DROP POLICY IF EXISTS "Officers can view jurisdiction dealers" ON public.dealers;
CREATE POLICY "Officers can view jurisdiction dealers"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_portal_admin())
    OR created_by = (SELECT auth.uid())
    OR (
      (SELECT public.is_officer_user())
      AND EXISTS (
        SELECT 1
        FROM public.current_officer_jurisdiction() j
        WHERE (
          j.district_level
          AND public.location_key(dealers.district) = public.location_key(j.district)
          AND public.location_key(j.district) <> ''
        ) OR (
          NOT j.district_level
          AND public.location_key(dealers.district) = public.location_key(j.district)
          AND public.location_key(dealers.mandal) = public.location_key(j.mandal)
          AND public.location_key(j.mandal) <> ''
        )
      )
    )
  );

-- Officers can update dealers
DROP POLICY IF EXISTS "Admin and officers can update dealers" ON public.dealers;
CREATE POLICY "Admin and officers can update dealers"
  ON public.dealers FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_portal_admin())
    OR (
      (SELECT public.is_officer_user())
      AND (
        created_by = (SELECT auth.uid())
        OR public.officer_jurisdiction_matches(dealers.district, dealers.mandal)
      )
    )
  )
  WITH CHECK (
    (SELECT public.is_portal_admin())
    OR (
      (SELECT public.is_officer_user())
      AND (
        created_by = (SELECT auth.uid())
        OR public.officer_jurisdiction_matches(dealers.district, dealers.mandal)
      )
    )
  );

-- Officers can delete own dealers
DROP POLICY IF EXISTS "Officers can delete own dealers" ON public.dealers;
CREATE POLICY "Officers can delete own dealers"
  ON public.dealers FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_officer_user())
    AND created_by = (SELECT auth.uid())
  );
