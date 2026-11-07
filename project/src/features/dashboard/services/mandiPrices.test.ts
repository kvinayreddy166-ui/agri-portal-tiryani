import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getVerifiedMandiPrices,
  getCommodityMSP,
  isLocalMarket,
  saveCustomMandiPrice,
  getCustomMandiPrices,
  deleteCustomMandiPrice,
  fetchMandiPrices,
  buildMandiWhatsAppText,
  ALL_TELANGANA_DISTRICTS,
  ALL_ANDHRA_PRADESH_DISTRICTS,
  ALL_INDIAN_STATES,
} from './mandiPrices';

describe('mandiPrices service', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
          return true;
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
        clear: () => {
          store.clear();
        },
      },
    });
    vi.restoreAllMocks();
  });

  describe('getCommodityMSP', () => {
    it('returns official GoI / Telangana MSP benchmarks', () => {
      const cottonMsp = getCommodityMSP('Cotton');
      expect(cottonMsp?.msp).toBe(8667);

      const paddyMsp = getCommodityMSP('Paddy(Dhan)(Grade A)');
      expect(paddyMsp?.msp).toBe(2461);
      expect(paddyMsp?.bonus).toBe(500);

      const soyaMsp = getCommodityMSP('Soya Bean');
      expect(soyaMsp?.msp).toBe(5708);

      const redGramMsp = getCommodityMSP('Red Gram');
      expect(redGramMsp?.msp).toBe(8450);

      const jowarMsp = getCommodityMSP('Jowar(Sorghum)');
      expect(jowarMsp?.msp).toBe(4023);

      const sorghumMsp = getCommodityMSP('Jowar');
      expect(sorghumMsp?.msp).toBe(4023);

      expect(getCommodityMSP('Jowar (White)')?.msp).toBe(4023);
      expect(getCommodityMSP('Sorghum')?.msp).toBe(4023);
      expect(getCommodityMSP('Maldandi')?.msp).toBe(4023);
    });
  });

  describe('isLocalMarket', () => {
    it('identifies Kumram Bheem Asifabad and Adilabad mandis as local', () => {
      expect(isLocalMarket('Kumram Bheem Asifabad', 'Asifabad AMC')).toBe(true);
      expect(isLocalMarket('Kumram Bheem Asifabad', 'Kagaznagar AMC')).toBe(true);
      expect(isLocalMarket('Adilabad', 'Indervelly AMC')).toBe(true);
      expect(isLocalMarket('Warangal', 'Warangal AMC')).toBe(false);
    });
  });

  describe('getVerifiedMandiPrices', () => {
    it('returns comprehensive daily prices with local mandis flagged', () => {
      const records = getVerifiedMandiPrices();
      expect(records.length).toBeGreaterThan(15);

      const asifabadCotton = records.find(
        (r) => r.market === 'Asifabad AMC' && r.commodity === 'Cotton'
      );
      expect(asifabadCotton).toBeDefined();
      expect(asifabadCotton?.isLocal).toBe(true);
      expect(asifabadCotton?.modal_price).toBeGreaterThan(7000);
      expect(asifabadCotton?.msp).toBe(8667);
    });
  });

  describe('custom officer price logging', () => {
    it('saves, retrieves, and deletes officer custom prices', () => {
      const saved = saveCustomMandiPrice({
        state: 'Telangana',
        district: 'Kumram Bheem Asifabad',
        market: 'Tiryani Farm Gate',
        commodity: 'Cotton',
        variety: 'H-4',
        arrival_date: '04/11/2026',
        min_price: 7200,
        max_price: 7800,
        modal_price: 7600,
      });

      expect(saved.id).toBeDefined();
      expect(saved.isCustom).toBe(true);
      expect(saved.isLocal).toBe(true);

      const list = getCustomMandiPrices();
      expect(list.length).toBe(1);
      expect(list[0].market).toBe('Tiryani Farm Gate');

      deleteCustomMandiPrice(saved.id!);
      expect(getCustomMandiPrices().length).toBe(0);
    });
  });

  describe('fetchMandiPrices', () => {
    it('returns records from live proxy or verified fallback', async () => {
      const res = await fetchMandiPrices({ state: 'Telangana' });
      expect(res.records.length).toBeGreaterThan(0);
      expect(['ogd-live', 'agmarknet-verified']).toContain(res.source);
    });

    it('falls back to verified Agmarknet bulletin when network fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      const res = await fetchMandiPrices({ state: 'Telangana', bypass_cache: true });
      expect(res.records.length).toBeGreaterThan(10);
      expect(res.source).toBe('agmarknet-verified');
      expect(res.records.some((r) => r.isIndicative)).toBe(true);
    });

    it('handles live records from OGD proxy correctly', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          dataset: 'mandi-prices',
          total: 1,
          records: [
            {
              state: 'Telangana',
              district: 'Adilabad',
              market: 'Jainath APMC',
              commodity: 'Cotton',
              variety: 'H-4',
              arrival_date: '07/11/2026',
              min_price: 7500,
              max_price: 8200,
              modal_price: 7900,
            },
          ],
        }),
      }));

      const res = await fetchMandiPrices({ state: 'Telangana', bypass_cache: true });
      expect(res.source).toBe('ogd-live');
      const live = res.records.find((r) => r.market === 'Jainath APMC');
      expect(live).toBeDefined();
      expect(live?.isIndicative).toBe(false);
      expect(live?.arrival_date).toBe('07/11/2026');
    });

    it('returns Andhra Pradesh records and verified fallback when state is Andhra Pradesh', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      const res = await fetchMandiPrices({ state: 'Andhra Pradesh', bypass_cache: true });
      expect(res.records.length).toBeGreaterThan(10);
      expect(res.source).toBe('agmarknet-verified');
      expect(res.records.some((r) => r.state === 'Andhra Pradesh')).toBe(true);
      expect(res.records.some((r) => r.district === 'Guntur' || r.district === 'Kurnool')).toBe(true);
    });

    it('returns records and national fallback when state is Karnataka or other states', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      const res = await fetchMandiPrices({ state: 'Karnataka', bypass_cache: true });
      expect(res.records.length).toBeGreaterThan(0);
      expect(res.source).toBe('agmarknet-verified');
      expect(res.records.some((r) => r.state === 'Karnataka')).toBe(true);
    });

    it('merges custom officer prices at the very top of results', async () => {
      saveCustomMandiPrice({
        state: 'Telangana',
        district: 'Kumram Bheem Asifabad',
        market: 'Local Officer Yard',
        commodity: 'Red Gram',
        variety: 'Tur Special',
        arrival_date: '04/11/2026',
        min_price: 8000,
        max_price: 8600,
        modal_price: 8300,
      });

      const res = await fetchMandiPrices({ bypass_cache: true });
      expect(res.records[0].market).toBe('Local Officer Yard');
      expect(res.records[0].isCustom).toBe(true);
    });
  });

  describe('buildMandiWhatsAppText', () => {
    it('formats WhatsApp message with bold headers', () => {
      const records = getVerifiedMandiPrices();
      const text = buildMandiWhatsAppText(records, (en) => en);

      expect(text).toContain('*🌾 AGRONIX — TELANGANA MANDI PRICES BULLETIN 🌾*');
      expect(text).toContain('*🌱 COTTON / పత్తి*');
      expect(text).toContain('*Govt MSP:*');
      expect(text).toContain('Asifabad AMC');
    });

    it('formats Andhra Pradesh WhatsApp broadcast when state is Andhra Pradesh', () => {
      const records = getVerifiedMandiPrices('Andhra Pradesh').map((r) => ({ ...r, isIndicative: false }));
      const text = buildMandiWhatsAppText(records, (en) => en, 'Andhra Pradesh');

      expect(text).toContain('*🌾 AGRONIX — ANDHRA PRADESH MANDI PRICES BULLETIN 🌾*');
      expect(text).toContain('Andhra Pradesh Mandis & AMCs');
      expect(text).toContain('Andhra Pradesh Agricultural Marketing Department');
    });
  });

  describe('geographic coverage datasets', () => {
    it('provides all 33 Telangana districts', () => {
      expect(ALL_TELANGANA_DISTRICTS.length).toBe(33);
      expect(ALL_TELANGANA_DISTRICTS).toContain('Kumram Bheem Asifabad');
      expect(ALL_TELANGANA_DISTRICTS).toContain('Adilabad');
      expect(ALL_TELANGANA_DISTRICTS).toContain('Warangal');
      expect(ALL_TELANGANA_DISTRICTS).toContain('Nalgonda');
    });

    it('provides all 26 Andhra Pradesh districts', () => {
      expect(ALL_ANDHRA_PRADESH_DISTRICTS.length).toBe(26);
      expect(ALL_ANDHRA_PRADESH_DISTRICTS).toContain('Guntur');
      expect(ALL_ANDHRA_PRADESH_DISTRICTS).toContain('Kurnool');
      expect(ALL_ANDHRA_PRADESH_DISTRICTS).toContain('Dr. B.R. Ambedkar Konaseema');
      expect(ALL_ANDHRA_PRADESH_DISTRICTS).toContain('Visakhapatnam');
    });

    it('provides all 36 Indian states and union territories in alphabetical order', () => {
      expect(ALL_INDIAN_STATES.length).toBe(36);
      const sorted = [...ALL_INDIAN_STATES].sort((a, b) => a.localeCompare(b));
      expect(ALL_INDIAN_STATES).toEqual(sorted);
      expect(ALL_INDIAN_STATES[0]).toBe('Andaman and Nicobar Islands');
      expect(ALL_INDIAN_STATES[1]).toBe('Andhra Pradesh');
      expect(ALL_INDIAN_STATES).toContain('Telangana');
      expect(ALL_INDIAN_STATES).toContain('Karnataka');
      expect(ALL_INDIAN_STATES).toContain('Maharashtra');
      expect(ALL_INDIAN_STATES).toContain('Punjab');
    });
  });
});
