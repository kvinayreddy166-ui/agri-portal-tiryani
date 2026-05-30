import { supabase } from './supabase';
import { FERTILIZER_TYPES } from './constants';
import { FertilizerStock } from '../types/database';

/** Aggregate dealer-wise stock from Stock Management (dealer_stock_allocation). */
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
    unit: 'MTS',
    last_updated: now,
    created_at: now,
  }));
}

/** Dashboard & analytics: totals from Stock Management only (not Stock Inventory). */
export async function fetchAggregatedFertilizerStock(): Promise<FertilizerStock[]> {
  const { data, error } = await supabase
    .from('dealer_stock_allocation')
    .select('fertilizer_type, quantity_mts');

  if (error) throw error;

  return aggregateFertilizerStock(data || []);
}

/** Mirror Stock Management totals into fertilizer_stock table for legacy readers. */
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
          unit: 'MTS',
          last_updated: now,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('fertilizer_stock').insert([
        {
          fertilizer_type: item.fertilizer_type,
          quantity_available: item.quantity_available,
          unit: 'MTS',
          last_updated: now,
        },
      ]);

      if (error) throw error;
    }
  }
}

/** Dealer portal: this dealer's fertilizer allocation from Stock Management (MTS). */
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
