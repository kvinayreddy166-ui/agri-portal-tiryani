CREATE EXTENSION IF NOT EXISTS pgcrypto;

DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'test@gmail.com'
);

DELETE FROM auth.users
WHERE lower(email) = 'test@gmail.com';

DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_sent_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    test_user_id,
    'authenticated',
    'authenticated',
    'test@gmail.com',
    crypt('Test@123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User"}',
    false,
    now()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    test_user_id,
    'test@gmail.com',
    'email',
    jsonb_build_object('sub', test_user_id::text, 'email', 'test@gmail.com'),
    now(),
    now()
  );
END $$;
