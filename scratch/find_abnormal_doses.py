import json
import re

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

abnormal = []
for r in data['rows']:
    acre = r['calculatedDosePerAcre']
    pump = r['calculatedDosePerPump']
    form = r['formulationDosePerHa']
    
    if re.search(r'\b0\s*(g|ml|kg)', acre) or '0–0' in acre or '0-0' in acre or '0.0' in pump:
        abnormal.append(r)

print(f"Total abnormal / zero doses: {len(abnormal)} out of {len(data['rows'])}")
for r in abnormal:
    print(f"[{r['crop']}] {r['metaKey']} (Page {r['cibrcPage']})")
    print(f"   Raw Form: '{r['formulationDosePerHa']}', Fluid: '{r['sprayFluidPerHa']}'")
    print(f"   Calculated Acre: '{r['calculatedDosePerAcre']}', Pump: '{r['calculatedDosePerPump']}'")
