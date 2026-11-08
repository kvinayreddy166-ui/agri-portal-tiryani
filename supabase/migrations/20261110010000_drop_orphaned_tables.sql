-- Remove orphaned tables whose modules are not active in the app:
-- 1. Pest / Disease / Weed Guide (20260614190000_pest_disease_weed_guide.sql)
--    - No UI or service references these tables; pest/disease content now
--      lives in crop_protection_* and crop_intelligence modules.
-- 2. holiday_calendar (20260902130000_create_tour_diary_tables.sql)
--    - TourDiary uses hardcoded HOLIDAYS_2026 data; table is never queried.
-- 3. crop_protection_translations (20260622090000_crop_protection_guidance.sql)
--    - cropProtectionService never queries this table.
-- The shared `crops` table is NOT dropped (used by Dashboard and crop modules).

-- Pest / Disease / Weed Guide tables (CASCADE removes policies, indexes, FKs)
drop table if exists public.pest_guide_search_analytics cascade;
drop table if exists public.disease_chemical_recommendations cascade;
drop table if exists public.chemical_recommendations cascade;
drop table if exists public.weed_management cascade;
drop table if exists public.insect_pests cascade;
drop table if exists public.diseases cascade;
drop table if exists public.weeds cascade;

-- Tour diary holiday calendar
drop table if exists public.holiday_calendar cascade;

-- Crop protection translations
drop table if exists public.crop_protection_translations cascade;
