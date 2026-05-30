/*
  Admin RPCs to create or reset dealer portal auth (phone login, password Guest@123).
  Callable from Dealer Management by portal admin only.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.provision_dealer_portal_login(
  p_dealer_id uuid,
  p_password text DEFAULT 'Guest@123'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  d RECORD;
  dealer_email text;
  normalized_phone text;
  user_id uuid;
  pwd text;
BEGIN
  IF NOT public.is_portal_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only portal admin can provision dealer logins.');
  END IF;

  pwd := coalesce(nullif(trim(p_password), ''), 'Guest@123');

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

  dealer_email := coalesce(nullif(trim(d.portal_email), ''), public.dealer_portal_email(d.phone_number));
  UPDATE dealers SET portal_email = dealer_email WHERE id = d.id;

  SELECT id INTO user_id FROM auth.users WHERE lower(email) = lower(dealer_email);

  IF user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt(pwd, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now(),
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
      raw_app_meta_data, raw_user_meta_data, confirmation_sent_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'authenticated',
      'authenticated',
      dealer_email,
      crypt(pwd, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'role', 'dealer',
        'dealer_id', d.id::text,
        'dealer_name', d.dealer_name,
        'phone', normalized_phone
      ),
      now()
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      user_id,
      dealer_email,
      'email',
      jsonb_build_object('sub', user_id::text, 'email', dealer_email),
      now(),
      now()
    );
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

CREATE OR REPLACE FUNCTION public.provision_all_dealer_portal_logins(
  p_password text DEFAULT 'Guest@123'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  d RECORD;
  one_result jsonb;
  created_count int := 0;
  failed_count int := 0;
  failures jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.is_portal_admin() THEN
    RETURN jsonb_build_object(
      'created', 0,
      'failed', 0,
      'failures', jsonb_build_array(jsonb_build_object('ok', false, 'error', 'Only portal admin can provision dealer logins.'))
    );
  END IF;

  FOR d IN
    SELECT id
    FROM dealers
    WHERE phone_number IS NOT NULL
      AND length(regexp_replace(coalesce(phone_number, ''), '[^0-9]', '', 'g')) >= 10
  LOOP
    one_result := public.provision_dealer_portal_login(d.id, p_password);
    IF coalesce((one_result->>'ok')::boolean, false) THEN
      created_count := created_count + 1;
    ELSE
      failed_count := failed_count + 1;
      failures := failures || jsonb_build_array(one_result);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'created', created_count,
    'failed', failed_count,
    'failures', failures
  );
END;
$$;

REVOKE ALL ON FUNCTION public.provision_dealer_portal_login(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_all_dealer_portal_logins(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_dealer_portal_login(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.provision_all_dealer_portal_logins(text) TO authenticated;
