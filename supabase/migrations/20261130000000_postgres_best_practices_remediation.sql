-- Migration: 20261130000000_postgres_best_practices_remediation.sql
-- Description: Remediates Supabase Postgres best practice findings:
-- 1. Covers unindexed foreign keys with dedicated indexes.
-- 2. Sets explicit immutable search paths for all functions.
-- 3. Remediates RLS policies referencing user_metadata and optimizes InitPlan evaluation.
-- 4. Restricts anonymous execution of internal SECURITY DEFINER functions.

-- ============================================================================
-- 1. Unindexed Foreign Keys
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_crop_data_crop_id
  ON public.crop_data(crop_id);

CREATE INDEX IF NOT EXISTS idx_fertilizer_calculation_records_created_by
  ON public.fertilizer_calculation_records(created_by);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_by
  ON public.knowledge_documents(created_by);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_superseded_by
  ON public.knowledge_documents(superseded_by);

CREATE INDEX IF NOT EXISTS idx_knowledge_queries_user_id
  ON public.knowledge_queries(user_id);

CREATE INDEX IF NOT EXISTS idx_officer_document_archive_parent_id
  ON public.officer_document_archive(parent_document_id);

-- Supporting index for portal_email lookups in RLS policies
CREATE INDEX IF NOT EXISTS idx_dealers_portal_email
  ON public.dealers(portal_email);

-- Ensure site_hits table exists for anonymous site visits tracking
CREATE TABLE IF NOT EXISTS public.site_hits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  path text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_hits_viewed_at
  ON public.site_hits (viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_hits_visitor_id
  ON public.site_hits (visitor_id);

ALTER TABLE public.site_hits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record site hits" ON public.site_hits;
CREATE POLICY "Anyone can record site hits"
  ON public.site_hits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view site hits" ON public.site_hits;
CREATE POLICY "Admin can view site hits"
  ON public.site_hits
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

-- ============================================================================
-- 2. Set search_path on Functions (Remediates function_search_path_mutable)
-- ============================================================================
ALTER FUNCTION public.is_dealer_portal_user() SET search_path = public;
ALTER FUNCTION public.current_dealer_id() SET search_path = public;
ALTER FUNCTION public.dealer_portal_email(text) SET search_path = public;
ALTER FUNCTION public.set_urea_farmer_booking_dedupe_key() SET search_path = public;
ALTER FUNCTION public.set_urea_dealer_stock_dedupe_key() SET search_path = public;
ALTER FUNCTION public.knowledge_chunks_fts_tsv() SET search_path = public;
ALTER FUNCTION public.is_knowledge_admin() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.knowledge_vector_search(vector, uuid, text, text, text, integer, text, integer) SET search_path = public, extensions;
ALTER FUNCTION public.knowledge_keyword_search(text, uuid, text, text, text, integer, text, integer) SET search_path = public, extensions;
ALTER FUNCTION public.cibrc_crops(text) SET search_path = public;
ALTER FUNCTION public.cibrc_targets(text, text) SET search_path = public;
ALTER FUNCTION public.is_portal_admin() SET search_path = public;
ALTER FUNCTION public.save_officer_email_otp(text, text, text, jsonb, integer) SET search_path = public;
ALTER FUNCTION public.verify_officer_email_otp(text, text, text) SET search_path = public;

-- ============================================================================
-- 3. Remediate RLS user_metadata References & Optimize InitPlan Evaluation
-- ============================================================================

-- Table: public.dealers
DROP POLICY IF EXISTS "Dealers can view own dealer record" ON public.dealers;
CREATE POLICY "Dealers can view own dealer record"
  ON public.dealers FOR SELECT
  TO authenticated
  USING (
    portal_email = (SELECT auth.jwt() ->> 'email')
    OR id = (SELECT public.current_dealer_id())
  );

-- Table: public.dealer_stock_allocation
DROP POLICY IF EXISTS "Dealer can insert own fertilizer tracking" ON public.dealer_stock_allocation;
CREATE POLICY "Dealer can insert own fertilizer tracking"
  ON public.dealer_stock_allocation FOR INSERT
  TO authenticated
  WITH CHECK (
    dealer_id IN (
      SELECT d.id FROM public.dealers d
      WHERE d.portal_email = (SELECT auth.jwt() ->> 'email')
    )
    OR dealer_id = (SELECT public.current_dealer_id())
  );

DROP POLICY IF EXISTS "Dealer can update own fertilizer tracking" ON public.dealer_stock_allocation;
CREATE POLICY "Dealer can update own fertilizer tracking"
  ON public.dealer_stock_allocation FOR UPDATE
  TO authenticated
  USING (
    dealer_id IN (
      SELECT d.id FROM public.dealers d
      WHERE d.portal_email = (SELECT auth.jwt() ->> 'email')
    )
    OR dealer_id = (SELECT public.current_dealer_id())
  )
  WITH CHECK (
    dealer_id IN (
      SELECT d.id FROM public.dealers d
      WHERE d.portal_email = (SELECT auth.jwt() ->> 'email')
    )
    OR dealer_id = (SELECT public.current_dealer_id())
  );

-- Update current_dealer_id() and is_dealer_portal_user() implementations to prioritize portal_email lookup
CREATE OR REPLACE FUNCTION public.current_dealer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (
      SELECT d.id
      FROM public.dealers d
      WHERE d.portal_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      LIMIT 1
    ),
    nullif(auth.jwt() -> 'app_metadata' ->> 'dealer_id', '')::uuid,
    nullif(auth.jwt() -> 'user_metadata' ->> 'dealer_id', '')::uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_dealer_portal_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    EXISTS (
      SELECT 1
      FROM public.dealers d
      WHERE d.portal_email = lower(coalesce(auth.jwt() ->> 'email', ''))
    ),
    false
  )
  OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'dealer'
  OR coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'dealer';
$$;

-- ============================================================================
-- 4. Restrict Anonymous Execution on Sensitive Internal SECURITY DEFINER Functions
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.hash_portal_password(text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.provision_all_dealer_portal_logins(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.provision_dealer_portal_login(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_officer_account(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_dealer_login(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_allocation_officers(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_dno_officer() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_officer_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.dealer_created_by_officer(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_dealer_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_dealer_portal_user() FROM anon;
