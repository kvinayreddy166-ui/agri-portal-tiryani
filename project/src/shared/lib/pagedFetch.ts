import { supabase } from './supabase';

const PAGE_SIZE = 1000;
const PAGE_CONCURRENCY = 4;

type OrderSpec = { column: string; ascending?: boolean; nullsFirst?: boolean };

/**
 * Fetches every row of a table via range() pagination. PostgREST caps each
 * response (~1000 rows), so single .limit(10000) queries silently truncate.
 * Pages are fetched in small concurrent batches to stay under browser
 * connection limits.
 */
export async function fetchAllRows<T = Record<string, unknown>>({
  table,
  columns = '*',
  order,
  applyFilters,
  map,
}: {
  table: string;
  columns?: string;
  order?: OrderSpec[];
  applyFilters?: (query: any) => any;
  map?: (row: any) => T;
}): Promise<{ data: T[]; error: { message?: string } | null }> {
  try {
    let countQuery = supabase.from(table as never).select('id', { count: 'exact', head: true });
    if (applyFilters) countQuery = applyFilters(countQuery);
    const { count, error: countError } = await countQuery;
    if (countError) return { data: [], error: countError };

    const total = count ?? 0;
    if (total === 0) return { data: [], error: null };

    const pageCount = Math.ceil(total / PAGE_SIZE);
    const rows: T[] = [];
    for (let start = 0; start < pageCount; start += PAGE_CONCURRENCY) {
      const batchSize = Math.min(PAGE_CONCURRENCY, pageCount - start);
      const pages = await Promise.all(
        Array.from({ length: batchSize }, (_, j) => {
          const page = start + j;
          let query: any = supabase.from(table as never).select(columns);
          if (applyFilters) query = applyFilters(query);
          for (const o of order ?? []) {
            query = query.order(o.column, { ascending: o.ascending ?? true, nullsFirst: o.nullsFirst });
          }
          return query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        })
      );
      for (const { data, error } of pages) {
        if (error) return { data: [], error };
        const pageRows = (data ?? []) as any[];
        rows.push(...(map ? pageRows.map(map) : (pageRows as T[])));
      }
    }
    return { data: rows, error: null };
  } catch (error) {
    return { data: [], error: error as { message?: string } };
  }
}
