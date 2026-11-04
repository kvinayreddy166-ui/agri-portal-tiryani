import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Check cropPestData.json
with open("project/src/features/agrochemicals/data/cropPestData.json", "r", encoding="utf-8") as f:
    cp = json.load(f)

print("Checking cropPestData.json popularBrands...")
suspicious_meta = []
for k, v in cp["metadata"].items():
    for b in v.get("popularBrands", []):
        if any(w in b.lower() for w in ['crop', 'termite', 'insecticide', 'synthetic', 'group', 'belong', 'stomach', 'action', 'building', 'animal']):
            suspicious_meta.append((k, b))

for s in suspicious_meta:
    print(f"Meta [{s[0]}]: {s[1]}")

# 2. Check agrochemicalsData.ts
with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "r", encoding="utf-8") as f:
    agro_ts = f.read()

print("\nChecking agrochemicalsData.ts popularBrands...")
suspicious_agro = []
for m in re.finditer(r'\{\s*"id":\s*"([^"]+)"[^\}]+"popularBrands":\s*(\[[^\]]*\])', agro_ts):
    aid = m.group(1)
    brands = json.loads(m.group(2))
    for b in brands:
        if any(w in b.lower() for w in ['termite', 'synthetic', 'belong', 'stomach', 'action', 'building', 'animal']):
            suspicious_agro.append((aid, b))

for s in suspicious_agro:
    print(f"Agro [{s[0]}]: {s[1]}")
