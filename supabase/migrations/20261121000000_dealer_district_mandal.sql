-- Add structured district/mandal to dealers for filtering and reporting.
-- Existing rows keep NULL until backfilled via the dealer edit form or re-import.
ALTER TABLE public.dealers
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS mandal text;

CREATE INDEX IF NOT EXISTS idx_dealers_district ON public.dealers(district);
CREATE INDEX IF NOT EXISTS idx_dealers_mandal ON public.dealers(mandal);
