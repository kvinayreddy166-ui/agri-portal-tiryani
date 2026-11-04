import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../shared/context/AuthContext';
import { FertilizerCalculator } from './FertilizerCalculator';

describe('FertilizerCalculator render test', () => {
  it('renders without throwing', () => {
    const html = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <FertilizerCalculator />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(100);
  });
});
