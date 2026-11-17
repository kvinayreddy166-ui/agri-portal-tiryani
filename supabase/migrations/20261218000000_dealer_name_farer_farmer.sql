-- Fix misspelling 'Farer' -> 'Farmer' in dealer names
UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, 'mfarerM', 'Farmer', 'i'),
    updated_at = now()
WHERE dealer_name ~* 'mfarerM';
