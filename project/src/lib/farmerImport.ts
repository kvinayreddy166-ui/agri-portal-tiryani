import * as XLSX from 'xlsx';

export type FarmerImportRow = {
  s_no: number;
  farmer_name_english: string;
  farmer_name_telugu: string;
  father_or_husband_name_english: string;
  father_or_husband_name_telugu: string;
  aadhaar_no: string;
  aadhaar_last4: string;
  ppb_no: string;
  survey_no: string;
  extent: number;
  crop: string;
  village_english: string;
  village_telugu: string;
  phone_number: string;
  remarks: string;
  search_text: string;
  identity_key: string;
  row_hash: string;
};

type RawRow = Record<string, unknown>;
type RawArrayRow = unknown[];

export async function parseFarmerWorkbook(file: File): Promise<FarmerImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const englishRows = sheetRows(workbook, workbook.SheetNames[0]);
  const teluguRows = workbook.SheetNames[1] ? sheetArrayRows(workbook, workbook.SheetNames[1]) : [];
  const teluguBySerial = new Map(teluguRows.map((row) => [normalText(row[0]), row]));
  const seen = new Set<string>();
  const parsed: FarmerImportRow[] = [];

  englishRows.forEach((row, index) => {
    const sNo = numberValue(row['S.No']) || index + 1;
    const telugu = teluguBySerial.get(String(sNo)) || teluguRows[index] || {};
    const item = buildFarmerImportRow(row, telugu, sNo);
    if (seen.has(item.row_hash)) return;
    seen.add(item.row_hash);
    parsed.push(item);
  });

  return parsed;
}

export function farmerTemplateRows() {
  return [
    {
      s_no: 1,
      farmer_name_english: 'Sample Farmer',
      farmer_name_telugu: '',
      father_or_husband_name_english: 'Sample Father',
      father_or_husband_name_telugu: '',
      aadhaar_no: '000000000000',
      aadhaar_last4: '0000',
      ppb_no: 'T00000000000',
      survey_no: '123/A',
      extent: 1.25,
      crop: 'Paddy',
      village_english: 'Sample Village',
      village_telugu: '',
      phone_number: '9999999999',
      remarks: '',
    },
  ];
}

export function normalizeDigits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

export function normalText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function searchableText(value: unknown) {
  return normalText(value).toLowerCase();
}

export function farmerIdentityKey(row: {
  ppb_no?: string;
  aadhaar_no?: string;
  phone_number?: string;
  farmer_name_english?: string;
  father_or_husband_name_english?: string;
  village_english?: string;
}) {
  if (row.ppb_no) return `ppb:${normalizeCode(row.ppb_no)}`;
  if (row.aadhaar_no) return `aadhaar:${normalizeDigits(row.aadhaar_no)}`;
  if (row.phone_number) return `phone:${normalizeDigits(row.phone_number)}`;
  return `name:${searchableText(row.farmer_name_english)}:${searchableText(row.father_or_husband_name_english)}:${searchableText(row.village_english)}`;
}

export function maskAadhaar(value: string) {
  const digits = normalizeDigits(value);
  if (!digits) return '';
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function buildFarmerImportRow(row: RawRow, telugu: RawArrayRow, sNo: number): FarmerImportRow {
  const base = {
    s_no: sNo,
    farmer_name_english: normalText(row['Farmer Name']),
    farmer_name_telugu: normalText(telugu[1]),
    father_or_husband_name_english: normalText(row['Father/Husband Name']),
    father_or_husband_name_telugu: normalText(telugu[2]),
    aadhaar_no: normalizeDigits(row['Aadhaar No']),
    aadhaar_last4: normalizeDigits(row['Aadhaar No']).slice(-4),
    ppb_no: normalizeCode(row['PPB No']),
    survey_no: normalizeCode(row['Survey No']),
    extent: numberValue(row['Extent']),
    crop: normalText(row['Crop']),
    village_english: normalText(row['Village']),
    village_telugu: normalText(telugu[8]),
    phone_number: normalizeDigits(row['Phone Number']),
    remarks: '',
  };
  const search_text = [
    base.farmer_name_english,
    base.farmer_name_telugu,
    base.father_or_husband_name_english,
    base.father_or_husband_name_telugu,
    base.aadhaar_no,
    base.ppb_no,
    base.survey_no,
    base.crop,
    base.village_english,
    base.village_telugu,
    base.phone_number,
  ].map(searchableText).join(' ');
  const identity_key = farmerIdentityKey(base);
  const row_hash = [
    identity_key,
    base.survey_no,
    searchableText(base.crop),
    base.extent,
  ].join('|');
  return { ...base, search_text, identity_key, row_hash };
}

function sheetRows(workbook: XLSX.WorkBook, sheetName: string): RawRow[] {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];
  return XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: '', raw: false });
}

function sheetArrayRows(workbook: XLSX.WorkBook, sheetName: string): RawArrayRow[] {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];
  return XLSX.utils.sheet_to_json<RawArrayRow>(worksheet, { header: 1, defval: '', raw: false }).slice(1);
}

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}
