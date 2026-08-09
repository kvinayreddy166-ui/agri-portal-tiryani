/*
  Correct Rythu Bhima age eligibility and add year-wise scheme beneficiary tracking.
*/

UPDATE schemes
SET eligibility = 'Age between 18-59 years'
WHERE lower(scheme_name) = 'rythu bhima';

CREATE TABLE IF NOT EXISTS scheme_beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id uuid NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  beneficiaries_count integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT (auth.jwt() ->> 'email')
);

ALTER TABLE scheme_beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view scheme beneficiaries"
  ON scheme_beneficiaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert scheme beneficiaries"
  ON scheme_beneficiaries FOR INSERT
  TO authenticated
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update scheme beneficiaries"
  ON scheme_beneficiaries FOR UPDATE
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete scheme beneficiaries"
  ON scheme_beneficiaries FOR DELETE
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE INDEX IF NOT EXISTS idx_scheme_beneficiaries_scheme_year
  ON scheme_beneficiaries(scheme_id, financial_year);
