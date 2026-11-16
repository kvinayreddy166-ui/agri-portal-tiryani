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

const SKIP_INPUT_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'file', 'checkbox', 'radio', 'image']);

export interface EmptyModuleField {
  element: HTMLElement;
  label: string;
}

function moduleFieldLabel(el: HTMLElement): string {
  const aria = el.getAttribute('aria-label');
  if (aria?.trim()) return aria.trim();
  const placeholder = (el as HTMLInputElement).placeholder;
  if (placeholder?.trim()) return placeholder.trim();
  const fieldKey = el.getAttribute('data-field-key') ?? el.closest('[data-field-key]')?.getAttribute('data-field-key');
  if (fieldKey) return fieldKey;
  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const closestLabel = el.closest('label');
  if (closestLabel?.textContent?.trim()) return closestLabel.textContent.trim();
  return el.tagName.toLowerCase();
}

function isFieldVisible(el: HTMLElement): boolean {
  if (el.closest('[data-validate-skip]')) return false;
  if (el instanceof HTMLInputElement && SKIP_INPUT_TYPES.has(el.type)) return false;
  if ((el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly) return false;
  return el.getClientRects().length > 0;
}

/**
 * Returns every visible, enabled input/select/textarea inside `root` whose
 * value is empty. Covers all fields in a module — including queue-table rows.
 */
export function emptyModuleFields(root: ParentNode = document): EmptyModuleField[] {
  return Array.from(root.querySelectorAll<HTMLElement>('input, select, textarea'))
    .filter(isFieldVisible)
    .filter((el) => !String((el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value ?? '').trim())
    .map((element) => ({ element, label: moduleFieldLabel(element) }));
}

/** Scrolls to and focuses a field element with a brief highlight. */
export function revealElement(el: HTMLElement): void {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.transition = 'box-shadow 0.3s ease';
  el.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.75)';
  el.style.borderRadius = '0.5rem';
  window.setTimeout(() => {
    el.style.boxShadow = '';
    el.style.transition = '';
  }, 2600);
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    el.focus({ preventScroll: true });
  }
}

const INVALID_MARK_CLASS = 'js-fv-invalid';
const INVALID_RING_CLASSES = ['ring-2', 'ring-red-500'] as const;

function clearFieldInvalid(event: Event) {
  const el = event.currentTarget as HTMLElement;
  el.classList.remove(INVALID_MARK_CLASS, ...INVALID_RING_CLASSES);
  el.removeEventListener('input', clearFieldInvalid);
  el.removeEventListener('change', clearFieldInvalid);
}

function clearAllInvalidMarks(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(`.${INVALID_MARK_CLASS}`).forEach((el) => {
    el.classList.remove(INVALID_MARK_CLASS, ...INVALID_RING_CLASSES);
    el.removeEventListener('input', clearFieldInvalid);
    el.removeEventListener('change', clearFieldInvalid);
  });
}

/**
 * Validates that every field in the module is filled. Returns the list of
 * empty fields (empty array = valid). Every empty field is marked with a
 * persistent red ring until the user edits it; when `focusFirst` is true the
 * first empty field is also scrolled to and focused.
 */
export function validateAllModuleFields(root: ParentNode, options: { focusFirst?: boolean } = {}): EmptyModuleField[] {
  clearAllInvalidMarks(root);
  const empty = emptyModuleFields(root);
  empty.forEach(({ element }) => {
    element.classList.add(INVALID_MARK_CLASS, ...INVALID_RING_CLASSES);
    element.addEventListener('input', clearFieldInvalid);
    element.addEventListener('change', clearFieldInvalid);
  });
  if (options.focusFirst !== false && empty.length) revealElement(empty[0].element);
  return empty;
}
