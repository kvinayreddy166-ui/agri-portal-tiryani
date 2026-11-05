-- =====================================================================
-- Migration: 20261105000000_create_officer_hub_and_records.sql
-- Description: Agricultural Officer Profiles, Statutory Orders, Inspections,
--              and Sampling Memos storage with Row Level Security (RLS).
-- =====================================================================

-- 1. Officer Profiles Table
CREATE TABLE IF NOT EXISTS public.officer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL, -- 'AEO', 'MAO', 'ADA', 'DAO'
  hrms_id TEXT,
  district TEXT NOT NULL,
  mandal TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'officer',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_officer_profiles_phone ON public.officer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_officer_profiles_email ON public.officer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_officer_profiles_district_mandal ON public.officer_profiles(district, mandal);

-- 2. Officer Dealer Inspections Table
CREATE TABLE IF NOT EXISTS public.officer_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('fertilizer', 'pesticide', 'seed')),
  firm_name TEXT NOT NULL,
  license_number TEXT,
  inspection_date DATE NOT NULL,
  findings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_officer_inspections_officer_date ON public.officer_inspections(officer_id, inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_officer_inspections_type ON public.officer_inspections(inspection_type);

-- 3. Officer Statutory Orders (Stop Sale, Seizure, Revocation, Show Cause Notices)
CREATE TABLE IF NOT EXISTS public.officer_statutory_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL CHECK (order_type IN ('stop_sale', 'seizure', 'revocation', 'show_cause')),
  commodity TEXT NOT NULL CHECK (commodity IN ('fertilizer', 'pesticide', 'seed')),
  order_number TEXT NOT NULL,
  order_date DATE NOT NULL,
  firm_name TEXT NOT NULL,
  mandal TEXT,
  district TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_officer_statutory_orders_officer ON public.officer_statutory_orders(officer_id, order_type, commodity);
CREATE INDEX IF NOT EXISTS idx_officer_statutory_orders_date ON public.officer_statutory_orders(order_date DESC);

-- 4. Officer Sampling Memos / Covering Letters
CREATE TABLE IF NOT EXISTS public.officer_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commodity TEXT NOT NULL CHECK (commodity IN ('fertilizer', 'pesticide', 'seed')),
  sample_code TEXT NOT NULL,
  firm_name TEXT NOT NULL,
  date_of_sampling DATE NOT NULL,
  batch_no TEXT,
  covering_letter_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  lab_status TEXT NOT NULL DEFAULT 'DISPATCHED' CHECK (lab_status IN ('DRAFT', 'DISPATCHED', 'RECEIVED_LAB', 'TEST_PASSED', 'TEST_FAILED')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_officer_samples_officer ON public.officer_samples(officer_id, commodity, sample_code);
CREATE INDEX IF NOT EXISTS idx_officer_samples_date ON public.officer_samples(date_of_sampling DESC);

-- 5. Updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at_officer_profiles ON public.officer_profiles;
CREATE TRIGGER handle_updated_at_officer_profiles
  BEFORE UPDATE ON public.officer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_officer_inspections ON public.officer_inspections;
CREATE TRIGGER handle_updated_at_officer_inspections
  BEFORE UPDATE ON public.officer_inspections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_officer_statutory_orders ON public.officer_statutory_orders;
CREATE TRIGGER handle_updated_at_officer_statutory_orders
  BEFORE UPDATE ON public.officer_statutory_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_officer_samples ON public.officer_samples;
CREATE TRIGGER handle_updated_at_officer_samples
  BEFORE UPDATE ON public.officer_samples
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row Level Security (RLS)
ALTER TABLE public.officer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_statutory_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_samples ENABLE ROW LEVEL SECURITY;

-- Helper function for admin check
CREATE OR REPLACE FUNCTION public.is_portal_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com',
    FALSE
  );
$$ LANGUAGE sql STABLE;

-- Profiles Policies
CREATE POLICY "Officers can read their own profile or admins can read all"
  ON public.officer_profiles FOR SELECT
  USING (auth.uid() = id OR public.is_portal_admin());

CREATE POLICY "Officers can insert their own profile"
  ON public.officer_profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_portal_admin());

CREATE POLICY "Officers can update their own profile"
  ON public.officer_profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_portal_admin());

CREATE POLICY "Only admins can delete officer profiles"
  ON public.officer_profiles FOR DELETE
  USING (public.is_portal_admin());

-- Inspections Policies
CREATE POLICY "Officers can manage their own inspections"
  ON public.officer_inspections FOR ALL
  USING (auth.uid() = officer_id OR public.is_portal_admin())
  WITH CHECK (auth.uid() = officer_id OR public.is_portal_admin());

-- Statutory Orders Policies
CREATE POLICY "Officers can manage their own statutory orders"
  ON public.officer_statutory_orders FOR ALL
  USING (auth.uid() = officer_id OR public.is_portal_admin())
  WITH CHECK (auth.uid() = officer_id OR public.is_portal_admin());

-- Sampling Memos Policies
CREATE POLICY "Officers can manage their own sampling memos"
  ON public.officer_samples FOR ALL
  USING (auth.uid() = officer_id OR public.is_portal_admin())
  WITH CHECK (auth.uid() = officer_id OR public.is_portal_admin());
