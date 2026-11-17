-- Extend selective 'Co'->'Company' rule: also apply after 'Trdg' (Trading abbrev).
UPDATE public.dealers
SET dealer_name = regexp_replace(
      dealer_name,
      '\m(trading|trdg|producer|producers|produce)\M( +)(co)\M\.?(,? +(?:Ltd|Limited|Pitlam|Park|Mahaboob|Bela|Nizamabad|Velugumatla|Karimna)|[.,]|$)',
      '\1\2Company\4',
      'gi'),
    updated_at = now()
WHERE dealer_name ~* '\m(trading|trdg|producer|producers|produce)\M( +)(co)\M\.?(,? +(?:Ltd|Limited|Pitlam|Park|Mahaboob|Bela|Nizamabad|Velugumatla|Karimna)|[.,]|$)';
