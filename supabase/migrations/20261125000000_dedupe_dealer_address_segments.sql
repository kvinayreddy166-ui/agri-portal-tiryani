-- Collapse consecutive duplicate comma-separated segments in dealer addresses.
-- e.g. '5-22/1, Main Road, Main Road, Munigadapa' -> '5-22/1, Main Road, Munigadapa'
-- Two passes handle runs of 3+ duplicates. Case-insensitive matching.

UPDATE public.dealers
SET location = btrim(
  regexp_replace(
    regexp_replace(location, '(,\s*([^,]+?))\s*,\s*\2\s*(?=,|$)', '\1', 'gi'),
    '(,\s*([^,]+?))\s*,\s*\2\s*(?=,|$)', '\1', 'gi'
  )
)
WHERE location ~* ',\s*([^,]+?)\s*,\s*\1';
