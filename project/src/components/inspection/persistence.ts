import type { DraftRecord } from './types';
import { deliverGeneratedFile } from '../../lib/documentActions';

export const INSPECTION_SCHEMA_VERSION = 1;

type VersionedPayload<T> = { v: number; data: T };

function isVersioned(value: unknown): value is VersionedPayload<unknown> {
  return Boolean(value) && typeof value === 'object' && 'v' in (value as object) && 'data' in (value as object);
}

/**
 * Loads the persisted form for an inspection page.
 * Handles both legacy payloads (raw form object) and versioned payloads ({ v, data }).
 * `migrate` may remap legacy field names to the current shape before defaults are applied.
 */
export function loadPersistedForm<T extends object>(
  key: string,
  initial: () => T,
  migrate?: (parsed: Partial<T>) => Partial<T>,
): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return initial();
    const parsed = JSON.parse(raw) as unknown;
    const data = (isVersioned(parsed) ? parsed.data : parsed) as Partial<T>;
    const migrated = migrate ? migrate(data ?? {}) : (data ?? {});
    return { ...initial(), ...migrated };
  } catch {
    return initial();
  }
}

export function savePersistedForm<T>(key: string, form: T): void {
  const payload: VersionedPayload<T> = { v: INSPECTION_SCHEMA_VERSION, data: form };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

/**
 * Loads saved drafts, migrating each draft's form payload to the current shape.
 */
export function loadPersistedDrafts<T extends object>(
  key: string,
  migrate?: (parsed: Partial<T>) => Partial<T>,
): DraftRecord<T>[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const drafts = JSON.parse(raw) as DraftRecord<Partial<T>>[];
    if (!Array.isArray(drafts)) return [];
    return drafts.map((draft) => ({
      ...draft,
      v: draft.v ?? 0,
      form: (migrate ? migrate(draft.form ?? {}) : draft.form) as T,
    }));
  } catch {
    return [];
  }
}

export function persistDraftRecords<T>(key: string, drafts: DraftRecord<T>[]): void {
  const versioned = drafts.map((draft) => ({ ...draft, v: INSPECTION_SCHEMA_VERSION }));
  window.localStorage.setItem(key, JSON.stringify(versioned));
}

export interface DraftsExportFile<T = unknown> {
  kind: 'agronix-inspection-drafts';
  inspection: string;
  version: number;
  exportedAt: string;
  drafts: DraftRecord<T>[];
}

/** Downloads all drafts as a JSON file so they can be backed up or moved between devices. */
export function exportDraftsFile<T>(inspection: string, drafts: DraftRecord<T>[], filename: string): void {
  const payload: DraftsExportFile<T> = {
    kind: 'agronix-inspection-drafts',
    inspection,
    version: INSPECTION_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    drafts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  void deliverGeneratedFile(blob, filename).catch((error) => {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      console.error('Draft export failed:', error);
    }
  });
}

/**
 * Reads a drafts JSON file previously produced by exportDraftsFile.
 * Throws if the file is not a valid drafts export.
 */
export async function importDraftsFile<T>(file: File): Promise<DraftsExportFile<T>> {
  const text = await file.text();
  const parsed = JSON.parse(text) as DraftsExportFile<T>;
  if (parsed?.kind !== 'agronix-inspection-drafts' || !Array.isArray(parsed.drafts)) {
    throw new Error('Not an Agronix drafts export file');
  }
  return parsed;
}
