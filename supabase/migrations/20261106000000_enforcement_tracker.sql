-- =====================================================================
-- Migration: 20261106000000_enforcement_tracker.sql
-- Description: Enforcement case management, show-cause reply deadlines,
--              and sample lab lifecycle tracking for officer hub.
-- =====================================================================

-- 1. Enforcement Cases table — links inspections, samples & orders per dealer/commodity
CREATE TABLE IF NOT EXISTS public.officer_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL,
  dealer_name TEXT NOT NULL,
  license_number TEXT,
  commodity TEXT NOT NULL CHECK (commodity IN ('fertilizer', 'pesticide', 'seed')),
  stage TEXT NOT NULL DEFAULT 'INSPECTION' CHECK (stage IN ('INSPECTION', 'SAMPLING', 'LAB_TEST', 'SHOW_CAUSE', 'ENFORCEMENT', 'CLOSED')),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
  opened_date DATE NOT NULL,
  target_close_date DATE,
  linked_record_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_officer_cases_officer ON public.officer_cases(officer_id, stage);
CREATE INDEX IF NOT EXISTS idx_officer_cases_dealer ON public.officer_cases(officer_id, dealer_name);

-- 2. Show-cause reply deadline tracking on statutory orders
ALTER TABLE public.officer_statutory_orders
  ADD COLUMN IF NOT EXISTS reply_deadline DATE,
  ADD COLUMN IF NOT EXISTS reply_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (reply_status IN ('PENDING', 'REPLIED', 'NO_REPLY', 'EXPIRED', 'WAIVED'));

CREATE INDEX IF NOT EXISTS idx_officer_orders_reply_deadline
  ON public.officer_statutory_orders(officer_id, reply_deadline)
  WHERE order_type = 'show_cause';

-- 3. Sample lab lifecycle timestamps
ALTER TABLE public.officer_samples
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lab_report_ref TEXT;

-- 4. updated_at trigger for cases
DROP TRIGGER IF EXISTS handle_updated_at_officer_cases ON public.officer_cases;
CREATE TRIGGER handle_updated_at_officer_cases
  BEFORE UPDATE ON public.officer_cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. RLS for officer_cases
ALTER TABLE public.officer_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can manage their own cases"
  ON public.officer_cases FOR ALL
  USING (auth.uid() = officer_id OR public.is_portal_admin())
  WITH CHECK (auth.uid() = officer_id OR public.is_portal_admin());
