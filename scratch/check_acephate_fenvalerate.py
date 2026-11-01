import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Check in cibrc_gold_standard.json
with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold = json.load(f)

for k, v in gold.items():
    if 'acephate25' in k or ('acephate' in k and 'fenvalerate' in k):
        print("GOLD KEY:", k)
        print("TITLE:", v['raw_title'])
        print("PAGES:", v['pages'])
        for c in v['claims']:
            print("  CLAIM:", c)

# Check in agrochemicalsData.ts
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'\{\s*"id":\s*"[^"]*acephate[^"]*fenvalerate[^"]*".*?\n  \},', text, re.DOTALL)
if m:
    print("\nCURRENT AGROCHEMICALSDATA ENTRY:")
    print(m.group(0))
