import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'\{\s*"id":\s*"([^"]+)",\s*\n\s*"name":\s*"([^"]+)"(.*?)\n  \},', re.DOTALL)

flagged_fallback = []
flagged_locust = []

for m in pattern.finditer(text):
    item_id = m.group(1)
    name = m.group(2)
    body = m.group(0)
    
    crops_m = re.search(r'"targetCrops":\s*(\[[^\]]*\])', body)
    pests_m = re.search(r'"targetPests":\s*(\[[^\]]*\])', body)
    crops_str = crops_m.group(1) if crops_m else ""
    pests_str = pests_m.group(1) if pests_m else ""
    
    if "Sucking pests (Aphids" in pests_str or "Caterpillars (Spodoptera" in pests_str:
        flagged_fallback.append((item_id, name))
    if "Sr. No." in crops_str or "Chlorpyriphos 20" in pests_str:
        flagged_locust.append((item_id, name))

print(f"Total items with legacy generic 'Sucking pests / Caterpillars' fallback: {len(flagged_fallback)}")
for item_id, name in flagged_fallback:
    print(f"  - {item_id}: {name}")

print(f"\nTotal items with FAO Locust page 108 mismatch: {len(flagged_locust)}")
for item_id, name in flagged_locust:
    print(f"  - {item_id}: {name}")
