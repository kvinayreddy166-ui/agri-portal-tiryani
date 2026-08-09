/*
  Daily dealer stock entry — one submission per dealer, category, and calendar day.
*/

ALTER TABLE stock_inventory_lines
  ADD COLUMN IF NOT EXISTS report_date date;

UPDATE stock_inventory_lines
SET report_date = coalesce(created_at::date, to_date(report_month || '-01', 'YYYY-MM-DD'))
WHERE report_date IS NULL;

ALTER TABLE stock_inventory_lines
  ALTER COLUMN report_date SET DEFAULT (CURRENT_DATE);

ALTER TABLE stock_inventory_lines
  ALTER COLUMN report_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_inventory_report_date
  ON stock_inventory_lines (report_date DESC);

CREATE INDEX IF NOT EXISTS idx_stock_inventory_dealer_day
  ON stock_inventory_lines (dealer_id, category, report_date);
