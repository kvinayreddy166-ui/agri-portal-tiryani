/*
  Ensures dealer stock upsert works and dealer phone login RPC exists for anon/authenticated.
  Safe to re-run in Supabase SQL Editor.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.is_portal_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com';
$$;

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_dealer_stock_dealer_fertilizer
  ON dealer_stock_allocation (dealer_id, fertilizer_type);

ALTER TABLE dealer_stock_allocation
  DROP CONSTRAINT IF EXISTS dealer_stock_allocation_dealer_fertilizer_key;

ALTER TABLE dealer_stock_allocation
  ADD CONSTRAINT dealer_stock_allocation_dealer_fertilizer_key
  UNIQUE (dealer_id, fertilizer_type);

DROP POLICY IF EXISTS "Admin can insert dealer stock" ON dealer_stock_allocation;
DROP POLICY IF EXISTS "Admin can update dealer stock" ON dealer_stock_allocation;
DROP POLICY IF EXISTS "Admin can delete dealer stock" ON dealer_stock_allocation;

CREATE POLICY "Admin can insert dealer stock"
  ON dealer_stock_allocation FOR INSERT
  TO authenticated
  WITH CHECK (public.is_portal_admin());

CREATE POLICY "Admin can update dealer stock"
  ON dealer_stock_allocation FOR UPDATE
  TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

CREATE POLICY "Admin can delete dealer stock"
  ON dealer_stock_allocation FOR DELETE
  TO authenticated
  USING (public.is_portal_admin());

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
