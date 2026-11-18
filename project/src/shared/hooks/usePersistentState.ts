import { useEffect, useState } from 'react';
import { safeStorage } from '../lib/safeStorage';

/**
 * useState persisted to safeStorage (JSON-serialized) so page-level UI state
 * such as list filters survives navigation away and back.
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = safeStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      safeStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable — keep in-memory state only
    }
  }, [key, value]);

  return [value, setValue] as const;
}
