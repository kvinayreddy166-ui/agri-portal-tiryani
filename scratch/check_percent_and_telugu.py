import json

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

meta = data['metadata']
rows = data['rows']

print("=== INSECTICIDE NAMES WITHOUT % ===")
no_percent = []
for k, v in sorted(meta.items()):
    name = v.get('insecticide', '')
    name_te = v.get('insecticideTe', '')
    if '%' not in name:
        no_percent.append((k, name, name_te))

print(f"Total without %: {len(no_percent)} out of {len(meta)}")
for k, name, name_te in no_percent[:30]:
    print(f"  {k} -> {name} | {name_te.encode('ascii', 'backslashreplace').decode('ascii')}")
