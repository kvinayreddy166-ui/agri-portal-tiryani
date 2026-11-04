import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("project/src/features/agrochemicals/data/cropPestData.json", encoding="utf-8") as f:
    crop_pest = json.load(f)
meta = crop_pest["metadata"]

from test_merged_brands import agro_brands_map, meta_brands_map

# Combine meta_brands_map with exact matches from agro_brands_map
combined_meta = dict(meta_brands_map)
for mid in meta.keys():
    if mid in agro_brands_map and mid not in combined_meta:
        combined_meta[mid] = agro_brands_map[mid]

print(f"Total meta keys after direct matching: {len(combined_meta)}")

# Now check remaining unmapped meta keys to see if any correspond to agro items
unmapped_meta = [k for k in meta.keys() if k not in combined_meta]
print(f"Remaining unmapped meta keys: {len(unmapped_meta)}")

for mid in unmapped_meta:
    # check if mid words match any agro_brands_map key
    parts = mid.split('-')
    chem_part = parts[0]
    matched_agro = [ak for ak in agro_brands_map.keys() if chem_part in ak]
    if matched_agro:
        print(f"Unmapped meta: '{mid}' -> possible agro matches: {matched_agro}")
