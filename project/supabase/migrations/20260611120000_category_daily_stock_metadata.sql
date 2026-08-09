/*
  Category-wise daily stock metadata for fertilizer, seed, and pesticide entries.
*/

alter table if exists public.stock_inventory_lines
  add column if not exists financial_year text,
  add column if not exists entry_type text default 'daily_stock',
  add column if not exists firm_name text,
  add column if not exists ifms_id text,
  add column if not exists crop text,
  add column if not exists variety text,
  add column if not exists lot_number text,
  add column if not exists batch_number text,
  add column if not exists company_name text,
  add column if not exists technical_name text,
  add column if not exists formulation text,
  add column if not exists unit text,
  add column if not exists invoice_no text,
  add column if not exists invoice_date date,
  add column if not exists supplier text,
  add column if not exists remarks text;

update public.stock_inventory_lines
set
  financial_year = case
    when extract(month from report_date::date) >= 4
      then extract(year from report_date::date)::int::text || '-' || lpad(((extract(year from report_date::date)::int + 1) % 100)::text, 2, '0')
    else (extract(year from report_date::date)::int - 1)::text || '-' || lpad((extract(year from report_date::date)::int % 100)::text, 2, '0')
  end,
  entry_type = coalesce(entry_type, 'daily_stock')
where report_date is not null
  and (financial_year is null or entry_type is null);

create index if not exists idx_stock_inventory_financial_year
  on public.stock_inventory_lines (financial_year, category, report_date desc);

create index if not exists idx_stock_inventory_entry_type
  on public.stock_inventory_lines (entry_type);
