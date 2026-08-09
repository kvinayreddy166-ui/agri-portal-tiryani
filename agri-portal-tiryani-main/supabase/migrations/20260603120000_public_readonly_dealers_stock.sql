-- Public read-only access for portal transparency pages.
-- Write access remains controlled by existing authenticated/admin policies.

alter table if exists public.dealers enable row level security;
alter table if exists public.stock_inventory_lines enable row level security;

drop policy if exists "Public can view dealers directory" on public.dealers;
create policy "Public can view dealers directory"
  on public.dealers
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can view dealer stock inventory" on public.stock_inventory_lines;
create policy "Public can view dealer stock inventory"
  on public.stock_inventory_lines
  for select
  to anon, authenticated
  using (true);
