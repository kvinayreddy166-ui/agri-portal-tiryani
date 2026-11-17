-- Dealer name cleanup: expand company suffix 'Co'/'Co.' -> 'Company' and uppercase 'Fpo' -> 'FPO'.
-- 'Co' is only expanded at end-of-name, before a comma/place name, or before Ltd/Limited.
-- 'Co Op', 'Co Operative', 'Co-Operative' etc. are intentionally left unchanged.

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(co)\M\.?(,? +(?:Ltd|Limited|Pitlam|Park|Mahaboob|Bela|Nizamabad|Velugumatla|Karimna)|[.,]|$)', 'Company\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\m(co)\M\.?(,? +(?:Ltd|Limited|Pitlam|Park|Mahaboob|Bela|Nizamabad|Velugumatla|Karimna)|[.,]|$)';

UPDATE public.dealers
SET dealer_name = regexp_replace(dealer_name, '\m(fpo)([0-9]*)\M', 'FPO\2', 'gi'),
    updated_at = now()
WHERE dealer_name ~* '\m(fpo)([0-9]*)\M';
