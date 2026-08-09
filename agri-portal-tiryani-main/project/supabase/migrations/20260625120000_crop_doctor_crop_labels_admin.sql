/*
  # Crop Doctor crop label/image admin editing

  Allows the administrator to update the public crop labels and image URLs shown in Crop Doctor.
*/

DO $$
BEGIN
  IF to_regclass('public.crop_protection_crops') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.crop_protection_crops ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Public can view active crop protection crops" ON public.crop_protection_crops';
    EXECUTE 'DROP POLICY IF EXISTS "Admin can edit crop protection crops" ON public.crop_protection_crops';

    EXECUTE '
      CREATE POLICY "Public can view active crop protection crops"
        ON public.crop_protection_crops FOR SELECT
        TO anon, authenticated
        USING (active IS DISTINCT FROM false)
    ';

    EXECUTE '
      CREATE POLICY "Admin can edit crop protection crops"
        ON public.crop_protection_crops FOR ALL
        TO authenticated
        USING (lower(auth.jwt() ->> ''email'') = ''k.vinayreddy166@gmail.com'')
        WITH CHECK (lower(auth.jwt() ->> ''email'') = ''k.vinayreddy166@gmail.com'')
    ';
  END IF;
END $$;
