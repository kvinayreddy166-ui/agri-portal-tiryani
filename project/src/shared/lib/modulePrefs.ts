import { safeStorage } from './safeStorage';

const PINNED_KEY = 'agronix-pinned-modules';
const RECENT_KEY = 'agronix-recent-modules';
const MAX_RECENTS = 8;

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
  return readIdList(PINNED_KEY);
}

export function togglePinnedModule(id: string): string[] {
  const pinned = getPinnedModules();
  const next = pinned.includes(id) ? pinned.filter((p) => p !== id) : [...pinned, id];
  writeIdList(PINNED_KEY, next);
  return next;
}

export function getRecentModules(): string[] {
  return readIdList(RECENT_KEY);
}

export function recordRecentModule(id: string) {
  const recents = getRecentModules().filter((r) => r !== id);
  writeIdList(RECENT_KEY, [id, ...recents].slice(0, MAX_RECENTS));
}
