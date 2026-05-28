/*
  # Test login and uploads setup

  1. Authentication
    - Ensures test login exists:
      - Email: test@123.com
      - Display password: test; stored auth password: test

  2. Storage
    - Ensures the public `uploads` bucket exists
    - Allows authenticated users to read uploaded files
    - Allows only the admin account to upload, update, and delete files
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  test_user_id uuid;
BEGIN
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'test@123.com';

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
      crypt('test', gen_salt('bf')),
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
      encrypted_password = crypt('test', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}',
      raw_user_meta_data = '{"full_name":"Test User"}'
    WHERE id = test_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE provider = 'email'
      AND provider_id = 'test@123.com'
  ) THEN
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
      'test@123.com',
      'email',
      json_build_object('sub', test_user_id::text, 'email', 'test@123.com'),
      now(),
      now()
    );
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

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

