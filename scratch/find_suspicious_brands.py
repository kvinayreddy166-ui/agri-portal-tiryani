import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\{\s*["\']?id["\']?\s*:\s*[\'"]([^\'"]+)[\'"](.*?)\n\s*\},', re.DOTALL)
matches = list(pattern.finditer(content))

flagged = []
all_brands_count = 0

suspicious_terms = [
    'cib-rc', 'approved', 'generic', 'placeholder', 'confidor sp', 'pride wg',
    'bifam', 'chem-pest', 'silo granules', 'bulk gr', 'burrow fumigant',
    'super df', 'super ec', 'plus ec', 'combo', 'mixture', 'formulation'
]

for m in matches:
    block = m.group(0)
    if not ('"category": "insecticide"' in block or "category: 'insecticide'" in block):
        continue
    name_m = re.search(r'["\']?name["\']?\s*:\s*[\'"]([^\'"]+)[\'"]', block)
    brands_m = re.search(r'["\']?popularBrands["\']?\s*:\s*\[(.*?)\]', block, re.DOTALL)
    if not name_m or not brands_m:
        continue
    name = name_m.group(1)
    raw_b = brands_m.group(1)
    brands = [b.strip().strip('"\'') for b in raw_b.split(',') if b.strip().strip('"\'')]
    all_brands_count += len(brands)
    
    susp = []
    for b in brands:
        lower_b = b.lower()
        if any(term in lower_b for term in suspicious_terms):
            susp.append(b)
        elif '(' in b and ')' in b:
            # check if manufacturer is made up or generic
            inner = b[b.find('(')+1:b.find(')')].lower()
            if any(x in inner for x in ['generic', 'various', 'local', 'chem-pest', 'chem']):
                susp.append(b)
    if susp:
        flagged.append((name, brands, susp))

print(f"Total brands checked: {all_brands_count}")
print(f"Total items with suspicious brand strings: {len(flagged)}")
for name, brands, susp in flagged[:30]:
    print(f"Item: {name}")
    print(f"   All brands: {brands}")
    print(f"   Suspicious: {susp}")
