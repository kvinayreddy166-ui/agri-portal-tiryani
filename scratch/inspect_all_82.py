import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'\{\s*"id":\s*"([^"]+)",\s*\n\s*"name":\s*"([^"]+)"(.*?)\n  \},', re.DOTALL)

items_to_audit = []

for m in pattern.finditer(text):
    item_id = m.group(1)
    name = m.group(2)
    body = m.group(0)
    
    crops_m = re.search(r'"targetCrops":\s*(\[[^\]]*\])', body)
    pests_m = re.search(r'"targetPests":\s*(\[[^\]]*\])', body)
    crops_str = crops_m.group(1) if crops_m else ""
    pests_str = pests_m.group(1) if pests_m else ""
    
    if "Sucking pests (Aphids" in pests_str or "Caterpillars (Spodoptera" in pests_str or "Sr. No." in crops_str:
        items_to_audit.append((item_id, name))

print(f"Total items needing accurate correction: {len(items_to_audit)}")
for i, (item_id, name) in enumerate(items_to_audit):
    print(f"{i+1}. {item_id}: {name}")
