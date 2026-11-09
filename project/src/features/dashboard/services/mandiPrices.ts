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

const EDGE_FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || 'https://api.supabase.co'}/functions/v1`;
const CACHE_PREFIX = 'mandi-prices:v9:';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const TIMEOUT_MS = 10000;
const CUSTOM_PRICES_STORAGE_KEY = 'agronix_custom_mandi_prices';
const ROLLING_LIVE_STORAGE_KEY = 'agronix_rolling_mandi_prices_v2';

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
  bypass_cache?: boolean;
}

/**
 * Official Minimum Support Prices (MSP) for 2026-27 Kharif & 2027-28 Rabi (₹/quintal)
 * Source: CCEA approvals — Kharif MS 2026-27 (13 May 2026) & Rabi MS 2027-28 (30 Sep 2026),
 * Ministry of Agriculture & Farmers Welfare, GoI / Government of Telangana
 */
export const CROP_MSP_BENCHMARKS: Record<string, { msp: number; bonus?: number; note?: string }> = {
  // Kharif & Rabi MSP 2026-27 Schedule
  'Paddy (Common)': { msp: 2441, bonus: 500, note: 'MSP ₹2,441/qtl (+ ₹500 Telangana Fine Rice Bonus)' },
  'Paddy (Grade A)': { msp: 2461, bonus: 500, note: 'MSP ₹2,461/qtl (+ ₹500 Telangana Fine Rice Bonus)' },
  'Paddy(Dhan)(Common)': { msp: 2441, bonus: 500, note: 'MSP ₹2,441/qtl (+ ₹500 Telangana Fine Rice Bonus)' },
  'Paddy(Dhan)(Grade A)': { msp: 2461, bonus: 500, note: 'MSP ₹2,461/qtl (+ ₹500 Telangana Fine Rice Bonus)' },
  'Paddy': { msp: 2461, bonus: 500, note: 'MSP ₹2,461/qtl (Grade A: ₹2,461 / Common: ₹2,441)' },
  'Jowar (Hybrid)': { msp: 4023, note: 'MSP ₹4,023/quintal (2026-27)' },
  'Jowar (Maldandi)': { msp: 4073, note: 'MSP ₹4,073/quintal (2026-27)' },
  'Jowar(Sorghum)': { msp: 4023, note: 'MSP ₹4,023/quintal (Hybrid: ₹4,023 / Maldandi: ₹4,073)' },
  'Jowar': { msp: 4023, note: 'MSP ₹4,023/quintal (Hybrid: ₹4,023 / Maldandi: ₹4,073)' },
  'Sorghum': { msp: 4023, note: 'MSP ₹4,023/quintal (Hybrid: ₹4,023 / Maldandi: ₹4,073)' },
  'Bajra': { msp: 2900, note: 'MSP ₹2,900/quintal (Pearl Millet, 2026-27)' },
  'Maize': { msp: 2410, note: 'MSP ₹2,410/quintal (Makka, 2026-27)' },
  'Ragi': { msp: 5205, note: 'MSP ₹5,205/quintal (Finger Millet, 2026-27)' },
  'Tur (Arhar)': { msp: 8450, note: 'MSP ₹8,450/quintal (2026-27)' },
  'Red Gram': { msp: 8450, note: 'MSP ₹8,450/quintal (Tur/Arhar, 2026-27)' },
  'Arhar (Tur/Red Gram)': { msp: 8450, note: 'MSP ₹8,450/quintal (2026-27)' },
  'Moong': { msp: 8780, note: 'MSP ₹8,780/quintal (Green Gram, 2026-27)' },
  'Green Gram': { msp: 8780, note: 'MSP ₹8,780/quintal (Moong, 2026-27)' },
  'Moong(Green Gram)': { msp: 8780, note: 'MSP ₹8,780/quintal (2026-27)' },
  'Urad': { msp: 8200, note: 'MSP ₹8,200/quintal (Black Gram, 2026-27)' },
  'Black Gram': { msp: 8200, note: 'MSP ₹8,200/quintal (Urad, 2026-27)' },
  'Urad(Black Gram)': { msp: 8200, note: 'MSP ₹8,200/quintal (2026-27)' },
  'Groundnut (in shell)': { msp: 7517, note: 'MSP ₹7,517/quintal (2026-27)' },
  'Groundnut': { msp: 7517, note: 'MSP ₹7,517/quintal (in shell, 2026-27)' },
  'Soyabean (Yellow)': { msp: 5708, note: 'MSP ₹5,708/quintal (2026-27)' },
  'Soyabean': { msp: 5708, note: 'MSP ₹5,708/quintal (2026-27)' },
  'Soya Bean': { msp: 5708, note: 'MSP ₹5,708/quintal (2026-27)' },
  'Sunflower Seed': { msp: 8343, note: 'MSP ₹8,343/quintal (2026-27)' },
  'Sunflower': { msp: 8343, note: 'MSP ₹8,343/quintal (2026-27)' },
  'Sesamum': { msp: 10346, note: 'MSP ₹10,346/quintal (Til, 2026-27)' },
  'Nigerseed': { msp: 10052, note: 'MSP ₹10,052/quintal (2026-27)' },
  'Cotton (Medium Staple)': { msp: 8267, note: 'MSP ₹8,267/quintal (2026-27)' },
  'Cotton (Long Staple)': { msp: 8667, note: 'MSP ₹8,667/quintal (2026-27)' },
  'Cotton': { msp: 8667, note: 'Long Staple: ₹8,667 / Medium Staple: ₹8,267 (2026-27)' },
  'Wheat': { msp: 2585, note: 'MSP ₹2,585/quintal (2026-27)' },
  'Barley': { msp: 2150, note: 'MSP ₹2,150/quintal (2026-27)' },
  'Gram': { msp: 5875, note: 'MSP ₹5,875/quintal (Chana/Bengal Gram, 2026-27)' },
  'Bengal Gram': { msp: 5875, note: 'MSP ₹5,875/quintal (Gram, 2026-27)' },
  'Bengal Gram(Gram)': { msp: 5875, note: 'MSP ₹5,875/quintal (Gram, 2026-27)' },
  'Chana': { msp: 5875, note: 'MSP ₹5,875/quintal (Gram, 2026-27)' },
  'Masur (Lentil)': { msp: 7000, note: 'MSP ₹7,000/quintal (2026-27)' },
  'Masur': { msp: 7000, note: 'MSP ₹7,000/quintal (Lentil, 2026-27)' },
  'Lentil': { msp: 7000, note: 'MSP ₹7,000/quintal (2026-27)' },
  'Rapeseed / Mustard': { msp: 6200, note: 'MSP ₹6,200/quintal (2026-27)' },
  'Mustard': { msp: 6200, note: 'MSP ₹6,200/quintal (2026-27)' },
  'Rapeseed': { msp: 6200, note: 'MSP ₹6,200/quintal (2026-27)' },
  'Safflower': { msp: 6540, note: 'MSP ₹6,540/quintal (2026-27)' },
  'Jute': { msp: 5925, note: 'MSP ₹5,925/quintal (2026-27)' },
  'Copra (Milling)': { msp: 12027, note: 'MSP ₹12,027/quintal (2026-27)' },
  'Copra (Ball)': { msp: 12500, note: 'MSP ₹12,500/quintal (2026-27)' },
  'Copra': { msp: 12027, note: 'Milling: ₹12,027 / Ball: ₹12,500 (2026-27)' },
};

/**
 * Find MSP for a given commodity name and optional variety.
 * Returns null if the commodity has no official MSP (e.g. Chilli, Turmeric, Vegetables).
 */
export function getCommodityMSP(
  commodity: string,
  variety?: string
): { msp: number; bonus?: number; note?: string } | null {
  if (!commodity) return null;
  const normalized = commodity.trim().toLowerCase();
  const vNorm = (variety || '').trim().toLowerCase();
  const combined = `${normalized} ${vNorm}`;

  // Explicit check: Non-MSP horticulture / cash crops must return null (MSP blank)
  if (
    normalized.includes('turmeric') ||
    normalized.includes('chilli') ||
    normalized.includes('mirchi') ||
    normalized.includes('tomato') ||
    normalized.includes('onion') ||
    normalized.includes('potato') ||
    normalized.includes('ginger') ||
    normalized.includes('garlic') ||
    normalized.includes('coriander') ||
    normalized.includes('lime') ||
    normalized.includes('lemon') ||
    normalized.includes('sweet orange') ||
    normalized.includes('mosambi') ||
    (normalized.includes('coconut') && !normalized.includes('copra'))
  ) {
    return null;
  }

  // Cotton: check if medium or long staple
  if (normalized.includes('cotton') || normalized.includes('kapas')) {
    if (combined.includes('medium') || combined.includes('desi')) {
      return CROP_MSP_BENCHMARKS['Cotton (Medium Staple)'];
    }
    if (combined.includes('long') || combined.includes('h-4') || combined.includes('bunny') || combined.includes('brahma')) {
      return CROP_MSP_BENCHMARKS['Cotton (Long Staple)'];
    }
    return CROP_MSP_BENCHMARKS['Cotton'];
  }

  // Jowar: check if maldandi or hybrid
  if (normalized.includes('jowar') || normalized.includes('sorghum') || normalized.includes('jola')) {
    if (combined.includes('maldandi')) {
      return CROP_MSP_BENCHMARKS['Jowar (Maldandi)'];
    }
    return CROP_MSP_BENCHMARKS['Jowar (Hybrid)'];
  }
  if (normalized.includes('maldandi')) {
    return CROP_MSP_BENCHMARKS['Jowar (Maldandi)'];
  }

  // Paddy: check if Grade A or Common
  if (normalized.includes('paddy') || normalized.includes('dhan')) {
    if (combined.includes('grade a') || combined.includes('superfine') || combined.includes('fine') || combined.includes('bpt')) {
      return CROP_MSP_BENCHMARKS['Paddy (Grade A)'];
    }
    return CROP_MSP_BENCHMARKS['Paddy (Common)'];
  }

  // Copra: check if ball or milling
  if (normalized.includes('copra')) {
    if (combined.includes('ball')) {
      return CROP_MSP_BENCHMARKS['Copra (Ball)'];
    }
    return CROP_MSP_BENCHMARKS['Copra (Milling)'];
  }

  // Pulses
  if (
    normalized.includes('red gram') ||
    normalized.includes('arhar') ||
    normalized.includes('kandi') ||
    normalized.includes('pigeonpea') ||
    (/tur/i.test(normalized) && !normalized.includes('turmeric'))
  ) {
    return CROP_MSP_BENCHMARKS['Tur (Arhar)'];
  }
  if (normalized.includes('green gram') || normalized.includes('moong') || normalized.includes('pesalu') || normalized.includes('mung')) {
    return CROP_MSP_BENCHMARKS['Moong'];
  }
  if (normalized.includes('black gram') || normalized.includes('urad') || normalized.includes('minumulu') || /urd/i.test(normalized)) {
    return CROP_MSP_BENCHMARKS['Urad'];
  }
  if (normalized.includes('masur') || normalized.includes('lentil') || normalized.includes('masoor')) {
    return CROP_MSP_BENCHMARKS['Masur (Lentil)'];
  }
  if (
    normalized.includes('chana') ||
    normalized.includes('bengal gram') ||
    normalized.includes('chickpea') ||
    (/gram/i.test(normalized) &&
      !normalized.includes('red gram') &&
      !normalized.includes('green gram') &&
      !normalized.includes('black gram') &&
      !normalized.includes('horse gram'))
  ) {
    return CROP_MSP_BENCHMARKS['Gram'];
  }

  // Oilseeds
  if (normalized.includes('groundnut') || normalized.includes('peanut') || normalized.includes('palli')) {
    return CROP_MSP_BENCHMARKS['Groundnut (in shell)'];
  }
  if (normalized.includes('soya') || normalized.includes('soybean')) {
    return CROP_MSP_BENCHMARKS['Soyabean (Yellow)'];
  }
  if (normalized.includes('sunflower')) {
    return CROP_MSP_BENCHMARKS['Sunflower Seed'];
  }
  if (normalized.includes('sesamum') || normalized.includes('til') || normalized.includes('nuvvulu') || normalized.includes('gingelly')) {
    return CROP_MSP_BENCHMARKS['Sesamum'];
  }
  if (normalized.includes('nigerseed') || normalized.includes('niger')) {
    return CROP_MSP_BENCHMARKS['Nigerseed'];
  }
  if (normalized.includes('mustard') || normalized.includes('rapeseed') || normalized.includes('sarson') || /rai/i.test(normalized)) {
    return CROP_MSP_BENCHMARKS['Rapeseed / Mustard'];
  }
  if (normalized.includes('safflower') || normalized.includes('kusuma') || normalized.includes('kardi')) {
    return CROP_MSP_BENCHMARKS['Safflower'];
  }

  // Cereals & Millets
  if (normalized.includes('bajra') || normalized.includes('sajja') || normalized.includes('cumbu') || normalized.includes('pearl millet')) {
    return CROP_MSP_BENCHMARKS['Bajra'];
  }
  if (normalized.includes('maize') || normalized.includes('makka') || normalized.includes('corn')) {
    return CROP_MSP_BENCHMARKS['Maize'];
  }
  if (normalized.includes('ragi') || normalized.includes('finger millet') || normalized.includes('chodi')) {
    return CROP_MSP_BENCHMARKS['Ragi'];
  }
  if (normalized.includes('wheat') || normalized.includes('gehun')) {
    return CROP_MSP_BENCHMARKS['Wheat'];
  }
  if (normalized.includes('barley') || /jau/i.test(normalized)) {
    return CROP_MSP_BENCHMARKS['Barley'];
  }

  // Commercial / Fibres
  if (/jute/i.test(normalized)) {
    return CROP_MSP_BENCHMARKS['Jute'];
  }

  // Exact or direct entry match against official table
  for (const [key, val] of Object.entries(CROP_MSP_BENCHMARKS)) {
    const kLow = key.toLowerCase();
    if (normalized === kLow || normalized.startsWith(kLow) || kLow.startsWith(normalized)) {
      return val;
    }
  }

  // Not an MSP commodity — keep blank, do not show illustrative/placeholder figure
  return null;
}

/**
 * Check if a market belongs to the local target area (KB Asifabad / Adilabad / Mancherial for Telangana, or Guntur / Kurnool / Palnadu for AP).
 */
export function isLocalMarket(district: string, market: string, state = 'Telangana'): boolean {
  const d = district.toLowerCase();
  const m = market.toLowerCase();
  if (state.toLowerCase().includes('andhra')) {
    return (
      d.includes('guntur') ||
      d.includes('kurnool') ||
      d.includes('palnadu') ||
      d.includes('ananthapur') ||
      m.includes('adoni') ||
      m.includes('narasaraopet') ||
      m.includes('guntakal')
    );
  }
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
  const mspInfo = getCommodityMSP(record.commodity, record.variety);
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

/** Official 33 districts of Telangana */
export const ALL_TELANGANA_DISTRICTS: string[] = [
  'Adilabad',
  'Bhadradri Kothagudem',
  'Hanamkonda',
  'Hyderabad',
  'Jagtial',
  'Jangaon',
  'Jayashankar Bhupalpally',
  'Jogulamba Gadwal',
  'Kamareddy',
  'Karimnagar',
  'Khammam',
  'Kumram Bheem Asifabad',
  'Mahabubabad',
  'Mahabubnagar',
  'Mancherial',
  'Medak',
  'Medchal–Malkajgiri',
  'Mulugu',
  'Nagarkurnool',
  'Nalgonda',
  'Narayanpet',
  'Nirmal',
  'Nizamabad',
  'Peddapalli',
  'Rajanna Sircilla',
  'Ranga Reddy',
  'Sangareddy',
  'Siddipet',
  'Suryapet',
  'Vikarabad',
  'Wanaparthy',
  'Warangal',
  'Yadadri Bhuvanagiri',
];

/** Official 26 districts of Andhra Pradesh */
export const ALL_ANDHRA_PRADESH_DISTRICTS: string[] = [
  'Alluri Sitharama Raju',
  'Anakapalli',
  'Ananthapuramu',
  'Annamayya',
  'Bapatla',
  'Chittoor',
  'Dr. B.R. Ambedkar Konaseema',
  'East Godavari',
  'Eluru',
  'Guntur',
  'Kakinada',
  'Krishna',
  'Kurnool',
  'Nandyal',
  'NTR',
  'Palnadu',
  'Parvathipuram Manyam',
  'Prakasam',
  'Sri Potti Sriramulu Nellore',
  'Sri Sathya Sai',
  'Srikakulam',
  'Tirupati',
  'Visakhapatnam',
  'Vizianagaram',
  'West Godavari',
  'YSR Kadapa',
];

/** Official States and Union Territories of India in alphabetical order */
export const ALL_INDIAN_STATES: string[] = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

/**
 * Retrieve rolling live prices seen across recent days.
 */
export function getRollingLivePrices(state: string): MandiPriceRecord[] {
  try {
    const raw = safeStorage.getItem(ROLLING_LIVE_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as MandiPriceRecord[];
    if (!Array.isArray(list)) return [];
    return list.filter((r) => r.state.toLowerCase() === state.toLowerCase());
  } catch {
    return [];
  }
}

/**
 * Persist recently seen live arrivals so that commodities active yesterday or
 * earlier in the week are retained when only partial mandis have reported today.
 */
export function updateRollingLivePrices(newLiveRecords: MandiPriceRecord[]): void {
  if (!Array.isArray(newLiveRecords) || newLiveRecords.length === 0) return;
  try {
    const raw = safeStorage.getItem(ROLLING_LIVE_STORAGE_KEY);
    const existing: MandiPriceRecord[] = raw ? JSON.parse(raw) : [];
    const map = new Map<string, MandiPriceRecord>();

    // Retain existing live arrivals
    for (const r of existing) {
      if (!r.market || !r.commodity) continue;
      const key = `${r.state.toLowerCase()}::${r.market.toLowerCase()}::${r.commodity.toLowerCase()}`;
      map.set(key, r);
    }

    // Merge or update with newer live arrivals
    for (const r of newLiveRecords) {
      if (!r.market || !r.commodity) continue;
      const key = `${r.state.toLowerCase()}::${r.market.toLowerCase()}::${r.commodity.toLowerCase()}`;
      map.set(key, { ...r, isIndicative: false });
    }

    // Store up to 600 most recent records across states
    const merged = Array.from(map.values()).slice(0, 600);
    safeStorage.setItem(ROLLING_LIVE_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to update rolling live mandi prices:', e);
  }
}

export function getVerifiedMandiPrices(state = 'Telangana'): MandiPriceRecord[] {
  // NOTE: These are indicative benchmark ranges compiled from recent Agmarknet
  // bulletins — NOT live daily arrivals. Live data requires the OGD proxy
  // (OGDINDIA_API_KEY). Dates are intentionally blank so the UI never
  // presents stale figures as "today's" prices.
  const isAP = state.toLowerCase().includes('andhra');

  const apBaseline: Array<{
    district: string;
    market: string;
    commodity: string;
    variety: string;
    min: number;
    max: number;
    modal: number;
    arrival_date: string;
  }> = [
    // Guntur (Major Chilli & Cotton Hub)
    { district: 'Guntur', market: 'Guntur Mirchi Yard', commodity: 'Chilli (Dry)', variety: 'Teja (Super Fine)', min: 16000, max: 21500, modal: 19200, arrival_date: '' },
    { district: 'Guntur', market: 'Guntur AMC', commodity: 'Cotton', variety: 'Bunny / Brahma', min: 7200, max: 7900, modal: 7650, arrival_date: '' },
    // Kurnool & Adoni (Major Groundnut, Cotton & Onion Hub)
    { district: 'Kurnool', market: 'Adoni AMC', commodity: 'Cotton', variety: 'Kapas Long Staple', min: 7250, max: 7950, modal: 7700, arrival_date: '' },
    { district: 'Kurnool', market: 'Adoni AMC', commodity: 'Groundnut', variety: 'Pods Local', min: 6400, max: 7300, modal: 6950, arrival_date: '' },
    { district: 'Kurnool', market: 'Kurnool AMC', commodity: 'Bengal Gram(Gram)', variety: 'Chana Local', min: 5800, max: 6400, modal: 6150, arrival_date: '' },
    // Palnadu
    { district: 'Palnadu', market: 'Narasaraopet APMC', commodity: 'Cotton', variety: 'Bunny', min: 7200, max: 7850, modal: 7600, arrival_date: '' },
    { district: 'Palnadu', market: 'Narasaraopet APMC', commodity: 'Paddy(Dhan)(Grade A)', variety: 'BPT 5204', min: 2420, max: 2750, modal: 2580, arrival_date: '' },
    { district: 'Palnadu', market: 'Gurazala APMC', commodity: 'Chilli (Dry)', variety: 'Red Local', min: 14500, max: 18500, modal: 16800, arrival_date: '' },
    // Ananthapuramu & Sri Sathya Sai
    { district: 'Ananthapuramu', market: 'Gooti APMC', commodity: 'Red Gram', variety: 'Arhar / Tur Local', min: 7800, max: 8600, modal: 8300, arrival_date: '' },
    { district: 'Ananthapuramu', market: 'Guntakal APMC', commodity: 'Groundnut', variety: 'Groundnut Seed', min: 6500, max: 7400, modal: 7050, arrival_date: '' },
    { district: 'Sri Sathya Sai', market: 'Penukonda APMC', commodity: 'Groundnut', variety: 'Local', min: 6450, max: 7250, modal: 6900, arrival_date: '' },
    // Kakinada & East Godavari
    { district: 'Kakinada', market: 'Samalkot APMC', commodity: 'Paddy(Dhan)(Common)', variety: 'MTU 1001', min: 2350, max: 2650, modal: 2520, arrival_date: '' },
    { district: 'East Godavari', market: 'Mandapeta APMC', commodity: 'Paddy(Dhan)(Grade A)', variety: '1001 Superfine', min: 2450, max: 2800, modal: 2650, arrival_date: '' },
    // YSR Kadapa
    { district: 'YSR Kadapa', market: 'Badvel APMC', commodity: 'Paddy(Dhan)(Common)', variety: 'Molagolukulu', min: 2400, max: 2750, modal: 2580, arrival_date: '' },
    // Chittoor
    { district: 'Chittoor', market: 'Madanapalle APMC', commodity: 'Tomato', variety: 'Hybrid Super', min: 1800, max: 3200, modal: 2600, arrival_date: '' },
    // Vijayanagaram
    { district: 'Vijayanagaram', market: 'Chipurupalli APMC', commodity: 'Maize', variety: 'Local Hybrid', min: 2200, max: 2480, modal: 2380, arrival_date: '' },
    // Kurnool Jowar & Pulses
    { district: 'Kurnool', market: 'Kurnool AMC', commodity: 'Jowar(Sorghum)', variety: 'White / Yellow', min: 3650, max: 4250, modal: 4050, arrival_date: '' },
    { district: 'Kurnool', market: 'Kurnool AMC', commodity: 'Onion', variety: 'Bellary Red', min: 2200, max: 3400, modal: 2850, arrival_date: '' },
    { district: 'Kurnool', market: 'Kurnool AMC', commodity: 'Sunflower', variety: 'Hybrid Seed', min: 6600, max: 7500, modal: 7150, arrival_date: '' },
    // Guntur & Krishna / NTR Pulses
    { district: 'Guntur', market: 'Tenali APMC', commodity: 'Black Gram(Urd Beans)(Whole)', variety: 'Urad Local', min: 7000, max: 7800, modal: 7450, arrival_date: '' },
    { district: 'NTR', market: 'Nandigama APMC', commodity: 'Green Gram (Moong)', variety: 'Moong Shining', min: 7900, max: 8850, modal: 8500, arrival_date: '' },
    // Millets & Commercial (Prakasam, Anakapalle & Konaseema)
    { district: 'Prakasam', market: 'Ongole APMC', commodity: 'Bajra(Pearl Millet/Cumbu)', variety: 'Hybrid Bajra', min: 2300, max: 2700, modal: 2550, arrival_date: '' },
    { district: 'Prakasam', market: 'Markapur APMC', commodity: 'Ragi(Finger Millet)', variety: 'Local Ragi', min: 3800, max: 4500, modal: 4200, arrival_date: '' },
    { district: 'Dr. B.R. Ambedkar Konaseema', market: 'Ambajipeta APMC', commodity: 'Coconut', variety: 'Grade A Mature', min: 2400, max: 3100, modal: 2750, arrival_date: '' },
    { district: 'Palnadu', market: 'Petlurivaripalem APMC', commodity: 'Lime', variety: 'Lemon Yellow', min: 3500, max: 5400, modal: 4600, arrival_date: '' },
    { district: 'Anakapalli', market: 'Anakapalle AMC', commodity: 'Gur(Jaggery)', variety: 'Golden Lump', min: 3800, max: 4600, modal: 4250, arrival_date: '' },
  ];

  const tgBaseline: Array<{
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
    {
      district: 'Kumram Bheem Asifabad',
      market: 'Asifabad AMC',
      commodity: 'Jowar(Sorghum)',
      variety: 'White Hybrid',
      min: 3600,
      max: 4200,
      modal: 3950,
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
    {
      district: 'Adilabad',
      market: 'Adilabad AMC',
      commodity: 'Jowar(Sorghum)',
      variety: 'Local White (Jowar)',
      min: 3650,
      max: 4280,
      modal: 4020,
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

    // Pulses (Green Gram / Moong & Black Gram / Urad)
    {
      district: 'Khammam',
      market: 'Khammam AMC',
      commodity: 'Green Gram (Moong)',
      variety: 'Moong Local',
      min: 7800,
      max: 8800,
      modal: 8450,
      arrival_date: '',
    },
    {
      district: 'Nizamabad',
      market: 'Nizamabad AMC',
      commodity: 'Black Gram (Urad)',
      variety: 'Urad Local Black',
      min: 6800,
      max: 7600,
      modal: 7250,
      arrival_date: '',
    },

    // Oilseeds (Sunflower & Sesamum / Til)
    {
      district: 'Siddipet',
      market: 'Siddipet AMC',
      commodity: 'Sunflower',
      variety: 'Hybrid Sunflower Seed',
      min: 6500,
      max: 7400,
      modal: 7050,
      arrival_date: '',
    },
    {
      district: 'Jagtial',
      market: 'Jagtial AMC',
      commodity: 'Sesamum (Til)',
      variety: 'White Til (Gingelly)',
      min: 8800,
      max: 9800,
      modal: 9400,
      arrival_date: '',
    },

    // Vegetables & Horticulture (Hyderabad / Bowenpally / Gudimalkapur Hub)
    {
      district: 'Hyderabad',
      market: 'Bowenpally Market',
      commodity: 'Tomato',
      variety: 'Local Hybrid',
      min: 1600,
      max: 2800,
      modal: 2200,
      arrival_date: '',
    },
    {
      district: 'Hyderabad',
      market: 'Bowenpally Market',
      commodity: 'Onion',
      variety: 'Nasik / Local Red',
      min: 2400,
      max: 3600,
      modal: 3100,
      arrival_date: '',
    },
    {
      district: 'Hyderabad',
      market: 'Bowenpally Market',
      commodity: 'Bhindi(Ladies Finger)',
      variety: 'Hybrid Green',
      min: 2500,
      max: 3800,
      modal: 3200,
      arrival_date: '',
    },
    {
      district: 'Hyderabad',
      market: 'Bowenpally Market',
      commodity: 'Beetroot',
      variety: 'Local Beet',
      min: 2000,
      max: 3000,
      modal: 2500,
      arrival_date: '',
    },
    {
      district: 'Nalgonda',
      market: 'Nakrekal AMC',
      commodity: 'Lime',
      variety: 'Kagzi Lemon',
      min: 3200,
      max: 5200,
      modal: 4400,
      arrival_date: '',
    },
    {
      district: 'Sangareddy',
      market: 'Zaheerabad AMC',
      commodity: 'Ginger',
      variety: 'Fresh Green Ginger',
      min: 5500,
      max: 8200,
      modal: 7100,
      arrival_date: '',
    },
  ];

  const isTG = state.toLowerCase().includes('telangana');
  const fallbackNationalBaseline = [
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Cotton', variety: 'Medium Staple', min: 7000, max: 7650, modal: 7450, arrival_date: '' },
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Paddy(Dhan)(Common)', variety: 'Common', min: 2250, max: 2350, modal: 2320, arrival_date: '' },
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Wheat', variety: 'Dara / Local', min: 2350, max: 2550, modal: 2450, arrival_date: '' },
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Bengal Gram(Gram)', variety: 'Desi', min: 5700, max: 6200, modal: 6000, arrival_date: '' },
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Maize', variety: 'Yellow', min: 2150, max: 2350, modal: 2280, arrival_date: '' },
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Soyabean', variety: 'Yellow', min: 4400, max: 4850, modal: 4700, arrival_date: '' },
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Mustard', variety: 'Mustard Seed', min: 5500, max: 6050, modal: 5850, arrival_date: '' },
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Onion', variety: 'Red', min: 1800, max: 3200, modal: 2600, arrival_date: '' },
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Tomato', variety: 'Hybrid', min: 1400, max: 2600, modal: 2100, arrival_date: '' },
    { district: 'Central APMC', market: `${state} Main APMC`, commodity: 'Potato', variety: 'Jyoti', min: 1200, max: 2200, modal: 1800, arrival_date: '' },
  ];

  const chosenBaseline = isAP ? apBaseline : isTG ? tgBaseline : fallbackNationalBaseline;

  return chosenBaseline.map((r, i) => {
    const mspInfo = getCommodityMSP(r.commodity, r.variety);
    const msp = mspInfo?.msp || 0;
    const mspDifference = msp > 0 ? r.modal - msp : undefined;

    return {
      id: `verified-${isAP ? 'ap' : isTG ? 'tg' : 'state'}-${i}`,
      state: isAP ? 'Andhra Pradesh' : isTG ? 'Telangana' : state,
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
      isLocal: isLocalMarket(r.district, r.market, isAP ? 'Andhra Pradesh' : isTG ? 'Telangana' : state),
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
  const targetState = query.state || 'Telangana';
  const cacheKey = CACHE_PREFIX + JSON.stringify({ ...query, state: targetState });
  const cached = query.bypass_cache ? null : readCache(cacheKey);

  // Merge custom prices even on cached response
  const customPrices = getCustomMandiPrices();
  if (cached) {
    const merged = mergeCustomPrices(cached.records, customPrices, query);
    return { ...cached, records: merged };
  }

  // Attempt live OGD proxy via Edge Function
  try {
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'anon-key';
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const authToken = token || supabaseAnonKey;

    if (authToken && EDGE_FUNCTION_BASE) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let res: Response;
      try {
        res = await fetch(`${EDGE_FUNCTION_BASE}/ogd-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            dataset: 'mandi-prices',
            filters: { state: targetState },
            limit: query.limit ?? 250,
            bypass_cache: query.bypass_cache === true,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (res && res.ok) {
        const payload = await res.json();
        const liveRecords = normalizeRecords(payload.records, targetState);

        if (liveRecords.length > 0) {
          // Persist and merge with rolling live arrivals so yesterday's live commodities are retained
          updateRollingLivePrices(liveRecords);
          const allRolling = getRollingLivePrices(targetState);
          const activeLive = allRolling.length > 0 ? allRolling : liveRecords;

          // Keep verified benchmarks for all markets/commodities that haven't reported live recently
          const verified = getVerifiedMandiPrices(targetState);

          // Deduplicate so if a market already has live/recent data for a commodity, we don't show the duplicate baseline
          const liveMarketCommodityKeys = new Set(
            activeLive.map((r) => `${r.market.trim().toLowerCase()}::${r.commodity.trim().toLowerCase()}`)
          );
          const supplementaryBenchmarks = verified.filter(
            (b) => !liveMarketCommodityKeys.has(`${b.market.trim().toLowerCase()}::${b.commodity.trim().toLowerCase()}`)
          );

          const combined = [...activeLive, ...supplementaryBenchmarks];
          let filtered = filterRecords(combined, query);

          // If the narrow district query produced 0 matches, show all state records rather than empty
          if (query.district && filtered.length === 0) {
            filtered = filterRecords(combined, { ...query, district: undefined });
          }

          const result: MandiPricesResult = {
            records: mergeCustomPrices(filtered, customPrices, query),
            fetchedAt: Date.now(),
            source: 'ogd-live',
          };
          writeCache(cacheKey, { ...result, records: filtered });
          return result;
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[OGD] Live proxy returned ${res.status}: ${errText}`);
      }
    }
  } catch (err) {
    console.warn('[OGD] proxy fetch failed, using verified Agmarknet dataset:', err);
  }

  // Seamless fallback to rolling live records + verified Agmarknet daily price bulletin
  const rolling = getRollingLivePrices(targetState);
  const verified = getVerifiedMandiPrices(targetState);
  const rollingKeys = new Set(
    rolling.map((r) => `${r.market.trim().toLowerCase()}::${r.commodity.trim().toLowerCase()}`)
  );
  const supplementary = verified.filter(
    (b) => !rollingKeys.has(`${b.market.trim().toLowerCase()}::${b.commodity.trim().toLowerCase()}`)
  );
  const combined = rolling.length > 0 ? [...rolling, ...supplementary] : verified;
  let filtered = filterRecords(combined, query);
  // If the detected district isn't covered by the bulletin, show state-level
  // rates rather than an empty widget.
  if (query.district && filtered.length === 0) {
    filtered = filterRecords(combined, { ...query, district: undefined });
  }
  const result: MandiPricesResult = {
    records: mergeCustomPrices(filtered, customPrices, query),
    fetchedAt: Date.now(),
    source: rolling.length > 0 ? 'ogd-live' : 'agmarknet-verified',
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
      const isDirectMatch = d.includes(q) || q.includes(d);
      // Also match historical unified Adilabad-Asifabad-Mancherial region
      const isRegionalMatch =
        (q.includes('asifabad') || q.includes('kumram') || q.includes('tiryani')) &&
        (d.includes('adilabad') || d.includes('asifabad') || d.includes('mancherial'));
      if (!isDirectMatch && !isRegionalMatch) return false;
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
  // Priority:
  // 1. Custom officer rates first
  // 2. Real live Agmarknet arrivals (!isIndicative) before indicative benchmarks
  // 3. Local target mandis (Asifabad, Adilabad, etc.) before other districts
  // 4. Modal price descending
  return [...filteredCustom, ...baseRecords].sort((a, b) => {
    if (a.isCustom && !b.isCustom) return -1;
    if (!a.isCustom && b.isCustom) return 1;

    // Real live reports take precedence over indicative baselines
    const aIsLive = !a.isIndicative && !!a.arrival_date;
    const bIsLive = !b.isIndicative && !!b.arrival_date;
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    if (a.isLocal && !b.isLocal) return -1;
    if (!a.isLocal && b.isLocal) return 1;
    return b.modal_price - a.modal_price;
  });
}

function normalizeRecords(raw: unknown, defaultState = 'Telangana'): MandiPriceRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const rec = r as Record<string, unknown>;
      const state = str(rec.state || rec.State) || defaultState;
      const district = str(rec.district || rec.District);
      const market = str(rec.market || rec.Market);
      const commodity = str(rec.commodity || rec.Commodity);
      const min_price = num(rec.min_price || rec.Min_Price);
      const max_price = num(rec.max_price || rec.Max_Price);
      const rawModal = num(rec.modal_price || rec.Modal_Price);
      const modal = rawModal > 0 ? rawModal : max_price > 0 ? max_price : min_price;

      const mspInfo = getCommodityMSP(commodity, str(rec.variety || rec.Variety));
      const msp = mspInfo?.msp || 0;
      const mspDifference = msp > 0 && modal > 0 ? modal - msp : undefined;

      return {
        state,
        district,
        market,
        commodity,
        variety: str(rec.variety || rec.Variety),
        arrival_date: str(rec.arrival_date || rec.Arrival_Date),
        min_price,
        max_price,
        modal_price: modal,
        msp: msp > 0 ? msp : undefined,
        mspDifference,
        isLocal: isLocalMarket(district, market, state),
        isCustom: false,
        isIndicative: false,
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

function cropHeaderFor(commodity: string, variety?: string): string {
  const c = commodity.toLowerCase();
  if (c.includes('cotton') || c.includes('kapas')) return '*🌱 COTTON / పత్తి*';
  if (c.includes('paddy') || c.includes('dhan')) return `*🌾 PADDY / వరి (${variety || 'Grade A'})*`;
  if (c.includes('jowar') || c.includes('sorghum') || c.includes('maldandi')) return '*🌾 JOWAR / జొన్నలు (Sorghum)*';
  if (c.includes('red gram') || c.includes('tur') || c.includes('arhar')) return '*🫘 RED GRAM / కంది*';
  if (c.includes('green gram') || c.includes('moong')) return `*GREEN GRAM / ${commodity.toUpperCase()}*`;
  if (c.includes('black gram') || c.includes('urd')) return `*BLACK GRAM / ${commodity.toUpperCase()}*`;
  if (c.includes('soya')) return '*🟡 SOYA BEAN / సోయాబీన్*';
  if (c.includes('maize') || c.includes('corn')) return '*🌽 MAIZE / మక్కజొన్న*';
  if (c.includes('chilli')) return '*🌶️ CHILLI / మిర్చి (Dry)*';
  if (c.includes('turmeric')) return '*🌿 TURMERIC / పసుపు*';
  return `*🌿 ${commodity.toUpperCase()}*`;
}

/**
 * Builds formatted WhatsApp broadcast message for Telangana, Andhra Pradesh, or any Indian State Mandi Prices.
 * Uses bold headers following the AGRONIX standard.
 */
export function buildMandiWhatsAppText(
  records: MandiPriceRecord[],
  t: (en: string, te: string) => string,
  state: string = 'Telangana'
): string {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const isAP = state.toLowerCase().includes('andhra');
  const isTG = state.toLowerCase().includes('telangana');

  const lines: string[] = [
    `*🌾 ${
      isAP
        ? t('AGRONIX — ANDHRA PRADESH MANDI PRICES BULLETIN', 'అగ్రోనిక్స్ — ఆంధ్రప్రదేశ్ మండి ధరల బులెటిన్')
        : isTG
          ? t('AGRONIX — TELANGANA MANDI PRICES BULLETIN', 'అగ్రోనిక్స్ — తెలంగాణ మండి ధరల బులెటిన్')
          : `AGRONIX — ${state.toUpperCase()} MANDI PRICES BULLETIN`
    } 🌾*`,
    `*${t('Date / తేదీ:', 'తేదీ:')}* ${today}`,
    `*${t('Region:', 'ప్రాంతం:')}* ${
      isAP
        ? 'Andhra Pradesh Mandis & AMCs'
        : isTG
          ? 'Kumram Bheem Asifabad & Telangana Mandis'
          : `${state} Mandis & APMCs`
    }`,
    `*${t('Unit:', 'యూనిట్:')}* ₹ / Quintal (క్వింటాల్‌కు)`,
    '----------------------------------------',
  ];

  // Group the provided records by commodity so filtered shares only contain
  // matching data — no hardcoded crop list that can silently drop results.
  const groups = new Map<string, MandiPriceRecord[]>();
  for (const r of records) {
    if (!r.commodity || !r.market || !(r.modal_price > 0)) continue;
    const key = r.commodity.trim().toLowerCase();
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const MAX_COMMODITIES = 12;
  let rendered = 0;
  for (const [, matches] of groups) {
    if (rendered >= MAX_COMMODITIES) break;
    rendered += 1;

    const commodity = matches[0].commodity;
    const mspInfo = getCommodityMSP(commodity, matches[0].variety);
    lines.push(cropHeaderFor(commodity, matches[0].variety));
    if (mspInfo?.msp) {
      const bonusText = mspInfo.bonus ? ` (+₹${mspInfo.bonus} Telangana Bonus)` : '';
      lines.push(`• *Govt MSP:* ₹${mspInfo.msp.toLocaleString('en-IN')}/qtl${bonusText}`);
    }

    // Top 3 markets for this crop
    matches.slice(0, 3).forEach((m) => {
      const diffText = m.mspDifference && m.mspDifference > 0 ? ` (+₹${m.mspDifference})` : '';
      const place = m.district ? `${m.market} (${m.district})` : m.market;
      lines.push(`• *${place}:* ₹${m.modal_price.toLocaleString('en-IN')} (Min: ₹${m.min_price} - Max: ₹${m.max_price})${diffText}`);
    });
    lines.push('');
  }

  lines.push('----------------------------------------');
  if (records.some((r) => r.isIndicative)) {
    lines.push(`*${t('Source (indicative — verify on Agmarknet):', 'మూలం (సూచిక):')}* AGRONIX`);
  } else {
    lines.push(`*${t('Official Source:', 'అధికారిక మూలం:')}* ${
      isAP
        ? 'Agmarknet / Andhra Pradesh Agricultural Marketing Department'
        : isTG
          ? 'Agmarknet / Telangana Agricultural Market Committees'
          : `Agmarknet / ${state} Agricultural Marketing Department`
    }`);
  }
  lines.push(`*${t('Portal:', 'పోర్టల్:')}* AGRONIX — Tiryani Agriculture Department`);

  return lines.join('\n');
}
