/*
  # Update test login password

  1. Authentication
    - Test: test@gmail.com / Test@504297
    - Updates the existing test user's password in place.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  UPDATE auth.users
  SET
    encrypted_password = crypt('Test@504297', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE lower(email) = 'test@gmail.com';
END $$;
