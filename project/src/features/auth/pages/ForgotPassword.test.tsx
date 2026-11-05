import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPassword } from './ForgotPassword';
import { ResendOtpService } from '../services/resendOtpService';
import * as LanguageContextModule from '../../../shared/context/LanguageContext';

vi.mock('../services/resendOtpService', () => ({
  ResendOtpService: {
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe('ForgotPassword — Multi-step Reset Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(LanguageContextModule, 'useLanguage').mockReturnValue({
      language: 'en',
      isTelugu: false,
      toggleLanguage: vi.fn(),
      t: (en: string) => en,
    });
  });

  it('renders Step 1 (Find Your Account) with registered email input', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(html).toContain('Reset Password');
    expect(html).toContain('Find Your Account');
    expect(html).toContain('Registered Email Address');
    expect(html).toContain('Send Verification OTP');
    expect(html).toContain('Back to Login');
  });

  it('ResendOtpService dispatches reset password OTP correctly', async () => {
    vi.mocked(ResendOtpService.sendOtp).mockResolvedValueOnce({
      success: true,
      message: 'OTP dispatched via Resend',
    });

    const res = await ResendOtpService.sendOtp({
      email: 'officer@gmail.com',
      fullName: 'Officer',
      designation: 'Officer',
      purpose: 'reset_password',
    });

    expect(res.success).toBe(true);
    expect(ResendOtpService.sendOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'officer@gmail.com',
        purpose: 'reset_password',
      })
    );
  });

  it('ResendOtpService resets password when valid code and new password provided', async () => {
    vi.mocked(ResendOtpService.resetPassword).mockResolvedValueOnce({
      success: true,
      message: 'Password reset successfully',
    });

    const res = await ResendOtpService.resetPassword({
      email: 'officer@gmail.com',
      token: '123456',
      newPassword: 'NewSecurePassword123!',
    });

    expect(res.success).toBe(true);
    expect(res.message).toBe('Password reset successfully');
  });
});
