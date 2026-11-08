-- =====================================================================
-- Migration: 20261108000000_officer_records_dedupe.sql
-- Description: Remove duplicate officer records created by repeated
--              sync calls, then enforce uniqueness so upserts dedupe.
-- =====================================================================

-- 1. Dedupe officer_statutory_orders by (officer_id, order_number)
DELETE FROM public.officer_statutory_orders a
WHERE EXISTS (
  SELECT 1 FROM public.officer_statutory_orders b
  WHERE b.officer_id = a.officer_id
    AND b.order_number = a.order_number
    AND (b.created_at, b.ctid) < (a.created_at, a.ctid)
);

-- 2. Dedupe officer_samples by (officer_id, commodity, sample_code)
DELETE FROM public.officer_samples a
WHERE EXISTS (
  SELECT 1 FROM public.officer_samples b
  WHERE b.officer_id = a.officer_id
    AND b.commodity = a.commodity
    AND b.sample_code = a.sample_code
    AND (b.created_at, b.ctid) < (a.created_at, a.ctid)
);

-- 3. Dedupe officer_inspections by draft id stored in findings_json.
--    Rows without an id cannot be matched safely and are left untouched.
DELETE FROM public.officer_inspections a
WHERE COALESCE(a.findings_json->>'id', '') <> ''
  AND EXISTS (
    SELECT 1 FROM public.officer_inspections b
    WHERE b.officer_id = a.officer_id
      AND b.findings_json->>'id' = a.findings_json->>'id'
      AND (b.created_at, b.ctid) < (a.created_at, a.ctid)
  );

-- 4. Unique constraints backing the client-side upserts
CREATE UNIQUE INDEX IF NOT EXISTS officer_statutory_orders_officer_number_key
  ON public.officer_statutory_orders(officer_id, order_number);

CREATE UNIQUE INDEX IF NOT EXISTS officer_samples_officer_commodity_code_key
  ON public.officer_samples(officer_id, commodity, sample_code);

CREATE UNIQUE INDEX IF NOT EXISTS officer_inspections_officer_record_key
  ON public.officer_inspections(officer_id, (findings_json->>'id'))
  WHERE COALESCE(findings_json->>'id', '') <> '';
