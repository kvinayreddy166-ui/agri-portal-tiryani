import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OfficerSignUp } from './OfficerSignUp';
import { ResendOtpService } from '../services/resendOtpService';
import * as AuthContextModule from '../../../shared/context/AuthContext';
import * as LanguageContextModule from '../../../shared/context/LanguageContext';

vi.mock('../services/resendOtpService', () => ({
  ResendOtpService: {
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
}));

vi.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
  isAdmin: vi.fn(() => false),
  isTestUser: vi.fn(() => false),
  isDealerUser: vi.fn(() => false),
  isOfficerUser: vi.fn(() => false),
  getDealerIdFromUser: vi.fn(() => null),
  clearPersistedSupabaseAuth: vi.fn(),
}));

describe('OfficerSignUp — 3-Step Registration Flow', () => {
  const mockRegisterOfficer = vi.fn();
  const mockSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(LanguageContextModule, 'useLanguage').mockReturnValue({
      language: 'en',
      isTelugu: false,
      toggleLanguage: vi.fn(),
      t: (en: string) => en,
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: false,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: false,
      officerProfile: null,
      dealerId: null,
      dealerName: null,
      signIn: mockSignIn,
      signInDealer: vi.fn(),
      signInOfficerOtp: vi.fn(),
      verifyOfficerOtp: vi.fn(),
      registerOfficer: mockRegisterOfficer,
      refreshOfficerProfile: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it('renders Step 1 (Officer Details) without showing password fields initially', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/register']}>
        <OfficerSignUp />
      </MemoryRouter>
    );

    // Header and stepper
    expect(html).toContain('Agricultural Officer Sign Up');
    expect(html).toContain('1. Details');
    expect(html).toContain('2. Email OTP');
    expect(html).toContain('3. Password');

    // Details fields
    expect(html).toContain('Officer Full Name');
    expect(html).toContain('Designation');
    expect(html).toContain('Mobile Number');
    expect(html).toContain('Email Address');
    expect(html).toContain('Send Verification OTP &amp; Continue');

    // Password must NOT be present in Step 1
    expect(html).not.toContain('Create Password');
    expect(html).not.toContain('Confirm Password');
  });

  it('ResendOtpService correctly dispatches OTP and verifies email for officer signup', async () => {
    vi.mocked(ResendOtpService.sendOtp).mockResolvedValueOnce({
      success: true,
      message: 'OTP dispatched via Resend',
    });

    const sendRes = await ResendOtpService.sendOtp({
      email: 'officer@gmail.com',
      fullName: 'K. Vinay Reddy',
      designation: 'MAO',
      purpose: 'registration',
      payload: {
        district: 'Kumuram Bheem Asifabad',
        mandal: 'Tiryani',
        phone: '9949497506',
      },
    });

    expect(sendRes.success).toBe(true);

    vi.mocked(ResendOtpService.verifyOtp).mockResolvedValueOnce({
      success: true,
      message: 'Email verified successfully',
    });

    const verifyRes = await ResendOtpService.verifyOtp(
      'officer@gmail.com',
      '123456',
      'registration'
    );

    expect(verifyRes.success).toBe(true);
  });
});
