-- Remove duplicate entries from fertilizer_grades before adding unique constraint
delete from public.fertilizer_grades
where id in (
  select id from (
    select id, name, row_number() over (partition by name order by created_at) as rn
    from public.fertilizer_grades
  ) t
  where rn > 1
);

-- Add unique constraint to fertilizer_grades.name if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'fertilizer_grades_name_key'
  ) then
    alter table public.fertilizer_grades 
    add constraint fertilizer_grades_name_key unique (name);
  end if;
end $$;

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

insert into public.fertilizer_grades (name, n, p, k, s, bag_kg, composition, is_active)
values
  ('Ammonium Sulphate', 21, 0, 0, 24, 50, '{"n":21,"s":24,"N":21,"S":24}'::jsonb, true),
  ('TSP', 0, 46, 0, 0, 50, '{"p":46,"P2O5":46}'::jsonb, true),
  ('28:28:28', 28, 28, 28, 0, 50, '{"n":28,"p":28,"k":28,"N":28,"P2O5":28,"K2O":28}'::jsonb, true)
on conflict (name) do update set
  n = excluded.n,
  p = excluded.p,
  k = excluded.k,
  s = excluded.s,
  bag_kg = excluded.bag_kg,
  composition = excluded.composition,
  is_active = true,
  updated_at = now();

-- Update maize split dosage schedule
update public.crop_fertilizer_recommendations
set split_plan = '[
  {"stage": "Basal (at sowing)", "nPct": 33.33, "pPct": 100, "kPct": 50},
  {"stage": "Knee-high stage", "nPct": 33.33, "pPct": 0, "kPct": 0},
  {"stage": "Tasseling/Flowering", "nPct": 33.34, "pPct": 0, "kPct": 50}
]'::jsonb,
updated_at = now()
where crop_name = 'Maize';

-- Update cotton fertilizer recommendations
-- Cotton Normal Variety: 36:18:18 with 3 equal splits at 30, 60, 90 DAS
update public.crop_fertilizer_recommendations
set n = 36, p = 18, k = 18,
    split_plan = '[
      {"stage": "Basal (at sowing)", "nPct": 0, "pPct": 100, "kPct": 0, "notes": "Apply entire phosphorus dose before ploughing/basal"},
      {"stage": "30 DAS", "nPct": 33.33, "pPct": 0, "kPct": 33.33},
      {"stage": "60 DAS", "nPct": 33.33, "pPct": 0, "kPct": 33.33},
      {"stage": "90 DAS", "nPct": 33.34, "pPct": 0, "kPct": 33.34}
    ]'::jsonb,
    updated_at = now()
where crop_name = 'Cotton' and variety = 'Normal';

-- Cotton Hybrid: 48:24:24 with 4 equal splits at 20, 40, 60, 80 DAS
update public.crop_fertilizer_recommendations
set n = 48, p = 24, k = 24,
    split_plan = '[
      {"stage": "Basal (at sowing)", "nPct": 0, "pPct": 100, "kPct": 0, "notes": "Apply entire phosphorus dose before ploughing/basal"},
      {"stage": "20 DAS", "nPct": 25, "pPct": 0, "kPct": 25},
      {"stage": "40 DAS", "nPct": 25, "pPct": 0, "kPct": 25},
      {"stage": "60 DAS", "nPct": 25, "pPct": 0, "kPct": 25},
      {"stage": "80 DAS", "nPct": 25, "pPct": 0, "kPct": 25}
    ]'::jsonb,
    updated_at = now()
where crop_name = 'Cotton' and variety = 'Hybrid';

-- Add groundnut (peanut) fertilizer recommendation
insert into public.crop_fertilizer_recommendations (crop_name, crop, zone, season, variety, n, p, k, area_unit, split_plan, nutrients, is_active)
values (
  'Groundnut',
  'Groundnut',
  'All Zones',
  'Vanakalam',
  'Normal',
  15,
  16,
  20,
  'acre',
  '[
    {"stage": "Basal (at sowing)", "nPct": 53.33, "pPct": 100, "kPct": 100, "notes": "Apply basal dose: 8 kg N, 16 kg P, 20 kg K per acre"},
    {"stage": "30 DAS (Early Flowering)", "nPct": 46.67, "pPct": 0, "kPct": 0, "notes": "Apply 7 kg N per acre as top dressing"},
    {"stage": "Peak Flowering", "nPct": 0, "pPct": 0, "kPct": 0, "gypsum_kg": 200, "notes": "Apply 200 kg Gypsum per acre. Place gypsum near root zone and carry out earthing-up/light intercultivation for better peg penetration and pod development"}
  ]'::jsonb,
  '{"base_n": 8, "base_p": 16, "base_k": 20, "top_dressing_n_kg": 7, "gypsum_kg": 200, "gypsum_notes": "Apply 200 kg Gypsum per acre at peak flowering stage. Place gypsum near root zone and carry out earthing-up/light intercultivation for better peg penetration and pod development"}'::jsonb,
  true
)
on conflict (crop_name, zone, season, variety) do update set
  n = excluded.n,
  p = excluded.p,
  k = excluded.k,
  split_plan = excluded.split_plan,
  nutrients = excluded.nutrients,
  is_active = true,
  updated_at = now();
