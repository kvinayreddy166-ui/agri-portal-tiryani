import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Dealer } from '../types/database';

const DEALER_PICKER_COLUMNS =
  'id, dealer_name, ifms_id, phone_number, license_number, issue_date, expiry_date, location, dealer_category, portal_email';

/**
 * Fetches dealers for picker dropdowns. RLS scopes the result automatically:
 * officers see only dealers they created, admins see all, public/anon see
 * non-officer dealers.
 */
export function useDealers(category?: Dealer['dealer_category']) {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('dealers')
        .select(DEALER_PICKER_COLUMNS)
        .order('dealer_name')
        .limit(1000);
      if (category) query = query.eq('dealer_category', category);
      const { data, error } = await query;
      if (error) throw error;
      setDealers((data || []) as Dealer[]);
    } catch (error) {
      console.error('Error fetching dealers for picker:', error);
      setDealers([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { dealers, loading, refresh };
}

/** Builds a display address line from a dealer record. */
export function dealerAddressLine(dealer: Dealer): string {
  return (dealer.location || '').trim();
}
