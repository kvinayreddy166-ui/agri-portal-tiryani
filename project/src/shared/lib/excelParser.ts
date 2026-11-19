import { supabase } from './supabase';
import { fetchFileBuffer } from './fileBlob';
import {
  normalizeDistrictName,
  TELANGANA_DISTRICT_MANDAL_MAPPING,
} from '../data/telanganaDistrictMandalData';

export interface ParsedDealerRow {
  dealer_name: string;
  ifms_id: string;
  phone_number: string;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  location: string;
  district?: string;
  mandal?: string;
  dealer_category: 'fertilizer' | 'seed' | 'pesticide';
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Converts an instant to the intended IST calendar date. Licence exports store
// IST midnight as ~18:29-18:30 UTC (IST 23:59:5x after truncation), so the
// shifted instant is rounded forward by 30 minutes before taking the date.
function toIstDateString(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS + 30 * 60 * 1000).toISOString().slice(0, 10);
}

function parseDate(value: unknown): string {
  if (!value) return toIstDateString(new Date());
  if (value instanceof Date) return toIstDateString(value);
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const dayFirst = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const excelDate = Number(value);
  if (!Number.isNaN(excelDate) && excelDate > 30000) {
    return toIstDateString(new Date((excelDate - 25569) * 86400 * 1000));
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return toIstDateString(parsed);
  return toIstDateString(new Date());
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
    : parseDate(row.expiry_date || row.valid_until || row.validity || row.licence_expiry_date);

  return {
    dealer_name: String(name).trim(),
    ifms_id: category === 'fertilizer' ? String(row.ifms_id || row.ifms || row.ifmsid || row.dealer_id || '').trim() : '',
    phone_number: String(row.phone_number || row.phone || row.mobile || row.dealer_mobile_no || row.mobile_no || '').replace(/\D/g, '').slice(0, 10),
    license_number: String(row.license_number || row.license || row.licence_number || row.licence || '').trim() || 'N/A',
    issue_date: parseDate(row.issue_date || row.license_issue_date || row.licence_issue_date || row.issued),
    expiry_date: expiry,
    location: String(row.address || row.location || row.village || '').trim() || 'Tiryani',
    district: normalizeDistrictName(String(row.district || row.district_name || row.dist || '').trim()) || undefined,
    mandal: String(row.mandal || row.mandals || '').trim() || undefined,
    dealer_category: category,
  };
}

async function rowsFromFirstHeaderSheet(sheet: any): Promise<Record<string, unknown>[]> {
  const XLSX = await import('xlsx');
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

export interface DealerImportJurisdiction {
  district?: string | null;
  mandal?: string | null;
}

const squashLocationKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

function canonicalMandalInDistrict(mandal: string, district: string): string {
  const key = squashLocationKey(mandal);
  if (!key) return '';
  const list = TELANGANA_DISTRICT_MANDAL_MAPPING[normalizeDistrictName(district)] ?? [];
  return list.find((m) => squashLocationKey(m) === key) || mandal.trim();
}

function resolveDealerDistrict(dealer: ParsedDealerRow): string {
  const direct = normalizeDistrictName(dealer.district);
  if (direct) return direct;
  const key = squashLocationKey(dealer.mandal || '');
  if (!key) return '';
  for (const [district, mandals] of Object.entries(TELANGANA_DISTRICT_MANDAL_MAPPING)) {
    if (mandals.some((m) => squashLocationKey(m) === key)) {
      return normalizeDistrictName(district);
    }
  }
  return '';
}

export async function parseExcelAndImportDealers(
  file: File,
  category: ParsedDealerRow['dealer_category'] = 'fertilizer',
  attribution: { created_by?: string | null; created_by_name?: string | null } = {},
  jurisdiction?: DealerImportJurisdiction | null
): Promise<{ imported: number; updated: number; errors: string[] }> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = await rowsFromFirstHeaderSheet(sheet);

  const dealers: ParsedDealerRow[] = [];
  const errors: string[] = [];

  for (const rawRow of raw) {
    const normalized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rawRow)) {
      normalized[normalizeHeader(key)] = val;
    }
    const dealer = rowToDealer(normalized, category);
    if (!dealer) continue;
    if (!/^\d{10}$/.test(dealer.phone_number)) {
      errors.push(`Skipped "${dealer.dealer_name}": phone number must be exactly 10 digits.`);
      continue;
    }
    dealers.push(dealer);
  }

  if (dealers.length === 0) {
    return { imported: 0, updated: 0, errors: ['No valid dealer rows found in the spreadsheet.'] };
  }

  // Officers may only import dealers inside their own mandal/district
  // jurisdiction; admin imports (no jurisdiction) keep every row.
  const jurDistrict = normalizeDistrictName(jurisdiction?.district);
  const jurMandalKey = squashLocationKey(jurisdiction?.mandal || '');
  let importable = dealers;
  if (jurDistrict || jurMandalKey) {
    importable = [];
    let outsideJurisdiction = 0;
    for (const dealer of dealers) {
      const rowDistrict = resolveDealerDistrict(dealer);
      const rowMandal = dealer.mandal?.trim() || '';
      const rowMandalCanon = rowMandal
        ? canonicalMandalInDistrict(rowMandal, rowDistrict || jurDistrict)
        : '';
      const districtOk = !jurDistrict || squashLocationKey(rowDistrict) === squashLocationKey(jurDistrict);
      const mandalOk = !jurMandalKey || squashLocationKey(rowMandalCanon) === jurMandalKey;
      if (districtOk && mandalOk) {
        if (rowDistrict) dealer.district = rowDistrict;
        if (rowMandalCanon) dealer.mandal = rowMandalCanon;
        importable.push(dealer);
      } else {
        outsideJurisdiction += 1;
      }
    }
    if (outsideJurisdiction > 0) {
      errors.push(
        `${outsideJurisdiction} row(s) skipped — outside your jurisdiction (${[jurisdiction?.mandal, jurDistrict].filter(Boolean).join(', ')}).`
      );
    }
    if (importable.length === 0) {
      return { imported: 0, updated: 0, errors };
    }
  }

  const { data: existing } = await supabase
    .from('dealers')
    .select('id, license_number, ifms_id')
    .eq('dealer_category', category);

  const idByIfms = new Map<string, string>();
  const idByLicense = new Map<string, string>();
  for (const dealer of existing || []) {
    const ifms = String(dealer.ifms_id ?? '').trim();
    const license = String(dealer.license_number ?? '').trim();
    if (ifms) idByIfms.set(ifms, dealer.id);
    if (license && license !== 'N/A') idByLicense.set(license, dealer.id);
  }

  const licenseKeyOf = (dealer: ParsedDealerRow) =>
    dealer.license_number && dealer.license_number !== 'N/A' ? dealer.license_number : '';

  // Collapse duplicate keys inside the file itself (last row wins) so the
  // same IFMS ID / license never produces two inserts.
  const pending: ParsedDealerRow[] = [];
  const pendingByIfms = new Map<string, number>();
  const pendingByLicense = new Map<string, number>();
  const unmapPending = (row: ParsedDealerRow, idx: number) => {
    if (row.ifms_id && pendingByIfms.get(row.ifms_id) === idx) pendingByIfms.delete(row.ifms_id);
    const lic = licenseKeyOf(row);
    if (lic && pendingByLicense.get(lic) === idx) pendingByLicense.delete(lic);
  };
  for (const dealer of importable) {
    const ifmsIdx = dealer.ifms_id ? pendingByIfms.get(dealer.ifms_id) : undefined;
    const licIdx = licenseKeyOf(dealer) ? pendingByLicense.get(licenseKeyOf(dealer)) : undefined;
    const hitIdx = ifmsIdx !== undefined ? ifmsIdx : licIdx;
    if (hitIdx !== undefined) {
      unmapPending(pending[hitIdx], hitIdx);
      pending[hitIdx] = dealer;
    } else {
      const idx = pending.length;
      pending.push(dealer);
      if (dealer.ifms_id) pendingByIfms.set(dealer.ifms_id, idx);
      const lic = licenseKeyOf(dealer);
      if (lic) pendingByLicense.set(lic, idx);
    }
  }

  // Rows matching an existing IFMS ID or license update that dealer
  // instead of creating a duplicate; the rest are inserted.
  const toInsert: ParsedDealerRow[] = [];
  const toUpdate = new Map<string, ParsedDealerRow>();
  for (const dealer of pending) {
    const existingId =
      (dealer.ifms_id && idByIfms.get(dealer.ifms_id)) ||
      (licenseKeyOf(dealer) && idByLicense.get(licenseKeyOf(dealer))) ||
      null;
    if (existingId) {
      toUpdate.set(existingId, dealer);
    } else {
      toInsert.push(dealer);
    }
  }

  if (toInsert.length === 0 && toUpdate.size === 0) {
    return { imported: 0, updated: 0, errors: ['All dealer rows already exist.'] };
  }

  let updated = 0;
  const updateEntries = [...toUpdate.entries()];
  for (let i = 0; i < updateEntries.length; i += 100) {
    const chunk = updateEntries.slice(i, i + 100);
    const results = await Promise.all(
      chunk.map(([id, dealer]) =>
        supabase
          .from('dealers')
          .update({
            dealer_name: dealer.dealer_name,
            ifms_id: dealer.ifms_id,
            phone_number: dealer.phone_number,
            license_number: dealer.license_number,
            issue_date: dealer.issue_date,
            expiry_date: dealer.expiry_date,
            location: dealer.location,
            ...(dealer.district !== undefined ? { district: dealer.district } : {}),
            ...(dealer.mandal !== undefined ? { mandal: dealer.mandal } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      )
    );
    for (const { error } of results) {
      if (error) errors.push(error.message);
      else updated += 1;
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('dealers').insert(
      toInsert.map((dealer) => ({
        ...dealer,
        created_by: attribution.created_by ?? null,
        created_by_name: attribution.created_by_name ?? null,
      }))
    );
    if (error) {
      errors.push(error.message);
      return { imported: 0, updated, errors };
    }
  }

  return { imported: toInsert.length, updated, errors };
}

export interface ExcelPreviewData {
  sheetName: string;
  headers: string[];
  rows: string[][];
}

async function parseExcelBuffer(buffer: ArrayBuffer, maxRows = 50): Promise<ExcelPreviewData> {
  const XLSX = await import('xlsx');
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

export async function readExcelPreview(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }).slice(0, 5);
}

export async function fetchExcelPreviewFromUrl(
  fileUrl: string,
  fileName?: string,
  maxRows = 50
): Promise<ExcelPreviewData> {
  const buffer = await fetchFileBuffer(fileUrl, fileName);
  return parseExcelBuffer(buffer, maxRows);
}
