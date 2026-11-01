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

sample_calc = []
for item in items:
    claims = item.get('cibrcApprovedClaims', [])
    if not claims:
        continue
    for c in claims[:1]: # first claim
        f_dose = str(c.get('formulationDosePerHa', ''))
        water = str(c.get('dilutionWaterPerHa', ''))
        calc_acre = str(c.get('calculatedDosePerAcre', ''))
        curr_l = item.get('dosagePerLitre', '')
        sample_calc.append((item['name'], f_dose, water, calc_acre, curr_l))

print(f"Total checked: {len(sample_calc)}")
for sc in sample_calc[:25]:
    print(f"{sc[0]} -> FormDose: '{sc[1]}' | Water: '{sc[2]}' | Acre: '{sc[3]}' | CurrL: '{sc[4]}'")
