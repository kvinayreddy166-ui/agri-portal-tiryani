import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

crops = set()
pests = set()
claims_count = 0

for k, v in gold_standard.items():
    for c in v['claims']:
        claims_count += 1
        if c['crop']:
            crops.add(c['crop'].strip())
        if c['pest']:
            pests.add(c['pest'].strip())

print(f"Total claims in gold standard: {claims_count}")
print(f"Total distinct crops: {len(crops)}")
print(f"Total distinct pests: {len(pests)}")
print("\nSample crops (first 25):")
for cp in sorted(list(crops))[:25]:
    print("  -", cp)
