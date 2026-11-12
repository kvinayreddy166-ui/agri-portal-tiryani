const fs = require('fs');
const src = fs.readFileSync('G:/agri-portal-tiryani/project/src/shared/data/telanganaDistrictMandalData.ts', 'utf8');
const regions = [
  ['export const TELANGANA_DISTRICTS', 'export const QUALIFICATION_OPTIONS'],
  ['export const DISTRICT_DIVISION_MAPPING', 'export function getDivisionsForDistrict'],
  ['export const DIVISION_MANDAL_MAPPING', 'export function getMandalsForDivision'],
];
const names = new Set();
for (const [a, b] of regions) {
  const i = src.indexOf(a), j = src.indexOf(b);
  const seg = src.slice(i, j);
  for (const m of seg.matchAll(/'([^']+)'/g)) names.add(m[1]);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const list = [...names].filter((n) => n.length > 2).sort((a, b) => b.length - a.length).map(esc);
console.log('names:', list.length);
const pattern = '(,\\s*(' + list.join('|') + '))+\\s*$';
const sql = `-- Strip trailing mandal/district place names from dealer addresses.
-- e.g. '1-58/a/1, Main Road, Tiryani, Kumurambheem Asifabad' -> '1-58/a/1, Main Road'
-- Only removes comma-separated suffix segments that exactly match an official
-- Telangana district/division/mandal name; street addresses are untouched.

UPDATE public.dealers
SET location = btrim(regexp_replace(location, '${pattern}', '', 'i'))
WHERE location ~* '${pattern}';
`;
fs.writeFileSync('G:/agri-portal-tiryani/supabase/migrations/20261123000000_strip_place_names_from_dealer_address.sql', sql);
console.log('written, pattern length:', pattern.length);
