import json
import re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    agro_ts = f.read()

# Parse all items in agrochemicalsData.ts
# Each item starts with { and has "id": "...", "name": "...", "popularBrands": [...]
item_blocks = re.split(r'\n  \{', agro_ts)
print(f"Total blocks split: {len(item_blocks)}")

agro_dict = {}
for block in item_blocks:
    id_m = re.search(r'"id":\s*"([^"]+)"', block)
    name_m = re.search(r'"name":\s*"([^"]+)"', block)
    if id_m and name_m:
        cid = id_m.group(1)
        name = name_m.group(1)
        brands_m = re.search(r'"popularBrands":\s*\[([^\]]*)\]', block)
        brands = []
        if brands_m:
            brands = [b.strip().strip('"').strip("'") for b in brands_m.group(1).split(',') if b.strip().strip('"').strip("'")]
        agro_dict[cid] = {
            'id': cid,
            'name': name,
            'popularBrands': brands
        }

print(f"Parsed {len(agro_dict)} chemicals from agrochemicalsData.ts")

# Print some mixture names in agro_dict to see how they are named
print("\nSample items in agro_dict:")
for cid, d in list(agro_dict.items())[:30]:
    print(f"  {cid} -> {d['name']}")
