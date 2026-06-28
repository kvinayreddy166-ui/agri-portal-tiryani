-- Remote Sensing live observations cache/history.
-- Safe additive migration: creates only new remote_sensing_* objects and does not alter existing modules.

create table if not exists public.remote_sensing_observations (
  id uuid primary key default gen_random_uuid(),
  village_code text not null,
  village_name text,
  district_name text,
  mandal_name text,
  acquisition_start date not null,
  acquisition_end date not null,
  source text not null default 'Google Earth Engine',
  ndvi numeric,
  ndre numeric,
  ndmi numeric,
  ndwi numeric,
  savi numeric,
  sentinel1_vv numeric,
  sentinel1_vh numeric,
  sentinel1_vh_vv numeric,
  rainfall_mm numeric,
  rainfall_normal_mm numeric,
  rainfall_anomaly_mm numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (village_code, acquisition_start, acquisition_end, source)
);

create index if not exists remote_sensing_observations_village_idx
  on public.remote_sensing_observations (village_code, acquisition_end desc);

create index if not exists remote_sensing_observations_period_idx
  on public.remote_sensing_observations (acquisition_start, acquisition_end);

alter table public.remote_sensing_observations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'remote_sensing_observations'
      and policyname = 'Authenticated users can read remote sensing observations'
  ) then
    create policy "Authenticated users can read remote sensing observations"
      on public.remote_sensing_observations
      for select
      to authenticated
      using (true);
  end if;
end $$;

grant select on public.remote_sensing_observations to authenticated;
