import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Search in agrochemicalsData.ts
with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "r", encoding="utf-8") as f:
    agro_ts = f.read()

print("Agro occurrences of 'Lancer Gold':")
for m in re.finditer(r'(\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"[^\}]+"popularBrands":\s*(\[[^\]]*\]))', agro_ts):
    if 'lancer gold' in m.group(4).lower():
        print(f"  id: {m.group(2)} ({m.group(3)})")
        print(f"     brands: {m.group(4)}")

print("\nAgro occurrences of 'tolfenpyrad':")
for m in re.finditer(r'(\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"[^\}]+"popularBrands":\s*(\[[^\]]*\]))', agro_ts):
    if 'tolfenpyrad' in m.group(2).lower() or 'tolfenpyrad' in m.group(3).lower():
        print(f"  id: {m.group(2)} ({m.group(3)})")
        print(f"     brands: {m.group(4)}")

# 2. Search in cropPestData.json
with open("project/src/features/agrochemicals/data/cropPestData.json", "r", encoding="utf-8") as f:
    cp = json.load(f)

print("\nMeta occurrences of 'Lancer Gold':")
for k, v in cp["metadata"].items():
    if any('lancer gold' in str(b).lower() for b in v.get('popularBrands', [])):
        print(f"  key: {k}, brands: {v.get('popularBrands')}")

print("\nMeta occurrences of 'tolfenpyrad':")
for k, v in cp["metadata"].items():
    if 'tolfenpyrad' in k.lower():
        print(f"  key: {k}, brands: {v.get('popularBrands')}")
