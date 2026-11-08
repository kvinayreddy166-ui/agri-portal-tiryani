import { safeStorage } from '../../../shared/lib/safeStorage';
import { OfficerCloudSyncService } from '../../officers-toolkit/services/officerCloudSyncService';
import type { StatutoryCommodity } from '../../auth/types/officerAuth';

// Single source of truth for the covering-letter sample queues.
// NOTE: keep keys in sync with OFFICER_LOCAL_STORAGE_KEYS.SAMPLES in
// officers-toolkit/services/officerCloudSyncService.ts — the tracker and
// records hub read the same keys.
export const COVERING_LETTER_QUEUE_KEYS: Record<StatutoryCommodity, string> = {
  fertilizer: 'tiryani-covering-letter-queue',
  pesticide: 'tiryani-pesticide-covering-letter-queue',
  seed: 'tiryani-seed-covering-letter-queue',
};

export type CoveringLetterQueueItem = Record<string, unknown> & { sampleCode: string };

export type CoveringLetterUpsertResult = 'added' | 'updated' | 'unchanged';

// Fields compared to detect whether a re-download changed the queued sample.
// Tracker-written fields (labStatus, dispatchedAt, ...) are intentionally excluded.
const TRACKED_FIELDS: Record<StatutoryCommodity, string[]> = {
  fertilizer: ['fertilizerName', 'quantity', 'dateOfSampling', 'firmName'],
  pesticide: ['tradeName', 'technicalName', 'activeIngredient', 'formulationType', 'dateOfSampling', 'firmName'],
  seed: ['seedName', 'variety', 'quantity', 'dateOfSampling', 'isCotton', 'firmName'],
};

function notifyQueueChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('local-storage-update'));
  }
}

export function readCoveringLetterQueue(commodity: StatutoryCommodity): CoveringLetterQueueItem[] {
  try {
    const raw = safeStorage.getItem(COVERING_LETTER_QUEUE_KEYS[commodity]);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CoveringLetterQueueItem[]) : [];
  } catch {
    return [];
  }
}

function writeCoveringLetterQueue(commodity: StatutoryCommodity, items: CoveringLetterQueueItem[]) {
  safeStorage.setItem(COVERING_LETTER_QUEUE_KEYS[commodity], JSON.stringify(items));
  notifyQueueChanged();
}

/**
 * Upserts a sample into the commodity's covering-letter queue (deduped by
 * sampleCode) and syncs it to the officer_samples cloud table so the record
 * exists as soon as the forms are downloaded — not only at letter preview.
 */
export function upsertCoveringLetterSample(
  commodity: StatutoryCommodity,
  item: CoveringLetterQueueItem
): CoveringLetterUpsertResult {
  const sampleCode = String(item.sampleCode || '').trim();
  if (!sampleCode) return 'unchanged';

  const queue = readCoveringLetterQueue(commodity);
  const normalized: CoveringLetterQueueItem = { ...item, sampleCode };
  const existingIndex = queue.findIndex((entry) => String(entry.sampleCode || '').trim() === sampleCode);

  let result: CoveringLetterUpsertResult;
  if (existingIndex === -1) {
    queue.push(normalized);
    result = 'added';
  } else {
    const existing = queue[existingIndex];
    const hasChanged = TRACKED_FIELDS[commodity].some(
      (field) => String(existing[field] ?? '') !== String(normalized[field] ?? '')
    );
    if (!hasChanged) {
      result = 'unchanged';
    } else {
      queue[existingIndex] = normalized;
      result = 'updated';
    }
  }

  if (result !== 'unchanged') {
    writeCoveringLetterQueue(commodity, queue);
  }

  // Register/update the sample record in the cloud (no-op when offline).
  void OfficerCloudSyncService.syncSampleMemo(commodity, normalized);

  return result;
}

export function removeCoveringLetterSample(commodity: StatutoryCommodity, sampleCode: string): boolean {
  const queue = readCoveringLetterQueue(commodity);
  const next = queue.filter((entry) => String(entry.sampleCode || '').trim() !== sampleCode.trim());
  if (next.length === queue.length) return false;
  writeCoveringLetterQueue(commodity, next);
  return true;
}
