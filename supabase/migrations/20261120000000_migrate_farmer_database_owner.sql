-- =====================================================================
-- Migration: 20261120000000_migrate_farmer_database_owner.sql
-- Description: Re-attributes farmer_database rows created/updated by the
--              portal admin (k.vinayreddy166@gmail.com) to the elevated
--              officer account (agofficetiryani@gmail.com).
--              farmer_database is shared read for all authenticated users;
--              only the audit columns change. Rows created by other
--              accounts are untouched.
-- =====================================================================

UPDATE public.farmer_database
   SET created_by = 'agofficetiryani@gmail.com'
 WHERE created_by = 'k.vinayreddy166@gmail.com';

UPDATE public.farmer_database
   SET updated_by = 'agofficetiryani@gmail.com'
 WHERE updated_by = 'k.vinayreddy166@gmail.com';
