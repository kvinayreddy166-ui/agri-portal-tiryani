/*
  # Officer document archive uploads — storage.objects RLS fix

  Officer generated documents (PDFs archived in Records) upload to the
  'uploads' bucket under officers/{user_id}/{year}/{month}/{document_id}.pdf
  via the Supabase Storage fallback in uploadQueuedDocument().

  Existing INSERT policies only cover:
    - admin email (any folder)
    - 'forms/' folder (admin only)
    - 'stock-inventory/' folder (dealer portal users only)

  Officers therefore hit "new row violates row-level security policy" on
  storage.objects. This adds officer-scoped INSERT/UPDATE/DELETE policies
  restricted to the caller's own officers/{auth.uid()}/ prefix.
*/

DROP POLICY IF EXISTS "Officers can upload own archived documents" ON storage.objects;
DROP POLICY IF EXISTS "Officers can update own archived documents" ON storage.objects;
DROP POLICY IF EXISTS "Officers can delete own archived documents" ON storage.objects;

CREATE POLICY "Officers can upload own archived documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = 'officers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Officers can update own archived documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = 'officers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = 'officers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Officers can delete own archived documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = 'officers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
