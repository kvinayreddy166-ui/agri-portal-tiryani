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

has_claims = 0
no_claims = 0
for item in items:
    claims = item.get('cibrcApprovedClaims', [])
    dose_l = item.get('dosagePerLitre', '')
    if claims:
        has_claims += 1
    else:
        no_claims += 1

print(f"Items with CIB-RC claims: {has_claims}")
print(f"Items without CIB-RC claims: {no_claims}")
