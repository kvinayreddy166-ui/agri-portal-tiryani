import { supabase } from './supabase';

export async function upsertDealerStockAllocation(payload: {
  dealer_id: string;
  fertilizer_type: string;
  quantity_mts: number;
  wholesaler_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  quantity_unit?: string;
  quantity_bags?: number;
}): Promise<void> {
  const now = new Date().toISOString();
  const row = {
    dealer_id: payload.dealer_id,
    fertilizer_type: payload.fertilizer_type,
    quantity_mts: payload.quantity_mts,
    wholesaler_name: payload.wholesaler_name || '',
    invoice_number: payload.invoice_number || '',
    invoice_date: payload.invoice_date || null,
    quantity_unit: payload.quantity_unit || 'MTS',
    quantity_bags: payload.quantity_bags || 0,
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
      .update({
        quantity_mts: row.quantity_mts,
        wholesaler_name: row.wholesaler_name,
        invoice_number: row.invoice_number,
        invoice_date: row.invoice_date,
        quantity_unit: row.quantity_unit,
        quantity_bags: row.quantity_bags,
        last_updated: row.last_updated,
      })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error: insertError } = await supabase.from('dealer_stock_allocation').insert([row]);
  if (insertError) throw insertError;
}
