import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_pos = text.find('=\n[')
if start_pos == -1:
    start_pos = text.find('= [')
start_pos = text.find('[', start_pos)
end_pos = text.rfind(']') + 1

items = json.loads(text[start_pos:end_pos])

mismatched = []
hardcoded_str = "1.5 - 2.0 ml / gm per Litre water"

for item in items:
    if item.get('category') != 'insecticide':
        continue
    dose_l = item.get('dosagePerLitre', '')
    claims = item.get('cibrcApprovedClaims', [])
    if hardcoded_str in dose_l and claims:
        mismatched.append((item['id'], item['name'], item['dosagePerAcre'], dose_l))

print(f"Total items with hardcoded '{hardcoded_str}' despite having CIB-RC claims: {len(mismatched)}")
for m in mismatched[:25]:
    print(f"  {m[0]}: {m[1]} -> Acre: {m[2]} | Litre: {m[3]}")
