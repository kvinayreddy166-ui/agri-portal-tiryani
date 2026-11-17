-- =====================================================================
-- Migration: 20261215000000_officer_jurisdiction_jwt_fallback.sql
-- Description: Fix dealer directory showing 0 dealers for officers whose
--   auth.users row has role='officer' metadata but no officer_profiles row.
--
--   Two-pronged fix:
--   1. Update current_officer_jurisdiction() to fall back to JWT
--      user_metadata (district/mandal/designation) when no officer_profiles
--      row exists for the calling user. This guarantees the jurisdiction
--      match works even before a profile row is created.
--   2. Backfill officer_profiles rows for the known orphaned officers so
--      all dependent features (tour diary, records, etc.) also work.
-- =====================================================================

-- -----------------------------------------------------------------------
-- 1. Updated current_officer_jurisdiction() — profile row wins; JWT is
--    the fallback for officers registered via older paths that skipped
--    the Edge Function profile insert.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_officer_jurisdiction()
RETURNS TABLE(district text, mandal text, district_level boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_district    text;
  v_mandal      text;
  v_designation text;
BEGIN
  -- Prefer the officer_profiles record (authoritative, admin-editable).
  SELECT op.district, op.mandal, op.designation
  INTO v_district, v_mandal, v_designation
  FROM public.officer_profiles op
  WHERE op.id = auth.uid()
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT
      v_district,
      v_mandal,
      upper(COALESCE(v_designation, '')) IN ('ADA', 'DAO', 'DNO');
    RETURN;
  END IF;

  -- Fallback: read district/mandal/designation directly from JWT user_metadata
  -- when no officer_profiles row exists. Guards: district must be non-empty so
  -- location_key('') = '' never causes an accidental global match.
  v_district    := COALESCE(auth.jwt() -> 'user_metadata' ->> 'district', '');
  v_mandal      := COALESCE(auth.jwt() -> 'user_metadata' ->> 'mandal',   '');
  v_designation := COALESCE(auth.jwt() -> 'user_metadata' ->> 'designation', '');

  IF (auth.jwt() -> 'user_metadata' ->> 'role') = 'officer' AND v_district <> '' THEN
    RETURN QUERY SELECT
      v_district,
      v_mandal,
      upper(v_designation) IN ('ADA', 'DAO', 'DNO');
  END IF;
END;
$$;

-- -----------------------------------------------------------------------
-- 2. Backfill officer_profiles for officers whose auth.users row has
--    full metadata but whose profile row was never created (likely
--    registered via an older sign-up path before the Edge Function).
-- -----------------------------------------------------------------------
INSERT INTO public.officer_profiles (
  id, email, full_name, designation, hrms_id,
  district, mandal, phone, role, status
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email) AS full_name,
  COALESCE(u.raw_user_meta_data ->> 'designation', 'MAO') AS designation,
  COALESCE(u.raw_user_meta_data ->> 'hrms_id', '')        AS hrms_id,
  COALESCE(u.raw_user_meta_data ->> 'district', '')       AS district,
  COALESCE(u.raw_user_meta_data ->> 'mandal', '')         AS mandal,
  COALESCE(u.raw_user_meta_data ->> 'phone', '')          AS phone,
  'officer'                                                AS role,
  'active'                                                 AS status
FROM auth.users u
WHERE (u.raw_user_meta_data ->> 'role') = 'officer'
  AND NOT EXISTS (
    SELECT 1 FROM public.officer_profiles op WHERE op.id = u.id
  )
  AND COALESCE(u.raw_user_meta_data ->> 'district', '') <> ''
ON CONFLICT (id) DO NOTHING;
