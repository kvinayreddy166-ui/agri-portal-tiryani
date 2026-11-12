const fs = require('fs');
const esbuild = require('G:/agri-portal-tiryani/project/node_modules/esbuild');
esbuild.buildSync({
  entryPoints: ['G:/agri-portal-tiryani/project/src/shared/data/telanganaDistrictMandalData.ts'],
  bundle: true, format: 'cjs', platform: 'node',
  outfile: 'G:/agri-portal-tiryani/scratch/_dd.cjs',
});
const d = require('G:/agri-portal-tiryani/scratch/_dd.cjs');
const squash = (s) => s.replace(/\([^)]*\)/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// squashed mandal -> Set of normalized districts
const mandalDistricts = new Map();
for (const [district, mandals] of Object.entries(d.TELANGANA_DISTRICT_MANDAL_MAPPING)) {
  const canon = d.normalizeDistrictName(district);
  for (const mandal of mandals) {
    const key = squash(mandal);
    if (!mandalDistricts.has(key)) mandalDistricts.set(key, { districts: new Set(), name: mandal });
    mandalDistricts.get(key).districts.add(canon);
  }
}
const unambiguous = [...mandalDistricts.entries()].filter(([, v]) => v.districts.size === 1);
console.log('unambiguous:', unambiguous.length);

const esc = (s) => s.replace(/'/g, "''");
const rows = unambiguous.map(([sq, v]) => {
  const districtSet = [...v.districts];
  const canonKey = Object.keys(d.TELANGANA_DISTRICT_MANDAL_MAPPING).find(
    (k) => d.normalizeDistrictName(k) === districtSet[0]
  ) || districtSet[0];
  return `  ('${sq}', '${esc(v.name)}', '${esc(canonKey)}')`;
});

const sql = `-- Normalize dealers.mandal to the canonical mandal name (strips '(V)'/'(M)'
-- style markers and fixes casing/spacing via squashed matching) and correct
-- dealers.district to the mandal's actual district for unambiguous mandals.
-- Ambiguous mandal names (present under multiple districts) are skipped.

CREATE TEMP TABLE _mandal_norm (squashed text PRIMARY KEY, mandal text, district text) ON COMMIT DROP;

INSERT INTO _mandal_norm (squashed, mandal, district) VALUES
${rows.join(',\n')};

UPDATE public.dealers d
SET mandal = m.mandal,
    district = m.district
FROM _mandal_norm m
WHERE d.mandal IS NOT NULL
  AND btrim(d.mandal) <> ''
  AND lower(regexp_replace(regexp_replace(btrim(d.mandal), '\\([^)]*\\)', '', 'g'), '[^a-zA-Z0-9]', '', 'g')) = m.squashed;
`;
fs.writeFileSync('G:/agri-portal-tiryani/supabase/migrations/20261128000000_normalize_dealer_mandal.sql', sql);
console.log('written');
