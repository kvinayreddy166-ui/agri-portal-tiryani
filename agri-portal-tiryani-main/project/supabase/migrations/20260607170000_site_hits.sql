-- Anonymous site hit tracking for admin dashboard counts.
create table if not exists public.site_hits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  path text,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_site_hits_viewed_at
  on public.site_hits (viewed_at desc);

create index if not exists idx_site_hits_visitor_id
  on public.site_hits (visitor_id);

alter table public.site_hits enable row level security;

drop policy if exists "Anyone can record site hits" on public.site_hits;
create policy "Anyone can record site hits"
  on public.site_hits
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admin can view site hits" on public.site_hits;
create policy "Admin can view site hits"
  on public.site_hits
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
