/*
  Dealer fertilizer load tracking

  Adds latest load details to dealer_stock_allocation and lets dealer users
  insert/update only their own fertilizer tracking rows.
*/

ALTER TABLE dealer_stock_allocation
  ADD COLUMN IF NOT EXISTS wholesaler_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_date date,
  ADD COLUMN IF NOT EXISTS quantity_unit text DEFAULT 'MTS',
  ADD COLUMN IF NOT EXISTS quantity_bags numeric DEFAULT 0;

DROP POLICY IF EXISTS "Dealer can insert own fertilizer tracking" ON dealer_stock_allocation;
DROP POLICY IF EXISTS "Dealer can update own fertilizer tracking" ON dealer_stock_allocation;

CREATE POLICY "Dealer can insert own fertilizer tracking"
  ON dealer_stock_allocation FOR INSERT
  TO authenticated
  WITH CHECK (
    dealer_id::text = coalesce(auth.jwt() -> 'user_metadata' ->> 'dealer_id', '')
  );

CREATE POLICY "Dealer can update own fertilizer tracking"
  ON dealer_stock_allocation FOR UPDATE
  TO authenticated
  USING (
    dealer_id::text = coalesce(auth.jwt() -> 'user_metadata' ->> 'dealer_id', '')
  )
  WITH CHECK (
    dealer_id::text = coalesce(auth.jwt() -> 'user_metadata' ->> 'dealer_id', '')
  );
