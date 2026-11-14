/**
 * Shared helpers for enforcing mandatory fields on statutory sampling forms
 * (fertilizer, seed, pesticide) before preview/download/export.
 */

export function missingRequiredFields(fields: Array<[label: string, value: unknown]>): string[] {
  return fields
    .filter(([, value]) => !String(value ?? '').trim())
    .map(([label]) => label);
}

export function requiredFieldsErrorMessage(missing: string[]): string {
  return `Please fill the required fields before previewing or downloading: ${missing.join(', ')}.`;
}

export interface CoveringLetterFieldSpec {
  /** Single field key on the queue item. */
  key?: string;
  /** Alternative: at least one of these keys must be non-empty. */
  anyOf?: string[];
  label: string;
  requiredWhen?: (item: Record<string, unknown>) => boolean;
}

/**
 * Validates every row of a covering-letter sample queue. Returns a map of
 * row index -> error message (missing field labels and duplicate sample codes).
 */
export function validateCoveringLetterQueue(
  queue: Array<Record<string, unknown>>,
  fields: CoveringLetterFieldSpec[]
): Record<number, string> {
  const errors: Record<number, string> = {};
  const seenCodes = new Set<string>();

  queue.forEach((item, index) => {
    const problems: string[] = [];
    for (const field of fields) {
      if (field.requiredWhen && !field.requiredWhen(item)) continue;
      const keys = field.anyOf ?? (field.key ? [field.key] : []);
      const filled = keys.some((k) => String(item[k] ?? '').trim());
      if (!filled) problems.push(field.label);
    }
    const code = String(item.sampleCode ?? '').trim();
    if (code) {
      if (seenCodes.has(code)) problems.push('Duplicate Sample Code');
      else seenCodes.add(code);
    }
    if (problems.length) errors[index] = problems.join(', ');
  });

  return errors;
}

/** Letter-head fields that must be filled before a covering letter is generated. */
export function missingCoveringLetterMetadata(metadata: Record<string, unknown>): string[] {
  return missingRequiredFields([
    ['LETTER NUMBER', metadata.letterNumber],
    ['LETTER DATE', metadata.letterDate],
    ['DAO MEMO NO.', metadata.daoMemoNumber],
    ['MEMO DATE', metadata.daoMemoDate],
  ]);
}

export interface RequiredFieldRef {
  label: string;
  value: unknown;
  /** `data-field-key` of the input to scroll to when this field is missing. */
  focusKey?: string;
}

export function missingRequiredFieldRefs(refs: RequiredFieldRef[]): RequiredFieldRef[] {
  return refs.filter((ref) => !String(ref.value ?? '').trim());
}

/** Letter-detail refs with focus keys matching the modal inputs. */
export function coveringLetterMetadataRefs(metadata: Record<string, unknown>): RequiredFieldRef[] {
  return [
    { label: 'LETTER NUMBER', value: metadata.letterNumber, focusKey: 'letterNumber' },
    { label: 'LETTER DATE', value: metadata.letterDate, focusKey: 'letterDate' },
    { label: 'DAO MEMO NO.', value: metadata.daoMemoNumber, focusKey: 'daoMemoNumber' },
    { label: 'MEMO DATE', value: metadata.daoMemoDate, focusKey: 'daoMemoDate' },
  ];
}

/** Scrolls to the element marked with `data-field-key` and flashes a highlight. */
export function revealField(fieldKey: string): void {
  if (typeof document === 'undefined') return;
  const el = document.querySelector(`[data-field-key="${fieldKey}"]`);
  if (!(el instanceof HTMLElement)) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.transition = 'box-shadow 0.3s ease';
  el.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.75)';
  el.style.borderRadius = '0.5rem';
  window.setTimeout(() => {
    el.style.boxShadow = '';
    el.style.transition = '';
  }, 2600);
  el.querySelector<HTMLElement>('input, select, textarea, button')?.focus({ preventScroll: true });
}

/** Reveals the input for the first missing required field. */
export function revealFirstMissingField(refs: RequiredFieldRef[]): void {
  const first = refs.find((ref) => ref.focusKey);
  if (first?.focusKey) revealField(first.focusKey);
}
