-- =====================================================================
-- Migration: 20261107010000_alter_officer_email_otps_purpose.sql
-- Description: Add 'reset_password' to officer_email_otps purpose check constraint
-- =====================================================================

-- Drop the old check constraint
ALTER TABLE public.officer_email_otps DROP CONSTRAINT IF EXISTS officer_email_otps_purpose_check;

-- Add the new check constraint with reset_password included
ALTER TABLE public.officer_email_otps
  ADD CONSTRAINT officer_email_otps_purpose_check
  CHECK (purpose IN ('registration', 'login', 'reset_password'));
