-- =====================================================================
-- Migration: 20261238000000_reset_password_otp_consumption_fix.sql
-- Description: Fix OTP consumption for reset_password flow
--              - verify_officer_email_otp no longer consumes reset_password OTPs
--              - reset-password Edge Function now consumes OTP after successful reset
-- =====================================================================

-- Update verify_officer_email_otp to NOT consume reset_password OTPs
-- Only registration and login OTPs are consumed by verify()
-- reset_password OTPs are consumed by the reset-password Edge Function after successful password update
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

  -- Mark as consumed for registration and login, but NOT for reset_password
  -- reset_password OTPs are consumed by the reset-password Edge Function after successful password update
  IF v_record.purpose <> 'reset_password' THEN
    UPDATE public.officer_email_otps SET consumed = TRUE WHERE id = v_record.id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'OTP verified successfully.',
    'payload', v_record.payload
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
