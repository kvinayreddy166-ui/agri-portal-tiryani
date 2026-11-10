-- =====================================================================
-- Migration: 20261117000000_dno_target_allocations.sql
-- Description: District Nodal Officers (DNO) allocate sampling targets —
--              numeric targets and sample code numbers — to MAO/ADA
--              officers, either per-officer or mandal-wide, per financial
--              year and commodity. Officers see allocations made to them
--              or to their mandal on their dashboard.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.officer_target_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allocated_by_name text,
  officer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = mandal-wide
  officer_name text,                                            -- display name / 'All officers'
  mandal text NOT NULL,
  district text,
  commodity text NOT NULL CHECK (commodity IN ('fertilizer', 'seed', 'pesticide')),
  financial_year text NOT NULL,
  numeric_target integer CHECK (numeric_target IS NULL OR numeric_target >= 0),
  code_number text,                                             -- sample code, mutually exclusive-ish with numeric_target
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (numeric_target IS NOT NULL OR code_number IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS officer_target_allocations_officer_idx
  ON public.officer_target_allocations (officer_id, financial_year, commodity);
CREATE INDEX IF NOT EXISTS officer_target_allocations_mandal_idx
  ON public.officer_target_allocations (mandal, financial_year, commodity);
CREATE INDEX IF NOT EXISTS officer_target_allocations_allocator_idx
  ON public.officer_target_allocations (allocated_by);

DROP TRIGGER IF EXISTS handle_updated_at_officer_target_allocations ON public.officer_target_allocations;
CREATE TRIGGER handle_updated_at_officer_target_allocations
  BEFORE UPDATE ON public.officer_target_allocations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.officer_target_allocations ENABLE ROW LEVEL SECURITY;

-- True when the caller's officer profile designation is DNO.
CREATE OR REPLACE FUNCTION public.is_dno_officer()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.officer_profiles op
    WHERE op.id = auth.uid() AND upper(op.designation) = 'DNO'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Officers see: allocations made to them, mandal-wide allocations for their
-- mandal, allocations they created themselves, and everything for admins.
DROP POLICY IF EXISTS officer_target_allocations_select ON public.officer_target_allocations;
CREATE POLICY officer_target_allocations_select ON public.officer_target_allocations
  FOR SELECT TO authenticated
  USING (
    allocated_by = auth.uid()
    OR officer_id = auth.uid()
    OR public.is_portal_admin()
    OR (
      officer_id IS NULL AND EXISTS (
        SELECT 1 FROM public.officer_profiles op
        WHERE op.id = auth.uid() AND op.mandal = officer_target_allocations.mandal
      )
    )
  );

-- Only DNO officers (or portal admins) can create allocations, always as themselves.
DROP POLICY IF EXISTS officer_target_allocations_insert ON public.officer_target_allocations;
CREATE POLICY officer_target_allocations_insert ON public.officer_target_allocations
  FOR INSERT TO authenticated
  WITH CHECK (
    allocated_by = auth.uid()
    AND (public.is_portal_admin() OR public.is_dno_officer())
  );

DROP POLICY IF EXISTS officer_target_allocations_update ON public.officer_target_allocations;
CREATE POLICY officer_target_allocations_update ON public.officer_target_allocations
  FOR UPDATE TO authenticated
  USING (allocated_by = auth.uid() AND (public.is_portal_admin() OR public.is_dno_officer()))
  WITH CHECK (allocated_by = auth.uid() AND (public.is_portal_admin() OR public.is_dno_officer()));

DROP POLICY IF EXISTS officer_target_allocations_delete ON public.officer_target_allocations;
CREATE POLICY officer_target_allocations_delete ON public.officer_target_allocations
  FOR DELETE TO authenticated
  USING (allocated_by = auth.uid() AND (public.is_portal_admin() OR public.is_dno_officer()));

-- List MAO/ADA officers (optionally filtered by district) for the DNO
-- allocation dropdown. SECURITY DEFINER because officer_profiles RLS only
-- allows reading your own profile.
CREATE OR REPLACE FUNCTION public.list_allocation_officers(p_district text DEFAULT NULL)
RETURNS TABLE(id uuid, full_name text, designation text, mandal text, district text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_portal_admin() OR public.is_dno_officer()) THEN
    RAISE EXCEPTION 'Not authorized to list officers for allocation';
  END IF;

  RETURN QUERY
    SELECT op.id, op.full_name, op.designation, op.mandal, op.district
    FROM public.officer_profiles op
    WHERE upper(op.designation) IN ('MAO', 'ADA')
      AND op.status = 'active'
      AND (p_district IS NULL OR op.district = p_district)
    ORDER BY op.mandal NULLS LAST, op.full_name;
END;
$$;

REVOKE ALL ON FUNCTION public.list_allocation_officers(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_allocation_officers(text) TO authenticated;
