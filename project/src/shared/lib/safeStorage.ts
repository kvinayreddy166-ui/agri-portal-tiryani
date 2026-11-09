const memoryFallback = new Map<string, string>();

let activeUserId: string | null = null;

export const setStorageActiveUser = (userId: string | null): void => {
  activeUserId = userId;
};

export const getStorageActiveUser = (): string | null => {
  if (activeUserId) return activeUserId;
  if (typeof window === 'undefined') return null;

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const raw = window.localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const sess = parsed?.currentSession || parsed;
          if (sess?.user?.id) {
            activeUserId = sess.user.id;
            return activeUserId;
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
};

// Global application preferences that should NOT be scoped per user
const GLOBAL_APP_KEYS = new Set([
  'tiryani-current-page',
  'tiryani-language',
  'tiryani-theme',
  'tiryani-app-build-version',
  'tiryani-pwa-recovery-attempted-at',
  'tiryani-startup-recovery-v1',
  'tiryani-startup-recovery-v2',
  'tiryani-startup-recovery-v3',
  'tiryani-startup-recovery-v4',
]);

const USER_ISOLATED_PREFIXES = [
  'agri-legal-',
  'agri-deadline-',
  'agronix_officer_',
  'tourDiaryRecovery',
  'covering_letter_cda_',
  'fco-explorer-recent-',
  'ia-explorer-recent-',
  'tiryani-fertilizer-',
  'tiryani-insecticide-',
  'tiryani-pesticide-',
  'tiryani-seed-',
  'tiryani-statutory-',
  'tiryani-covering-letter-',
  'tiryani-inspector-',
  'tiryani-officer-',
  'tiryani-cached-',
  'tiryani_officer_',
  'tiryani_sample_targets_cache',
  'tiryani_cached_',
];

export const isUserIsolatedKey = (key: string): boolean => {
  if (GLOBAL_APP_KEYS.has(key)) return false;
  return USER_ISOLATED_PREFIXES.some((prefix) => key.startsWith(prefix));
};

export const resolveScopedStorageKey = (key: string): string => {
  if (!isUserIsolatedKey(key)) return key;
  // If already scoped, return as-is
  if (key.startsWith('usr_') || key.startsWith('guest_')) return key;

  const uid = getStorageActiveUser();
  return uid ? `usr_${uid}_${key}` : `guest_${key}`;
};

/**
 * localStorage access that never throws and isolates officer statutory records,
 * drafts, and inspection data per authenticated officer account.
 */
export const safeStorage = {
  getItem(key: string): string | null {
    const isIsolated = isUserIsolatedKey(key);
    const targetKey = isIsolated ? resolveScopedStorageKey(key) : key;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(targetKey);
        if (val !== null) return val;

        // Backward compatibility migration: If scoped key does not exist yet,
        // check legacy un-prefixed key and migrate it to the current user's scope.
        if (isIsolated && targetKey !== key) {
          const legacyVal = window.localStorage.getItem(key);
          if (legacyVal !== null) {
            try {
              window.localStorage.setItem(targetKey, legacyVal);
            } catch {
              // ignore
            }
            return legacyVal;
          }
        }
        return null;
      }
    } catch {
      // Fall through to memory store
    }
    return memoryFallback.get(targetKey) ?? (isIsolated ? memoryFallback.get(key) ?? null : null);
  },

  setItem(key: string, value: string): boolean {
    const isIsolated = isUserIsolatedKey(key);
    const targetKey = isIsolated ? resolveScopedStorageKey(key) : key;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(targetKey, value);
      }
    } catch {
      // Fall through to memory store
    }
    memoryFallback.set(targetKey, value);
    return true;
  },

  removeItem(key: string): void {
    const isIsolated = isUserIsolatedKey(key);
    const targetKey = isIsolated ? resolveScopedStorageKey(key) : key;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(targetKey);
        if (isIsolated && targetKey !== key) {
          window.localStorage.removeItem(key);
        }
      }
    } catch {
      // Best effort only.
    }
    memoryFallback.delete(targetKey);
    memoryFallback.delete(key);
  },

  key(index: number): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.key(index);
      }
    } catch {
      // Fall through to memory store
    }
    return Array.from(memoryFallback.keys())[index] ?? null;
  },

  get length(): number {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.length;
      }
    } catch {
      // Fall through to memory store
    }
    return memoryFallback.size;
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Best effort only.
    }
    memoryFallback.clear();
  },
};

/**
 * Clears all isolated storage keys belonging to a specific officer user
 * without affecting other users or global application preferences.
 */
export const clearUserStorage = (userId?: string): void => {
  const targetId = userId || getStorageActiveUser();
  if (!targetId) return;

  const prefix = `usr_${targetId}_`;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Best effort only
    }
  }

  for (const k of Array.from(memoryFallback.keys())) {
    if (k.startsWith(prefix)) {
      memoryFallback.delete(k);
    }
  }
};

/**
 * sessionStorage access that never throws.
 *
 * Guarded against SecurityError in strict privacy / WebView contexts.
 */
export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      window.sessionStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Best effort only.
    }
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.clear();
      }
    } catch {
      // Best effort only.
    }
  },
};
