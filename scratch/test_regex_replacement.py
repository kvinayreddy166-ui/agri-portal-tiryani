import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", encoding="utf-8") as f:
    text = f.read()

from test_merged_brands import agro_brands_map

found = 0
not_found = []
for aid in agro_brands_map.keys():
    pattern = re.compile(r'(\{\s*"id":\s*"' + re.escape(aid) + r'",.*?"popularBrands":\s*)\[[^\]]*\]', re.DOTALL)
    m = pattern.search(text)
    if m:
        found += 1
    else:
        not_found.append(aid)

print(f"Total agro IDs in map: {len(agro_brands_map)}")
print(f"Found via regex: {found}")
print(f"Not found: {not_found}")
