import { supabase } from './supabase';

export async function upsertDealerStockAllocation(payload: {
  dealer_id: string;
  fertilizer_type: string;
  quantity_mts: number;
}): Promise<void> {
  const now = new Date().toISOString();
  const row = {
    dealer_id: payload.dealer_id,
    fertilizer_type: payload.fertilizer_type,
    quantity_mts: payload.quantity_mts,
    last_updated: now,
  };

  const { data: existing, error: selectError } = await supabase
    .from('dealer_stock_allocation')
    .select('id')
    .eq('dealer_id', payload.dealer_id)
    .eq('fertilizer_type', payload.fertilizer_type)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing?.id) {
    const { error } = await supabase
      .from('dealer_stock_allocation')
      .update({ quantity_mts: row.quantity_mts, last_updated: row.last_updated })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error: insertError } = await supabase.from('dealer_stock_allocation').insert([row]);
  if (insertError) throw insertError;
}
