-- Fix misspelling farer -> Farmer in dealer names (word-boundary match)
UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mfarer\M', 'Farmer', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\mfarer\M';
