/*
  # Update Fertilizer Units to MTS

  1. Changes
    - Update fertilizer_stock table unit column to use MTS (Metric Tons)
    - Change all existing 'kg' units to 'MTS'
    - Update default value for new records
*/

-- Update existing units from kg to MTS
UPDATE fertilizer_stock SET unit = 'MTS' WHERE unit = 'kg' OR unit IS NULL;

-- Ensure all new records default to MTS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fertilizer_stock' AND column_name = 'unit'
  ) THEN
    ALTER TABLE fertilizer_stock ALTER COLUMN unit SET DEFAULT 'MTS';
  END IF;
END $$;
