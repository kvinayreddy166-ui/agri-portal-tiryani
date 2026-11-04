import json

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for r in data['rows']:
    if r['crop'] == 'Cotton' and 'azadirachtin' in r['metaKey']:
        print(f"{r['metaKey']:30s} | Form/ha: {r['formulationDosePerHa']:12s} | Acre: {r['calculatedDosePerAcre']:18s} | Pump: {r['calculatedDosePerPump']}")
