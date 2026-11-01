import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

items = []
for m in re.finditer(r'\{\s*(?:["\']?id["\']?)\s*:\s*["\']([^"\']+)["\'](?P<content>.*?)\n\s*\}', text, re.DOTALL):
    iid = m.group(1)
    content = m.group('content')
    m_name = re.search(r'(?:["\']?name["\']?)\s*:\s*["\']([^"\']+)["\']', content)
    m_cat = re.search(r'(?:["\']?category["\']?)\s*:\s*["\']([^"\']+)["\']', content)
    m_brands = re.search(r'(?:["\']?popularBrands["\']?)\s*:\s*(\[[^\]]*\])', content)
    name = m_name.group(1) if m_name else ''
    cat = m_cat.group(1) if m_cat else ''
    brands = []
    if m_brands:
        try:
            brands = json.loads(m_brands.group(1))
        except:
            brands = re.findall(r'["\']([^"\']+)["\']', m_brands.group(1))
    items.append((iid, name, cat, brands))

print(f'Total items parsed: {len(items)}')

flagged = []
for iid, name, cat, brands in items:
    if cat == 'insecticide':
        is_generic = False
        for b in brands:
            if any(w in b for w in [' Duo', ' Super', ' Plus', 'Standard', 'Refill', 'Unit', 'Discipline', '18.5% SC']):
                is_generic = True
        if is_generic or len(brands) == 0:
            flagged.append((iid, name, brands))

print(f'Flagged items with potentially generic or synthetic brands: {len(flagged)}')

with open('scratch/flagged_brands.txt', 'w', encoding='utf-8') as f:
    for f_item in flagged:
        f.write(f'{f_item[0]}\t{f_item[1]}\t{json.dumps(f_item[2])}\n')

print('Saved scratch/flagged_brands.txt')
