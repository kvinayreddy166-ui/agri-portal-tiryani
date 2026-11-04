import json
import re

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

from authoritative_insecticide_map import INSECTICIDE_MAP

print(f"Total metadata items in data: {len(data['metadata'])}")
print(f"Total items in map: {len(INSECTICIDE_MAP)}")

# Check any keys missing from INSECTICIDE_MAP
missing_keys = set(data['metadata'].keys()) - set(INSECTICIDE_MAP.keys())
print("Missing keys from map:", missing_keys)
