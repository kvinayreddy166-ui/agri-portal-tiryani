/*
  Stock Inventory submissions, dealer portal logins, and dealer stock fixes.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin helper (case-insensitive)
CREATE OR REPLACE FUNCTION public.is_portal_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com';
$$;

CREATE OR REPLACE FUNCTION public.is_dealer_portal_user()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'dealer';
$$;

CREATE OR REPLACE FUNCTION public.current_dealer_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(auth.jwt() -> 'user_metadata' ->> 'dealer_id', '')::uuid;
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

-- Dealer-wise stock: unique per dealer + fertilizer
CREATE UNIQUE INDEX IF NOT EXISTS idx_dealer_stock_dealer_fertilizer
  ON dealer_stock_allocation (dealer_id, fertilizer_type);

-- Replace strict email policies on dealer_stock_allocation
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

-- Stock inventory lines (dealer submissions)
CREATE TABLE IF NOT EXISTS stock_inventory_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('fertilizer', 'seed', 'pesticide')),
  serial_no integer NOT NULL DEFAULT 1,
  product_type text NOT NULL,
  opening_balance numeric NOT NULL DEFAULT 0,
  receipts numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  sales numeric NOT NULL DEFAULT 0,
  closing_balance numeric NOT NULL DEFAULT 0,
  report_month text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_by text
);

CREATE INDEX IF NOT EXISTS idx_stock_inventory_dealer ON stock_inventory_lines(dealer_id);
CREATE INDEX IF NOT EXISTS idx_stock_inventory_category ON stock_inventory_lines(category);
CREATE INDEX IF NOT EXISTS idx_stock_inventory_month ON stock_inventory_lines(report_month);

ALTER TABLE stock_inventory_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View stock inventory" ON stock_inventory_lines;
DROP POLICY IF EXISTS "Admin manage all stock inventory" ON stock_inventory_lines;
DROP POLICY IF EXISTS "Dealer view own stock inventory" ON stock_inventory_lines;
DROP POLICY IF EXISTS "Dealer insert own stock inventory" ON stock_inventory_lines;
DROP POLICY IF EXISTS "Dealer update own stock inventory" ON stock_inventory_lines;
DROP POLICY IF EXISTS "Dealer delete own stock inventory" ON stock_inventory_lines;

CREATE POLICY "View stock inventory"
  ON stock_inventory_lines FOR SELECT
  TO authenticated
  USING (
    public.is_portal_admin()
    OR dealer_id = public.current_dealer_id()
  );

CREATE POLICY "Admin manage all stock inventory"
  ON stock_inventory_lines FOR ALL
  TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

CREATE POLICY "Dealer insert own stock inventory"
  ON stock_inventory_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_dealer_portal_user()
    AND dealer_id = public.current_dealer_id()
  );

CREATE POLICY "Dealer update own stock inventory"
  ON stock_inventory_lines FOR UPDATE
  TO authenticated
  USING (
    public.is_dealer_portal_user()
    AND dealer_id = public.current_dealer_id()
  )
  WITH CHECK (
    public.is_dealer_portal_user()
    AND dealer_id = public.current_dealer_id()
  );

CREATE POLICY "Dealer delete own stock inventory"
  ON stock_inventory_lines FOR DELETE
  TO authenticated
  USING (
    public.is_dealer_portal_user()
    AND dealer_id = public.current_dealer_id()
  );

-- Dealers can upload to stock-inventory folder in storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Dealers can upload stock inventory files'
  ) THEN
    CREATE POLICY "Dealers can upload stock inventory files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'uploads'
        AND (storage.foldername(name))[1] = 'stock-inventory'
        AND public.is_dealer_portal_user()
      );
  END IF;
END $$;

-- Create / refresh dealer auth users (password: guest)
DO $$
DECLARE
  d RECORD;
  user_id uuid;
  dealer_email text;
  normalized_phone text;
BEGIN
  FOR d IN
    SELECT id, dealer_name, phone_number
    FROM dealers
    WHERE phone_number IS NOT NULL AND regexp_replace(phone_number, '[^0-9]', '', 'g') <> ''
  LOOP
    normalized_phone := regexp_replace(d.phone_number, '[^0-9]', '', 'g');
    dealer_email := public.dealer_portal_email(d.phone_number);

    UPDATE dealers SET portal_email = dealer_email WHERE id = d.id;

    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(dealer_email)) THEN
      UPDATE auth.users
      SET
        raw_user_meta_data = jsonb_build_object(
          'role', 'dealer',
          'dealer_id', d.id::text,
          'dealer_name', d.dealer_name,
          'phone', normalized_phone
        ),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
      WHERE lower(email) = lower(dealer_email);
      CONTINUE;
    END IF;

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
      crypt('guest', gen_salt('bf')),
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
  END LOOP;
END $$;
