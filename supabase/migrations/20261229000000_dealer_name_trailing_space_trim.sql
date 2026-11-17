-- Trim trailing whitespace left by the 'Sticides' tail removal.
UPDATE public.dealers
SET dealer_name = btrim(dealer_name),
    updated_at = now()
WHERE dealer_name <> btrim(dealer_name);
