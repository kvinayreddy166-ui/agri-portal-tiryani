import { supabase } from './supabase';
import { FERTILIZER_TYPES } from './constants';
import { FertilizerStock } from '../types/database';
import { currentReportDate } from './stockInventory';
import { cachedSupabaseRows } from './offlineCache';

export type DailyFertilizerStockSummary = FertilizerStock & {
  sales_mts: number;
  closing_mts: number;
  report_date: string;
};

type FertilizerDailyStockLine = {
  dealer_id: string | null;
  product_type: string | null;
  sales: number | string | null;
  closing_balance: number | string | null;
  report_date: string | null;
  entry_type?: string | null;
  submitted_by?: string | null;
  invoice_no?: string | null;
  supplier?: string | null;
  updated_at: string | null;
  created_at: string | null;
};

const COMPLEX_FERTILIZER_GRADES = new Set([
  '20:20:0:13',
  '10:26:26',
  '14:35:14',
  '17:17:17',
  '19:19:19',
  '28:28:0',
]);

function canonicalFertilizerType(productType: string): string {
  const normalized = productType.trim();
  const key = normalized.toLowerCase();

  if (key === 'mop' || key === 'potash') return 'Potash';
  if (key === 'complex' || COMPLEX_FERTILIZER_GRADES.has(normalized)) return 'Complex';

  const knownType = FERTILIZER_TYPES.find((fertilizer) => fertilizer.toLowerCase() === key);
  return knownType || normalized;
}

/** Aggregate dealer-wise stock from Fertilizer Allocation (dealer_stock_allocation). */
export function aggregateFertilizerStock(
  allocations: { fertilizer_type: string; quantity_mts: number | string }[]
): FertilizerStock[] {
  const totals = FERTILIZER_TYPES.reduce((result, fertilizer) => {
    result[fertilizer] = allocations
      .filter((item) => item.fertilizer_type === fertilizer)
      .reduce((sum, item) => sum + Number(item.quantity_mts || 0), 0);
    return result;
  }, {} as Record<string, number>);

  const now = new Date().toISOString();

  return FERTILIZER_TYPES.map((fertilizer_type) => ({
    id: `aggregate-${fertilizer_type}`,
    fertilizer_type,
    quantity_available: totals[fertilizer_type],
    unit: 'MT',
    last_updated: now,
    created_at: now,
  }));
}

/** Dashboard & analytics: totals from Fertilizer Allocation only (not Stock Inventory). */
export async function fetchAggregatedFertilizerStock(): Promise<FertilizerStock[]> {
  const { data, error } = await supabase
    .from('dealer_stock_allocation')
    .select('fertilizer_type, quantity_mts');

  if (error) throw error;

  return aggregateFertilizerStock(data || []);
}

export async function fetchDailyFertilizerStockSummary(
  reportDate = currentReportDate()
): Promise<DailyFertilizerStockSummary[]> {
  const data = await cachedSupabaseRows<FertilizerDailyStockLine>(
    `daily-fertilizer-stock:latest-dealer-product:${reportDate}:v2`,
    fetchDailyFertilizerStockLines,
    []
  );

  const latestByDealerProduct = new Map<string, FertilizerDailyStockLine>();
  for (const item of data || []) {
    if (!isDailyStockLine(item)) continue;

    const dealerId = String(item.dealer_id || '').trim();
    const productType = String(item.product_type || '').trim();
    if (!dealerId || !productType) continue;

    const key = `${dealerId}::${productType.toLowerCase()}`;
    if (!latestByDealerProduct.has(key)) {
      latestByDealerProduct.set(key, item);
    }
  }

  const latestLines = Array.from(latestByDealerProduct.values());
  const now = new Date().toISOString();

  return FERTILIZER_TYPES.map((fertilizer_type) => {
    const lines = latestLines.filter((item) => canonicalFertilizerType(String(item.product_type || '')) === fertilizer_type);
    const sales_mts = lines.reduce((sum, item) => sum + Number(item.sales || 0), 0);
    const closing_mts = lines.reduce((sum, item) => sum + Number(item.closing_balance || 0), 0);
    const latestReportDate = lines.reduce((latest, item) => {
      const date = String(item.report_date || '');
      return date > latest ? date : latest;
    }, '');

    return {
      id: `daily-${fertilizer_type}`,
      fertilizer_type,
      quantity_available: closing_mts,
      sales_mts,
      closing_mts,
      report_date: latestReportDate || reportDate,
      unit: 'MT',
      last_updated: now,
      created_at: now,
    };
  });

  async function fetchDailyFertilizerStockLines() {
    const primary = await supabase
      .from('stock_inventory_lines')
      .select('dealer_id, product_type, entry_type, submitted_by, invoice_no, supplier, sales, closing_balance, report_date, updated_at, created_at')
      .eq('category', 'fertilizer')
      .lte('report_date', reportDate)
      .order('report_date', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false });

    if (!primary.error) return primary;

    return supabase
      .from('stock_inventory_lines')
      .select('dealer_id, product_type, sales, closing_balance, report_date, updated_at, created_at, submitted_by')
      .eq('category', 'fertilizer')
      .lte('report_date', reportDate)
      .order('report_date', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false });
  }
}

function isDailyStockLine(item: FertilizerDailyStockLine): boolean {
  const entryType = String(item.entry_type || '').trim().toLowerCase();
  if (entryType) return entryType === 'daily_stock';

  const submittedBy = String(item.submitted_by || '').trim().toLowerCase();
  if (submittedBy.startsWith('receipt-details:')) return false;
  if (String(item.invoice_no || '').trim() || String(item.supplier || '').trim()) return false;

  return true;
}

/** Mirror Fertilizer Allocation totals into fertilizer_stock table for legacy readers. */
export async function syncFertilizerStockTable(): Promise<void> {
  const aggregated = await fetchAggregatedFertilizerStock();
  const now = new Date().toISOString();

  for (const item of aggregated) {
    const { data: existing } = await supabase
      .from('fertilizer_stock')
      .select('id')
      .eq('fertilizer_type', item.fertilizer_type)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from('fertilizer_stock')
        .update({
          quantity_available: item.quantity_available,
          unit: 'MT',
          last_updated: now,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('fertilizer_stock').insert([
        {
          fertilizer_type: item.fertilizer_type,
          quantity_available: item.quantity_available,
          unit: 'MT',
          last_updated: now,
        },
      ]);

      if (error) throw error;
    }
  }
}

/** Dealer portal: this dealer's fertilizer allocation from Fertilizer Allocation (MT). */
export async function fetchDealerFertilizerAllocation(
  dealerId: string
): Promise<{ fertilizer_type: string; quantity_mts: number }[]> {
  const { data, error } = await supabase
    .from('dealer_stock_allocation')
    .select('fertilizer_type, quantity_mts')
    .eq('dealer_id', dealerId)
    .order('fertilizer_type');

  if (error) throw error;

  const totals = new Map<string, number>();
  for (const row of data || []) {
    totals.set(row.fertilizer_type, (totals.get(row.fertilizer_type) || 0) + Number(row.quantity_mts || 0));
  }

  return Array.from(totals.entries()).map(([fertilizer_type, quantity_mts]) => ({
    fertilizer_type,
    quantity_mts,
  }));
}
