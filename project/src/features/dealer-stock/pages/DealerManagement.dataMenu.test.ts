import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
  ADMIN_USER_ID: 'admin',
}));

import {
  DEALER_DATA_MENU_PANEL_CLASS,
  dealerDataMenuWrapperClass,
} from './DealerManagement';

describe('Dealer Directory Import/Export menu layout', () => {
  it('keeps the wrapper shrink-wrapped while the menu is closed so the closed layout is unchanged', () => {
    expect(dealerDataMenuWrapperClass(false)).toBe('relative');
  });

  it('expands the wrapper to full width below lg only while the menu is open', () => {
    const cls = dealerDataMenuWrapperClass(true);
    expect(cls).toContain('w-full');
    expect(cls).toContain('lg:w-auto');
  });

  it('renders the panel in-flow at full width below lg so it pushes content down instead of overlaying the search input', () => {
    const cls = DEALER_DATA_MENU_PANEL_CLASS;
    expect(cls).toContain('relative');
    expect(cls).toContain('w-full');
    // The old classes anchored an absolute panel to the button's left edge on
    // small screens, which is what made it cover the search row.
    expect(cls).not.toContain('left-0');
    expect(cls).not.toContain('sm:left-auto');
    expect(cls).not.toContain('sm:right-0');
  });

  it('keeps an absolute right-aligned dropdown at lg and up', () => {
    const cls = DEALER_DATA_MENU_PANEL_CLASS;
    expect(cls).toContain('lg:absolute');
    expect(cls).toContain('lg:right-0');
    expect(cls).toContain('lg:top-full');
    expect(cls).toContain('lg:z-40');
    expect(cls).toContain('lg:w-56');
  });

  it('does not rely on viewport-relative max-width that can clip near screen edges', () => {
    expect(DEALER_DATA_MENU_PANEL_CLASS).not.toContain('100vw');
  });
});
