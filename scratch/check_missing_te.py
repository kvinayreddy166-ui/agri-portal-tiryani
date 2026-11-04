import json

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

meta = data['metadata']

missing_te = []
for k, v in sorted(meta.items()):
    name = v.get('insecticide', '')
    name_te = v.get('insecticideTe', '')
    # Check if name_te is identical to name or purely ASCII (meaning no Telugu letters)
    is_ascii = all(ord(c) < 128 for c in name_te)
    if is_ascii or name == name_te:
        missing_te.append((k, name, name_te))

print(f"Total insecticides with missing Telugu: {len(missing_te)} out of {len(meta)}")
for k, name, name_te in missing_te:
    print(f"  {k} -> {name}")
