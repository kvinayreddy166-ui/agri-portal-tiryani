INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view forms_downloads" ON forms_downloads;
DROP POLICY IF EXISTS "Admin can insert forms_downloads" ON forms_downloads;
DROP POLICY IF EXISTS "Admin can update forms_downloads" ON forms_downloads;
DROP POLICY IF EXISTS "Admin can delete forms_downloads" ON forms_downloads;

CREATE POLICY "Public can view forms_downloads"
  ON forms_downloads FOR SELECT
  TO anon, authenticated
  USING (category IN ('fertilizers', 'seed', 'pesticides'));

CREATE POLICY "Admin can insert forms_downloads"
  ON forms_downloads FOR INSERT
  TO authenticated
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update forms_downloads"
  ON forms_downloads FOR UPDATE
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete forms_downloads"
  ON forms_downloads FOR DELETE
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

DROP POLICY IF EXISTS "Admin can upload statutory forms" ON storage.objects;

CREATE POLICY "Admin can upload statutory forms"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = 'forms'
    AND lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com'
  );
