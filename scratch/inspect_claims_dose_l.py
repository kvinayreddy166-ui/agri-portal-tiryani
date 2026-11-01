import json
import re
import sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_pos = text.find('=\n[')
if start_pos == -1:
    start_pos = text.find('= [')
start_pos = text.find('[', start_pos)
end_pos = text.rfind(']') + 1

items = json.loads(text[start_pos:end_pos])

claims_dose_l = Counter()
for item in items:
    if item.get('cibrcApprovedClaims'):
        claims_dose_l[item.get('dosagePerLitre', '')] += 1

print("Dose/Litre distribution for items WITH CIB-RC claims:")
for k, v in claims_dose_l.most_common(20):
    print(f"  {v}x: '{k}'")
