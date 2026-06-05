import { supabase } from './supabase';
import { FERTILIZER_TYPES } from './constants';
import { FertilizerStock } from '../types/database';
import { currentReportDate } from './stockInventory';

export type DailyFertilizerStockSummary = FertilizerStock & {
  sales_mts: number;
  closing_mts: number;
  report_date: string;
};

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
  let effectiveDate = reportDate;
  const initialRows = await supabase
    .from('stock_inventory_lines')
    .select('product_type, sales, closing_balance, report_date')
    .eq('category', 'fertilizer')
    .eq('report_date', effectiveDate);
  let data = initialRows.data;

  if (initialRows.error) throw initialRows.error;

  if (!data?.length) {
    const latest = await supabase
      .from('stock_inventory_lines')
      .select('report_date')
      .eq('category', 'fertilizer')
      .order('report_date', { ascending: false })
      .limit(1);

    if (latest.error) throw latest.error;
    effectiveDate = String(latest.data?.[0]?.report_date || reportDate);

    if (effectiveDate !== reportDate) {
      const latestRows = await supabase
        .from('stock_inventory_lines')
        .select('product_type, sales, closing_balance, report_date')
        .eq('category', 'fertilizer')
        .eq('report_date', effectiveDate);

      if (latestRows.error) throw latestRows.error;
      data = latestRows.data || [];
    }
  }

  const now = new Date().toISOString();
  return FERTILIZER_TYPES.map((fertilizer_type) => {
    const lines = (data || []).filter((item) => item.product_type === fertilizer_type);
    const sales_mts = lines.reduce((sum, item) => sum + Number(item.sales || 0), 0);
    const closing_mts = lines.reduce((sum, item) => sum + Number(item.closing_balance || 0), 0);

    return {
      id: `daily-${fertilizer_type}`,
      fertilizer_type,
      quantity_available: closing_mts,
      sales_mts,
      closing_mts,
      report_date: effectiveDate,
      unit: 'MT',
      last_updated: now,
      created_at: now,
    };
  });
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

  return (data || []).map((row) => ({
    fertilizer_type: row.fertilizer_type,
    quantity_mts: Number(row.quantity_mts || 0),
  }));
}
