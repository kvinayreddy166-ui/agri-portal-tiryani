import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { SampleCommodity } from './useSampleTargets';

export interface TargetAllocation {
  id: string;
  allocated_by: string;
  allocated_by_name: string | null;
  officer_id: string | null;
  officer_name: string | null;
  mandal: string;
  district: string | null;
  commodity: SampleCommodity;
  financial_year: string;
  numeric_target: number | null;
  code_number: string | null;
  created_at: string;
}

export interface AllocationOfficer {
  id: string;
  full_name: string;
  designation: string;
  mandal: string;
  district: string;
}

const COLUMNS =
  'id, allocated_by, allocated_by_name, officer_id, officer_name, mandal, district, commodity, financial_year, numeric_target, code_number, created_at';

/**
 * Fetches target allocations visible to the current user.
 * RLS scopes results: officers see allocations made to them or their mandal,
 * DNOs see allocations they created, admins see all.
 */
export function useTargetAllocations() {
  const [allocations, setAllocations] = useState<TargetAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('officer_target_allocations')
        .select(COLUMNS)
        .order('financial_year', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      setAllocations((data || []) as TargetAllocation[]);
    } catch (error) {
      console.error('Error fetching target allocations:', error);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { allocations, loading, refresh };
}

/** Lists MAO/ADA officers for the DNO allocation dropdown (RPC, DNO/admin only). */
export async function listAllocationOfficers(district?: string): Promise<AllocationOfficer[]> {
  const { data, error } = await supabase.rpc('list_allocation_officers', {
    p_district: district || null,
  });
  if (error) throw error;
  return (data || []) as AllocationOfficer[];
}
