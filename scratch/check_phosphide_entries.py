import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'\{\s*"id":\s*"([^"]+)",\s*\n\s*"name":\s*"([^"]+)"(.*?)\n  \},', re.DOTALL)
for m in pattern.finditer(text):
    item_id = m.group(1)
    name = m.group(2)
    body = m.group(0)
    if 'phosphide' in name.lower() or 'phosphide' in item_id.lower():
        print(f"ID: {item_id}")
        print(f"Name: {name}")
        crops_m = re.search(r'"targetCrops":\s*(\[[^\]]*\])', body)
        pests_m = re.search(r'"targetPests":\s*(\[[^\]]*\])', body)
        dose_m = re.search(r'"dosagePerAcre":\s*"([^"]*)"', body)
        print("  targetCrops:", crops_m.group(1) if crops_m else "N/A")
        print("  targetPests:", pests_m.group(1) if pests_m else "N/A")
        print("  dosagePerAcre:", dose_m.group(1) if dose_m else "N/A")
        print("-" * 60)
