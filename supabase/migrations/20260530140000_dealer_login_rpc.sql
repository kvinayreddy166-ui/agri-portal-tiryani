/*
  Dealer login helper — run this in Supabase SQL Editor if dealer phone login fails.
  Allows the app to look up dealer portal email by phone (anon-safe) and auto-register on first login.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.dealer_portal_email(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'dealer.' || regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') || '@tiryani.portal';
$$;

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS portal_email text;

UPDATE dealers
SET portal_email = public.dealer_portal_email(phone_number)
WHERE portal_email IS NULL OR portal_email = '';

CREATE OR REPLACE FUNCTION public.get_dealer_login_info(p_phone text)
RETURNS TABLE (
  dealer_id uuid,
  portal_email text,
  dealer_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    coalesce(nullif(trim(d.portal_email), ''), public.dealer_portal_email(d.phone_number)),
    d.dealer_name
  FROM dealers d
  WHERE regexp_replace(coalesce(d.phone_number, ''), '[^0-9]', '', 'g')
      = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_dealer_login_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dealer_login_info(text) TO anon, authenticated;
