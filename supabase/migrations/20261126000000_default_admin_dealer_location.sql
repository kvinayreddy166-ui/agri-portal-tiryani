-- Set district/mandal on dealers added by the portal admin or legacy rows
-- (created_by NULL or the admin user) that are still unset after the
-- officer-profile backfill. Portal jurisdiction default: Tiryani, Kumurambheem Asifabad.

UPDATE public.dealers
SET district = 'Kumurambheem Asifabad',
    mandal = 'Tiryani'
WHERE (district IS NULL OR btrim(district) = '')
  AND (mandal IS NULL OR btrim(mandal) = '')
  AND (
    created_by IS NULL
    OR created_by = '0aa47647-42c0-4000-af00-e10ef4c2a77b'::uuid
  );
