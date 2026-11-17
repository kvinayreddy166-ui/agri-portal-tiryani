-- Merge duplicate seed dealer "DCMS Farmer Service Centre, Munigadapa"
-- (license 1105001, created twice 13 min apart). Keep the older row,
-- adopt the cleaner license/location values, drop the duplicate.
UPDATE public.dealers
SET license_number = '1105001',
    location = '1-95, Main Road, Munigadapa, Munigadapa(V)',
    updated_at = now()
WHERE id = '3d8eab19-a0ab-45ed-80e6-0cfd9a0516d6';

DELETE FROM public.dealers
WHERE id = 'cc6053e3-bee2-46d8-b4b5-3db433a53792';

-- Prevent duplicate dealers on the business keys. Partial + trimmed so
-- empty IFMS IDs (seed/pesticide) and 'N/A' licenses are exempt.
CREATE UNIQUE INDEX IF NOT EXISTS dealers_category_ifms_key
  ON public.dealers (dealer_category, btrim(ifms_id))
  WHERE ifms_id IS NOT NULL AND btrim(ifms_id) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS dealers_category_license_key
  ON public.dealers (dealer_category, btrim(license_number))
  WHERE license_number IS NOT NULL AND btrim(license_number) NOT IN ('', 'N/A');
