const memoryFallback = new Map<string, string>();

/**
 * localStorage access that never throws.
 *
 * Raw `localStorage` can throw SecurityError (disabled storage, Safari private
 * mode on some versions) or QuotaExceededError (setItem when full). Every call
 * here is wrapped so a storage failure degrades safely to an in-memory store
 * instead of crashing the page or failing in non-browser/SSR environments.
 */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fall through to memory store
    }
    return memoryFallback.get(key) ?? null;
  },

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Fall through to memory store
    }
    memoryFallback.set(key, value);
    return true;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Best effort only.
    }
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
