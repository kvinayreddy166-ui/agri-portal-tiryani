const fs = require('fs');
const sql = fs.readFileSync('G:/agri-portal-tiryani/supabase/migrations/20261124000000_strip_decorated_place_names.sql', 'utf8');
const wherePart = sql.match(/WHERE ([\s\S]+);/)[1];
const wherePats = [...wherePart.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
console.log('where patterns:', wherePats.length, wherePats.map((p) => p.slice(0, 50)));
const samples = [
  'Door No.3-17/1, Shivalayam Road, Opp Flour Mill,  Jagdevpur (V) (M), Siddipet District - 502281',
  '1-58/a/1, Main Road, Tiryani, Kumurambheem Asifabad',
  'H.No. 12-3/4, Station Road',
  'D.No. 5-21/3, Market Road, Tiryani - 502281',
  'Shop No 4, Gandhi Nagar, Hyderabad',
  'Main Road, Near Bus Stand, Bheemini',
  'D.No.1-1, Ameerpet, Hyderabad - 500016',
];
for (const s of samples) {
  const w = wherePats.some((p) => new RegExp(p, 'i').test(s));
  console.log('WHERE=' + w, '|', JSON.stringify(s));
}
