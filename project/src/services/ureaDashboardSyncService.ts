import { supabase } from '../lib/supabase';

export type UreaReportType =
  | 'farmer_booking'
  | 'village_booking'
  | 'dealer_stock'
  | 'dealer_sales'
  | 'pending_farmers'
  | 'nds_non_ppb'
  | 'daily_booking'
  | 'mandal_summary'
  | 'detected';

export type UreaFilters = {
  reportType?: UreaReportType;
  village?: string;
  farmerName?: string;
  mobileNumber?: string;
  aadhaar?: string;
  ppbNumber?: string;
  dealerName?: string;
  dateFrom?: string;
  dateTo?: string;
  bookingStatus?: string;
  search?: string;
};

export type UreaSyncLog = {
  id: string;
  sync_started_at: string | null;
  sync_completed_at: string | null;
  status: string | null;
  total_reports: number;
  total_records: number;
  failed_records: number;
  error_message: string | null;
  created_at: string;
};

export type UreaFarmerBooking = {
  id?: string;
  farmer_name: string | null;
  father_name: string | null;
  village: string | null;
  mandal: string | null;
  mobile_number: string | null;
  aadhaar_number: string | null;
  ppb_number: string | null;
  survey_number: string | null;
  extent: number | null;
  crop: string | null;
  urea_required: number | null;
  urea_booked: number | null;
  urea_supplied: number | null;
  pending_quantity: number | null;
  dealer_name: string | null;
  booking_date: string | null;
  supply_date: string | null;
  booking_status: string | null;
  raw_payload?: Record<string, unknown> | null;
};

export type UreaDealerStock = {
  id?: string;
  dealer_name: string | null;
  firm_name: string | null;
  ifms_id: string | null;
  village: string | null;
  mandal: string | null;
  opening_stock: number | null;
  receipts: number | null;
  sales: number | null;
  closing_stock: number | null;
  stock_date: string | null;
  raw_payload?: Record<string, unknown> | null;
};

export type UreaSummary = {
  totalFarmersBooked: number;
  totalUreaBooked: number;
  totalSupplied: number;
  pendingQuantity: number;
  dealerWiseStock: { name: string; stock: number }[];
  villageWiseBookings: { name: string; booked: number; farmers: number }[];
  dailyBookingTrend: { name: string; booked: number }[];
  pendingVsSupplied: { name: string; quantity: number }[];
};

const FARMER_COLUMNS = 'id, farmer_name, father_name, village, mandal, mobile_number, aadhaar_number, ppb_number, survey_number, extent, crop, urea_required, urea_booked, urea_supplied, pending_quantity, dealer_name, booking_date, supply_date, booking_status, raw_payload';
const STOCK_COLUMNS = 'id, dealer_name, firm_name, ifms_id, village, mandal, opening_stock, receipts, sales, closing_stock, stock_date, raw_payload';

export async function syncUreaReports() {
  const { data, error } = await supabase.functions.invoke('sync-urea-dashboard-reports', {
    body: { mandal: 'Tiryani' },
  });
  if (error) throw new Error(error.message || 'Urea dashboard sync failed.');
  if (data?.error) throw new Error(data.error);
  return data as { status: string; total_reports: number; total_records: number; failed_records: number };
}

export async function getUreaSyncLogs(limit = 10) {
  const { data, error } = await supabase
    .from('external_urea_sync_logs')
    .select('id, sync_started_at, sync_completed_at, status, total_reports, total_records, failed_records, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as UreaSyncLog[];
}

export async function getUreaFarmerBookings(filters: UreaFilters = {}, limit = 500) {
  let query = supabase
    .from('urea_farmer_bookings')
    .select(FARMER_COLUMNS)
    .order('booking_date', { ascending: false })
    .limit(limit);
  query = applyFarmerFilters(query, filters);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as UreaFarmerBooking[];
}

export async function getUreaDealerStock(filters: UreaFilters = {}, limit = 500) {
  let query = supabase
    .from('urea_dealer_stock')
    .select(STOCK_COLUMNS)
    .order('stock_date', { ascending: false })
    .limit(limit);
  query = applyStockFilters(query, filters);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as UreaDealerStock[];
}

export async function exportUreaReportExcel(
  bookings: UreaFarmerBooking[],
  stocks: UreaDealerStock[],
  filters: UreaFilters
) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const summary = buildUreaSummary(bookings, stocks);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['Department of Agriculture'],
    ['Mandal Agriculture Officer, Tiryani'],
    ['Generated On', new Date().toLocaleString('en-IN')],
    ['Applied Filters', formatFilters(filters)],
    [],
    ['Total farmers booked', summary.totalFarmersBooked],
    ['Total urea quantity booked', summary.totalUreaBooked],
    ['Total supplied', summary.totalSupplied],
    ['Pending quantity', summary.pendingQuantity],
  ]), 'Summary');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(bookings), 'Farmer-wise bookings');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary.villageWiseBookings), 'Village summary');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stocks), 'Dealer-wise stock');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(bookings.filter((row) => Number(row.pending_quantity || 0) > 0)), 'Pending farmers');
  XLSX.writeFile(workbook, `urea_dashboard_reports_${dateStamp()}.xlsx`);
}

export async function exportUreaReportPDF(
  bookings: UreaFarmerBooking[],
  stocks: UreaDealerStock[],
  filters: UreaFilters
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const summary = buildUreaSummary(bookings, stocks);
  let y = 16;
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.text('Department of Agriculture', 105, y, { align: 'center' });
  y += 7;
  doc.setFontSize(12);
  doc.text('Mandal Agriculture Officer, Tiryani', 105, y, { align: 'center' });
  y += 10;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, y);
  y += 6;
  doc.text(`Filters: ${formatFilters(filters)}`, 14, y);
  y += 9;
  const summaryRows = [
    ['Total farmers booked', summary.totalFarmersBooked],
    ['Total urea quantity booked', summary.totalUreaBooked],
    ['Total supplied', summary.totalSupplied],
    ['Pending quantity', summary.pendingQuantity],
  ];
  summaryRows.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, y);
    y += 6;
  });
  y += 4;
  doc.setFont('times', 'bold');
  doc.text('Detailed Farmer-wise Report', 14, y);
  y += 7;
  doc.setFont('times', 'normal');
  bookings.slice(0, 34).forEach((row, index) => {
    if (y > 282) {
      doc.addPage();
      y = 16;
    }
    doc.text(
      `${index + 1}. ${row.farmer_name || '-'} | ${row.village || '-'} | ${row.dealer_name || '-'} | Booked ${row.urea_booked || 0} | Pending ${row.pending_quantity || 0}`,
      14,
      y,
      { maxWidth: 182 }
    );
    y += 6;
  });
  if (stocks.length) {
    doc.addPage();
    y = 16;
    doc.setFont('times', 'bold');
    doc.text('Dealer-wise Stock', 14, y);
    y += 7;
    doc.setFont('times', 'normal');
    stocks.slice(0, 38).forEach((row, index) => {
      doc.text(`${index + 1}. ${row.dealer_name || row.firm_name || '-'} | Closing stock ${row.closing_stock || 0}`, 14, y);
      y += 6;
    });
  }
  doc.save(`urea_dashboard_reports_${dateStamp()}.pdf`);
}

export async function parseUreaUploadFile(file: File) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '', raw: false });
  return rows;
}

export async function importManualUreaRows(reportType: UreaReportType, rows: Record<string, unknown>[]) {
  const normalizedBookings = rows.map(normalizeUploadedFarmerRow).filter((row) => isTiryani(row));
  const normalizedStock = rows.map(normalizeUploadedStockRow).filter((row) => isTiryani(row));
  const useStock = reportType === 'dealer_stock' || reportType === 'dealer_sales';
  const payload = useStock ? normalizedStock : normalizedBookings;
  if (!payload.length) {
    return { imported: 0, failed: rows.length, errors: ['No Tiryani Mandal rows detected.'] };
  }
  const { error } = useStock
    ? await supabase.from('urea_dealer_stock').upsert(payload, { onConflict: 'dedupe_key' })
    : await supabase.from('urea_farmer_bookings').upsert(payload, { onConflict: 'dedupe_key' });
  if (error) throw error;
  await supabase.from('external_urea_reports').insert({
    report_type: reportType,
    report_name: `Manual upload - ${reportType}`,
    mandal: 'Tiryani',
    raw_payload: { imported: payload.length, source_rows: rows.length },
  });
  return { imported: payload.length, failed: rows.length - payload.length, errors: [] as string[] };
}

export function buildUreaSummary(bookings: UreaFarmerBooking[], stocks: UreaDealerStock[]): UreaSummary {
  const uniqueFarmers = new Set(bookings.map((row) => [row.aadhaar_number, row.ppb_number, row.mobile_number, row.farmer_name, row.village].filter(Boolean).join('|')));
  const totalUreaBooked = sum(bookings.map((row) => row.urea_booked));
  const totalSupplied = sum(bookings.map((row) => row.urea_supplied));
  const pendingQuantity = sum(bookings.map((row) => row.pending_quantity));
  const dealerWiseStock = mapSum(stocks, (row) => row.dealer_name || row.firm_name || 'Unknown dealer', (row) => row.closing_stock);
  const villageBooked = mapSum(bookings, (row) => row.village || 'Unknown village', (row) => row.urea_booked);
  const villageFarmers = new Map<string, Set<string>>();
  bookings.forEach((row) => {
    const village = row.village || 'Unknown village';
    const set = villageFarmers.get(village) || new Set<string>();
    set.add(row.aadhaar_number || row.ppb_number || row.mobile_number || row.farmer_name || Math.random().toString());
    villageFarmers.set(village, set);
  });
  const dailyBookingTrend = mapSum(bookings, (row) => row.booking_date || 'No date', (row) => row.urea_booked);
  return {
    totalFarmersBooked: uniqueFarmers.size,
    totalUreaBooked,
    totalSupplied,
    pendingQuantity,
    dealerWiseStock: dealerWiseStock.map((item) => ({ name: item.name, stock: item.value })),
    villageWiseBookings: villageBooked.map((item) => ({ name: item.name, booked: item.value, farmers: villageFarmers.get(item.name)?.size || 0 })),
    dailyBookingTrend: dailyBookingTrend.map((item) => ({ name: item.name, booked: item.value })),
    pendingVsSupplied: [
      { name: 'Supplied', quantity: totalSupplied },
      { name: 'Pending', quantity: pendingQuantity },
    ],
  };
}

function applyFarmerFilters(query: ReturnType<typeof supabase.from> extends never ? never : any, filters: UreaFilters) {
  let next = query.eq('mandal', 'Tiryani');
  if (filters.village) next = next.eq('village', filters.village);
  if (filters.farmerName) next = next.ilike('farmer_name', `%${filters.farmerName}%`);
  if (filters.mobileNumber) next = next.ilike('mobile_number', `%${onlyDigits(filters.mobileNumber)}%`);
  if (filters.aadhaar) next = next.ilike('aadhaar_number', `%${onlyDigits(filters.aadhaar)}%`);
  if (filters.ppbNumber) next = next.ilike('ppb_number', `%${filters.ppbNumber}%`);
  if (filters.dealerName) next = next.ilike('dealer_name', `%${filters.dealerName}%`);
  if (filters.bookingStatus) next = next.eq('booking_status', filters.bookingStatus);
  if (filters.dateFrom) next = next.gte('booking_date', filters.dateFrom);
  if (filters.dateTo) next = next.lte('booking_date', filters.dateTo);
  if (filters.search) {
    const search = filters.search.replace(/[,()]/g, ' ');
    next = next.or(`farmer_name.ilike.%${search}%,mobile_number.ilike.%${onlyDigits(search)}%,aadhaar_number.ilike.%${onlyDigits(search)}%,ppb_number.ilike.%${search}%,village.ilike.%${search}%`);
  }
  return next;
}

function applyStockFilters(query: ReturnType<typeof supabase.from> extends never ? never : any, filters: UreaFilters) {
  let next = query.eq('mandal', 'Tiryani');
  if (filters.village) next = next.eq('village', filters.village);
  if (filters.dealerName) next = next.ilike('dealer_name', `%${filters.dealerName}%`);
  if (filters.dateFrom) next = next.gte('stock_date', filters.dateFrom);
  if (filters.dateTo) next = next.lte('stock_date', filters.dateTo);
  if (filters.search) {
    const search = filters.search.replace(/[,()]/g, ' ');
    next = next.or(`dealer_name.ilike.%${search}%,firm_name.ilike.%${search}%,ifms_id.ilike.%${search}%,village.ilike.%${search}%`);
  }
  return next;
}

function normalizeUploadedFarmerRow(row: Record<string, unknown>): Omit<UreaFarmerBooking, 'id'> {
  const booked = numberValue(pick(row, ['urea booked', 'booked', 'urea qty', 'quantity booked']));
  const supplied = numberValue(pick(row, ['urea supplied', 'supplied', 'delivered']));
  return {
    farmer_name: text(pick(row, ['farmer name', 'farmer', 'name'])),
    father_name: text(pick(row, ['father name', 'father', 'father/husband'])),
    village: text(pick(row, ['village', 'village name'])),
    mandal: text(pick(row, ['mandal', 'mandal name'])) || 'Tiryani',
    mobile_number: onlyDigits(pick(row, ['mobile', 'mobile number', 'phone'])),
    aadhaar_number: onlyDigits(pick(row, ['aadhaar', 'aadhaar number', 'aadhar'])),
    ppb_number: text(pick(row, ['ppb', 'ppb number', 'passbook'])),
    survey_number: text(pick(row, ['survey', 'survey no', 'survey number'])),
    extent: numberValue(pick(row, ['extent', 'area', 'acres'])),
    crop: text(pick(row, ['crop', 'crop name'])),
    urea_required: numberValue(pick(row, ['urea required', 'required'])),
    urea_booked: booked,
    urea_supplied: supplied,
    pending_quantity: numberValue(pick(row, ['pending', 'pending quantity'])) || Math.max(booked - supplied, 0),
    dealer_name: text(pick(row, ['dealer', 'dealer name', 'firm name'])),
    booking_date: dateValue(pick(row, ['booking date', 'date', 'report date'])),
    supply_date: dateValue(pick(row, ['supply date', 'supplied date'])),
    booking_status: text(pick(row, ['status', 'booking status'])) || (booked > supplied ? 'Pending' : 'Supplied'),
    raw_payload: row,
  };
}

function normalizeUploadedStockRow(row: Record<string, unknown>): Omit<UreaDealerStock, 'id'> {
  return {
    dealer_name: text(pick(row, ['dealer', 'dealer name'])),
    firm_name: text(pick(row, ['firm', 'firm name'])),
    ifms_id: text(pick(row, ['ifms', 'ifms id', 'license no'])),
    village: text(pick(row, ['village', 'village name'])),
    mandal: text(pick(row, ['mandal', 'mandal name'])) || 'Tiryani',
    opening_stock: numberValue(pick(row, ['opening stock', 'opening'])),
    receipts: numberValue(pick(row, ['receipts', 'receipt', 'received'])),
    sales: numberValue(pick(row, ['sales', 'sale', 'supplied'])),
    closing_stock: numberValue(pick(row, ['closing stock', 'closing', 'balance'])),
    stock_date: dateValue(pick(row, ['stock date', 'date', 'report date'])),
    raw_payload: row,
  };
}

function pick(row: Record<string, unknown>, keys: string[]) {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]));
  for (const key of keys) {
    const value = normalized.get(normalizeKey(key));
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return '';
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function text(value: unknown) {
  return String(value ?? '').trim() || null;
}

function onlyDigits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)?.[0] || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value: unknown) {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function isTiryani(row: { mandal: string | null; village: string | null }) {
  return `${row.mandal || ''} ${row.village || ''}`.toLowerCase().includes('tiryani');
}

function sum(values: (number | null | undefined)[]): number {
  return values.reduce<number>((total, value) => total + Number(value || 0), 0);
}

function mapSum<T>(rows: T[], keyFn: (row: T) => string, valueFn: (row: T) => number | null | undefined) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const key = keyFn(row);
    map.set(key, (map.get(key) || 0) + Number(valueFn(row) || 0));
  });
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function formatFilters(filters: UreaFilters) {
  const entries = Object.entries(filters).filter(([, value]) => value);
  return entries.length ? entries.map(([key, value]) => `${key}: ${value}`).join(', ') : 'All Tiryani Mandal records';
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}
