import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import { fetchFileBuffer } from './fileBlob';

export interface ParsedDealerRow {
  dealer_name: string;
  ifms_id: string;
  phone_number: string;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  location: string;
  dealer_category: 'fertilizer' | 'seed' | 'pesticide';
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseDate(value: unknown): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const dayFirst = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const excelDate = Number(value);
  if (!Number.isNaN(excelDate) && excelDate > 30000) {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().slice(0, 10);
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function rowToDealer(
  row: Record<string, unknown>,
  category: ParsedDealerRow['dealer_category']
): ParsedDealerRow | null {
  const name =
    row.dealer_name || row.name || row.dealer || row['dealer_name'];
  if (!name) return null;

  const isPesticide = category === 'pesticide';
  const expiry = isPesticide
    ? '2099-12-31'
    : parseDate(row.expiry_date || row.valid_until || row.validity);

  return {
    dealer_name: String(name).trim(),
    ifms_id: category === 'fertilizer' ? String(row.ifms_id || row.ifms || row.ifmsid || '').trim() : '',
    phone_number: String(row.phone_number || row.phone || row.mobile || '').trim() || 'N/A',
    license_number: String(row.license_number || row.license || '').trim() || 'N/A',
    issue_date: parseDate(row.issue_date || row.license_issue_date || row.issued),
    expiry_date: expiry,
    location: String(row.location || row.address || row.village || '').trim() || 'Tiryani',
    dealer_category: category,
  };
}

function rowsFromFirstHeaderSheet(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  });
  const headerIndex = grid.findIndex((row) =>
    row.some((cell) => normalizeHeader(String(cell)).includes('dealer'))
  );

  if (headerIndex === -1) {
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  }

  const headers = grid[headerIndex].map((cell) => normalizeHeader(String(cell)));
  return grid.slice(headerIndex + 1).map((row) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (header) record[header] = row[index] ?? '';
    });
    return record;
  });
}

export async function parseExcelAndImportDealers(
  file: File,
  category: ParsedDealerRow['dealer_category'] = 'fertilizer'
): Promise<{ imported: number; errors: string[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = rowsFromFirstHeaderSheet(sheet);

  const dealers: ParsedDealerRow[] = [];
  const errors: string[] = [];

  for (const rawRow of raw) {
    const normalized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rawRow)) {
      normalized[normalizeHeader(key)] = val;
    }
    const dealer = rowToDealer(normalized, category);
    if (dealer) dealers.push(dealer);
  }

  if (dealers.length === 0) {
    return { imported: 0, errors: ['No valid dealer rows found in the spreadsheet.'] };
  }

  const { data: existing } = await supabase
    .from('dealers')
    .select('license_number, ifms_id')
    .eq('dealer_category', category);

  const existingKeys = new Set(
    (existing || []).flatMap((dealer) => [dealer.license_number, dealer.ifms_id].filter(Boolean))
  );
  const newDealers = dealers.filter(
    (dealer) => !existingKeys.has(dealer.license_number) && (!dealer.ifms_id || !existingKeys.has(dealer.ifms_id))
  );

  if (newDealers.length === 0) {
    return { imported: 0, errors: ['All dealer rows already exist.'] };
  }

  const { error } = await supabase.from('dealers').insert(newDealers);
  if (error) {
    errors.push(error.message);
    return { imported: 0, errors };
  }

  return { imported: newDealers.length, errors };
}

export interface ExcelPreviewData {
  sheetName: string;
  headers: string[];
  rows: string[][];
}

function parseExcelBuffer(buffer: ArrayBuffer, maxRows = 50): ExcelPreviewData {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (grid.length === 0) {
    return { sheetName, headers: [], rows: [] };
  }

  const headers = grid[0].map((cell) => String(cell ?? ''));
  const rows = grid.slice(1, maxRows + 1).map((row) => headers.map((_, i) => String(row[i] ?? '')));
  return { sheetName, headers, rows };
}

export function readExcelPreview(file: File): Promise<Record<string, unknown>[]> {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }).slice(0, 5);
  });
}

export async function fetchExcelPreviewFromUrl(
  fileUrl: string,
  fileName?: string,
  maxRows = 50
): Promise<ExcelPreviewData> {
  const buffer = await fetchFileBuffer(fileUrl, fileName);
  return parseExcelBuffer(buffer, maxRows);
}
