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
