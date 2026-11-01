import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\{\s*["\']?id["\']?\s*:\s*[\'"]([^\'"]+)[\'"](.*?)\n\s*\},', re.DOTALL)
matches = list(pattern.finditer(content))

brands_data = []

for m in matches:
    block = m.group(0)
    if not ('"category": "insecticide"' in block or "category: 'insecticide'" in block):
        continue
    name_m = re.search(r'["\']?name["\']?\s*:\s*[\'"]([^\'"]+)[\'"]', block)
    brands_m = re.search(r'["\']?popularBrands["\']?\s*:\s*\[(.*?)\]', block, re.DOTALL)
    if name_m:
        name = name_m.group(1)
        brands = []
        if brands_m:
            raw_b = brands_m.group(1)
            brands = [b.strip().strip('"\'') for b in raw_b.split(',') if b.strip().strip('"\'')]
        brands_data.append((name, brands))

print(f"Total insecticides: {len(brands_data)}")
empty_brands = [b for b in brands_data if len(b[1]) == 0]
print(f"Insecticides with empty brands: {len(empty_brands)}")
non_empty = [b for b in brands_data if len(b[1]) > 0]
print(f"Insecticides with brands: {len(non_empty)}")

# Let's inspect some of the brands
print("\nSample first 25 insecticides and their brands:")
for name, b_list in brands_data[:25]:
    print(f"  {name}: {b_list}")
