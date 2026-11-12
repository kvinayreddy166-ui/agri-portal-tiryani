const fs = require('fs');
const sql = fs.readFileSync('G:/agri-portal-tiryani/supabase/migrations/20261124000000_strip_decorated_place_names.sql', 'utf8');
const pats = [...sql.matchAll(/'((?:[^'\\]|\\.)*)', '', 'i'\)/g)].map((m) => m[1]);
console.log('patterns found:', pats.length);
pats.forEach((p, i) => console.log(i, p.slice(0, 60), '...', p.slice(-40)));

const placeEnd = pats[1];
const villageEnd = pats[2];
for (const t of [', Tiryani', ', Kumurambheem Asifabad', ', Siddipet District', 'Tiryani', 'Kumurambheem Asifabad', ', Jagdevpur (V) (M)']) {
  console.log(JSON.stringify(t), 'place=>', JSON.stringify(('X' + t).match(new RegExp(placeEnd, 'i'))?.[0]), 'village=>', JSON.stringify(('X' + t).match(new RegExp(villageEnd, 'i'))?.[0]));
}
