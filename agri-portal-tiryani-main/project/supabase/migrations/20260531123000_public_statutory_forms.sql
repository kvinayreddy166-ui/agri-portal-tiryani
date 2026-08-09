DROP POLICY IF EXISTS "Public can view forms_downloads" ON forms_downloads;

CREATE POLICY "Public can view forms_downloads"
  ON forms_downloads FOR SELECT
  TO anon
  USING (category IN ('fertilizers', 'seed', 'pesticides'));
