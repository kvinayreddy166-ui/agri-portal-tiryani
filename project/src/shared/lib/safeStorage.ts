/**
 * localStorage access that never throws.
 *
 * Raw `localStorage` can throw SecurityError (disabled storage, Safari private
 * mode on some versions) or QuotaExceededError (setItem when full). Every call
 * here is wrapped so a storage failure degrades to null/false instead of
 * crashing the page.
 */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Best effort only.
    }
  },

  key(index: number): string | null {
    try {
      return window.localStorage.key(index);
    } catch {
      return null;
    }
  },

  get length(): number {
    try {
      return window.localStorage.length;
    } catch {
      return 0;
    }
  },

  clear(): void {
    try {
      window.localStorage.clear();
    } catch {
      // Best effort only.
    }
  },
};
