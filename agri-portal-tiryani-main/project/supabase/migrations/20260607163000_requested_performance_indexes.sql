-- Additional indexes requested for list navigation, filtered reads, and crop intelligence.
do $$
begin
  if to_regclass('public.forms_downloads') is not null then
    create index if not exists idx_forms_downloads_category_created_at
      on public.forms_downloads (category, created_at desc);
  end if;

  if to_regclass('public.farm_mechanization_documents') is not null then
    create index if not exists idx_farm_docs_year_created_at
      on public.farm_mechanization_documents (financial_year, created_at desc);
  end if;

  if to_regclass('public.quality_control_samples') is not null then
    create index if not exists idx_quality_samples_cat_year_date
      on public.quality_control_samples (category, financial_year, sample_date desc);
  end if;

  if to_regclass('public.quality_control_targets') is not null then
    create unique index if not exists idx_quality_targets_cat_year
      on public.quality_control_targets (category, financial_year);
  end if;

  if to_regclass('public.subsidy_cell_records') is not null then
    create index if not exists idx_subsidy_program_year
      on public.subsidy_cell_records (program, financial_year desc);
  end if;

  if to_regclass('public.stock_inventory_lines') is not null then
    create index if not exists idx_stock_lines_dealer_cat_date_serial
      on public.stock_inventory_lines (dealer_id, category, report_date, serial_no);
  end if;

  if to_regclass('public.crop_intelligence') is not null then
    create index if not exists idx_crop_intelligence_slug
      on public.crop_intelligence (slug);
  end if;

  if to_regclass('public.crop_faqs') is not null then
    create index if not exists idx_crop_faqs_crop_category
      on public.crop_faqs (crop_id, category);
  end if;
end $$;
