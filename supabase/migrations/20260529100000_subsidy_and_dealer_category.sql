/*
  Subsidy Cell tracking + dealer categories (fertilizer / seed / pesticide)
*/

ALTER TABLE dealers
  ADD COLUMN IF NOT EXISTS dealer_category text NOT NULL DEFAULT 'fertilizer';

ALTER TABLE dealers
  ALTER COLUMN ifms_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS subsidy_cell_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program text NOT NULL,
  financial_year text NOT NULL,
  crop_variety text DEFAULT '',
  quantity_allotted numeric DEFAULT 0,
  quantity_unit text DEFAULT 'quintals',
  sales_data text DEFAULT '',
  beneficiary_list_url text DEFAULT '',
  notes text DEFAULT '',
  created_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subsidy_cell_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view subsidy records"
  ON subsidy_cell_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage subsidy records"
  ON subsidy_cell_records FOR ALL
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE INDEX IF NOT EXISTS idx_dealers_category ON dealers(dealer_category);
CREATE INDEX IF NOT EXISTS idx_subsidy_program ON subsidy_cell_records(program, financial_year);
