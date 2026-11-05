import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OfficersToolkit } from './OfficersToolkit';
import * as AuthContextModule from '../../../shared/context/AuthContext';
import * as LanguageContextModule from '../../../shared/context/LanguageContext';

vi.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
  isAdmin: vi.fn(() => false),
  isTestUser: vi.fn(() => false),
  isDealerUser: vi.fn(() => false),
  isOfficerUser: vi.fn(() => false),
  getDealerIdFromUser: vi.fn(() => null),
  clearPersistedSupabaseAuth: vi.fn(),
}));

describe('OfficersToolkit — Public vs Authenticated Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(LanguageContextModule, 'useLanguage').mockReturnValue({
      language: 'en',
      isTelugu: false,
      toggleLanguage: vi.fn(),
      t: (en: string) => en,
    });
  });

  it('does NOT show Officer Records & Cloud Archive in the public toolkit', () => {
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
      signIn: vi.fn(),
      signInDealer: vi.fn(),
      signInOfficerOtp: vi.fn(),
      verifyOfficerOtp: vi.fn(),
      registerOfficer: vi.fn(),
      refreshOfficerProfile: vi.fn(),
      signOut: vi.fn(),
    });

    const html = renderToString(
      <MemoryRouter initialEntries={['/officer-toolkit']}>
        <OfficersToolkit isAdmin={false} isTestUser={false} isPublic={true} />
      </MemoryRouter>
    );

    // General toolkit content should render
    expect(html).toContain('Officer Toolkit');
    expect(html).toContain('Field Tools');
    expect(html).toContain('Government Portals');

    // "Officer Records & Cloud Archive" must NOT be in public toolkit
    expect(html).not.toContain('Officer Records &amp; Cloud Archive');
    expect(html).not.toContain('Officer Records & Cloud Archive');
    expect(html).not.toContain('Officer Records &amp; Cloud');
    expect(html).not.toContain('Officer Records & Cloud');
    expect(html).not.toContain('Cloud archive of notices');
  });

  it('shows Officer Records & Cloud Archive for authenticated agricultural officers', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'officer-123', email: 'officer@telangana.gov.in' } as any,
      session: {} as any,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: false,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: true,
      officerProfile: {
        id: 'officer-123',
        full_name: 'K. Vinay Reddy',
        designation: 'MAO',
        hrms_id: '123456',
        district: 'Kumuram Bheem Asifabad',
        mandal: 'Tiryani',
        phone: '9949497506',
        email: 'officer@telangana.gov.in',
        role: 'officer',
        status: 'active',
      },
      dealerId: null,
      dealerName: null,
      signIn: vi.fn(),
      signInDealer: vi.fn(),
      signInOfficerOtp: vi.fn(),
      verifyOfficerOtp: vi.fn(),
      registerOfficer: vi.fn(),
      refreshOfficerProfile: vi.fn(),
      signOut: vi.fn(),
    });

    const html = renderToString(
      <MemoryRouter initialEntries={['/officer-toolkit']}>
        <OfficersToolkit isAdmin={false} isTestUser={false} isPublic={false} />
      </MemoryRouter>
    );

    // General toolkit content should render
    expect(html).toContain('Officer Toolkit');
    expect(html).toContain('Field Tools');

    // Authenticated officer sees their records & cloud archive
    expect(html).toContain('Officer Records &amp; Cloud');
    expect(html).toContain('Officer Records &amp; Cloud Archive');
    expect(html).toContain('Cloud archive of notices, stop sale orders, inspections &amp; memos.');
  });
});
