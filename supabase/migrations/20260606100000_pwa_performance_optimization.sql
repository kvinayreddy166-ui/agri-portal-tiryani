-- Indexes for the PWA performance pass: bounded lists, date filters, and offline-friendly reads.
do $$
begin
  if to_regclass('public.dealers') is not null then
    create index if not exists idx_dealers_category_name
      on public.dealers (dealer_category, dealer_name);
    create index if not exists idx_dealers_name
      on public.dealers (dealer_name);
  end if;

  if to_regclass('public.dealer_stock_allocation') is not null then
    create index if not exists idx_dealer_stock_allocation_updated
      on public.dealer_stock_allocation (last_updated desc);
    create index if not exists idx_dealer_stock_allocation_dealer_updated
      on public.dealer_stock_allocation (dealer_id, last_updated desc);
    create index if not exists idx_dealer_stock_allocation_invoice_date
      on public.dealer_stock_allocation (invoice_date desc);
    create index if not exists idx_dealer_stock_allocation_fertilizer
      on public.dealer_stock_allocation (fertilizer_type);
  end if;

  if to_regclass('public.stock_inventory_lines') is not null then
    create index if not exists idx_stock_inventory_lines_category_date
      on public.stock_inventory_lines (category, report_date desc, dealer_id);
    create index if not exists idx_stock_inventory_lines_category_month
      on public.stock_inventory_lines (category, report_month desc, dealer_id);
    create index if not exists idx_stock_inventory_lines_product_type
      on public.stock_inventory_lines (product_type);
  end if;

  if to_regclass('public.scheme_beneficiaries') is not null then
    create index if not exists idx_scheme_beneficiaries_scheme_year
      on public.scheme_beneficiaries (scheme_id, financial_year desc);
  end if;

  if to_regclass('public.subsidy_cell_records') is not null then
    create index if not exists idx_subsidy_cell_records_program_year
      on public.subsidy_cell_records (program, financial_year desc);
    create index if not exists idx_subsidy_cell_records_created_at
      on public.subsidy_cell_records (created_at desc);
  end if;

  if to_regclass('public.excel_uploads') is not null then
    create index if not exists idx_excel_uploads_created_at
      on public.excel_uploads (created_at desc);
  end if;

  if to_regclass('public.gos_circulars') is not null then
    create index if not exists idx_gos_circulars_created_at
      on public.gos_circulars (created_at desc);
  end if;

  if to_regclass('public.farm_mechanization_documents') is not null then
    create index if not exists idx_farm_mechanization_documents_created_at
      on public.farm_mechanization_documents (created_at desc);
  end if;

  if to_regclass('public.quality_control_samples') is not null then
    create index if not exists idx_quality_control_samples_created_at
      on public.quality_control_samples (created_at desc);
    create index if not exists idx_quality_control_samples_category_year
      on public.quality_control_samples (category, financial_year);
  end if;
end $$;
