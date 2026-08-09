/*
  # Reset login accounts and upload storage

  1. Authentication
    - Admin: k.vinayreddy166@gmail.com / Tiryani@2026
    - Test: test@123.com / Test@123
    - Migrates the previous test@123.com account to test@123.com when present.

  2. Storage
    - Ensures the public `uploads` bucket exists.
    - Admin can upload, update, and delete files.
    - Authenticated users can view/download files.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_user_id uuid;
  test_user_id uuid;
  old_test_user_id uuid;
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
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
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
    identity_data = json_build_object('sub', admin_user_id::text, 'email', 'k.vinayreddy166@gmail.com'),
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
    json_build_object('sub', admin_user_id::text, 'email', 'k.vinayreddy166@gmail.com'),
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
  WHERE lower(email) = 'test@123.com';

  SELECT id INTO old_test_user_id
  FROM auth.users
  WHERE lower(email) = 'test@123.com';

  IF test_user_id IS NULL AND old_test_user_id IS NOT NULL THEN
    test_user_id := old_test_user_id;
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
      'test@123.com',
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
      email = 'test@123.com',
      encrypted_password = crypt('Test@123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}',
      raw_user_meta_data = '{"full_name":"Test User"}'
    WHERE id = test_user_id;
  END IF;

  DELETE FROM auth.identities
  WHERE provider = 'email'
    AND provider_id = 'test@123.com'
    AND user_id <> test_user_id;

  UPDATE auth.identities
  SET
    provider_id = 'test@123.com',
    identity_data = json_build_object('sub', test_user_id::text, 'email', 'test@123.com'),
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
    'test@123.com',
    'email',
    json_build_object('sub', test_user_id::text, 'email', 'test@123.com'),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE provider = 'email'
      AND user_id = test_user_id
  );
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can view uploads'
  ) THEN
    CREATE POLICY "Authenticated users can view uploads"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can download uploads'
  ) THEN
    CREATE POLICY "Public can download uploads"
      ON storage.objects FOR SELECT
      TO anon
      USING (bucket_id = 'uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admin can upload files'
  ) THEN
    CREATE POLICY "Admin can upload files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'uploads'
        AND auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admin can update uploaded files'
  ) THEN
    CREATE POLICY "Admin can update uploaded files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'uploads'
        AND auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com'
      )
      WITH CHECK (
        bucket_id = 'uploads'
        AND auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admin can delete uploaded files'
  ) THEN
    CREATE POLICY "Admin can delete uploaded files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'uploads'
        AND auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com'
      );
  END IF;
END $$;
