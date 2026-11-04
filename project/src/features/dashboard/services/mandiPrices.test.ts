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
} from './mandiPrices';

describe('mandiPrices service', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
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
      expect(cottonMsp?.msp).toBe(7521);

      const paddyMsp = getCommodityMSP('Paddy(Dhan)(Grade A)');
      expect(paddyMsp?.msp).toBe(2380);
      expect(paddyMsp?.bonus).toBe(500);

      const soyaMsp = getCommodityMSP('Soya Bean');
      expect(soyaMsp?.msp).toBe(4892);

      const redGramMsp = getCommodityMSP('Red Gram');
      expect(redGramMsp?.msp).toBe(7550);
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
      expect(asifabadCotton?.msp).toBe(7521);
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
    it('returns verified records with fallback when OGD proxy is unauthenticated', async () => {
      const res = await fetchMandiPrices({ state: 'Telangana' });
      expect(res.records.length).toBeGreaterThan(10);
      expect(res.source).toBe('agmarknet-verified');
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

      const res = await fetchMandiPrices();
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
  });
});
