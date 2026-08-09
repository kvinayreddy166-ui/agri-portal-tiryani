/*
  Category-specific dealer license numbers for stock module headers.
*/

alter table if exists public.dealers
  add column if not exists fertilizer_license_number text,
  add column if not exists seed_license_number text,
  add column if not exists pesticide_license_number text;

update public.dealers
set fertilizer_license_number = coalesce(nullif(fertilizer_license_number, ''), license_number)
where dealer_category = 'fertilizer'
  and license_number is not null;

update public.dealers
set seed_license_number = coalesce(nullif(seed_license_number, ''), license_number)
where dealer_category = 'seed'
  and license_number is not null;

update public.dealers
set pesticide_license_number = coalesce(nullif(pesticide_license_number, ''), license_number)
where dealer_category = 'pesticide'
  and license_number is not null;
