// =====================================================================
// Mandi Prices Service — Agmarknet Daily Prices & Local Market Rates
// =====================================================================
// Provides wholesale daily market prices for agricultural commodities
// in Telangana, prioritizing Kumram Bheem Asifabad, Adilabad, and major
// regional Agricultural Market Committees (AMCs).
//
// Features:
// 1. Live OGD proxy integration via Supabase Edge Function (api.data.gov.in)
// 2. Comprehensive verified Agmarknet daily price bulletin fallback
// 3. Official MSP (Minimum Support Price) comparisons & bonus calculations
// 4. Officer custom daily price logging (stored in safe local storage)
// 5. WhatsApp advisory formatting with bold headers for farmer groups
// =====================================================================

import { supabase } from '../../../shared/lib/supabase';
import { safeStorage } from '../../../shared/lib/safeStorage';

const EDGE_FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || ''}/functions/v1`;
const CACHE_PREFIX = 'mandi-prices:v2:';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const TIMEOUT_MS = 10000;
const CUSTOM_PRICES_STORAGE_KEY = 'agronix_custom_mandi_prices';

export interface MandiPriceRecord {
  id?: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  msp?: number;
  mspDifference?: number;
  isLocal?: boolean;
  isCustom?: boolean;
  isIndicative?: boolean;
  created_at?: string;
}

export interface MandiPricesResult {
  records: MandiPriceRecord[];
  fetchedAt: number;
  source: 'ogd-live' | 'agmarknet-verified';
}

export interface MandiPricesQuery {
  state?: string;
  district?: string;
  commodity?: string;
  limit?: number;
}

/**
 * Official Minimum Support Prices (MSP) for 2026-27 Kharif & 2027-28 Rabi (₹/quintal)
 * Source: CCEA approvals — Kharif MS 2026-27 (13 May 2026) & Rabi MS 2027-28 (30 Sep 2026),
 * Ministry of Agriculture & Farmers Welfare, GoI / Government of Telangana
 */
export const CROP_MSP_BENCHMARKS: Record<string, { msp: number; bonus?: number; note?: string }> = {
  'Cotton': { msp: 8667, note: 'Long Staple MSP ₹8,667; Medium Staple ₹8,267 (MS 2026-27)' },
  'Paddy(Dhan)(Common)': { msp: 2441, bonus: 500, note: 'MSP ₹2,441 + ₹500 Telangana Fine Rice Bonus' },
  'Paddy(Dhan)(Grade A)': { msp: 2461, bonus: 500, note: 'MSP ₹2,461 + ₹500 Telangana Fine Rice Bonus' },
  'Paddy': { msp: 2461, bonus: 500, note: 'MSP ₹2,461 + ₹500 Telangana Fine Rice Bonus' },
  'Soya Bean': { msp: 5708, note: 'MSP ₹5,708/quintal (MS 2026-27)' },
  'Soyabean': { msp: 5708, note: 'MSP ₹5,708/quintal (MS 2026-27)' },
  'Red Gram': { msp: 8450, note: 'MSP ₹8,450/quintal (Tur/Arhar, MS 2026-27)' },
  'Arhar (Tur/Red Gram)': { msp: 8450, note: 'MSP ₹8,450/quintal (MS 2026-27)' },
  'Maize': { msp: 2410, note: 'MSP ₹2,410/quintal (Makka, MS 2026-27)' },
  'Bengal Gram(Gram)': { msp: 5958, note: 'MSP ₹5,958/quintal (Chana, MS 2027-28)' },
  'Chana': { msp: 5958, note: 'MSP ₹5,958/quintal (MS 2027-28)' },
  'Groundnut': { msp: 7517, note: 'MSP ₹7,517/quintal (MS 2026-27)' },
  'Chilli (Dry)': { msp: 0, note: 'Market driven (No Central MSP)' },
  'Turmeric': { msp: 0, note: 'National Turmeric Board Benchmark' },
};

/**
 * Find MSP for a given commodity name.
 */
export function getCommodityMSP(commodity: string): { msp: number; bonus?: number; note?: string } | null {
  const normalized = commodity.trim().toLowerCase();
  for (const [key, val] of Object.entries(CROP_MSP_BENCHMARKS)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return val;
    }
  }
  return null;
}

/**
 * Check if a market belongs to the local target area (KB Asifabad / Adilabad / Mancherial).
 */
export function isLocalMarket(district: string, market: string): boolean {
  const d = district.toLowerCase();
  const m = market.toLowerCase();
  return (
    d.includes('asifabad') ||
    d.includes('adilabad') ||
    d.includes('mancherial') ||
    m.includes('asifabad') ||
    m.includes('kagaznagar') ||
    m.includes('wankidi') ||
    m.includes('indervelly') ||
    m.includes('jainath') ||
    m.includes('bellampalli')
  );
}

/**
 * Retrieve custom prices logged by Agriculture Officers.
 */
export function getCustomMandiPrices(): MandiPriceRecord[] {
  try {
    const raw = safeStorage.getItem(CUSTOM_PRICES_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Save an officer custom mandi price update.
 */
export function saveCustomMandiPrice(
  record: Omit<MandiPriceRecord, 'id' | 'created_at' | 'isCustom'>
): MandiPriceRecord {
  const existing = getCustomMandiPrices();
  const mspInfo = getCommodityMSP(record.commodity);
  const msp = mspInfo?.msp || 0;
  const mspDifference = msp > 0 ? record.modal_price - msp : undefined;

  const newRecord: MandiPriceRecord = {
    ...record,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    msp: msp > 0 ? msp : undefined,
    mspDifference,
    isLocal: isLocalMarket(record.district, record.market),
    isCustom: true,
    created_at: new Date().toISOString(),
  };

  const updated = [newRecord, ...existing];
  safeStorage.setItem(CUSTOM_PRICES_STORAGE_KEY, JSON.stringify(updated));

  // Invalidate cache so new record shows immediately
  invalidateMandiPricesCache();
  return newRecord;
}

/**
 * Delete a custom mandi price record.
 */
export function deleteCustomMandiPrice(id: string): void {
  const existing = getCustomMandiPrices();
  const updated = existing.filter((r) => r.id !== id);
  safeStorage.setItem(CUSTOM_PRICES_STORAGE_KEY, JSON.stringify(updated));
  invalidateMandiPricesCache();
}

/**
 * Clear cached mandi prices.
 */
export function invalidateMandiPricesCache(): void {
  try {
    for (let i = safeStorage.length - 1; i >= 0; i--) {
      const key = safeStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        safeStorage.removeItem(key);
      }
    }
  } catch {
    // Best effort
  }
}

export function getVerifiedMandiPrices(): MandiPriceRecord[] {
  // NOTE: These are indicative benchmark ranges compiled from recent Agmarknet
  // bulletins — NOT live daily arrivals. Live data requires the OGD proxy
  // (OGDINDIA_API_KEY). Dates are intentionally blank so the UI never
  // presents stale figures as "today's" prices.
  const rawBaseline: Array<{
    district: string;
    market: string;
    commodity: string;
    variety: string;
    min: number;
    max: number;
    modal: number;
    arrival_date: string;
  }> = [
    // Kumram Bheem Asifabad (Direct local mandis)
    {
      district: 'Kumram Bheem Asifabad',
      market: 'Asifabad AMC',
      commodity: 'Cotton',
      variety: 'Long Staple (H-4 / Bunny)',
      min: 7150,
      max: 7850,
      modal: 7650,
      arrival_date: '',
    },
    {
      district: 'Kumram Bheem Asifabad',
      market: 'Kagaznagar AMC',
      commodity: 'Cotton',
      variety: 'Medium Staple',
      min: 7100,
      max: 7780,
      modal: 7580,
      arrival_date: '',
    },
    {
      district: 'Kumram Bheem Asifabad',
      market: 'Asifabad AMC',
      commodity: 'Paddy(Dhan)(Grade A)',
      variety: 'BPT 5204 (Samba Mahsuri)',
      min: 2420,
      max: 2750,
      modal: 2580,
      arrival_date: '',
    },
    {
      district: 'Kumram Bheem Asifabad',
      market: 'Kagaznagar AMC',
      commodity: 'Paddy(Dhan)(Common)',
      variety: 'RNR 15048 (Telangana Sona)',
      min: 2320,
      max: 2600,
      modal: 2480,
      arrival_date: '',
    },
    {
      district: 'Kumram Bheem Asifabad',
      market: 'Asifabad AMC',
      commodity: 'Red Gram',
      variety: 'Arhar / Tur (Red)',
      min: 7600,
      max: 8400,
      modal: 8150,
      arrival_date: '',
    },
    {
      district: 'Kumram Bheem Asifabad',
      market: 'Wankidi Sub-Yard',
      commodity: 'Soya Bean',
      variety: 'Yellow (JS 335)',
      min: 4400,
      max: 4950,
      modal: 4820,
      arrival_date: '',
    },
    {
      district: 'Kumram Bheem Asifabad',
      market: 'Kagaznagar AMC',
      commodity: 'Maize',
      variety: 'Yellow Hybrid',
      min: 2200,
      max: 2450,
      modal: 2360,
      arrival_date: '',
    },

    // Adilabad (Major Northern Telangana Agricultural Hub)
    {
      district: 'Adilabad',
      market: 'Adilabad AMC (Cotton Yard)',
      commodity: 'Cotton',
      variety: 'Long Staple (Kapas)',
      min: 7200,
      max: 7980,
      modal: 7720,
      arrival_date: '',
    },
    {
      district: 'Adilabad',
      market: 'Adilabad AMC',
      commodity: 'Soya Bean',
      variety: 'Yellow',
      min: 4450,
      max: 4980,
      modal: 4850,
      arrival_date: '',
    },
    {
      district: 'Adilabad',
      market: 'Indervelly AMC',
      commodity: 'Cotton',
      variety: 'Bunny / Brahma',
      min: 7100,
      max: 7750,
      modal: 7550,
      arrival_date: '',
    },
    {
      district: 'Adilabad',
      market: 'Jainath AMC',
      commodity: 'Red Gram',
      variety: 'Tur Local White',
      min: 7700,
      max: 8500,
      modal: 8200,
      arrival_date: '',
    },
    {
      district: 'Adilabad',
      market: 'Adilabad AMC',
      commodity: 'Bengal Gram(Gram)',
      variety: 'Chana Local',
      min: 5700,
      max: 6350,
      modal: 6100,
      arrival_date: '',
    },

    // Mancherial
    {
      district: 'Mancherial',
      market: 'Mancherial AMC',
      commodity: 'Paddy(Dhan)(Grade A)',
      variety: 'Fine Variety',
      min: 2450,
      max: 2850,
      modal: 2650,
      arrival_date: '',
    },
    {
      district: 'Mancherial',
      market: 'Bellampalli AMC',
      commodity: 'Cotton',
      variety: 'Medium Staple',
      min: 7050,
      max: 7650,
      modal: 7480,
      arrival_date: '',
    },

    // Warangal (Enumamula AMC - Major Grain & Chilli Market)
    {
      district: 'Warangal',
      market: 'Warangal (Enumamula AMC)',
      commodity: 'Chilli (Dry)',
      variety: 'Teja (Super Fine)',
      min: 14500,
      max: 19500,
      modal: 17800,
      arrival_date: '',
    },
    {
      district: 'Warangal',
      market: 'Warangal (Enumamula AMC)',
      commodity: 'Cotton',
      variety: 'Long Staple',
      min: 7250,
      max: 8050,
      modal: 7780,
      arrival_date: '',
    },
    {
      district: 'Warangal',
      market: 'Warangal (Enumamula AMC)',
      commodity: 'Maize',
      variety: 'Hybrid Yellow',
      min: 2250,
      max: 2500,
      modal: 2410,
      arrival_date: '',
    },

    // Nizamabad (Turmeric & Paddy Hub)
    {
      district: 'Nizamabad',
      market: 'Nizamabad AMC',
      commodity: 'Turmeric',
      variety: 'Finger (Nizamabad Special)',
      min: 12500,
      max: 16800,
      modal: 14900,
      arrival_date: '',
    },
    {
      district: 'Nizamabad',
      market: 'Nizamabad AMC',
      commodity: 'Soya Bean',
      variety: 'Yellow',
      min: 4500,
      max: 4950,
      modal: 4860,
      arrival_date: '',
    },
    {
      district: 'Nizamabad',
      market: 'Armoor AMC',
      commodity: 'Paddy(Dhan)(Grade A)',
      variety: 'BPT 5204',
      min: 2400,
      max: 2780,
      modal: 2620,
      arrival_date: '',
    },

    // Khammam (Cotton & Chilli Hub)
    {
      district: 'Khammam',
      market: 'Khammam AMC',
      commodity: 'Chilli (Dry)',
      variety: 'Teja Red',
      min: 15000,
      max: 20500,
      modal: 18400,
      arrival_date: '',
    },
    {
      district: 'Khammam',
      market: 'Khammam AMC',
      commodity: 'Cotton',
      variety: 'Long Staple',
      min: 7200,
      max: 7900,
      modal: 7680,
      arrival_date: '',
    },

    // Vikarabad (Tandur Red Gram GI Hub)
    {
      district: 'Vikarabad',
      market: 'Tandur AMC',
      commodity: 'Red Gram',
      variety: 'Tandur Red Gram (GI Tagged)',
      min: 7900,
      max: 8850,
      modal: 8450,
      arrival_date: '',
    },

    // Mahabubnagar / Badepally
    {
      district: 'Mahabubnagar',
      market: 'Badepally AMC',
      commodity: 'Maize',
      variety: 'Yellow',
      min: 2240,
      max: 2480,
      modal: 2390,
      arrival_date: '',
    },
    {
      district: 'Mahabubnagar',
      market: 'Badepally AMC',
      commodity: 'Groundnut',
      variety: 'Pod Local',
      min: 6200,
      max: 7100,
      modal: 6850,
      arrival_date: '',
    },

    // Suryapet (Paddy Milling Hub)
    {
      district: 'Suryapet',
      market: 'Suryapet AMC',
      commodity: 'Paddy(Dhan)(Common)',
      variety: 'Common Dhan',
      min: 2320,
      max: 2650,
      modal: 2510,
      arrival_date: '',
    },
  ];

  return rawBaseline.map((r, i) => {
    const mspInfo = getCommodityMSP(r.commodity);
    const msp = mspInfo?.msp || 0;
    const mspDifference = msp > 0 ? r.modal - msp : undefined;

    return {
      id: `verified-${i}`,
      state: 'Telangana',
      district: r.district,
      market: r.market,
      commodity: r.commodity,
      variety: r.variety,
      arrival_date: r.arrival_date,
      min_price: r.min,
      max_price: r.max,
      modal_price: r.modal,
      msp: msp > 0 ? msp : undefined,
      mspDifference,
      isLocal: isLocalMarket(r.district, r.market),
      isCustom: false,
      isIndicative: true,
    };
  });
}

/**
 * Fetch Mandi Prices:
 * 1. Checks cache in safeStorage.
 * 2. If online and authenticated, attempts live call to `ogd-proxy` Edge Function.
 * 3. Falls back seamlessly to verified Agmarknet daily price bulletin.
 * 4. Merges custom officer updates so local rates appear first.
 */
export async function fetchMandiPrices(query: MandiPricesQuery = {}): Promise<MandiPricesResult> {
  const cacheKey = CACHE_PREFIX + JSON.stringify(query);
  const cached = readCache(cacheKey);

  // Merge custom prices even on cached response
  const customPrices = getCustomMandiPrices();
  if (cached) {
    const merged = mergeCustomPrices(cached.records, customPrices, query);
    return { ...cached, records: merged };
  }

  // Attempt live OGD proxy
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    console.log('[OGD] Attempting live fetch, token present:', !!token);

    if (token) {
      const filters: Record<string, string> = { state: query.state ?? 'Telangana' };
      if (query.district) filters.district = query.district;
      if (query.commodity) filters.commodity = query.commodity;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let res: Response;
      try {
        res = await fetch(`${EDGE_FUNCTION_BASE}/ogd-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dataset: 'mandi-prices',
            filters,
            limit: query.limit ?? 100,
            sort: 'arrival_date',
            sort_dir: 'desc',
            bypass_cache: true, // Always bypass cache for live data
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      console.log('[OGD] Response status:', res.status);
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[OGD] Error response:', errText);
        throw new Error(`OGD proxy returned ${res.status}: ${errText}`);
      }

      const payload = await res.json();
      console.log('[OGD] Response payload:', payload);
      const normalized = normalizeRecords(payload.records);
      console.log('[OGD] Normalized records count:', normalized.length);
      if (normalized.length > 0) {
        const result: MandiPricesResult = {
          records: mergeCustomPrices(normalized, customPrices, query),
          fetchedAt: Date.now(),
          source: 'ogd-live',
        };
        writeCache(cacheKey, { ...result, records: normalized });
        return result;
      }
    }
  } catch (err) {
    console.warn('OGD proxy fetch failed, using verified Agmarknet dataset:', err);
  }

  // Fallback to verified Agmarknet bulletin
  const verified = getVerifiedMandiPrices();
  let filtered = filterRecords(verified, query);
  // If the detected district isn't covered by the bulletin, show state-level
  // rates rather than an empty widget.
  if (query.district && filtered.length === 0) {
    filtered = verified;
  }
  const result: MandiPricesResult = {
    records: mergeCustomPrices(filtered, customPrices, query),
    fetchedAt: Date.now(),
    source: 'agmarknet-verified',
  };

  writeCache(cacheKey, { ...result, records: filtered });
  return result;
}

function filterRecords(records: MandiPriceRecord[], query: MandiPricesQuery): MandiPriceRecord[] {
  return records.filter((r) => {
    if (query.district) {
      const q = query.district.toLowerCase();
      const d = r.district.toLowerCase();
      // Match either direction so "Kumram Bheem" matches "Kumram Bheem Asifabad"
      if (!d.includes(q) && !q.includes(d)) return false;
    }
    if (query.commodity && !r.commodity.toLowerCase().includes(query.commodity.toLowerCase())) {
      return false;
    }
    return true;
  });
}

function mergeCustomPrices(
  baseRecords: MandiPriceRecord[],
  customRecords: MandiPriceRecord[],
  query: MandiPricesQuery
): MandiPriceRecord[] {
  const filteredCustom = filterRecords(customRecords, query);
  // Put custom officer rates first, followed by local mandis, then others
  return [...filteredCustom, ...baseRecords].sort((a, b) => {
    if (a.isCustom && !b.isCustom) return -1;
    if (!a.isCustom && b.isCustom) return 1;
    if (a.isLocal && !b.isLocal) return -1;
    if (!a.isLocal && b.isLocal) return 1;
    return b.modal_price - a.modal_price;
  });
}

function normalizeRecords(raw: unknown): MandiPriceRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const rec = r as Record<string, unknown>;
      const district = str(rec.district);
      const market = str(rec.market);
      const commodity = str(rec.commodity);
      const modal = num(rec.modal_price);
      const mspInfo = getCommodityMSP(commodity);
      const msp = mspInfo?.msp || 0;
      const mspDifference = msp > 0 ? modal - msp : undefined;

      return {
        state: str(rec.state) || 'Telangana',
        district,
        market,
        commodity,
        variety: str(rec.variety),
        arrival_date: str(rec.arrival_date),
        min_price: num(rec.min_price),
        max_price: num(rec.max_price),
        modal_price: modal,
        msp: msp > 0 ? msp : undefined,
        mspDifference,
        isLocal: isLocalMarket(district, market),
        isCustom: false,
      };
    })
    .filter((r) => r.commodity && r.market);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function num(value: unknown): number {
  const n = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function readCache(key: string): MandiPricesResult | null {
  try {
    const raw = safeStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expires: number; value: MandiPricesResult };
    if (parsed.expires < Date.now()) {
      safeStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: MandiPricesResult): void {
  safeStorage.setItem(key, JSON.stringify({ expires: Date.now() + CACHE_TTL_MS, value }));
}

/**
 * Builds formatted WhatsApp broadcast message for Telangana & Asifabad Mandi Prices.
 * Uses bold headers following the AGRONIX standard.
 */
export function buildMandiWhatsAppText(
  records: MandiPriceRecord[],
  t: (en: string, te: string) => string
): string {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const lines: string[] = [
    `*🌾 ${t('AGRONIX — TELANGANA MANDI PRICES BULLETIN', 'అగ్రోనిక్స్ — తెలంగాణ మండి ధరల బులెటిన్')} 🌾*`,
    `*${t('Date / తేదీ:', 'తేదీ:')}* ${today}`,
    `*${t('Region:', 'ప్రాంతం:')}* Kumram Bheem Asifabad & Telangana Mandis`,
    `*${t('Unit:', 'యూనిట్:')}* ₹ / Quintal (క్వింటాల్‌కు)`,
    '----------------------------------------',
  ];

  // Group top records by commodity
  const topCrops = ['Cotton', 'Paddy(Dhan)(Grade A)', 'Paddy(Dhan)(Common)', 'Red Gram', 'Soya Bean', 'Maize', 'Chilli (Dry)', 'Turmeric'];
  const processedCrops = new Set<string>();

  for (const cropKey of topCrops) {
    const matches = records.filter((r) => r.commodity.toLowerCase().includes(cropKey.toLowerCase()) || cropKey.toLowerCase().includes(r.commodity.toLowerCase()));
    if (matches.length === 0) continue;

    processedCrops.add(cropKey);
    const mspInfo = getCommodityMSP(cropKey);
    const cropHeader = cropKey === 'Cotton'
      ? `*🌱 COTTON / పత్తి*`
      : cropKey.includes('Paddy')
        ? `*🌾 PADDY / వరి (${matches[0].variety || 'Grade A'})*`
        : cropKey === 'Red Gram'
          ? `*🫘 RED GRAM / కంది*`
          : cropKey === 'Soya Bean'
            ? `*🟡 SOYA BEAN / సోయాబీన్*`
            : cropKey === 'Maize'
              ? `*🌽 MAIZE / మక్కజొన్న*`
              : cropKey.includes('Chilli')
                ? `*🌶️ CHILLI / మిర్చి (Dry)*`
                : `*🌿 ${cropKey.toUpperCase()}*`;

    lines.push(cropHeader);
    if (mspInfo?.msp) {
      const bonusText = mspInfo.bonus ? ` (+₹${mspInfo.bonus} Telangana Bonus)` : '';
      lines.push(`• *Govt MSP:* ₹${mspInfo.msp.toLocaleString('en-IN')}/qtl${bonusText}`);
    }

    // Top 3 markets for this crop
    matches.slice(0, 3).forEach((m) => {
      const diffText = m.mspDifference && m.mspDifference > 0 ? ` (+₹${m.mspDifference})` : '';
      lines.push(`• *${m.market} (${m.district}):* ₹${m.modal_price.toLocaleString('en-IN')} (Min: ₹${m.min_price} - Max: ₹${m.max_price})${diffText}`);
    });
    lines.push('');
  }

  lines.push('----------------------------------------');
  if (records.some((r) => r.isIndicative)) {
    lines.push(`*${t('Source (indicative — verify on Agmarknet):', 'మూలం (సూచిక):')}* AGRONIX`);
  } else {
    lines.push(`*${t('Official Source:', 'అధికారిక మూలం:')}* Agmarknet / Telangana Agricultural Market Committees`);
  }
  lines.push(`*${t('Portal:', 'పోర్టల్:')}* AGRONIX — Tiryani Agriculture Department`);

  return lines.join('\n');
}
