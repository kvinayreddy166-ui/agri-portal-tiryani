-- Uppercase 'Fpc' -> 'FPC' and 'Fsc' -> 'FSC' in dealer names (digit suffix preserved).
UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(fpc)([0-9]*)\M', 'FPC\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mfpc[0-9]*\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(fsc)([0-9]*)\M', 'FSC\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mfsc[0-9]*\M';
