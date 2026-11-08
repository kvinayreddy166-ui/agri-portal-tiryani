-- Sample targets: officers enter sample code numbers per financial year and
-- commodity (fertilizer / seed / pesticide). Codes are then selectable in the
-- sampling forms. Officer-scoped: each officer manages only their own targets;
-- portal admins see and manage all.

CREATE TABLE IF NOT EXISTS public.sample_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_number text NOT NULL,
  financial_year text NOT NULL,
  commodity text NOT NULL CHECK (commodity IN ('fertilizer', 'seed', 'pesticide')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sample_targets_unique_code
  ON public.sample_targets (created_by, financial_year, commodity, lower(code_number));

CREATE INDEX IF NOT EXISTS sample_targets_lookup_idx
  ON public.sample_targets (created_by, financial_year, commodity);

ALTER TABLE public.sample_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sample_targets_select ON public.sample_targets;
CREATE POLICY sample_targets_select ON public.sample_targets
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_portal_admin());

DROP POLICY IF EXISTS sample_targets_insert ON public.sample_targets;
CREATE POLICY sample_targets_insert ON public.sample_targets
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.is_portal_admin());

DROP POLICY IF EXISTS sample_targets_update ON public.sample_targets;
CREATE POLICY sample_targets_update ON public.sample_targets
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_portal_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_portal_admin());

DROP POLICY IF EXISTS sample_targets_delete ON public.sample_targets;
CREATE POLICY sample_targets_delete ON public.sample_targets
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_portal_admin());
