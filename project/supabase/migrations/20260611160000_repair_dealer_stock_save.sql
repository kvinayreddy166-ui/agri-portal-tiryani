/*
  Repair dealer stock save on databases that missed earlier metadata/RPC migrations.
*/

create extension if not exists pgcrypto;

create or replace function public.is_portal_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com';
$$;

create or replace function public.current_dealer_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'user_metadata' ->> 'dealer_id', '')::uuid;
$$;

create or replace function public.dealer_portal_email(phone text)
returns text
language sql
immutable
as $$
  select 'dealer.' || regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') || '@tiryani.portal';
$$;

alter table if exists public.stock_inventory_lines
  add column if not exists report_date date default current_date,
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
set report_date = coalesce(report_date, created_at::date, current_date)
where report_date is null;

create or replace function public.save_dealer_stock_line(p_line jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dealer_id uuid;
  v_email text;
  v_new_id uuid;
begin
  v_dealer_id := nullif(p_line ->> 'dealer_id', '')::uuid;
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if v_dealer_id is null then
    raise exception 'Dealer account not linked.';
  end if;

  if not (
    public.is_portal_admin()
    or public.current_dealer_id() = v_dealer_id
    or exists (
      select 1
      from public.dealers d
      where d.id = v_dealer_id
        and lower(coalesce(d.portal_email, public.dealer_portal_email(d.phone_number))) = v_email
    )
  ) then
    raise exception 'Not allowed to save stock for this dealer.';
  end if;

  insert into public.stock_inventory_lines (
    dealer_id,
    category,
    serial_no,
    product_type,
    financial_year,
    entry_type,
    firm_name,
    ifms_id,
    crop,
    variety,
    lot_number,
    batch_number,
    company_name,
    technical_name,
    formulation,
    unit,
    invoice_no,
    invoice_date,
    supplier,
    remarks,
    opening_balance,
    receipts,
    total,
    sales,
    closing_balance,
    report_date,
    report_month,
    submitted_by,
    updated_at
  )
  values (
    v_dealer_id,
    coalesce(p_line ->> 'category', 'fertilizer'),
    coalesce((p_line ->> 'serial_no')::int, 1),
    coalesce(nullif(p_line ->> 'product_type', ''), 'Unknown'),
    nullif(p_line ->> 'financial_year', ''),
    coalesce(nullif(p_line ->> 'entry_type', ''), 'daily_stock'),
    nullif(p_line ->> 'firm_name', ''),
    nullif(p_line ->> 'ifms_id', ''),
    nullif(p_line ->> 'crop', ''),
    nullif(p_line ->> 'variety', ''),
    nullif(p_line ->> 'lot_number', ''),
    nullif(p_line ->> 'batch_number', ''),
    nullif(p_line ->> 'company_name', ''),
    nullif(p_line ->> 'technical_name', ''),
    nullif(p_line ->> 'formulation', ''),
    nullif(p_line ->> 'unit', ''),
    nullif(p_line ->> 'invoice_no', ''),
    nullif(p_line ->> 'invoice_date', '')::date,
    nullif(p_line ->> 'supplier', ''),
    nullif(p_line ->> 'remarks', ''),
    coalesce((p_line ->> 'opening_balance')::numeric, 0),
    coalesce((p_line ->> 'receipts')::numeric, 0),
    coalesce((p_line ->> 'total')::numeric, 0),
    coalesce((p_line ->> 'sales')::numeric, 0),
    coalesce((p_line ->> 'closing_balance')::numeric, 0),
    coalesce(nullif(p_line ->> 'report_date', '')::date, current_date),
    coalesce(nullif(p_line ->> 'report_month', ''), to_char(current_date, 'YYYY-MM')),
    nullif(p_line ->> 'submitted_by', ''),
    coalesce(nullif(p_line ->> 'updated_at', '')::timestamptz, now())
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

grant execute on function public.save_dealer_stock_line(jsonb) to authenticated;
