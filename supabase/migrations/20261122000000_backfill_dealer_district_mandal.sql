-- Backfill dealers.district / dealers.mandal from the creating officer's profile.
-- Only fills blank values; existing district/mandal data is never overwritten.
-- Dealers with no created_by (legacy/admin rows) or whose creator has no
-- officer_profiles row are left unset and can be filled via the edit form.

-- District: normalize known Kumurambheem spelling variants to the canonical name.
UPDATE public.dealers d
SET district = CASE
    WHEN lower(regexp_replace(op.district, '[^a-zA-Z0-9]', '', 'g')) IN (
      'kumurambheemasifabad', 'kumrambheemasifabad',
      'kumurambeemasifabad', 'kumrambeemasifabad',
      'kumurambheem', 'kumrambheem', 'kumurambeem', 'kumrambeem'
    ) THEN 'Kumurambheem Asifabad'
    ELSE op.district
  END
FROM public.officer_profiles op
WHERE d.created_by = op.id
  AND (d.district IS NULL OR btrim(d.district) = '');

-- Mandal: copy as stored on the officer profile.
UPDATE public.dealers d
SET mandal = op.mandal
FROM public.officer_profiles op
WHERE d.created_by = op.id
  AND (d.mandal IS NULL OR btrim(d.mandal) = '');
