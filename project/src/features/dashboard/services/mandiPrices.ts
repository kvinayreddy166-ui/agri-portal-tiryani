// =====================================================================
// Mandi prices service — Agmarknet daily prices via data.gov.in
// =====================================================================
// Calls the `ogd-proxy` Edge Function (the data.gov.in API key lives
// server-side). Requires an authenticated Supabase session; returns null
// silently when unauthenticated or the API is not configured.
// =====================================================================
import { supabase } from '../../../shared/lib/supabase';
import { safeStorage } from '../../../shared/lib/safeStorage';

const EDGE_FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || ''}/functions/v1`;
const CACHE_PREFIX = 'mandi-prices:v1:';
const CACHE_TTL_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 12000;

export interface MandiPriceRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
}

export interface MandiPricesResult {
  records: MandiPriceRecord[];
  fetchedAt: number;
}

export interface MandiPricesQuery {
  state?: string;
  district?: string;
  commodity?: string;
  limit?: number;
}

export async function fetchMandiPrices(query: MandiPricesQuery = {}): Promise<MandiPricesResult | null> {
  const cacheKey = CACHE_PREFIX + JSON.stringify(query);
  const cached = readCache(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;

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
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) return null;

    const payload = await res.json();
    const records = normalizeRecords(payload.records);
    if (!records.length) return null;

    const result: MandiPricesResult = { records, fetchedAt: Date.now() };
    writeCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

function normalizeRecords(raw: unknown): MandiPriceRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const rec = r as Record<string, unknown>;
      return {
        state: str(rec.state),
        district: str(rec.district),
        market: str(rec.market),
        commodity: str(rec.commodity),
        variety: str(rec.variety),
        arrival_date: str(rec.arrival_date),
        min_price: num(rec.min_price),
        max_price: num(rec.max_price),
        modal_price: num(rec.modal_price),
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
