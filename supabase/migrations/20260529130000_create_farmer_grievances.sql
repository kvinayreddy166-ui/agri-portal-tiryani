CREATE TABLE IF NOT EXISTS farmer_grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_name text NOT NULL,
  village text NOT NULL,
  phone text,
  issue_type text NOT NULL,
  message text NOT NULL,
  email_to text NOT NULL DEFAULT 'k.vinayreddy166@gmail.com',
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE farmer_grievances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit farmer grievances" ON farmer_grievances;
DROP POLICY IF EXISTS "Admin can view farmer grievances" ON farmer_grievances;

CREATE POLICY "Anyone can submit farmer grievances"
  ON farmer_grievances FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view farmer grievances"
  ON farmer_grievances FOR SELECT
  USING (auth.email() = 'k.vinayreddy166@gmail.com');

CREATE INDEX IF NOT EXISTS idx_farmer_grievances_created_at ON farmer_grievances(created_at DESC);
