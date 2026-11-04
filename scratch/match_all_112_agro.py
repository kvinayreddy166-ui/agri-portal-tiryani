import json
import re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    agro_ts = f.read()

from parse_pdf_insecticides import pdf_raw_data

lines = [l.strip() for l in pdf_raw_data.strip().split('\n') if l.strip()]

pdf_items = []
for line in lines:
    m = re.match(r'^(\d+)\.\s*(.*?)\s*\|\s*(.*)$', line)
    if m:
        num = int(m.group(1))
        tech = m.group(2).strip()
        brands_raw = m.group(3).strip()
        parts = [p.strip() for p in brands_raw.split(',') if p.strip()]
        pdf_items.append({
            'num': num,
            'technical': tech,
            'brands': parts
        })

# Extract all items from agro_ts with id, name, popularBrands
items = []
item_pattern = re.compile(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"[^{}]*?"popularBrands":\s*\[([^\]]*)\]', re.DOTALL)
for m in item_pattern.finditer(agro_ts):
    brands_str = m.group(3)
    brands = [b.strip().strip('"').strip("'") for b in brands_str.split(',') if b.strip().strip('"').strip("'")]
    items.append({
        'id': m.group(1),
        'name': m.group(2),
        'popularBrands': brands
    })

print(f"Found {len(items)} items in agrochemicalsData.ts with popularBrands")

# Check matches with PDF items
for p in pdf_items:
    # Look for matching item in items
    matched = []
    p_clean = re.sub(r'[^a-zA-Z0-9]', '', p['technical'].lower())
    for it in items:
        it_clean = re.sub(r'[^a-zA-Z0-9]', '', it['name'].lower())
        if p_clean == it_clean or (p_clean in it_clean and len(p_clean) > 8):
            matched.append(it)
    # print
    print(f"PDF #{p['num']} {p['technical']} -> {[m['id'] + ' (' + m['name'] + ')' for m in matched]}")
