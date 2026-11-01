import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\{\s*["\']?id["\']?\s*:\s*[\'"]([^\'"]+)[\'"](.*?)\n\s*\},', re.DOTALL)
matches = list(pattern.finditer(content))

all_brands = set()
for m in matches:
    block = m.group(0)
    brands_m = re.search(r'["\']?popularBrands["\']?\s*:\s*\[(.*?)\]', block, re.DOTALL)
    if brands_m:
        raw_b = brands_m.group(1)
        brands = [b.strip().strip('"\'') for b in raw_b.split(',') if b.strip().strip('"\'')]
        for b in brands:
            all_brands.add(b)

print(f"Total unique brands across entire database: {len(all_brands)}")
sorted_brands = sorted(list(all_brands))
print("Sample first 30 brands:")
for b in sorted_brands[:30]:
    print("  -", b)
