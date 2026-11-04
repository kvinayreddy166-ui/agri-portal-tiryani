import json
from exact_mapping_def import EXACT_MAPPING

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    cp = json.load(f)

meta = cp['metadata']

mapped_keys = set()
for num, (mk, aid) in EXACT_MAPPING.items():
    if mk:
        mapped_keys.add(mk)

unmapped_meta = []
for k, v in sorted(meta.items()):
    if k not in mapped_keys:
        unmapped_meta.append((k, v['insecticide']))

print(f"Total metadata keys: {len(meta)}")
print(f"Directly mapped from PDF: {len(mapped_keys)}")
print(f"Unmapped metadata keys: {len(unmapped_meta)}")
print("\nUnmapped metadata keys:")
for k, name in unmapped_meta:
    print(f"  {k:<35} | {name}")
