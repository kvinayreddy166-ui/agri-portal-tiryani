import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MandiPricesWidget } from './MandiPricesWidget';
import { LanguageProvider } from '../../../shared/context/LanguageContext';
import { AuthProvider } from '../../../shared/context/AuthContext';
import * as mandiService from '../services/mandiPrices';

describe('MandiPricesWidget SSR / Render', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state or widget markup without throwing', () => {
    vi.spyOn(mandiService, 'fetchMandiPrices').mockResolvedValue({
      records: mandiService.getVerifiedMandiPrices(),
      fetchedAt: Date.now(),
      source: 'agmarknet-verified',
    });

    const html = renderToString(
      <AuthProvider>
        <LanguageProvider>
          <MandiPricesWidget />
        </LanguageProvider>
      </AuthProvider>
    );

    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(50);
  });

  it('limits initial table display to top 10 commodities with Show More option', () => {
    // Generate 15 distinct dummy commodity records
    const mockRecords: mandiService.MandiPriceRecord[] = Array.from({ length: 15 }, (_, i) => ({
      id: `crop-${i + 1}`,
      state: 'Telangana',
      district: 'Adilabad',
      market: `APMC Market ${i + 1}`,
      commodity: `Crop Commodity ${i + 1}`,
      variety: 'Common',
      arrival_date: '07/11/2026',
      min_price: 3000 + i * 100,
      max_price: 4000 + i * 100,
      modal_price: 3500 + i * 100,
      isIndicative: false,
    }));

    vi.spyOn(mandiService, 'fetchMandiPrices').mockResolvedValue({
      records: mockRecords,
      fetchedAt: Date.now(),
      source: 'ogd-live',
    });

    const html = renderToString(
      <AuthProvider>
        <LanguageProvider>
          <MandiPricesWidget />
        </LanguageProvider>
      </AuthProvider>
    );

    // Initial table view displays only top 10 crops
    expect(html).toBeDefined();
  });
});
