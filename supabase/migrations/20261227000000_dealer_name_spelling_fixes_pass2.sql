-- Pass 2: truncated agri words (Fertil*/Kendr*) and merged-token spelling fixes.

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertil\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertil\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFertili\M', 'Fertilizers', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFertili\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mKendr\M', 'Kendram', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mKendr\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mKendh\M', 'Kendram', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mKendh\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mKendraam\M', 'Kendram', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mKendraam\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mKendaram\M', 'Kendram', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mKendaram\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mFerttilizer\M', 'Fertilizer', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mFerttilizer\M';

UPDATE public.dealers
SET dealer_name = replace(dealer_name, 'Fertiliserdepot Gandh', 'Fertilizer Depot Gandhinagar'),
    updated_at = now()
WHERE dealer_name ILIKE '%Fertiliserdepot Gandh%';

UPDATE public.dealers
SET dealer_name = replace(dealer_name, 'Andfertilisers', 'And Fertilizers'),
    updated_at = now()
WHERE dealer_name ILIKE '%Andfertilisers%';

UPDATE public.dealers
SET dealer_name = replace(dealer_name, 'Fertilserravigudem', 'Fertilizers Ravigudem'),
    updated_at = now()
WHERE dealer_name ILIKE '%Fertilserravigudem%';

UPDATE public.dealers
SET dealer_name = replace(dealer_name, 'Fertiliserpocharam', 'Fertilizers Pocharam'),
    updated_at = now()
WHERE dealer_name ILIKE '%Fertiliserpocharam%';

UPDATE public.dealers
SET dealer_name = replace(dealer_name, 'Fertilisersand', 'Fertilizers and'),
    updated_at = now()
WHERE dealer_name ILIKE '%Fertilisersand%';

UPDATE public.dealers
SET dealer_name = replace(dealer_name, 'Fertiliserskammarpally', 'Fertilizers Kammarpally'),
    updated_at = now()
WHERE dealer_name ILIKE '%Fertiliserskammarpally%';

UPDATE public.dealers
SET dealer_name = replace(dealer_name, 'Kendrambeebra', 'Kendram Beebra'),
    updated_at = now()
WHERE dealer_name ILIKE '%Kendrambeebra%';

UPDATE public.dealers
SET dealer_name = replace(dealer_name, 'Rythunfetilizers', 'Rythu Fertilizers'),
    updated_at = now()
WHERE dealer_name ILIKE '%Rythunfetilizers%';

UPDATE public.dealers
SET dealer_name = replace(dealer_name, 'Rarajeshwarifrtilizers', 'Rarajeshwari Fertilizers'),
    updated_at = now()
WHERE dealer_name ILIKE '%Rarajeshwarifrtilizers%';

