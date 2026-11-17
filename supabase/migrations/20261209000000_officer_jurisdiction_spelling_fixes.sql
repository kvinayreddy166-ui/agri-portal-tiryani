-- Fix officer_profiles jurisdiction spellings so they match dealer district/mandal values.
-- Several MAO/AEO profiles used spellings that never matched any dealer row,
-- leaving those officers with an empty dealer directory.

UPDATE public.officer_profiles SET mandal = 'Talamadugu'   WHERE district = 'Adilabad'               AND mandal = 'Talamadagu';
UPDATE public.officer_profiles SET mandal = 'Dichpally'    WHERE district = 'Nizamabad'              AND mandal = 'Dichpalle';
UPDATE public.officer_profiles SET mandal = 'Mulkalapally' WHERE district = 'Bhadradri Kothagudem'  AND mandal = 'Mulakalapally';
UPDATE public.officer_profiles SET mandal = 'Armoor'       WHERE district = 'Nizamabad'              AND mandal = 'Armur';
UPDATE public.officer_profiles SET district = 'Hanamkonda' WHERE district = 'Hanumakonda';
UPDATE public.officer_profiles SET mandal = 'Gudihatnoor'  WHERE district = 'Adilabad'               AND mandal = 'Gudihathnur';
