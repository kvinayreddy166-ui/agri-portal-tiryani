create table if not exists public.fertilizer_grades (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  n numeric not null default 0,
  p numeric not null default 0,
  k numeric not null default 0,
  s numeric not null default 0,
  bag_kg numeric not null default 50,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crop_fertilizer_recommendations (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null unique,
  n numeric not null default 0,
  p numeric not null default 0,
  k numeric not null default 0,
  area_unit text not null default 'acre',
  split_plan jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fertilizer_grades_active_name on public.fertilizer_grades (is_active, name);
create index if not exists idx_crop_fertilizer_recommendations_active_crop on public.crop_fertilizer_recommendations (is_active, crop_name);

alter table public.fertilizer_grades enable row level security;
alter table public.crop_fertilizer_recommendations enable row level security;

drop policy if exists "fertilizer grades public read" on public.fertilizer_grades;
create policy "fertilizer grades public read"
  on public.fertilizer_grades for select
  using (true);

drop policy if exists "fertilizer grades admin write" on public.fertilizer_grades;
create policy "fertilizer grades admin write"
  on public.fertilizer_grades for all
  using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

drop policy if exists "crop fertilizer recommendations public read" on public.crop_fertilizer_recommendations;
create policy "crop fertilizer recommendations public read"
  on public.crop_fertilizer_recommendations for select
  using (true);

drop policy if exists "crop fertilizer recommendations admin write" on public.crop_fertilizer_recommendations;
create policy "crop fertilizer recommendations admin write"
  on public.crop_fertilizer_recommendations for all
  using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

insert into public.fertilizer_grades (name, n, p, k, s, bag_kg, is_active)
values
  ('Urea', 46, 0, 0, 0, 45, true),
  ('DAP', 18, 46, 0, 0, 50, true),
  ('MOP', 0, 0, 60, 0, 50, true),
  ('SSP', 0, 16, 0, 0, 50, true),
  ('10:26:26', 10, 26, 26, 0, 50, true),
  ('12:32:16', 12, 32, 16, 0, 50, true),
  ('14:35:14', 14, 35, 14, 0, 50, true),
  ('15:15:15', 15, 15, 15, 0, 50, true),
  ('16:16:16', 16, 16, 16, 0, 50, true),
  ('16:20:0:13', 16, 20, 0, 13, 50, true),
  ('17:17:17', 17, 17, 17, 0, 50, true),
  ('19:19:19', 19, 19, 19, 0, 50, true),
  ('20:20:0:13', 20, 20, 0, 13, 50, true),
  ('20:20:0', 20, 20, 0, 0, 50, true),
  ('24:24:0', 24, 24, 0, 0, 50, true),
  ('28:28:0', 28, 28, 0, 0, 50, true)
on conflict (name) do update set
  n = excluded.n,
  p = excluded.p,
  k = excluded.k,
  s = excluded.s,
  bag_kg = excluded.bag_kg,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.crop_fertilizer_recommendations (crop_name, n, p, k, area_unit, split_plan, is_active)
values
  ('Cotton', 48, 24, 24, 'acre', '[{"stage":"Basal","nPct":30,"pPct":100,"kPct":50},{"stage":"20 DAS","nPct":25,"pPct":0,"kPct":20},{"stage":"40 DAS","nPct":25,"pPct":0,"kPct":20},{"stage":"60 DAS","nPct":20,"pPct":0,"kPct":10},{"stage":"80 DAS","nPct":0,"pPct":0,"kPct":0}]'::jsonb, true),
  ('Paddy', 48, 20, 16, 'acre', '[{"stage":"Before transplanting / final puddling","nPct":34,"pPct":100,"kPct":100},{"stage":"Active tillering stage","nPct":33,"pPct":0,"kPct":0},{"stage":"Panicle initiation stage","nPct":33,"pPct":0,"kPct":0}]'::jsonb, true),
  ('Maize', 80, 24, 20, 'acre', '[{"stage":"Basal at sowing","nPct":34,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33,"pPct":0,"kPct":0},{"stage":"Flowering / tasseling stage","nPct":33,"pPct":0,"kPct":50}]'::jsonb, true),
  ('Redgram', 16, 8, 8, 'acre', '[{"stage":"Basal","nPct":100,"pPct":100,"kPct":100}]'::jsonb, true),
  ('Greengram', 8, 20, 0, 'acre', '[{"stage":"Basal","nPct":100,"pPct":100,"kPct":100}]'::jsonb, true),
  ('Sesamum', 16, 8, 8, 'acre', '[{"stage":"Basal","nPct":30,"pPct":100,"kPct":50},{"stage":"20 DAS","nPct":25,"pPct":0,"kPct":20},{"stage":"40 DAS","nPct":25,"pPct":0,"kPct":20},{"stage":"60 DAS","nPct":20,"pPct":0,"kPct":10},{"stage":"80 DAS","nPct":0,"pPct":0,"kPct":0}]'::jsonb, true)
on conflict (crop_name) do update set
  n = excluded.n,
  p = excluded.p,
  k = excluded.k,
  area_unit = excluded.area_unit,
  split_plan = excluded.split_plan,
  is_active = excluded.is_active,
  updated_at = now();
