import { FERTILIZER_TYPES } from './constants';

export type StockCategory = 'fertilizer' | 'seed' | 'pesticide';

export interface StockInventoryLine {
  id?: string;
  dealer_id?: string;
  category: StockCategory;
  serial_no: number;
  product_type: string;
  opening_balance: number;
  receipts: number;
  total: number;
  sales: number;
  closing_balance: number;
  report_date?: string;
  report_month?: string;
}

export const STOCK_CATEGORIES: { id: StockCategory; label: string; telugu: string }[] = [
  { id: 'fertilizer', label: 'Fertilizer', telugu: 'ఎరువులు' },
  { id: 'seed', label: 'Seed', telugu: 'విత్తనాలు' },
  { id: 'pesticide', label: 'Pesticide', telugu: 'పురుగుమందులు' },
];

export const SEED_TYPES = [
  'Paddy',
  'Cotton',
  'Maize',
  'Redgram',
  'Blackgram',
  'Greengram',
  'Groundnut',
  'Sunflower',
  'Other',
] as const;

export const PESTICIDE_TYPES = [
  'Insecticide',
  'Fungicide',
  'Herbicide',
  'Bio-pesticide',
  'Other',
] as const;

export function productTypesForCategory(category: StockCategory): string[] {
  switch (category) {
    case 'fertilizer':
      return [...FERTILIZER_TYPES];
    case 'seed':
      return [...SEED_TYPES];
    case 'pesticide':
      return [...PESTICIDE_TYPES];
    default:
      return [];
  }
}

export function computeStockRow(opening: number, receipts: number, sales: number) {
  const opening_balance = Number(opening) || 0;
  const receiptsNum = Number(receipts) || 0;
  const salesNum = Number(sales) || 0;
  const total = opening_balance + receiptsNum;
  const closing_balance = total - salesNum;
  return { opening_balance, receipts: receiptsNum, total, sales: salesNum, closing_balance };
}

export function fertilizerBagWeightMts(productType: string): number {
  return productType.trim().toLowerCase() === 'urea' ? 0.045 : 0.05;
}

export function fertilizerMtsToBags(valueMts: number, productType: string): number {
  return (Number(valueMts) || 0) / fertilizerBagWeightMts(productType);
}

export function formatFertilizerQuantity(
  valueMts: number,
  productType: string,
  unit: 'mts' | 'bags'
): string {
  if (unit === 'bags') {
    const bags = fertilizerMtsToBags(valueMts, productType);
    return String(Math.round(bags));
  }
  return (Number(valueMts) || 0).toFixed(2);
}

export function currentReportDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function reportDateToMonth(reportDate: string): string {
  return reportDate.slice(0, 7);
}

export function shiftReportDate(reportDate: string, days: number): string {
  const [y, m, d] = reportDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function formatReportDateLabel(reportDate: string, locale = 'en-IN'): string {
  const [y, m, d] = reportDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function emptyInventoryRow(
  serialNo: number,
  category: StockCategory,
  reportDate: string = currentReportDate()
): StockInventoryLine {
  const types = productTypesForCategory(category);
  return {
    category,
    serial_no: serialNo,
    product_type: types[0] || '',
    opening_balance: 0,
    receipts: 0,
    total: 0,
    sales: 0,
    closing_balance: 0,
    report_date: reportDate,
    report_month: reportDateToMonth(reportDate),
  };
}
