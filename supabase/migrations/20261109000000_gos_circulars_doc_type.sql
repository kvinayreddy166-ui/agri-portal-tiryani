/*
  # GOs and Circulars — document type

  Distinguishes Government Orders (GO) from Circulars so the portal can
  filter and badge them separately. Existing rows default to 'circular'.
*/

ALTER TABLE gos_circulars
  ADD COLUMN IF NOT EXISTS doc_type text NOT NULL DEFAULT 'circular';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gos_circulars_doc_type_check'
  ) THEN
    ALTER TABLE gos_circulars
      ADD CONSTRAINT gos_circulars_doc_type_check
      CHECK (doc_type IN ('go', 'circular'));
  END IF;
END $$;
