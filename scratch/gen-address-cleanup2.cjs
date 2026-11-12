const fs = require('fs');
const path = require('path');
const esbuild = require('G:/agri-portal-tiryani/project/node_modules/esbuild');

const tmp = 'G:/agri-portal-tiryani/scratch/_district_data.cjs';
esbuild.buildSync({
  entryPoints: ['G:/agri-portal-tiryani/project/src/shared/data/telanganaDistrictMandalData.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile: tmp,
});
const data = require(tmp);

const names = new Set();
for (const d of data.TELANGANA_DISTRICTS) names.add(d);
for (const list of Object.values(data.TELANGANA_DISTRICT_MANDAL_MAPPING)) list.forEach((n) => names.add(n));
for (const list of Object.values(data.DISTRICT_DIVISION_MAPPING)) list.forEach((n) => names.add(n));
for (const list of Object.values(data.DIVISION_MANDAL_MAPPING)) list.forEach((n) => names.add(n));
for (const k of Object.keys(data.TELANGANA_DISTRICT_MANDAL_MAPPING)) names.add(k);
for (const k of Object.keys(data.DISTRICT_DIVISION_MAPPING)) names.add(k);
for (const k of Object.keys(data.DIVISION_MANDAL_MAPPING)) names.add(k);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const OFFICIAL = [...names].filter((n) => n && n.length > 2).sort((a, b) => b.length - a.length).map(esc).join('|');
console.log('names:', names.size);

const PIN_STRIP = '-\\s*\\d{6}\\s*$';
const PLACE_END = '(,\\s*(' + OFFICIAL + ')(?:\\s+(?:District|Dist\\.?))?(?:\\s*\\([A-Za-z]{1,4}\\))*)+\\s*$';
const VILLAGE_END = '(,\\s*[^,]*\\((?:V|M|U)\\)[^,]*)+\\s*$';

const WHERE =
  "location ~* '(" + OFFICIAL + ")(?:\\s+(?:District|Dist\\.?))?(?:\\s*\\([^)]*\\))*\\s*(-\\s*\\d{6})?\\s*$' " +
  "OR location ~* '\\((?:V|M|U)\\)[^,]*\\s*(-\\s*\\d{6})?\\s*$'";

const sql = `-- Second pass: strip decorated place-name suffixes from dealer addresses.
-- Handles formats like:
--   'Door No.3-17/1, Shivalayam Road, Opp Flour Mill, Jagdevpur (V) (M), Siddipet District - 502281'
--   -> 'Door No.3-17/1, Shivalayam Road, Opp Flour Mill'
-- Covers: trailing pincodes, '<Name> District' suffixes, (V)/(M)/(U) village
-- markers, and village names not in the official mandal list.

UPDATE public.dealers
SET location = btrim(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(location, '${PIN_STRIP}', '', 'i'),
          '${PLACE_END}', '', 'i'),
        '${VILLAGE_END}', '', 'i'),
      '${PLACE_END}', '', 'i'),
    '${PIN_STRIP}', '', 'i')
)
WHERE ${WHERE};
`;
fs.writeFileSync('G:/agri-portal-tiryani/supabase/migrations/20261124000000_strip_decorated_place_names.sql', sql);
console.log('written, sql bytes:', sql.length);
