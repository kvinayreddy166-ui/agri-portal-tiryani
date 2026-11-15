import { safeStorage } from './safeStorage';

const PINNED_KEY = 'agronix-pinned-modules';
const RECENT_KEY = 'agronix-recent-modules';
const UNPINNED_DEFAULTS_KEY = 'agronix-unpinned-default-modules';
const MAX_RECENTS = 8;

// Modules pinned by default in the All Modules directory. Users can still
// unpin them — the dismissal is remembered separately so defaults don't return.
const DEFAULT_PINNED_MODULES = ['officer-records'];

function readIdList(key: string): string[] {
  try {
    const parsed = JSON.parse(safeStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeIdList(key: string, ids: string[]) {
  safeStorage.setItem(key, JSON.stringify(ids));
}

export function getPinnedModules(): string[] {
  const dismissed = readIdList(UNPINNED_DEFAULTS_KEY);
  const defaults = DEFAULT_PINNED_MODULES.filter((id) => !dismissed.includes(id));
  return [...new Set([...defaults, ...readIdList(PINNED_KEY)])];
}

export function togglePinnedModule(id: string): string[] {
  const stored = readIdList(PINNED_KEY);
  const dismissed = readIdList(UNPINNED_DEFAULTS_KEY);
  const isPinned = getPinnedModules().includes(id);

  if (isPinned) {
    writeIdList(PINNED_KEY, stored.filter((p) => p !== id));
    if (DEFAULT_PINNED_MODULES.includes(id) && !dismissed.includes(id)) {
      writeIdList(UNPINNED_DEFAULTS_KEY, [...dismissed, id]);
    }
  } else {
    writeIdList(PINNED_KEY, [...stored, id]);
    writeIdList(UNPINNED_DEFAULTS_KEY, dismissed.filter((d) => d !== id));
  }
  return getPinnedModules();
}

export function getRecentModules(): string[] {
  return readIdList(RECENT_KEY);
}

export function recordRecentModule(id: string) {
  const recents = getRecentModules().filter((r) => r !== id);
  writeIdList(RECENT_KEY, [id, ...recents].slice(0, MAX_RECENTS));
}
