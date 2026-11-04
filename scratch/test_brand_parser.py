import json
import re

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    cp = json.load(f)

meta = cp['metadata']

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    agro_ts = f.read()

# Let's inspect the 112 PDF items
from parse_pdf_insecticides import pdf_raw_data

lines = [l.strip() for l in pdf_raw_data.strip().split('\n') if l.strip()]

pdf_items = []
for line in lines:
    m = re.match(r'^(\d+)\.\s*(.*?)\s*\|\s*(.*)$', line)
    if m:
        num = int(m.group(1))
        tech = m.group(2).strip()
        brands_raw = m.group(3).strip()
        
        # Parse brands properly
        # Handle cases like "Tagcis 100 – 11% EC (Tropical)" or "Dartriz 50SP & Woktap 50SP (BioStadt)"
        raw_parts = [p.strip() for p in brands_raw.split(',') if p.strip()]
        cleaned_brands = []
        for p in raw_parts:
            # remove stray trailing punctuation or empty dots
            p = re.sub(r'^[.\s]+', '', p)
            p = re.sub(r'[.\s]+$', '', p)
            if p and p not in cleaned_brands and p != '……':
                cleaned_brands.append(p)
        
        pdf_items.append({
            'num': num,
            'technical': tech,
            'brands': cleaned_brands
        })

print(f"Total parsed PDF items: {len(pdf_items)}")
for it in pdf_items[:5]:
    print(f"#{it['num']} {it['technical']}: {len(it['brands'])} brands -> {it['brands'][:3]}")
