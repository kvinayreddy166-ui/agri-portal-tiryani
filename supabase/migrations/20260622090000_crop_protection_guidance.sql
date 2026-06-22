-- Crop protection guidance module
-- Safe additive migration for Officer Toolkit.

create table if not exists public.crop_protection_crops (
  id uuid primary key default gen_random_uuid(),
  crop_key text not null unique,
  name_en text not null,
  name_te text,
  image_url text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crop_protection_items (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crop_protection_crops(id) on delete cascade,
  category text not null check (category in ('weed', 'pest', 'disease')),
  name_en text not null,
  name_te text,
  scientific_name text,
  symptoms_en text,
  symptoms_te text,
  damage_en text,
  damage_te text,
  favourable_conditions_en text,
  favourable_conditions_te text,
  etl text,
  stage text,
  severity_level text not null default 'medium' check (severity_level in ('low', 'medium', 'high')),
  image_urls jsonb not null default '[]'::jsonb,
  source_name text,
  source_url text,
  source_priority integer not null default 100,
  is_verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crop_protection_recommendations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.crop_protection_items(id) on delete cascade,
  control_type text not null check (control_type in ('cultural', 'mechanical', 'biological', 'chemical', 'general_ipm')),
  severity_level text not null default 'medium' check (severity_level in ('low', 'medium', 'high')),
  recommendation_en text not null,
  recommendation_te text,
  chemical_name text,
  formulation text,
  dose_per_litre text,
  dose_per_acre text,
  dose_per_tank_16l text,
  dose_per_tank_20l text,
  waiting_period text,
  safety_note_en text,
  safety_note_te text,
  source_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crop_protection_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  field_name text not null,
  language text not null,
  translated_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_type, entity_id, field_name, language)
);

create index if not exists idx_crop_protection_crops_active
  on public.crop_protection_crops(active, display_order);

create index if not exists idx_crop_protection_items_crop_category
  on public.crop_protection_items(crop_id, category, active, is_verified);

create index if not exists idx_crop_protection_recommendations_item
  on public.crop_protection_recommendations(item_id, active, control_type);

alter table public.crop_protection_crops enable row level security;
alter table public.crop_protection_items enable row level security;
alter table public.crop_protection_recommendations enable row level security;
alter table public.crop_protection_translations enable row level security;

drop policy if exists "Read active crop protection crops" on public.crop_protection_crops;
create policy "Read active crop protection crops"
  on public.crop_protection_crops for select
  using (active = true);

drop policy if exists "Read active verified crop protection items" on public.crop_protection_items;
create policy "Read active verified crop protection items"
  on public.crop_protection_items for select
  using (active = true and is_verified = true);

drop policy if exists "Read active crop protection recommendations" on public.crop_protection_recommendations;
create policy "Read active crop protection recommendations"
  on public.crop_protection_recommendations for select
  using (
    active = true and exists (
      select 1
      from public.crop_protection_items i
      where i.id = crop_protection_recommendations.item_id
        and i.active = true
        and i.is_verified = true
    )
  );

drop policy if exists "Read crop protection translations" on public.crop_protection_translations;
create policy "Read crop protection translations"
  on public.crop_protection_translations for select
  using (true);

drop policy if exists "Admin manage crop protection crops" on public.crop_protection_crops;
create policy "Admin manage crop protection crops"
  on public.crop_protection_crops for all
  using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

drop policy if exists "Admin manage crop protection items" on public.crop_protection_items;
create policy "Admin manage crop protection items"
  on public.crop_protection_items for all
  using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

drop policy if exists "Admin manage crop protection recommendations" on public.crop_protection_recommendations;
create policy "Admin manage crop protection recommendations"
  on public.crop_protection_recommendations for all
  using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

drop policy if exists "Admin manage crop protection translations" on public.crop_protection_translations;
create policy "Admin manage crop protection translations"
  on public.crop_protection_translations for all
  using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
