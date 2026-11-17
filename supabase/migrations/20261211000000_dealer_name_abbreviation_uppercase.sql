-- Uppercase statutory dealer-type abbreviations in dealer names.
-- Word-boundary, case-insensitive match so already-correct PACS/MGC/etc. are
-- untouched and the update is idempotent. Applies to public.dealers.dealer_name
-- only, matching the convention of the earlier dealer_name cleanup migrations.
-- Note: \m/\M are PostgreSQL word-boundary constraints, so 'dcms' can never
-- match inside 'kdcms' — ordering between the two rules does not matter.

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mmgc\M', 'MGC', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\mgc\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mpacs\M', 'PACS', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\mpacs\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mtrn\M', 'TRN', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\mtrn\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\marsk\M', 'ARSK', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\marsk\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mhaca\M', 'HACA', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\mhaca\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mfp\M', 'FPO', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\mfp\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mkdcms\M', 'KDCMS', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\mkdcms\M';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\mdcms\M', 'DCMS', 'i'),
    updated_at = now()
WHERE dealer_name ~* '\mdcms\M';
