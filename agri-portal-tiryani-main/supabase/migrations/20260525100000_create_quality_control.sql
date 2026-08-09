/*
  # Quality Control

  1. New Tables
    - `quality_control_targets`
      - One target per category and financial year
    - `quality_control_samples`
      - Dealer sample drawn details and uploaded form URL

  2. Security
    - Authenticated users can read quality control data
    - Admin can insert, update, and delete
*/

CREATE TABLE IF NOT EXISTS quality_control_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('seeds', 'pesticides', 'fertilizers')),
  financial_year text NOT NULL,
  target_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (category, financial_year)
);

CREATE TABLE IF NOT EXISTS quality_control_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('seeds', 'pesticides', 'fertilizers')),
  financial_year text NOT NULL,
  dealer_name text NOT NULL,
  license_number text NOT NULL,
  phone_number text DEFAULT '',
  location text DEFAULT '',
  sample_date date DEFAULT CURRENT_DATE,
  form_url text,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT ''
);

ALTER TABLE quality_control_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_control_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quality control targets"
  ON quality_control_targets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert quality control targets"
  ON quality_control_targets FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update quality control targets"
  ON quality_control_targets FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete quality control targets"
  ON quality_control_targets FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Anyone can view quality control samples"
  ON quality_control_samples FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert quality control samples"
  ON quality_control_samples FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update quality control samples"
  ON quality_control_samples FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete quality control samples"
  ON quality_control_samples FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');
