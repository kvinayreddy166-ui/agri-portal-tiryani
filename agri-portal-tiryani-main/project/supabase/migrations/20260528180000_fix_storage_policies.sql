/*
  # Fix storage policies for uploads bucket

  Ensures authenticated users can view files and admin can upload/update/delete.
  Previous migration records were applied without creating storage.objects policies.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can view uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public can download uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete uploaded files" ON storage.objects;

CREATE POLICY "Authenticated users can view uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'uploads');

CREATE POLICY "Public can download uploads"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'uploads');

CREATE POLICY "Admin can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com'
  );

CREATE POLICY "Admin can update uploaded files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com'
  )
  WITH CHECK (
    bucket_id = 'uploads'
    AND lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com'
  );

CREATE POLICY "Admin can delete uploaded files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com'
  );
