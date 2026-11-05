-- =====================================================================
-- Migration: 20261105010000_create_officer_email_otps.sql
-- Description: Stores temporary Email OTPs for Officer Registration & Login
--              sent via Resend Email API.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.officer_email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'registration' CHECK (purpose IN ('registration', 'login')),
  payload JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_officer_otps_lookup ON public.officer_email_otps(email, purpose, consumed, expires_at);

-- Row Level Security
ALTER TABLE public.officer_email_otps ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous users (during registration before having a JWT) to verify OTPs
CREATE POLICY "Allow anon insert and select on officer_email_otps"
  ON public.officer_email_otps FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- RPC to store an OTP securely
CREATE OR REPLACE FUNCTION public.save_officer_email_otp(
  p_email TEXT,
  p_otp_code TEXT,
  p_purpose TEXT DEFAULT 'registration',
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_expiry_minutes INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Invalidate any previous unconsumed OTPs for this email and purpose
  UPDATE public.officer_email_otps
  SET consumed = TRUE
  WHERE email = LOWER(TRIM(p_email)) AND purpose = p_purpose AND consumed = FALSE;

  -- Insert new OTP
  INSERT INTO public.officer_email_otps (
    email,
    otp_code,
    purpose,
    payload,
    expires_at
  ) VALUES (
    LOWER(TRIM(p_email)),
    TRIM(p_otp_code),
    p_purpose,
    p_payload,
    timezone('utc'::text, now()) + (p_expiry_minutes || ' minutes')::INTERVAL
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to verify an OTP
CREATE OR REPLACE FUNCTION public.verify_officer_email_otp(
  p_email TEXT,
  p_otp_code TEXT,
  p_purpose TEXT DEFAULT 'registration'
)
RETURNS JSONB AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM public.officer_email_otps
  WHERE email = LOWER(TRIM(p_email))
    AND purpose = p_purpose
    AND consumed = FALSE
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'No active OTP found. Please request a new code.');
  END IF;

  IF v_record.expires_at < timezone('utc'::text, now()) THEN
    UPDATE public.officer_email_otps SET consumed = TRUE WHERE id = v_record.id;
    RETURN jsonb_build_object('success', FALSE, 'error', 'OTP code has expired. Please request a new one.');
  END IF;

  IF v_record.attempts >= 5 THEN
    UPDATE public.officer_email_otps SET consumed = TRUE WHERE id = v_record.id;
    RETURN jsonb_build_object('success', FALSE, 'error', 'Too many failed attempts. Please request a new OTP.');
  END IF;

  IF v_record.otp_code <> TRIM(p_otp_code) THEN
    UPDATE public.officer_email_otps SET attempts = attempts + 1 WHERE id = v_record.id;
    RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid OTP code. Please enter the correct 6-digit code.');
  END IF;

  -- Mark as consumed
  UPDATE public.officer_email_otps SET consumed = TRUE WHERE id = v_record.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'OTP verified successfully.',
    'payload', v_record.payload
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
