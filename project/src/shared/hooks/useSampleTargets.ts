import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type SampleCommodity = 'fertilizer' | 'seed' | 'pesticide';

export interface SampleTarget {
  id: string;
  code_number: string;
  financial_year: string;
  commodity: SampleCommodity;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

const SAMPLE_TARGET_COLUMNS =
  'id, code_number, financial_year, commodity, created_by, created_by_name, created_at';

/**
 * Fetches sample targets (code numbers per financial year & commodity).
 * RLS scopes the result: officers see only their own targets, admins see all.
 */
export function useSampleTargets(commodity?: SampleCommodity) {
  const [targets, setTargets] = useState<SampleTarget[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sample_targets')
        .select(SAMPLE_TARGET_COLUMNS)
        .order('financial_year', { ascending: false })
        .order('code_number')
        .limit(5000);
      if (commodity) query = query.eq('commodity', commodity);
      const { data, error } = await query;
      if (error) throw error;
      setTargets((data || []) as SampleTarget[]);
    } catch (error) {
      console.error('Error fetching sample targets:', error);
      setTargets([]);
    } finally {
      setLoading(false);
    }
  }, [commodity]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { targets, loading, refresh };
}
