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
      WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
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
      USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
  END IF;
END $$;
