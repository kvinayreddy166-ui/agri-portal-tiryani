-- Remove duplicated 'Sticides' tail and fix 'Ai' -> 'Sai' dealer name.
UPDATE public.dealers SET dealer_name='Sai Seeds and Pesticides', updated_at=now() WHERE id='2ec599df-7b24-4a7e-ac10-4a67c21fe3c8';
UPDATE public.dealers SET dealer_name=regexp_replace(dealer_name, '\mSticides\M\.?\s*$', '', 'i'), updated_at=now()
WHERE dealer_name ~* '\mSticides\M\.?\s*$' AND id <> '2ec599df-7b24-4a7e-ac10-4a67c21fe3c8';
