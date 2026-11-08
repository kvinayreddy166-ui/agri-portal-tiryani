-- =====================================================================
-- Migration: 20261114000000_officer_dealer_delete.sql
-- Description: Allow officers to delete dealers they created themselves.
--              Admin retains delete access to all dealers.
-- =====================================================================

DROP POLICY IF EXISTS "Admin can delete dealers" ON public.dealers;

CREATE POLICY "Admin can delete dealers"
  ON public.dealers FOR DELETE
  TO authenticated
  USING (public.is_portal_admin());

CREATE POLICY "Officers can delete own dealers"
  ON public.dealers FOR DELETE
  TO authenticated
  USING (public.is_officer_user() AND created_by = auth.uid());
