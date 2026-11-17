-- =====================================================================
-- Migration: 20261206000000_dealer_jurisdiction_update.sql
-- Description: Officers may UPDATE dealers inside their jurisdiction
--   (same scope as SELECT), not just rows they created. Admin unchanged.
--   Extracts the jurisdiction match into a reusable function so the
--   SELECT and UPDATE policies stay in sync.
-- =====================================================================

-- True when the caller's officer profile jurisdiction covers the given
-- dealer district/mandal. MAO/AEO match mandal; ADA/DAO/DNO match district.
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

-- Recreate SELECT policy on top of the shared helper (same semantics).
DROP POLICY IF EXISTS "Officers can view jurisdiction dealers" ON public.dealers;
CREATE POLICY "Officers can view jurisdiction dealers"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (
    public.is_portal_admin()
    OR created_by = auth.uid()
    OR (public.is_officer_user() AND public.officer_jurisdiction_matches(dealers.district, dealers.mandal))
  );

-- Officers can update dealers in their jurisdiction, not only own rows.
DROP POLICY IF EXISTS "Admin and officers can update own dealers" ON public.dealers;
CREATE POLICY "Admin and officers can update dealers"
  ON public.dealers FOR UPDATE
  TO authenticated
  USING (
    public.is_portal_admin()
    OR (public.is_officer_user() AND (
      created_by = auth.uid()
      OR public.officer_jurisdiction_matches(dealers.district, dealers.mandal)
    ))
  )
  WITH CHECK (
    public.is_portal_admin()
    OR (public.is_officer_user() AND (
      created_by = auth.uid()
      OR public.officer_jurisdiction_matches(dealers.district, dealers.mandal)
    ))
  );
