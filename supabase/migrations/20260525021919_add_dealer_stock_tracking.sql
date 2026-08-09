/*
  # Add Dealer-wise Stock Tracking

  1. New Tables
    - `dealer_stock_allocation` - Tracks fertilizer stock allocation to dealers in MTS (Metric Tons)

  2. Changes
    - Enables tracking of which dealer has which fertilizer and quantity
    - Uses MTS (Metric Tons) as unit of measurement
*/

-- Create dealer stock allocation table
CREATE TABLE IF NOT EXISTS dealer_stock_allocation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  fertilizer_type text NOT NULL,
  quantity_mts numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dealer_stock_allocation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view dealer stock"
  ON dealer_stock_allocation FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert dealer stock"
  ON dealer_stock_allocation FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update dealer stock"
  ON dealer_stock_allocation FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete dealer stock"
  ON dealer_stock_allocation FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- Create indexes for performance
CREATE INDEX idx_dealer_stock_dealer_id ON dealer_stock_allocation(dealer_id);
CREATE INDEX idx_dealer_stock_fertilizer ON dealer_stock_allocation(fertilizer_type);
