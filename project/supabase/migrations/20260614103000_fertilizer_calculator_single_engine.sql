alter table public.fertilizer_grades
  add column if not exists composition jsonb not null default '{}'::jsonb;

alter table public.crop_fertilizer_recommendations
  add column if not exists nutrients jsonb not null default '{}'::jsonb;

create table if not exists public.fertilizer_calculation_records (
  id uuid primary key default gen_random_uuid(),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fertilizer_calculation_records enable row level security;

drop policy if exists "fertilizer calculation records admin read" on public.fertilizer_calculation_records;
create policy "fertilizer calculation records admin read"
  on public.fertilizer_calculation_records for select
  to authenticated
  using (
    lower(coalesce(auth.email(), auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com'
  );

drop policy if exists "fertilizer calculation records admin write" on public.fertilizer_calculation_records;
create policy "fertilizer calculation records admin write"
  on public.fertilizer_calculation_records for all
  to authenticated
  using (
    lower(coalesce(auth.email(), auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com'
  )
  with check (
    lower(coalesce(auth.email(), auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com'
  );

update public.fertilizer_grades
set is_active = false, updated_at = now()
where name in ('20:20:0', '24:24:0', '28:28:0');

insert into public.fertilizer_grades (name, n, p, k, s, bag_kg, composition, is_active)
values ('28:28:28', 28, 28, 28, 0, 50, '{"n":28,"p":28,"k":28,"N":28,"P2O5":28,"K2O":28}'::jsonb, true)
on conflict (name) do update set
  n = excluded.n,
  p = excluded.p,
  k = excluded.k,
  s = excluded.s,
  bag_kg = excluded.bag_kg,
  composition = excluded.composition,
  is_active = true,
  updated_at = now();
