// =====================================================================
// GBIF occurrence service
// =====================================================================
// Resolves a Crop Doctor scientific name via the GBIF species-match API,
// then returns the India occurrence count (country=IN, limit=0 count-only
// request). Results are cached in localStorage for 24h and concurrent
// calls for the same name are deduplicated so a grid of cards fires at
// most one request per species.
//
// NOTE: GBIF counts are global biodiversity occurrence records — they are
// NOT real-time pest surveillance and are shown to officers as reference
// data only.
// =====================================================================
import { safeStorage } from '../../../shared/lib/safeStorage';

const GBIF_API = 'https://api.gbif.org/v1';
const CACHE_PREFIX = 'gbif:occurrence:v1:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

export interface GbifOccurrenceInfo {
  scientificName: string;
  taxonKey: number;
  indiaCount: number;
  gbifUrl: string;
}

const inflight = new Map<string, Promise<GbifOccurrenceInfo | null>>();

export function getGbifOccurrenceInfo(scientificName: string | null | undefined): Promise<GbifOccurrenceInfo | null> {
  const name = (scientificName ?? '').trim();
  // Require a plausible binomial (Genus species ...) — GBIF match handles
  // author citations, but plain names like "BPH" or empty strings are skipped.
  if (name.split(/\s+/).length < 2 || !/^[A-Za-z]{3,}/.test(name)) {
    return Promise.resolve(null);
  }

  const key = name.toLowerCase();
  const cached = readCache(key);
  if (cached !== undefined) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = fetchInfo(name)
    .then((info) => {
      inflight.delete(key);
      writeCache(key, info);
      return info;
    })
    .catch(() => {
      inflight.delete(key);
      return null;
    });
  inflight.set(key, promise);
  return promise;
}

async function fetchInfo(name: string): Promise<GbifOccurrenceInfo | null> {
  const match = await fetchJson(`${GBIF_API}/species/match?name=${encodeURIComponent(name)}`);
  const taxonKey = Number(match?.usageKey);
  if (!taxonKey) return null;

  const search = await fetchJson(`${GBIF_API}/occurrence/search?taxon_key=${taxonKey}&country=IN&limit=0`);
  return {
    scientificName: name,
    taxonKey,
    indiaCount: Number(search?.count ?? 0),
    gbifUrl: `https://www.gbif.org/occurrence/search?taxon_key=${taxonKey}&country=IN`,
  };
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function readCache(key: string): GbifOccurrenceInfo | null | undefined {
  try {
    const raw = safeStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { expires: number; value: GbifOccurrenceInfo | null };
    if (parsed.expires < Date.now()) {
      safeStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    return parsed.value;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, value: GbifOccurrenceInfo | null): void {
  safeStorage.setItem(
    CACHE_PREFIX + key,
    JSON.stringify({ expires: Date.now() + CACHE_TTL_MS, value })
  );
}
