create or replace function public.get_site_hit_summary()
returns table (
  total_views integer,
  unique_visitors integer,
  today_views integer,
  last_viewed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    1000 + count(*)::integer as total_views,
    count(distinct visitor_id)::integer as unique_visitors,
    count(*) filter (where viewed_at >= date_trunc('day', now()))::integer as today_views,
    max(viewed_at) as last_viewed_at
  from public.site_hits;
$$;

grant execute on function public.get_site_hit_summary() to anon, authenticated;
