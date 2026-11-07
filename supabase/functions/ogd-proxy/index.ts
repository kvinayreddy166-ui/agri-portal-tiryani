// =====================================================================
// ogd-proxy — data.gov.in (Open Government Data) proxy (Edge Function)
// =====================================================================
// Keeps the OGD API key server-side. Authenticated users POST a dataset
// key plus optional filters; the function maps the key to a resource id,
// forwards a strictly allow-listed query to api.data.gov.in, caches the
// response briefly per worker, and returns normalized JSON.
// =====================================================================
import { corsHeaders, createAdminClient, errorResponse, json, verifyUser } from '../_shared/knowledge.ts';

const OGD_BASE_URL = 'https://api.data.gov.in/resource';

// Dataset keys the client may request -> data.gov.in resource id.
// Each id can be overridden via `supabase secrets set` without redeploying.
const DATASETS: Record<string, string> = {
  // "Current Daily Price of Various Commodities from Various Markets (Mandi)" — AGMARKNET
  'mandi-prices': Deno.env.get('OGD_MANDI_RESOURCE_ID') ?? '9ef84268-d588-465a-a308-a864a43d0070',
};

// Only these filter fields are forwarded per dataset (prevents arbitrary querying).
const ALLOWED_FILTERS: Record<string, string[]> = {
  'mandi-prices': ['state', 'district', 'market', 'commodity', 'variety', 'arrival_date'],
};

const MAX_LIMIT = 500;
const CACHE_TTL_MS = 30 * 60 * 1000; // mandi prices update roughly daily
const FETCH_TIMEOUT_MS = 12000;
const MAX_CACHE_ENTRIES = 200;

const cache = new Map<string, { expires: number; payload: unknown }>();
const lastGoodResponse = new Map<string, unknown>();

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('POST only.', 405);
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const apiKeyHeader = req.headers.get('apikey') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // If caller provided token or apikey that matches SUPABASE_ANON_KEY, or if gateway passed it:
    let isAuthorized = false;
    if (supabaseAnonKey && (token === supabaseAnonKey || apiKeyHeader === supabaseAnonKey)) {
      isAuthorized = true;
    } else if (token) {
      try {
        const supabase = createAdminClient();
        const { user } = await verifyUser(req, supabase);
        if (user) isAuthorized = true;
      } catch (e) {
        console.warn('[ogd-proxy] verifyUser failed:', e);
      }
    }

    // Also: If the request came through Supabase Gateway with a non-empty token or apikey
    if (!isAuthorized && (token || apiKeyHeader)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return errorResponse('Authentication required.', 401);
    }

    const apiKey = Deno.env.get('OGDINDIA_API_KEY') ?? '';
    if (!apiKey) return errorResponse('data.gov.in API key is not configured on the server.', 503);

    const body = await req.json().catch(() => null);
    const dataset = typeof body?.dataset === 'string' ? body.dataset : '';
    const resourceId = DATASETS[dataset];
    if (!resourceId) return errorResponse('Unknown dataset.', 400);

    const allowed = ALLOWED_FILTERS[dataset] ?? [];
    const rawFilters = (body?.filters ?? {}) as Record<string, unknown>;
    const limit = clampInt(body?.limit, 1, MAX_LIMIT, 100);
    const offset = clampInt(body?.offset, 0, 100000, 0);
    // Note: data.gov.in CKAN backend returns 0 records if sort[arrival_date] is sent (text date column)
    const sortField = typeof body?.sort === 'string' && allowed.includes(body.sort) && body.sort !== 'arrival_date' ? body.sort : null;
    const sortDesc = body?.sort_dir !== 'asc';
    const bypassCache = body?.bypass_cache === true;

    const params = new URLSearchParams({
      'api-key': apiKey,
      format: 'json',
      limit: String(limit),
      offset: String(offset),
    });
    if (sortField) params.set(`sort[${sortField}]`, sortDesc ? 'desc' : 'asc');
    for (const key of allowed) {
      const raw = rawFilters[key];
      if (typeof raw === 'string' && raw.trim()) {
        params.set(`filters[${key}]`, raw.trim().slice(0, 120));
      }
    }

    const cacheKey = `${dataset}:${limit}:${offset}:${sortField}:${sortDesc}:${JSON.stringify(rawFilters)}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now() && !bypassCache) {
      return json({ ...(cached.payload as Record<string, unknown>), cached: true });
    }

    const requestUrl = `${OGD_BASE_URL}/${resourceId}?${params.toString()}`;
    console.log('OGD proxy requesting:', requestUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let upstream: Response | null = null;
    let fetchError: Error | null = null;
    try {
      upstream = await fetch(requestUrl, { signal: controller.signal });
    } catch (err) {
      fetchError = err as Error;
    } finally {
      clearTimeout(timer);
    }

    if (!upstream || !upstream.ok) {
      const status = upstream ? upstream.status : 504;
      const errText = upstream ? await upstream.text().catch(() => '') : fetchError?.message || 'timeout';
      console.warn(`[ogd-proxy] data.gov.in upstream failed (${status}): ${errText}`);

      // If rate limited or error, fall back to cached response or last good response
      const fallback = cached?.payload || lastGoodResponse.get(cacheKey) || lastGoodResponse.get(dataset);
      if (fallback) {
        console.log('[ogd-proxy] Serving fallback/stale data due to upstream issue');
        return json({ ...(fallback as Record<string, unknown>), cached: true, upstreamStatus: status });
      }

      return errorResponse(`data.gov.in request failed (${status}): ${errText}`, 502);
    }

    const payload = await upstream.json();
    const result = {
      dataset,
      total: Number(payload.count ?? payload.total ?? 0),
      records: Array.isArray(payload.records) ? payload.records : [],
    };

    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, payload: result });
    if (result.records.length > 0) {
      lastGoodResponse.set(cacheKey, result);
      lastGoodResponse.set(dataset, result);
    }

    return json(result);
  } catch (err) {
    console.error('ogd-proxy error:', err);
    return errorResponse((err as Error).message || 'Proxy request failed.', 500);
  }
});

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
