import json
import re

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    cp = json.load(f)

meta = cp['metadata']

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    agro_ts = f.read()

# Extract all chemical entries from agrochemicalsData.ts
agro_items = []
pattern = re.compile(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)",\s*"nameTe":\s*"([^"]+)",\s*"category":\s*"([^"]+)"')
for m in pattern.finditer(agro_ts):
    agro_items.append({
        'id': m.group(1),
        'name': m.group(2),
        'nameTe': m.group(3),
        'category': m.group(4)
    })

print(f"Total agro items: {len(agro_items)}")

# Let's inspect all 145 unique insecticides in cropPestData.json
print("\n--- ALL 145 INSECTICIDES IN CROP PEST DATA ---")
for k, v in sorted(meta.items(), key=lambda x: x[1]['insecticide']):
    print(f"{k} | {v['insecticide']}")
