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

  it('does NOT show Saved Records & Storage in the public toolkit', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: false,
      isElevatedOfficerUser: false,
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

    // "Saved Records & Storage" must NOT be in public toolkit
    expect(html).not.toContain('Officer Saved Records &amp; Storage');
    expect(html).not.toContain('Officer Saved Records & Storage');
    expect(html).not.toContain('Saved Records &amp; Storage');
    expect(html).not.toContain('Saved Records & Storage');
    expect(html).not.toContain('Cloud archive of notices');
  });

  it('shows Saved Records & Storage for authenticated agricultural officers', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'officer-123', email: 'officer@telangana.gov.in' } as any,
      session: {} as any,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: false,
      isElevatedOfficerUser: false,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: true,
      officerProfile: {
        id: 'officer-123',
        full_name: 'K. Vinay Reddy',
        designation: 'MAO',
        hrms_id: '123456',
        district: 'Kumurambheem Asifabad',
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
      <MemoryRouter initialEntries={['/officer-toolkit/my-records']}>
        <OfficersToolkit isAdmin={false} isTestUser={false} isPublic={false} initialTab="records" fixedTab="records" />
      </MemoryRouter>
    );

    // Saved Records & Storage should NOT show the Field Tools or Government Portals switcher buttons
    expect(html).not.toContain('Field Tools');
    expect(html).not.toContain('Government Portals');

    // Authenticated officer sees their records & cloud archive
    expect(html).toContain('Saved Records &amp; Storage');
    expect(html).toContain('Synced to cloud storage');
  });

  it('renders Field Tools module without disturbing cards', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/field-tools']}>
        <OfficersToolkit isPublic={false} fixedTab="tools" />
      </MemoryRouter>
    );
    expect(html).toContain('Field Tools');
    expect(html).toContain('Tour Diary');
    expect(html).not.toContain('Saved Records &amp; Storage');
    // Enforcement Tracker is a separate module, NOT in Field Tools cards
    expect(html).not.toContain('Enforcement Tracker');
    expect(html).not.toContain('Case management, notice deadlines');
  });

  it('renders module switcher without Enforcement Tracker for authenticated officers', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'officer-123', email: 'officer@telangana.gov.in' } as any,
      session: {} as any,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: false,
      isElevatedOfficerUser: false,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: true,
      officerProfile: {
        id: 'officer-123',
        full_name: 'K. Vinay Reddy',
        designation: 'MAO',
        hrms_id: '123456',
        district: 'Kumurambheem Asifabad',
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

    // Switcher should have all modules except Enforcement Tracker
    expect(html).toContain('Field Tools');
    expect(html).not.toContain('Enforcement Tracker');
    expect(html).toContain('Saved Records &amp; Storage');
    expect(html).toContain('Government Portals');

    // Field Tools card grid should NOT have Enforcement Tracker
    expect(html).not.toContain('Case management, notice deadlines');
  });

  it('renders Government Portals module without disturbing cards', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/government-portals']}>
        <OfficersToolkit isPublic={false} fixedTab="portals" />
      </MemoryRouter>
    );
    expect(html).toContain('Government Portals');
    expect(html).not.toContain('Saved Records &amp; Storage');
  });
});
