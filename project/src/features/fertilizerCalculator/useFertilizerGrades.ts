import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DEFAULT_GRADES, REMOVED_FERTILIZER_GRADES } from './fertilizerData';
import { numberValue } from './fertilizerEngine';
import type { FertilizerGrade } from './fertilizerTypes';

type GradeRow = {
  id?: string;
  name: string;
  n?: unknown;
  p?: unknown;
  k?: unknown;
  s?: unknown;
  bag_kg?: unknown;
  composition?: unknown;
  is_active?: boolean;
};

export async function loadFertilizerGrades(): Promise<FertilizerGrade[]> {
  let response: any = await supabase
    .from('fertilizer_grades')
    .select('id, name, n, p, k, s, bag_kg, composition, is_active')
    .eq('is_active', true)
    .order('name');

  if (response.error) {
    response = await supabase
      .from('fertilizer_grades')
      .select('id, name, n, p, k, s, bag_kg, is_active')
      .eq('is_active', true)
      .order('name');
  }

  if (response.error || !response.data?.length) {
    return DEFAULT_GRADES;
  }

  return response.data
    .filter((row: GradeRow) => !REMOVED_FERTILIZER_GRADES.has(row.name.trim()))
    .map((row: GradeRow) => ({
      id: row.id,
      name: row.name,
      n: numberValue(row.n),
      p: numberValue(row.p),
      k: numberValue(row.k),
      s: numberValue(row.s),
      bag_kg: numberValue(row.bag_kg) || 50,
      composition: typeof row.composition === 'object' && row.composition ? row.composition as Record<string, number> : undefined,
      is_active: row.is_active,
    }));
}

export function useFertilizerGrades() {
  const [grades, setGrades] = useState<FertilizerGrade[]>(DEFAULT_GRADES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadFertilizerGrades()
      .then((loadedGrades) => {
        if (!cancelled) setGrades(loadedGrades);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { grades, setGrades, loading };
}
