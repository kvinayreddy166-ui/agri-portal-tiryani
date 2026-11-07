-- =====================================================================
-- Migration: 20261108000000_officer_profile_officer_details.sql
-- Description: Adds qualification and division columns to officer_profiles
--              so inspector details collected at registration can autofill
--              statutory forms, inspections, and order entries.
-- =====================================================================

ALTER TABLE public.officer_profiles
  ADD COLUMN IF NOT EXISTS qualification TEXT,
  ADD COLUMN IF NOT EXISTS division TEXT;
