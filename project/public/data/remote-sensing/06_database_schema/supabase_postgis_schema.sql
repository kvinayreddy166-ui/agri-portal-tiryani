-- Telangana Remote Sensing Project - suggested Supabase/PostGIS schema
-- Enable extensions in Supabase SQL editor if not enabled:
-- create extension if not exists postgis;

create table if not exists admin_districts (
  district_code integer primary key,
  district_name text not null,
  area_sq_km numeric,
  area_acres numeric,
  geom geometry(MultiPolygon, 4326)
);

create table if not exists admin_mandals (
  block_mandal_code integer primary key,
  district_code integer references admin_districts(district_code),
  district_name text,
  block_mandal_name text not null,
  villages integer,
  area_sq_km numeric,
  area_acres numeric,
  geom geometry(MultiPolygon, 4326)
);

create table if not exists admin_villages (
  village_code text primary key,
  habitation_code text,
  village_name text not null,
  block_mandal_code integer references admin_mandals(block_mandal_code),
  block_mandal_name text,
  district_code integer references admin_districts(district_code),
  district_name text,
  area_ha numeric,
  area_sq_km numeric,
  area_acres numeric,
  centroid_lat numeric,
  centroid_lon numeric,
  geom geometry(MultiPolygon, 4326)
);

create table if not exists crop_health_farm_samples (
  farm_id bigint primary key,
  split text,
  health_category text,
  crop text,
  source_district_current_sample text,
  source_subdistrict_current_sample text,
  admin_village_code text references admin_villages(village_code),
  admin_old_block_mandal_code integer,
  admin_old_district_code integer,
  sowing_date date,
  harvest_date date,
  crop_duration_days integer,
  season text,
  crop_covered_area numeric,
  crop_height numeric,
  irrigation_type text,
  irrigation_source text,
  irrigation_count integer,
  water_coverage numeric,
  expected_yield numeric,
  centroid_lat numeric,
  centroid_lon numeric,
  field_area_ha_from_polygon numeric,
  geom geometry(Polygon, 4326)
);

create table if not exists satellite_observations (
  id bigserial primary key,
  observation_date date not null,
  level text not null check (level in ('farm','village','mandal','district')),
  farm_id bigint,
  village_code text,
  block_mandal_code integer,
  district_code integer,
  crop text,
  ndvi numeric,
  ndre numeric,
  ndmi numeric,
  ndwi numeric,
  savi numeric,
  sentinel1_vv numeric,
  sentinel1_vh numeric,
  rainfall_mm numeric,
  cloud_pct numeric,
  stress_score numeric,
  stress_class text,
  created_at timestamptz default now()
);

create index if not exists idx_admin_villages_geom on admin_villages using gist (geom);
create index if not exists idx_crop_samples_geom on crop_health_farm_samples using gist (geom);
create index if not exists idx_satellite_obs_village_date on satellite_observations (village_code, observation_date);
create index if not exists idx_satellite_obs_farm_date on satellite_observations (farm_id, observation_date);