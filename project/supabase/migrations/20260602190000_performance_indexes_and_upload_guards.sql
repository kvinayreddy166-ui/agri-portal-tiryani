-- Speeds up the highest-traffic portal reads used by statutory forms and crop intelligence.
create index if not exists idx_forms_downloads_category_created_at
  on public.forms_downloads (category, created_at desc);

create index if not exists idx_crops_slug
  on public.crops (slug);

do $$
begin
  if to_regclass('public.crop_faqs') is not null then
    create index if not exists idx_crop_faqs_crop_category
      on public.crop_faqs (crop_id, category);
  end if;

  if to_regclass('public.crop_images') is not null then
    create index if not exists idx_crop_images_crop_entity
      on public.crop_images (crop_id, entity_type);
  end if;

  if to_regclass('public.crop_varieties') is not null then
    create index if not exists idx_crop_varieties_crop
      on public.crop_varieties (crop_id);
  end if;

  if to_regclass('public.crop_pests') is not null then
    create index if not exists idx_crop_pests_crop
      on public.crop_pests (crop_id);
  end if;

  if to_regclass('public.crop_diseases') is not null then
    create index if not exists idx_crop_diseases_crop
      on public.crop_diseases (crop_id);
  end if;

  if to_regclass('public.crop_fertilizers') is not null then
    create index if not exists idx_crop_fertilizers_crop
      on public.crop_fertilizers (crop_id);
  end if;

  if to_regclass('public.crop_advisories') is not null then
    create index if not exists idx_crop_advisories_crop
      on public.crop_advisories (crop_id);
  end if;
end $$;
