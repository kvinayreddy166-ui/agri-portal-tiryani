CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_user_id uuid;
  test_user_id uuid;
  legacy_test_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE lower(email) = 'k.vinayreddy166@gmail.com';

  IF admin_user_id IS NULL THEN
    admin_user_id := gen_random_uuid();

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
      admin_user_id,
      'authenticated',
      'authenticated',
      'k.vinayreddy166@gmail.com',
      crypt('Tiryani@2026', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin User"}',
      false,
      now()
    );
  ELSE
    UPDATE auth.users
    SET
      email = 'k.vinayreddy166@gmail.com',
      encrypted_password = crypt('Tiryani@2026', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}',
      raw_user_meta_data = '{"full_name":"Admin User"}'
    WHERE id = admin_user_id;
  END IF;

  DELETE FROM auth.identities
  WHERE provider = 'email'
    AND provider_id = 'k.vinayreddy166@gmail.com'
    AND user_id <> admin_user_id;

  UPDATE auth.identities
  SET
    provider_id = 'k.vinayreddy166@gmail.com',
    identity_data = jsonb_build_object('sub', admin_user_id::text, 'email', 'k.vinayreddy166@gmail.com'),
    updated_at = now()
  WHERE provider = 'email'
    AND user_id = admin_user_id;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    admin_user_id,
    'k.vinayreddy166@gmail.com',
    'email',
    jsonb_build_object('sub', admin_user_id::text, 'email', 'k.vinayreddy166@gmail.com'),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE provider = 'email'
      AND user_id = admin_user_id
  );

  SELECT id INTO test_user_id
  FROM auth.users
  WHERE lower(email) = 'test@gmail.com';

  SELECT id INTO legacy_test_user_id
  FROM auth.users
  WHERE lower(email) = 'test@123.com';

  IF test_user_id IS NULL AND legacy_test_user_id IS NOT NULL THEN
    test_user_id := legacy_test_user_id;
  END IF;

  IF test_user_id IS NULL THEN
    test_user_id := gen_random_uuid();

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
  ELSE
    UPDATE auth.users
    SET
      email = 'test@gmail.com',
      encrypted_password = crypt('Test@123', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}',
      raw_user_meta_data = '{"full_name":"Test User"}'
    WHERE id = test_user_id;
  END IF;

  DELETE FROM auth.identities
  WHERE provider = 'email'
    AND provider_id IN ('test@gmail.com', 'test@123.com')
    AND user_id <> test_user_id;

  UPDATE auth.identities
  SET
    provider_id = 'test@gmail.com',
    identity_data = jsonb_build_object('sub', test_user_id::text, 'email', 'test@gmail.com'),
    updated_at = now()
  WHERE provider = 'email'
    AND user_id = test_user_id;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    test_user_id,
    'test@gmail.com',
    'email',
    jsonb_build_object('sub', test_user_id::text, 'email', 'test@gmail.com'),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE provider = 'email'
      AND user_id = test_user_id
  );

  DELETE FROM auth.users
  WHERE lower(email) = 'test@123.com'
    AND id <> test_user_id;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
