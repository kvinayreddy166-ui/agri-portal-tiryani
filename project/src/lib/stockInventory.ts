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

export function currentReportMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function emptyInventoryRow(serialNo: number, category: StockCategory): StockInventoryLine {
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
    report_month: currentReportMonth(),
  };
}
