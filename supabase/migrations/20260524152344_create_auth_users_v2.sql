/*
  # Create Authentication Users

  1. New Users
    - Admin user: k.vinayreddy166@gmail.com with password Tiryani@2026
    - Test user: test@gmail.com with password Test@123

  2. Notes
    - Uses Supabase auth functions to create users
    - Email confirmation is disabled by default
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin user with encrypted password
DO $$
DECLARE
  admin_id uuid;
  test_id uuid;
BEGIN
  -- Generate UUIDs
  admin_id := gen_random_uuid();
  test_id := gen_random_uuid();
  
  -- Create admin user
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
    admin_id,
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
  
  -- Create test/guest user
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
    test_id,
    'authenticated',
    'authenticated',
    'test@gmail.com',
    crypt('Test@123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Guest User"}',
    false,
    now()
  );
  
  -- Create identities for admin user
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
    admin_id,
    'k.vinayreddy166@gmail.com',
    'email',
    json_build_object('sub', admin_id::text, 'email', 'k.vinayreddy166@gmail.com'),
    now(),
    now()
  );
  
  -- Create identities for test user
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
    test_id,
    'test@gmail.com',
    'email',
    json_build_object('sub', test_id::text, 'email', 'test@gmail.com'),
    now(),
    now()
  );
END $$;


