import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResendOtpService } from './resendOtpService';
import { supabase } from '../../../shared/lib/supabase';

vi.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

describe('ResendOtpService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates email format before sending', async () => {
    const res = await ResendOtpService.sendOtp({
      email: 'invalid-email',
      fullName: 'Vinay Reddy',
      designation: 'MAO',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('valid official email address');
  });

  it('succeeds via Supabase Edge Function when deployed', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true, message: 'Dispatched via Resend' },
      error: null,
    } as never);

    const res = await ResendOtpService.sendOtp({
      email: 'k.vinayreddy166@gmail.com',
      fullName: 'Vinay Reddy',
      designation: 'MAO',
    });

    expect(res.success).toBe(true);
    expect(res.message).toBe('Dispatched via Resend');
    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email-otp', expect.anything());
  });

  it('verifyOtp returns error when code is missing', async () => {
    const res = await ResendOtpService.verifyOtp('officer@gmail.com', '');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('verifyOtp validates code successfully via database RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: { success: true, message: 'OTP verified successfully.' },
      error: null,
    } as never);

    const res = await ResendOtpService.verifyOtp('officer@gmail.com', '123456');
    expect(res.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('verify_officer_email_otp', {
      p_email: 'officer@gmail.com',
      p_otp_code: '123456',
      p_purpose: 'registration',
    });
  });

  it('verifyOtp handles expired or invalid code from database RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: { success: false, error: 'OTP code has expired. Please request a new one.' },
      error: null,
    } as never);

    const res = await ResendOtpService.verifyOtp('officer@gmail.com', '000000');
    expect(res.success).toBe(false);
    expect(res.error).toContain('expired');
  });
});
