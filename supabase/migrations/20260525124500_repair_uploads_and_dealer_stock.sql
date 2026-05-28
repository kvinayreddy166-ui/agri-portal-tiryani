/*
  # Repair uploads and dealer-wise stock

  1. Storage
    - Creates the public `uploads` bucket if it is missing.
    - Lets authenticated users, including test logins, read/download uploaded files.
    - Lets only the admin account upload, update, and delete files.

  2. Dealer-wise Stock
    - Ensures `dealer_stock_allocation` exists for dealer-wise stock entries.
    - Adds idempotent policies so admin can manage stock and test users can view it.
*/

CREATE TABLE IF NOT EXISTS dealer_stock_allocation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  fertilizer_type text NOT NULL,
  quantity_mts numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dealer_stock_allocation ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dealer_stock_allocation'
      AND policyname = 'Anyone can view dealer stock'
  ) THEN
    CREATE POLICY "Anyone can view dealer stock"
      ON dealer_stock_allocation FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dealer_stock_allocation'
      AND policyname = 'Admin can insert dealer stock'
  ) THEN
    CREATE POLICY "Admin can insert dealer stock"
      ON dealer_stock_allocation FOR INSERT
      TO authenticated
      WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dealer_stock_allocation'
      AND policyname = 'Admin can update dealer stock'
  ) THEN
    CREATE POLICY "Admin can update dealer stock"
      ON dealer_stock_allocation FOR UPDATE
      TO authenticated
      USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
      WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dealer_stock_allocation'
      AND policyname = 'Admin can delete dealer stock'
  ) THEN
    CREATE POLICY "Admin can delete dealer stock"
      ON dealer_stock_allocation FOR DELETE
      TO authenticated
      USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dealer_stock_dealer_id ON dealer_stock_allocation(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_stock_fertilizer ON dealer_stock_allocation(fertilizer_type);

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
