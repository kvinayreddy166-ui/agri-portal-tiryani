-- =====================================================================
-- Migration: 20261239000000_harden_is_portal_admin.sql
-- Description: is_portal_admin() previously relied solely on the JWT
--              'email' claim. If a token is issued without that claim
--              (or with different casing), the portal admin silently
--              loses read access to every officer-scoped table
--              (officer_statutory_orders, officer_inspections,
--              officer_samples, officer_cases, officer_document_archive),
--              making Saved Records & Storage appear empty.
--              Add the immutable admin auth.users id as an OR condition —
--              auth.uid() comes from the 'sub' claim which is always
--              present on authenticated tokens.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_portal_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    auth.uid() = '0aa47647-42c0-4000-af00-e10ef4c2a77b'::uuid
    OR lower(COALESCE(auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com',
    FALSE
  );
$$ LANGUAGE sql STABLE SET search_path = public;
