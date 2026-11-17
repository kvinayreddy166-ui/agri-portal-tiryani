-- Uppercase abbreviation tokens even when fused with trailing digits
-- (e.g. 'Kdcms2' -> 'KDCMS2', 'Arsk1' -> 'ARSK1'). Digit suffix is preserved.
UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(mgc)([0-9]*)\M', 'MGC\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mmgc[0-9]*\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(pacs)([0-9]*)\M', 'PACS\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mpacs[0-9]*\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(trn)([0-9]*)\M', 'TRN\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mtrn[0-9]*\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(arsk)([0-9]*)\M', 'ARSK\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\marsk[0-9]*\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(haca)([0-9]*)\M', 'HACA\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mhaca[0-9]*\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(fp)([0-9]*)\M', 'FPO\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mfp[0-9]*\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(kdcms)([0-9]*)\M', 'KDCMS\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mkdcms[0-9]*\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(dcms)([0-9]*)\M', 'DCMS\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\mdcms[0-9]*\M';
