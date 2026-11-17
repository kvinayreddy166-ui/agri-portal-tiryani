-- =====================================================================
-- Migration: 20261205000000_dealer_jurisdiction_rls.sql
-- Description: Scope dealer visibility by officer jurisdiction.
--   - MAO/AEO (mandal-level): dealers in their mandal + own created rows.
--   - ADA/DAO/DNO (district-level): all dealers in their district.
--   - Portal admin: everything (unchanged).
--   - Removes the elevated-officer blanket policy so agofficetiryani
--     follows the same mandal rules as every other officer.
--   - Public/member "non-officer dealers" directory policies unchanged.
-- =====================================================================

-- Normalizes place names for comparison (case/spacing/punctuation-insensitive).
CREATE OR REPLACE FUNCTION public.location_key(v text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(COALESCE(v, '')), '[^a-z0-9]', '', 'g');
$$;

-- Caller's officer jurisdiction from officer_profiles (id = auth.uid()).
CREATE OR REPLACE FUNCTION public.current_officer_jurisdiction()
RETURNS TABLE(district text, mandal text, district_level boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT op.district, op.mandal,
         upper(COALESCE(op.designation, '')) IN ('ADA', 'DAO', 'DNO')
  FROM public.officer_profiles op
  WHERE op.id = auth.uid()
  LIMIT 1;
$$;

-- Elevated officer no longer bypasses jurisdiction scoping.
DROP POLICY IF EXISTS "Elevated officer can view admin dealers" ON public.dealers;

-- Officers: own created rows, or dealers inside their mandal/district.
DROP POLICY IF EXISTS "Officers can view own dealers" ON public.dealers;
CREATE POLICY "Officers can view jurisdiction dealers"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (
    public.is_portal_admin()
    OR created_by = auth.uid()
    OR (
      public.is_officer_user()
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
