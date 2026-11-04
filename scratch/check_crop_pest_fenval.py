import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("project/src/features/agrochemicals/data/cropPestData.json", "r", encoding="utf-8") as f:
    cp = json.load(f)

for k, v in cp["metadata"].items():
    if 'fenvalerate' in k.lower():
        print(f"Meta Key: {k} -> Brands: {v.get('popularBrands')}")

for r in cp["rows"]:
    if 'fenvalerate' in str(r.get('insecticide', '')).lower() or 'fenvalerate' in str(r.get('tradeName', '')).lower():
        print(f"Row: {r.get('crop')} | {r.get('pest')} | {r.get('insecticide')}")
