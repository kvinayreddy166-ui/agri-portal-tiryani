import { supabase } from './supabase';
import { FERTILIZER_TYPES } from './constants';
import { FertilizerStock } from '../types/database';

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

function aggregateFromInventoryLines(
  lines: { product_type: string; closing_balance: number | string }[]
): { fertilizer_type: string; quantity_mts: number }[] {
  const totals = FERTILIZER_TYPES.reduce((result, fertilizer) => {
    result[fertilizer] = lines
      .filter((line) => line.product_type === fertilizer)
      .reduce((sum, line) => sum + Number(line.closing_balance || 0), 0);
    return result;
  }, {} as Record<string, number>);

  return FERTILIZER_TYPES.map((fertilizer_type) => ({
    fertilizer_type,
    quantity_mts: totals[fertilizer_type],
  }));
}

export async function fetchAggregatedFertilizerStock(): Promise<FertilizerStock[]> {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [inventoryRes, allocationRes] = await Promise.all([
    supabase
      .from('stock_inventory_lines')
      .select('product_type, closing_balance')
      .eq('category', 'fertilizer')
      .eq('report_month', month),
    supabase.from('dealer_stock_allocation').select('fertilizer_type, quantity_mts'),
  ]);

  if (inventoryRes.error) console.warn('stock_inventory_lines:', inventoryRes.error.message);
  if (allocationRes.error) throw allocationRes.error;

  const inventoryLines = inventoryRes.data || [];
  if (inventoryLines.length > 0) {
    return aggregateFertilizerStock(aggregateFromInventoryLines(inventoryLines));
  }

  return aggregateFertilizerStock(allocationRes.data || []);
}

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
