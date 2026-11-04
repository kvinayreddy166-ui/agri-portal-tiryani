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
});
