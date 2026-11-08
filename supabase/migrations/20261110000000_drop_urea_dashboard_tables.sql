-- Remove the External Urea Dashboard / portal integration.
-- Drops all tables, functions, policies, indexes and triggers created by the
-- urea dashboard feature (see historical migrations
-- 20260613190000_urea_dashboard_reports.sql,
-- 20260616070000_create_urea_dashboard_tables.sql and
-- 20260617000000_add_detailed_urea_sync_logging.sql).
-- Unrelated "Urea" fertilizer product data is NOT touched.

-- Tables first (CASCADE removes RLS policies, indexes, triggers and FKs,
-- including trigger_update_urea_bookings_updated_at)
drop table if exists public.urea_farmer_match_results cascade;
drop table if exists public.external_urea_report_files cascade;
drop table if exists public.external_urea_bookings cascade;
drop table if exists public.external_urea_reports cascade;
drop table if exists public.urea_farmer_bookings cascade;
drop table if exists public.urea_dealer_stock cascade;
drop table if exists public.external_urea_sync_logs cascade;

-- Functions
drop function if exists public.match_urea_booking_with_farmer(uuid);
drop function if exists public.match_urea_bookings_for_sync(uuid);
drop function if exists public.get_urea_analytics();
drop function if exists public.update_urea_bookings_updated_at();
drop function if exists public.is_urea_admin();
drop function if exists public.is_urea_officer();
