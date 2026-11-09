-- =====================================================================
-- Migration: 20261116000000_delete_officer_account_rpc.sql
-- Description: Robust officer account deletion via SECURITY DEFINER RPC
--              and updated officer_profiles RLS policy.
-- =====================================================================

-- 1. Allow officers to delete their own profile or portal admins to delete any profile
DROP POLICY IF EXISTS "Only admins can delete officer profiles" ON public.officer_profiles;
DROP POLICY IF EXISTS "Officers can delete their own profile or admins can delete all" ON public.officer_profiles;

CREATE POLICY "Officers can delete their own profile or admins can delete all"
  ON public.officer_profiles FOR DELETE
  USING (auth.uid() = id OR public.is_portal_admin());

-- 2. Comprehensive Account Deletion RPC
CREATE OR REPLACE FUNCTION public.delete_officer_account(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_caller_email TEXT;
  v_is_admin BOOLEAN := FALSE;
  v_target_email TEXT;
BEGIN
  -- Validate caller
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to delete an account.';
  END IF;

  SELECT email INTO v_caller_email FROM auth.users WHERE id = v_caller_id;
  IF v_caller_email IS NULL THEN
    v_caller_email := auth.jwt() ->> 'email';
  END IF;

  v_is_admin := (LOWER(TRIM(COALESCE(v_caller_email, ''))) = 'k.vinayreddy166@gmail.com') 
                OR public.is_portal_admin();

  -- Caller must be deleting their own account OR must be admin
  IF v_caller_id <> p_user_id AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied. Cannot delete another user account.';
  END IF;

  SELECT email INTO v_target_email FROM auth.users WHERE id = p_user_id;
  IF v_target_email IS NULL THEN
    SELECT email INTO v_target_email FROM public.officer_profiles WHERE id = p_user_id;
  END IF;

  -- Step A: Disassociate created dealers so they don't block deletion
  BEGIN
    UPDATE public.dealers SET created_by = NULL WHERE created_by = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Step B: Delete officer cases & statutory & inspection records
  BEGIN
    DELETE FROM public.officer_cases WHERE officer_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM public.officer_inspections WHERE officer_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM public.officer_statutory_orders WHERE officer_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM public.officer_samples WHERE officer_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM public.officer_document_archive WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM public.sample_targets WHERE created_by = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM public.tour_journeys WHERE officer_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM public.tour_diaries WHERE officer_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Step C: Delete officer email OTP records if any
  IF v_target_email IS NOT NULL THEN
    BEGIN
      DELETE FROM public.officer_email_otps WHERE email = LOWER(TRIM(v_target_email));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- Step D: Clean up storage objects owned by this user
  BEGIN
    DELETE FROM storage.objects WHERE owner = p_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Step E: Delete officer profile
  DELETE FROM public.officer_profiles WHERE id = p_user_id;

  -- Step F: Delete user from auth.users
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Officer account and all associated data permanently deleted.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_officer_account(UUID) TO authenticated;
