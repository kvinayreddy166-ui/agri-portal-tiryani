import json
import re
from test_refined_dosage import compute_accurate_dose

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

flagged = []
for idx, r in enumerate(rows):
    a_dose, p_dose = compute_accurate_dose(r['formulationDose'], r['sprayFluid'], r['insecticide'])
    if '0 g' in a_dose or '0 ml' in a_dose or '0.0 ' in p_dose:
        flagged.append((idx, r, a_dose, p_dose))

print(f"Total flagged zero doses: {len(flagged)} out of {len(rows)}")
for idx, r, a_dose, p_dose in flagged:
    print(f"Row {idx:3d} [{r['crop']}] {r['insecticide']} (Page {r['page']})")
    print(f"   PDF Form: '{r['formulationDose']}', Fluid: '{r['sprayFluid']}'")
    print(f"   Computed: Acre='{a_dose}', Pump='{p_dose}'")
