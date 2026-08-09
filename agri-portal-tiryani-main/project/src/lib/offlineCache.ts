const OFFLINE_CACHE_PREFIX = 'tiryani-offline-cache:';
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

interface CachedValue<T> {
  expiresAt: number;
  value: T;
}

type SupabaseResult = PromiseLike<{ data: unknown | null; error: unknown }>;

export function readOfflineCache<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(`${OFFLINE_CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedValue<T>;
    if (!cached || cached.expiresAt < Date.now()) {
      window.localStorage.removeItem(`${OFFLINE_CACHE_PREFIX}${key}`);
      return null;
    }

    return cached.value;
  } catch {
    return null;
  }
}

export function writeOfflineCache<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(
      `${OFFLINE_CACHE_PREFIX}${key}`,
      JSON.stringify({ value, expiresAt: Date.now() + ttlMs })
    );
  } catch {
    // Offline cache is best-effort. Live data should never depend on storage.
  }
}

export async function cachedSupabaseRows<T>(
  key: string,
  queryFactory: () => SupabaseResult,
  fallback: T[] = []
): Promise<T[]> {
  const cached = readOfflineCache<T[]>(key);

  try {
    const { data, error } = await queryFactory();
    if (error) throw error;
    const rows = (data || fallback) as T[];
    writeOfflineCache(key, rows);
    return rows;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

export async function cachedSupabaseValue<T>(
  key: string,
  queryFactory: () => SupabaseResult,
  fallback: T | null = null
): Promise<T | null> {
  const cached = readOfflineCache<T>(key);

  try {
    const { data, error } = await queryFactory();
    if (error) throw error;
    const value = (data ?? fallback) as T | null;
    if (value !== null) writeOfflineCache(key, value);
    return value;
  } catch (error) {
    if (cached !== null) return cached;
    throw error;
  }
}
