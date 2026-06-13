create table if not exists public.external_urea_sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_started_at timestamptz,
  sync_completed_at timestamptz,
  status text,
  total_reports integer not null default 0,
  total_records integer not null default 0,
  failed_records integer not null default 0,
  error_message text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.external_urea_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text,
  report_name text,
  mandal text,
  village text,
  report_date date,
  source_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.urea_farmer_bookings (
  id uuid primary key default gen_random_uuid(),
  farmer_name text,
  father_name text,
  village text,
  mandal text,
  mobile_number text,
  aadhaar_number text,
  ppb_number text,
  survey_number text,
  extent numeric,
  crop text,
  urea_required numeric,
  urea_booked numeric,
  urea_supplied numeric,
  pending_quantity numeric,
  dealer_name text,
  booking_date date,
  supply_date date,
  booking_status text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  dedupe_key text generated always as (
    coalesce(nullif(aadhaar_number, ''), lower(coalesce(farmer_name, ''))) || '|' ||
    coalesce(nullif(ppb_number, ''), coalesce(mobile_number, '')) || '|' ||
    lower(coalesce(village, '')) || '|' ||
    lower(coalesce(survey_number, '')) || '|' ||
    coalesce(booking_date::text, '')
  ) stored
);

create table if not exists public.urea_dealer_stock (
  id uuid primary key default gen_random_uuid(),
  dealer_name text,
  firm_name text,
  ifms_id text,
  village text,
  mandal text,
  opening_stock numeric,
  receipts numeric,
  sales numeric,
  closing_stock numeric,
  stock_date date,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  dedupe_key text generated always as (
    lower(coalesce(nullif(ifms_id, ''), coalesce(dealer_name, ''), coalesce(firm_name, ''))) || '|' ||
    coalesce(stock_date::text, '')
  ) stored
);

create unique index if not exists idx_urea_farmer_bookings_dedupe on public.urea_farmer_bookings (dedupe_key);
create unique index if not exists idx_urea_dealer_stock_dedupe on public.urea_dealer_stock (dedupe_key);
create index if not exists idx_urea_farmer_bookings_filters on public.urea_farmer_bookings (mandal, village, booking_date, booking_status);
create index if not exists idx_urea_dealer_stock_filters on public.urea_dealer_stock (mandal, village, stock_date);
create index if not exists idx_external_urea_sync_logs_created_at on public.external_urea_sync_logs (created_at desc);

alter table public.external_urea_sync_logs enable row level security;
alter table public.external_urea_reports enable row level security;
alter table public.urea_farmer_bookings enable row level security;
alter table public.urea_dealer_stock enable row level security;

create or replace function public.is_urea_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.email(), auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com'
$$;

create or replace function public.is_urea_officer()
returns boolean
language sql
stable
as $$
  select public.is_urea_admin()
    or lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'officer'
$$;

drop policy if exists "urea sync logs officer read" on public.external_urea_sync_logs;
create policy "urea sync logs officer read" on public.external_urea_sync_logs
  for select to authenticated using (public.is_urea_officer());

drop policy if exists "urea sync logs admin write" on public.external_urea_sync_logs;
create policy "urea sync logs admin write" on public.external_urea_sync_logs
  for all to authenticated using (public.is_urea_admin()) with check (public.is_urea_admin());

drop policy if exists "urea reports officer read" on public.external_urea_reports;
create policy "urea reports officer read" on public.external_urea_reports
  for select to authenticated using (public.is_urea_officer());

drop policy if exists "urea reports admin write" on public.external_urea_reports;
create policy "urea reports admin write" on public.external_urea_reports
  for all to authenticated using (public.is_urea_admin()) with check (public.is_urea_admin());

drop policy if exists "urea farmer bookings officer read" on public.urea_farmer_bookings;
create policy "urea farmer bookings officer read" on public.urea_farmer_bookings
  for select to authenticated using (public.is_urea_officer());

drop policy if exists "urea farmer bookings admin write" on public.urea_farmer_bookings;
create policy "urea farmer bookings admin write" on public.urea_farmer_bookings
  for all to authenticated using (public.is_urea_admin()) with check (public.is_urea_admin());

drop policy if exists "urea dealer stock officer read" on public.urea_dealer_stock;
create policy "urea dealer stock officer read" on public.urea_dealer_stock
  for select to authenticated using (public.is_urea_officer());

drop policy if exists "urea dealer stock admin write" on public.urea_dealer_stock;
create policy "urea dealer stock admin write" on public.urea_dealer_stock
  for all to authenticated using (public.is_urea_admin()) with check (public.is_urea_admin());
