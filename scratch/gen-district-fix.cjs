const fs = require('fs');
const esbuild = require('G:/agri-portal-tiryani/project/node_modules/esbuild');
esbuild.buildSync({
  entryPoints: ['G:/agri-portal-tiryani/project/src/shared/data/telanganaDistrictMandalData.ts'],
  bundle: true, format: 'cjs', platform: 'node',
  outfile: 'G:/agri-portal-tiryani/scratch/_dd.cjs',
});
const d = require('G:/agri-portal-tiryani/scratch/_dd.cjs');

// mandal (lowercase) -> Set of normalized districts
const mandalDistricts = new Map();
for (const [district, mandals] of Object.entries(d.TELANGANA_DISTRICT_MANDAL_MAPPING)) {
  const canon = d.normalizeDistrictName(district);
  for (const mandal of mandals) {
    const key = mandal.trim().toLowerCase();
    if (!mandalDistricts.has(key)) mandalDistricts.set(key, new Set());
    mandalDistricts.get(key).add(canon);
  }
}
const unambiguous = [...mandalDistricts.entries()].filter(([, s]) => s.size === 1);
const ambiguous = [...mandalDistricts.entries()].filter(([, s]) => s.size > 1);
console.log('unambiguous:', unambiguous.length, 'ambiguous skipped:', ambiguous.length);
ambiguous.forEach(([m, s]) => console.log('  skip:', m, '->', [...s].join(' | ')));

const esc = (s) => s.replace(/'/g, "''");
const rows = unambiguous.map(([mandal, s]) => {
  const district = [...s][0];
  // find canonical display casing from the mapping keys
  const canonKey = Object.keys(d.TELANGANA_DISTRICT_MANDAL_MAPPING).find(
    (k) => d.normalizeDistrictName(k) === district
  ) || district;
  return `  ('${esc(mandal)}', '${esc(canonKey)}')`;
});

const sql = `-- Correct dealers.district when the stored district conflicts with the
-- dealer's mandal (e.g. mandal 'Jagdevpur' belongs to Siddipet, not
-- Kumurambheem Asifabad). Uses the official district->mandal mapping.
-- Only unambiguous mandal->district pairs are included; mandals that exist
-- under multiple districts are skipped to avoid wrong corrections.
-- Only updates rows whose district differs from the mandal's actual district.

CREATE TEMP TABLE _mandal_district (mandal text PRIMARY KEY, district text) ON COMMIT DROP;

INSERT INTO _mandal_district (mandal, district) VALUES
${rows.join(',\n')};

UPDATE public.dealers d
SET district = m.district
FROM _mandal_district m
WHERE d.mandal IS NOT NULL
  AND btrim(d.mandal) <> ''
  AND lower(btrim(d.mandal)) = lower(m.mandal)
  AND lower(regexp_replace(COALESCE(d.district, ''), '[^a-zA-Z0-9]', '', 'g'))
      <> lower(regexp_replace(m.district, '[^a-zA-Z0-9]', '', 'g'));
`;
fs.writeFileSync('G:/agri-portal-tiryani/supabase/migrations/20261127000000_fix_dealer_district_from_mandal.sql', sql);
console.log('written');
