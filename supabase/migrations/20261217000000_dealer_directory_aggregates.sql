-- Dashboard dealer charts only need counts grouped by category/district/mandal.
-- Previously the client fetched every dealer row (~15k) in 15 paged requests;
-- this returns a few hundred aggregate rows in one query instead.
-- SECURITY INVOKER so RLS still limits rows to what the caller may see.

create or replace function public.dealer_directory_aggregates()
returns table (
  dealer_category text,
  district        text,
  mandal          text,
  dealer_count    bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select dealer_category, district, mandal, count(*)::bigint as dealer_count
  from public.dealers
  group by dealer_category, district, mandal;
$$;

revoke all on function public.dealer_directory_aggregates() from public;
grant execute on function public.dealer_directory_aggregates() to authenticated;
