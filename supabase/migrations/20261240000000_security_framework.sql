-- =====================================================================
-- Migration: 20261240000000_security_framework.sql
-- Description: Comprehensive security & trust framework (no paid infra):
--   1. security_audit_logs — centralized audit trail + log_security_event RPC
--   2. Row-level audit triggers on statutory/enforcement/dealer tables
--   3. login_attempts + throttle RPCs for client-side rate limiting/lockout
--   4. RBAC hardening — move role/dealer_id claims from user_metadata
--      (user-editable) to app_metadata (service-role only) and authoritative
--      table lookups. Backfills existing accounts.
-- =====================================================================

-- =====================================================================
-- 1. security_audit_logs
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),          -- server timestamp
  user_id UUID,                                            -- auth.users.id (null for anon/failed logins)
  actor_email TEXT,
  actor_role TEXT,
  module TEXT NOT NULL,                                    -- auth, documents, statutory_orders, ...
  action TEXT NOT NULL,                                    -- LOGIN, LOGIN_FAILED, LOGOUT, DOWNLOAD, INSERT, ...
  record_id UUID,
  record_label TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created ON public.security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON public.security_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_module ON public.security_audit_logs(module, action);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Read: portal admin only. No INSERT/UPDATE/DELETE policies — rows are only
-- written by SECURITY DEFINER functions/triggers below.
DROP POLICY IF EXISTS "Portal admin can read security audit logs" ON public.security_audit_logs;
CREATE POLICY "Portal admin can read security audit logs"
  ON public.security_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_portal_admin());

-- Belt-and-braces: revoke direct write grants so even a policy mistake cannot
-- allow clients to forge or tamper with audit rows.
REVOKE INSERT, UPDATE, DELETE ON public.security_audit_logs FROM anon, authenticated;

-- =====================================================================
-- 2. log_security_event — client-callable audit writer
--    SECURITY DEFINER so authenticated/anon callers can append events they
--    could not insert directly (RLS has no INSERT policy).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_module TEXT,
  p_action TEXT,
  p_record_id UUID DEFAULT NULL,
  p_record_label TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_actor_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_email TEXT;
  v_role TEXT;
  v_ip TEXT;
  v_ua TEXT;
BEGIN
  IF length(coalesce(trim(p_module), '')) = 0 OR length(coalesce(trim(p_action), '')) = 0 THEN
    RAISE EXCEPTION 'module and action are required';
  END IF;

  v_email := lower(coalesce(
    nullif(trim(p_actor_email), ''),
    auth.jwt() ->> 'email',
    ''
  ));
  v_role := coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    CASE WHEN public.is_portal_admin() THEN 'admin' ELSE 'user' END
  );

  -- PostgREST exposes request headers as request.header.* GUCs when present.
  BEGIN
    v_ip := nullif(current_setting('request.header.x-forwarded-for', true), '');
    v_ua := nullif(current_setting('request.header.user-agent', true), '');
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
    v_ua := NULL;
  END;

  INSERT INTO public.security_audit_logs (
    user_id, actor_email, actor_role, module, action,
    record_id, record_label, ip_address, user_agent, details
  ) VALUES (
    auth.uid(),
    left(v_email, 200),
    left(coalesce(v_role, ''), 40),
    left(trim(p_module), 60),
    left(trim(p_action), 60),
    p_record_id,
    left(coalesce(p_record_label, ''), 200),
    left(coalesce(v_ip, ''), 100),
    left(coalesce(v_ua, ''), 300),
    coalesce(p_details, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(TEXT, TEXT, UUID, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, TEXT, UUID, TEXT, JSONB, TEXT) TO anon, authenticated;

-- =====================================================================
-- 3. Row-level audit triggers on statutory / enforcement / dealer tables
-- =====================================================================
CREATE OR REPLACE FUNCTION public.security_audit_row_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module TEXT;
  v_record_id UUID;
  v_label TEXT;
  v_row JSONB;
BEGIN
  v_module := CASE TG_TABLE_NAME
    WHEN 'officer_statutory_orders' THEN 'statutory_orders'
    WHEN 'officer_inspections' THEN 'inspections'
    WHEN 'officer_samples' THEN 'samples'
    WHEN 'officer_cases' THEN 'enforcement_cases'
    WHEN 'officer_document_archive' THEN 'document_archive'
    WHEN 'officer_profiles' THEN 'officer_profiles'
    WHEN 'dealers' THEN 'dealers'
    WHEN 'dealer_stock_allocation' THEN 'dealer_stock'
    WHEN 'stock_inventory_lines' THEN 'stock_inventory'
    ELSE TG_TABLE_NAME
  END;

  IF TG_OP = 'DELETE' THEN
    v_row := to_jsonb(OLD);
  ELSE
    v_row := to_jsonb(NEW);
  END IF;

  v_record_id := NULLIF(v_row ->> 'id', '')::uuid;
  v_label := left(coalesce(
    v_row ->> 'order_number',
    v_row ->> 'sample_code',
    v_row ->> 'case_number',
    v_row ->> 'document_number',
    v_row ->> 'document_name',
    v_row ->> 'firm_name',
    v_row ->> 'dealer_name',
    v_row ->> 'full_name',
    v_row ->> 'email',
    ''
  ), 200);

  INSERT INTO public.security_audit_logs (
    user_id, actor_email, actor_role, module, action,
    record_id, record_label, details
  ) VALUES (
    auth.uid(),
    auth.jwt() ->> 'email',
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', 'user'),
    v_module,
    TG_OP,
    v_record_id,
    v_label,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'op', TG_OP
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach triggers (idempotent: drop then create)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'officer_statutory_orders',
    'officer_inspections',
    'officer_samples',
    'officer_cases',
    'officer_document_archive',
    'officer_profiles',
    'dealers',
    'dealer_stock_allocation',
    'stock_inventory_lines'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', t, t);
      EXECUTE format(
        'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.security_audit_row_trigger()',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- =====================================================================
-- 4. login_attempts — client-side rate limiting / temporary lockout
--    Checked before sign-in, recorded after. Sliding 15-minute window,
--    5 failures => locked until 15 min after the latest failure.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identifier TEXT NOT NULL,          -- normalized email or dealer phone key
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON public.login_attempts(identifier, created_at DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
-- No policies: direct table access denied for anon/authenticated.
-- Access only via the SECURITY DEFINER RPCs below.
REVOKE ALL ON public.login_attempts FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_identifier TEXT,
  p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  p_identifier := lower(trim(coalesce(p_identifier, '')));
  IF length(p_identifier) = 0 OR length(p_identifier) > 200 THEN
    RETURN;
  END IF;

  INSERT INTO public.login_attempts (identifier, success)
  VALUES (p_identifier, coalesce(p_success, false));

  -- Opportunistic cleanup of rows older than 24h.
  DELETE FROM public.login_attempts WHERE created_at < now() - interval '24 hours';
END;
$$;

REVOKE ALL ON FUNCTION public.record_login_attempt(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, BOOLEAN) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_login_throttle(
  p_identifier TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identifier TEXT;
  v_failures INT;
  v_latest_failure TIMESTAMPTZ;
  v_locked_until TIMESTAMPTZ;
  v_retry_after INT;
BEGIN
  v_identifier := lower(trim(coalesce(p_identifier, '')));
  IF length(v_identifier) = 0 THEN
    RETURN jsonb_build_object('allowed', true, 'failures', 0, 'retry_after_seconds', 0);
  END IF;

  SELECT count(*), max(created_at)
  INTO v_failures, v_latest_failure
  FROM public.login_attempts
  WHERE identifier = v_identifier
    AND success = false
    AND created_at > now() - interval '15 minutes';

  IF coalesce(v_failures, 0) >= 5 AND v_latest_failure IS NOT NULL THEN
    v_locked_until := v_latest_failure + interval '15 minutes';
    IF v_locked_until > now() THEN
      v_retry_after := greatest(1, ceil(extract(epoch FROM (v_locked_until - now())))::int);
      RETURN jsonb_build_object(
        'allowed', false,
        'failures', v_failures,
        'retry_after_seconds', v_retry_after,
        'locked_until', v_locked_until
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true, 'failures', coalesce(v_failures, 0), 'retry_after_seconds', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.check_login_throttle(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_login_throttle(TEXT) TO anon, authenticated;

-- =====================================================================
-- 5. RBAC hardening — authorization claims out of user_metadata
--
--    raw_user_meta_data is user-editable via supabase.auth.updateUser(),
--    so it must never drive authorization. Role now comes from:
--      - app_metadata (service-role only), or
--      - authoritative table lookups (dealers.portal_email, officer_profiles)
-- =====================================================================

-- 5a. Backfill app_metadata for dealer auth users.
--     Match is via dealers.portal_email (authoritative), NOT user_metadata,
--     so pre-existing forged metadata cannot be promoted.
UPDATE auth.users u
SET raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
      'role', 'dealer',
      'dealer_id', d.id::text,
      'dealer_name', d.dealer_name
    ),
    updated_at = now()
FROM public.dealers d
WHERE lower(u.email) = lower(d.portal_email)
  AND d.portal_email IS NOT NULL
  AND d.portal_email <> ''
  AND coalesce(u.raw_app_meta_data ->> 'role', '') <> 'dealer';

-- 5b. Backfill app_metadata role='officer' for users with an
--     officer_profiles row (authoritative — profiles are created server-side).
UPDATE auth.users u
SET raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'officer'),
    updated_at = now()
WHERE EXISTS (SELECT 1 FROM public.officer_profiles op WHERE op.id = u.id)
  AND coalesce(u.raw_app_meta_data ->> 'role', '') = '';

-- 5c. is_dealer_portal_user — portal_email lookup or app_metadata only.
CREATE OR REPLACE FUNCTION public.is_dealer_portal_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    EXISTS (
      SELECT 1
      FROM public.dealers d
      WHERE d.portal_email = lower(coalesce(auth.jwt() ->> 'email', ''))
    ),
    false
  )
  OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'dealer';
$$;

-- 5d. current_dealer_id — portal_email lookup or app_metadata only.
CREATE OR REPLACE FUNCTION public.current_dealer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (
      SELECT d.id
      FROM public.dealers d
      WHERE d.portal_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      LIMIT 1
    ),
    nullif(auth.jwt() -> 'app_metadata' ->> 'dealer_id', '')::uuid
  );
$$;

-- 5e. is_officer_user — officer_profiles row or app_metadata only.
CREATE OR REPLACE FUNCTION public.is_officer_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.officer_profiles op WHERE op.id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'officer',
    FALSE
  );
$$;

-- 5f. current_officer_jurisdiction — keep profile-first lookup; the
--     user_metadata fallback now additionally requires app_metadata role
--     'officer' so a forged user_metadata claim alone cannot widen scope.
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

  -- Fallback for profile-less officers: require the non-forgeable
  -- app_metadata role claim in addition to user_metadata jurisdiction.
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'officer' THEN
    v_district    := COALESCE(auth.jwt() -> 'user_metadata' ->> 'district', '');
    v_mandal      := COALESCE(auth.jwt() -> 'user_metadata' ->> 'mandal',   '');
    v_designation := COALESCE(auth.jwt() -> 'user_metadata' ->> 'designation', '');

    IF v_district <> '' THEN
      RETURN QUERY SELECT
        v_district,
        v_mandal,
        upper(v_designation) IN ('ADA', 'DAO', 'DNO');
    END IF;
  END IF;
END;
$$;

-- 5g. provision_dealer_portal_login — write role claims into app_metadata
--     (merged with provider keys) instead of only user_metadata, so future
--     provisioning produces tokens that satisfy the hardened helpers even
--     when the dealers.portal_email lookup does not match.
CREATE OR REPLACE FUNCTION public.provision_dealer_portal_login(
  p_dealer_id uuid,
  p_password text DEFAULT 'Guest@123'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  d RECORD;
  dealer_email text;
  normalized_phone text;
  v_auth_user_id uuid;
  pwd text;
  hashed_pw text;
  v_app_meta jsonb;
BEGIN
  IF NOT public.is_portal_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only portal admin can provision dealer logins.');
  END IF;

  pwd := coalesce(nullif(trim(p_password), ''), 'Guest@123');
  hashed_pw := public.hash_portal_password(pwd);

  SELECT dl.id, dl.dealer_name, dl.phone_number, dl.portal_email
  INTO d
  FROM dealers dl
  WHERE dl.id = p_dealer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dealer not found.');
  END IF;

  normalized_phone := regexp_replace(coalesce(d.phone_number, ''), '[^0-9]', '', 'g');
  IF length(normalized_phone) < 10 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Dealer must have a valid 10-digit phone number in Dealer Management.'
    );
  END IF;

  dealer_email := lower(coalesce(nullif(trim(d.portal_email), ''), public.dealer_portal_email(d.phone_number)));
  UPDATE dealers dl SET portal_email = dealer_email WHERE dl.id = d.id;

  v_app_meta := jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email'),
    'role', 'dealer',
    'dealer_id', d.id::text,
    'dealer_name', d.dealer_name
  );

  SELECT u.id INTO v_auth_user_id
  FROM auth.users u
  WHERE lower(u.email) = dealer_email;

  IF v_auth_user_id IS NOT NULL THEN
    UPDATE auth.users u
    SET
      encrypted_password = hashed_pw,
      email_confirmed_at = coalesce(u.email_confirmed_at, now()),
      updated_at = now(),
      confirmation_token = '',
      recovery_token = '',
      email_change = '',
      email_change_token_new = '',
      email_change_token_current = '',
      reauthentication_token = '',
      raw_user_meta_data = jsonb_build_object(
        'role', 'dealer',
        'dealer_id', d.id::text,
        'dealer_name', d.dealer_name,
        'phone', normalized_phone
      ),
      raw_app_meta_data = v_app_meta
    WHERE u.id = v_auth_user_id;
  ELSE
    v_auth_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, confirmation_sent_at,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current, reauthentication_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_auth_user_id,
      'authenticated',
      'authenticated',
      dealer_email,
      hashed_pw,
      now(), now(), now(),
      v_app_meta,
      jsonb_build_object(
        'role', 'dealer',
        'dealer_id', d.id::text,
        'dealer_name', d.dealer_name,
        'phone', normalized_phone
      ),
      now(),
      '', '', '', '', '', ''
    );
  END IF;

  DELETE FROM auth.identities ai
  WHERE ai.user_id = v_auth_user_id
    AND ai.provider = 'email'
    AND ai.provider_id IS DISTINCT FROM v_auth_user_id::text;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities ai
    WHERE ai.user_id = v_auth_user_id
      AND ai.provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at
    )
    VALUES (
      gen_random_uuid(),
      v_auth_user_id,
      v_auth_user_id::text,
      'email',
      jsonb_build_object('sub', v_auth_user_id::text, 'email', dealer_email),
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.identities ai
    SET
      provider_id = v_auth_user_id::text,
      identity_data = jsonb_build_object('sub', v_auth_user_id::text, 'email', dealer_email),
      updated_at = now()
    WHERE ai.user_id = v_auth_user_id
      AND ai.provider = 'email';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'dealer_name', d.dealer_name,
    'phone', normalized_phone,
    'portal_email', dealer_email,
    'password', pwd
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_dealer_portal_login(uuid, text) TO authenticated;
