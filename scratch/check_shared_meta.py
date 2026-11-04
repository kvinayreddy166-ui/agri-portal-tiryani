import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("project/src/features/agrochemicals/data/cropPestData.json", encoding="utf-8") as f:
    crop_pest = json.load(f)
meta = crop_pest["metadata"]

from test_merged_brands import agro_brands_map, meta_brands_map

unmapped_meta_keys = []
for mid in meta.keys():
    if mid not in meta_brands_map and mid in agro_brands_map:
        unmapped_meta_keys.append(mid)

print("Meta keys that exist in agro_brands_map but not in meta_brands_map:", unmapped_meta_keys)
