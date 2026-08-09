create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.farmer_database (
  id uuid primary key default gen_random_uuid(),
  s_no integer,
  farmer_name_english text not null default '',
  farmer_name_telugu text not null default '',
  father_or_husband_name_english text not null default '',
  father_or_husband_name_telugu text not null default '',
  aadhaar_no text not null default '',
  aadhaar_last4 text not null default '',
  ppb_no text not null default '',
  survey_no text not null default '',
  extent numeric(12, 4) not null default 0,
  crop text not null default '',
  village_english text not null default '',
  village_telugu text not null default '',
  phone_number text not null default '',
  remarks text not null default '',
  search_text text not null default '',
  identity_key text not null default '',
  row_hash text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create unique index if not exists farmer_database_row_hash_key
  on public.farmer_database (row_hash);

create index if not exists idx_farmer_database_name_en
  on public.farmer_database using gin (farmer_name_english gin_trgm_ops);
create index if not exists idx_farmer_database_name_te
  on public.farmer_database using gin (farmer_name_telugu gin_trgm_ops);
create index if not exists idx_farmer_database_phone
  on public.farmer_database (phone_number);
create index if not exists idx_farmer_database_ppb
  on public.farmer_database (ppb_no);
create index if not exists idx_farmer_database_aadhaar
  on public.farmer_database (aadhaar_no);
create index if not exists idx_farmer_database_village_en
  on public.farmer_database using gin (village_english gin_trgm_ops);
create index if not exists idx_farmer_database_village_te
  on public.farmer_database using gin (village_telugu gin_trgm_ops);
create index if not exists idx_farmer_database_survey
  on public.farmer_database (survey_no);
create index if not exists idx_farmer_database_search
  on public.farmer_database using gin (search_text gin_trgm_ops);
create index if not exists idx_farmer_database_identity
  on public.farmer_database (identity_key);
create index if not exists idx_farmer_database_crop
  on public.farmer_database (crop);

alter table public.farmer_database enable row level security;

drop policy if exists "Authenticated can read farmer database" on public.farmer_database;
create policy "Authenticated can read farmer database"
  on public.farmer_database for select
  to authenticated
  using (true);

drop policy if exists "Admin can manage farmer database" on public.farmer_database;
create policy "Admin can manage farmer database"
  on public.farmer_database for all
  to authenticated
  using (public.is_portal_admin())
  with check (public.is_portal_admin());
