-- =====================================================================
-- Migration: 20261118000000_migrate_tiryani_officer_data.sql
-- Description: Moves all officer-scoped data owned by the portal admin
--              account (k.vinayreddy166@gmail.com) to the elevated
--              officer account (agofficetiryani@gmail.com), and creates
--              an officer_profiles row for that account (role='officer').
--
-- Admin stays the sole portal admin: is_portal_admin() is email-based on
-- k.vinayreddy166@gmail.com and is NOT changed here. The target account
-- receives no admin privileges.
--
-- PREREQUISITE: agofficetiryani@gmail.com must already have an auth
-- account (sign up once via the portal first). The script aborts with a
-- clear error if either account is missing.
-- =====================================================================

DO $$
DECLARE
  v_admin_id   uuid;
  v_target_id  uuid;
  v_admin_profile public.officer_profiles%ROWTYPE;
  v_target_meta  jsonb;
  v_conflicts    text;
BEGIN
  -- 1. Resolve auth user ids -------------------------------------------------
  SELECT id INTO v_admin_id
    FROM auth.users
   WHERE lower(email) = 'k.vinayreddy166@gmail.com'
   LIMIT 1;

  SELECT id INTO v_target_id
    FROM auth.users
   WHERE lower(email) = 'agofficetiryani@gmail.com'
   LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin account k.vinayreddy166@gmail.com not found in auth.users';
  END IF;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'Target account agofficetiryani@gmail.com not found in auth.users — sign up for that account first, then re-run this migration';
  END IF;

  IF v_admin_id = v_target_id THEN
    RAISE EXCEPTION 'Source and target accounts are identical — nothing to migrate';
  END IF;

  -- 2. Conflict checks (unique constraints would abort mid-migration) --------
  -- tour_diaries: UNIQUE(officer_id, year, month)
  SELECT string_agg(format('tour_diaries %s-%s', a.year, a.month), ', ')
    INTO v_conflicts
    FROM public.tour_diaries a
    JOIN public.tour_diaries b
      ON b.officer_id = v_target_id AND b.year = a.year AND b.month = a.month
   WHERE a.officer_id = v_admin_id;

  IF v_conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'Tour diary month conflicts for target account: %. Resolve duplicates manually before migrating.', v_conflicts;
  END IF;

  -- sample_targets: UNIQUE(created_by, financial_year, commodity, lower(code_number))
  SELECT string_agg(format('%s/%s/%s', a.financial_year, a.commodity, a.code_number), ', ')
    INTO v_conflicts
    FROM public.sample_targets a
    JOIN public.sample_targets b
      ON b.created_by = v_target_id
     AND b.financial_year = a.financial_year
     AND b.commodity = a.commodity
     AND lower(b.code_number) = lower(a.code_number)
   WHERE a.created_by = v_admin_id;

  IF v_conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'Sample target code conflicts for target account: %. Resolve duplicates manually before migrating.', v_conflicts;
  END IF;

  -- 3. Ensure officer_profiles row for the target account --------------------
  SELECT * INTO v_admin_profile
    FROM public.officer_profiles
   WHERE id = v_admin_id;

  SELECT raw_user_meta_data INTO v_target_meta
    FROM auth.users
   WHERE id = v_target_id;

  INSERT INTO public.officer_profiles (
    id, full_name, designation, hrms_id, qualification,
    district, mandal, division, phone, email, role, status
  )
  VALUES (
    v_target_id,
    COALESCE(v_admin_profile.full_name,
             v_target_meta ->> 'full_name',
             'Agriculture Officer'),
    COALESCE(v_admin_profile.designation,
             v_target_meta ->> 'designation',
             'MAO'),
    COALESCE(v_admin_profile.hrms_id, v_target_meta ->> 'hrms_id'),
    COALESCE(v_admin_profile.qualification, v_target_meta ->> 'qualification'),
    COALESCE(v_admin_profile.district,
             v_target_meta ->> 'district',
             'Kumurambheem Asifabad'),
    COALESCE(v_admin_profile.mandal,
             v_target_meta ->> 'mandal',
             'Tiryani'),
    COALESCE(v_admin_profile.division, v_target_meta ->> 'division'),
    COALESCE(v_admin_profile.phone,
             v_target_meta ->> 'phone',
             ''),
    'agofficetiryani@gmail.com',
    'officer',   -- NEVER 'admin'
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name     = COALESCE(EXCLUDED.full_name, officer_profiles.full_name),
    designation   = COALESCE(EXCLUDED.designation, officer_profiles.designation),
    hrms_id       = COALESCE(EXCLUDED.hrms_id, officer_profiles.hrms_id),
    qualification = COALESCE(EXCLUDED.qualification, officer_profiles.qualification),
    district      = COALESCE(EXCLUDED.district, officer_profiles.district),
    mandal        = COALESCE(EXCLUDED.mandal, officer_profiles.mandal),
    division      = COALESCE(EXCLUDED.division, officer_profiles.division),
    phone         = COALESCE(NULLIF(EXCLUDED.phone, ''), officer_profiles.phone),
    email         = 'agofficetiryani@gmail.com',
    role          = 'officer',
    updated_at    = timezone('utc'::text, now());

  -- 4. Re-key officer-scoped rows --------------------------------------------
  UPDATE public.officer_inspections        SET officer_id = v_target_id WHERE officer_id = v_admin_id;
  UPDATE public.officer_statutory_orders   SET officer_id = v_target_id WHERE officer_id = v_admin_id;
  UPDATE public.officer_samples            SET officer_id = v_target_id WHERE officer_id = v_admin_id;
  UPDATE public.officer_cases              SET officer_id = v_target_id WHERE officer_id = v_admin_id;
  UPDATE public.tour_diaries               SET officer_id = v_target_id WHERE officer_id = v_admin_id;
  UPDATE public.tour_journeys              SET officer_id = v_target_id WHERE officer_id = v_admin_id;
  UPDATE public.sample_targets             SET created_by = v_target_id WHERE created_by = v_admin_id;
  UPDATE public.officer_target_allocations SET officer_id = v_target_id WHERE officer_id = v_admin_id;
  UPDATE public.officer_document_archive   SET user_id    = v_target_id WHERE user_id    = v_admin_id;

  -- Note: officer_target_allocations.allocated_by is intentionally left as the
  -- admin — it records which DNO allocated the targets. Admin retains full
  -- management via is_portal_admin() regardless.
  --
  -- Note: officer_document_archive.object_key still contains the old user id in
  -- the R2 path (officers/{old_uid}/...). Downloads use the stored object_key,
  -- so archived files keep working; only the path prefix is stale.
  --
  -- The admin's own officer_profiles row is intentionally kept (it owns no
  -- data after this migration and is already excluded from admin-wide lists
  -- in the UI). Delete it manually if you want a fully clean admin officer view.

  RAISE NOTICE 'Migration complete: officer data moved from % to %', v_admin_id, v_target_id;
END $$;
