/*
  # GOs and Circulars

  Stores government orders and circular documents uploaded by admin.
*/

CREATE TABLE IF NOT EXISTS gos_circulars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text DEFAULT 'pdf',
  issued_date date,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT ''
);

ALTER TABLE gos_circulars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view gos_circulars" ON gos_circulars;
DROP POLICY IF EXISTS "Admin can insert gos_circulars" ON gos_circulars;
DROP POLICY IF EXISTS "Admin can update gos_circulars" ON gos_circulars;
DROP POLICY IF EXISTS "Admin can delete gos_circulars" ON gos_circulars;

CREATE POLICY "Anyone can view gos_circulars"
  ON gos_circulars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert gos_circulars"
  ON gos_circulars FOR INSERT
  TO authenticated
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update gos_circulars"
  ON gos_circulars FOR UPDATE
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete gos_circulars"
  ON gos_circulars FOR DELETE
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
