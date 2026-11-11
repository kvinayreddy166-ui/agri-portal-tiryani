-- =====================================================================
-- Migration: 20261119000000_elevated_officer_admin_dealers.sql
-- Description: Lets the elevated officer account (agofficetiryani@gmail.com)
--              read the Dealers Directory of admin-added dealers.
--              Scope: dealers created by the portal admin
--              (k.vinayreddy166@gmail.com) or legacy/imported rows
--              (created_by IS NULL). Dealers created by officers —
--              including the admin's own officer profile — are excluded.
-- =====================================================================

DROP POLICY IF EXISTS "Elevated officer can view admin dealers" ON public.dealers;

CREATE POLICY "Elevated officer can view admin dealers"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'agofficetiryani@gmail.com'
    AND (
      created_by IS NULL
      OR created_by = '0aa47647-42c0-4000-af00-e10ef4c2a77b'::uuid
    )
  );
