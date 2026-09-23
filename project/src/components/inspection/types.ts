export type Status = '' | 'yes' | 'no' | 'na';

export type StatusField = { status: Status; remarks: string };

export const emptyStatus = (): StatusField => ({ status: '', remarks: '' });

export function statusLabel(status: Status) {
  return status === 'yes' ? 'Yes' : status === 'no' ? 'No' : status === 'na' ? 'N/A' : '';
}

export function formatDate(value: string) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return y && m && d ? `${d}-${m}-${y}` : value;
}

export function statusText(field: StatusField) {
  const label = statusLabel(field.status);
  return [label, field.remarks.trim()].filter(Boolean).join(' - ') || '-';
}

export const listOrNil = (rows: unknown[], label: string) => (rows.length ? `${rows.length} ${label} (see table below)` : 'Nil');

export const toggleText = (status: Status, rows: unknown[], label: string) =>
  status === 'yes' ? (rows.length ? listOrNil(rows, label) : 'Yes') : status === 'no' ? 'No' : '-';

export type Column<T> = {
  key: keyof T;
  label: string;
  type?: 'text' | 'select' | 'status' | 'computed';
  options?: string[];
  allowOther?: boolean;
  compute?: (row: T) => string;
  dependsOn?: (keyof T)[];
};

export type PdfSubTable = { title: string; head: string[]; body: string[][] };

export interface DraftRecord<T = Record<string, unknown>> {
  id: string;
  name: string;
  savedAt: string;
  form: T;
  v?: number;
}
