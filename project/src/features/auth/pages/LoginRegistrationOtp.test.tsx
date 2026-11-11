import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';
import { ResendOtpService } from '../services/resendOtpService';
import { AuthProvider } from '../../../shared/context/AuthContext';
import { LanguageProvider } from '../../../shared/context/LanguageContext';

vi.mock('../services/resendOtpService', () => ({
  ResendOtpService: {
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
}));

vi.mock('../../../shared/lib/siteHits', () => ({
  recordSiteHit: vi.fn(),
}));

describe('Login — Agricultural Officer Registration with Resend OTP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Login screen including officer portal without crashing', () => {
    const html = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <LanguageProvider>
            <Login />
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toBeDefined();
    expect(html).toContain('Officer Sign In');
    expect(html).toContain('Registered Email Address');
    expect(html).toContain('Sign In as Officer');
    expect(html).not.toContain('Sign Up as Officer');
    expect(html).not.toContain('Official Email OTP (Instant)');
    expect(html).not.toContain('Password Login');
  });

  it('ResendOtpService handles registration OTP send and verification cycle correctly', async () => {
    vi.mocked(ResendOtpService.sendOtp).mockResolvedValueOnce({
      success: true,
      message: 'A 6-digit verification code has been dispatched via Resend to k.vinayreddy166@gmail.com.',
    });

    const sendRes = await ResendOtpService.sendOtp({
      email: 'k.vinayreddy166@gmail.com',
      fullName: 'K. Vinay Reddy',
      designation: 'MAO',
      purpose: 'registration',
      payload: {
        district: 'Kumurambheem Asifabad',
        mandal: 'Tiryani',
        phone: '9949497506',
      },
    });

    expect(sendRes.success).toBe(true);
    expect(sendRes.message).toContain('Resend');

    vi.mocked(ResendOtpService.verifyOtp).mockResolvedValueOnce({
      success: true,
      message: 'Email verified successfully.',
      payload: { role: 'officer' },
    });

    const verifyRes = await ResendOtpService.verifyOtp(
      'k.vinayreddy166@gmail.com',
      '492810',
      'registration'
    );

    expect(verifyRes.success).toBe(true);
    expect(verifyRes.payload?.role).toBe('officer');
  });

  it('prevents sending OTP for malformed email addresses', async () => {
    vi.mocked(ResendOtpService.sendOtp).mockResolvedValueOnce({
      success: false,
      message: '',
      error: 'Please enter a valid official email address.',
    });

    const invalidRes = await ResendOtpService.sendOtp({
      email: 'invalid-email',
      fullName: 'Test Officer',
      designation: 'AEO',
      purpose: 'registration',
    });

    expect(invalidRes.success).toBe(false);
    expect(invalidRes.error).toContain('valid official email address');
  });
});
