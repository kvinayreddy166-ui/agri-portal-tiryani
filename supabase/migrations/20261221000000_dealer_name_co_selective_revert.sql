-- Revert the broad 'Co'->'Company' expansion, then re-apply it ONLY where the
-- word preceding 'Co' is Trading / Producer / Producers / Produce.
-- Step 1 is guarded by the exact updated_at timestamp of the original bulk
-- update so dealers that already contained 'Company' are never touched.

-- Step 1: revert Company -> Co for the rows changed by 20261220000000
UPDATE public.dealers
SET dealer_name = regexp_replace(
      dealer_name,
      '\m(company)\M\.?(,? +(?:Ltd|Limited|Pitlam|Park|Mahaboob|Bela|Nizamabad|Velugumatla|Karimna)|[.,]|$)',
      'Co\2',
      'gi'),
    updated_at = now()
WHERE updated_at = '2026-11-17T10:47:43.103186+00:00'::timestamptz
  AND dealer_name ~* '\m(company)\M\.?(,? +(?:Ltd|Limited|Pitlam|Park|Mahaboob|Bela|Nizamabad|Velugumatla|Karimna)|[.,]|$)';

-- Step 2: re-apply Co -> Company only after Trading/Producer/Producers/Produce
UPDATE public.dealers
SET dealer_name = regexp_replace(
      dealer_name,
      '\m(trading|producer|producers|produce)\M( +)(co)\M\.?(,? +(?:Ltd|Limited|Pitlam|Park|Mahaboob|Bela|Nizamabad|Velugumatla|Karimna)|[.,]|$)',
      '\1\2Company\4',
      'gi'),
    updated_at = now()
WHERE dealer_name ~* '\m(trading|producer|producers|produce)\M( +)(co)\M\.?(,? +(?:Ltd|Limited|Pitlam|Park|Mahaboob|Bela|Nizamabad|Velugumatla|Karimna)|[.,]|$)';
