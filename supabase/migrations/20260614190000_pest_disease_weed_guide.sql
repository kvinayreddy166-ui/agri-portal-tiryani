-- Pest, Disease & Weed Management Guide Database Schema
-- Comprehensive database for Telangana crop pest management

-- Crops table
create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_te text not null,
  scientific_name text,
  description_en text,
  description_te text,
  image_url text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insect Pests table
create table if not exists public.insect_pests (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid references public.crops(id) on delete cascade,
  name_en text not null,
  name_te text not null,
  scientific_name text,
  identification_en text,
  identification_te text,
  life_cycle_en text,
  life_cycle_te text,
  symptoms_en text,
  symptoms_te text,
  damage_symptoms_en text,
  damage_symptoms_te text,
  economic_threshold_level text,
  ipm_practices_en text,
  ipm_practices_te text,
  chemical_control_en text,
  chemical_control_te text,
  biological_control_en text,
  biological_control_te text,
  preventive_measures_en text,
  preventive_measures_te text,
  pest_image_url text,
  larva_image_url text,
  adult_image_url text,
  eggs_image_url text,
  damage_image_url text,
  field_symptoms_image_url text,
  affected_parts_image_url text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Diseases table
create table if not exists public.diseases (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid references public.crops(id) on delete cascade,
  name_en text not null,
  name_te text not null,
  scientific_name text,
  symptoms_en text,
  symptoms_te text,
  favourable_conditions_en text,
  favourable_conditions_te text,
  disease_cycle_en text,
  disease_cycle_te text,
  integrated_management_en text,
  integrated_management_te text,
  chemical_control_en text,
  chemical_control_te text,
  biological_control_en text,
  biological_control_te text,
  preventive_measures_en text,
  preventive_measures_te text,
  disease_image_url text,
  symptoms_image_url text,
  affected_plant_image_url text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Weeds table
create table if not exists public.weeds (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid references public.crops(id) on delete cascade,
  name_en text not null,
  name_te text not null,
  scientific_name text,
  weed_type text, -- 'grass', 'broadleaf', 'sedge'
  description_en text,
  description_te text,
  weed_image_url text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Weed Management Recommendations table
create table if not exists public.weed_management (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid references public.crops(id) on delete cascade,
  major_grasses_en text,
  major_grasses_te text,
  major_broadleaf_en text,
  major_broadleaf_te text,
  major_sedges_en text,
  major_sedges_te text,
  pre_emergence_herbicides_en text,
  pre_emergence_herbicides_te text,
  post_emergence_herbicides_en text,
  post_emergence_herbicides_te text,
  dose_per_acre text,
  dose_per_pump text,
  application_time_en text,
  application_time_te text,
  spray_volume text,
  precautions_en text,
  precautions_te text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chemical Recommendations table (for pests)
create table if not exists public.chemical_recommendations (
  id uuid primary key default gen_random_uuid(),
  pest_id uuid references public.insect_pests(id) on delete cascade,
  product_name_en text not null,
  product_name_te text not null,
  active_ingredient text,
  dose_per_acre text,
  dose_per_pump text,
  waiting_period text,
  irac_group text,
  mode_of_action_en text,
  mode_of_action_te text,
  product_image_url text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Disease Chemical Recommendations table
create table if not exists public.disease_chemical_recommendations (
  id uuid primary key default gen_random_uuid(),
  disease_id uuid references public.diseases(id) on delete cascade,
  product_name_en text not null,
  product_name_te text not null,
  active_ingredient text,
  dose_per_acre text,
  dose_per_pump text,
  waiting_period text,
  mode_of_action_en text,
  mode_of_action_te text,
  product_image_url text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Search Analytics table
create table if not exists public.pest_guide_search_analytics (
  id uuid primary key default gen_random_uuid(),
  search_term text not null,
  search_type text, -- 'pest', 'disease', 'weed', 'symptom'
  crop_id uuid references public.crops(id),
  result_count integer,
  created_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_insect_pests_crop_id on public.insect_pests(crop_id);
create index if not exists idx_diseases_crop_id on public.diseases(crop_id);
create index if not exists idx_weeds_crop_id on public.weeds(crop_id);
create index if not exists idx_weed_management_crop_id on public.weed_management(crop_id);
create index if not exists idx_chemical_recommendations_pest_id on public.chemical_recommendations(pest_id);
create index if not exists idx_disease_chemical_recommendations_disease_id on public.disease_chemical_recommendations(disease_id);
create index if not exists idx_pest_guide_search_analytics_search_term on public.pest_guide_search_analytics(search_term);
create index if not exists idx_pest_guide_search_analytics_created_at on public.pest_guide_search_analytics(created_at);

-- Enable RLS
alter table public.crops enable row level security;
alter table public.insect_pests enable row level security;
alter table public.diseases enable row level security;
alter table public.weeds enable row level security;
alter table public.weed_management enable row level security;
alter table public.chemical_recommendations enable row level security;
alter table public.disease_chemical_recommendations enable row level security;
alter table public.pest_guide_search_analytics enable row level security;

-- RLS Policies for crops
drop policy if exists "Anyone can view crops" on public.crops;
drop policy if exists "Admin can insert crops" on public.crops;
drop policy if exists "Admin can update crops" on public.crops;
drop policy if exists "Admin can delete crops" on public.crops;

create policy "Anyone can view crops" on public.crops for select using (true);
create policy "Admin can insert crops" on public.crops for insert with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can update crops" on public.crops for update using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can delete crops" on public.crops for delete using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

-- RLS Policies for insect_pests
drop policy if exists "Anyone can view insect_pests" on public.insect_pests;
drop policy if exists "Admin can insert insect_pests" on public.insect_pests;
drop policy if exists "Admin can update insect_pests" on public.insect_pests;
drop policy if exists "Admin can delete insect_pests" on public.insect_pests;

create policy "Anyone can view insect_pests" on public.insect_pests for select using (true);
create policy "Admin can insert insect_pests" on public.insect_pests for insert with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can update insect_pests" on public.insect_pests for update using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can delete insect_pests" on public.insect_pests for delete using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

-- RLS Policies for diseases
drop policy if exists "Anyone can view diseases" on public.diseases;
drop policy if exists "Admin can insert diseases" on public.diseases;
drop policy if exists "Admin can update diseases" on public.diseases;
drop policy if exists "Admin can delete diseases" on public.diseases;

create policy "Anyone can view diseases" on public.diseases for select using (true);
create policy "Admin can insert diseases" on public.diseases for insert with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can update diseases" on public.diseases for update using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can delete diseases" on public.diseases for delete using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

-- RLS Policies for weeds
drop policy if exists "Anyone can view weeds" on public.weeds;
drop policy if exists "Admin can insert weeds" on public.weeds;
drop policy if exists "Admin can update weeds" on public.weeds;
drop policy if exists "Admin can delete weeds" on public.weeds;

create policy "Anyone can view weeds" on public.weeds for select using (true);
create policy "Admin can insert weeds" on public.weeds for insert with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can update weeds" on public.weeds for update using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can delete weeds" on public.weeds for delete using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

-- RLS Policies for weed_management
drop policy if exists "Anyone can view weed_management" on public.weed_management;
drop policy if exists "Admin can insert weed_management" on public.weed_management;
drop policy if exists "Admin can update weed_management" on public.weed_management;
drop policy if exists "Admin can delete weed_management" on public.weed_management;

create policy "Anyone can view weed_management" on public.weed_management for select using (true);
create policy "Admin can insert weed_management" on public.weed_management for insert with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can update weed_management" on public.weed_management for update using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can delete weed_management" on public.weed_management for delete using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

-- RLS Policies for chemical_recommendations
drop policy if exists "Anyone can view chemical_recommendations" on public.chemical_recommendations;
drop policy if exists "Admin can insert chemical_recommendations" on public.chemical_recommendations;
drop policy if exists "Admin can update chemical_recommendations" on public.chemical_recommendations;
drop policy if exists "Admin can delete chemical_recommendations" on public.chemical_recommendations;

create policy "Anyone can view chemical_recommendations" on public.chemical_recommendations for select using (true);
create policy "Admin can insert chemical_recommendations" on public.chemical_recommendations for insert with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can update chemical_recommendations" on public.chemical_recommendations for update using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can delete chemical_recommendations" on public.chemical_recommendations for delete using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

-- RLS Policies for disease_chemical_recommendations
drop policy if exists "Anyone can view disease_chemical_recommendations" on public.disease_chemical_recommendations;
drop policy if exists "Admin can insert disease_chemical_recommendations" on public.disease_chemical_recommendations;
drop policy if exists "Admin can update disease_chemical_recommendations" on public.disease_chemical_recommendations;
drop policy if exists "Admin can delete disease_chemical_recommendations" on public.disease_chemical_recommendations;

create policy "Anyone can view disease_chemical_recommendations" on public.disease_chemical_recommendations for select using (true);
create policy "Admin can insert disease_chemical_recommendations" on public.disease_chemical_recommendations for insert with check ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can update disease_chemical_recommendations" on public.disease_chemical_recommendations for update using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
create policy "Admin can delete disease_chemical_recommendations" on public.disease_chemical_recommendations for delete using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

-- RLS Policies for pest_guide_search_analytics
drop policy if exists "Anyone can insert pest_guide_search_analytics" on public.pest_guide_search_analytics;
drop policy if exists "Admin can view pest_guide_search_analytics" on public.pest_guide_search_analytics;

create policy "Anyone can insert pest_guide_search_analytics" on public.pest_guide_search_analytics for insert with check (true);
create policy "Admin can view pest_guide_search_analytics" on public.pest_guide_search_analytics for select using ((auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');
