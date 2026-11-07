import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { Layout } from '../../../app/Layout';
import { LanguageProvider } from '../../../shared/context/LanguageContext';
import { ThemeProvider } from '../../../shared/context/ThemeContext';

const mockUseAuth = vi.fn();

vi.mock('../../../shared/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../components/WeatherWidget', () => ({
  WeatherWidget: () => <div data-testid="weather-widget">Weather Widget Mock</div>,
}));

vi.mock('../components/MandiPricesWidget', () => ({
  MandiPricesWidget: () => <div data-testid="mandi-prices-widget">Mandi Prices Mock</div>,
}));

describe('Dashboard — Officer vs Admin view isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders weather, mandi prices and officer toolkit tools for authenticated officers without showing admin sections', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'officer-1', email: 'officer@telangana.gov.in', user_metadata: { role: 'officer' } },
      session: null,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: false,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: true,
      officerProfile: {
        id: 'officer-1',
        full_name: 'K. Vinay Reddy',
        designation: 'MAO',
        hrms_id: '109283',
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
      signInOfficerOtp: vi.fn(),
      verifyOfficerOtp: vi.fn(),
      registerOfficer: vi.fn(),
      refreshOfficerProfile: vi.fn(),
      signInDealer: vi.fn(),
      signOut: vi.fn(),
    });

    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <Dashboard />
        </LanguageProvider>
      </MemoryRouter>
    );

    // Verifies officer greeting & header
    expect(html).toContain('Officer Dashboard');
    expect(html).toContain('K. Vinay Reddy • MAO (Tiryani)');

    // Verifies weather & mandi prices are shown
    expect(html).toContain('Weather Widget Mock');
    expect(html).toContain('Mandi Prices Mock');

    // Verifies officer toolkit tools are shown
    expect(html).toContain('Officer Toolkit &amp; Field Tools');
    expect(html).toContain('Inspection &amp; Enforcement Hub');
    expect(html).toContain('Smart Sampling');
    expect(html).toContain('Tour Diary');
    expect(html).toContain('Agrochemicals Database');
    expect(html).toContain('Farm Calculators');
    expect(html).toContain('Forms Library');

    // Verifies admin sections are NOT displayed to officers
    expect(html).not.toContain('Mandal Overview');
    expect(html).not.toContain('Gram Panchayats');
    expect(html).not.toContain('Revenue Villages');
    expect(html).not.toContain('Fertilizer Stocks at Dealers');
    expect(html).not.toContain('Government Schemes');
  });

  it('renders loading splash when user is Admin while background data fetches initialize', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'k.vinayreddy166@gmail.com' },
      session: null,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: true,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: false,
      officerProfile: null,
      dealerId: null,
      dealerName: null,
      signIn: vi.fn(),
      signInOfficerOtp: vi.fn(),
      verifyOfficerOtp: vi.fn(),
      registerOfficer: vi.fn(),
      refreshOfficerProfile: vi.fn(),
      signInDealer: vi.fn(),
      signOut: vi.fn(),
    });

    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <Dashboard />
        </LanguageProvider>
      </MemoryRouter>
    );

    // Admin dashboard initial data fetch state
    expect(html).toContain('Loading AGRONIX...');
  });

  it('filters Layout sidebar menu for officers to only show officer-approved items', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'officer-1', email: 'officer@telangana.gov.in', user_metadata: { role: 'officer' } },
      session: null,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: false,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: true,
      officerProfile: {
        id: 'officer-1',
        full_name: 'K. Vinay Reddy',
        designation: 'MAO',
        hrms_id: '109283',
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
      signInOfficerOtp: vi.fn(),
      verifyOfficerOtp: vi.fn(),
      registerOfficer: vi.fn(),
      refreshOfficerProfile: vi.fn(),
      signInDealer: vi.fn(),
      signOut: vi.fn(),
    });

    const html = renderToString(
      <MemoryRouter>
        <ThemeProvider>
          <LanguageProvider>
            <Layout currentPage="dashboard" onNavigate={vi.fn()} onBack={vi.fn()}>
              <div>Child Content</div>
            </Layout>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    // Officer name and role
    expect(html).toContain('K. Vinay Reddy');
    expect(html).toContain('MAO');

    // Officer menu items present
    expect(html).toContain('Field Tools');
    expect(html).toContain('Enforcement Tracker');
    expect(html).toContain('Records &amp; Cloud Archive');
    expect(html).toContain('Knowledge Base');
    expect(html).toContain('GOs &amp; Circulars');
    expect(html).toContain('Tour Diary');
    expect(html).toContain('Officer Contacts');
    expect(html).toContain('Smart Sampling');
    expect(html).toContain('Inspection &amp; Enforcement');

    // Admin-only items not present for officer login
    expect(html).not.toContain('Command Center');
    expect(html).not.toContain('Office Records');
    expect(html).not.toContain('Document Repository');
    expect(html).not.toContain('Dealers Directory');
    expect(html).not.toContain('Quality Control');
    expect(html).not.toContain('Farmer Database');
    expect(html).not.toContain('Reports');
    expect(html).not.toContain('Farm Mechanization');
    expect(html).not.toContain('Subsidy &amp; Schemes');
  });

  it('renders all admin-exclusive modules for admin login', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'k.vinayreddy166@gmail.com', user_metadata: { role: 'admin' } },
      session: null,
      loading: false,
      authChecked: true,
      appReady: true,
      isAdminUser: true,
      isTestUser: false,
      isDealerUser: false,
      isOfficerUser: false,
      officerProfile: null,
      dealerId: null,
      dealerName: null,
      signIn: vi.fn(),
      signInOfficerOtp: vi.fn(),
      verifyOfficerOtp: vi.fn(),
      registerOfficer: vi.fn(),
      refreshOfficerProfile: vi.fn(),
      signInDealer: vi.fn(),
      signOut: vi.fn(),
    });

    const html = renderToString(
      <MemoryRouter>
        <ThemeProvider>
          <LanguageProvider>
            <Layout currentPage="dashboard" onNavigate={vi.fn()} onBack={vi.fn()}>
              <div>Admin Content</div>
            </Layout>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    // Admin-exclusive items are present
    expect(html).toContain('Command Center');
    expect(html).toContain('Office Records');
    expect(html).toContain('Document Repository');
    expect(html).toContain('Dealers Directory');
    expect(html).toContain('Quality Control');
    expect(html).toContain('Farmer Database');
    expect(html).toContain('Reports');
    expect(html).toContain('Farm Mechanization');
    expect(html).toContain('Subsidy &amp; Schemes');
  });
});
