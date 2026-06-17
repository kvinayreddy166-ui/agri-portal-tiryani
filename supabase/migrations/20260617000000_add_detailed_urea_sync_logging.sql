-- Add detailed logging fields to external_urea_sync_logs table
alter table public.external_urea_sync_logs
  add column if not exists login_status text,
  add column if not exists api_status text,
  add column if not exists http_code integer,
  add column if not exists records_fetched integer default 0,
  add column if not exists records_inserted integer default 0,
  add column if not exists records_updated integer default 0,
  add column if not exists detailed_error_message text;
