/*
  Fixes "saltgen unknown" when provisioning dealer logins — pgcrypto lives in extensions schema on Supabase.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.hash_portal_password(plain_password text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT extensions.crypt(plain_password, extensions.gen_salt('bf'));
$$;

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
BEGIN
  IF NOT public.is_portal_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only portal admin can provision dealer logins.');
  END IF;

  pwd := coalesce(nullif(trim(p_password), ''), 'Guest@123');
  hashed_pw := public.hash_portal_password(pwd);

  SELECT id, dealer_name, phone_number, portal_email
  INTO d
  FROM dealers
  WHERE id = p_dealer_id;

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
  UPDATE dealers SET portal_email = dealer_email WHERE id = d.id;

  SELECT id INTO user_id FROM auth.users WHERE lower(email) = dealer_email;

  IF user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = hashed_pw,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
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
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
    WHERE id = user_id;
  ELSE
    user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, confirmation_sent_at,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current, reauthentication_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'authenticated',
      'authenticated',
      dealer_email,
      hashed_pw,
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
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

  DELETE FROM auth.identities
  WHERE user_id = user_id AND provider = 'email'
    AND provider_id IS DISTINCT FROM user_id::text;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = user_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at
    )
    VALUES (
      gen_random_uuid(),
      user_id,
      user_id::text,
      'email',
      jsonb_build_object('sub', user_id::text, 'email', dealer_email),
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.identities
    SET
      provider_id = user_id::text,
      identity_data = jsonb_build_object('sub', user_id::text, 'email', dealer_email),
      updated_at = now()
    WHERE user_id = user_id AND provider = 'email';
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

GRANT EXECUTE ON FUNCTION public.hash_portal_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.provision_dealer_portal_login(uuid, text) TO authenticated;
