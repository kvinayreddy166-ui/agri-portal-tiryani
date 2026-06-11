import { StockCategory, StockInventoryLine } from '../lib/stockInventory';

export type StockAnalyticsRow = {
  key: string;
  label: string;
  receipts: number;
  sales: number;
  closing: number;
};

export function stockGroupLabel(row: StockInventoryLine, category: StockCategory): string {
  if (category === 'seed') {
    return [row.crop || row.product_type, row.variety, row.lot_number].filter(Boolean).join(' / ');
  }
  if (category === 'pesticide') {
    return [row.product_type, row.technical_name, row.batch_number].filter(Boolean).join(' / ');
  }
  return row.product_type || 'Product';
}

export function buildStockAnalytics(rows: StockInventoryLine[], category: StockCategory): StockAnalyticsRow[] {
  const grouped = new Map<string, StockAnalyticsRow>();
  rows.forEach((row) => {
    const label = stockGroupLabel(row, category);
    const current = grouped.get(label) || { key: label, label, receipts: 0, sales: 0, closing: 0 };
    current.receipts += Number(row.receipts || 0);
    current.sales += Number(row.sales || 0);
    current.closing += Number(row.closing_balance || 0);
    grouped.set(label, current);
  });
  return [...grouped.values()].sort((a, b) => a.label.localeCompare(b.label));
}
