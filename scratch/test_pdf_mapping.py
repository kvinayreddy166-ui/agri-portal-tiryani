import json
import re

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    cp = json.load(f)

meta = cp['metadata']

from parse_pdf_insecticides import pdf_raw_data

lines = [l.strip() for l in pdf_raw_data.strip().split('\n') if l.strip()]

pdf_items = []
for line in lines:
    m = re.match(r'^(\d+)\.\s*(.*?)\s*\|\s*(.*)$', line)
    if m:
        num = int(m.group(1))
        tech = m.group(2).strip()
        brands_raw = m.group(3).strip()
        # Parse brands
        # Split by comma, but be careful with commas inside parens if any
        parts = [p.strip() for p in brands_raw.split(',') if p.strip()]
        pdf_items.append({
            'num': num,
            'technical': tech,
            'brands': parts
        })

print(f"Total parsed PDF items: {len(pdf_items)}")

# Normalizer for chemical names
def normalize_name(s):
    s = s.lower()
    s = s.replace('%', ' ')
    s = s.replace('+', ' ')
    s = s.replace('/', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

meta_by_norm = {}
for k, v in meta.items():
    name = v.get('insecticide', '')
    meta_by_norm[normalize_name(name)] = (k, v)

# Check matches
matched = 0
unmatched_pdf = []
for item in pdf_items:
    norm = normalize_name(item['technical'])
    if norm in meta_by_norm:
        matched += 1
    else:
        # Try fuzzy or partial
        found = False
        for m_norm, (k, v) in meta_by_norm.items():
            # If all tokens in norm are in m_norm
            t_tokens = set(norm.split())
            m_tokens = set(m_norm.split())
            if t_tokens == m_tokens:
                found = True
                matched += 1
                break
        if not found:
            unmatched_pdf.append(item)

print(f"Direct/exact matches with cropPestData metadata: {matched} / {len(pdf_items)}")
print("Unmatched PDF items:")
for u in unmatched_pdf:
    print(f"  #{u['num']} {u['technical']}")
