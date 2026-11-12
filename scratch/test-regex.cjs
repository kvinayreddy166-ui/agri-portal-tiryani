const fs = require('fs');
const sql = fs.readFileSync('G:/agri-portal-tiryani/supabase/migrations/20261124000000_strip_decorated_place_names.sql', 'utf8');
const pats = [...sql.matchAll(/'((?:[^'\\]|\\.)*)', '', 'i'\)/g)].map((m) => m[1]);
let where = sql.match(/WHERE ([\s\S]+);/)[1].trim();
if (where.endsWith("'")) where = where.slice(0, -1);
const samples = [
  'Door No.3-17/1, Shivalayam Road, Opp Flour Mill,  Jagdevpur (V) (M), Siddipet District - 502281',
  '1-58/a/1, Main Road, Tiryani, Kumurambheem Asifabad',
  'H.No. 12-3/4, Station Road',
  'D.No. 5-21/3, Market Road, Tiryani - 502281',
  'Shop No 4, Gandhi Nagar, Hyderabad',
  'Main Road, Near Bus Stand, Bheemini',
  'D.No.1-1, Ameerpet, Hyderabad - 500016',
];
const rep = (s, p) => s.replace(new RegExp(p, 'i'), '');
const whereRe = new RegExp(where, 'i');
for (const s of samples) {
  const w = whereRe.test(s);
  let out = s;
  for (const p of pats) out = rep(out, p);
  console.log('WHERE=' + w, '|', JSON.stringify(s), '->', JSON.stringify(out.trim()));
}
