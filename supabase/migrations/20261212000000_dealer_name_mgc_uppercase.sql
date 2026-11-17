-- Fix: previous migration's WHERE clause for 'mgc' was '\mgc\M' (matches word "gc"),
-- so 'Mgc' dealer names were never updated. Correct pattern is '\mmgc\M'.
UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mmgc\M', 'MGC', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\mmgc\M';
