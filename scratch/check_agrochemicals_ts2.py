import json
import re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Match "name": "..."
names = re.findall(r'"name":\s*"([^"]+)"', text)
print(f"Total names in agrochemicalsData.ts: {len(names)}")

no_pct = []
for n in names:
    # If it contains digits like 10 EC, 18.5 SC, etc. without %
    if re.search(r'\d+\s*(?:EC|SC|SL|WP|SP|SG|WG|GR|FS|OD|CS|DP|WDG)', n, re.I) and '%' not in n:
        no_pct.append(n)

print(f"Items missing % in agrochemicalsData.ts: {len(no_pct)}")
for n in no_pct:
    print(" ", n)
