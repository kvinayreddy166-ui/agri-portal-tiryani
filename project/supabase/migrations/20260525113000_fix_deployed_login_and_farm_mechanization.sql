/*
  # Deployed login and farm mechanization

  1. Authentication
    - Ensures the admin and test users exist and have confirmed email/password login.
    - Admin password: Tiryani@2026
    - Test display password: test; stored auth password: test

  2. Farm Mechanization
    - Stores admin-uploaded applications received and proceedings generated.
    - Financial years are supported from 2025-2026 through 2029-2030.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_user_id uuid;
  test_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'k.vinayreddy166@gmail.com';

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
      encrypted_password = crypt('Tiryani@2026', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}',
      raw_user_meta_data = '{"full_name":"Admin User"}'
    WHERE id = admin_user_id;
  END IF;

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
      AND provider_id = 'k.vinayreddy166@gmail.com'
  );

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
      AND provider_id = 'test@123.com'
  );
END $$;

CREATE TABLE IF NOT EXISTS farm_mechanization_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('applications_received', 'proceedings_generated')),
  financial_year text NOT NULL CHECK (financial_year IN ('2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030')),
  title text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT ''
);

ALTER TABLE farm_mechanization_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'farm_mechanization_documents'
      AND policyname = 'Anyone can view farm mechanization documents'
  ) THEN
    CREATE POLICY "Anyone can view farm mechanization documents"
      ON farm_mechanization_documents FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'farm_mechanization_documents'
      AND policyname = 'Admin can insert farm mechanization documents'
  ) THEN
    CREATE POLICY "Admin can insert farm mechanization documents"
      ON farm_mechanization_documents FOR INSERT
      TO authenticated
      WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'farm_mechanization_documents'
      AND policyname = 'Admin can delete farm mechanization documents'
  ) THEN
    CREATE POLICY "Admin can delete farm mechanization documents"
      ON farm_mechanization_documents FOR DELETE
      TO authenticated
      USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');
  END IF;
END $$;
